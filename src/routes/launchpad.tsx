import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, RotateCcw, Rocket, Sun } from "lucide-react";
import { ActionButton, Panel, Slider, StationShell } from "@/components/StationShell";
import { DialogueBanner, type Dialogue } from "@/components/DialogueBanner";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/launchpad")({
  head: () => ({
    meta: [
      { title: "Rocket Launchpad & Orbital Simulator — AI Science Lab" },
      {
        name: "description",
        content:
          "Dial in fuel, thrust and payload to reach a stable orbit, read live telemetry, and blow up the Sun in supernova sandbox mode.",
      },
      { property: "og:title", content: "Rocket Launchpad & Orbital Simulator" },
      {
        property: "og:description",
        content: "Semi-realistic rocket physics with a sweet-spot hint gauge and real orbital facts.",
      },
    ],
  }),
  component: LaunchpadStation,
});

type Outcome = "idle" | "flying" | "short" | "orbit" | "deepspace";

const SPACE_FACTS: Dialogue[] = [
  {
    title: "The rocket equation",
    body: "Delta-v equals exhaust velocity times the natural log of (wet mass / dry mass). Because it is a logarithm, doubling your fuel does not double your speed — this is the tyranny of the rocket equation.",
  },
  {
    title: "Orbit is sideways, not up",
    body: "Reaching 100 km altitude is easy; staying there needs about 7.8 km/s of horizontal speed. That is why rockets pitch over and fly nearly parallel to the ground.",
  },
  {
    title: "Staging saves mass",
    body: "Dropping empty tanks mid-flight removes dead weight, so the remaining engines accelerate less mass. Every orbital rocket ever flown has used staging.",
  },
  {
    title: "Chandrasekhar limit",
    body: "A white dwarf heavier than about 1.4 solar masses cannot hold itself up with electron pressure. Cross that limit and it detonates as a type Ia supernova.",
  },
  {
    title: "Solar flares",
    body: "Flares release energy stored in twisted magnetic fields. The 1859 Carrington Event set telegraph paper alight; the same storm today would knock out satellites and power grids.",
  },
];

