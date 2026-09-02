import { PlantArt } from "@/components/garden/PlantArt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RARITY_META, type Species } from "@/lib/garden";

export function SeedDiscovery({
  open,
  species,
  onClose,
}: {
  open: boolean;
  species: Species;
  onClose: () => void;
}) {
  const rarity = RARITY_META[species.rarity];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm overflow-hidden text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: `radial-gradient(60% 40% at 50% 0%, ${rarity.glow}, transparent)` }}
        />
        <div className="relative animate-scale-in space-y-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-primary">
            🌱 New seed discovered
          </p>
          <div className="mx-auto h-40 w-40 animate-fade-in">
            <PlantArt species={species} stage={5} soil={false} />
          </div>
          <h2 className="font-display text-2xl font-bold">{species.name}</h2>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${rarity.color}`}>
            Rarity: {rarity.label}
          </p>
          <p className="px-4 text-sm text-muted-foreground">
            &ldquo;Grow this plant to discover all of its growth stages.&rdquo;
          </p>
          <Button className="mt-1 w-full" onClick={onClose}>
            Plant it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
