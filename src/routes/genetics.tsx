import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Dna, FlaskConical, Sparkles } from "lucide-react";
import { ActionButton, Panel, Slider, StationShell } from "@/components/StationShell";
import { DialogueBanner, type Dialogue } from "@/components/DialogueBanner";
import { sfx } from "@/lib/audio";

export const Route = createFileRoute("/genetics")({
  head: () => ({
    meta: [
      { title: "Genetics & DNA Alteration Lab — AI Science Lab" },
      {
        name: "description",
        content:
          "Splice traits from two parent genomes, grow a hybrid specimen in the synthesis tube, and read its taxonomy, niche and real CRISPR science.",
      },
      { property: "og:title", content: "Genetics & DNA Alteration Lab" },
      {
        property: "og:description",
        content: "Design a hybrid creature gene by gene and see its full scientific dossier.",
      },
    ],
  }),
  component: GeneticsStation,
});

type Parent = {
  id: string;
  name: string;
  latin: string;
  base: { glow: number; limbs: number; iq: number; metabolism: number };
  covering: string;
  respiration: string;
  note: string;
};

const PARENTS_A: Parent[] = [
  {
    id: "axolotl",
    name: "Axolotl",
    latin: "Ambystoma mexicanum",
    base: { glow: 25, limbs: 4, iq: 30, metabolism: 35 },
    covering: "Smooth skin",
    respiration: "Gills",
    note: "Regrows entire limbs, including nerves and bone, without scarring.",
  },
  {
    id: "jellyfish",
    name: "Crystal Jellyfish",
    latin: "Aequorea victoria",
    base: { glow: 95, limbs: 8, iq: 5, metabolism: 20 },
    covering: "Translucent membrane",
    respiration: "Diffusion",
    note: "Source of GFP, the green fluorescent protein that won the 2008 Nobel Prize in Chemistry.",
  },
  {
    id: "tardigrade",
    name: "Tardigrade",
    latin: "Hypsibius dujardini",
    base: { glow: 10, limbs: 8, iq: 3, metabolism: 15 },
    covering: "Chitin cuticle",
    respiration: "Diffusion",
    note: "Survives vacuum, radiation and near-absolute-zero by drying into a tun state.",
  },
  {
    id: "octopus",
    name: "Common Octopus",
    latin: "Octopus vulgaris",
    base: { glow: 30, limbs: 8, iq: 88, metabolism: 65 },
    covering: "Chromatophore skin",
    respiration: "Gills",
    note: "Two thirds of its neurons sit in its arms, which can solve problems semi-independently.",
  },
];

const PARENTS_B: Parent[] = [
  {
    id: "peregrine",
    name: "Peregrine Falcon",
    latin: "Falco peregrinus",
    base: { glow: 5, limbs: 4, iq: 55, metabolism: 95 },
    covering: "Feathers",
    respiration: "Air-sac lungs",
    note: "Dives at over 350 km/h; bony nostril baffles stop the airflow bursting its lungs.",
  },
  {
    id: "gecko",
    name: "Crested Gecko",
    latin: "Correlophus ciliatus",
    base: { glow: 15, limbs: 4, iq: 35, metabolism: 45 },
    covering: "Scales",
    respiration: "Lungs",
    note: "Millions of setae on each toe grip by van der Waals forces, not glue.",
  },
  {
    id: "bat",
    name: "Greater Horseshoe Bat",
    latin: "Rhinolophus ferrumequinum",
    base: { glow: 8, limbs: 4, iq: 60, metabolism: 90 },
    covering: "Fur",
    respiration: "Lungs",
    note: "Echolocates with calls above 80 kHz and reads the Doppler shift of the echo.",
  },
  {
    id: "beetle",
    name: "Bombardier Beetle",
    latin: "Brachinus crepitans",
    base: { glow: 12, limbs: 6, iq: 8, metabolism: 70 },
    covering: "Chitin elytra",
    respiration: "Tracheal",
    note: "Mixes hydrogen peroxide and hydroquinone to spray a boiling 100 °C chemical jet.",
  },
];

const COVERINGS = ["Bioluminescent membrane", "Scales", "Fur", "Chitin plate", "Feathered down"];
const RESPIRATION = ["Lungs", "Gills", "Amphibious dual", "Tracheal tubes", "Cutaneous diffusion"];

const FACTS: Dialogue[] = [
  {
    title: "CRISPR in one line",
    body: "CRISPR-Cas9 is a bacterial defence system. Bacteria store snippets of virus DNA, then use the Cas9 protein guided by matching RNA to cut that DNA. Scientists swap the guide RNA to cut wherever they like.",
  },
  {
    title: "Glowing animals are real",
    body: "The GFP gene from the crystal jellyfish has been inserted into mice, pigs, zebrafish and cats. Under blue light the animals glow green, which lets researchers watch specific cells inside living tissue.",
  },
  {
    title: "Traits are rarely one gene",
    body: "Height, intelligence and metabolism are polygenic — hundreds of genes each nudge the outcome. Only a few traits, like sickle-cell trait, come from a single letter change in DNA.",
  },
  {
    title: "Real gene therapy today",
    body: "Casgevy, approved in 2023, uses CRISPR to edit a patient's own blood stem cells and treat sickle-cell disease. It is the first approved CRISPR medicine.",
  },
];

