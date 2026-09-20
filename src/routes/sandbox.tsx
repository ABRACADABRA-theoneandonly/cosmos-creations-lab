import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Flame, Pause, Play, SkipForward, Snowflake, Trash2 } from "lucide-react";
import { ActionButton, Panel, Slider, StationShell } from "@/components/StationShell";
import { DialogueBanner, type Dialogue } from "@/components/DialogueBanner";
import { sfx } from "@/lib/audio";
import {
  ACID,
  cssColor,
  EMPTY,
  FIRE,
  GUNPOWDER,
  ICE,
  LAVA,
  MATERIALS,
  METAL,
  OIL,
  PALETTE,
  PLANT,
  SALT,
  SALTWATER,
  SAND,
  STEAM,
  STONE,
  TEMP_MAX,
  TEMP_MIN,
  WATER,
} from "@/lab/materials";

export const Route = createFileRoute("/sandbox")({
  head: () => ({
    meta: [
      { title: "Element & Chemical Particle Sandbox — AI Science Lab" },
      {
        name: "description",
        content:
          "A falling-sand physics playground: melt ice with lava, boil water to steam, dissolve metal in acid and detonate gunpowder, with live cell temperatures.",
      },
      { property: "og:title", content: "Element & Chemical Particle Sandbox" },
      {
        property: "og:description",
        content: "Paint sand, water, lava and acid into a living chemistry grid and watch real reactions play out.",
      },
    ],
  }),
  component: SandboxStation,
});

const COLS = 150;
const ROWS = 96;
const CELL = 6;

type Tool = "material" | "heat" | "freeze" | "erase";

const PRESETS = [
  {
    id: "volcano",
    name: "Volcano in a Box",
    blurb:
      "Lava rises through a stone vent into a pool of water. Lava at 1200 °C flash-boils the water into steam and chills into solid stone — the same quenching that forms pillow basalt on the sea floor.",
  },
  {
    id: "acid",
    name: "Acid Etch Test",
    blurb:
      "Acid drips onto metal and stone plates. Each corrosion step consumes a little acid, which is why a real etch bath weakens as it works.",
  },
  {
    id: "oilfire",
    name: "Oil & Fire Cascade",
    blurb:
      "Oil floats on water because it is less dense, so a single spark spreads across the surface. Underneath, gunpowder waits — combustion there is fast and violently exothermic.",
  },
] as const;

const RULES = [
  { title: "Phase changes", body: "Ice melts above 0 °C; water freezes below 0 °C (brine below -9 °C); water boils to steam at 100 °C; steam condenses back below 95 °C." },
  { title: "Lava & stone", body: "Lava starts at 1200 °C, heats everything nearby, melts ice and metal, and solidifies into stone once it cools under 700 °C." },
  { title: "Combustion", body: "Fire needs fuel. It ignites oil and plants on contact and detonates gunpowder in a hot expanding burst, then dies out with nothing left to burn." },
  { title: "Dissolution", body: "Acid corrodes metal, stone and plants. Each reaction uses acid up, so a thin layer eventually stops eating." },
  { title: "Life & solutions", body: "Plants grow into empty space while touching water. Salt dissolves into water to make brine, lowering its freezing point." },
  { title: "Energy direction", body: "Melting and boiling absorb heat (endothermic). Burning and detonating release it (exothermic) — watch neighbouring cells glow." },
];

