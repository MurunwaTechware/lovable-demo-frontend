// Turns clothing sizes into body measurements, for the onboarding questionnaire. Sizes differ between
// brands, so every answer is a range (min..max cm) with a best guess in the middle. The backend stores
// them as "questionnaire" measurements, which a scan or the user's own tape measure can replace later.
//
// The tables are typical UK/SA sizing, also what most South African stores use:
//   jeans waist (W30, W32...): the label is in inches; most jeans fit a body waist from the label to about
//     2 inches more (vanity sizing and stretch)
//   women's sizes 6-28 (or the same as 30-52: 30 = 6, 32 = 8...): body waist 63 cm and hip 89 cm at size 8,
//     5 cm more for each size up
//   bras: the band is the underbust (32 in = 70 cm EU = 68-72 cm), and each cup letter is 2 cm more
//     difference between bust and underbust, starting at 10-12 cm for AA

export type Range = { value: number; min: number; max: number };

const round = (cm: number) => Math.round(cm * 2) / 2; // to the nearest half centimetre
const range = (min: number, max: number): Range => ({
  min: round(min),
  max: round(max),
  value: round((min + max) / 2),
});

// ── Waist and hips ──

export const JEANS_WAISTS = Array.from({ length: 23 }, (_, i) => 24 + i); // W24..W46

export function waistFromJeans(inches: number): Range {
  return range(inches * 2.54, (inches + 2) * 2.54);
}

/** UK/SA women's sizes, as people know them; the 30-52 numbering is the same scale, 24 higher */
export const DRESS_SIZES = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28];
export const dressSizeLabel = (uk: number) => `${uk} (${uk + 24})`;

export function waistHipFromDressSize(uk: number): { waist: Range; hip: Range } {
  const steps = (uk - 8) / 2;
  const waist = 63 + steps * 5;
  const hip = 89 + steps * 5;
  return { waist: range(waist - 2.5, waist + 2.5), hip: range(hip - 2.5, hip + 2.5) };
}

// ── Bust ──

export type BandSystem = "inches" | "cm";
export const BANDS: Record<BandSystem, number[]> = {
  inches: [28, 30, 32, 34, 36, 38, 40, 42, 44, 46], // UK/SA, e.g. 34C
  cm: [60, 65, 70, 75, 80, 85, 90, 95, 100, 105], //    EU, e.g. 75C
};
// The letters differ after D: UK/SA 34DD is EU 75E
export const CUPS: Record<BandSystem, string[]> = {
  inches: ["AA", "A", "B", "C", "D", "DD", "E", "F", "FF", "G", "GG", "H", "HH", "J"],
  cm: ["AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
};

export function bustFromBra(
  band: number,
  system: BandSystem,
  cup: string,
): { underbust: Range; bust: Range } | null {
  const i = CUPS[system].indexOf(cup);
  if (i < 0) return null;
  const eu = system === "cm" ? band : 70 + ((band - 32) / 2) * 5;
  const underbust = range(eu - 2, eu + 2);
  const diffMin = 10 + 2 * i;
  return { underbust, bust: range(underbust.min + diffMin, underbust.max + diffMin + 2) };
}

// ── Height ──

export const cmToFeetInches = (cm: number) => {
  const total = Math.round(cm / 2.54);
  return { feet: Math.floor(total / 12), inches: total % 12 };
};
export const feetInchesToCm = (feet: number, inches: number) =>
  Math.round((feet * 12 + inches) * 2.54);
