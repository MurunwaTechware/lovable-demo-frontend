// The user's body profile from the onboarding questionnaire (backend: GET/PUT /me/body-profile), and the
// base body meshes it picks from. The meshes are Anny bodies (public/meshes): one per sex and build.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBodyProfile,
  saveBodyProfile,
  type BodyProfile,
  type BodyProfileAnswers,
  type BodyType,
} from "@/lib/api";

export type Sex = BodyProfileAnswers["sex"];

export const BODY_TYPES: { id: BodyType; label: string; hint: string }[] = [
  { id: "slim", label: "Slim", hint: "Lean, narrower frame" },
  { id: "average", label: "Average", hint: "In between" },
  { id: "fuller", label: "Fuller", hint: "Broader, more volume" },
];

export const SEXES: { id: Sex; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
];

/** The 3D model (GLB) and its picture for one sex and build */
export const meshFor = (sex: Sex, type: BodyType) => ({
  model: `/meshes/${sex}_${type}.glb`,
  image: `/meshes/${sex}_${type}.webp`,
});

export const BODY_PROFILE_KEY = ["body-profile"] as const;

export function useBodyProfile() {
  return useQuery<BodyProfile | null>({
    queryKey: BODY_PROFILE_KEY,
    queryFn: getBodyProfile,
    retry: 1,
  });
}

export function useSaveBodyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBodyProfile,
    onSuccess: (profile) => queryClient.setQueryData(BODY_PROFILE_KEY, profile),
  });
}

export const MEASUREMENT_NAMES = {
  height: "Height",
  bust: "Bust",
  underbust: "Underbust",
  waist: "Waist",
  hip: "Hips",
} as const;

export const SOURCE_LABELS = {
  questionnaire: "From your clothing sizes",
  scan: "From your scan",
  manual: "Entered by you",
} as const;
