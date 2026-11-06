"""Measures the onboarding's base body meshes, so each body type comes with its own measurements.

The six meshes in public/meshes are Anny bodies (anny 0.5, anny.Anny(all_phenotypes=True,
local_changes="default", remove_unattached_vertices=True)) with every phenotype at 0.5 except:
    gender  1.0 female / 0.0 male
    weight  0.0 slim / 0.5 average / 1.0 fuller
This regenerates each one from those values, checks it matches the mesh in the folder, and takes the
measurements the mesh viewer (SMPL-Anthropometry) uses, plus underbust. Circumferences are taken round
the convex hull of a cross-section, as a tape measure would (it bridges hollows, e.g. between the breasts).
Limbs are cut at right angles to their bone in Anny's skeleton, the torso and legs horizontally.
    height, waist, weight   Anny's own anthropometry (official waist vertex ring; mass from volume)
    bust (chest), hips      widest torso circumference in the chest (below the armpits) and the seat
    underbust               narrowest just below the bust (female)
    inside leg              crotch (where the torso cross-section splits into the legs) to the floor
    head                    widest round the head, from the eyes up
    neck                    narrowest round the neck
    shoulder breadth        straight across, shoulder tip to shoulder tip (the corner of each shoulder)
    arm length              shoulder tip to elbow to wrist (the upper arm and lower arm below, together)
    upper arm, lower arm    shoulder tip to the elbow joint; elbow joint to the wrist joint
    upper leg, lower leg    hip joint to the knee joint; knee joint to the ankle joint
    nape to waist           height of the back of the neck (where the neck meets the shoulders) above
                            the natural waist (Anny's waist ring)
    upper arm               halfway from shoulder to elbow
    forearm                 widest, elbow half of the forearm
    wrist                   narrowest, just above the hand
    shoulder to crotch      height of the shoulder tip above the crotch
    thigh                   widest just below the crotch
    calf                    widest between knee and ankle
    ankle                   narrowest above the ankle joint
The lengths are the scan's own (gemini_client.Measurements), so a scan's numbers replace them directly.
Writes src/lib/base-bodies.json, read by the questionnaire. Needs anny==0.5 (torch, warp-lang), trimesh
and scipy; the six OBJs are the ones the GLBs in public/meshes were converted from.

    python scripts/measure_base_bodies.py <folder with the base OBJs> <output json>
"""
import json
import sys

import numpy as np
import torch
import trimesh
from scipy.spatial import ConvexHull

import anny
from anny.anthropometry import Anthropometry

SHAPES = {"slim": 0.0, "average": 0.5, "fuller": 1.0}
SEXES = {"female": 1.0, "male": 0.0}
UP = np.array([0.0, 0.0, 1.0])


def tape(xy: np.ndarray) -> float:
    """Circumference round the convex hull of a cross-section (2D points), as a tape measure takes it"""
    hull = xy[ConvexHull(xy).vertices]
    return float(np.sum(np.linalg.norm(np.roll(hull, -1, axis=0) - hull, axis=1)))


def _inside(polygon: np.ndarray) -> bool:
    """Whether the plane's origin (0, 0) is inside this 2D loop"""
    x, y = polygon[:, 0], polygon[:, 1]
    xj, yj = np.roll(x, 1), np.roll(y, 1)
    crosses = ((y > 0) != (yj > 0)) & (0 < (xj - x) * (0 - y) / (yj - y + 1e-12) + x)
    return bool(crosses.sum() % 2)


def loop_around(mesh: trimesh.Trimesh, point: np.ndarray, normal: np.ndarray) -> np.ndarray | None:
    """The cross-section loop through the plane at point (with this normal) that goes round the point,
    as 2D points in that plane; None if there isn't one (e.g. the point is between the legs)"""
    normal = normal / np.linalg.norm(normal)
    section = mesh.section(plane_origin=point, plane_normal=normal)
    if section is None:
        return None
    u = np.cross(normal, UP)
    u = u / np.linalg.norm(u) if np.linalg.norm(u) > 1e-6 else np.array([1.0, 0.0, 0.0])
    w = np.cross(normal, u)
    for loop in section.discrete:
        xy = np.c_[(loop - point) @ u, (loop - point) @ w]
        if len(xy) > 8 and _inside(xy):
            return xy
    return None


