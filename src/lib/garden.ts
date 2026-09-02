import type { CategoryBreakdown } from "@/lib/points";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export type PlantForm =
  | "flower"
  | "tulip"
  | "bell"
  | "spike"
  | "blossom"
  | "lotus"
  | "mushroom"
  | "fern"
  | "clover"
  | "orchid";

export type Species = {
  key: string;
  name: string;
  rarity: Rarity;
  form: PlantForm;
  petals: number;
  petal: string;
  petal2: string;
  center: string;
  leaf: string;
  perfectName: string;
  blurb: string;
};

export type GardenPlant = {
  id: string;
  date: string;
  species_key: string;
  rarity: Rarity;
  stage: number;
  overall_pct: number;
  perfect: boolean;
  favorite: boolean;
  locked: boolean;
  breakdown: CategoryBreakdown[];
};

export const RARITIES: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; ring: string; weight: number; glow: string }
> = {
  common: { label: "Common", color: "text-muted-foreground", ring: "border-border", weight: 46, glow: "oklch(0.8 0.05 140)" },
  uncommon: { label: "Uncommon", color: "text-fitness", ring: "border-fitness/50", weight: 26, glow: "oklch(0.82 0.14 160)" },
  rare: { label: "Rare", color: "text-accent", ring: "border-accent/50", weight: 15, glow: "oklch(0.8 0.13 220)" },
  epic: { label: "Epic", color: "text-school", ring: "border-school/50", weight: 8, glow: "oklch(0.75 0.18 305)" },
  legendary: { label: "Legendary", color: "text-money", ring: "border-money/60", weight: 4, glow: "oklch(0.85 0.17 80)" },
  mythic: { label: "Mythic", color: "text-vape", ring: "border-vape/60", weight: 1, glow: "oklch(0.78 0.2 15)" },
};

export const STAGE_NAMES = [
  "Seed",
  "Sprout",
  "Young plant",
  "Growing plant",
  "Full bloom",
  "Perfect form",
];

