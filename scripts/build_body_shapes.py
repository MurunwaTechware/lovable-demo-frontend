"""Adds Anny's measurement sliders to the base body meshes, so the twin editor can reshape a body live.

For each of the six base bodies (see measure_base_bodies.py for which Anny bodies they are) and each
slider below, this works out
    how every vertex moves with the slider fully up (+1) and fully down (-1), stored in the body's GLB
        as two glTF morph targets ("<slider>+" and "<slider>-"), sparse (only the vertices it moves)
    how much that changes each measurement, in cm, measured the same way as the base bodies (written to
        src/lib/body-shapes.json for the editor, which works out the slider settings for the user's numbers)
Anny's sliders are linear on each side of 0 and add up exactly (checked: under a thousandth of a mm
apart), so the base body plus the blended changes is exactly the body Anny makes with those settings
(apart from where it stands: the moves are taken in Anny's rest pose, so the body doesn't drift).

    python scripts/build_body_shapes.py <folder with the base OBJs> <public/meshes> <src/lib/body-shapes.json>

The backend builds each user's saved mesh from copies of the same files (its twin_shapes/ folder), so copy
the six GLBs, body-shapes.json and base-bodies.json there after running this. body-shapes.json's
"version" (a hash of them all) is what both sides compare, so a stale copy shows up instead of quietly
building a different body from what the editor showed.

    python scripts/build_body_shapes.py --version <public/meshes> <src/lib/body-shapes.json> <src/lib/base-bodies.json> [--write-version]
        works out the version again without rebuilding (e.g. to check a copy); --write-version stores it
"""
import hashlib
import json
import os
import struct
import sys

import numpy as np
import torch

import anny
from anny.anthropometry import Anthropometry

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import measure_base_bodies as mb  # noqa: E402  (next to this script)

# The editor's sliders: one per measurement Anny can change, each one or more of Anny's local changes
SLIDERS = {
    "bust": {"measure-bust-circ-incr": 1},
    "underbust": {"measure-underbust-circ-incr": 1},
    "waist": {"measure-waist-circ-incr": 1},
    "hip": {"measure-hips-circ-incr": 1},
    "neck": {"measure-neck-circ-incr": 1},
    "shoulder_breadth": {"measure-shoulder-dist-incr": 1},
    "bicep": {"measure-upperarm-circ-incr": 1},
    "forearm": {"l-lowerarm-fat-incr": 1, "r-lowerarm-fat-incr": 1},
    "wrist": {"measure-wrist-circ-incr": 1},
    "thigh": {"measure-thigh-circ-incr": 1},
    "calf": {"measure-calf-circ-incr": 1},
    "ankle": {"measure-ankle-circ-incr": 1},
    "head": {"head-scale-horiz-incr": 1, "head-scale-depth-incr": 1},
    "upper_arm_length": {"measure-upperarm-length-incr": 1},
    "lower_arm_length": {"measure-lowerarm-length-incr": 1},
    "upper_leg_length": {"measure-upperleg-height-incr": 1},
    "lower_leg_length": {"measure-lowerleg-height-incr": 1},
    "nape_to_waist": {"measure-napetowaist-dist-incr": 1},
    "waist_to_hip": {"measure-waisttohip-dist-incr": 1},
}
MOVED = 1e-5     # m: a vertex moving less than this (0.01 mm) isn't stored
# Moves are stored as 16-bit numbers for -1..1 m (glTF's KHR_mesh_quantization): 0.03 mm steps, at
# 10 bytes a vertex instead of 16. The biggest move is under 10 cm.
SHORT = 32767
CHANGED = 0.05   # cm: a measurement changing less than this isn't stored


def to_glb_frame(v: np.ndarray) -> np.ndarray:
    """Anny is Z-up; the GLBs are Y-up (x, z, -y). Moves (deltas) need no floor offset."""
    return np.c_[v[:, 0], v[:, 2], -v[:, 1]].astype("<f4")


def read_glb(path: str) -> tuple[dict, bytes]:
    data = open(path, "rb").read()
    json_len = struct.unpack("<I", data[12:16])[0]
    gltf = json.loads(data[20:20 + json_len])
    bin_start = 20 + json_len
    bin_len = struct.unpack("<I", data[bin_start:bin_start + 4])[0]
    return gltf, data[bin_start + 8:bin_start + 8 + bin_len]


def write_glb(path: str, gltf: dict, binary: bytes) -> None:
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    binary += b"\0" * (-len(binary) % 4)
    total = 12 + 8 + len(js) + 8 + len(binary)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(binary), 0x004E4942) + binary)


