import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { sfx } from "@/lib/audio";

export type Dialogue = { title: string; body: string };

export function RobotAvatar({ size = 44 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-2xl bg-station-soft station-glow animate-lab-float"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="absolute inset-x-2 top-2 flex justify-between">
        <span className="h-1.5 w-1.5 rounded-full bg-station animate-lab-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-station animate-lab-pulse" />
      </span>
      <Sparkles className="h-4 w-4 translate-y-1.5 text-station" />
    </span>
  );
}

/** Sparky's dialogue drawer. Typewriter reveal + expand/collapse. */
export function DialogueBanner({
  dialogue,
  speaker = "Sparky",
  onNext,
}: {
  dialogue: Dialogue;
  speaker?: string;
  onNext?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(dialogue.body.slice(0, i));
      if (i % 8 === 0) sfx.blip();
      if (i >= dialogue.body.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [dialogue]);

  return (
    <div className="pointer-events-auto w-full">
      <div className="mx-auto max-w-3xl rounded-2xl panel-glass station-glow p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <RobotAvatar />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-display text-sm font-bold text-station text-glow">
                {speaker}: {dialogue.title}
              </p>
              <div className="flex items-center gap-1">
                {onNext ? (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      onNext();
                    }}
                    className="rounded-full border border-panel-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-station-soft hover:text-foreground"
                  >
                    Next fact
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={open ? "Hide tip" : "Show tip"}
                  onClick={() => {
                    sfx.click();
                    setOpen((o) => !o);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-station-soft hover:text-foreground"
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {open ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {shown}
                <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-station animate-lab-pulse" />
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
