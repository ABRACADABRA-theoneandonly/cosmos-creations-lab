import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Mountain, Zap } from "lucide-react";
import { ActionButton, Panel, Slider, StationShell, Toggle } from "@/components/StationShell";
import { DialogueBanner, type Dialogue } from "@/components/DialogueBanner";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/volcano")({
  head: () => ({
    meta: [
      { title: "Volcanology & Magma Chamber — AI Science Lab" },
      {
        name: "description",
        content:
          "Tune gas pressure and silica content to switch between gentle Hawaiian lava flows and catastrophic Plinian blasts, with real eruption comparisons.",
      },
      { property: "og:title", content: "Volcanology & Magma Chamber" },
      {
        property: "og:description",
        content: "A dark, smoky magma lab where two dials decide how violently the mountain erupts.",
      },
    ],
  }),
  component: VolcanoStation,
});

type EruptionStyle = "Hawaiian" | "Strombolian" | "Vulcanian" | "Plinian";

const COMPARISONS: Record<EruptionStyle, { name: string; vei: string; fact: string }> = {
  Hawaiian: {
    name: "Kilauea, Hawaii (ongoing)",
    vei: "VEI 0–1",
    fact: "Runny basaltic lava with only ~50% silica lets gas escape gently, so lava fountains and flows travel for kilometres while people watch from a road.",
  },
  Strombolian: {
    name: "Stromboli, Italy",
    vei: "VEI 1–2",
    fact: "Stromboli has burped incandescent bombs every few minutes for over 2,000 years, earning it the name 'Lighthouse of the Mediterranean'.",
  },
  Vulcanian: {
    name: "Mount St. Helens, USA (1980)",
    vei: "VEI 5",
    fact: "A magnitude 5.1 quake collapsed the north flank, the depressurised magma flashed to gas, and the lateral blast flattened 600 km² of forest in minutes.",
  },
  Plinian: {
    name: "Krakatoa 1883 / Vesuvius 79 CE",
    vei: "VEI 6",
    fact: "Sticky, gas-charged rhyolitic magma builds an ash column over 30 km high. At Pompeii the column collapsed into pyroclastic surges at 700 °C that killed within seconds.",
  },
};

const VOLCANO_FACTS: Dialogue[] = [
  {
    title: "Why silica matters",
    body: "Silica tetrahedra link into chains, and more chains mean stickier magma. Basalt at 50% silica pours like syrup; rhyolite at 70% is stiff enough to plug the vent until pressure wins.",
  },
  {
    title: "Ash-cloud lightning",
    body: "Ash particles grind together and build static charge, exactly like a thunderstorm's ice crystals. Volcanic lightning was photographed clearly at Eyjafjallajökull in 2010.",
  },
  {
    title: "Pyroclastic flows",
    body: "These are avalanches of gas and ash at 200–700 °C moving up to 700 km/h. They hug the ground, so a ridge offers no protection — they killed most of the victims at Pompeii and Herculaneum.",
  },
  {
    title: "Volcanic winter",
    body: "Tambora in 1815 injected so much sulphur dioxide into the stratosphere that 1816 became the 'year without a summer', with June snow in New England and failed harvests in Europe.",
  },
];

