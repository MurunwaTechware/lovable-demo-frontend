import { useMemo, useState } from "react";
import { Dumbbell, Plus, RotateCcw, Trash2, Check, Pencil, Sparkles, TrendingDown, TrendingUp as TrendUp } from "lucide-react";
import { twinHistoryStore, useTwinHistory, goalTint, type TwinSnapshot } from "@/lib/twin-history-store";

const GOALS: TwinSnapshot["goal"][] = ["cutting", "bulking", "maintain", "recomp", "other"];

export function TwinHistorySection() {
  const { snapshots, activeId } = useTwinHistory();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [snapshots],
  );
  const active = snapshots.find((s) => s.id === activeId) ?? sorted[sorted.length - 1];
  const first = sorted[0];
  const delta = active && first ? {
    waist: active.measurements.waist - first.measurements.waist,
    chest: active.measurements.chest - first.measurements.chest,
    weight: (active.measurements.weight ?? 0) - (first.measurements.weight ?? 0),
  } : null;

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
            <Dumbbell className="h-3.5 w-3.5" /> Body twin history
          </div>
          <h2 className="mt-2 font-display text-3xl">Your twin, through the seasons</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Save a snapshot every time your body shifts — gym cycles, weight loss, post-injury. Recall any twin to shop and try on with those measurements again.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs"
        >
          <Plus className="h-4 w-4" /> Save current twin
        </button>
      </div>

      {delta && (
        <div className="mt-5 grid sm:grid-cols-3 gap-3">
          <DeltaCard label="Waist" value={delta.waist} unit="cm" invert />
          <DeltaCard label="Chest" value={delta.chest} unit="cm" />
          <DeltaCard label="Weight" value={delta.weight} unit="kg" invert />
        </div>
      )}

      <div className="mt-6 grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        {/* Active twin preview */}
        <div className="rounded-3xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Currently active</div>
          <div className="mt-1 font-display text-xl flex items-center gap-2">
            {active?.label ?? "No snapshot"}
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: goalTint(active?.goal ?? "other") + "33", color: goalTint(active?.goal ?? "other") }}>
              {active?.goal}
            </span>
          </div>
          {active && (
            <>
              <div className="mt-4 aspect-[3/4] rounded-2xl overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
                <MiniTwin m={active.measurements} tint={goalTint(active.goal)} />
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {Object.entries(active.measurements).map(([k, v]) => (
                  <li key={k} className="flex justify-between border-b border-border/60 py-1">
                    <span className="capitalize text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}{k === "weight" ? " kg" : " cm"}</span>
                  </li>
                ))}
              </ul>
              {active.note && <p className="mt-3 text-xs text-muted-foreground italic">"{active.note}"</p>}
            </>
          )}
          <div className="mt-4 rounded-xl border border-border bg-background/60 p-3 flex items-start gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--plum)] mt-0.5 shrink-0" />
            <span>Stylist will fit garments to <span className="font-medium">{active?.label}</span> until you recall a different snapshot.</span>
          </div>
        </div>

        {/* Timeline */}
        <ol className="relative border-l border-border ml-3 space-y-6">
          {sorted.map((s) => {
            const isActive = s.id === activeId;
            const isEditing = s.id === editingId;
            return (
              <li key={s.id} className="pl-6 relative">
                <span
                  className="absolute -left-[9px] top-2 h-4 w-4 rounded-full ring-4 ring-background"
                  style={{ background: goalTint(s.goal), outline: isActive ? "2px solid var(--plum)" : undefined, outlineOffset: 2 }}
                />
                <div className={`rounded-2xl border p-4 ${isActive ? "border-[color:var(--plum)] bg-card" : "border-border bg-card/60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        <span className="ml-2 px-2 py-0.5 rounded-full" style={{ background: goalTint(s.goal) + "33", color: goalTint(s.goal) }}>
                          {s.goal}
                        </span>
                      </div>
                      <div className="mt-1 font-display text-lg">{s.label}</div>
                      {s.note && !isEditing && <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      {!isActive && (
                        <button
                          onClick={() => twinHistoryStore.activate(s.id)}
                          title="Recall this twin"
                          className="h-8 px-3 rounded-full border border-border hover:bg-accent text-[11px] inline-flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Recall
                        </button>
                      )}
                      {isActive && (
                        <span className="h-8 px-3 rounded-full bg-[color:var(--plum)] text-white text-[11px] inline-flex items-center gap-1">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      )}
                      <button
                        onClick={() => setEditingId(isEditing ? null : s.id)}
                        title="Edit"
                        className="h-8 w-8 grid place-items-center rounded-full border border-border hover:bg-accent"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this snapshot?")) twinHistoryStore.remove(s.id); }}
                        title="Delete"
                        className="h-8 w-8 grid place-items-center rounded-full border border-border hover:bg-accent"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="mt-3 grid grid-cols-5 gap-2 text-[11px]">
                      {(["height", "chest", "waist", "hip", "inseam"] as const).map((k) => (
                        <div key={k} className="rounded-lg bg-background border border-border/60 px-2 py-1.5 text-center">
                          <div className="text-[9px] uppercase text-muted-foreground">{k}</div>
                          <div className="font-medium">{s.measurements[k]}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EditForm snap={s} onDone={() => setEditingId(null)} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {adding && <AddModal onClose={() => setAdding(false)} lastSnap={sorted[sorted.length - 1]} />}
    </section>
  );
}

function DeltaCard({ label, value, unit, invert }: { label: string; value: number; unit: string; invert?: boolean }) {
  const isPositive = value > 0;
  const good = invert ? value < 0 : value > 0;
  const Icon = isPositive ? TrendUp : TrendingDown;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label} · vs baseline</div>
      <div className={`mt-1 font-display text-2xl inline-flex items-center gap-1.5 ${good ? "text-[color:var(--plum)]" : "text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
        {value > 0 ? "+" : ""}{value.toFixed(1)} {unit}
      </div>
    </div>
  );
}

function EditForm({ snap, onDone }: { snap: TwinSnapshot; onDone: () => void }) {
  const [draft, setDraft] = useState(snap);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); twinHistoryStore.update(snap.id, draft); onDone(); }}
      className="mt-3 space-y-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="rounded-lg border border-border bg-background px-2 h-9 text-xs" placeholder="Label" />
        <select value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value as TwinSnapshot["goal"] })} className="rounded-lg border border-border bg-background px-2 h-9 text-xs">
          {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {(["height", "chest", "waist", "hip", "inseam"] as const).map((k) => (
          <label key={k} className="text-[10px] text-muted-foreground">
            <span className="capitalize">{k}</span>
            <input
              type="number"
              value={draft.measurements[k]}
              onChange={(e) => setDraft({ ...draft, measurements: { ...draft.measurements, [k]: Number(e.target.value) } })}
              className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 h-8 text-xs text-foreground"
            />
          </label>
        ))}
      </div>
      <input value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Note (optional)" className="w-full rounded-lg border border-border bg-background px-2 h-9 text-xs" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="text-xs h-8 px-3 rounded-full border border-border">Cancel</button>
        <button className="text-xs h-8 px-3 rounded-full bg-primary text-primary-foreground">Save</button>
      </div>
    </form>
  );
}

