import { useSyncExternalStore } from "react";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import hero from "@/assets/hero.jpg";
import twin from "@/assets/twin.jpg";

export type PostMedia = { type: "image" | "video"; src: string };

export type Post = {
  id: string;
  goerId: string;
  media: PostMedia[];
  caption: string;
  category: string;
  occasion: string;
  palette: string[];
  brands: string[];
  hashtags: string[];
  location?: string;
  likes: number;
  comments: { id: string; user: string; text: string; ts: number }[];
  createdAt: number;
};

export type Goer = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  cover: string;
  bio: string;
  location: string;
  styles: string[];
  rating: number;
  reviewsCount: number;
  posts: number;
  followers: number;
  following: number;
  socials: { instagram?: string; tiktok?: string; pinterest?: string };
  offersConsultations: boolean;
  hourlyFrom?: number;
};

export type Review = {
  id: string;
  goerId: string;
  user: string;
  avatar: string;
  overall: number;
  communication: number;
  creativity: number;
  styling: number;
  recommend: boolean;
  text: string;
  photo?: string;
  ts: number;
};

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  ts: number;
  kind?: "text" | "pricing" | "collab" | "quote";
  meta?: Record<string, string | number>;
};

export type Thread = {
  goerId: string;
  messages: Message[];
  unread: number;
  pending?: boolean;
};

const IMGS = [p1, p2, p3, p4, p5, p6, hero, twin];

export const GOERS: Goer[] = [
  {
    id: "amara",
    name: "Amara Okafor",
    handle: "amara.styled",
    avatar: p2,
    cover: hero,
    bio: "Editorial stylist based in Lagos & Paris. Warm neutrals, sculpted tailoring, unexpected drape.",
    location: "Lagos, Nigeria",
    styles: ["Editorial", "Tailoring", "Warm Neutrals"],
    rating: 4.9,
    reviewsCount: 128,
    posts: 62,
    followers: 24800,
    following: 312,
    socials: { instagram: "amara.styled", pinterest: "amaraokafor" },
    offersConsultations: true,
    hourlyFrom: 120,
  },
  {
    id: "kaiw",
    name: "Kai Winters",
    handle: "kaiwinters",
    avatar: p4,
    cover: p1,
    bio: "Streetwear curator. Layered utility, muted palettes, sneaker archives.",
    location: "Tokyo, Japan",
    styles: ["Streetwear", "Utility", "Techwear"],
    rating: 4.8,
    reviewsCount: 94,
    posts: 138,
    followers: 51200,
    following: 480,
    socials: { instagram: "kaiwinters", tiktok: "kaiwinters" },
    offersConsultations: true,
    hourlyFrom: 90,
  },
  {
    id: "sofia",
    name: "Sofía Rivas",
    handle: "sofia.rivas",
    avatar: p5,
    cover: p3,
    bio: "Bridal & occasion stylist. Silk, movement, romantic silhouettes.",
    location: "Barcelona, Spain",
    styles: ["Bridal", "Occasion", "Romantic"],
    rating: 5.0,
    reviewsCount: 76,
    posts: 41,
    followers: 18700,
    following: 210,
    socials: { instagram: "sofia.rivas", pinterest: "sofiarivas" },
    offersConsultations: true,
    hourlyFrom: 160,
  },
  {
    id: "juno",
    name: "Juno Park",
    handle: "junopark",
    avatar: p6,
    cover: p4,
    bio: "Corporate + power dressing. Sharp suiting for the boardroom and beyond.",
    location: "Seoul, South Korea",
    styles: ["Corporate", "Suiting", "Minimalist"],
    rating: 4.7,
    reviewsCount: 58,
    posts: 87,
    followers: 12400,
    following: 190,
    socials: { instagram: "junopark" },
    offersConsultations: false,
  },
  {
    id: "thandi",
    name: "Thandi Mokoena",
    handle: "thandi.m",
    avatar: p3,
    cover: p5,
    bio: "Traditional × contemporary. Reimagining African textiles for everyday elegance.",
    location: "Cape Town, South Africa",
    styles: ["Traditional", "Print", "Contemporary"],
    rating: 4.9,
    reviewsCount: 102,
    posts: 74,
    followers: 33200,
    following: 280,
    socials: { instagram: "thandi.m", tiktok: "thandim" },
    offersConsultations: true,
    hourlyFrom: 110,
  },
  {
    id: "elio",
    name: "Elio Marchetti",
    handle: "elio.m",
    avatar: p1,
    cover: p6,
    bio: "Milan-based menswear stylist. Sartorial casual and seasonal capsules.",
    location: "Milan, Italy",
    styles: ["Menswear", "Sartorial", "Capsule"],
    rating: 4.8,
    reviewsCount: 69,
    posts: 55,
    followers: 21500,
    following: 340,
    socials: { instagram: "elio.m", pinterest: "eliomarchetti" },
    offersConsultations: true,
    hourlyFrom: 140,
  },
];

