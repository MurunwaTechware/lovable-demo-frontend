// Onboarding's quick answers (backend: GET/PUT /me/about-you): sex, height, weight and favourite colour,
// all optional. The body questionnaire and the scan page start from them rather than asking again.
// Age comes from the date of birth on onboarding's age step (trust-store), so it isn't asked twice.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAboutYou, saveAboutYou, type AboutYou } from "@/lib/api";
import type { TrustState } from "@/lib/trust-store";

export const ABOUT_YOU_KEY = ["about-you"] as const;

export function useAboutYou() {
  return useQuery<AboutYou | null>({ queryKey: ABOUT_YOU_KEY, queryFn: getAboutYou, retry: 1 });
}

export function useSaveAboutYou() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAboutYou,
    onSuccess: (about) => queryClient.setQueryData(ABOUT_YOU_KEY, about),
  });
}

/** The swatches for "favourite colour". The IDs are the backend's (about_you.py COLOURS). */
export const COLOURS: { id: string; label: string; hex: string }[] = [
  { id: "black", label: "Black", hex: "#1c1a1a" },
  { id: "white", label: "White", hex: "#f7f5f2" },
  { id: "grey", label: "Grey", hex: "#9a9897" },
  { id: "navy", label: "Navy", hex: "#1f2a4d" },
  { id: "blue", label: "Blue", hex: "#3d73c4" },
  { id: "green", label: "Green", hex: "#3f8a5a" },
  { id: "olive", label: "Olive", hex: "#6f7341" },
  { id: "yellow", label: "Yellow", hex: "#e8c547" },
  { id: "orange", label: "Orange", hex: "#e07b39" },
  { id: "red", label: "Red", hex: "#c23a3a" },
  { id: "pink", label: "Pink", hex: "#e6a3b8" },
  { id: "purple", label: "Purple", hex: "#6e4a8f" },
  { id: "brown", label: "Brown", hex: "#7a5035" },
  { id: "beige", label: "Beige", hex: "#d9c6a5" },
];

/** Whole years from onboarding's date of birth, or null without one */
export function ageFromDob(dob: TrustState["dob"]): number | null {
  if (!dob) return null;
  const y = parseInt(dob.year, 10);
  const m = parseInt(dob.month, 10);
  const d = parseInt(dob.day, 10);
  if (!y || !m || !d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 && age <= 130 ? age : null;
}

/**
 * Keeps About you's sex, height and weight in step with the twin when it's saved, so the scan page and
 * the questionnaire start from the latest ones. Leaves the favourite colour as it is.
 */
export function useKeepAboutYouInStep() {
  const about = useAboutYou();
  const save = useSaveAboutYou();
  return (sex: "female" | "male", heightCm: number, weightKg: number | null) => {
    const a = about.data;
    if (a && a.sex === sex && a.height_cm === heightCm && a.weight_kg === weightKg) return;
    save.mutate({
      sex,
      height_cm: heightCm,
      weight_kg: weightKg,
      favourite_colour: a?.favourite_colour ?? null,
    });
  };
}