function AddModal({ onClose, lastSnap }: { onClose: () => void; lastSnap?: TwinSnapshot }) {
  const base = lastSnap?.measurements ?? { height: 172, chest: 92, waist: 76, hip: 96, inseam: 80, weight: 75 };
  const [label, setLabel] = useState("");
  const [goal, setGoal] = useState<TwinSnapshot["goal"]>("maintain");
  const [note, setNote] = useState("");
  const [m, setM] = useState<Record<string, number>>(base as Record<string, number>);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-card border border-border p-6">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--plum)]">Save twin snapshot</div>
        <h3 className="mt-1 font-display text-2xl">Capture today's shape</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            twinHistoryStore.add({
              label: label || `Snapshot · ${new Date().toLocaleDateString()}`,
              goal,
              note,
              measurements: { height: m.height, chest: m.chest, waist: m.waist, hip: m.hip, inseam: m.inseam, weight: m.weight },
            });
            onClose();
          }}
          className="mt-4 space-y-3"
        >
          <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Gym · week 12" className="w-full rounded-lg border border-border bg-background px-3 h-10 text-sm" />
          <div className="flex flex-wrap gap-1.5">
            {GOALS.map((g) => (
              <button type="button" key={g} onClick={() => setGoal(g)} className={`text-[11px] rounded-full px-3 h-8 border ${goal === g ? "bg-[color:var(--plum)] text-white border-transparent" : "border-border"}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["height", "chest", "waist", "hip", "inseam", "weight"] as const).map((k) => (
              <label key={k} className="text-[10px] text-muted-foreground">
                <span className="capitalize">{k} ({k === "weight" ? "kg" : "cm"})</span>
                <input type="number" value={m[k] ?? 0} onChange={(e) => setM({ ...m, [k]: Number(e.target.value) })} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 h-9 text-sm text-foreground" />
              </label>
            ))}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note — training block, cut, milestone…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-16" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="text-xs h-9 px-4 rounded-full border border-border">Cancel</button>
            <button className="text-xs h-9 px-4 rounded-full bg-primary text-primary-foreground">Save snapshot</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MiniTwin({ m, tint }: { m: { height: number; chest: number; waist: number; hip: number; inseam: number }; tint: string }) {
  const B = { height: 172, chest: 92, waist: 76, hip: 96, inseam: 80 };
  const chestW = 60 * (m.chest / B.chest);
  const waistW = 48 * (m.waist / B.waist);
  const hipW = 62 * (m.hip / B.hip);
  const heightScale = m.height / B.height;
  const legLen = 130 * (m.inseam / B.inseam);
  const torsoLen = 110 * heightScale;
  const cx = 110;
  const headR = 16 * heightScale;
  const headCy = 40;
  const shoulderY = headCy + headR + 8;
  const waistY = shoulderY + torsoLen * 0.55;
  const hipY = shoulderY + torsoLen;
  const footY = hipY + legLen;
  const path = `
    M ${cx - chestW / 2} ${shoulderY}
    C ${cx - chestW / 2 - 6} ${shoulderY + 20}, ${cx - waistW / 2 - 4} ${waistY - 20}, ${cx - waistW / 2} ${waistY}
    C ${cx - waistW / 2 - 4} ${waistY + 18}, ${cx - hipW / 2 - 4} ${hipY - 14}, ${cx - hipW / 2} ${hipY}
    L ${cx + hipW / 2} ${hipY}
    C ${cx + hipW / 2 + 4} ${hipY - 14}, ${cx + waistW / 2 + 4} ${waistY + 18}, ${cx + waistW / 2} ${waistY}
    C ${cx + waistW / 2 + 4} ${waistY - 20}, ${cx + chestW / 2 + 6} ${shoulderY + 20}, ${cx + chestW / 2} ${shoulderY}
    Z`;
  return (
    <svg viewBox={`0 0 220 ${footY + 30}`} className="w-full h-full">
      <defs>
        <linearGradient id="miniGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.9" />
          <stop offset="1" stopColor={tint} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={headCy} r={headR} fill="url(#miniGrad)" style={{ transition: "all 500ms" }} />
      <path d={path} fill="url(#miniGrad)" style={{ transition: "all 500ms" }} />
      <path d={`M ${cx - hipW / 4 - 4} ${hipY} L ${cx - hipW / 4 - 6} ${footY}`} stroke="url(#miniGrad)" strokeWidth={14 * (m.hip / B.hip)} strokeLinecap="round" style={{ transition: "all 500ms" }} />
      <path d={`M ${cx + hipW / 4 + 4} ${hipY} L ${cx + hipW / 4 + 6} ${footY}`} stroke="url(#miniGrad)" strokeWidth={14 * (m.hip / B.hip)} strokeLinecap="round" style={{ transition: "all 500ms" }} />
      <path d={`M ${cx - chestW / 2 + 2} ${shoulderY + 4} C ${cx - chestW / 2 - 18} ${shoulderY + 40}, ${cx - chestW / 2 - 22} ${waistY + 20}, ${cx - chestW / 2 - 14} ${hipY - 6}`} stroke="url(#miniGrad)" strokeWidth={10 * (m.chest / B.chest)} strokeLinecap="round" fill="none" style={{ transition: "all 500ms" }} />
      <path d={`M ${cx + chestW / 2 - 2} ${shoulderY + 4} C ${cx + chestW / 2 + 18} ${shoulderY + 40}, ${cx + chestW / 2 + 22} ${waistY + 20}, ${cx + chestW / 2 + 14} ${hipY - 6}`} stroke="url(#miniGrad)" strokeWidth={10 * (m.chest / B.chest)} strokeLinecap="round" fill="none" style={{ transition: "all 500ms" }} />
    </svg>
  );
}
