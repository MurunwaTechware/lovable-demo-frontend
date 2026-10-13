import { useEffect, useMemo, useState } from "react";
import { X, RotateCw, Sparkles, Shirt } from "lucide-react";
import type { Product } from "@/lib/shop-store";
import { useTwinHistory } from "@/lib/twin-history-store";

type View = "front" | "side" | "back";

const ACTIVE_KEY = "mannequin.activeMeasurements";
const DEFAULT_M = { height: 172, chest: 92, waist: 76, hip: 96, inseam: 80 };

function useActiveMeasurements() {
  const hist = useTwinHistory();
  const active = hist.snapshots.find((s) => s.id === hist.activeId)?.measurements;
  const [local, setLocal] = useState(active ?? DEFAULT_M);
  useEffect(() => {
    if (active) { setLocal(active); return; }
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem(ACTIVE_KEY);
      if (raw) setLocal({ ...DEFAULT_M, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, [active]);
  return local;
}

/** Categorize a product into a garment layer we can drape. */
function layerOf(p: Product): "coat" | "top" | "dress" | "bottom" | "shoes" | "accessory" {
  const c = (p.category + " " + p.name).toLowerCase();
  if (/(coat|jacket|blazer|trench|parka)/.test(c)) return "coat";
  if (/(dress|slip|gown)/.test(c)) return "dress";
  if (/(pant|trouser|jean|short|skirt|denim)/.test(c)) return "bottom";
  if (/(shoe|sneaker|boot|heel|loafer|court)/.test(c)) return "shoes";
  if (/(bag|scarf|belt|hat|glove|jewel|accessor)/.test(c)) return "accessory";
  return "top";
}

export function TwinOutfitPreview({
  products,
  title = "On your twin",
  onClose,
}: {
  products: Product[];
  title?: string;
  onClose: () => void;
}) {
  const m = useActiveMeasurements();
  const [view, setView] = useState<View>("front");
  const [spin, setSpin] = useState(false);

  // Body geometry — echoes MorphingTwin so drape sits believably.
  const B = { chest: 92, waist: 76, hip: 96, inseam: 80, height: 172 };
  const chestW = 60 * (m.chest / B.chest);
  const waistW = 48 * (m.waist / B.waist);
  const hipW = 62 * (m.hip / B.hip);
  const heightScale = m.height / B.height;
  const legLen = 130 * (m.inseam / B.inseam);
  const torsoLen = 110 * heightScale;
  const cx = 150;
  const headCy = 44;
  const headR = 18;
  const shoulderY = headCy + headR + 8;
  const waistY = shoulderY + torsoLen * 0.55;
  const hipY = shoulderY + torsoLen;
  const footY = hipY + legLen;

  const has = useMemo(() => {
    const s = new Set(products.map(layerOf));
    return {
      coat: s.has("coat"),
      top: s.has("top") || s.has("dress"),
      dress: s.has("dress"),
      bottom: s.has("bottom"),
      shoes: s.has("shoes"),
    };
  }, [products]);

  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
  const avgFit = Math.round(products.reduce((s, p) => s + p.fit, 0) / Math.max(products.length, 1));

  const bodyPath = `
    M ${cx - chestW / 2} ${shoulderY}
    C ${cx - chestW / 2 - 6} ${shoulderY + 20}, ${cx - waistW / 2 - 4} ${waistY - 20}, ${cx - waistW / 2} ${waistY}
    C ${cx - waistW / 2 - 4} ${waistY + 18}, ${cx - hipW / 2 - 4} ${hipY - 14}, ${cx - hipW / 2} ${hipY}
    L ${cx + hipW / 2} ${hipY}
    C ${cx + hipW / 2 + 4} ${hipY - 14}, ${cx + waistW / 2 + 4} ${waistY + 18}, ${cx + waistW / 2} ${waistY}
    C ${cx + waistW / 2 + 4} ${waistY - 20}, ${cx + chestW / 2 + 6} ${shoulderY + 20}, ${cx + chestW / 2} ${shoulderY} Z`;

  // Coat: falls to mid-thigh, opens slightly in front.
  const coatHem = hipY + legLen * 0.35;
  const coatFlare = 10;
  const coatPath = `
    M ${cx - chestW / 2 - 4} ${shoulderY - 2}
    L ${cx - chestW / 2 - 10} ${waistY}
    L ${cx - hipW / 2 - coatFlare} ${coatHem}
    L ${cx + hipW / 2 + coatFlare} ${coatHem}
    L ${cx + chestW / 2 + 10} ${waistY}
    L ${cx + chestW / 2 + 4} ${shoulderY - 2}
    L ${cx + 3} ${shoulderY + 4}
    L ${cx + 2} ${coatHem - 4}
    L ${cx - 2} ${coatHem - 4}
    L ${cx - 3} ${shoulderY + 4} Z`;

  // Slip dress silhouette
  const dressHem = hipY + legLen * 0.55;
  const dressPath = `
    M ${cx - chestW / 2 + 6} ${shoulderY + 6}
    C ${cx - waistW / 2 - 2} ${waistY - 10}, ${cx - waistW / 2} ${waistY + 4}, ${cx - hipW / 2 - 2} ${hipY + 4}
    L ${cx - hipW / 2 - 8} ${dressHem}
    L ${cx + hipW / 2 + 8} ${dressHem}
    L ${cx + hipW / 2 + 2} ${hipY + 4}
    C ${cx + waistW / 2} ${waistY + 4}, ${cx + waistW / 2 + 2} ${waistY - 10}, ${cx + chestW / 2 - 6} ${shoulderY + 6}
    L ${cx + chestW / 2 - 14} ${shoulderY + 14}
    L ${cx - chestW / 2 + 14} ${shoulderY + 14} Z`;

  // Trousers
  const trouserPath = `
    M ${cx - hipW / 2} ${hipY - 2}
    L ${cx - hipW / 2 - 4} ${footY - 6}
    L ${cx - 4} ${footY - 6}
    L ${cx - 2} ${hipY + 4}
    L ${cx + 2} ${hipY + 4}
    L ${cx + 4} ${footY - 6}
    L ${cx + hipW / 2 + 4} ${footY - 6}
    L ${cx + hipW / 2} ${hipY - 2} Z`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <div className="font-display text-lg leading-none">{title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Realistic drape simulated on your measurements</div>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* Twin stage */}
          <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[560px] overflow-hidden"
               style={{ background: "radial-gradient(circle at 50% 30%, rgba(192,132,252,0.18), transparent 60%), linear-gradient(180deg,#0f0b16 0%, #1a1226 100%)" }}>
            {/* studio floor */}
            <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08), transparent 70%)" }} />
            {/* scan sweep */}
            <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-cyan-300/25 to-transparent animate-scan-sweep pointer-events-none" />

            <svg viewBox="0 0 300 460" preserveAspectRatio="xMidYMid meet"
                 className={`relative h-full w-full transition-transform duration-500 ${spin ? "rotate-y-180" : ""}`}
                 style={{ transform: view === "side" ? "scaleX(0.55)" : view === "back" ? "scaleX(-1)" : undefined, transition: "transform 500ms" }}>
              <defs>
                <linearGradient id="tp-body" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="tp-coat" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d4a373" />
                  <stop offset="100%" stopColor="#8a5a3b" />
                </linearGradient>
                <linearGradient id="tp-dress" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f5e6d3" />
                  <stop offset="100%" stopColor="#d9c3a4" />
                </linearGradient>
                <linearGradient id="tp-trouser" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3a2a1e" />
                  <stop offset="100%" stopColor="#1e140c" />
                </linearGradient>
                <filter id="tp-soft"><feGaussianBlur stdDeviation="0.6" /></filter>
                <radialGradient id="tp-shade" cx="0.5" cy="0.4" r="0.7">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                </radialGradient>
              </defs>

              {/* body */}
              <circle cx={cx} cy={headCy} r={headR} fill="url(#tp-body)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
              <rect x={cx - 6} y={headCy + headR - 2} width={12} height={10} fill="url(#tp-body)" />
              <path d={bodyPath} fill="url(#tp-body)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
              <path d={`M ${cx - chestW / 2 + 2} ${shoulderY + 4} C ${cx - chestW / 2 - 22} ${shoulderY + 40}, ${cx - chestW / 2 - 26} ${waistY + 20}, ${cx - chestW / 2 - 18} ${hipY - 6}`}
                    stroke="url(#tp-body)" strokeWidth={12 * (m.chest / B.chest)} strokeLinecap="round" fill="none" />
              <path d={`M ${cx + chestW / 2 - 2} ${shoulderY + 4} C ${cx + chestW / 2 + 22} ${shoulderY + 40}, ${cx + chestW / 2 + 26} ${waistY + 20}, ${cx + chestW / 2 + 18} ${hipY - 6}`}
                    stroke="url(#tp-body)" strokeWidth={12 * (m.chest / B.chest)} strokeLinecap="round" fill="none" />
              <path d={`M ${cx - hipW / 4 - 4} ${hipY} L ${cx - hipW / 4 - 6} ${footY}`} stroke="url(#tp-body)" strokeWidth={18 * (m.hip / B.hip)} strokeLinecap="round" />
              <path d={`M ${cx + hipW / 4 + 4} ${hipY} L ${cx + hipW / 4 + 6} ${footY}`} stroke="url(#tp-body)" strokeWidth={18 * (m.hip / B.hip)} strokeLinecap="round" />

              {/* Bottom (trousers) — under coat, over legs */}
              {has.bottom && !has.dress && (
                <g filter="url(#tp-soft)">
                  <path d={trouserPath} fill="url(#tp-trouser)" opacity="0.95" />
                  <path d={trouserPath} fill="url(#tp-shade)" opacity="0.35" />
                </g>
              )}

              {/* Dress */}
              {has.dress && (
                <g filter="url(#tp-soft)">
                  <path d={dressPath} fill="url(#tp-dress)" />
                  <path d={dressPath} fill="url(#tp-shade)" opacity="0.35" />
                  {/* silk shine */}
                  <path d={`M ${cx - 12} ${shoulderY + 20} Q ${cx - 6} ${waistY} ${cx - 14} ${dressHem - 10}`} stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" opacity="0.7" />
                </g>
              )}

              {/* Top (if no dress) */}
              {has.top && !has.dress && (
                <g filter="url(#tp-soft)">
                  <path d={`M ${cx - chestW / 2 - 2} ${shoulderY + 2}
                            C ${cx - waistW / 2 - 2} ${waistY - 8}, ${cx - waistW / 2} ${waistY + 4}, ${cx - waistW / 2 - 2} ${hipY - 4}
                            L ${cx + waistW / 2 + 2} ${hipY - 4}
                            C ${cx + waistW / 2} ${waistY + 4}, ${cx + waistW / 2 + 2} ${waistY - 8}, ${cx + chestW / 2 + 2} ${shoulderY + 2} Z`}
                        fill="#f5e6d3" opacity="0.95" />
                </g>
              )}

              {/* Coat — outermost */}
              {has.coat && (
                <g filter="url(#tp-soft)">
                  <path d={coatPath} fill="url(#tp-coat)" />
                  <path d={coatPath} fill="url(#tp-shade)" opacity="0.3" />
                  {/* lapel line */}
                  <path d={`M ${cx - 3} ${shoulderY + 4} L ${cx - 10} ${waistY - 10} M ${cx + 3} ${shoulderY + 4} L ${cx + 10} ${waistY - 10}`}
                        stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" fill="none" />
                  {/* buttons */}
                  <circle cx={cx - 6} cy={waistY + 4} r="1.6" fill="#2a1a10" />
                  <circle cx={cx - 6} cy={waistY + 18} r="1.6" fill="#2a1a10" />
                </g>
              )}

              {/* Shoes */}
              {has.shoes && (
                <g>
                  <ellipse cx={cx - hipW / 4 - 6} cy={footY - 2} rx="10" ry="4" fill="#f5f5f5" stroke="#111" strokeWidth="0.6" />
                  <ellipse cx={cx + hipW / 4 + 6} cy={footY - 2} rx="10" ry="4" fill="#f5f5f5" stroke="#111" strokeWidth="0.6" />
                </g>
              )}

              {/* ground shadow */}
              <ellipse cx={cx} cy={footY + 6} rx={hipW * 0.9} ry="4" fill="rgba(0,0,0,0.35)" />
            </svg>

            {/* controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex rounded-full border border-white/15 bg-black/40 backdrop-blur p-1 text-white text-[11px]">
              {(["front", "side", "back"] as View[]).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-full capitalize transition ${view === v ? "bg-white text-black" : "hover:bg-white/10"}`}>
                  {v}
                </button>
              ))}
              <button onClick={() => setSpin((s) => !s)} className="ml-1 h-6 w-6 grid place-items-center rounded-full hover:bg-white/10" aria-label="Spin">
                <RotateCw className="h-3 w-3" />
              </button>
            </div>

            {/* fit badge */}
            <div className="absolute top-4 left-4 glass rounded-full px-3 py-1 text-[11px] font-medium bg-white/85 text-foreground">
              <span className="text-[color:var(--plum)] font-semibold">{avgFit}%</span> avg fit
            </div>
          </div>

          {/* Right: outfit details */}
          <div className="p-6 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[color:var(--plum)]">Outfit breakdown</div>
              <div className="mt-1 font-display text-2xl leading-tight">
                {products.map((p) => p.name).join(" · ")}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {products.length} pieces · ${totalPrice.toLocaleString()} total
              </div>
            </div>

            <ul className="space-y-2">
              {products.map((p) => {
                const l = layerOf(p);
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border p-2 bg-background">
                    <img src={p.img} alt={p.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.brand} · ${p.price}</div>
                    </div>
                    <span className="text-[11px] rounded-full bg-secondary px-2 py-0.5">
                      <span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-2xl border border-border p-3 text-xs text-muted-foreground" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Shirt className="h-3.5 w-3.5 text-[color:var(--plum)]" /> Drape notes
              </div>
              <p className="mt-1">
                Coat sits {Math.round(2 + (m.chest - 92) * 0.15)} cm past hip · sleeves finish at wrist bone.
                {has.dress ? " Slip skims waist by 1 cm — flattering with your current measurements." : ""}
                {has.bottom ? " Trouser breaks softly on the shoe." : ""}
              </p>
            </div>

            <button onClick={onClose} className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm">
              Close preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