export default function VolcanoStation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [depth, setDepth] = useState(6);
  const [silica, setSilica] = useState(58);
  const [pressure, setPressure] = useState(45);
  const [pyroclastic, setPyroclastic] = useState(false);
  const [bombs, setBombs] = useState(false);
  const [ashPlume, setAshPlume] = useState(true);
  const [lightning, setLightning] = useState(false);
  const [erupting, setErupting] = useState(false);
  const [factIdx, setFactIdx] = useState(-1);
  const [dialogue, setDialogue] = useState<Dialogue>({
    title: "Magma chamber online",
    body: "Two dials decide everything here: gas pressure and silica content. Viscosity is calculated from silica automatically, because that's how real magma behaves.",
  });

  const viscosity = useMemo(() => Math.round(((silica - 45) / 30) * 90 + 8), [silica]);
  const explosivity = useMemo(
    () => Math.round((pressure * 0.62 + (silica - 45) * 1.9 + depth * 1.6) * 0.78),
    [pressure, silica, depth],
  );
  const style: EruptionStyle =
    explosivity > 72 ? "Plinian" : explosivity > 52 ? "Vulcanian" : explosivity > 32 ? "Strombolian" : "Hawaiian";
  const comparison = COMPARISONS[style];

  const state = useRef({
    erupting: false,
    t: 0,
    shake: 0,
    particles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
      kind: "ash" | "lava" | "bomb" | "flow";
    }[],
    seis: new Array<number>(160).fill(0),
    bolt: 0,
  });

  const nextFact = useCallback(() => {
    setFactIdx((i) => {
      const n = (i + 1) % VOLCANO_FACTS.length;
      setDialogue(VOLCANO_FACTS[n]);
      return n;
    });
  }, []);

  const erupt = () => {
    sfx.rumble();
    if (explosivity > 60) sfx.explosion();
    setErupting(true);
    state.current.erupting = true;
    state.current.t = 0;
    state.current.shake = Math.min(1, explosivity / 70);
    setDialogue({
      title: `${style} eruption`,
      body: `${silica}% silica gives a viscosity index of ${viscosity}, and ${pressure}% gas pressure at ${depth} km depth pushes the explosivity index to ${explosivity}. Closest real analogue: ${comparison.name}. ${comparison.fact}`,
    });
  };

  const stop = () => {
    state.current.erupting = false;
    setErupting(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 900;
    const H = 560;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const ventX = W / 2;
    const ventY = 250;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = state.current;
      s.t += dt;
      s.shake *= 0.985;

      const shakeX = s.erupting ? (Math.random() - 0.5) * s.shake * 8 : 0;
      const shakeY = s.erupting ? (Math.random() - 0.5) * s.shake * 6 : 0;

      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(shakeX, shakeY);

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0a0710");
      sky.addColorStop(0.55, "#170b12");
      sky.addColorStop(1, "#2a0f0b");
      ctx.fillStyle = sky;
      ctx.fillRect(-20, -20, W + 40, H + 40);

      // glow above vent
      const vg = ctx.createRadialGradient(ventX, ventY, 8, ventX, ventY, 260);
      vg.addColorStop(0, `rgba(255,150,60,${s.erupting ? 0.5 : 0.22})`);
      vg.addColorStop(1, "transparent");
      ctx.fillStyle = vg;
      ctx.fillRect(-20, -20, W + 40, H + 40);

      // mountain silhouette (obsidian)
      const mg = ctx.createLinearGradient(0, ventY, 0, H);
      mg.addColorStop(0, "#241a22");
      mg.addColorStop(1, "#0c0810");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.moveTo(-20, H);
      ctx.lineTo(180, 430);
      ctx.lineTo(330, 330);
      ctx.lineTo(ventX - 58, ventY + 14);
      ctx.lineTo(ventX + 58, ventY + 14);
      ctx.lineTo(600, 340);
      ctx.lineTo(760, 440);
      ctx.lineTo(W + 20, H);
      ctx.closePath();
      ctx.fill();

      // glowing cracks
      ctx.strokeStyle = `rgba(255,120,40,${0.4 + Math.sin(s.t * 2) * 0.2})`;
      ctx.lineWidth = 2;
      [[ventX - 40, ventY + 20, 300, 430], [ventX + 36, ventY + 22, 620, 400], [ventX, ventY + 30, 470, 500]].forEach(
        ([x1, y1, x2, y2]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo((x1 + x2) / 2 + 20, (y1 + y2) / 2, x2, y2);
          ctx.stroke();
        },
      );

      // magma chamber underground
      const chamberY = H - 40 - depth * 2;
      const cg = ctx.createRadialGradient(ventX, chamberY, 10, ventX, chamberY, 120);
      cg.addColorStop(0, "#ffd08a");
      cg.addColorStop(0.4, "#ff6a1f");
      cg.addColorStop(1, "rgba(120,20,10,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(ventX, chamberY, 130, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      // conduit
      ctx.strokeStyle = "rgba(255,110,40,0.65)";
      ctx.lineWidth = 8 + (100 - viscosity) * 0.06;
      ctx.beginPath();
      ctx.moveTo(ventX, chamberY);
      ctx.lineTo(ventX, ventY + 10);
      ctx.stroke();
      // bubbling gas in chamber
      for (let i = 0; i < 8; i++) {
        const p = (s.t * 0.5 + i / 8) % 1;
        ctx.fillStyle = `rgba(255,220,160,${0.5 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(ventX - 60 + i * 16, chamberY - p * 40, 2 + (pressure / 100) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // spawn eruption particles
      if (s.erupting) {
        const rate = 4 + Math.round(explosivity / 8);
        for (let i = 0; i < rate; i++) {
          const explosive = explosivity > 45;
          const spread = explosive ? 2.4 : 0.8;
          s.particles.push({
            x: ventX + (Math.random() - 0.5) * 30,
            y: ventY,
            vx: (Math.random() - 0.5) * 60 * spread,
            vy: -(60 + Math.random() * (explosivity * 5)),
            life: 1,
            size: 2 + Math.random() * (explosive ? 5 : 3),
            kind: explosive && Math.random() > 0.45 ? "ash" : "lava",
          });
        }
        if (bombs && Math.random() > 0.9) {
          s.particles.push({
            x: ventX,
            y: ventY,
            vx: (Math.random() - 0.5) * 320,
            vy: -(220 + Math.random() * 220),
            life: 1,
            size: 7 + Math.random() * 6,
            kind: "bomb",
          });
        }
        if (pyroclastic && Math.random() > 0.86) {
          s.particles.push({
            x: ventX + (Math.random() - 0.5) * 60,
            y: ventY + 30,
            vx: (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 180),
            vy: 30 + Math.random() * 40,
            life: 1,
            size: 14 + Math.random() * 18,
            kind: "flow",
          });
        }
        if (lightning && Math.random() > 0.97) s.bolt = 0.25;
      }

      // update + draw particles
      s.particles = s.particles.filter((p) => p.life > 0 && p.y < H + 60);
      s.particles.forEach((p) => {
        const drag = p.kind === "ash" ? 0.6 : p.kind === "flow" ? 0.98 : 1;
        p.vy += (p.kind === "ash" ? 22 : 150) * dt;
        p.vx *= drag === 1 ? 1 : 1 - (1 - drag) * dt * 4;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * (p.kind === "ash" ? 0.24 : p.kind === "flow" ? 0.4 : 0.55);
        if (p.kind === "ash" && !ashPlume) p.life -= dt * 2;

        if (p.kind === "ash") {
          ctx.fillStyle = `rgba(${120 + p.life * 40},${104 + p.life * 30},${104 + p.life * 30},${0.42 * p.life})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (2.4 - p.life), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "flow") {
          ctx.fillStyle = `rgba(90,70,74,${0.5 * p.life})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.6 - p.life * 0.4), 0, Math.PI * 2);
          ctx.fill();
        } else {
          const hot = p.kind === "bomb" ? 0.9 : p.life;
          ctx.fillStyle = `hsl(${18 + hot * 26} 100% ${52 + hot * 22}%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ash-cloud lightning
      if (s.bolt > 0) {
        s.bolt -= dt;
        ctx.strokeStyle = `rgba(190,225,255,${Math.max(0, s.bolt * 3)})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        let lx = ventX + (Math.random() - 0.5) * 160;
        let ly = 40;
        ctx.moveTo(lx, ly);
        while (ly < ventY - 20) {
          lx += (Math.random() - 0.5) * 50;
          ly += 22;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }

      ctx.restore();

      // seismograph strip
      const amp = s.erupting ? 4 + explosivity * 0.32 : 1.2;
      s.seis.push((Math.random() - 0.5) * amp * (1 + Math.sin(s.t * 12) * 0.4));
      s.seis.shift();
      ctx.fillStyle = "rgba(8,6,12,0.85)";
      ctx.fillRect(0, H - 64, W, 64);
      ctx.strokeStyle = "rgba(255,146,71,0.9)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      s.seis.forEach((v, i) => {
        const x = (i / s.seis.length) * W;
        const y = H - 32 + v * 3.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.font = "600 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,180,130,0.8)";
      ctx.fillText(`SEISMIC · M ${(amp / 8 + 0.4).toFixed(1)} · TREMOR ${s.erupting ? "ACTIVE" : "BACKGROUND"}`, 12, H - 48);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [depth, viscosity, pressure, explosivity, bombs, pyroclastic, ashPlume, lightning]);

  return (
    <StationShell theme="theme-volcano" eyebrow="Station 03 · volcanology" title="Magma Chamber Control">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden !p-0">
          <canvas
            ref={canvasRef}
            className="block w-full"
            style={{ aspectRatio: "900 / 560" }}
            aria-label="Volcano eruption simulation with seismograph"
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Chamber controls">
            <div className="space-y-4">
              <Slider label="Chamber depth" value={depth} min={2} max={18} unit=" km" onChange={setDepth} hint="Deeper chambers hold more dissolved gas" />
              <Slider label="Silica content" value={silica} min={45} max={75} unit=" %" onChange={setSilica} hint="45% basalt → 75% rhyolite" />
              <Slider label="Gas pressure" value={pressure} min={0} max={100} unit=" %" onChange={setPressure} hint="Dissolved H₂O and CO₂" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
              <p className="rounded-lg bg-station-soft p-2">Viscosity {viscosity} <span className="text-muted-foreground">(derived)</span></p>
              <p className="rounded-lg bg-station-soft p-2">Explosivity {explosivity}</p>
            </div>
            <p className="mt-3 font-display text-lg font-bold text-station text-glow">{style} style</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton onClick={erupt}>
                <Mountain className="h-4 w-4" /> Trigger eruption
              </ActionButton>
              <ActionButton variant="ghost" onClick={stop} disabled={!erupting}>
                <Activity className="h-4 w-4" /> Settle chamber
              </ActionButton>
            </div>
          </Panel>

          <Panel title="Hazard toggles">
            <div className="grid grid-cols-2 gap-2">
              <Toggle label="Pyroclastic flows" checked={pyroclastic} onChange={setPyroclastic} />
              <Toggle label="Volcanic bombs" checked={bombs} onChange={setBombs} />
              <Toggle label="Ash plume" checked={ashPlume} onChange={setAshPlume} />
              <Toggle label="Ash lightning" checked={lightning} onChange={setLightning} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {pyroclastic
                ? "Pyroclastic flow armed: ground-hugging clouds of gas and ash at up to 700 °C and 700 km/h."
                : bombs
                  ? "Volcanic bombs armed: lava blobs over 64 mm across, thrown ballistically and still molten on landing."
                  : lightning
                    ? "Ash lightning armed: colliding ash grains build static charge, just like ice in a thunderstorm."
                    : "Switch on a hazard to add it to the next eruption."}
            </p>
          </Panel>

          <Panel title="Real-world comparison">
            <p className="font-display text-sm font-bold text-foreground">{comparison.name}</p>
            <p className="font-mono text-[11px] text-station">{comparison.vei}</p>
            <p className="mt-2 flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-station" />
              {comparison.fact}
            </p>
          </Panel>
        </div>
      </div>

      <div className="h-28" />
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 px-3">
        <DialogueBanner dialogue={dialogue} speaker="Dr. Byte" onNext={nextFact} />
      </div>
    </StationShell>
  );
}