export const SPECIES: Species[] = [
  { key: "daisy", name: "Daisy", rarity: "common", form: "flower", petals: 12, petal: "#F8FAF5", petal2: "#E3EAD8", center: "#F5C242", leaf: "#4E8B4A", perfectName: "Sunlit Daisy", blurb: "A cheerful field classic that opens with the morning." },
  { key: "clover", name: "Clover", rarity: "common", form: "clover", petals: 3, petal: "#6FBF5B", petal2: "#4C8F41", center: "#8FD97A", leaf: "#4E8B4A", perfectName: "Four-Leaf Clover", blurb: "Low, hardy and quietly lucky." },
  { key: "marigold", name: "Marigold", rarity: "common", form: "flower", petals: 14, petal: "#F79A2B", petal2: "#E2711D", center: "#C4520F", leaf: "#4E8B4A", perfectName: "Ember Marigold", blurb: "Warm ruffled petals that keep the pests away." },
  { key: "buttercup", name: "Buttercup", rarity: "common", form: "flower", petals: 5, petal: "#FFD84D", petal2: "#F3B71E", center: "#B9860A", leaf: "#4E8B4A", perfectName: "Gilded Buttercup", blurb: "Small, glossy, impossible to miss in the grass." },
  { key: "wildflower", name: "Wildflower", rarity: "common", form: "spike", petals: 9, petal: "#E77FA8", petal2: "#C75C8A", center: "#F6D06F", leaf: "#4E8B4A", perfectName: "Meadow Chorus", blurb: "Whatever the roadside decided to grow this year." },
  { key: "fern", name: "Fern", rarity: "common", form: "fern", petals: 7, petal: "#4E8B4A", petal2: "#3A6E38", center: "#77B96B", leaf: "#3A6E38", perfectName: "Emerald Fern", blurb: "Ancient, patient, unfolds one frond at a time." },
  { key: "dandelion", name: "Dandelion", rarity: "common", form: "flower", petals: 16, petal: "#FFDF66", petal2: "#F2B705", center: "#D08A00", leaf: "#4E8B4A", perfectName: "Wishing Dandelion", blurb: "A weed only if you have never made a wish." },

  { key: "tulip", name: "Tulip", rarity: "uncommon", form: "tulip", petals: 3, petal: "#F0607A", petal2: "#C93E5C", center: "#FBD5DD", leaf: "#4E8B4A", perfectName: "Velvet Tulip", blurb: "A clean cup of colour on a single strong stem." },
  { key: "sunflower", name: "Sunflower", rarity: "uncommon", form: "flower", petals: 18, petal: "#FFC93C", petal2: "#F0A202", center: "#6B4318", leaf: "#4E8B4A", perfectName: "Golden Sunflower", blurb: "Turns its whole head toward whatever light there is." },
  { key: "poppy", name: "Poppy", rarity: "uncommon", form: "flower", petals: 6, petal: "#EE4B44", petal2: "#C02B2B", center: "#2B2118", leaf: "#4E8B4A", perfectName: "Scarlet Poppy", blurb: "Paper-thin petals that somehow survive the wind." },
  { key: "lavender", name: "Lavender", rarity: "uncommon", form: "spike", petals: 11, petal: "#A88BE0", petal2: "#7C63BE", center: "#CDBBF2", leaf: "#6E8F63", perfectName: "Twilight Lavender", blurb: "Smells like a slow evening and a made bed." },
  { key: "daffodil", name: "Daffodil", rarity: "uncommon", form: "flower", petals: 6, petal: "#FFE27A", petal2: "#F5C518", center: "#FF9E2C", leaf: "#4E8B4A", perfectName: "Trumpet Daffodil", blurb: "The first thing brave enough to come up after winter." },
  { key: "cosmos", name: "Cosmos", rarity: "uncommon", form: "flower", petals: 8, petal: "#F49FC0", petal2: "#D96B9B", center: "#FFDD66", leaf: "#5A9A52", perfectName: "Starlit Cosmos", blurb: "Tall, airy, always leaning toward the sky." },

  { key: "rose", name: "Rose", rarity: "rare", form: "flower", petals: 10, petal: "#E8455F", petal2: "#B2213C", center: "#8C0F2B", leaf: "#3F7A3E", perfectName: "Radiant Rose", blurb: "Layer after layer, worth every thorn." },
  { key: "bluebell", name: "Bluebell", rarity: "rare", form: "bell", petals: 5, petal: "#6C8BE8", petal2: "#3F5FC2", center: "#B9C8FA", leaf: "#4E8B4A", perfectName: "Chiming Bluebell", blurb: "Whole woodland floors turn blue for two short weeks." },
  { key: "hydrangea", name: "Hydrangea", rarity: "rare", form: "blossom", petals: 6, petal: "#8FB6F2", petal2: "#6A8FD8", center: "#E5EEFF", leaf: "#3F7A3E", perfectName: "Sky Hydrangea", blurb: "A hundred tiny flowers pretending to be one big one." },
  { key: "peony", name: "Peony", rarity: "rare", form: "flower", petals: 14, petal: "#F7A8C4", petal2: "#DE7DA5", center: "#FBE2EC", leaf: "#4E8B4A", perfectName: "Silk Peony", blurb: "Absurdly full, collapses under its own beauty." },
  { key: "iris", name: "Iris", rarity: "rare", form: "orchid", petals: 6, petal: "#8264D6", petal2: "#5B41A8", center: "#F5C542", leaf: "#4E8B4A", perfectName: "Royal Iris", blurb: "Named after the rainbow, and it acts like it." },
  { key: "lily", name: "Lily", rarity: "rare", form: "flower", petals: 6, petal: "#FFF3E6", petal2: "#F3D9BE", center: "#E58A2B", leaf: "#3F7A3E", perfectName: "Moonlit Lily", blurb: "Clean white trumpets with a heavy sweet scent." },

  { key: "orchid", name: "Orchid", rarity: "epic", form: "orchid", petals: 5, petal: "#E374C8", petal2: "#B247A0", center: "#FFE066", leaf: "#3F7A3E", perfectName: "Ghost Orchid", blurb: "Fussy, strange, and completely worth the effort." },
  { key: "cherry_blossom", name: "Cherry Blossom", rarity: "epic", form: "blossom", petals: 5, petal: "#FBD3E1", petal2: "#F2A6C1", center: "#D9607F", leaf: "#5C8D57", perfectName: "Blooming Sakura", blurb: "Beautiful precisely because it does not last." },
  { key: "lotus", name: "Lotus", rarity: "epic", form: "lotus", petals: 10, petal: "#FBC7D8", petal2: "#EF93B4", center: "#F7D774", leaf: "#3F7A3E", perfectName: "Moonlit Lotus", blurb: "Comes up clean out of the muddiest water." },
  { key: "protea", name: "Protea", rarity: "epic", form: "lotus", petals: 12, petal: "#F2879B", petal2: "#C7546C", center: "#FFF0D6", leaf: "#57845B", perfectName: "Crown Protea", blurb: "An architectural bloom that looks engineered." },
  { key: "bird_of_paradise", name: "Bird of Paradise", rarity: "epic", form: "orchid", petals: 4, petal: "#FF8C24", petal2: "#E24E1B", center: "#3D6BE0", leaf: "#3F7A3E", perfectName: "Firebird Flower", blurb: "A flower doing a full impression of a bird." },

  { key: "glowcap", name: "Glowcap Mushroom", rarity: "legendary", form: "mushroom", petals: 1, petal: "#7BE0C4", petal2: "#39A98C", center: "#F3FFF9", leaf: "#3F7A3E", perfectName: "Glowing Mushroom", blurb: "Grows in the dark and makes its own light." },
  { key: "midnight_rose", name: "Midnight Rose", rarity: "legendary", form: "flower", petals: 12, petal: "#5B3B8C", petal2: "#31215A", center: "#C79BFF", leaf: "#3A6E38", perfectName: "Eclipse Rose", blurb: "Almost black in daylight, violet under the moon." },
  { key: "aurora_lily", name: "Aurora Lily", rarity: "legendary", form: "flower", petals: 8, petal: "#7BE8E0", petal2: "#4BB9D8", center: "#D6F8FF", leaf: "#3F7A3E", perfectName: "Aurora Crown Lily", blurb: "Its petals shift colour depending on the hour." },

  { key: "starbloom", name: "Starbloom", rarity: "mythic", form: "flower", petals: 7, petal: "#FFE9A8", petal2: "#F2B705", center: "#FFFFFF", leaf: "#3F7A3E", perfectName: "Celestial Starbloom", blurb: "Legend says it only opens for a day that was earned." },
  { key: "world_tree_sapling", name: "World Tree Sapling", rarity: "mythic", form: "fern", petals: 9, petal: "#57C98A", petal2: "#2E8B57", center: "#D9FFE7", leaf: "#2E8B57", perfectName: "Eternal Sapling", blurb: "A whole forest folded into a single seedling." },
];

