import { useId } from "react";
import type { Species } from "@/lib/garden";
import { cn } from "@/lib/utils";

/**
 * Generative 2D plant art. Every species shares the same growth progression
 * (seed -> sprout -> young -> growing -> bloom -> perfect form) but renders
 * with its own palette, silhouette and petal geometry.
 */
export function PlantArt({
  species,
  stage,
  className,
  soil = true,
  silhouette = false,
}: {
  species: Species;
  stage: number;
  className?: string;
  soil?: boolean;
  silhouette?: boolean;
  }) {
  const uid = useId().replace(/[:]/g, "");
  const s = Math.min(6, Math.max(1, stage));
  const perfect = s === 6;

  const stemTop = [138, 120, 100, 82, 64, 56][s - 1];
  const headScale = s <= 3 ? 0 : s === 4 ? 0.55 : s === 5 ? 1 : 1.12;
  const petal = silhouette ? "#26382C" : species.petal;
  const petal2 = silhouette ? "#1E2E23" : species.petal2;
  const center = silhouette ? "#1A251E" : species.center;
  const leaf = silhouette ? "#233329" : species.leaf;

  return (
    <svg
      viewBox="0 0 120 150"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={`${species.name} — growth stage ${s}`}
    >
      <defs>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={petal} stopOpacity="0.55" />
          <stop offset="100%" stopColor={petal} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`petal-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={petal} />
          <stop offset="100%" stopColor={petal2} />
        </linearGradient>
        <linearGradient id={`stem-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#2F5F33" />
          <stop offset="100%" stopColor={leaf} />
        </linearGradient>
      </defs>

      {perfect && !silhouette && (
        <circle cx="60" cy="62" r="52" fill={`url(#glow-${uid})`} className="animate-pulse" />
      )}

      {soil && (
        <g>
          <ellipse cx="60" cy="136" rx="42" ry="11" fill="#3E2C1E" />
          <ellipse cx="60" cy="133" rx="38" ry="9" fill="#54402C" />
          <circle cx="42" cy="132" r="1.6" fill="#3E2C1E" />
          <circle cx="76" cy="135" r="1.4" fill="#3E2C1E" />
          <circle cx="66" cy="130" r="1.1" fill="#3E2C1E" />
        </g>
      )}

      {s === 1 ? (
        <g>
          <ellipse cx="60" cy="128" rx="6" ry="4.6" fill="#6B4A2E" />
          <path d="M60 126 q0 -6 4 -8" stroke={leaf} strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="64.6" cy="117.4" rx="3.4" ry="2" fill={leaf} transform="rotate(-25 64.6 117.4)" />
        </g>
      ) : (
        <g>
          <path
            d={`M60 132 C 56 ${(132 + stemTop) / 2}, 64 ${(132 + stemTop) / 2 - 6}, 60 ${stemTop}`}
            stroke={`url(#stem-${uid})`}
            strokeWidth={s >= 4 ? 4 : 3}
            fill="none"
            strokeLinecap="round"
          />
          <Leaf x={60} y={118} dir={-1} scale={0.9} color={leaf} />
          {s >= 3 && <Leaf x={60} y={104} dir={1} scale={1} color={leaf} />}
          {s >= 4 && <Leaf x={60} y={92} dir={-1} scale={1.1} color={leaf} />}
          {s >= 5 && <Leaf x={60} y={80} dir={1} scale={0.95} color={leaf} />}

          {headScale > 0 && (
            <g transform={`translate(60 ${stemTop}) scale(${headScale})`}>
              <Head
                species={species}
                bud={s === 4}
                perfect={perfect}
                uid={uid}
                petal={petal}
                petal2={petal2}
                centerColor={center}
                leafColor={leaf}
              />
            </g>
          )}
        </g>
      )}

      {perfect && !silhouette && (
        <g fill="#FFF6C7">
          <Sparkle x={26} y={52} />
          <Sparkle x={96} y={44} />
          <Sparkle x={88} y={96} />
          <Sparkle x={30} y={92} />
        </g>
      )}
    </svg>
  );
}

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`}
      className="animate-pulse"
    />
  );
}

function Leaf({
  x,
  y,
  dir,
  scale,
  color,
}: {
  x: number;
  y: number;
  dir: number;
  scale: number;
  color: string;
}) {
  return (
    <path
      d={`M${x} ${y} q ${14 * dir * scale} ${-3 * scale} ${18 * dir * scale} ${-10 * scale} q ${-13 * dir * scale} ${-1 * scale} ${-18 * dir * scale} ${10 * scale} Z`}
      fill={color}
    />
  );
}

function Head({
  species,
  bud,
  perfect,
  uid,
  petal,
  petal2,
  centerColor,
  leafColor,
}: {
  species: Species;
  bud: boolean;
  perfect: boolean;
  uid: string;
  petal: string;
  petal2: string;
  centerColor: string;
  leafColor: string;
}) {
  const fill = `url(#petal-${uid})`;

  if (bud) {
    return (
      <g>
        <ellipse cx="0" cy="-6" rx="7" ry="11" fill={fill} />
        <path d="M-7 -2 q7 8 14 0 q-7 5 -14 0Z" fill={leafColor} />
      </g>
    );
  }

  switch (species.form) {
    case "mushroom":
      return (
        <g>
          <path d="M-16 0 a16 13 0 0 1 32 0 z" fill={fill} />
          <circle cx="-7" cy="-5" r="2.6" fill={centerColor} />
          <circle cx="4" cy="-7" r="2" fill={centerColor} />
          <circle cx="9" cy="-2" r="1.6" fill={centerColor} />
          <rect x="-4" y="0" width="8" height="14" rx="3" fill="#EADCC4" />
        </g>
      );
    case "fern":
      return (
        <g>
          {Array.from({ length: species.petals }).map((_, i) => {
            const t = i / (species.petals - 1);
            const side = i % 2 === 0 ? -1 : 1;
            return (
              <path
                key={i}
                d={`M0 ${-t * 26} q ${12 * side} ${-3} ${17 * side} ${-9}`}
                stroke={i % 2 === 0 ? petal : petal2}
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
        </g>
      );
    case "clover":
      return (
        <g>
          {Array.from({ length: perfect ? 4 : 3 }).map((_, i) => {
            const a = (i / (perfect ? 4 : 3)) * 360 - 90;
            return (
              <ellipse
                key={i}
                cx="0"
                cy="-11"
                rx="8"
                ry="10"
                fill={i % 2 ? petal2 : petal}
                transform={`rotate(${a})`}
              />
            );
          })}
          <circle cx="0" cy="0" r="2.4" fill={centerColor} />
        </g>
      );
    case "tulip":
      return (
        <g>
          <path d="M-11 2 q0 -20 11 -22 q11 2 11 22 q-11 7 -22 0Z" fill={fill} />
          <path d="M-4 -18 q4 12 0 20" stroke={centerColor} strokeWidth="2" fill="none" opacity="0.5" />
        </g>
      );
    case "bell":
      return (
        <g>
          {[-12, 0, 12].map((dx, i) => (
            <g key={i} transform={`translate(${dx} ${i === 1 ? 4 : 0})`}>
              <path d="M-6 -6 q6 16 12 0 q-1 12 -6 13 q-5 -1 -6 -13Z" fill={i % 2 ? petal2 : petal} />
            </g>
          ))}
        </g>
      );
    case "spike":
      return (
        <g>
          {Array.from({ length: species.petals }).map((_, i) => {
            const y = -i * 4.4;
            const side = i % 2 === 0 ? -1 : 1;
            return (
              <ellipse
                key={i}
                cx={side * 3.4}
                cy={y}
                rx="4.6"
                ry="3.4"
                fill={i % 3 === 0 ? petal2 : petal}
              />
            );
          })}
        </g>
      );
    case "blossom":
      return (
        <g>
          {[
            [0, -6, 1],
            [-13, 2, 0.8],
            [13, 1, 0.85],
            [-6, -16, 0.7],
            [7, -15, 0.75],
          ].map(([cx, cy, sc], k) => (
            <g key={k} transform={`translate(${cx} ${cy}) scale(${sc})`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-6"
                  rx="4.4"
                  ry="6"
                  fill={k % 2 ? petal2 : petal}
                  transform={`rotate(${(i / 5) * 360})`}
                />
              ))}
              <circle r="2.2" fill={centerColor} />
            </g>
          ))}
        </g>
      );
    case "lotus":
      return (
        <g>
          {Array.from({ length: species.petals }).map((_, i) => {
            const a = -180 + (i / (species.petals - 1)) * 180;
            return (
              <ellipse
                key={i}
                cx="0"
                cy="-11"
                rx="5.4"
                ry="13"
                fill={i % 2 ? petal2 : petal}
                transform={`rotate(${a + 90})`}
              />
            );
          })}
          <circle cx="0" cy="-4" r="5" fill={centerColor} />
        </g>
      );
    case "orchid":
      return (
        <g>
          {Array.from({ length: species.petals }).map((_, i) => {
            const a = (i / species.petals) * 360;
            return (
              <path
                key={i}
                d="M0 0 q6 -9 0 -19 q-6 10 0 19Z"
                fill={i % 2 ? petal2 : petal}
                transform={`rotate(${a})`}
              />
            );
          })}
          <circle r="4.4" fill={centerColor} />
        </g>
      );
    default:
      return (
        <g>
          {Array.from({ length: species.petals }).map((_, i) => (
            <ellipse
              key={i}
              cx="0"
              cy="-12"
              rx="4.8"
              ry="11"
              fill={i % 2 ? petal2 : petal}
              transform={`rotate(${(i / species.petals) * 360})`}
            />
          ))}
          <circle r="6.4" fill={centerColor} />
          {perfect && <circle r="9.6" fill="none" stroke={centerColor} strokeWidth="1" opacity="0.5" />}
        </g>
      );
  }
}
