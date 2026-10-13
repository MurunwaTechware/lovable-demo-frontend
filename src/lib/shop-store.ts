import { useSyncExternalStore } from "react";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";
import p9 from "@/assets/p9.jpg";
import p10 from "@/assets/p10.jpg";
import p11 from "@/assets/p11.jpg";
import p12 from "@/assets/p12.jpg";
import p13 from "@/assets/p13.jpg";
import p14 from "@/assets/p14.jpg";

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  img: string;
  retailer: string;
  category: string;
  fit: number;
  description: string;
  sizes: string[];
  materials: string;
  care: string;
  tailorTips: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Signature Camel Coat",
    brand: "Aeryn",
    price: 890,
    img: p1,
    retailer: "Farfetch",
    category: "Outerwear",
    fit: 96,
    description:
      "A double-faced Italian wool coat cut with dropped shoulders and a soft peak lapel. Weightless drape, oversized notch pockets and a full satin lining for effortless layering from November through March.",
    sizes: ["XS", "S", "M", "L", "XL"],
    materials: "90% virgin wool · 10% cashmere · lining 100% viscose",
    care: "Dry clean only. Store on a wide wooden hanger.",
    tailorTips: [
      "Shorten sleeves 1.5 cm to sit at wrist bone.",
      "Take in waist 2 cm for a stronger silhouette.",
      "Ask Atelier Rosen — 4.9★, 0.8 km away.",
    ],
  },
  {
    id: "2",
    name: "Court Leather Sneakers",
    brand: "Alden & Co",
    price: 245,
    img: p2,
    retailer: "Nike",
    category: "Shoes",
    fit: 92,
    description:
      "Low-profile court sneaker in tumbled Italian calf with a hand-stitched toe box and a cupsole with 3 mm of hidden air cushioning. True to size, runs half narrow.",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    materials: "Full-grain calf leather upper · rubber cupsole",
    care: "Wipe with a damp cloth. Condition every 3 months.",
    tailorTips: ["Sneakers rarely need alteration — size up half if between."],
  },
  {
    id: "3",
    name: "Structured Leather Tote",
    brand: "Maison Vale",
    price: 420,
    img: p3,
    retailer: "Net-a-Porter",
    category: "Accessories",
    fit: 100,
    description:
      "An architectural tote in vegetable-tanned Tuscan leather with a magnetic closure, suede-lined interior and a slip pocket sized for a 14-inch laptop.",
    sizes: ["One size"],
    materials: "Vegetable-tanned leather · suede lining",
    care: "Keep away from prolonged sunlight. Condition twice a year.",
    tailorTips: ["No alterations needed."],
  },
  {
    id: "4",
    name: "Wool Peak Lapel Blazer",
    brand: "North Row",
    price: 620,
    img: p4,
    retailer: "Mr Porter",
    category: "Suiting",
    fit: 88,
    description:
      "A single-breasted blazer in an S110s wool hopsack. Half-canvas construction, working cuffs and a soft Neapolitan shoulder for movement without slouch.",
    sizes: ["36", "38", "40", "42", "44", "46"],
    materials: "100% S110s virgin wool · Bemberg lining",
    care: "Steam between wears. Dry clean once per season.",
    tailorTips: [
      "Take in the waist 3 cm for a defined silhouette.",
      "Shorten sleeves so 1 cm of shirt cuff shows.",
      "Book Atelier Rosen for a 2-day turnaround.",
    ],
  },
  {
    id: "5",
    name: "Champagne Silk Slip Dress",
    brand: "Lune",
    price: 340,
    img: p5,
    retailer: "Farfetch",
    category: "Dresses",
    fit: 94,
    description:
      "A bias-cut slip dress in 22-momme silk charmeuse with delicate French seams, adjustable straps and a fluid tea-length hem that catches candlelight.",
    sizes: ["XS", "S", "M", "L"],
    materials: "100% mulberry silk charmeuse",
    care: "Hand wash cold or dry clean. Line dry flat.",
    tailorTips: [
      "Hem +2 cm to graze the ankle for evening.",
      "Bring in bust darts 1 cm if between sizes.",
    ],
  },
  {
    id: "6",
    name: "Vintage Wash Denim Jacket",
    brand: "Fielder",
    price: 180,
    img: p6,
    retailer: "Zara",
    category: "Outerwear",
    fit: 90,
    description:
      "Rigid 13 oz Japanese selvedge denim, stone-washed for eight hours to a soft indigo with natural fade lines. Boxy trucker cut with copper rivets.",
    sizes: ["XS", "S", "M", "L", "XL"],
    materials: "100% Japanese selvedge cotton · copper hardware",
    care: "Cold wash inside out. Line dry.",
    tailorTips: [
      "Crop hem 3 cm for a modern proportion.",
      "Take in side seams 1.5 cm through the body.",
    ],
  },
  {
    id: "7",
    name: "Oversized Fleece Hoodie",
    brand: "Nightshift",
    price: 165,
    img: p7,
    retailer: "Superbalist",
    category: "Streetwear",
    fit: 93,
    description:
      "A heavyweight 480 gsm brushed-loopback hoodie with dropped shoulders, boxy fit, and a double-lined hood. Garment-dyed for a lived-in charcoal wash.",
    sizes: ["XS", "S", "M", "L", "XL"],
    materials: "100% organic cotton loopback",
    care: "Cold wash inside out. Tumble dry low.",
    tailorTips: ["Take up the hem 2 cm for a cropped street cut."],
  },
  {
    id: "8",
    name: "Cloud Runner Sneaker",
    brand: "Alden & Co",
    price: 210,
    img: p8,
    retailer: "Nike",
    category: "Sneakers",
    fit: 94,
    description:
      "A sculpted chunky sneaker on a 40 mm foam midsole, wrapped in soft off-white nappa. Padded collar, gum-tinted rubber outsole, weightless step.",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    materials: "Nappa leather upper · EVA foam midsole · rubber outsole",
    care: "Wipe with a damp cloth. Air dry.",
    tailorTips: ["Sneakers rarely need alteration — size up half if between."],
  },
  {
    id: "9",
    name: "Plum Pleated Midi Dress",
    brand: "Lune",
    price: 295,
    img: p9,
    retailer: "Net-a-Porter",
    category: "Dresses",
    fit: 95,
    description:
      "A knife-pleated chiffon midi in a deep plum, cut with a sculpted bodice and a full skirt that swings with movement. Fully lined, hidden side zip.",
    sizes: ["XS", "S", "M", "L"],
    materials: "100% polyester chiffon · viscose lining",
    care: "Dry clean only.",
    tailorTips: ["Hem +2 cm to graze the ankle.", "Bring in bust darts 1 cm if between sizes."],
  },
  {
    id: "10",
    name: "Cropped Biker Jacket",
    brand: "North Row",
    price: 540,
    img: p10,
    retailer: "Farfetch",
    category: "Jackets",
    fit: 91,
    description:
      "A cropped moto in soft lambskin with asymmetric zip, snap lapels, and epaulettes. Cut short at the waist for layering over dresses or high-rise denim.",
    sizes: ["XS", "S", "M", "L", "XL"],
    materials: "100% lambskin leather · viscose lining",
    care: "Leather specialist only. Condition twice a year.",
    tailorTips: ["Shorten sleeves 1.5 cm to sit at wrist bone.", "Take in waist 1.5 cm for a stronger silhouette."],
  },
  {
    id: "11",
    name: "Graphic Cargo Set",
    brand: "ZW Studio",
    price: 120,
    img: p11,
    retailer: "Zara",
    category: "Streetwear",
    fit: 89,
    description:
      "Oversized graphic tee paired with wide-leg ripstop cargos. Utility pockets, drawstring hem, and a boxy silhouette built for layering.",
    sizes: ["XS", "S", "M", "L", "XL"],
    materials: "Cotton jersey · ripstop cotton twill",
    care: "Machine wash cold. Line dry.",
    tailorTips: ["Take up cargo hem 3 cm to sit on the shoe."],
  },
  {
    id: "12",
    name: "Retro Court Sneaker",
    brand: "Nike",
    price: 145,
    img: p12,
    retailer: "Nike",
    category: "Sneakers",
    fit: 93,
    description:
      "A retro runner in cream nubuck with burgundy suede overlays, breathable mesh tongue and an EVA midsole with a visible air unit at the heel.",
    sizes: ["38", "39", "40", "41", "42", "43", "44"],
    materials: "Nubuck & suede upper · EVA midsole · rubber outsole",
    care: "Brush suede. Spot clean only.",
    tailorTips: ["Sneakers rarely need alteration — size up half if between."],
  },
  {
    id: "13",
    name: "Draped Satin Gown",
    brand: "Lune",
    price: 520,
    img: p13,
    retailer: "Net-a-Porter",
    category: "Dresses",
    fit: 96,
    description:
      "A floor-length gown in liquid black satin with a draped bodice, delicate spaghetti straps and a fluid bias-cut skirt that pools on the floor.",
    sizes: ["XS", "S", "M", "L"],
    materials: "100% silk satin · silk lining",
    care: "Hand wash cold or dry clean.",
    tailorTips: ["Hem to your heel height.", "Bring in bust 1 cm for a couture fit."],
  },
  {
    id: "14",
    name: "Olive Quilted Puffer",
    brand: "Fielder",
    price: 320,
    img: p14,
    retailer: "Mr Porter",
    category: "Jackets",
    fit: 90,
    description:
      "A boxed-baffle down puffer in matte olive with a stand collar, two-way zip and a water-repellent finish. 750-fill responsibly-sourced down.",
    sizes: ["XS", "S", "M", "L", "XL"],
    materials: "Recycled nylon shell · 750-fill down",
    care: "Spot clean. Down-specialist wash only.",
    tailorTips: ["Puffers do not tailor well — size down for a fitted look."],
  },
];

