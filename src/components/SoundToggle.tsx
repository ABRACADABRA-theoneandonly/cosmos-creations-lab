import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, sfx, subscribeMuted, toggleMuted } from "@/lib/audio";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
    return subscribeMuted(setMutedState);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        toggleMuted();
        if (isMuted() === false) sfx.click();
      }}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full panel-glass text-foreground transition-colors hover:bg-station-soft ${className}`}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-station" />}
    </button>
  );
}