export default function SandboxStation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selected, setSelected] = useState<number>(SAND);
  const [tool, setTool] = useState<Tool>("material");
  const [brush, setBrush] = useState(4);
  const [speed, setSpeed] = useState(4);
  const [paused, setPaused] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [readout, setReadout] = useState<{ x: number; y: number; text: string } | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue>({
    title: "Sandbox ready",
    body: "Pick an element and draw on the grid. Switch to the heat or freeze brush to drag temperature around — every cell tracks its own temperature in Celsius, clamped between absolute zero and 3000 °C.",
  });

  const grid = useRef({
    cur: new Uint8Array(COLS * ROWS),
    temp: new Float32Array(COLS * ROWS).fill(22),
    life: new Float32Array(COLS * ROWS),
    stepOnce: false,
    paused: false,
    speed: 4,
    tool: "material" as Tool,
    selected: SAND,
    brush: 4,
    pointer: { down: false, x: -1, y: -1 },
    ring: [] as { x: number; y: number; a: number; hot: boolean }[],
  });

  // keep refs in sync with UI state
  useEffect(() => {
    grid.current.paused = paused;
    grid.current.speed = speed;
    grid.current.tool = tool;
    grid.current.selected = selected;
    grid.current.brush = brush;
  }, [paused, speed, tool, selected, brush]);

  const clear = useCallback(() => {
    grid.current.cur.fill(EMPTY);
    grid.current.temp.fill(22);
    grid.current.life.fill(0);
  }, []);

  const loadPreset = (id: (typeof PRESETS)[number]["id"]) => {
    const g = grid.current;
    clear();
    const set = (x: number, y: number, m: number) => {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
      const i = y * COLS + x;
      g.cur[i] = m;
      g.temp[i] = MATERIALS[m].temp;
      g.life[i] = m === FIRE ? 1 : 0;
    };
    if (id === "volcano") {
      for (let x = 0; x < COLS; x++) for (let y = ROWS - 6; y < ROWS; y++) set(x, y, STONE);
      for (let x = 50; x < 100; x++) for (let y = ROWS - 26; y < ROWS - 6; y++) set(x, y, WATER);
      for (let x = 70; x < 80; x++) for (let y = ROWS - 6; y < ROWS; y++) set(x, y, LAVA);
      for (let x = 30; x < 50; x++) for (let y = ROWS - 32; y < ROWS - 26; y++) set(x, y, ICE);
    } else if (id === "acid") {
      for (let x = 30; x < 70; x++) for (let y = 50; y < 58; y++) set(x, y, METAL);
      for (let x = 85; x < 125; x++) for (let y = 50; y < 58; y++) set(x, y, STONE);
      for (let x = 34; x < 66; x++) for (let y = 16; y < 26; y++) set(x, y, ACID);
      for (let x = 89; x < 121; x++) for (let y = 16; y < 26; y++) set(x, y, ACID);
      for (let x = 0; x < COLS; x++) for (let y = ROWS - 4; y < ROWS; y++) set(x, y, STONE);
    } else {
      for (let x = 0; x < COLS; x++) for (let y = ROWS - 4; y < ROWS; y++) set(x, y, STONE);
      for (let x = 20; x < 130; x++) for (let y = ROWS - 22; y < ROWS - 12; y++) set(x, y, WATER);
      for (let x = 20; x < 130; x++) for (let y = ROWS - 28; y < ROWS - 22; y++) set(x, y, OIL);
      for (let x = 40; x < 60; x++) for (let y = ROWS - 12; y < ROWS - 4; y++) set(x, y, GUNPOWDER);
      for (let x = 100; x < 110; x++) for (let y = ROWS - 12; y < ROWS - 4; y++) set(x, y, GUNPOWDER);
      for (let x = 70; x < 76; x++) set(x, ROWS - 30, FIRE);
    }
    const p = PRESETS.find((pp) => pp.id === id)!;
    sfx.chime();
    setPaused(false);
    setDialogue({ title: p.name, body: p.blurb });
  };

  // ------------------------------------------------------------ simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = COLS * CELL * dpr;
    canvas.height = ROWS * CELL * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const g = grid.current;
    const { cur, temp, life } = g;
    const idx = (x: number, y: number) => y * COLS + x;
    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
    const clampT = (t: number) => Math.max(TEMP_MIN, Math.min(TEMP_MAX, t));

    const swap = (a: number, b: number) => {
      const m = cur[a];
      cur[a] = cur[b];
      cur[b] = m;
      const t = temp[a];
      temp[a] = temp[b];
      temp[b] = t;
      const l = life[a];
      life[a] = life[b];
      life[b] = l;
    };

    const become = (i: number, m: number, t?: number) => {
      cur[i] = m;
      if (t !== undefined) temp[i] = clampT(t);
      life[i] = m === FIRE ? 0.8 + Math.random() * 0.6 : 0;
    };

    const explode = (x: number, y: number) => {
      const r = 6;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (!inside(x + dx, y + dy) || dx * dx + dy * dy > r * r) continue;
          const j = idx(x + dx, y + dy);
          const m = cur[j];
          if (m === STONE || m === METAL) continue;
          become(j, Math.random() > 0.25 ? FIRE : EMPTY, 900);
        }
      }
      sfx.explosion();
    };

    const neighbours = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];

    const step = () => {
      // ---- thermal diffusion ----
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const i = idx(x, y);
          const m = MATERIALS[cur[i]];
          let sum = 0;
          let n = 0;
          for (const [dx, dy] of neighbours) {
            if (!inside(x + dx, y + dy)) continue;
            const j = idx(x + dx, y + dy);
            sum += temp[j];
            n++;
          }
          if (!n) continue;
          const rate = 0.12 + m.conduct * 0.5;
          temp[i] = clampT(temp[i] + (sum / n - temp[i]) * rate);
          if (cur[i] === LAVA) temp[i] = Math.max(temp[i], 1050);
          if (cur[i] === FIRE) temp[i] = Math.max(temp[i], 700);
          if (cur[i] === EMPTY) temp[i] = clampT(temp[i] + (22 - temp[i]) * 0.02);
        }
      }

      // ---- reactions & phase changes ----
      for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
          const i = idx(x, y);
          const m = cur[i];
          if (m === EMPTY) continue;
          const t = temp[i];

          if (m === ICE && t > 0) become(i, WATER, t - 12);
          else if (m === WATER && t < 0) become(i, ICE, t);
          else if (m === SALTWATER && t < -9) become(i, ICE, t);
          else if ((m === WATER || m === SALTWATER) && t > 100) become(i, STEAM, t);
          else if (m === STEAM && t < 95) become(i, WATER, t);
          else if (m === LAVA && t < 700) become(i, STONE, t);
          else if (m === STONE && t > 1100) become(i, LAVA, t);
          else if (m === METAL && t > 1200) become(i, LAVA, t);
          else if (m === SAND && t > 1500) become(i, LAVA, t);
          else if (m === OIL && t > 250) become(i, FIRE, 800);
          else if (m === PLANT && t > 220) become(i, FIRE, 760);
          else if (m === GUNPOWDER && t > 220) {
            explode(x, y);
            continue;
          } else if (m === FIRE) {
            life[i] -= 0.035;
            if (life[i] <= 0) become(i, Math.random() > 0.7 ? STEAM : EMPTY, 260);
          }

          // neighbour interactions
          for (const [dx, dy] of neighbours) {
            if (!inside(x + dx, y + dy)) continue;
            const j = idx(x + dx, y + dy);
            const nm = cur[j];

            if (m === FIRE || m === LAVA) {
              temp[j] = clampT(Math.max(temp[j], m === LAVA ? 1000 : 700));
              if (nm === OIL || nm === PLANT) become(j, FIRE, 800);
              if (nm === GUNPOWDER) explode(x + dx, y + dy);
            }
            if (m === ACID && (nm === METAL || nm === STONE || nm === PLANT || nm === SAND)) {
              become(j, EMPTY, temp[j] + 6);
              if (Math.random() > 0.55) become(i, EMPTY, temp[i]);
            }
            if (m === SALT && (nm === WATER || nm === SALTWATER)) {
              become(j, SALTWATER, temp[j]);
              become(i, EMPTY, temp[i]);
            }
            if (m === PLANT && nm === WATER && Math.random() > 0.988) become(j, PLANT, temp[j]);
            if ((m === WATER || m === SALTWATER) && nm === FIRE) {
              become(j, STEAM, 160);
              temp[i] = clampT(temp[i] + 40);
            }
          }
        }
      }

      // ---- movement ----
      for (let y = ROWS - 1; y >= 0; y--) {
        const leftFirst = Math.random() > 0.5;
        for (let n = 0; n < COLS; n++) {
          const x = leftFirst ? n : COLS - 1 - n;
          const i = idx(x, y);
          const m = cur[i];
          if (m === EMPTY) continue;
          const mat = MATERIALS[m];
          if (mat.kind === "solid") continue;

          if (mat.kind === "gas" || m === FIRE) {
            const up = y - 1;
            const dir = Math.random() > 0.5 ? 1 : -1;
            if (inside(x, up) && cur[idx(x, up)] === EMPTY) swap(i, idx(x, up));
            else if (inside(x + dir, up) && cur[idx(x + dir, up)] === EMPTY) swap(i, idx(x + dir, up));
            else if (inside(x + dir, y) && cur[idx(x + dir, y)] === EMPTY && Math.random() > 0.4)
              swap(i, idx(x + dir, y));
            continue;
          }

          const below = y + 1;
          if (!inside(x, below)) continue;
          const bi = idx(x, below);
          const bm = cur[bi];
          const bmat = MATERIALS[bm];
          if (bm === EMPTY || (bmat.kind === "gas" && mat.kind !== "gas")) {
            swap(i, bi);
            continue;
          }
          // denser sinks through lighter liquid
          if (bmat.kind === "liquid" && mat.density > bmat.density) {
            swap(i, bi);
            continue;
          }
          const dir = Math.random() > 0.5 ? 1 : -1;
          const d1 = idx(x + dir, below);
          const d2 = idx(x - dir, below);
          if (inside(x + dir, below) && cur[d1] === EMPTY) swap(i, d1);
          else if (inside(x - dir, below) && cur[d2] === EMPTY) swap(i, d2);
          else if (mat.kind === "liquid") {
            const s1 = idx(x + dir, y);
            const s2 = idx(x - dir, y);
            const spread = m === LAVA ? 0.45 : 0.95;
            if (Math.random() < spread) {
              if (inside(x + dir, y) && cur[s1] === EMPTY) swap(i, s1);
              else if (inside(x - dir, y) && cur[s2] === EMPTY) swap(i, s2);
            }
          }
        }
      }
    };

    // ---- brush ----
    const paint = (dt: number) => {
      const p = g.pointer;
      if (!p.down || p.x < 0) return;
      const r = g.brush;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = p.x + dx;
          const y = p.y + dy;
          if (!inside(x, y) || dx * dx + dy * dy > r * r) continue;
          const i = idx(x, y);
          if (g.tool === "heat") {
            // rate-limited smooth thermal delta
            temp[i] = clampT(temp[i] + 520 * dt);
          } else if (g.tool === "freeze") {
            temp[i] = clampT(temp[i] - 520 * dt);
          } else if (g.tool === "erase") {
            become(i, EMPTY, 22);
          } else {
            const sel = g.selected;
            if (MATERIALS[sel].kind === "powder" || MATERIALS[sel].kind === "gas") {
              if (Math.random() > 0.35) become(i, sel, MATERIALS[sel].temp);
            } else become(i, sel, MATERIALS[sel].temp);
          }
        }
      }
      if (g.tool === "heat" || g.tool === "freeze") {
        g.ring.push({ x: p.x, y: p.y, a: 1, hot: g.tool === "heat" });
      }
    };

    // ---- render ----
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const draw = () => {
      ctx.fillStyle = "#07090f";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const i = idx(x, y);
          const m = cur[i];
          if (m === EMPTY) {
            const t = temp[i];
            if (t > 120) {
              ctx.fillStyle = `rgba(255,140,60,${Math.min(0.28, (t - 120) / 2200)})`;
              ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            } else if (t < -40) {
              ctx.fillStyle = `rgba(150,215,255,${Math.min(0.24, (-40 - t) / 500)})`;
              ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            }
            continue;
          }
          ctx.fillStyle = cssColor(m, temp[i]);
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
      // heat haze / frost rings
      g.ring = g.ring.filter((r) => r.a > 0);
      g.ring.forEach((r) => {
        r.a -= 0.05;
        const rad = (1.6 - r.a) * (g.brush * CELL);
        ctx.strokeStyle = r.hot
          ? `rgba(255,170,80,${r.a * 0.5})`
          : `rgba(170,225,255,${r.a * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x * CELL, r.y * CELL, Math.max(2, rad), 0, Math.PI * 2);
        ctx.stroke();
      });
      // brush outline
      if (g.pointer.x >= 0) {
        ctx.strokeStyle =
          g.tool === "heat"
            ? "rgba(255,160,70,0.9)"
            : g.tool === "freeze"
              ? "rgba(160,220,255,0.9)"
              : "rgba(232,196,106,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(g.pointer.x * CELL, g.pointer.y * CELL, g.brush * CELL, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      paint(dt);
      if (!g.paused || g.stepOnce) {
        acc += dt * (g.paused ? 60 : g.speed * 12);
        let guard = 0;
        while (acc >= 1 && guard < 8) {
          step();
          acc -= 1;
          guard++;
        }
        if (g.stepOnce) {
          g.stepOnce = false;
          acc = 0;
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // ---- pointer wiring ----
    const toCell = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.floor(((e.clientX - rect.left) / rect.width) * COLS),
        y: Math.floor(((e.clientY - rect.top) / rect.height) * ROWS),
      };
    };
    const updateReadout = (c: { x: number; y: number }, clientX: number, clientY: number) => {
      if (!inside(c.x, c.y)) {
        setReadout(null);
        return;
      }
      const i = idx(c.x, c.y);
      const mat = MATERIALS[cur[i]];
      const rect = canvas.getBoundingClientRect();
      setReadout({
        x: clientX - rect.left,
        y: clientY - rect.top,
        text: `${mat.name}: ${Math.round(temp[i])} °C`,
      });
    };
    const onDown = (e: PointerEvent) => {
      const c = toCell(e);
      g.pointer = { down: true, x: c.x, y: c.y };
      canvas.setPointerCapture(e.pointerId);
      if (g.tool === "heat" || g.tool === "freeze") sfx.sizzle();
      updateReadout(c, e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      const c = toCell(e);
      g.pointer.x = c.x;
      g.pointer.y = c.y;
      updateReadout(c, e.clientX, e.clientY);
    };
    const onUp = () => {
      g.pointer.down = false;
    };
    const onLeave = () => {
      g.pointer.down = false;
      g.pointer.x = -1;
      setReadout(null);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const toolBtn = (t: Tool, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => {
        sfx.click();
        setTool(t);
      }}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
        tool === t
          ? "bg-station text-primary-foreground station-glow"
          : "panel-glass text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <StationShell theme="theme-sand" eyebrow="Station 04 · particle physics" title="Element & Chemical Sandbox">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel className="relative overflow-hidden !p-2">
            <canvas
              ref={canvasRef}
              className="block w-full touch-none rounded-lg"
              style={{ aspectRatio: `${COLS} / ${ROWS}`, imageRendering: "pixelated" }}
              aria-label="Falling sand particle simulation grid. Draw with the pointer."
            />
            {readout ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 translate-y-3 whitespace-nowrap rounded-md bg-background/90 px-2 py-1 font-mono text-[11px] text-station"
                style={{ left: readout.x + 8, top: readout.y + 8 }}
              >
                {readout.text}
              </div>
            ) : null}
          </Panel>

          <Panel title="Brush & simulation">
            <div className="flex flex-wrap items-center gap-2">
              {toolBtn("material", "Element", <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cssColor(selected, MATERIALS[selected].temp) }} />)}
              {toolBtn("heat", "Heat brush", <Flame className="h-3.5 w-3.5" />)}
              {toolBtn("freeze", "Freeze brush", <Snowflake className="h-3.5 w-3.5" />)}
              {toolBtn("erase", "Eraser", <Eraser className="h-3.5 w-3.5" />)}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Slider label="Brush radius" value={brush} min={1} max={14} unit=" cells" onChange={setBrush} />
              <Slider label="Simulation speed" value={speed} min={1} max={10} unit="×" onChange={setSpeed} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton onClick={() => setPaused((p) => !p)}>
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? "Play" : "Pause"}
              </ActionButton>
              <ActionButton
                variant="ghost"
                onClick={() => {
                  setPaused(true);
                  grid.current.stepOnce = true;
                }}
              >
                <SkipForward className="h-4 w-4" /> Step
              </ActionButton>
              <ActionButton variant="ghost" onClick={clear}>
                <Trash2 className="h-4 w-4" /> Clear
              </ActionButton>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Temperatures are clamped between {TEMP_MIN} °C (absolute zero) and {TEMP_MAX} °C, and the
              heat and freeze brushes ramp smoothly while you drag instead of spiking.
            </p>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Materials palette">
            <div className="space-y-3">
              {PALETTE.map((group) => (
                <div key={group.category}>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.ids.map((id) => {
                      const m = MATERIALS[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          title={`${m.name} — ${m.props}`}
                          onClick={() => {
                            sfx.click();
                            setSelected(id);
                            setTool("material");
                            setDialogue({ title: m.name, body: m.props });
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition ${
                            selected === id && tool === "material"
                              ? "bg-station text-primary-foreground font-bold"
                              : "border border-panel-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full ring-1 ring-black/30"
                            style={{ backgroundColor: cssColor(id, m.temp) }}
                          />
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-station-soft p-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">{MATERIALS[selected].name}:</span>{" "}
              {MATERIALS[selected].props}
            </p>
          </Panel>

          <Panel title="Preset experiments">
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadPreset(p.id)}
                  className="w-full rounded-xl border border-panel-border px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-station-soft"
                >
                  {p.name}
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {p.blurb.split(".")[0]}.
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setRulesOpen((o) => !o);
              }}
              className="mb-2 flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-station"
            >
              Live reaction rules
              <span>{rulesOpen ? "−" : "+"}</span>
            </button>
            {rulesOpen ? (
              <ul className="space-y-2">
                {RULES.map((r) => (
                  <li key={r.title} className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-display font-bold text-foreground">{r.title}. </span>
                    {r.body}
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>
        </div>
      </div>

      <div className="h-28" />
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 px-3">
        <DialogueBanner dialogue={dialogue} speaker="Sparky" />
      </div>
    </StationShell>
  );
}