const CLASSES = ["Bioluminescentia", "Chimaeriformes", "Synthozoa", "Neoamphibia", "Xenotherida"];

export default function GeneticsStation() {
  const [a, setA] = useState(PARENTS_A[1]);
  const [b, setB] = useState(PARENTS_B[2]);
  const [glow, setGlow] = useState(60);
  const [limbs, setLimbs] = useState(6);
  const [iq, setIq] = useState(55);
  const [metabolism, setMetabolism] = useState(50);
  const [covering, setCovering] = useState(COVERINGS[0]);
  const [respiration, setRespiration] = useState(RESPIRATION[2]);
  const [synth, setSynth] = useState(false);
  const [dialogue, setDialogue] = useState<Dialogue>({
    title: "Gene splicing 101",
    body: "Pick a genome for each parent tube, then dial the traits. Tube 3 grows whatever you specify. Every combination gets a full scientific dossier.",
  });
  const [factIdx, setFactIdx] = useState(-1);

  const specimen = useMemo(() => {
    const name = `${a.name.split(" ").pop()}-${b.name.split(" ").pop()} chimera`;
    const speed = Math.round(metabolism * 0.7 + (limbs > 4 ? 18 : 8));
    const endurance = Math.round(100 - metabolism * 0.6 + (respiration === "Amphibious dual" ? 14 : 0));
    const stealth = Math.round(100 - glow * 0.8 + (covering === "Fur" ? 12 : 0));
    const problemSolving = Math.round(iq * 0.9 + (limbs > 6 ? 8 : 0));
    const resilience = Math.round(
      (covering === "Chitin plate" ? 78 : covering === "Scales" ? 66 : 48) + endurance * 0.2,
    );
    const niche =
      respiration === "Gills"
        ? "Deep benthic scavenger, 200–900 m"
        : respiration === "Amphibious dual"
          ? "Tidal-zone ambush predator"
          : respiration === "Tracheal tubes"
            ? "Leaf-litter micro-predator"
            : glow > 70
              ? "Nocturnal canopy glider"
              : "Temperate open-ground forager";
    const strengths = [
      glow > 60 && "Signals mates and startles predators with controlled bioluminescence",
      problemSolving > 60 && "Solves multi-step foraging puzzles and uses simple tools",
      resilience > 70 && "Shrugs off desiccation, pressure and impact damage",
      speed > 60 && "Explosive short-burst locomotion",
    ].filter(Boolean) as string[];
    const weaknesses = [
      metabolism > 70 && "Burns energy fast — must eat roughly its own body mass weekly",
      glow > 75 && "Its own glow gives away its position to sharp-eyed hunters",
      limbs > 6 && "High limb count costs coordination and nerve tissue",
      endurance < 45 && "Poor long-distance stamina",
      stealth < 35 && "Almost impossible to hide",
    ].filter(Boolean) as string[];
    return {
      name,
      latin: `${CLASSES[limbs % CLASSES.length].slice(0, 6).toLowerCase()}us ${a.id}${b.id.slice(0, 3)}`,
      taxonomy: `Domain Eukarya · Kingdom Animalia · Class ${CLASSES[limbs % CLASSES.length]} · Order Synthesized`,
      niche,
      stats: { speed, endurance, stealth, problemSolving, resilience },
      strengths: strengths.length ? strengths : ["Unremarkable but stable — a good control specimen"],
      weaknesses: weaknesses.length ? weaknesses : ["No standout weakness detected"],
      lore: `Spliced from ${a.name} (${a.latin}) and ${b.name} (${b.latin}). ${a.note} ${b.note} In a real lab this would take vector design, Cas9 delivery and generations of screening — most edits simply fail.`,
    };
  }, [a, b, glow, limbs, iq, metabolism, covering, respiration]);

  const applyParents = (pa: Parent, pb: Parent) => {
    setGlow(Math.round((pa.base.glow + pb.base.glow) / 2));
    setLimbs(Math.round((pa.base.limbs + pb.base.limbs) / 2));
    setIq(Math.round((pa.base.iq + pb.base.iq) / 2));
    setMetabolism(Math.round((pa.base.metabolism + pb.base.metabolism) / 2));
    setSynth(false);
  };

  const nextFact = () => {
    const n = (factIdx + 1) % FACTS.length;
    setFactIdx(n);
    setDialogue(FACTS[n]);
  };

  return (
    <StationShell theme="theme-genetics" eyebrow="Station 01 · biolab" title="Genetics & DNA Alteration">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* Tubes */}
        <Panel title="Cryogenic synthesis bay">
          <div className="grid grid-cols-3 gap-3">
            <Tube label="Tube 1 · Parent A" tint="#4fe08d" fill={70}>
              <ParentPicker options={PARENTS_A} value={a} onChange={(p) => { setA(p); applyParents(p, b); }} />
            </Tube>
            <Tube label="Tube 2 · Parent B" tint="#8fd8ff" fill={70}>
              <ParentPicker options={PARENTS_B} value={b} onChange={(p) => { setB(p); applyParents(a, p); }} />
            </Tube>
            <Tube label="Tube 3 · Hybrid" tint="#ff9ad5" fill={synth ? 95 : 30}>
              <div className="flex h-full items-center justify-center">
                {synth ? (
                  <CreatureArt glow={glow} limbs={limbs} iq={iq} covering={covering} />
                ) : (
                  <p className="px-2 text-center text-[11px] text-muted-foreground">
                    Empty growth medium
                  </p>
                )}
              </div>
            </Tube>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton
              onClick={() => {
                sfx.splice();
                setSynth(true);
                setDialogue({
                  title: "Specimen viable",
                  body: `${specimen.name} is growing in tube 3. Its ecological niche is ${specimen.niche.toLowerCase()}. Scroll the dossier for taxonomy, strengths and weaknesses.`,
                });
              }}
            >
              <Dna className="h-4 w-4" /> Synthesize specimen
            </ActionButton>
            <ActionButton
              variant="ghost"
              onClick={() => {
                setGlow(Math.round(Math.random() * 100));
                setLimbs(2 + Math.round(Math.random() * 6));
                setIq(Math.round(Math.random() * 100));
                setMetabolism(Math.round(Math.random() * 100));
                setCovering(COVERINGS[Math.floor(Math.random() * COVERINGS.length)]);
                setRespiration(RESPIRATION[Math.floor(Math.random() * RESPIRATION.length)]);
                setSynth(false);
                setDialogue({
                  title: "Randomised genome",
                  body: "Random mutation is exactly how nature does it — most random changes are neutral or harmful, and only a few are useful.",
                });
              }}
            >
              <Sparkles className="h-4 w-4" /> Random mutation
            </ActionButton>
          </div>
        </Panel>

        {/* Controls */}
        <Panel title="Gene splicing console">
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Bioluminescence" value={glow} min={0} max={100} unit="%" onChange={(v) => { setGlow(v); setSynth(false); }} hint="GFP-style light emission" />
            <Slider label="Limb count" value={limbs} min={2} max={8} onChange={(v) => { setLimbs(v); setSynth(false); }} hint="Hox genes set body segments" />
            <Slider label="Intelligence index" value={iq} min={0} max={100} onChange={(v) => { setIq(v); setSynth(false); }} hint="Encephalisation quotient" />
            <Slider label="Metabolic rate" value={metabolism} min={0} max={100} unit="%" onChange={(v) => { setMetabolism(v); setSynth(false); }} hint="Energy burned at rest" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Selector label="Body covering" options={COVERINGS} value={covering} onChange={(v) => { setCovering(v); setSynth(false); }} />
            <Selector label="Respiratory adaptation" options={RESPIRATION} value={respiration} onChange={(v) => { setRespiration(v); setSynth(false); }} />
          </div>
          <p className="mt-4 rounded-xl bg-station-soft p-3 text-xs leading-relaxed text-muted-foreground">
            <FlaskConical className="mr-1.5 inline h-3.5 w-3.5 text-station" />
            Parent A: {a.note}
          </p>
        </Panel>
      </div>

      {/* Dossier */}
      {synth ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel title="Specimen dossier" className="lg:col-span-2">
            <h3 className="font-display text-xl font-bold text-station text-glow">{specimen.name}</h3>
            <p className="font-mono text-xs italic text-muted-foreground">{specimen.latin}</p>
            <p className="mt-2 text-xs text-muted-foreground">{specimen.taxonomy}</p>
            <p className="mt-1 text-sm text-foreground">
              <span className="text-muted-foreground">Ecological niche: </span>
              {specimen.niche}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div>
                <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-good">Strengths</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {specimen.strengths.map((s) => <li key={s}>• {s}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-warn">Weaknesses</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {specimen.weaknesses.map((s) => <li key={s}>• {s}</li>)}
                </ul>
              </div>
            </div>
            <p className="mt-4 border-t border-panel-border pt-3 text-sm leading-relaxed text-muted-foreground">
              {specimen.lore}
            </p>
          </Panel>
          <Panel title="Vital statistics">
            <div className="space-y-3">
              {Object.entries(specimen.stats).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-mono text-station">{Math.max(0, Math.min(100, v))}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-station" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      <div className="h-28" />
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 px-3">
        <DialogueBanner dialogue={dialogue} speaker="Dr. Byte" onNext={nextFact} />
      </div>
    </StationShell>
  );
}

function Tube({
  label,
  tint,
  fill,
  children,
}: {
  label: string;
  tint: string;
  fill: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div
        className="relative h-72 overflow-hidden rounded-t-full rounded-b-2xl border"
        style={{ borderColor: `${tint}66`, boxShadow: `0 0 30px -12px ${tint}` }}
      >
        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-700"
          style={{
            height: `${fill}%`,
            background: `linear-gradient(180deg, ${tint}33, ${tint}77)`,
          }}
        />
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute bottom-2 h-2 w-2 rounded-full animate-bubble"
            style={{
              left: `${18 + i * 22}%`,
              backgroundColor: `${tint}aa`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
        <div className="absolute inset-x-1 inset-y-2 z-10">{children}</div>
      </div>
    </div>
  );
}

function ParentPicker({
  options,
  value,
  onChange,
}: {
  options: Parent[];
  value: Parent;
  onChange: (p: Parent) => void;
}) {
  return (
    <div className="flex h-full flex-col justify-end gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            sfx.click();
            onChange(o);
          }}
          className={`rounded-lg px-2 py-1.5 text-left text-[11px] leading-tight transition ${
            value.id === o.id
              ? "bg-station text-primary-foreground font-bold"
              : "bg-background/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => {
              sfx.click();
              onChange(o);
            }}
            className={`rounded-full px-3 py-1.5 text-xs transition ${
              value === o
                ? "bg-station text-primary-foreground font-bold"
                : "border border-panel-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function CreatureArt({
  glow,
  limbs,
  iq,
  covering,
}: {
  glow: number;
  limbs: number;
  iq: number;
  covering: string;
}) {
  const hue = covering === "Fur" ? 30 : covering === "Scales" ? 140 : covering === "Chitin plate" ? 260 : covering === "Feathered down" ? 200 : 170;
  const body = `hsl(${hue} 70% ${35 + glow * 0.2}%)`;
  const light = `hsl(${hue} 95% ${55 + glow * 0.3}%)`;
  const headR = 13 + iq * 0.06;
  return (
    <svg viewBox="0 0 120 160" className="h-full w-full animate-lab-float" role="img" aria-label="Synthesized hybrid specimen">
      <defs>
        <radialGradient id="aura">
          <stop offset="0%" stopColor={light} stopOpacity={glow / 120} />
          <stop offset="100%" stopColor={light} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="86" r="56" fill="url(#aura)" />
      {Array.from({ length: limbs }).map((_, i) => {
        const angle = Math.PI * (0.15 + (0.7 * i) / Math.max(1, limbs - 1));
        const dir = i % 2 === 0 ? -1 : 1;
        const x2 = 60 + dir * (26 + Math.sin(i) * 10);
        const y2 = 96 + Math.cos(angle) * 26 + i * 2;
        return (
          <g key={i}>
            <path
              d={`M60 ${86 + i * 1.5} Q ${60 + dir * 20} ${y2 - 8} ${x2} ${y2}`}
              stroke={body}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx={x2} cy={y2} r="3" fill={light} opacity={0.5 + glow / 200} />
          </g>
        );
      })}
      <ellipse cx="60" cy="92" rx="22" ry="30" fill={body} />
      {covering === "Scales" || covering === "Chitin plate"
        ? Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={`M44 ${72 + i * 11} q16 8 32 0`} stroke={light} strokeWidth="1.6" fill="none" opacity="0.6" />
          ))
        : null}
      {covering === "Fur" || covering === "Feathered down"
        ? Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1={40 + i * 3.4}
              y1={68 + (i % 3) * 4}
              x2={36 + i * 3.4}
              y2={60 + (i % 3) * 4}
              stroke={light}
              strokeWidth="1.4"
              opacity="0.7"
            />
          ))
        : null}
      <circle cx="60" cy={54} r={headR} fill={body} />
      <circle cx={60 - headR * 0.4} cy={52} r="3.2" fill="#0b1020" />
      <circle cx={60 + headR * 0.4} cy={52} r="3.2" fill="#0b1020" />
      <circle cx={60 - headR * 0.4} cy={51} r="1.2" fill={light} />
      <circle cx={60 + headR * 0.4} cy={51} r="1.2" fill={light} />
      {glow > 50 ? (
        <g className="animate-lab-pulse">
          <circle cx="60" cy="76" r="4" fill={light} />
          <circle cx="52" cy="104" r="2.6" fill={light} />
          <circle cx="69" cy="112" r="2.2" fill={light} />
        </g>
      ) : null}
    </svg>
  );
}
