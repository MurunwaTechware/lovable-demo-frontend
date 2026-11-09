import { Info } from "lucide-react";

// Honest about the 3D body: it's made with Anny, which wasn't built from South African body data, so the
// shape can look unlike the user even when the numbers match. Shown wherever the twin's mesh is.
export function TwinShapeNote({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground ${className}`}
    >
      <Info className="h-3.5 w-3.5 shrink-0 mt-px text-[color:var(--plum)]" aria-hidden />
      <span>
        <span className="font-medium text-foreground">The 3D body is a guide.</span> It's made with
        Anny, a body model that wasn't built from South African bodies, so its shape may not look
        like yours even when your measurements match. Your measurements are what count.
      </span>
    </p>
  );
}
