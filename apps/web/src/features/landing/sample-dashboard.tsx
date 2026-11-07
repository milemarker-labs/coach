import { Activity as ActivityIcon, Bike, Calculator, Clock, Footprints, Mountain, Route, Sparkles, Target } from "lucide-react";
import { MetricCard } from "@/components/common/metric-card.tsx";
import { MetricGroup } from "@/components/common/metric-group.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";

const fields = ["Sport", "Start time", "Distance", "Moving time", "Elevation", "Heart rate", "Suffer score", "Race goal"];

const loads = [
  { day: "Mon", value: 48 },
  { day: "Tue", value: 0 },
  { day: "Wed", value: 72 },
  { day: "Thu", value: 61 },
  { day: "Fri", value: 0 },
  { day: "Sat", value: 88 },
  { day: "Sun", value: 34 },
];

const fitness = [36, 38, 39, 41, 43, 44, 46, 47, 49, 50, 52, 54];
const fatigue = [30, 34, 41, 48, 46, 39, 37, 44, 53, 50, 45, 42];

const chart = { width: 640, height: 168, left: 32, right: 8, top: 16, bottom: 22, min: -16, max: 64 };

function chartX(index: number) {
  return chart.left + (index * (chart.width - chart.left - chart.right)) / (fitness.length - 1);
}

function chartY(value: number) {
  return chart.top + ((chart.max - value) / (chart.max - chart.min)) * (chart.height - chart.top - chart.bottom);
}

function chartLine(values: number[]) {
  return values.map((value, index) => `${index === 0 ? "M" : "L"}${chartX(index).toFixed(1)} ${chartY(value).toFixed(1)}`).join(" ");
}

const sessions = [
  { icon: Footprints, name: "Easy aerobic", when: "Thursday · Run", distance: "8.2 km", detail: "46:12 · 5:38 /km" },
  { icon: Footprints, name: "Tempo", when: "Saturday · Run", distance: "10.4 km", detail: "51:08 · 4:55 /km" },
  { icon: Bike, name: "Long ride", when: "Sunday · Ride", distance: "32.1 km", detail: "1h 24m · 22.9 km/h" },
];

/**
 * A static picture of the signed-in dashboard. Every figure is invented.
 * It shows the inputs, the reading, and the layout a visitor would get.
 */
