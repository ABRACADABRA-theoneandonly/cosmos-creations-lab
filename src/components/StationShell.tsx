import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { sfx } from "@/lib/audio";
import { SoundToggle } from "@/components/SoundToggle";

export function StationShell({
  theme,
  eyebrow,
  title,
  children,
  backdrop,
}: {
  theme: "theme-genetics" | "theme-space" | "theme-volcano" | "theme-sand";
  eyebrow: string;
  title: string;
  children: ReactNode;
  backdrop?: ReactNode;
}) {
  return (
    <div className={`${theme} relative min-h-screen overflow-hidden bg-background`}>
      <div className="pointer-events-none absolute inset-0 grid-floor opacity-40" />
      {backdrop}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/"
            onClick={() => sfx.back()}
            className="inline-flex items-center gap-2 rounded-full panel-glass px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-station-soft"
          >
            <ArrowLeft className="h-4 w-4" />
            Lab hub
          </Link>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-station">
              {eyebrow}
            </p>
            <h1 className="font-display text-lg font-bold text-glow sm:text-2xl">{title}</h1>
          </div>
        </header>
        {children}
      </div>
      <div className="fixed bottom-4 right-4 z-30">
        <SoundToggle />
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl panel-glass p-4 ${className}`}>
      {title ? (
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-station">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block select-none">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-station">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
          sfx.blip();
        }}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary"
      />
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const styles =
    variant === "primary"
      ? "bg-station text-primary-foreground station-glow hover:brightness-110"
      : variant === "danger"
        ? "bg-destructive text-destructive-foreground hover:brightness-110"
        : "panel-glass text-foreground hover:bg-station-soft";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        sfx.click();
        onClick?.();
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-display text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.click();
        onChange(!checked);
      }}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
        checked
          ? "border-transparent bg-station-soft text-foreground station-glow"
          : "border-panel-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full ${checked ? "bg-station" : "bg-secondary"}`}
      />
      {label}
    </button>
  );
}