// --- Per-retailer generated catalogs ---

type RetailerSeed = {
  slug: string;
  name: string;
  category: string;
  brands: string[];
  names: string[];
  priceRange: [number, number];
  materials: string;
  care: string;
  sizes: string[];
  tailorTips: string[];
};

const IMAGES = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14];

const RETAILER_SEEDS: RetailerSeed[] = [
  {
    slug: "farfetch",
    name: "Farfetch",
    category: "Luxury",
    brands: ["Aeryn", "Maison Vale", "Lune", "North Row", "Studio Ferro", "Câline"],
    names: [
      "Signature Camel Coat", "Champagne Silk Slip", "Structured Leather Tote",
      "Peak Lapel Blazer", "Wide-Leg Wool Trouser", "Cashmere Turtleneck",
      "Silk Wrap Blouse", "Bias-Cut Midi Skirt",
    ],
    priceRange: [280, 1200],
    materials: "Italian wool, silk & cashmere blends",
    care: "Dry clean only. Store on a wide hanger.",
    sizes: ["XS", "S", "M", "L", "XL"],
    tailorTips: ["Take in waist 2 cm for a stronger silhouette.", "Shorten sleeves 1.5 cm to sit at wrist bone."],
  },
  {
    slug: "net-a-porter",
    name: "Net-a-Porter",
    category: "Editorial",
    brands: ["Lune", "Maison Vale", "Halcyon", "Rue Ivy", "Marcelline"],
    names: [
      "Editorial Silk Gown", "Tailored Crepe Jumpsuit", "Cropped Boucle Jacket",
      "Pleated Chiffon Skirt", "Ivory Cashmere Cardigan", "Statement Pearl Earrings",
      "Satin Pump", "Structured Shoulder Bag",
    ],
    priceRange: [220, 980],
    materials: "Silk charmeuse, crepe de chine, French boucle",
    care: "Dry clean recommended. Steam between wears.",
    sizes: ["XS", "S", "M", "L"],
    tailorTips: ["Bring in bust darts 1 cm if between sizes.", "Hem +2 cm to graze the ankle."],
  },
  {
    slug: "mr-porter",
    name: "Mr Porter",
    category: "Menswear",
    brands: ["North Row", "Alden & Co", "Fielder", "Rowan Bishop", "Ostend"],
    names: [
      "Neapolitan Blazer", "S110s Wool Trouser", "Merino Roll-Neck",
      "Suede Chelsea Boot", "Oxford Cotton Shirt", "Selvedge Denim",
      "Grenadine Silk Tie", "Cashmere Overcoat",
    ],
    priceRange: [180, 1400],
    materials: "S110s virgin wool, merino, full-grain leather",
    care: "Dry clean once per season. Steam between wears.",
    sizes: ["36", "38", "40", "42", "44", "46"],
    tailorTips: ["Take in waist 3 cm for a defined silhouette.", "Shorten sleeves so 1 cm of shirt cuff shows."],
  },
  {
    slug: "zara",
    name: "Zara",
    category: "Trend",
    brands: ["ZW Studio", "Zara"],
    names: [
      "Faux-Leather Trench", "Ribbed Knit Set", "High-Rise Straight Jean",
      "Oversized Poplin Shirt", "Pointed Ankle Boot", "Belted Wool Coat",
      "Pleated Mini Skirt", "Tailored Vest",
    ],
    priceRange: [29, 149],
    materials: "Poplin, faux leather, wool blends",
    care: "Machine wash cold. Line dry.",
    sizes: ["XS", "S", "M", "L", "XL"],
    tailorTips: ["Crop hem 3 cm for a modern proportion."],
  },
  {
    slug: "superbalist",
    name: "Superbalist",
    category: "Local Design",
    brands: ["Superbalist", "Ashanti Studio", "Kloof"],
    names: [
      "Linen Camp Shirt", "Wide-Leg Linen Pant", "Terracotta Knit Vest",
      "Sun-Bleached Denim", "Cotton Bucket Hat", "Rope-Sole Espadrille",
      "Embroidered Kaftan", "Beaded Anklet Set",
    ],
    priceRange: [40, 220],
    materials: "Local linen, organic cotton, natural dye",
    care: "Cool machine wash. Line dry in shade.",
    sizes: ["XS", "S", "M", "L", "XL"],
    tailorTips: ["Take in side seams 1 cm through the body."],
  },
  {
    slug: "cotton-on",
    name: "Cotton On",
    category: "Everyday",
    brands: ["Cotton On", "CO Body"],
    names: [
      "Everyday Cotton Tee", "Fleece Sweat Set", "Rib Bodysuit",
      "Utility Cargo Pant", "Slouchy Hoodie", "Cotton Sock 3-Pack",
      "Longline Cardigan", "Wash Denim Short",
    ],
    priceRange: [12, 79],
    materials: "100% cotton, organic fleece",
    care: "Machine wash warm. Tumble dry low.",
    sizes: ["XS", "S", "M", "L", "XL"],
    tailorTips: ["Size down for a cropped fit."],
  },
  {
    slug: "h-m",
    name: "H&M",
    category: "Trend",
    brands: ["H&M", "H&M Studio"],
    names: [
      "Faux-Fur Coat", "Fine-Knit Cardigan", "Slim Tailored Trouser",
      "Wrap Mini Dress", "Chunky Loafer", "Cotton Poplin Blouse",
      "Pleated Wide Trouser", "Wool-Blend Beret",
    ],
    priceRange: [19, 199],
    materials: "Recycled wool blends, organic cotton",
    care: "Cool machine wash. Reshape while damp.",
    sizes: ["XS", "S", "M", "L", "XL"],
    tailorTips: ["Take up trouser hem 2 cm to sit on the shoe."],
  },
  {
    slug: "nike",
    name: "Nike",
    category: "Performance",
    brands: ["Nike", "Nike ACG", "Jordan"],
    names: [
      "Court Leather Sneaker", "Tech Fleece Hoodie", "Dri-FIT Run Tee",
      "Air Max Runner", "Windrunner Jacket", "Pro Training Legging",
      "ACG Trail Cap", "Retro Basketball Short",
    ],
    priceRange: [35, 260],
    materials: "Dri-FIT, tumbled leather, recycled polyester",
    care: "Machine wash cold, inside out.",
    sizes: ["XS", "S", "M", "L", "XL"],
    tailorTips: ["Sneakers rarely need alteration — size up half if between."],
  },
];