const CATEGORIES = ["Wedding", "Streetwear", "Corporate", "Casual", "Traditional", "Formal", "Seasonal", "Editorial"];
const OCCASIONS = ["Dinner party", "Runway", "Bridal shower", "Office", "Weekend", "Festival", "Gallery opening", "Date night"];
const PALETTES = [
  ["#C8A27C", "#F1E4D0", "#4A2E2B"],
  ["#1F2937", "#9CA3AF", "#F3F4F6"],
  ["#7C3AED", "#F5D0FE", "#0F172A"],
  ["#EA580C", "#FED7AA", "#292524"],
  ["#065F46", "#A7F3D0", "#0B0F0E"],
];
const BRANDS = ["The Row", "Toteme", "Bode", "Loewe", "Jacquemus", "Aime Leon Dore", "Wales Bonner", "Cos"];
const CAPTIONS = [
  "Draped silk over sharp tailoring — perfect friction.",
  "Sunday layers, weekday attitude.",
  "This palette hits when the light drops.",
  "The camel coat carries the whole fit.",
  "Bridal beyond the aisle — silk that moves.",
  "Utility pockets, editorial silhouette.",
  "Print × neutral. Balance is everything.",
  "Boardroom armour, softened at the shoulder.",
];

function seededPosts(): Post[] {
  const posts: Post[] = [];
  let idx = 0;
  for (const g of GOERS) {
    for (let i = 0; i < 4; i++) {
      const media: PostMedia[] = [{ type: "image", src: IMGS[(idx + i) % IMGS.length] }];
      if (i === 1) media.push({ type: "image", src: IMGS[(idx + i + 2) % IMGS.length] });
      posts.push({
        id: `${g.id}-p${i}`,
        goerId: g.id,
        media,
        caption: CAPTIONS[(idx + i) % CAPTIONS.length],
        category: CATEGORIES[(idx + i) % CATEGORIES.length],
        occasion: OCCASIONS[(idx + i) % OCCASIONS.length],
        palette: PALETTES[(idx + i) % PALETTES.length],
        brands: [BRANDS[(idx + i) % BRANDS.length], BRANDS[(idx + i + 3) % BRANDS.length]],
        hashtags: ["#ootd", `#${g.styles[0].toLowerCase()}`, "#mannequinai"],
        location: g.location,
        likes: 120 + ((idx + i) * 37) % 800,
        comments: [
          { id: "c1", user: "leo.k", text: "Obsessed with this palette 🔥", ts: Date.now() - 86400000 },
          { id: "c2", user: "mira", text: "Can you recreate for a garden wedding?", ts: Date.now() - 3600000 },
        ],
        createdAt: Date.now() - (idx * 3600000 + i * 900000),
      });
      idx++;
    }
  }
  return posts;
}

export const REVIEWS: Review[] = [
  { id: "r1", goerId: "amara", user: "Zola N.", avatar: p3, overall: 5, communication: 5, creativity: 5, styling: 5, recommend: true, text: "Amara built me a 7-piece capsule that fits my life. Every look works.", photo: p2, ts: Date.now() - 86400000 * 4 },
  { id: "r2", goerId: "amara", user: "Jonah P.", avatar: p6, overall: 5, communication: 5, creativity: 4, styling: 5, recommend: true, text: "Elevated my wardrobe without buying more. Thoughtful and warm.", ts: Date.now() - 86400000 * 12 },
  { id: "r3", goerId: "kaiw", user: "Rin", avatar: p5, overall: 5, communication: 4, creativity: 5, styling: 5, recommend: true, text: "Streetwear brain, editorial eye. My rotation is sharper than ever.", photo: p4, ts: Date.now() - 86400000 * 6 },
  { id: "r4", goerId: "sofia", user: "Marta A.", avatar: p1, overall: 5, communication: 5, creativity: 5, styling: 5, recommend: true, text: "My wedding week wardrobe was flawless. Cried a little.", ts: Date.now() - 86400000 * 20 },
];

type State = {
  following: Set<string>;
  liked: Set<string>;
  saved: Set<string>;
  posts: Post[];
  threads: Record<string, Thread>;
  collabRequests: Record<string, "none" | "requested" | "approved" | "revoked">;
  consumer: {
    name: string;
    handle: string;
    bio: string;
    location: string;
    favoriteColors: string[];
    preferredStyles: string[];
    sizes: { top: string; bottom: string; shoe: string };
  };
};