def add_targets(gltf: dict, binary: bytes, targets: list[tuple[str, np.ndarray]]) -> bytes:
    """Adds sparse POSITION morph targets (16-bit, see SHORT) to the GLB's one mesh. Any targets already
    there are replaced."""
    prim = gltf["meshes"][0]["primitives"][0]
    count = gltf["accessors"][prim["attributes"]["POSITION"]]["count"]
    prim["targets"], names = [], []
    out = bytearray(binary)

    def view(raw: bytes) -> int:
        out.extend(b"\0" * (-len(out) % 4))
        gltf["bufferViews"].append({"buffer": 0, "byteOffset": len(out), "byteLength": len(raw)})
        out.extend(raw)
        return len(gltf["bufferViews"]) - 1

    for name, delta in targets:
        moved = np.nonzero(np.linalg.norm(delta, axis=1) > MOVED)[0].astype("<u4")
        assert np.abs(delta).max() < 1, f"{name}: a move over 1 m doesn't fit the 16-bit range"
        quantized = np.round(delta[moved] * SHORT).astype("<i2")
        values = quantized.tobytes()   # sparse values are tightly packed (6 bytes a vertex)
        # min/max of the whole target in its stored (integer) form, the unmoved vertices' 0s included
        whole = np.vstack([quantized, np.zeros((1, 3), "<i2")]) if len(moved) < count else quantized
        gltf["accessors"].append({
            "componentType": 5122, "normalized": True, "type": "VEC3", "count": int(count),
            "min": whole.min(axis=0).astype(int).tolist(),
            "max": whole.max(axis=0).astype(int).tolist(),
            "sparse": {"count": int(len(moved)),
                       "indices": {"bufferView": view(moved.tobytes()), "componentType": 5125},
                       "values": {"bufferView": view(values)}},
        })
        prim["targets"].append({"POSITION": len(gltf["accessors"]) - 1})
        names.append(name)
    for key in ("extensionsUsed", "extensionsRequired"):
        gltf[key] = sorted(set(gltf.get(key, [])) | {"KHR_mesh_quantization"})
    gltf["meshes"][0]["weights"] = [0.0] * len(names)
    gltf["meshes"][0].setdefault("extras", {})["targetNames"] = names
    gltf["buffers"][0]["byteLength"] = len(out)
    return bytes(out)


def shapes_version(mesh_dir: str, effects: dict, base_bodies_path: str) -> str:
    """A short hash of everything a mesh is built from: the six GLBs, the effects and the base bodies'
    measurements. The same files give the same version on both sides."""
    h = hashlib.sha256()
    for sex in mb.SEXES:
        for shape in mb.SHAPES:
            h.update(open(f"{mesh_dir}/{sex}_{shape}.glb", "rb").read())
    h.update(json.dumps(effects, sort_keys=True).encode())
    h.update(json.dumps(json.load(open(base_bodies_path)), sort_keys=True).encode())
    return h.hexdigest()[:12]


def main(obj_dir: str, mesh_dir: str, out_path: str) -> None:
    model = anny.Anny(all_phenotypes=True, local_changes="default", remove_unattached_vertices=True)
    model = model.to(dtype=torch.float32, device="cpu")
    anthro = Anthropometry(model)
    faces = model.get_triangular_faces().numpy()
    shapes = {}

    for sex, g in mb.SEXES.items():
        for shape, w in mb.SHAPES.items():
            name = f"{sex}_{shape}"
            pheno = {k: torch.tensor([0.5]) for k in model.phenotype_labels}
            pheno |= {"gender": torch.tensor([g]), "weight": torch.tensor([w])}

            def run(changes: dict[str, float]):
                kwargs = {k: torch.tensor([v]) for k, v in changes.items()}
                return model(phenotype_kwargs=pheno, local_changes_kwargs=kwargs)

            base = run({})
            base_v = base["vertices"][0].detach().numpy()
            # The GLB must be this body (Y-up, standing on the floor), or the moves land on the wrong points
            gltf, binary = read_glb(f"{mesh_dir}/{name}.glb")
            acc = gltf["accessors"][gltf["meshes"][0]["primitives"][0]["attributes"]["POSITION"]]
            bv = gltf["bufferViews"][acc["bufferView"]]
            start = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
            glb_v = np.frombuffer(binary[start:start + acc["count"] * 12], dtype="<f4").reshape(-1, 3)
            offset = glb_v - to_glb_frame(base_v)
            assert np.abs(offset - offset.mean(axis=0)).max() < 1e-3, f"{name}: GLB isn't this body"  # 1 mm: OBJ rounding

            m0 = mb.measure(model, anthro, faces, base)
            targets, effects = [], {}
            for slider, changes in SLIDERS.items():
                for sign, label in ((1.0, "+"), (-1.0, "-")):
                    out = run({k: sign * v for k, v in changes.items()})
                    # In Anny's rest pose: the posed body also shifts as a whole when the hips or
                    # lengths change (its root moves), which would make every slider move every vertex
                    rest_move = out["rest_vertices"][0] - base["rest_vertices"][0]
                    delta = to_glb_frame(rest_move.detach().numpy())
                    targets.append((f"{slider}{label}", delta))
                    m = mb.measure(model, anthro, faces, out)
                    effects[f"{slider}{label}"] = {
                        k: round((m[k] - m0[k]) * 100, 2) for k in m0
                        # (underbust isn't found on every body: skipped where it isn't)
                        if k != "weight_kg" and k in m and abs(m[k] - m0[k]) * 100 >= CHANGED}
                    print(name, slider, label, effects[f"{slider}{label}"].get(slider), flush=True)

            binary = add_targets(gltf, binary, targets)
            write_glb(f"{mesh_dir}/{name}.glb", gltf, binary)
            shapes[name] = effects

    base_bodies = os.path.join(os.path.dirname(out_path), "base-bodies.json")
    write_shapes(out_path, shapes, shapes_version(mesh_dir, shapes, base_bodies))


def write_shapes(out_path: str, effects: dict, version: str) -> None:
    with open(out_path, "w") as f:
        json.dump({"version": version, "sliders": list(SLIDERS), "effects": effects}, f, indent=1)
        f.write("\n")


if __name__ == "__main__":
    if sys.argv[1] == "--version":
        mesh_dir, shapes_path, base_bodies = sys.argv[2:5]
        data = json.load(open(shapes_path))
        version = shapes_version(mesh_dir, data["effects"], base_bodies)
        print(version, "(matches body-shapes.json)" if data.get("version") == version else "(body-shapes.json says "
              f"{data.get('version')}: write it with --write-version)")
        if len(sys.argv) > 5 and sys.argv[5] == "--write-version":
            write_shapes(shapes_path, data["effects"], version)
    else:
        main(sys.argv[1], sys.argv[2], sys.argv[3])