const retailerCatalogCache = new Map<string, Product[]>();

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function buildCatalog(seed: RetailerSeed): Product[] {
  const items: Product[] = seed.names.map((n, i) => {
    const price = Math.round(seed.priceRange[0] + ((seed.priceRange[1] - seed.priceRange[0]) * ((i + 1) / seed.names.length)));
    return {
      id: `${seed.slug}-${i + 1}`,
      name: n,
      brand: pick(seed.brands, i),
      price,
      img: pick(IMAGES, i),
      retailer: seed.name,
      category: seed.category,
      fit: 82 + ((i * 3) % 16),
      description: `An ${seed.category.toLowerCase()} piece from ${seed.name}. ${n} — crafted from ${seed.materials.toLowerCase()}, tailored to translate perfectly to your Digital Twin.`,
      sizes: seed.sizes,
      materials: seed.materials,
      care: seed.care,
      tailorTips: seed.tailorTips,
    };
  });
  return items;
}

export function getRetailerCatalog(slug: string): { name: string; products: Product[] } | null {
  const seed = RETAILER_SEEDS.find((r) => r.slug === slug);
  if (!seed) return null;
  if (!retailerCatalogCache.has(slug)) retailerCatalogCache.set(slug, buildCatalog(seed));
  return { name: seed.name, products: retailerCatalogCache.get(slug)! };
}

