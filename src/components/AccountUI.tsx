// Small pieces shared by the /account pages.

import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  action,
  children,
  tone = "default",
  id,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  tone?: "default" | "danger";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-3xl border bg-card p-6 md:p-8 shadow-[var(--shadow-card)] scroll-mt-24 ${
        tone === "danger" ? "border-red-500/40" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className={`font-display text-2xl ${tone === "danger" ? "text-red-600 dark:text-red-400" : ""}`}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-3xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block" data-invalid={!!error}>
      <span className="block text-sm font-medium mb-2">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-[color:var(--plum)]" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export function inputClass(invalid: boolean) {
  return `w-full h-12 rounded-xl border bg-background px-4 text-base outline-none transition focus:ring-2 focus:ring-ring
    ${invalid ? "border-[color:var(--plum)] bg-[color:var(--plum)]/5" : "border-border"}`;
}

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 h-10 text-sm font-medium hover:opacity-90 transition disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 h-10 text-sm font-medium hover:bg-accent transition disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-full border border-red-500/50 text-red-600 dark:text-red-400 px-5 h-10 text-sm font-medium hover:bg-red-600 hover:text-white dark:hover:text-white transition disabled:opacity-50",
};

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "plum" | "good" | "bad";
}) {
  const tones = {
    muted: "bg-secondary text-muted-foreground",
    plum: "bg-[color:var(--plum)]/10 text-[color:var(--plum)]",
    good: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    bad: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-10 text-center">
      <span className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-secondary text-[color:var(--plum)]">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
