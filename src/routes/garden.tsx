import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Lock, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Meter } from "@/components/lifeos/Bits";
import { PlantArt } from "@/components/garden/PlantArt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { setPlantFavorite } from "@/lib/mutations";
import { longDate } from "@/lib/lifeos";
import {
  RARITIES,
  RARITY_META,
  buildDiscoveries,
  gardenStage,
  speciesFor,
  stageLabel,
  STAGE_NAMES,
  type GardenPlant,
  type Rarity,
} from "@/lib/garden";
import { toast } from "sonner";

export const Route = createFileRoute("/garden")({
  head: () => ({
    meta: [
      { title: "Garden — Logan's Life OS" },
      {
        name: "description",
        content:
          "Every productive day grows a plant. Browse your permanent garden, favourite plants and botanical discovery book.",
      },
      { property: "og:title", content: "Garden — Logan's Life OS" },
      {
        property: "og:description",
        content: "A living history of every day you showed up, grown one plant at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Garden />
    </AppShell>
  ),
});

function Garden() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [selected, setSelected] = useState<GardenPlant | null>(null);
  const [bookOpen, setBookOpen] = useState(false);

  const plants = data?.plants ?? [];
  const stage = useMemo(() => gardenStage(plants), [plants]);
  const favorites = plants.filter((p) => p.favorite).slice(0, 5);
  const rest = [...plants]
    .filter((p) => !p.favorite)
    .sort((a, b) => b.date.localeCompare(a.date));
  const perfectDays = plants.filter((p) => p.perfect).length;

  if (isLoading || !data) return <p className="text-muted-foreground">Waking the garden…</p>;

  async function toggleFav(p: GardenPlant) {
    if (!p.favorite && favorites.length >= 5) {
      toast.error("You can keep 5 favourite plants — unstar one first.");
      return;
    }
    await setPlantFavorite(p.id, !p.favorite);
    refresh();
    toast.success(!p.favorite ? "Added to favourites ⭐" : "Removed from favourites");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
            Garden level {stage.level} · {stage.name}
          </p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">🌿 Your garden</h1>
          <p className="text-sm text-muted-foreground">
            {plants.length} plants grown · {perfectDays} perfect days · never lost, never replaced.
          </p>
        </div>
        <Button onClick={() => setBookOpen(true)} variant="secondary">
          <BookOpen className="size-4" /> Garden Collection
        </Button>
      </div>

      <Panel title="Garden progression">
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>{stage.name}</span>
          <span className="font-mono">
            {stage.points}
            {stage.nextAt ? ` / ${stage.nextAt} → ${stage.next}` : " · fully grown"}
          </span>
        </div>
        <Meter value={stage.pct} className="mt-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          Rare, legendary and perfect-day plants push the garden forward much faster than ordinary
          days.
        </p>
      </Panel>

      <GardenScene
        level={stage.level}
        favorites={favorites}
        plants={rest}
        onPick={setSelected}
      />

      <PlantDetail
        plant={selected}
        onClose={() => setSelected(null)}
        onToggleFavorite={toggleFav}
        perfectIndex={
          selected
            ? plants
                .filter((p) => p.perfect && p.date <= selected.date)
                .length
            : 0
        }
      />

      <CollectionBook open={bookOpen} onClose={() => setBookOpen(false)} plants={plants} />
    </div>
  );
}

/* ---------------- physical garden ---------------- */

function GardenScene({
  level,
  favorites,
  plants,
  onPick,
}: {
  level: number;
  favorites: GardenPlant[];
  plants: GardenPlant[];
  onPick: (p: GardenPlant) => void;
}) {
  return (
    <div className="space-y-4">
      <section
        className="relative overflow-hidden rounded-2xl border border-border p-4 sm:p-6"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.28 0.055 165) 0%, oklch(0.23 0.05 150) 45%, oklch(0.2 0.045 120) 100%)",
        }}
      >
        <Decor level={level} />

        <div className="relative">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary">
            ⭐ Favourites
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {favorites.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Star up to 5 plants and they will always stand at the front of the garden.
              </p>
            )}
            {favorites.map((p) => (
              <PlantPlot key={p.id} plant={p} big onPick={onPick} />
            ))}
          </div>

          <div className="mt-6 h-px w-full bg-[oklch(0.4_0.05_150_/_0.5)]" />

          <h2 className="mt-4 font-display text-xs font-bold uppercase tracking-widest text-primary">
            The beds
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-1 gap-y-3">
            {plants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Your garden starts today — earn points and today&apos;s plant takes root here.
              </p>
            )}
            {plants.map((p, i) => (
              <PlantPlot key={p.id} plant={p} onPick={onPick} offset={i % 3} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Decor({ level }: { level: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-14 bg-[oklch(0.3_0.05_120_/_0.55)]" />
      <div className="absolute -left-6 bottom-2 text-4xl opacity-70">🌳</div>
      <div className="absolute right-4 top-3 text-2xl opacity-60">🦋</div>
      {level >= 2 && <div className="absolute right-10 bottom-3 text-3xl opacity-70">🪴</div>}
      {level >= 2 && <div className="absolute left-1/3 bottom-1 text-xl opacity-60">🍄</div>}
      {level >= 3 && <div className="absolute left-8 top-4 text-2xl opacity-50">🌸</div>}
      {level >= 3 && <div className="absolute right-1/3 bottom-4 text-2xl opacity-60">🪵</div>}
      {level >= 4 && <div className="absolute right-6 top-1/2 text-2xl opacity-60">✨</div>}
      {level >= 4 && <div className="absolute left-1/2 top-2 text-xl opacity-50">🐝</div>}
      {level >= 5 && <div className="absolute left-4 bottom-8 text-3xl opacity-70">⛲</div>}
    </div>
  );
}

function PlantPlot({
  plant,
  onPick,
  big = false,
  offset = 0,
}: {
  plant: GardenPlant;
  onPick: (p: GardenPlant) => void;
  big?: boolean;
  offset?: number;
}) {
  const species = speciesFor(plant.species_key);
  const rarity = RARITY_META[plant.rarity];
  return (
    <button
      onClick={() => onPick(plant)}
      style={{ marginTop: offset * 8 }}
      className={`group relative rounded-xl border border-transparent px-1 pb-1 transition-transform hover:-translate-y-1 hover:border-primary/40 ${
        big ? "w-28" : "w-20"
      }`}
      aria-label={`${species.name}, ${plant.date}`}
    >
      <div className={big ? "h-32" : "h-24"}>
        <PlantArt species={species} stage={plant.stage} />
      </div>
      <p className="truncate text-[10px] text-foreground/80">{species.name}</p>
      <p className={`text-[9px] uppercase ${rarity.color}`}>
        {plant.overall_pct}%{plant.perfect ? " ✦" : ""}
      </p>
      {plant.favorite && (
        <Star className="absolute right-1 top-1 size-3 fill-money text-money" />
      )}
    </button>
  );
}

/* ---------------- plant detail ---------------- */

function PlantDetail({
  plant,
  onClose,
  onToggleFavorite,
  perfectIndex,
}: {
  plant: GardenPlant | null;
  onClose: () => void;
  onToggleFavorite: (p: GardenPlant) => void;
  perfectIndex: number;
}) {
  if (!plant) return null;
  const species = speciesFor(plant.species_key);
  const rarity = RARITY_META[plant.rarity];
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {plant.perfect ? species.perfectName : species.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="mx-auto h-44 w-44">
            <PlantArt species={species} stage={plant.stage} />
          </div>
          <p className={`text-center text-xs font-bold uppercase tracking-[0.2em] ${rarity.color}`}>
            {rarity.label}
          </p>
          <p className="text-center text-sm text-muted-foreground">{longDate(plant.date)}</p>
          <p className="text-center font-display text-xl font-bold">
            {plant.overall_pct}%{plant.perfect ? " — PERFECT DAY" : ""}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Final growth: {stageLabel(plant.stage, species)} (stage {plant.stage}/6)
          </p>
          <div className="space-y-1 rounded-lg border border-border bg-surface/40 p-3 text-sm">
            {plant.breakdown?.length ? (
              plant.breakdown.map((b) => (
                <div key={b.key} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {b.emoji} {b.label}
                  </span>
                  <span className="font-mono">
                    {b.points}/{b.target}
                    {b.points >= b.target && <span className="ml-1 text-primary">✓</span>}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No category detail saved for this day.</p>
            )}
          </div>
          {plant.perfect && (
            <p className="text-center text-xs text-primary">
              Your {ordinal(perfectIndex)} perfect day.
            </p>
          )}
          <Button
            variant={plant.favorite ? "default" : "outline"}
            className="w-full"
            onClick={() => onToggleFavorite(plant)}
          >
            <Star className="size-4" /> {plant.favorite ? "Remove favourite" : "Make favourite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ---------------- discovery book ---------------- */

function CollectionBook({
  open,
  onClose,
  plants,
}: {
  open: boolean;
  onClose: () => void;
  plants: GardenPlant[];
}) {
  const [filter, setFilter] = useState<Rarity | "all" | "undiscovered">("all");
  const discoveries = useMemo(() => buildDiscoveries(plants), [plants]);
  const found = discoveries.filter((d) => d.count > 0).length;

  const shown = discoveries.filter((d) => {
    if (filter === "all") return true;
    if (filter === "undiscovered") return d.count === 0;
    return d.species.rarity === filter;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            📖 Plant Discovery Book — {found}/{discoveries.length} species
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {(["all", ...RARITIES, "undiscovered"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="h-7 rounded-full px-2.5 text-[11px] capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {shown.map((d) => {
            const rarity = RARITY_META[d.species.rarity];
            const undiscovered = d.count === 0;
            return (
              <div
                key={d.species.key}
                className={`rounded-xl border bg-surface/40 p-3 ${rarity.ring}`}
              >
                <div className="flex gap-3">
                  <div className="h-24 w-20 shrink-0">
                    <PlantArt
                      species={d.species}
                      stage={undiscovered ? 5 : d.bestStage}
                      silhouette={undiscovered}
                      soil={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold">
                      {undiscovered ? "???" : d.species.name}
                    </p>
                    <p className={`text-[10px] font-bold uppercase ${rarity.color}`}>
                      {rarity.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {undiscovered
                        ? "Not yet discovered."
                        : `Grown ${d.count}× · best: ${stageLabel(d.bestStage, d.species)}`}
                    </p>
                    {!undiscovered && (
                      <p className="text-[11px] text-muted-foreground">
                        First found {longDate(d.firstDate!)}
                      </p>
                    )}
                  </div>
                </div>

                <ul className="mt-2 space-y-0.5 text-[11px]">
                  {STAGE_NAMES.map((name, i) => {
                    const stageNo = i + 1;
                    const unlocked = d.bestStage >= stageNo;
                    const label =
                      stageNo === 6 ? `Perfect form — ${d.species.perfectName}` : name;
                    return (
                      <li
                        key={name}
                        className={`flex items-center gap-1.5 ${
                          unlocked ? "text-foreground/85" : "text-muted-foreground"
                        }`}
                      >
                        {unlocked ? (
                          <span className="text-primary">✓</span>
                        ) : (
                          <Lock className="size-3" />
                        )}
                        <span>
                          Stage {stageNo} — {unlocked ? label : "???"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
