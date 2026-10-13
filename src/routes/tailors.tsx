import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Star, Clock, Scissors, Phone, MessageCircle, Check, Shirt, X, Calendar as CalendarIcon, Mail, Send } from "lucide-react";
import { Nav } from "@/components/Nav";
import { TAILORS, type Tailor } from "@/lib/shop-store";


export const Route = createFileRoute("/tailors")({
  head: () => ({
    meta: [
      { title: "Tailors — Book alterations · Mannequin AI" },
      { name: "description", content: "Nearby tailors, transparent pricing, twin-verified alteration recommendations. Book in two taps." },
      { property: "og:title", content: "Tailors · Mannequin AI" },
      { property: "og:description", content: "Perfect fit is 2 cm away." },
    ],
  }),
  component: TailorsPage,
});

type CategoryKey = "all" | "suits" | "dresses" | "denim" | "everyday";
type SortKey = "near" | "far" | "price-low" | "price-high" | "rating";

const CATEGORIES: { key: CategoryKey; label: string; match: (t: Tailor) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "suits", label: "Suits & Blazers", match: (t) => t.services.some((s) => /suit|blazer|lining|bespoke/i.test(s)) },
  { key: "dresses", label: "Dresses & Evening", match: (t) => t.services.some((s) => /silk|delicate|bead|evening|dress|gown/i.test(s)) },
  { key: "denim", label: "Denim", match: (t) => t.services.some((s) => /denim|chain-stitch|distress/i.test(s)) },
  { key: "everyday", label: "Hemming & Waist", match: (t) => t.services.some((s) => /hem|waist|sleeve/i.test(s)) },
];