def along_bone(mesh, a, b, lo, hi, n=40) -> list[float]:
    """Tape circumferences of the limb round the bone a→b, cut at right angles to it, from lo to hi
    (fractions of the way from a to b)"""
    out = []
    for f in np.linspace(lo, hi, n):
        xy = loop_around(mesh, a + f * (b - a), b - a)
        if xy is not None:
            out.append(tape(xy))
    return out


def torso_loop(mesh: trimesh.Trimesh, z: float) -> np.ndarray | None:
    """The horizontal cross-section loop that crosses the body's centre line at height z (x, y points),
    or None where there isn't one: below the crotch the legs are two loops, and arms never cross it."""
    section = mesh.section(plane_origin=[0, 0, z], plane_normal=UP)
    if section is None:
        return None
    loops = [loop[:, :2] for loop in section.discrete if loop[:, 0].min() < 0 < loop[:, 0].max()]
    return max(loops, key=len) if loops else None


def scan(mesh, z0, height, lo, hi, step=0.002):
    """(height fraction, tape circumference, width) for each torso slice between lo and hi"""
    out = []
    for f in np.arange(lo, hi, step):
        xy = torso_loop(mesh, z0 + f * height)
        if xy is not None:
            out.append((f, tape(xy), float(xy[:, 0].max() - xy[:, 0].min())))
    return out


def shoulder_tip(v: np.ndarray, joint: np.ndarray, side: int) -> np.ndarray:
    """The corner of the shoulder (about the acromion): of the skin round the shoulder joint, on the arm
    side of it, the point furthest up and out, 35 degrees from vertical. side: +1 left (x > 0), -1 right."""
    near = ((np.abs(v[:, 1] - joint[1]) < 0.04) & (np.linalg.norm(v - joint, axis=1) < 0.08)
            & (side * (v[:, 0] - joint[0]) > 0))
    direction = np.array([side * np.sin(np.radians(35)), 0.0, np.cos(np.radians(35))])
    return v[near][np.argmax((v[near] - joint) @ direction)]


