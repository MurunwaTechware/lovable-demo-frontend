import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, Sun, Cloud, CloudRain, TrendingUp, Heart, Shirt, Palette, Calendar } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PRODUCTS } from "@/lib/shop-store";
import { TwinHistorySection } from "@/components/TwinHistorySection";
import { TwinOutfitPreview } from "@/components/TwinOutfitPreview";

export const Route = createFileRoute("/stylist")({
  head: () => ({
    meta: [
      { title: "AI Stylist & Style Journey · Mannequin AI" },
      { name: "description", content: "Your proactive AI stylist dashboard combined with a living timeline of how your style evolves." },
      { property: "og:title", content: "AI Stylist & Style Journey" },
      { property: "og:description", content: "Weather-aware outfits, capsule ideas, and your evolving style story — in one place." },
    ],
  }),
  component: StylistPage,
});

const PROMPTS = [
  "Outfit for a Friday dinner in Cape Town.",
  "Build me a 5-piece autumn capsule under $1500.",
  "Something that flatters an hourglass shape.",
  "What complements my camel coat?",
];

const TIMELINE = [
  { month: "Jan", note: "Started with tailored basics — 4 pieces added.", color: "#c084fc" },
  { month: "Mar", note: "Shifted to warm neutrals for autumn.", color: "#e8b872" },
  { month: "May", note: "Bought first silk piece · exploring evening wear.", color: "#f472b6" },
  { month: "Aug", note: "Body twin updated — sleeves refined by 1 cm.", color: "#60a5fa" },
  { month: "Oct", note: "Camel coat purchased — new capsule anchor.", color: "#a78bfa" },
];

const PALETTE = ["#e8d8b8", "#c9a687", "#7a5a3f", "#3a2a1e", "#0f0f0f"];