export function SampleDashboard() {
  const form = fitness.map((value, index) => value - fatigue[index]!);
  const maxLoad = Math.max(...loads.map((day) => day.value));

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-sidebar">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-platinum">Sample dashboard</p>
        <Badge>Not live data</Badge>
      </figcaption>

      <div className="space-y-5 bg-background p-4 sm:p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Taken from Strava</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {fields.map((field) => (
              <li key={field}>
                <Badge tone="bronze">{field}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">How those fields are read</p>
          <ol className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <li>
              <span className="font-medium text-platinum">Load. </span>
              Suffer score, or one point per moving minute when heart rate is missing.
            </li>
            <li>
              <span className="font-medium text-platinum">Fitness and fatigue. </span>
              A 42-day average and a 7-day average of that daily load.
            </li>
            <li>
              <span className="font-medium text-platinum">Form. </span>
              Fitness minus fatigue. The last 7 days sit next to the 7 before.
            </li>
          </ol>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">Last 7 days, compared with the 7 days before</p>
          <MetricGroup label="Sample weekly overview">
            <MetricCard label="Activities" icon={ActivityIcon} value="5" delta={{ text: "+2", direction: "up", tone: "neutral" }} hint="3 the week before" />
            <MetricCard label="Distance" icon={Route} unit="km" value="42.6" delta={{ text: "+18%", direction: "up", tone: "positive" }} hint="36.1 km the week before" />
            <MetricCard label="Moving time" icon={Clock} value="4h 12m" delta={{ text: "+11%", direction: "up", tone: "positive" }} hint="3h 47m the week before" />
            <MetricCard
              label="Elevation gain"
              icon={Mountain}
              unit="m"
              value="486"
              delta={{ text: "+6%", direction: "up", tone: "positive" }}
              hint="458 m the week before"
            />
          </MetricGroup>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="p-4 hover:border-border lg:col-span-2">
              <p className="text-sm font-semibold text-platinum">Daily load</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Last 7 days</p>
              <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label="Sample daily load: rest on Tuesday and Friday, highest on Saturday.">
                {loads.map((day) => (
                  <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-20 w-full items-end">
                      <div
                        className="w-full rounded-sm bg-primary"
                        style={{ height: day.value === 0 ? "2px" : `${Math.max(8, (day.value / maxLoad) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-faint">{day.day}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 hover:border-border lg:col-span-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-platinum">Fitness, fatigue and form</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Last 12 weeks</p>
                </div>
                <ul className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-primary" aria-hidden="true" />
                    Fitness
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 bg-titanium" aria-hidden="true" />
                    Fatigue
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-px w-3 border-t border-dashed border-info" aria-hidden="true" />
                    Form
                  </li>
                </ul>
              </div>
              <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="mt-2 h-40 w-full" role="img" aria-label="Sample trend: fitness climbs to 54 while fatigue settles, leaving form at plus 12.">
                <line x1={chart.left} x2={chart.width - chart.right} y1={chartY(0)} y2={chartY(0)} stroke="var(--grid)" strokeDasharray="3 3" />
                <path d={chartLine(fitness)} fill="none" stroke="var(--bronze)" strokeWidth="2" />
                <path d={chartLine(fatigue)} fill="none" stroke="var(--titanium)" strokeWidth="1.5" />
                <path d={chartLine(form)} fill="none" stroke="var(--info)" strokeWidth="1.5" strokeDasharray="4 3" />
              </svg>
              <p className="text-xs text-muted-foreground">Fitness is a 42-day average of load, fatigue a 7-day average. Form is fitness minus fatigue.</p>
            </Card>
          </div>

          <MetricGroup label="Sample fitness, fatigue and form">
            <MetricCard label="Fitness (CTL)" value="54" delta={{ text: "+4", direction: "up", tone: "positive" }} hint="Change in 7 days" />
            <MetricCard label="Fatigue (ATL)" value="42" delta={{ text: "+8", direction: "up", tone: "neutral" }} hint="Change in 7 days" />
            <MetricCard
              label="Form (TSB)"
              value="+12"
              delta={{ text: "−4", direction: "down", tone: "neutral" }}
              aside={<Badge tone="info">Fresh</Badge>}
              hint="Fitness minus fatigue"
            />
            <MetricCard label="Weekly volume" icon={Route} unit="km" value="38.4" delta={{ text: "+11%", direction: "up", tone: "positive" }} hint="4-week average. Last 7 days: 42.6 km" />
          </MetricGroup>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="flex flex-col border-primary/25 hover:border-primary/40 lg:col-span-3">
              <div className="flex items-center justify-between gap-3 px-5 pt-4">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Coach&apos;s Take
                </h3>
                <Badge tone="bronze">AI-generated</Badge>
              </div>
              <div className="space-y-3 px-5 pt-3 pb-4">
                <p className="text-[15px] leading-snug font-semibold text-platinum">Volume is up, and form is still positive.</p>
                <p className="text-sm text-muted-foreground">
                  The last seven days added more distance than the week before, mostly from two runs and one ride. Fatigue rose after Saturday, and fitness is still ahead of it.
                </p>
                <div className="rounded-lg bg-primary-subtle px-3 py-2.5">
                  <p className="text-sm font-medium text-platinum">Keep the next day easy</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">A quality session can wait until form is back above +5 after the long ride.</p>
                </div>
                <p className="text-xs text-muted-foreground">Confidence: medium. Interpretations can be wrong; check them against the numbers.</p>
              </div>
              <div className="mt-auto border-t border-border px-5 py-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Calculator className="size-3.5" aria-hidden="true" />
                  Calculated from the activities
                </p>
                <dl className="space-y-1.5">
                  <SampleStat label="Distance vs the week before" value="+18%" tone="text-success" />
                  <SampleStat label="Longest run" value="14.2 km" tone="text-platinum" />
                  <SampleStat label="Rest days" value="2" tone="text-platinum" />
                </dl>
              </div>
            </Card>

            <div className="flex flex-col gap-4 lg:col-span-2">
              <Card className="hover:border-border">
                <div className="flex items-center justify-between gap-3 px-5 pt-4">
                  <h3 className="text-base font-semibold">Recent activities</h3>
                </div>
                <ul className="mt-2 divide-y divide-border px-2 pb-2">
                  {sessions.map((session) => (
                    <li key={session.name} className="flex items-center gap-3 px-3 py-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-titanium" aria-hidden="true">
                        <session.icon className="size-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-platinum">{session.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{session.when}</p>
                      </div>
                      <div className="num text-right">
                        <p className="text-sm font-semibold text-platinum">{session.distance}</p>
                        <p className="text-xs text-muted-foreground">{session.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="hover:border-border">
                <div className="flex items-start justify-between gap-3 px-5 pt-4">
                  <h3 className="text-base font-semibold">Training focus</h3>
                  <Target className="size-4 text-titanium" aria-hidden="true" />
                </div>
                <div className="space-y-4 px-5 pt-3 pb-5">
                  <div>
                    <p className="text-sm font-semibold text-platinum">Half marathon</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="num">21.1 km</span>
                      <Badge tone="bronze" className="num">
                        48 days to go
                      </Badge>
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Active days, last 7</span>
                      <span className="num font-semibold text-platinum">5 of 6</span>
                    </div>
                    <Progress value={5 / 6} label="Sample active days against weekly availability" />
                  </div>
                  <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                    <div>
                      <dt className="text-xs text-muted-foreground">Longest, 7 days</dt>
                      <dd className="num mt-0.5 text-sm font-semibold text-platinum">14.2 km</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Usual active days</dt>
                      <dd className="num mt-0.5 text-sm font-semibold text-platinum">4.5</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Form</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-platinum">Fresh</dd>
                    </div>
                  </dl>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function SampleStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className={`num shrink-0 font-semibold ${tone}`}>{value}</dd>
    </div>
  );
}