def measure(model, anthro, faces, out) -> dict[str, float]:
    """All the measurements of one body, in metres (weight in kg)"""
    v = out["rest_vertices"][0].detach().numpy()   # the skeleton is in rest space (the posed copy is shifted)
    heads = out["rest_bone_heads"][0].detach().numpy()
    tails = out["rest_bone_tails"][0].detach().numpy()
    bone = {label: i for i, label in enumerate(model.bone_labels)}
    joint = lambda name: heads[bone[name]]
    a = anthro(out["rest_vertices"])
    mesh = trimesh.Trimesh(v, faces, process=False)
    z0, z1 = float(v[:, 2].min()), float(v[:, 2].max())
    h = z1 - z0
    m = {"height": float(a["height"][0]), "waist": float(a["waist_circumference"][0])}

    # Chest: ends at the armpits, where the arms join the torso's slice and its width suddenly jumps (by a
    # quarter or more from one slice to the next; the chest itself only widens gradually)
    upper = scan(mesh, z0, h, 0.60, 0.85)
    armpit_f = next((f for (_, _, before), (f, _, wid) in zip(upper, upper[1:]) if wid > 1.25 * before), 0.80)
    chest = [t for t in upper if 0.64 <= t[0] < armpit_f - 0.01]
    bust_f, m["bust"], _ = max(chest, key=lambda t: t[1])
    below_bust = [t for t in chest if bust_f - 0.07 <= t[0] < bust_f - 0.01]
    if below_bust:
        m["underbust"] = min(below_bust, key=lambda t: t[1])[1]
    # Crotch: the lowest slice that's still one loop round the centre line
    low = scan(mesh, z0, h, 0.38, 0.60, step=0.001)
    crotch_f = min(t[0] for t in low)
    crotch_z = z0 + crotch_f * h
    m["inside_leg"] = float(crotch_f * h)
    # Hips: widest round the seat, from a little above the crotch (below it the tape would go round
    # both thighs together)
    m["hip"] = max(t[1] for t in low if crotch_f + 0.02 <= t[0] <= 0.58)

    # Head and neck
    m["head"] = max(along_bone(mesh, joint("head"), tails[bone["head"]], 0.3, 0.9))
    m["neck"] = min(along_bone(mesh, joint("neck01"), joint("head"), 0.1, 0.6))

    # Arms (the left one; the bodies are symmetric)
    shoulder, elbow, wrist = joint("upperarm01.L"), joint("lowerarm01.L"), joint("wrist.L")
    tip_l = shoulder_tip(v, shoulder, +1)
    tip_r = shoulder_tip(v, joint("upperarm01.R"), -1)
    m["shoulder_breadth"] = float(np.linalg.norm(tip_l - tip_r))
    m["upper_arm_length"] = float(np.linalg.norm(tip_l - elbow))
    m["lower_arm_length"] = float(np.linalg.norm(elbow - wrist))
    m["arm_length"] = m["upper_arm_length"] + m["lower_arm_length"]
    m["shoulder_to_crotch"] = float(tip_l[2] - crotch_z)
    m["bicep"] = along_bone(mesh, shoulder, elbow, 0.5, 0.5, n=1)[0]
    m["forearm"] = max(along_bone(mesh, elbow, wrist, 0.1, 0.6))
    m["wrist"] = min(along_bone(mesh, elbow, wrist, 0.85, 1.05))

    # Legs (the left one), cut horizontally round the point on the leg's bones at each height
    hip_j, knee, ankle = joint("upperleg01.L"), joint("lowerleg01.L"), joint("foot.L")

    def leg_at(z):
        top, bottom = (hip_j, knee) if z >= knee[2] else (knee, ankle)
        point = bottom + (top - bottom) * ((z - bottom[2]) / (top[2] - bottom[2]))
        xy = loop_around(mesh, point, UP)
        return tape(xy) if xy is not None else None

    def over(z_from, z_to, n=40):
        return [c for c in (leg_at(z) for z in np.linspace(z_from, z_to, n)) if c is not None]

    shin = knee[2] - ankle[2]
    m["upper_leg_length"] = float(np.linalg.norm(hip_j - knee))
    m["lower_leg_length"] = float(np.linalg.norm(knee - ankle))
    waist_z = float(v[anthro.waist_vertex_indices, 2].mean())
    m["nape_to_waist"] = float(joint("neck01")[2]) - waist_z
    m["thigh"] = max(over(crotch_z - 0.05, crotch_z - 0.01, n=20))
    m["calf"] = max(over(ankle[2] + 0.4 * shin, knee[2] - 0.1 * shin))
    m["ankle"] = min(over(ankle[2] + 0.03, ankle[2] + 0.35 * shin))
    m["weight_kg"] = float(a["mass"][0])
    return m


def main(mesh_dir: str, out_path: str) -> None:
    model = anny.Anny(all_phenotypes=True, local_changes="default", remove_unattached_vertices=True)
    model = model.to(dtype=torch.float32, device="cpu")
    anthro = Anthropometry(model)
    faces = model.get_triangular_faces().numpy()
    results = {}

    for sex, g in SEXES.items():
        for shape, w in SHAPES.items():
            pheno = {k: 0.5 for k in model.phenotype_labels} | {"gender": g, "weight": w}
            out = model(phenotype_kwargs={k: torch.tensor([v]) for k, v in pheno.items()})

            # The mesh in the folder must be this body, or the numbers belong to something else
            weight_name = {"slim": "min", "average": "average", "fuller": "max"}[shape]
            saved = trimesh.load(f"{mesh_dir}/{sex}_weight_{weight_name}.obj", process=False).vertices
            assert np.abs(saved - out["vertices"][0].detach().numpy()).max() < 1e-4, \
                f"{sex} {shape}: mesh doesn't match its phenotypes"

            m = measure(model, anthro, faces, out)
            if sex == "male":
                m.pop("underbust", None)
            entry = {k: (round(x, 1) if k == "weight_kg" else round(x * 100, 1)) for k, x in m.items()}
            results[f"{sex}_{shape}"] = entry
            print(f"{sex}_{shape}", entry)

    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