function TailorsPage() {
  const [booked, setBooked] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<SortKey>("near");
  const [maxPrice, setMaxPrice] = useState(60);
  const [minRating, setMinRating] = useState(0);
  const [bookingTailor, setBookingTailor] = useState<Tailor | null>(null);


  const filtered = useMemo(() => {
    const catFn = CATEGORIES.find((c) => c.key === category)!.match;
    const list = TAILORS.filter((t) => catFn(t) && t.basePrice <= maxPrice && t.rating >= minRating);
    const sorted = [...list];
    switch (sort) {
      case "near": sorted.sort((a, b) => a.distanceKm - b.distanceKm); break;
      case "far": sorted.sort((a, b) => b.distanceKm - a.distanceKm); break;
      case "price-low": sorted.sort((a, b) => a.basePrice - b.basePrice); break;
      case "price-high": sorted.sort((a, b) => b.basePrice - a.basePrice); break;
      case "rating": sorted.sort((a, b) => b.rating - a.rating); break;
    }
    return sorted;
  }, [category, sort, maxPrice, minRating]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-24">
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-[color:var(--plum)] font-medium">
          <span className="h-px w-6 bg-[color:var(--plum)]" /> Tailoring
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Perfect fit, <span className="italic">2 cm away.</span></h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          When a piece is 95% right, your twin tells us exactly what to alter. Choose a nearby atelier and book in two taps.
        </p>

        {/* Filters */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs border transition ${
                  category === c.key ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Sort</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full rounded-full border border-border bg-background px-3.5 py-2 text-sm"
              >
                <option value="near">Nearest → furthest</option>
                <option value="far">Furthest → nearest</option>
                <option value="price-low">Price: low → high</option>
                <option value="price-high">Price: high → low</option>
                <option value="rating">Highest rated</option>
              </select>
            </label>
            <label className="block">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                <span>Max price</span>
                <span className="text-[color:var(--plum)] normal-case tracking-normal font-medium">${maxPrice}</span>
              </div>
              <input
                type="range" min={18} max={60} step={2}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[color:var(--plum)]"
              />
            </label>
            <label className="block">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                <span>Min rating</span>
                <span className="text-[color:var(--plum)] normal-case tracking-normal font-medium inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current text-amber-500" /> {minRating.toFixed(1)}
                </span>
              </div>
              <input
                type="range" min={0} max={5} step={0.1}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full accent-[color:var(--plum)]"
              />
            </label>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filtered.length}</span> of {TAILORS.length} tailors
          </div>
        </div>

        {/* Recommendation banner */}
        <div className="mt-8 rounded-3xl border border-border p-6 shadow-[var(--shadow-card)] flex flex-wrap items-center gap-4" style={{ background: "var(--gradient-hero)" }}>
          <span className="h-11 w-11 grid place-items-center rounded-full" style={{ background: "var(--gradient-plum)" }}>
            <Scissors className="h-5 w-5 text-white" />
          </span>
          <div className="flex-1 min-w-[240px]">
            <div className="font-medium">AI recommendation for your Camel Coat</div>
            <div className="text-sm text-muted-foreground">Take in waist 2 cm · shorten sleeves 1.5 cm · estimated $46 · 2 days</div>
          </div>
          <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm">Send to tailor</button>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No tailors match those filters. Try widening your price or rating.
          </div>
        ) : (
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {filtered.map((t) => (
              <div key={t.name} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-2xl">{t.name}</div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current text-amber-500" /> {t.rating}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.distance}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.turnaround}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[color:var(--plum)]">{t.price}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.services.map((s) => (
                    <span key={s} className="text-[11px] rounded-full bg-secondary px-2.5 py-1">{s}</span>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Next available</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {t.slots.map((s) => {
                      const key = `${t.name}-${s}`;
                      const isBooked = booked === key;
                      return (
                        <button
                          key={s}
                          onClick={() => setBooked(key)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            isBooked ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-accent"
                          }`}
                        >
                          {isBooked ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" /> Booked</span> : s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button onClick={() => setBookingTailor(t)} className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm">Book appointment</button>
                  <button className="h-10 w-10 grid place-items-center rounded-full border border-border" aria-label="Call">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="h-10 w-10 grid place-items-center rounded-full border border-border" aria-label="Chat">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-display text-foreground text-lg"><Shirt className="h-5 w-5" /> Mannequin AI</div>
          <div>© {new Date().getFullYear()} Mannequin AI</div>
        </div>
      </footer>
      {bookingTailor && <BookingModal tailor={bookingTailor} onClose={() => setBookingTailor(null)} />}
    </div>

  );
}

function BookingModal({ tailor, onClose }: { tailor: Tailor; onClose: () => void }) {
  const today = new Date();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const nextSlot = tailor.slots[0];

  const [date, setDate] = useState<string>(toISO(today));
  const [slot, setSlot] = useState<string>(nextSlot);
  const [service, setService] = useState<string>(tailor.services[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("Take in waist 2 cm · shorten sleeves 1.5 cm (from twin recommendation)");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const minDate = toISO(today);
  const ref = `MQN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const prettyDate = new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-[var(--shadow-card)]"
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--plum)] font-medium">
              {confirmed ? "Confirmed" : "Book appointment"}
            </div>
            <div className="mt-1 font-display text-2xl">{tailor.name}</div>
            <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-current text-amber-500" /> {tailor.rating}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {tailor.distance}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {tailor.turnaround}</span>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full border border-border" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirmed ? (
          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-border p-5" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-medium">Appointment confirmed</div>
                  <div className="text-xs text-muted-foreground">Reference {ref}</div>
                </div>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Tailor</span><span>{tailor.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{service}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{prettyDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slot</span><span>{slot}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Starting from</span><span>{tailor.price}</span></div>
            </div>
            {notes && (
              <div className="rounded-2xl bg-secondary p-4 text-sm">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notes for tailor</div>
                {notes}
              </div>
            )}
            <div className="rounded-2xl border border-border p-4 text-xs text-muted-foreground space-y-1">
              <div className="inline-flex items-center gap-2 text-foreground"><Mail className="h-3.5 w-3.5" /> Confirmation summary sent</div>
              {sendEmail && email && <div>· Email → {email}</div>}
              {sendSMS && phone && <div>· SMS → {phone}</div>}
              {!sendEmail && !sendSMS && <div>· No delivery selected</div>}
            </div>
            <button onClick={onClose} className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm">Done</button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setConfirmed(true); }}
            className="p-6 space-y-5"
          >
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Next available slot</div>
              <button
                type="button"
                onClick={() => setSlot(nextSlot)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${slot === nextSlot ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
              >
                <div className="inline-flex items-center gap-2 text-[color:var(--plum)] text-xs uppercase tracking-widest">
                  <Clock className="h-3 w-3" /> Soonest
                </div>
                <div className="mt-1 font-medium">{nextSlot}</div>
              </button>
            </div>

            <label className="block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" /> Choose date
              </div>
              <input
                type="date"
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm"
              />
            </label>

            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Time slot</div>
              <div className="flex flex-wrap gap-2">
                {tailor.slots.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${slot === s ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-accent"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Service</div>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm"
              >
                {tailor.services.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Name</div>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm" />
              </label>
              <label className="block">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Phone</div>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm" />
              </label>
            </div>

            <label className="block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Email</div>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm" />
            </label>

            <label className="block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Message for tailor</div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm resize-none"
              />
            </label>

            <div className="rounded-2xl border border-border p-4 space-y-2 text-sm">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Send confirmation summary</div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                <Mail className="h-3.5 w-3.5" /> Email me a confirmation
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sendSMS} onChange={(e) => setSendSMS(e.target.checked)} />
                <MessageCircle className="h-3.5 w-3.5" /> Also text me
              </label>
            </div>

            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm">
              <Send className="h-4 w-4" /> Confirm booking
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