const initial: State = {
  following: new Set(["amara", "thandi"]),
  liked: new Set(),
  saved: new Set(),
  posts: seededPosts(),
  threads: {
    amara: {
      goerId: "amara",
      unread: 1,
      messages: [
        { id: "m1", from: "them", text: "Hi! Loved that you saved the camel-coat look. Happy to build a mini capsule around it.", ts: Date.now() - 3600000 },
      ],
    },
    juno: {
      goerId: "juno",
      unread: 1,
      pending: true,
      messages: [
        { id: "mj1", from: "them", text: "Hey! Saw your saved boardroom looks — I put together a suiting concept I think you'd love. Mind if I share?", ts: Date.now() - 7200000 },
      ],
    },
    elio: {
      goerId: "elio",
      unread: 1,
      pending: true,
      messages: [
        { id: "me1", from: "them", text: "Ciao — I'd love to collaborate on a Milan seasonal capsule. Open to a quick chat?", ts: Date.now() - 5400000 },
      ],
    },
  },
  collabRequests: {},
  consumer: {
    name: "Sarah Bennett",
    handle: "sarah.b",
    bio: "Warm neutrals, silk, and one very loved camel coat.",
    location: "Cape Town, ZA",
    favoriteColors: ["#C8A27C", "#4A2E2B", "#F1E4D0"],
    preferredStyles: ["Editorial", "Warm Neutrals", "Tailoring"],
    sizes: { top: "S", bottom: "27", shoe: "38" },
  },
};

let state: State = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const communityStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return state; },
  toggleFollow(id: string) {
    const s = new Set(state.following);
    if (s.has(id)) s.delete(id); else s.add(id);
    state = { ...state, following: s };
    emit();
  },
  toggleLike(id: string) {
    const s = new Set(state.liked);
    const delta = s.has(id) ? -1 : 1;
    if (s.has(id)) s.delete(id); else s.add(id);
    state = {
      ...state,
      liked: s,
      posts: state.posts.map((p) => (p.id === id ? { ...p, likes: p.likes + delta } : p)),
    };
    emit();
  },
  toggleSave(id: string) {
    const s = new Set(state.saved);
    if (s.has(id)) s.delete(id); else s.add(id);
    state = { ...state, saved: s };
    emit();
  },
  comment(postId: string, text: string) {
    state = {
      ...state,
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { id: `c${Date.now()}`, user: state.consumer.handle, text, ts: Date.now() }] }
          : p
      ),
    };
    emit();
  },
  sendMessage(goerId: string, msg: Omit<Message, "id" | "ts">) {
    const thread = state.threads[goerId] ?? { goerId, unread: 0, messages: [] };
    const next: Message = { ...msg, id: `m${Date.now()}`, ts: Date.now() };
    state = {
      ...state,
      threads: { ...state.threads, [goerId]: { ...thread, messages: [...thread.messages, next] } },
    };
    emit();
    // simulated reply
    setTimeout(() => {
      const t = state.threads[goerId];
      if (!t) return;
      const reply: Message = {
        id: `m${Date.now()}r`,
        from: "them",
        ts: Date.now(),
        kind: msg.kind === "pricing" ? "quote" : "text",
        text: msg.kind === "pricing"
          ? "Happy to! Recreating a similar look starts at $340 — full styling with sourcing $520. Want me to draft options?"
          : msg.kind === "collab"
          ? "Love to collaborate. I'll send an access request now."
          : "Thanks for reaching out — let me put a few looks together for you.",
      };
      state = {
        ...state,
        threads: { ...state.threads, [goerId]: { ...t, messages: [...t.messages, reply], unread: t.unread + 1 } },
      };
      emit();
    }, 900);
  },
  markRead(goerId: string) {
    const t = state.threads[goerId];
    if (!t) return;
    state = { ...state, threads: { ...state.threads, [goerId]: { ...t, unread: 0 } } };
    emit();
  },
  requestCollab(goerId: string) {
    state = { ...state, collabRequests: { ...state.collabRequests, [goerId]: "requested" } };
    emit();
    setTimeout(() => {
      state = { ...state, collabRequests: { ...state.collabRequests, [goerId]: "approved" } };
      emit();
    }, 1200);
  },
  revokeCollab(goerId: string) {
    state = { ...state, collabRequests: { ...state.collabRequests, [goerId]: "revoked" } };
    emit();
  },
  updateConsumer(patch: Partial<State["consumer"]>) {
    state = { ...state, consumer: { ...state.consumer, ...patch } };
    emit();
  },
  approveRequest(goerId: string) {
    const t = state.threads[goerId];
    if (!t) return;
    state = { ...state, threads: { ...state.threads, [goerId]: { ...t, pending: false } } };
    emit();
  },
  declineRequest(goerId: string) {
    if (!state.threads[goerId]) return;
    const next = { ...state.threads };
    delete next[goerId];
    state = { ...state, threads: next };
    emit();
  },
};

export function useCommunity() {
  return useSyncExternalStore(communityStore.subscribe, communityStore.get, communityStore.get);
}

export function getGoer(id: string) { return GOERS.find((g) => g.id === id); }
export function getPostsByGoer(id: string) { return state.posts.filter((p) => p.goerId === id); }
export function getReviewsByGoer(id: string) { return REVIEWS.filter((r) => r.goerId === id); }
