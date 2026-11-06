// Checks and styles shared by the body forms (components/body-form-bits.tsx and the pages using them)

export const heightOk = (cm: number) => cm >= 100 && cm <= 230;
/** Weight is optional: empty is fine */
export const weightOk = (typed: string) =>
  typed.trim() === "" || (Number(typed) >= 25 && Number(typed) <= 300);

export function inputClass(invalid: boolean) {
  return `w-32 h-12 rounded-xl border bg-background px-4 text-base outline-none transition focus:ring-2 focus:ring-ring ${invalid ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : "border-border"}`;
}