function StylistPage() {
  const [tab, setTab] = useState<"today" | "journey">("today");
  const [showTwinPreview, setShowTwinPreview] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Good morning, Sarah. It's 18°C and overcast in your area — I've pulled 3 outfits that layer beautifully. Want to see them?" },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { role: "user", text },
      { role: "ai", text: "Curated 4 pieces from Farfetch and Net-a-Porter — all 92%+ fit. Tap any to view on your twin." },
    ]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
          <span className="h-px w-6 bg-[color:var(--plum)]" /> AI Stylist · Style Journey
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">
          Good morning, <span className="italic">Sarah.</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Today's outfits, your evolving style story, and a stylist that reads both — all in one place.
        </p>

        {/* Tab switcher */}
        <div className="mt-8 inline-flex rounded-full border border-border p-1 bg-card">
          {([
            { id: "today", label: "Today" },
            { id: "journey", label: "Your journey" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 text-xs rounded-full transition ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "today" && (
          <>
            {/* Dashboard */}
            <div className="mt-8 grid lg:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 text-sm font-medium"><Cloud className="h-4 w-4 text-[color:var(--plum)]" /> Weather-aware</div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-4xl font-display">18°</span>
                  <div className="text-xs text-muted-foreground">Overcast · Cape Town<br />Light layers · warm neutrals</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-center text-muted-foreground">
                  <div><Sun className="h-4 w-4 mx-auto" />Fri 22°</div>
                  <div><Cloud className="h-4 w-4 mx-auto" />Sat 19°</div>
                  <div><CloudRain className="h-4 w-4 mx-auto" />Sun 15°</div>
                </div>
              </div>

              <div className="rounded-3xl border border-border p-6 shadow-[var(--shadow-card)]" style={{ background: "var(--gradient-hero)" }}>
                <div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-[color:var(--plum)]" /> Today's outfit</div>
                <div className="mt-3 font-display text-xl">Camel coat · silk slip · court sneakers</div>
                <div className="mt-2 text-xs text-muted-foreground">98% fit · 3 pieces · $1,475 total</div>
                <div className="mt-4 flex -space-x-3">
                  {PRODUCTS.slice(0, 3).map((p) => (
                    <img key={p.id} src={p.img} alt={p.name} className="h-14 w-14 rounded-full border-2 border-card object-cover" />
                  ))}
                </div>
                <button onClick={() => setShowTwinPreview(true)} className="mt-4 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs">See on your twin</button>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 text-sm font-medium"><Heart className="h-4 w-4 text-[color:var(--plum)]" /> Wishlist insights</div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex justify-between"><span>Warm neutrals dominant</span><span className="text-muted-foreground">68%</span></li>
                  <li className="flex justify-between"><span>Avg. price point</span><span className="text-muted-foreground">$420</span></li>
                  <li className="flex justify-between"><span>Circle favourite</span><span className="text-[color:var(--plum)]">Camel Coat</span></li>
                </ul>
                <Link to="/wishlist" className="mt-4 inline-flex text-xs font-medium text-[color:var(--plum)]">Open wishlist →</Link>
              </div>
            </div>

            {/* Chat + recommendations */}
            <div className="mt-10 grid lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <div className="font-medium">Chat with your stylist</div>
                    <div className="text-xs text-muted-foreground">Trained on your Digital Twin & style history.</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PROMPTS.map((p) => (
                    <button key={p} onClick={() => send(p)} className="text-[11px] rounded-full border border-border bg-background px-3 py-1 hover:bg-accent">
                      {p}
                    </button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for an outfit…"
                    className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[color:var(--plum)]/40"
                  />
                  <button className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Send">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div>
                <h2 className="font-display text-2xl">Recommended for you</h2>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  {PRODUCTS.slice(0, 4).map((p) => (
                    <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group rounded-2xl overflow-hidden bg-card border border-border">
                      <div className="relative aspect-[4/5]">
                        <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                        <div className="absolute top-2 left-2 glass rounded-full px-2.5 py-0.5 text-[10px] bg-white/85"><span className="text-[color:var(--plum)] font-semibold">{p.fit}%</span> fit</div>
                      </div>
                      <div className="p-3">
                        <div className="text-[11px] text-muted-foreground">{p.brand}</div>
                        <div className="font-display text-sm">{p.name}</div>
                        <div className="mt-1 text-xs">${p.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "journey" && (
          <>
            {/* Insight cards */}
            <div className="mt-8 grid md:grid-cols-3 gap-5">
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-medium"><Palette className="h-4 w-4 text-[color:var(--plum)]" /> Favourite palette</div>
                <div className="mt-4 flex gap-1.5">
                  {PALETTE.map((c) => (
                    <span key={c} className="h-10 flex-1 rounded-lg" style={{ background: c }} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Warm neutrals · earthy · anchored in camel and espresso.</p>
              </div>
              <div className="rounded-3xl border border-border p-6" style={{ background: "var(--gradient-hero)" }}>
                <div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-[color:var(--plum)]" /> Silhouette shift</div>
                <div className="mt-4 font-display text-2xl">Tailored → Relaxed</div>
                <p className="mt-2 text-xs text-muted-foreground">You've moved 34% toward drapier, softer cuts this season.</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-sm font-medium"><Calendar className="h-4 w-4 text-[color:var(--plum)]" /> Most-worn</div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Outerwear</span><span className="text-muted-foreground">42%</span></div>
                  <div className="flex justify-between"><span>Suiting</span><span className="text-muted-foreground">24%</span></div>
                  <div className="flex justify-between"><span>Dresses</span><span className="text-muted-foreground">18%</span></div>
                  <div className="flex justify-between"><span>Shoes</span><span className="text-muted-foreground">16%</span></div>
                </div>
              </div>
            </div>

            {/* Timeline + stylist reading */}
            <section className="mt-12 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
              <div>
                <h2 className="font-display text-3xl">Your year, threaded</h2>
                <ol className="mt-8 relative border-l border-border ml-3 space-y-8">
                  {TIMELINE.map((t, i) => (
                    <li key={t.month} className="pl-6 relative">
                      <span className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-background" style={{ background: t.color }} />
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.month}</div>
                      <div className="mt-1 font-display text-xl">{t.note}</div>
                      {i === 4 && (
                        <div className="mt-3 flex gap-3">
                          {PRODUCTS.slice(0, 3).map((p) => (
                            <img key={p.id} src={p.img} alt={p.name} className="h-20 w-20 rounded-2xl object-cover border border-border" />
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <aside className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-24">
                <div className="flex items-center gap-2">
                  <span className="h-9 w-9 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  <div>
                    <div className="font-medium">Stylist reading your journey</div>
                    <div className="text-xs text-muted-foreground">Insights drawn from every piece you've loved.</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-border p-3" style={{ background: "var(--gradient-hero)" }}>
                  <div className="text-[11px] uppercase tracking-widest text-[color:var(--plum)]">Insight of the week</div>
                  <p className="mt-1 font-display text-lg leading-snug">
                    Your camel anchor is calling for a chocolate knit and a soft ivory trouser.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {PRODUCTS.slice(0, 3).map((p) => (
                    <Link key={p.id} to="/product/$id" params={{ id: p.id }} className="group rounded-xl overflow-hidden border border-border">
                      <img src={p.img} alt={p.name} className="aspect-[4/5] w-full object-cover group-hover:scale-105 transition" />
                    </Link>
                  ))}
                </div>
                <button onClick={() => setTab("today")} className="mt-4 inline-flex text-xs font-medium text-[color:var(--plum)]">
                  Ask the stylist about today →
                </button>
              </aside>
            </section>
            <TwinHistorySection />


            {/* AI insight */}
            <div className="mt-12 rounded-3xl border border-border p-8 shadow-[var(--shadow-card)]" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-[color:var(--plum)]" /> AI insight</div>
              <p className="mt-3 font-display text-2xl md:text-3xl max-w-2xl">
                "You tend to choose earth tones in winter and reach for silk when the temperature climbs. Ready for a spring palette preview?"
              </p>
            </div>
          </>
        )}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display text-foreground text-lg"><Shirt className="h-5 w-5" /> Mannequin AI</div>
          <div>© {new Date().getFullYear()} Mannequin AI</div>
        </div>
      </footer>
      {showTwinPreview && (
        <TwinOutfitPreview
          products={PRODUCTS.slice(0, 3)}
          title="Today's outfit on your twin"
          onClose={() => setShowTwinPreview(false)}
        />
      )}
    </div>
  );
}
