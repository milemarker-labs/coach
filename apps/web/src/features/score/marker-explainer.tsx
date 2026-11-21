import { SCORE_BANDS, SCORE_DESCRIPTIONS, SCORE_LABELS, SCORE_NAME, SCORE_WEIGHTS, type ScoreComponentKey } from "@coach/shared";
import * as Dialog from "@radix-ui/react-dialog";
import { Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { componentIcons } from "./marker-breakdown.tsx";

const keys = Object.keys(SCORE_WEIGHTS) as ScoreComponentKey[];

const formulas: Record<ScoreComponentKey, string> = {
  base: "100 × (1 − e^(−fitness ÷ 40)), where fitness is the 42-day load average.",
  consistency: "60 × active days in 28 ÷ 16, plus 40 × weeks with 3+ sessions ÷ 4.",
  balance: "Acute ÷ chronic load. 0.8–1.3 scores 100. It fades to 40 when undertrained and falls to 0 at 2.0.",
  momentum: "50 + 125 × the relative change in fitness over 28 days.",
  efficiency: "50 + 500 × the change in median metres per minute per heartbeat (last 6 weeks against the 6 before).",
};

/** How the number is built. Opens from an info button next to the ring. */
export function MarkerExplainer({ trigger }: { trigger?: ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <button type="button" className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
            <Info className="size-3.5" aria-hidden="true" />
            How it works
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="animate-pop-in fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-hover bg-sidebar p-6 shadow-2xl shadow-shade/60 outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">The number</p>
              <Dialog.Title className="mt-1 font-display text-2xl font-semibold">
                How your <span className="text-spectrum">{SCORE_NAME}</span> is built
              </Dialog.Title>
            </div>
            <Dialog.Close className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground" aria-label="Close">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
            One 0–100 reading of where your fitness stands, calculated from your logged activities and nothing else. Five parts, each scored 0–100, blended by weight. A part with no data drops out
            and the rest are re-weighted, so a missing heart-rate strap never counts against you. Load is the Strava suffer score, or one point per moving minute when there is none.
          </Dialog.Description>

          <ul className="mt-6 space-y-4">
            {keys.map((key) => {
              const Icon = componentIcons[key];
              return (
                <li key={key} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground" aria-hidden="true">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-baseline gap-2">
                      <span className="font-semibold text-foreground">{SCORE_LABELS[key]}</span>
                      <span className="num text-xs text-primary">{Math.round(SCORE_WEIGHTS[key] * 100)}%</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{SCORE_DESCRIPTIONS[key]}</p>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-faint">{formulas[key]}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Bands</p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full">
              {SCORE_BANDS.map((band, index) => {
                const next = SCORE_BANDS[index + 1]?.min ?? 100;
                return <span key={band.key} className="h-full bg-spectrum" style={{ width: `${next - band.min}%`, opacity: 0.35 + index * 0.16 }} />;
              })}
            </div>
            <ul className="mt-2 grid grid-cols-5 gap-1 text-[11px]">
              {SCORE_BANDS.map((band) => (
                <li key={band.key}>
                  <span className="block font-medium text-foreground">{band.label}</span>
                  <span className="num text-faint">{band.min}+</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-xs text-faint">
            Today&apos;s call and the directions come from the same readings: form (fitness minus fatigue), the load ratio, days since your last session, your typical session length and your race date.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
