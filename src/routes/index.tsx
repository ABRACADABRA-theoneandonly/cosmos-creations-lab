import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Gamepad2, MousePointerClick } from "lucide-react";
import { DialogueBanner, type Dialogue } from "@/components/DialogueBanner";
import { SoundToggle } from "@/components/SoundToggle";
import { sfx, startAmbient, stopAmbient } from "@/lib/audio";
import { SPARKY_LINES, STATIONS, type Station } from "@/lab/stations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Science Lab — Walk In and Run Experiments" },
      {
        name: "description",
        content:
          "Explore a playable science lab: splice DNA, launch rockets, erupt volcanoes and build chemical reactions in a particle sandbox.",
      },
      { property: "og:title", content: "AI Science Lab — Walk In and Run Experiments" },
      {
        property: "og:description",
        content:
          "Walk your scientist between four hands-on stations with Sparky the robot companion as your guide.",
      },
    ],
  }),
  component: LabHub,
});

const W = 1000;
const H = 620;
const RADIUS = 74;

type Vec = { x: number; y: number };

function LabHub() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [nearby, setNearby] = useState<Station | null>(null);
  const [entering, setEntering] = useState(0);
  const [dialogue, setDialogue] = useState<Dialogue>(SPARKY_LINES[0]);

  const nextLine = useCallback(() => {
    setLineIndex((i) => {
      const n = (i + 1) % SPARKY_LINES.length;
      setDialogue(SPARKY_LINES[n]);
      return n;
    });
  }, []);

  // idle fun facts
  useEffect(() => {
    const id = window.setInterval(nextLine, 22000);
    return () => window.clearInterval(id);
  }, [nextLine]);

  useEffect(() => {
    const start = () => startAmbient(72);
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      stopAmbient();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const player: Vec = { x: W / 2, y: H / 2 };
    const vel: Vec = { x: 0, y: 0 };
    const robot: Vec = { x: W / 2 - 50, y: H / 2 + 20 };
    const robotVel: Vec = { x: 0, y: 0 };
    let target: Vec | null = null;
    let facing = 1;
    let stepPhase = 0;
    let currentNear: Station | null = null;
    let dwell = 0;
    let opened = false;
    const keys = new Set<string>();
    const dust = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      s: Math.random() * 0.25 + 0.05,
    }));

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        keys.add(k);
        target = null;
        e.preventDefault();
      }
      if ((k === "enter" || k === " ") && currentNear) {
        opened = true;
        sfx.chime();
        void navigate({ to: currentNear.to });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    const toWorld = (clientX: number, clientY: number): Vec => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * W,
        y: ((clientY - rect.top) / rect.height) * H,
      };
    };

    const onPointer = (e: PointerEvent) => {
      target = toWorld(e.clientX, e.clientY);
      sfx.blip();
    };
    const onMove = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      const hover = STATIONS.find((s) => Math.hypot(s.x - p.x, s.y - p.y) < RADIUS);
      canvas.style.cursor = hover ? "pointer" : "crosshair";
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let t = 0;

    const drawStation = (s: Station, time: number) => {
      const near = currentNear?.id === s.id;
      const pulse = 0.5 + 0.5 * Math.sin(time * 2 + s.x);
      ctx.save();
      // floor glow
      const g = ctx.createRadialGradient(s.x, s.y, 6, s.x, s.y, RADIUS + 18);
      g.addColorStop(0, `${s.color}88`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.globalAlpha = near ? 0.95 : 0.5 + pulse * 0.18;
      ctx.beginPath();
      ctx.arc(s.x, s.y, RADIUS + 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // ring
      ctx.strokeStyle = s.color;
      ctx.lineWidth = near ? 4 : 2.5;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -time * (near ? 40 : 14);
      ctx.beginPath();
      ctx.arc(s.x, s.y, RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // console / apparatus
      ctx.fillStyle = "rgba(20,26,42,0.92)";
      ctx.strokeStyle = `${s.color}cc`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(s.x - 40, s.y - 52, 80, 56, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.color;
      for (let i = 0; i < 3; i++) {
        const on = Math.sin(time * (2 + i) + i) > -0.2;
        ctx.globalAlpha = on ? 0.95 : 0.25;
        ctx.beginPath();
        ctx.arc(s.x - 22 + i * 22, s.y - 38, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // little bar chart readout
      for (let i = 0; i < 6; i++) {
        const h = 4 + Math.abs(Math.sin(time * 1.6 + i * 0.9)) * 16;
        ctx.fillStyle = `${s.color}bb`;
        ctx.fillRect(s.x - 28 + i * 10, s.y - 8 - h, 6, h);
      }

      // label
      ctx.font = "600 14px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(240,246,255,0.94)";
      ctx.fillText(s.short, s.x, s.y + RADIUS - 12);
      ctx.restore();
    };

    const drawRobot = (time: number) => {
      const bob = Math.sin(time * 3) * 4;
      const x = robot.x;
      const y = robot.y + bob;
      ctx.save();
      const g = ctx.createRadialGradient(x, y, 2, x, y, 34);
      g.addColorStop(0, "rgba(110,231,255,0.5)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#dff6ff";
      ctx.beginPath();
      ctx.roundRect(x - 13, y - 12, 26, 22, 8);
      ctx.fill();
      ctx.fillStyle = "#0e1628";
      ctx.beginPath();
      ctx.roundRect(x - 9, y - 7, 18, 11, 5);
      ctx.fill();
      const blink = Math.sin(time * 1.1) > 0.97 ? 0.6 : 3;
      ctx.fillStyle = "#6ee7ff";
      ctx.beginPath();
      ctx.arc(x - 4, y - 1.5, blink, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 1.5, blink, 0, Math.PI * 2);
      ctx.fill();
      // antenna
      ctx.strokeStyle = "#6ee7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x, y - 20);
      ctx.stroke();
      ctx.fillStyle = "#ff86d1";
      ctx.beginPath();
      ctx.arc(x, y - 22, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // hover thruster
      ctx.fillStyle = "rgba(110,231,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 9 + Math.sin(time * 8) * 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawPlayer = (time: number) => {
      const moving = Math.hypot(vel.x, vel.y) > 8;
      const legSwing = moving ? Math.sin(stepPhase) * 5 : 0;
      const x = player.x;
      const y = player.y;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(x, y + 22, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // legs
      ctx.strokeStyle = "#2b3450";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 8);
      ctx.lineTo(x - 4 + legSwing, y + 20);
      ctx.moveTo(x + 4, y + 8);
      ctx.lineTo(x + 4 - legSwing, y + 20);
      ctx.stroke();

      // lab coat
      ctx.fillStyle = "#f2f6ff";
      ctx.beginPath();
      ctx.roundRect(x - 11, y - 12, 22, 24, 7);
      ctx.fill();
      ctx.fillStyle = "#6ee7ff";
      ctx.fillRect(x - 1.4, y - 10, 2.8, 20);
      // head
      ctx.fillStyle = "#f6c99a";
      ctx.beginPath();
      ctx.arc(x, y - 20, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b2118";
      ctx.beginPath();
      ctx.arc(x, y - 24, 9, Math.PI, Math.PI * 2);
      ctx.fill();
      // goggles
      ctx.strokeStyle = "#8fd8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 21);
      ctx.lineTo(x + 9, y - 21);
      ctx.stroke();
      ctx.fillStyle = "rgba(143,216,255,0.85)";
      ctx.beginPath();
      ctx.arc(x - 3.5 * facing, y - 20, 2.4, 0, Math.PI * 2);
      ctx.arc(x + 3.5 * facing, y - 20, 2.4, 0, Math.PI * 2);
      ctx.fill();
      if (moving) {
        ctx.strokeStyle = "rgba(110,231,255,0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + 20, 12 + (Math.sin(time * 10) + 1) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      // ---- input ----
      let ax = 0;
      let ay = 0;
      if (keys.has("a") || keys.has("arrowleft")) ax -= 1;
      if (keys.has("d") || keys.has("arrowright")) ax += 1;
      if (keys.has("w") || keys.has("arrowup")) ay -= 1;
      if (keys.has("s") || keys.has("arrowdown")) ay += 1;
      if (target) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d < 6) target = null;
        else {
          ax = dx / d;
          ay = dy / d;
        }
      }
      const len = Math.hypot(ax, ay) || 1;
      const speed = 260;
      vel.x += ((ax / len) * speed - vel.x) * Math.min(1, dt * 12);
      vel.y += ((ay / len) * speed - vel.y) * Math.min(1, dt * 12);
      player.x = Math.max(46, Math.min(W - 46, player.x + vel.x * dt));
      player.y = Math.max(58, Math.min(H - 40, player.y + vel.y * dt));
      if (Math.abs(vel.x) > 12) facing = vel.x > 0 ? 1 : -1;
      stepPhase += Math.hypot(vel.x, vel.y) * dt * 0.06;

      // ---- robot trailing spring ----
      const want = { x: player.x - facing * 42, y: player.y - 26 };
      const rdx = want.x - robot.x;
      const rdy = want.y - robot.y;
      robotVel.x += rdx * dt * 9;
      robotVel.y += rdy * dt * 9;
      robotVel.x *= 0.9;
      robotVel.y *= 0.9;
      robot.x += robotVel.x * dt;
      robot.y += robotVel.y * dt;

      // ---- proximity ----
      const near = STATIONS.find((s) => Math.hypot(s.x - player.x, s.y - player.y) < RADIUS) ?? null;
      if (near?.id !== currentNear?.id) {
        currentNear = near;
        dwell = 0;
        setNearby(near);
        setEntering(0);
        if (near) {
          sfx.hover();
          setDialogue({ title: near.name, body: `${near.blurb} ${near.tip}` });
        }
      }
      if (near && !opened) {
        dwell += dt;
        setEntering(Math.min(1, dwell / 1.1));
        if (dwell > 1.1) {
          opened = true;
          sfx.chime();
          void navigate({ to: near.to });
        }
      }

      // ---- render ----
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#141a2c");
      bg.addColorStop(0.5, "#111827");
      bg.addColorStop(1, "#0d1220");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // tiled floor
      ctx.strokeStyle = "rgba(110,231,255,0.07)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 40; y <= H; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // back wall with monitors and shelves
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, W, 40);
      ctx.strokeStyle = "rgba(110,231,255,0.25)";
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(W, 40);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const mx = 60 + i * 118;
        ctx.fillStyle = "rgba(110,231,255,0.12)";
        ctx.fillRect(mx, 8, 74, 24);
        ctx.fillStyle = "rgba(110,231,255,0.75)";
        for (let b = 0; b < 5; b++) {
          const h = 2 + Math.abs(Math.sin(t * 2 + i + b)) * 14;
          ctx.fillRect(mx + 6 + b * 13, 30 - h, 6, h);
        }
      }

      // dust motes
      dust.forEach((d) => {
        d.y -= d.s;
        if (d.y < 40) d.y = H;
        ctx.fillStyle = "rgba(190,230,255,0.22)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // centre bench with bubbling flasks
      ctx.fillStyle = "rgba(24,32,52,0.9)";
      ctx.strokeStyle = "rgba(110,231,255,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 130, H / 2 + 60, 260, 46, 12);
      ctx.fill();
      ctx.stroke();
      ["#7cf7c6", "#ff9ad5", "#ffd479"].forEach((c, i) => {
        const fx = W / 2 - 78 + i * 78;
        const fy = H / 2 + 60;
        ctx.fillStyle = `${c}55`;
        ctx.beginPath();
        ctx.moveTo(fx - 12, fy);
        ctx.lineTo(fx + 12, fy);
        ctx.lineTo(fx + 6, fy - 26);
        ctx.lineTo(fx - 6, fy - 26);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        for (let b = 0; b < 3; b++) {
          const p = (t * 0.6 + b * 0.33 + i * 0.2) % 1;
          ctx.fillStyle = `${c}cc`;
          ctx.beginPath();
          ctx.arc(fx - 4 + b * 4, fy - 4 - p * 20, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      STATIONS.forEach((s) => drawStation(s, t));
      drawRobot(t);
      drawPlayer(t);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

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
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 grid-floor opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-station">
              Research facility · sector 7
            </p>
            <h1 className="font-display text-2xl font-bold text-glow sm:text-4xl">
              AI Science Lab
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Four working stations, one curious robot. Walk in and start experimenting.
            </p>
          </div>
          <SoundToggle />
        </header>

        <div className="relative overflow-hidden rounded-3xl panel-glass station-glow">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            style={{ aspectRatio: `${W} / ${H}` }}
            aria-label="Interactive science lab floor. Move with W A S D or arrow keys, or tap the floor."
          />
          {nearby ? (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full panel-glass px-4 py-2 text-center">
              <p className="font-display text-sm font-bold text-station">{nearby.name}</p>
              <p className="text-xs text-muted-foreground">
                Hold position to enter · or press Enter
              </p>
              <div className="mt-1.5 h-1 w-40 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-station transition-[width] duration-100"
                  style={{ width: `${entering * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full panel-glass px-3 py-1.5">
            <Gamepad2 className="h-3.5 w-3.5 text-station" /> WASD / arrow keys to walk
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full panel-glass px-3 py-1.5">
            <MousePointerClick className="h-3.5 w-3.5 text-station" /> Tap the floor to walk there
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATIONS.map((s) => (
            <a
              key={s.id}
              href={s.to}
              onMouseEnter={() => sfx.hover()}
              onClick={() => sfx.chime()}
              className="group rounded-2xl panel-glass p-4 transition hover:-translate-y-1 hover:bg-station-soft"
            >
              <span
                className="mb-2 block h-1.5 w-10 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <h2 className="font-display text-sm font-bold text-foreground">{s.name}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.blurb}</p>
            </a>
          ))}
        </div>

        <div className="h-28" />
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 px-3">
        <DialogueBanner dialogue={dialogue} onNext={nextLine} />
      </div>
    </main>
  );
}