export default function LaunchpadStation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fuel, setFuel] = useState(60);
  const [thrust, setThrust] = useState(55);
  const [payload, setPayload] = useState(20);
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const [attempts, setAttempts] = useState(0);
  const [revealBand, setRevealBand] = useState(false);
  const [telemetry, setTelemetry] = useState({ alt: 0, vel: 0, dv: 0, stage: 0 });
  const [factIdx, setFactIdx] = useState(-1);
  const [supernova, setSupernova] = useState(false);
  const [dialogue, setDialogue] = useState<Dialogue>({
    title: "Pre-flight briefing",
    body: "More fuel means more delta-v but also more mass to lift. Find the band where you reach roughly 7.8 km/s without wasting your return fuel. After each attempt I'll show you where the sweet spot sits.",
  });

  // --- simplified rocket-equation model -------------------------------------
  const dryMass = 12 + payload * 0.9;
  const wetMass = dryMass + fuel * 1.6;
  const exhaust = 2.4 + thrust * 0.032; // km/s effective
  const deltaV = exhaust * Math.log(wetMass / dryMass);
  const twr = (thrust * 2.4) / (wetMass * 0.098);
  const target = 7.8;
  const bandLow = target * 0.94;
  const bandHigh = target * 1.16;
  const verdict: Outcome =
    twr < 1.05 || deltaV < bandLow ? "short" : deltaV > bandHigh ? "deepspace" : "orbit";

  const sim = useRef({
    running: false,
    t: 0,
    alt: 0,
    vel: 0,
    verdict: "orbit" as Outcome,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; hue: number }[],
    shock: 0,
  });

  const nextFact = useCallback(() => {
    setFactIdx((i) => {
      const n = (i + 1) % SPACE_FACTS.length;
      setDialogue(SPACE_FACTS[n]);
      return n;
    });
  }, []);

  const launch = () => {
    sfx.liftoff();
    setOutcome("flying");
    setSupernova(false);
    const s = sim.current;
    s.running = true;
    s.t = 0;
    s.alt = 0;
    s.vel = 0;
    s.verdict = verdict;
    s.particles = [];
    setDialogue({
      title: "Liftoff",
      body: `Throttle up. Delta-v budget ${deltaV.toFixed(2)} km/s, thrust-to-weight ${twr.toFixed(2)}. Watch the telemetry.`,
    });
  };

  const reset = () => {
    sim.current.running = false;
    sim.current.shock = 0;
    setOutcome("idle");
    setSupernova(false);
    setTelemetry({ alt: 0, vel: 0, dv: 0, stage: 0 });
  };

  const blowUpSun = () => {
    sfx.explosion();
    setSupernova(true);
    setOutcome("idle");
    sim.current.running = false;
    sim.current.shock = 0.001;
    setDialogue({
      title: "Supernova sandbox",
      body: "Our Sun is actually too light for this — it will end as a red giant then a white dwarf. Stars above roughly eight solar masses collapse their iron cores in under a second and rebound as a type II supernova, briefly outshining their whole galaxy.",
    });
  };

  // --- canvas --------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 900;
    const H = 520;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      tw: Math.random() * Math.PI * 2,
      d: Math.random() * 0.5 + 0.1,
    }));

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = sim.current;

      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#07040f");
      g.addColorStop(0.6, "#0d0a24");
      g.addColorStop(1, "#150a2b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // nebula smudges
      [["#7c3aed", 200, 140, 180], ["#db2777", 700, 380, 220]].forEach(([c, x, y, r]) => {
        const ng = ctx.createRadialGradient(x as number, y as number, 0, x as number, y as number, r as number);
        ng.addColorStop(0, `${c as string}33`);
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, W, H);
      });

      stars.forEach((st) => {
        st.tw += dt * st.d * 6;
        ctx.globalAlpha = 0.4 + Math.sin(st.tw) * 0.35;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Earth limb
      const earthY = H + 240;
      const eg = ctx.createRadialGradient(W / 2, earthY, 180, W / 2, earthY, 330);
      eg.addColorStop(0, "#1b6ac9");
      eg.addColorStop(0.72, "#0f4d96");
      eg.addColorStop(1, "#031229");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(W / 2, earthY, 320, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,210,255,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W / 2, earthY, 322, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // supernova
      if (s.shock > 0) {
        s.shock += dt;
        const r = s.shock * 340;
        const sg = ctx.createRadialGradient(W / 2, 200, 0, W / 2, 200, Math.max(1, r));
        sg.addColorStop(0, "rgba(255,255,255,0.95)");
        sg.addColorStop(0.35, "rgba(255,196,86,0.7)");
        sg.addColorStop(0.7, "rgba(255,86,86,0.35)");
        sg.addColorStop(1, "transparent");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(W / 2, 200, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,240,200,${Math.max(0, 1 - s.shock / 3)})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(W / 2, 200, Math.max(1, r * 0.92), 0, Math.PI * 2);
        ctx.stroke();
        if (s.shock > 4) s.shock = 0;
      } else {
        // the Sun, small and calm
        const sung = ctx.createRadialGradient(W - 110, 90, 6, W - 110, 90, 70);
        sung.addColorStop(0, "#fff6d5");
        sung.addColorStop(0.4, "#ffcc55");
        sung.addColorStop(1, "transparent");
        ctx.fillStyle = sung;
        ctx.beginPath();
        ctx.arc(W - 110, 90, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // rocket flight
      if (s.running) {
        s.t += dt;
        const accel = twr * 9 - 9.8 * Math.max(0, 1 - s.alt / 90);
        s.vel += accel * dt * 0.35;
        s.alt += s.vel * dt * 2.2;

        if (s.verdict === "short" && s.t > 3.2) {
          s.vel -= 26 * dt;
        }
        if (s.t > 6.4) {
          s.running = false;
          setOutcome(s.verdict);
          setRevealBand(true);
          setAttempts((a) => a + 1);
          if (s.verdict === "orbit") {
            sfx.chime();
            setDialogue({
              title: "Stable orbit achieved",
              body: `Circularised at ${Math.round(180 + payload)} km with ${(deltaV - target).toFixed(2)} km/s of margin left for the return burn. This is roughly a low Earth orbit — the ISS sits at 400 km and laps the planet every 92 minutes.`,
            });
          } else if (s.verdict === "short") {
            sfx.explosion();
            setDialogue({
              title: "Failed to reach orbital velocity",
              body: `You built ${deltaV.toFixed(2)} km/s of delta-v and needed about ${target} km/s, so the vehicle arced over and re-entered. Add fuel or thrust — but watch the mass penalty.`,
            });
          } else {
            sfx.error();
            setDialogue({
              title: "Escape trajectory — crew stranded",
              body: `${deltaV.toFixed(2)} km/s overshot escape velocity (11.2 km/s from the surface). The vessel is on a hyperbolic path out of the system with no propellant left to brake. Trim the fuel back.`,
            });
          }
        }

        // thruster particles
        for (let i = 0; i < 5; i++) {
          s.particles.push({
            x: W / 2 + (Math.random() - 0.5) * 8,
            y: 0,
            vx: (Math.random() - 0.5) * 40,
            vy: 120 + Math.random() * 160,
            life: 1,
            hue: 20 + Math.random() * 40,
          });
        }
        setTelemetry({
          alt: Math.max(0, Math.round(s.alt)),
          vel: Math.max(0, Number((s.vel * 0.06).toFixed(2))),
          dv: Number(deltaV.toFixed(2)),
          stage: s.t > 3 ? 2 : 1,
        });
      }

      const rocketY = s.running || outcome !== "idle" ? Math.max(120, 400 - s.alt * 1.1) : 400;
      // particle trail
      s.particles = s.particles.filter((p) => p.life > 0);
      s.particles.forEach((p) => {
        p.life -= dt * 1.4;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `hsl(${p.hue} 100% 62%)`;
        ctx.beginPath();
        ctx.arc(p.x, rocketY + 30 + p.y * 0.25, 3.4 * p.life + 0.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // rocket
      const rx = W / 2;
      ctx.save();
      ctx.translate(rx, rocketY);
      if (s.verdict === "short" && !s.running && outcome === "short") ctx.rotate(2.6);
      ctx.fillStyle = "#e8eefc";
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.quadraticCurveTo(11, -12, 11, 22);
      ctx.lineTo(-11, 22);
      ctx.quadraticCurveTo(-11, -12, 0, -30);
      ctx.fill();
      ctx.fillStyle = "#a78bfa";
      ctx.fillRect(-11, -2, 22, 7);
      ctx.fillStyle = "#7c3aed";
      ctx.beginPath();
      ctx.moveTo(-11, 12);
      ctx.lineTo(-20, 26);
      ctx.lineTo(-11, 26);
      ctx.moveTo(11, 12);
      ctx.lineTo(20, 26);
      ctx.lineTo(11, 26);
      ctx.fill();
      if (s.running) {
        ctx.fillStyle = "rgba(255,190,90,0.9)";
        ctx.beginPath();
        ctx.moveTo(-7, 24);
        ctx.lineTo(0, 24 + 26 + Math.random() * 16);
        ctx.lineTo(7, 24);
        ctx.fill();
      }
      ctx.restore();

      if (!s.running && outcome === "short") {
        const fg = ctx.createRadialGradient(rx, rocketY, 2, rx, rocketY, 60);
        fg.addColorStop(0, "rgba(255,220,140,0.9)");
        fg.addColorStop(0.5, "rgba(255,120,40,0.6)");
        fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(rx, rocketY, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [twr, deltaV, outcome, payload]);

  const statusText =
    outcome === "orbit"
      ? "STABLE ORBIT"
      : outcome === "short"
        ? "RE-ENTRY / LOSS OF VEHICLE"
        : outcome === "deepspace"
          ? "STRANDED — ESCAPE TRAJECTORY"
          : outcome === "flying"
            ? "ASCENDING"
            : "STANDBY";

  return (
    <StationShell theme="theme-space" eyebrow="Station 02 · deep space" title="Rocket Launchpad & Orbital Simulator">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden !p-0">
          <div className="relative">
            <canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: "900 / 520" }} aria-label="Rocket launch simulation" />
            <div className="pointer-events-none absolute left-3 top-3 rounded-xl panel-glass px-3 py-2 font-mono text-[11px] leading-relaxed text-station">
              <p>ALT {telemetry.alt.toString().padStart(4, "0")} km</p>
              <p>VEL {telemetry.vel.toFixed(2)} km/s</p>
              <p>Δv {telemetry.dv.toFixed(2)} km/s</p>
              <p>STAGE {telemetry.stage || "—"}</p>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 rounded-xl panel-glass px-3 py-2 text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">status</p>
              <p className="font-display text-sm font-bold text-station text-glow">{statusText}</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Vehicle configuration">
            <div className="space-y-4">
              <Slider label="Fuel mass" value={fuel} min={5} max={100} unit=" t" onChange={setFuel} hint="More delta-v, but heavier to lift" />
              <Slider label="Engine thrust" value={thrust} min={10} max={100} unit=" %" onChange={setThrust} hint="Sets exhaust velocity and TWR" />
              <Slider label="Payload" value={payload} min={2} max={60} unit=" t" onChange={setPayload} hint="Crew, cargo and return propellant" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
              <p className="rounded-lg bg-station-soft p-2">Δv {deltaV.toFixed(2)} km/s</p>
              <p className="rounded-lg bg-station-soft p-2">TWR {twr.toFixed(2)}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton onClick={launch} disabled={outcome === "flying"}>
                <Rocket className="h-4 w-4" /> Launch
              </ActionButton>
              <ActionButton variant="ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Reset pad
              </ActionButton>
              <ActionButton variant="danger" onClick={blowUpSun}>
                <Sun className="h-4 w-4" /> Explode the Sun
              </ActionButton>
            </div>
          </Panel>

          <Panel title={`Sweet-spot gauge · attempt ${attempts}`}>
            {revealBand ? (
              <>
                <div className="relative h-6 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="absolute inset-y-0 bg-good/40"
                    style={{ left: `${(bandLow / 16) * 100}%`, width: `${((bandHigh - bandLow) / 16) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-1 bg-station"
                    style={{ left: `${Math.min(99, (deltaV / 16) * 100)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span className="text-good">orbit band {bandLow.toFixed(1)}–{bandHigh.toFixed(1)} km/s</span>
                  <span>16 km/s</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {verdict === "orbit"
                    ? "You're inside the band. Nudge the payload up for a harder run."
                    : verdict === "short"
                      ? "Below the band — add fuel or thrust, a little at a time."
                      : "Above the band — trim fuel or add payload mass to stay captured."}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Launch once and I'll reveal the delta-v band you need to hit.
              </p>
            )}
          </Panel>

          <Panel title="Astrophysics notes">
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2"><Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-station" /> Escape velocity from Earth's surface: 11.2 km/s. Low Earth orbit needs only ~7.8 km/s, sideways.</li>
              <li className="flex gap-2"><Sun className="mt-0.5 h-3.5 w-3.5 shrink-0 text-station" /> The Sun fuses ~600 million tonnes of hydrogen per second and is about halfway through its main-sequence life.</li>
              <li className="flex gap-2"><Rocket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-station" /> A type Ia supernova fires when a white dwarf passes the Chandrasekhar limit of ~1.4 solar masses.</li>
            </ul>
          </Panel>
        </div>
      </div>

      {supernova ? (
        <Panel title="Stellar lifecycle" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-3 text-xs leading-relaxed text-muted-foreground">
            <p><span className="font-display text-sm font-bold text-station">Main sequence</span><br />Hydrogen fuses to helium in the core. Our Sun has done this for 4.6 billion years and has roughly 5 billion left.</p>
            <p><span className="font-display text-sm font-bold text-station">Red giant</span><br />The core contracts, the envelope swells past Earth's orbit, then puffs away as a planetary nebula.</p>
            <p><span className="font-display text-sm font-bold text-station">Supernova path</span><br />Stars above ~8 solar masses build an iron core, collapse in under a second and rebound, seeding space with heavy elements.</p>
          </div>
        </Panel>
      ) : null}

      <div className="h-28" />
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 px-3">
        <DialogueBanner dialogue={dialogue} speaker="Sparky" onNext={nextFact} />
      </div>
    </StationShell>
  );
}
