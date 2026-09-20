export const EMPTY = 0;
export const SAND = 1;
export const STONE = 2;
export const METAL = 3;
export const ICE = 4;
export const WATER = 5;
export const LAVA = 6;
export const OIL = 7;
export const ACID = 8;
export const STEAM = 9;
export const FIRE = 10;
export const GUNPOWDER = 11;
export const PLANT = 12;
export const SALT = 13;
export const SALTWATER = 14;

export type Kind = "none" | "powder" | "liquid" | "gas" | "solid" | "energy";
export type Category = "Solids" | "Liquids" | "Gases" | "Reactives & organics" | "Tools";

export type Material = {
  id: number;
  name: string;
  kind: Kind;
  category: Category;
  color: [number, number, number];
  /** lower = floats above heavier liquids */
  density: number;
  /** temperature a freshly placed cell starts at, in Celsius */
  temp: number;
  /** how quickly it exchanges heat with neighbours, 0-1 */
  conduct: number;
  props: string;
};

export const MATERIALS: Record<number, Material> = {
  [EMPTY]: {
    id: EMPTY,
    name: "Empty",
    kind: "none",
    category: "Tools",
    color: [10, 12, 20],
    density: 0,
    temp: 22,
    conduct: 0.02,
    props: "Air. Carries a little heat but nothing else.",
  },
  [SAND]: {
    id: SAND,
    name: "Sand",
    kind: "powder",
    category: "Solids",
    color: [214, 178, 96],
    density: 6,
    temp: 22,
    conduct: 0.08,
    props: "Granular silica. Falls and piles into slopes. Melts above 1500 °C.",
  },
  [STONE]: {
    id: STONE,
    name: "Stone",
    kind: "solid",
    category: "Solids",
    color: [120, 122, 134],
    density: 9,
    temp: 22,
    conduct: 0.06,
    props: "Static wall. Dissolves in acid; melts back to lava above 1100 °C.",
  },
  [METAL]: {
    id: METAL,
    name: "Metal",
    kind: "solid",
    category: "Solids",
    color: [176, 188, 206],
    density: 9,
    temp: 22,
    conduct: 0.42,
    props: "Excellent thermal conductor. Dissolves in acid, melts near 1200 °C.",
  },
  [ICE]: {
    id: ICE,
    name: "Ice",
    kind: "solid",
    category: "Solids",
    color: [168, 222, 247],
    density: 4,
    temp: -18,
    conduct: 0.2,
    props: "Frozen water at -18 °C. Melts above 0 °C, absorbing heat (endothermic).",
  },
  [WATER]: {
    id: WATER,
    name: "Water",
    kind: "liquid",
    category: "Liquids",
    color: [58, 130, 226],
    density: 5,
    temp: 22,
    conduct: 0.24,
    props: "Flows and spreads. Freezes below 0 °C, boils to steam at 100 °C.",
  },
  [LAVA]: {
    id: LAVA,
    name: "Lava",
    kind: "liquid",
    category: "Liquids",
    color: [255, 110, 40],
    density: 8,
    temp: 1200,
    conduct: 0.3,
    props: "Molten rock at 1200 °C. Ignites fuel, melts ice and metal, cools into stone.",
  },
  [OIL]: {
    id: OIL,
    name: "Oil",
    kind: "liquid",
    category: "Liquids",
    color: [96, 72, 48],
    density: 3,
    temp: 22,
    conduct: 0.12,
    props: "Floats on water because it is less dense. Ignites readily above 250 °C.",
  },
  [ACID]: {
    id: ACID,
    name: "Acid",
    kind: "liquid",
    category: "Liquids",
    color: [138, 232, 84],
    density: 5,
    temp: 22,
    conduct: 0.18,
    props: "Corrosive liquid. Dissolves metal, stone and plants, and is used up doing it.",
  },
  [STEAM]: {
    id: STEAM,
    name: "Steam",
    kind: "gas",
    category: "Gases",
    color: [206, 222, 238],
    density: 1,
    temp: 140,
    conduct: 0.14,
    props: "Water vapour. Rises, and condenses back to water below ~95 °C.",
  },
  [FIRE]: {
    id: FIRE,
    name: "Fire",
    kind: "energy",
    category: "Reactives & organics",
    color: [255, 168, 52],
    density: 1,
    temp: 750,
    conduct: 0.5,
    props: "Combustion at ~750 °C. Needs fuel; spreads to oil, gunpowder and plants.",
  },
  [GUNPOWDER]: {
    id: GUNPOWDER,
    name: "Gunpowder",
    kind: "powder",
    category: "Reactives & organics",
    color: [92, 92, 104],
    density: 6,
    temp: 22,
    conduct: 0.1,
    props: "Saltpetre, charcoal and sulphur. Detonates on contact with fire (exothermic).",
  },
  [PLANT]: {
    id: PLANT,
    name: "Plant",
    kind: "solid",
    category: "Reactives & organics",
    color: [76, 186, 96],
    density: 4,
    temp: 22,
    conduct: 0.1,
    props: "Grows into empty space when touching water. Burns easily and dissolves in acid.",
  },
  [SALT]: {
    id: SALT,
    name: "Salt",
    kind: "powder",
    category: "Reactives & organics",
    color: [238, 240, 246],
    density: 6,
    temp: 22,
    conduct: 0.1,
    props: "Sodium chloride. Dissolves in water into brine, which freezes below -9 °C.",
  },
  [SALTWATER]: {
    id: SALTWATER,
    name: "Brine",
    kind: "liquid",
    category: "Liquids",
    color: [86, 158, 206],
    density: 5,
    temp: 22,
    conduct: 0.24,
    props: "Salty water. Its freezing point is depressed to about -9 °C.",
  },
};

export const PALETTE: { category: Category; ids: number[] }[] = [
  { category: "Solids", ids: [SAND, STONE, METAL, ICE] },
  { category: "Liquids", ids: [WATER, LAVA, OIL, ACID] },
  { category: "Gases", ids: [STEAM] },
  { category: "Reactives & organics", ids: [FIRE, GUNPOWDER, PLANT, SALT] },
];

export const TEMP_MIN = -273;
export const TEMP_MAX = 3000;

export function cssColor(id: number, temp: number): string {
  const m = MATERIALS[id] ?? MATERIALS[EMPTY];
  let [r, g, b] = m.color;
  if (id === FIRE || id === LAVA) {
    const h = Math.max(0, Math.min(1, (temp - 500) / 900));
    r = 255;
    g = Math.round(90 + h * 140);
    b = Math.round(20 + h * 60);
  } else if (temp > 300 && m.kind !== "gas") {
    const h = Math.min(1, (temp - 300) / 900);
    r = Math.round(r + (255 - r) * h);
    g = Math.round(g + (90 - g) * h * 0.6);
    b = Math.round(b * (1 - h * 0.6));
  } else if (temp < -20) {
    const c = Math.min(1, (-20 - temp) / 200);
    r = Math.round(r * (1 - c * 0.5));
    g = Math.round(g + (200 - g) * c * 0.4);
    b = Math.round(b + (255 - b) * c * 0.5);
  }
  return `rgb(${r},${g},${b})`;
}