export const SPECIES_BY_KEY: Record<string, Species> = Object.fromEntries(
  SPECIES.map((s) => [s.key, s]),
);

export function speciesFor(key: string): Species {
  return SPECIES_BY_KEY[key] ?? SPECIES[0]!;
}

/** Deterministic hash so a given day always yields the same seed. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Pick the seed of the day: rarity-weighted, deterministic per (user, date). */
export function seedForDate(date: string, salt = ""): Species {
  const roll = hash(`${salt}|${date}|rarity`);
  const total = RARITIES.reduce((s, r) => s + RARITY_META[r].weight, 0);
  let acc = 0;
  let rarity: Rarity = "common";
  for (const r of RARITIES) {
    acc += RARITY_META[r].weight / total;
    if (roll <= acc) {
      rarity = r;
      break;
    }
  }
  const pool = SPECIES.filter((s) => s.rarity === rarity);
  const pick = Math.floor(hash(`${salt}|${date}|species`) * pool.length);
  return pool[Math.min(pick, pool.length - 1)] ?? SPECIES[0]!;
}

/** Growth stage 1-6 from the day's overall percentage. */
export function stageForPct(pct: number): number {
  if (pct >= 100) return 6;
  if (pct >= 80) return 5;
  if (pct >= 60) return 4;
  if (pct >= 40) return 3;
  if (pct >= 20) return 2;
  return 1;
}

export function stageLabel(stage: number, species: Species): string {
  if (stage >= 6) return species.perfectName;
  return STAGE_NAMES[Math.max(0, stage - 1)] ?? "Seed";
}

export const GARDEN_STAGES = [
  { name: "Small Plot", min: 0 },
  { name: "Growing Garden", min: 25 },
  { name: "Flower Garden", min: 80 },
  { name: "Enchanted Garden", min: 180 },
  { name: "Grand Garden", min: 340 },
] as const;

/** Garden growth is driven by plant quality, not just day count. */
export function gardenPoints(plants: GardenPlant[]): number {
  return plants.reduce((sum, p) => {
    const rarityBonus = { common: 1, uncommon: 2, rare: 4, epic: 7, legendary: 12, mythic: 20 }[
      p.rarity
    ] ?? 1;
    return sum + p.stage * rarityBonus + (p.perfect ? 10 : 0);
  }, 0);
}

export function gardenStage(plants: GardenPlant[]) {
  const pts = gardenPoints(plants);
  let idx = 0;
  GARDEN_STAGES.forEach((s, i) => {
    if (pts >= s.min) idx = i;
  });
  const next = GARDEN_STAGES[idx + 1];
  return {
    index: idx,
    level: idx + 1,
    name: GARDEN_STAGES[idx]!.name,
    points: pts,
    next: next ? next.name : null,
    nextAt: next ? next.min : null,
    pct: next
      ? Math.min(100, Math.round(((pts - GARDEN_STAGES[idx]!.min) / (next.min - GARDEN_STAGES[idx]!.min)) * 100))
      : 100,
  };
}

export type Discovery = {
  species: Species;
  count: number;
  bestStage: number;
  perfect: boolean;
  firstDate: string | null;
  plants: GardenPlant[];
};

export function buildDiscoveries(plants: GardenPlant[]): Discovery[] {
  return SPECIES.map((species) => {
    const mine = plants
      .filter((p) => p.species_key === species.key)
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      species,
      count: mine.length,
      bestStage: mine.reduce((m, p) => Math.max(m, p.stage), 0),
      perfect: mine.some((p) => p.perfect),
      firstDate: mine[0]?.date ?? null,
      plants: mine,
    };
  });
}