export const getProduct = (id: string): Product | undefined => {
  const base = PRODUCTS.find((p) => p.id === id);
  if (base) return base;
  const dashIdx = id.lastIndexOf("-");
  if (dashIdx > 0) {
    const slug = id.slice(0, dashIdx);
    const cat = getRetailerCatalog(slug);
    return cat?.products.find((p) => p.id === id);
  }
  return undefined;
};

// --- tailors (sorted nearest → furthest) ---

export type Tailor = {
  name: string;
  rating: number;
  distanceKm: number;
  distance: string;
  turnaround: string;
  turnaroundDays: number;
  price: string;
  basePrice: number;
  services: string[];
  slots: string[];
};

export const TAILORS: Tailor[] = [
  { name: "Atelier Rosen", rating: 4.9, distanceKm: 0.8, distance: "0.8 km", turnaround: "2 days", turnaroundDays: 2, price: "from $28", basePrice: 28, services: ["Hemming", "Waist take-in", "Sleeve shortening"], slots: ["Tomorrow 10:00", "Tomorrow 15:30", "Fri 09:00"] },
  { name: "Maison Pins", rating: 4.8, distanceKm: 1.4, distance: "1.4 km", turnaround: "3 days", turnaroundDays: 3, price: "from $32", basePrice: 32, services: ["Suit tailoring", "Lining repair", "Bespoke fitting"], slots: ["Today 17:00", "Thu 11:00", "Sat 10:30"] },
  { name: "The Silk Room", rating: 4.9, distanceKm: 2.1, distance: "2.1 km", turnaround: "4 days", turnaroundDays: 4, price: "from $40", basePrice: 40, services: ["Silk & delicates", "Beadwork", "Evening wear"], slots: ["Thu 14:00", "Fri 16:00", "Mon 10:00"] },
  { name: "Denim Studio Co.", rating: 4.7, distanceKm: 3.0, distance: "3.0 km", turnaround: "Same day", turnaroundDays: 1, price: "from $18", basePrice: 18, services: ["Denim hemming", "Chain-stitch", "Distressing"], slots: ["Today 12:00", "Today 16:00", "Tomorrow 09:00"] },
].sort((a, b) => a.distanceKm - b.distanceKm);

