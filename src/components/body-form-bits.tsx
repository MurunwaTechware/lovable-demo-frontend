// Small form pieces shared by the body questionnaire, onboarding's "About you" and the twin editor
import { useState } from "react";

import { heightOk, inputClass, weightOk } from "@/lib/body-form";
import { cmToFeetInches, feetInchesToCm } from "@/lib/body-sizes";

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--plum)]">
      {children}
    </span>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`min-w-12 rounded-full border px-3.5 py-2 text-sm tabular-nums transition ${selected ? "border-[color:var(--plum)] bg-[color:var(--plum)] text-white" : "border-border hover:bg-accent"}`}
    >
      {children}
    </button>
  );
}

export function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap rounded-full bg-secondary p-1 text-xs sm:text-sm"
      role="radiogroup"
    >
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`rounded-full px-3.5 py-1.5 transition ${value === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Result({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-2xl bg-secondary/60 px-4 py-3 text-sm" aria-live="polite">
      {children}
    </p>
  );
}

export function HeightFeet({ cm, onChange }: { cm: number; onChange: (cm: number) => void }) {
  const { feet, inches } = cmToFeetInches(cm);
  return (
    <div className="flex items-end gap-2">
      <label className="block">
        <span className="block text-sm font-medium mb-2">Feet</span>
        <select
          value={feet}
          onChange={(e) => onChange(feetInchesToCm(Number(e.target.value), inches))}
          className={inputClass(false)}
        >
          {[3, 4, 5, 6, 7].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium mb-2">Inches</span>
        <select
          value={inches}
          onChange={(e) => onChange(feetInchesToCm(feet, Number(e.target.value)))}
          className={inputClass(false)}
        >
          {Array.from({ length: 12 }, (_, i) => i).map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Height in cm or feet and inches, with what it is in the other unit underneath */
export function HeightField({
  cm,
  onChange,
  label = "Height (cm)",
}: {
  cm: number;
  onChange: (cm: number) => void;
  label?: string;
}) {
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const ok = heightOk(cm);
  const { feet, inches } = cmToFeetInches(cm);
  return (
    <div>
      <div className="flex items-end gap-3 flex-wrap">
        {unit === "cm" ? (
          <label className="block">
            <span className="block text-sm font-medium mb-2">{label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={100}
              max={230}
              value={cm || ""}
              onChange={(e) => onChange(Number(e.target.value))}
              aria-invalid={!ok}
              className={inputClass(!ok)}
            />
          </label>
        ) : (
          <HeightFeet cm={cm} onChange={onChange} />
        )}
        <UnitToggle
          value={unit}
          options={[
            ["cm", "cm"],
            ["ft", "ft / in"],
          ]}
          onChange={(u) => setUnit(u as "cm" | "ft")}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">
        {ok ? `${feet}′${inches}″ · ${cm} cm` : "Enter a height between 100 and 230 cm."}
      </p>
    </div>
  );
}

export function WeightField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (typed: string) => void;
  placeholder?: string;
}) {
  const ok = weightOk(value);
  return (
    <label className="block max-w-xs">
      <span className="block text-sm font-medium mb-2">
        Weight (kg) <span className="text-muted-foreground font-normal">· optional</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={25}
        max={300}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!ok}
        className={inputClass(!ok)}
      />
      {!ok && (
        <span className="mt-1.5 block text-xs text-[color:var(--plum)]">
          Enter a weight between 25 and 300 kg.
        </span>
      )}
    </label>
  );
}
