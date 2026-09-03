import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Star } from "lucide-react";
import { PlantArt } from "@/components/garden/PlantArt";
import { SeedDiscovery } from "@/components/garden/SeedDiscovery";
import { Panel } from "@/components/lifeos/Bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  RARITY_META,
  seedForDate,
  speciesFor,
  stageForPct,
  stageLabel,
  type GardenPlant,
} from "@/lib/garden";
import { longDate } from "@/lib/lifeos";
import type { CategoryBreakdown } from "@/lib/points";
import { lockPastPlants, setPlantFavorite, upsertGardenPlant } from "@/lib/mutations";

export function TodayPlant({
  date,
  overall,
  breakdown,
  plants,
  refresh,
}: {
  date: string;
  overall: number;
  breakdown: CategoryBreakdown[];
  plants: GardenPlant[];
  refresh: () => void;
}) {
  const { user } = useAuth();
  const [discovery, setDiscovery] = useState(false);

  const existing = plants.find((p) => p.date === date);
  const species = useMemo(
    () =>
      existing
        ? speciesFor(existing.species_key)
        : seedForDate(date, user?.id ?? ""),
    [existing, date, user?.id],
  );
  const stage = stageForPct(overall);
  const perfect = stage >= 6;

  // Persist today's plant and freeze every earlier day exactly as it finished.
  useEffect(() => {
    if (!user || !breakdown.length) return;
    if (existing?.locked) return;
    void (async () => {
      await upsertGardenPlant({
        date,
        species_key: species.key,
        rarity: species.rarity,
        stage,
        overall_pct: overall,
        perfect,
        breakdown,
      });
      await lockPastPlants(date);
      if (!existing) refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, date, species.key, stage, overall, JSON.stringify(breakdown)]);

  // First time this species has ever shown up → seed discovery moment.
  const isNewSpecies = !plants.some(
    (p) => p.species_key === species.key && p.date !== date,
  );
  useEffect(() => {
    if (!isNewSpecies) return;
    const key = `seed-discovered:${date}:${species.key}`;
    if (typeof window === "undefined" || localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setDiscovery(true);
  }, [isNewSpecies, date, species.key]);

  const rarity = RARITY_META[species.rarity];

  return (
    <>
      <Panel className="overflow-hidden">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
          <div className="relative w-full max-w-[15rem] shrink-0">
            <div
              className="rounded-2xl border border-border/70 p-3"
              style={{
                background:
                  "radial-gradient(120% 90% at 50% 10%, oklch(0.32 0.06 150 / 0.55), oklch(0.2 0.04 155 / 0.75))",
              }}
            >
              <div className="h-52 w-full transition-all duration-700">
                <PlantArt species={species} stage={stage} />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Today&apos;s plant</p>
            <h2 className="font-display text-2xl font-bold">
              {perfect ? species.perfectName : species.name}
            </h2>
            <p className={`text-xs font-semibold uppercase tracking-wide ${rarity.color}`}>
              {rarity.label}
            </p>
            <p className="text-sm text-muted-foreground">{species.blurb}</p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="stat-number text-4xl">{overall}%</span>
              <span className="text-sm text-muted-foreground">
                · {stageLabel(stage, species)} (stage {stage}/6)
              </span>
            </div>

            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    n <= stage ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {perfect
                ? "Perfect day — this plant reached its final form and is locked into your garden forever."
                : `Earn points in every category to grow it further. ${longDate(date)}.`}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link to="/garden">
                  <Sparkles className="size-3.5" /> Open garden
                </Link>
              </Button>
              {existing && (
                <Button
                  size="sm"
                  variant={existing.favorite ? "default" : "outline"}
                  onClick={async () => {
                    await setPlantFavorite(existing.id, !existing.favorite);
                    refresh();
                  }}
                >
                  <Star className="size-3.5" />
                  {existing.favorite ? "Favorited" : "Favorite"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>

      <SeedDiscovery
        open={discovery}
        species={species}
        onClose={() => setDiscovery(false)}
      />
    </>
  );
}