export type TailoringAddon = {
  tailorName: string;
  tip: string;
  price: number;
  days: number;
};

function recommendTailorFor(p: Product): TailoringAddon | null {
  const tip = p.tailorTips?.[0];
  if (!tip || /no alteration/i.test(tip) || /rarely need/i.test(tip)) return null;
  let t = TAILORS[0];
  const hay = `${p.category} ${p.name}`.toLowerCase();
  if (/silk|dress|evening/.test(hay)) t = TAILORS.find(x => x.name === "The Silk Room") ?? t;
  else if (/denim|jean/.test(hay)) t = TAILORS.find(x => x.name === "Denim Studio Co.") ?? t;
  else if (/suit|blazer/.test(hay)) t = TAILORS.find(x => x.name === "Maison Pins") ?? t;
  const price = t.basePrice + Math.round(p.price * 0.04);
  return { tailorName: t.name, tip, price, days: t.turnaroundDays };
}

// --- shared reactive store (works across route boundaries) ---

type State = {
  wishlist: Set<string>;
  cart: Product[];
  tailoring: (TailoringAddon | null)[]; // parallel to cart
  collaborators: { name: string; email: string; color: string }[];
};

const listeners = new Set<() => void>();
let state: State = {
  wishlist: new Set<string>(),
  cart: [],
  tailoring: [],
  collaborators: [
    { name: "Maya", email: "maya@friends.co", color: "#c084fc" },
    { name: "Jules", email: "jules@family.co", color: "#f472b6" },
  ],
};

const emit = () => listeners.forEach((l) => l());

export const shopStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  toggleWish(id: string) {
    const next = new Set(state.wishlist);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    state = { ...state, wishlist: next };
    emit();
  },
  addToCart(p: Product) {
    state = { ...state, cart: [...state.cart, p], tailoring: [...state.tailoring, null] };
    emit();
  },
  removeFromCart(idx: number) {
    state = {
      ...state,
      cart: state.cart.filter((_, i) => i !== idx),
      tailoring: state.tailoring.filter((_, i) => i !== idx),
    };
    emit();
  },
  recommendTailorFor,
  toggleTailoring(idx: number) {
    const p = state.cart[idx];
    if (!p) return;
    const current = state.tailoring[idx];
    const next = [...state.tailoring];
    next[idx] = current ? null : recommendTailorFor(p);
    state = { ...state, tailoring: next };
    emit();
  },
  addCollaborator(name: string, email: string) {
    const palette = ["#c084fc", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#fb7185"];
    const color = palette[state.collaborators.length % palette.length];
    state = {
      ...state,
      collaborators: [...state.collaborators, { name, email, color }],
    };
    emit();
  },
};

export function useShop() {
  return useSyncExternalStore(shopStore.subscribe, shopStore.getSnapshot, shopStore.getSnapshot);
}
