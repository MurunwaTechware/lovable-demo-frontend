// How a catalogue product is tried on, worked out from its category.
//
// The try-on backend takes a garment in one of its existing slots: a top or a bottom. Superbalist's
// categories (gender / category / subcategory, e.g. women / tops / blouses) tell us which one, and what
// kind of garment it is, so the category is also sent to the model as a hint in the prompt.

/** The slot the garment is uploaded as. The backend knows these two (plus headwear and eyewear). */
export type TryOnSlot = "top" | "bottom";

/** What the garment is. A one-piece (dress, jumpsuit, swimsuit) goes in the "top" slot but covers more. */
export type GarmentKind = "top" | "bottom" | "one-piece";

type Classifiable = {
  gender?: string | null;
  category?: string | null;
  subcategory?: string | null;
  name?: string | null;
};

const lower = (v: string | null | undefined) => (v ?? "").toLowerCase();

/** Kids' products (baby, boys, girls) get no try-on button. */
export function isKidsProduct(p: Classifiable) {
  return lower(p.gender) === "kids" || /^(baby-)?(boys|girls)(-|$)/.test(lower(p.category));
}

/** Last resort for categories not listed below (e.g. women/sport/plus-size): read the product name. */
function kindFromName(name: string): GarmentKind {
  if (
    /\b(dress|jumpsuit|playsuit|romper|one[- ]?piece|bikini|kaftan|pyjama|pajama|set)\b/.test(name)
  )
    return "one-piece";
  if (
    /\b(jeans?|pants?|trousers?|shorts?(?!\s+sleeve)|skirt|leggings?|chinos?|joggers?|sweatpants?|cargos?)\b/.test(
      name,
    )
  )
    return "bottom";
  return "top";
}

function garmentKind(p: Classifiable): GarmentKind {
  const c = lower(p.category);
  const s = lower(p.subcategory);
  const men = lower(p.gender) === "men";

  // Covers the body from the shoulders down
  if (c === "dresses") return "one-piece";
  if (
    [
      "jumpsuits-playsuits",
      "dresses-jumpsuits",
      "dresses",
      "one-piece",
      "bikinis",
      "kaftans-cover-ups",
      "sleepwear",
    ].includes(s)
  )
    return "one-piece";
  if (s === "swimwear" && !men) return "one-piece";

  if (c === "tops" || c === "jackets-coats") return "top";
  if (c === "bottoms" || c === "jeans-pants-shorts") return "bottom";
  if (c === "formalwear") return s === "formal-pants" ? "bottom" : "top";
  if (c === "swimwear") return "bottom"; // men's swim shorts; women's swimwear is a one-piece, handled above
  if (c === "sport") {
    if (/bottoms|sweatpants|shorts/.test(s)) return "bottom";
    if (/hoodies|sweats|jackets|t-shirts/.test(s)) return "top";
  }
  if (c === "maternity" || c === "plus-size") {
    if (/^(bottoms|bottoms-skirts|jeans)$/.test(s)) return "bottom";
    if (/^(tops|jackets-coats)$/.test(s)) return "top";
  }
  return kindFromName(lower(p.name));
}

export type TryOnPlan = {
  slot: TryOnSlot;
  kind: GarmentKind;
  /** Short label for the dialog, e.g. "top" or "dress or one-piece" */
  label: string;
  /** What to tell the user about choosing the product photo */
  photoHint: string;
  /** Added to the prompt so the model knows what the garment is */
  promptHint: string;
};

const KIND_TEXT: Record<GarmentKind, { label: string; photoHint: string; instruction: string }> = {
  top: {
    label: "top",
    photoHint: "Choose the photo that shows the top most clearly.",
    instruction: "This garment is a top: replace only the person's top with it.",
  },
  bottom: {
    label: "bottom",
    photoHint:
      "Choose the photo that shows the bottom most clearly. Your own photo needs to show your legs.",
    instruction: "This garment is a bottom: replace only the person's bottoms with it.",
  },
  "one-piece": {
    label: "dress or one-piece",
    photoHint:
      "Choose the photo that shows the whole garment most clearly. Your own photo needs to show your full body.",
    // It is sent as the top, but the instruction above says "top", so this has to be explicit
    instruction:
      "This garment is a one-piece (a dress, jumpsuit or swimsuit that covers the body from the shoulders down), " +
      "even though it is given as the top garment: replace both the person's top and their bottoms with it.",
  },
};

/** "jeans-pants-shorts" -> "jeans pants shorts" */
const words = (slug: string) => slug.replace(/-/g, " ");

/** How to try this product on, or null when it can't be tried on (kids). */
export function tryOnPlanFor(p: Classifiable): TryOnPlan | null {
  if (isKidsProduct(p)) return null;
  const kind = garmentKind(p);
  const text = KIND_TEXT[kind];
  const where = [p.gender, p.category, p.subcategory]
    .filter(Boolean)
    .map((v) => words(lower(v)))
    .join(" › ");
  const promptHint =
    (where ? `Garment category: ${where}. ` : "") +
    (p.name ? `Product: ${p.name}. ` : "") +
    text.instruction;
  return {
    slot: kind === "bottom" ? "bottom" : "top",
    kind,
    label: text.label,
    photoHint: text.photoHint,
    promptHint,
  };
}
