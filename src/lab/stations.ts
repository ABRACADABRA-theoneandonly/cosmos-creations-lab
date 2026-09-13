export type StationId = "genetics" | "launchpad" | "volcano" | "sandbox";

export type Station = {
  id: StationId;
  to: "/genetics" | "/launchpad" | "/volcano" | "/sandbox";
  name: string;
  short: string;
  blurb: string;
  /** world coordinates in the 1000x620 lab room */
  x: number;
  y: number;
  color: string;
  tip: string;
};

export const STATIONS: Station[] = [
  {
    id: "genetics",
    to: "/genetics",
    name: "Genetics & DNA Alteration Lab",
    short: "Genetics",
    blurb: "Splice traits from two parent genomes into a brand new hybrid specimen.",
    x: 185,
    y: 170,
    color: "#4fe08d",
    tip: "Real gene editing uses CRISPR-Cas9, a bacterial immune system repurposed as molecular scissors.",
  },
  {
    id: "launchpad",
    to: "/launchpad",
    name: "Rocket Launchpad & Orbital Simulator",
    short: "Launchpad",
    blurb: "Balance fuel, thrust and payload to reach a stable orbit — or strand your crew.",
    x: 815,
    y: 170,
    color: "#a78bfa",
    tip: "Escape velocity from Earth is about 11.2 km/s. Orbit only needs ~7.8 km/s, sideways.",
  },
  {
    id: "volcano",
    to: "/volcano",
    name: "Volcanology & Magma Chamber",
    short: "Volcano",
    blurb: "Tune gas pressure and silica to choose between gentle lava and a Plinian blast.",
    x: 185,
    y: 460,
    color: "#ff9247",
    tip: "Sticky, silica-rich magma traps gas — that trapped gas is what makes eruptions explosive.",
  },
  {
    id: "sandbox",
    to: "/sandbox",
    name: "Element & Chemical Particle Sandbox",
    short: "Sandbox",
    blurb: "Drop sand, water, lava, acid and gunpowder into a living physics grid.",
    x: 815,
    y: 460,
    color: "#e8c46a",
    tip: "Falling-sand games are cellular automata: each grain follows a few simple neighbour rules.",
  },
];

export const SPARKY_LINES: { title: string; body: string }[] = [
  {
    title: "Welcome to the lab",
    body: "I'm Sparky, your lab companion. Walk around with WASD or the arrow keys — or just tap anywhere on the floor. Step into a glowing ring to open that station.",
  },
  {
    title: "Fun fact: glowing mice",
    body: "Scientists inserted the green fluorescent protein gene from a jellyfish into mice, and the mice glowed green under blue light. That marker gene is now used to track cells in living tissue.",
  },
  {
    title: "Fun fact: rocket maths",
    body: "Tsiolkovsky's rocket equation says your final speed depends on exhaust speed times the log of your mass ratio. Adding fuel adds mass, so gains shrink fast — that's the tyranny of the rocket equation.",
  },
  {
    title: "Fun fact: Krakatoa was loud",
    body: "The 1883 Krakatoa eruption was heard nearly 5,000 km away and ruptured eardrums 60 km from the volcano. Its ash cooled global temperatures for years.",
  },
  {
    title: "Fun fact: states of matter",
    body: "Melting ice absorbs energy without changing temperature — that's endothermic. Burning gunpowder releases energy instantly instead, which is exothermic.",
  },
  {
    title: "Fun fact: the Sun's future",
    body: "Our Sun is too light to go supernova. In about 5 billion years it will swell into a red giant, then settle into a white dwarf roughly the size of Earth.",
  },
  {
    title: "Try this",
    body: "In the particle sandbox, drop lava on ice and watch steam burst out. Then aim the freeze gun at the steam to make it condense back into water.",
  },
];
