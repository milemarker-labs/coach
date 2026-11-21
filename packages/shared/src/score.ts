/**
 * The Marker: one 0–100 number for where an athlete's fitness stands, read from their logs.
 *
 * It blends five readings of the stored activities. Each one is 0–100 on its own, and the
 * Marker is their weighted average. A reading with no data (efficiency needs heart rate)
 * drops out and the others are re-weighted, so a missing sensor never counts as a zero.
 *
 *  - Base         (35%) how much aerobic fitness the last six weeks built (42-day load average).
 *  - Consistency  (25%) active days in the last four weeks, and weeks with three or more sessions.
 *  - Balance      (20%) acute load against that base (7-day vs 42-day). 0.8–1.3 is the sweet spot.
 *  - Momentum     (10%) whether the base grew or shrank over the last four weeks.
 *  - Efficiency   (10%) speed per heartbeat in the main sport, last six weeks against the six before.
 *
 * Load is the Strava suffer score when there is one, otherwise one point per moving minute,
 * the same rule the rest of Coach uses. Everything here is deterministic arithmetic.
 *
 * The product name lives in SCORE_NAME so it can be renamed in one place.
 */

import { effortKind } from "./sport.js";

export const SCORE_NAME = "Marker";
export const SCORE_VERSION = 1;

const CTL_DAYS = 42;
const ATL_DAYS = 7;
const HISTORY_DAYS = 365;
const TREND_DAYS = 90;
const EFFICIENCY_WINDOW = 42;
const DAY_MS = 86_400_000;

export type ScoreComponentKey = "base" | "consistency" | "balance" | "momentum" | "efficiency";

export const SCORE_WEIGHTS: Record<ScoreComponentKey, number> = {
  base: 0.35,
  consistency: 0.25,
  balance: 0.2,
  momentum: 0.1,
  efficiency: 0.1,
};

export const SCORE_LABELS: Record<ScoreComponentKey, string> = {
  base: "Base",
  consistency: "Consistency",
  balance: "Balance",
  momentum: "Momentum",
  efficiency: "Efficiency",
};

export const SCORE_DESCRIPTIONS: Record<ScoreComponentKey, string> = {
  base: "Aerobic fitness built over the last six weeks.",
  consistency: "How often you train across the last four weeks.",
  balance: "Recent load against what your body is used to.",
  momentum: "Whether your base is growing or fading.",
  efficiency: "Speed per heartbeat in your main sport, now against six weeks ago.",
};

/** The fields the Marker reads. Both the API rows and the web's activity summaries map onto this. */
export interface ScoreActivity {
  /** Local calendar day, `YYYY-MM-DD`. */
  day: string;
  sport: string;
  sufferScore: number | null;
  movingTime: number | null;
  distance: number | null;
  averageSpeed: number | null;
  averageHeartrate: number | null;
}

export interface ScoreComponent {
  key: ScoreComponentKey;
  label: string;
  /** 0–100, or null when there is nothing to read. */
  value: number | null;
  weight: number;
  /** One line with the numbers behind the reading. */
  detail: string;
}

export type ScoreBandKey = "starting" | "building" | "steady" | "strong" | "peak";

export interface ScoreBand {
  key: ScoreBandKey;
  label: string;
  /** Inclusive lower bound. */
  min: number;
}

export const SCORE_BANDS: ScoreBand[] = [
  { key: "starting", label: "Getting started", min: 0 },
  { key: "building", label: "Building", min: 25 },
  { key: "steady", label: "Steady", min: 45 },
  { key: "strong", label: "Strong", min: 65 },
  { key: "peak", label: "Peak", min: 80 },
];

export type CallKind = "rest" | "easy" | "steady" | "quality" | "long";

export interface TodayCall {
  kind: CallKind;
  title: string;
  reason: string;
  /** Suggested session length in minutes, from the athlete's own typical session. Null for rest. */
  minutes: number | null;
  /** Rough intensity, 0 (rest) to 4 (hard). */
  intensity: 0 | 1 | 2 | 3 | 4;
}

export type DirectionTone = "push" | "hold" | "recover" | "praise";

export interface Direction {
  id: string;
  title: string;
  detail: string;
  tone: DirectionTone;
  /** The component this direction is about, so the interface can link the two. */
  component: ScoreComponentKey | "goal";
}

export interface ScoreTrendPoint {
  day: string;
  value: number;
}

export interface MarkerScore {
  name: string;
  version: number;
  day: string;
  value: number;
  band: ScoreBand;
  components: ScoreComponent[];
  confidence: "low" | "medium" | "high";
  /** Change against seven days earlier. Null without a week of trend. */
  delta7: number | null;
  /** Daily score, oldest first, up to 90 days. */
  trend: ScoreTrendPoint[];
  call: TodayCall;
  directions: Direction[];
  /** The raw readings behind the components, for tooltips and the explainer. */
  readings: {
    fitness: number;
    fatigue: number;
    form: number;
    /** Acute to chronic load ratio. Null while the base is too small to divide by. */
    ratio: number | null;
    activeDays28: number;
    strongWeeks: number;
    daysSinceLast: number | null;
    typicalMinutes: number | null;
  };
}

export interface ScoreOptions {
  /** Days until the athlete's goal race, when one is set. */
  daysToRace?: number | null;
}

// ---------------------------------------------------------------------------------------------
// Calendar helpers (UTC arithmetic on `YYYY-MM-DD` keys).

function toMs(key: string): number {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function shift(key: string, days: number): string {
  return fromMs(toMs(key) + days * DAY_MS);
}

function weekdayOf(key: string): number {
  return new Date(toMs(key)).getUTCDay();
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : (sorted[middle] ?? 0);
}

/** Suffer score, or one point per moving minute. Same rule as the charts. */
export function scoreLoad(activity: Pick<ScoreActivity, "sufferScore" | "movingTime">): number {
  if (activity.sufferScore != null && activity.sufferScore > 0) return activity.sufferScore;
  if (activity.movingTime != null && activity.movingTime > 0) return activity.movingTime / 60;
  return 0;
}

// ---------------------------------------------------------------------------------------------
// Component curves. Each takes plain numbers so they can be tested on their own.

/** 42-day load average to 0–100. Saturates: 20 → 39, 40 → 63, 60 → 78, 90 → 89. */
export function baseScore(fitness: number): number {
  return clamp(100 * (1 - Math.exp(-Math.max(0, fitness) / 40)));
}

/** 16 active days in 28 and four weeks of three or more sessions scores 100. */
export function consistencyScore(activeDays28: number, strongWeeks: number): number {
  return clamp(60 * Math.min(1, activeDays28 / 16) + 40 * Math.min(1, strongWeeks / 4));
}

/** Acute:chronic ratio. 0.8–1.3 scores 100. Too little fades to 40, too much falls to 0 at 2.0. */
export function balanceScore(ratio: number): number {
  if (ratio >= 0.8 && ratio <= 1.3) return 100;
  if (ratio < 0.8) return clamp(40 + ((ratio - 0.3) / 0.5) * 60, 40, 100);
  return clamp(100 - ((ratio - 1.3) / 0.7) * 100);
}

/** Relative change of the base over four weeks. Flat is 50, +40% is 100, −40% is 0. */
export function momentumScore(fitnessNow: number, fitnessBefore: number): number {
  const change = (fitnessNow - fitnessBefore) / Math.max(fitnessBefore, 10);
  return clamp(50 + change * 125);
}

/** Relative change in speed per heartbeat. Flat is 50, +10% is 100, −10% is 0. */
export function efficiencyScore(change: number): number {
  return clamp(50 + change * 500);
}

export function bandFor(value: number): ScoreBand {
  let band = SCORE_BANDS[0]!;
  for (const candidate of SCORE_BANDS) if (value >= candidate.min) band = candidate;
  return band;
}

// ---------------------------------------------------------------------------------------------

interface DayState {
  day: string;
  load: number;
  active: boolean;
  fitness: number;
  fatigue: number;
}

interface EfficiencySample {
  day: string;
  sport: string;
  value: number;
}

function efficiencySamples(activities: ScoreActivity[]): EfficiencySample[] {
  return activities
    .filter((activity) => (activity.averageSpeed ?? 0) > 0 && (activity.averageHeartrate ?? 0) > 60 && (activity.distance ?? 0) >= 2000)
    .map((activity) => ({
      day: activity.day,
      sport: activity.sport,
      // Metres per minute per beat. Larger is a more economical engine.
      value: ((activity.averageSpeed ?? 0) * 60) / (activity.averageHeartrate ?? 1),
    }));
}

/** The sport with the most heart-rate samples, so efficiency never mixes a ride with a run. */
function mainSport(samples: EfficiencySample[]): string | null {
  const counts = new Map<string, number>();
  for (const sample of samples) counts.set(sample.sport, (counts.get(sample.sport) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [sport, count] of counts) {
    if (count > bestCount) {
      best = sport;
      bestCount = count;
    }
  }
  return best;
}

function efficiencyChange(samples: EfficiencySample[], day: string): { change: number; recent: number; before: number } | null {
  const recentFrom = shift(day, -(EFFICIENCY_WINDOW - 1));
  const beforeFrom = shift(recentFrom, -EFFICIENCY_WINDOW);
  const recent = median(samples.filter((s) => s.day >= recentFrom && s.day <= day).map((s) => s.value));
  const before = median(samples.filter((s) => s.day >= beforeFrom && s.day < recentFrom).map((s) => s.value));
  const recentCount = samples.filter((s) => s.day >= recentFrom && s.day <= day).length;
  const beforeCount = samples.filter((s) => s.day >= beforeFrom && s.day < recentFrom).length;
  if (recent == null || before == null || recentCount < 3 || beforeCount < 3 || before <= 0) return null;
  return { change: (recent - before) / before, recent, before };
}

function buildDays(activities: ScoreActivity[], today: string): DayState[] {
  let start = shift(today, -(TREND_DAYS + CTL_DAYS));
  for (const activity of activities) if (activity.day < start) start = activity.day;
  const earliest = shift(today, -HISTORY_DAYS);
  if (start < earliest) start = earliest;

  const loads = new Map<string, { load: number; active: boolean }>();
  for (const activity of activities) {
    if (activity.day < start || activity.day > today) continue;
    const entry = loads.get(activity.day) ?? { load: 0, active: false };
    entry.load += scoreLoad(activity);
    entry.active = true;
    loads.set(activity.day, entry);
  }

  const fitnessWeight = 1 - Math.exp(-1 / CTL_DAYS);
  const fatigueWeight = 1 - Math.exp(-1 / ATL_DAYS);
  let fitness = 0;
  let fatigue = 0;
  const days: DayState[] = [];
  for (let cursor = start; cursor <= today; cursor = shift(cursor, 1)) {
    const entry = loads.get(cursor);
    const load = entry?.load ?? 0;
    fitness += (load - fitness) * fitnessWeight;
    fatigue += (load - fatigue) * fatigueWeight;
    days.push({ day: cursor, load, active: entry?.active ?? false, fitness, fatigue });
  }
  return days;
}

interface Evaluation {
  value: number;
  components: ScoreComponent[];
  ratio: number | null;
  activeDays28: number;
  strongWeeks: number;
}

function evaluate(days: DayState[], index: number, samples: EfficiencySample[]): Evaluation {
  const today = days[index]!;
  const window28 = days.slice(Math.max(0, index - 27), index + 1);
  const activeDays28 = window28.filter((day) => day.active).length;
  let strongWeeks = 0;
  for (let week = 0; week < 4; week += 1) {
    const end = index - week * 7;
    const slice = days.slice(Math.max(0, end - 6), end + 1);
    if (slice.filter((day) => day.active).length >= 3) strongWeeks += 1;
  }
  const before = days[Math.max(0, index - 28)]!;
  const ratio = today.fitness >= 3 ? today.fatigue / today.fitness : null;
  const efficiency = efficiencyChange(samples, today.day);

  const components: ScoreComponent[] = [
    {
      key: "base",
      label: SCORE_LABELS.base,
      value: baseScore(today.fitness),
      weight: SCORE_WEIGHTS.base,
      detail: `42-day load average of ${Math.round(today.fitness)}`,
    },
    {
      key: "consistency",
      label: SCORE_LABELS.consistency,
      value: consistencyScore(activeDays28, strongWeeks),
      weight: SCORE_WEIGHTS.consistency,
      detail: `${activeDays28} active days in 28, ${strongWeeks} of 4 weeks with 3+ sessions`,
    },
    {
      key: "balance",
      label: SCORE_LABELS.balance,
      value: ratio == null ? null : balanceScore(ratio),
      weight: SCORE_WEIGHTS.balance,
      detail: ratio == null ? "Needs a few weeks of training to measure" : `Recent load is ${ratio.toFixed(2)}× your base`,
    },
    {
      key: "momentum",
      label: SCORE_LABELS.momentum,
      value: momentumScore(today.fitness, before.fitness),
      weight: SCORE_WEIGHTS.momentum,
      detail: `Base ${Math.round(before.fitness)} → ${Math.round(today.fitness)} over 4 weeks`,
    },
    {
      key: "efficiency",
      label: SCORE_LABELS.efficiency,
      value: efficiency ? efficiencyScore(efficiency.change) : null,
      weight: SCORE_WEIGHTS.efficiency,
      detail: efficiency
        ? `Speed per heartbeat ${efficiency.change >= 0 ? "up" : "down"} ${Math.abs(efficiency.change * 100).toFixed(1)}% on six weeks ago`
        : "Needs heart rate on 3+ sessions in each of the last two six-week blocks",
    },
  ];

  const available = components.filter((component) => component.value != null);
  const weight = available.reduce((sum, component) => sum + component.weight, 0);
  const value = weight > 0 ? available.reduce((sum, component) => sum + (component.value ?? 0) * component.weight, 0) / weight : 0;
  return { value: Math.round(value), components: components.map((c) => ({ ...c, value: c.value == null ? null : Math.round(c.value) })), ratio, activeDays28, strongWeeks };
}

/** Endurance sessions only: a 75-minute strength session says nothing about how long a run should be. */
function enduranceMinutes(activities: ScoreActivity[], today: string): number[] {
  const from = shift(today, -27);
  return activities
    .filter((a) => a.day >= from && a.day <= today && (a.movingTime ?? 0) > 0 && effortKind(a.sport) !== "duration")
    .map((a) => (a.movingTime ?? 0) / 60);
}

function typicalMinutes(activities: ScoreActivity[], today: string): number | null {
  const value = median(enduranceMinutes(activities, today));
  return value == null ? null : Math.round(value);
}

function longestMinutes(activities: ScoreActivity[], today: string): number | null {
  const minutes = enduranceMinutes(activities, today);
  return minutes.length > 0 ? Math.round(Math.max(...minutes)) : null;
}

function roundTo5(minutes: number): number {
  return Math.max(15, Math.round(minutes / 5) * 5);
}

/** Today's call: what kind of session fits right now. */
export function todayCall(input: {
  form: number;
  ratio: number | null;
  daysSinceLast: number | null;
  typicalMinutes: number | null;
  weekday: number;
  longSessionRecently: boolean;
  /** Longest endurance session in the last 28 days. The long session grows from it by at most 15%. */
  longestMinutes?: number | null;
  daysToRace?: number | null;
}): TodayCall {
  const base = input.typicalMinutes ?? 40;
  const { form, ratio, daysSinceLast } = input;

  if (input.daysToRace != null && input.daysToRace >= 0 && input.daysToRace <= 2) {
    return { kind: "easy", title: "Race is close. Stay sharp, stay fresh", reason: `${input.daysToRace === 0 ? "Race day" : `${input.daysToRace} day${input.daysToRace === 1 ? "" : "s"} to go`}. A short shakeout with a few strides, nothing more.`, minutes: 20, intensity: 1 };
  }
  if (form < -30 || (ratio != null && ratio > 1.5)) {
    return { kind: "rest", title: "Recovery day", reason: "Fatigue is well above your base. Rest, or a 20-minute walk and some mobility.", minutes: null, intensity: 0 };
  }
  if (form < -15 || (ratio != null && ratio > 1.3)) {
    return { kind: "easy", title: "Keep it easy", reason: "You are carrying load. Conversational effort only, so the work you did can land.", minutes: roundTo5(base * 0.75), intensity: 1 };
  }
  if (daysSinceLast == null || daysSinceLast >= 3) {
    return {
      kind: "steady",
      title: "Restart the rhythm",
      reason: daysSinceLast == null ? "No recent sessions on file. Begin with something short and easy." : `${daysSinceLast} days since your last session. Something easy gets the streak going again.`,
      minutes: roundTo5(base * 0.7),
      intensity: 1,
    };
  }
  const weekend = input.weekday === 0 || input.weekday === 6;
  if (weekend && form > -10 && !input.longSessionRecently) {
    const longest = input.longestMinutes != null && input.longestMinutes > 0 ? input.longestMinutes * 1.15 : Number.POSITIVE_INFINITY;
    return { kind: "long", title: "Long session window", reason: "Fresh enough, and no long session this week. Go long and slow, a little beyond your longest recent session.", minutes: roundTo5(Math.min(base * 1.6, longest)), intensity: 2 };
  }
  if (form > 5 && (ratio == null || ratio < 1.0)) {
    return { kind: "quality", title: "Green light for quality", reason: "Form is positive and load is under your base. Intervals or a tempo will pay off today.", minutes: roundTo5(base), intensity: 3 };
  }
  return { kind: "steady", title: "Steady aerobic work", reason: "Load and freshness are in balance. Bank an honest aerobic session.", minutes: roundTo5(base), intensity: 2 };
}

function buildDirections(evaluation: Evaluation, readings: MarkerScore["readings"], options: ScoreOptions): Direction[] {
  const out: Direction[] = [];
  const get = (key: ScoreComponentKey) => evaluation.components.find((c) => c.key === key)?.value ?? null;
  const consistency = get("consistency");
  const balance = get("balance");
  const momentum = get("momentum");
  const efficiency = get("efficiency");
  const base = get("base");
  const ratio = readings.ratio;

  if (options.daysToRace != null && options.daysToRace >= 0 && options.daysToRace <= 14) {
    out.push({
      id: "taper",
      title: "Taper into race day",
      detail: `${options.daysToRace} days to go. Cut volume by a third, keep a little intensity, and protect sleep.`,
      tone: "recover",
      component: "goal",
    });
  }
  if (ratio != null && ratio > 1.3) {
    out.push({
      id: "ease-ramp",
      title: "Ease the ramp",
      detail: `Recent load is ${Math.round((ratio - 1) * 100)}% above your base. Hold volume flat this week before adding more.`,
      tone: "recover",
      component: "balance",
    });
  } else if (ratio != null && ratio < 0.8 && balance != null) {
    out.push({
      id: "build",
      title: "Room to build",
      detail: "Load is under what your body is used to. Add about 10% this week: one extra session or a longer easy one.",
      tone: "push",
      component: "balance",
    });
  }
  if (consistency != null && consistency < 60) {
    const perWeek = readings.activeDays28 / 4;
    out.push({
      id: "consistency",
      title: "Add one more day",
      detail: `You averaged ${perWeek.toFixed(1)} active days a week. Aim for ${Math.min(7, Math.floor(perWeek) + 1)}. A 20-minute session still counts.`,
      tone: "push",
      component: "consistency",
    });
  }
  if (momentum != null && momentum < 40) {
    out.push({
      id: "momentum",
      title: "Your base is fading",
      detail: "Fitness dropped over the last four weeks. Two steady weeks will turn it around.",
      tone: "push",
      component: "momentum",
    });
  }
  if (efficiency != null && efficiency < 42) {
    out.push({
      id: "efficiency",
      title: "Slow down your easy days",
      detail: "You are covering less ground per heartbeat than six weeks ago. More truly easy, zone-2 time rebuilds economy.",
      tone: "hold",
      component: "efficiency",
    });
  }
  if (base != null && base < 40 && !out.some((d) => d.id === "build")) {
    out.push({
      id: "base",
      title: "Build the engine",
      detail: "The base is still small. Frequent, easy, unhurried volume compounds fastest. Grow it about 10% a week.",
      tone: "push",
      component: "base",
    });
  }
  // Something worth keeping, so the list is not only fixes.
  const praise = evaluation.components
    .filter((c) => c.value != null && c.value >= 75)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
  if (praise) {
    const lines: Record<ScoreComponentKey, string> = {
      base: "Six weeks of real work is in the bank. Keep showing up and it stays there.",
      consistency: "You keep showing up, and that is the habit that matters most.",
      balance: "Load and recovery are in the sweet spot. Keep this rhythm going.",
      momentum: "Fitness is climbing. Keep the ramp gentle so it lasts.",
      efficiency: "You cover more ground per heartbeat than six weeks ago. Your engine is improving.",
    };
    out.push({ id: `praise-${praise.key}`, title: `${praise.label} is a strength`, detail: lines[praise.key], tone: "praise", component: praise.key });
  }
  return out.slice(0, 4);
}

/**
 * Computes the Marker for `today` from an athlete's activities (any order, any sport).
 * Pass at least 90 days for a trustworthy trend; up to a year warms the averages.
 */
export function computeMarker(activities: ScoreActivity[], today: string, options: ScoreOptions = {}): MarkerScore {
  const days = buildDays(activities, today);
  const allSamples = efficiencySamples(activities);
  const sport = mainSport(allSamples);
  const samples = sport ? allSamples.filter((sample) => sample.sport === sport) : [];

  const lastIndex = days.length - 1;
  const evaluation = evaluate(days, lastIndex, samples);
  const current = days[lastIndex]!;

  const trend: ScoreTrendPoint[] = [];
  for (let index = Math.max(0, days.length - TREND_DAYS); index < lastIndex; index += 1) {
    trend.push({ day: days[index]!.day, value: evaluate(days, index, samples).value });
  }
  trend.push({ day: today, value: evaluation.value });
  const weekAgo = trend.length >= 8 ? trend[trend.length - 8] : null;

  const lastActive = [...days].reverse().find((day) => day.active);
  const daysSinceLast = lastActive ? Math.round((toMs(today) - toMs(lastActive.day)) / DAY_MS) : null;
  const typical = typicalMinutes(activities, today);
  const weekFrom = shift(today, -6);
  const longSessionRecently =
    typical != null && activities.some((a) => a.day >= weekFrom && a.day <= today && (a.movingTime ?? 0) / 60 >= typical * 1.4);

  const readings: MarkerScore["readings"] = {
    fitness: current.fitness,
    fatigue: current.fatigue,
    form: current.fitness - current.fatigue,
    ratio: evaluation.ratio,
    activeDays28: evaluation.activeDays28,
    strongWeeks: evaluation.strongWeeks,
    daysSinceLast,
    typicalMinutes: typical,
  };

  const firstActive = days.find((day) => day.active);
  const span = firstActive ? Math.round((toMs(today) - toMs(firstActive.day)) / DAY_MS) : 0;
  const activeCount = days.filter((day) => day.active).length;
  const confidence: MarkerScore["confidence"] =
    span >= 56 && activeCount >= 16 && evaluation.components.every((c) => c.value != null) ? "high" : span >= 28 && activeCount >= 8 ? "medium" : "low";

  return {
    name: SCORE_NAME,
    version: SCORE_VERSION,
    day: today,
    value: evaluation.value,
    band: bandFor(evaluation.value),
    components: evaluation.components,
    confidence,
    delta7: weekAgo ? evaluation.value - weekAgo.value : null,
    trend,
    call: todayCall({
      form: readings.form,
      ratio: readings.ratio,
      daysSinceLast,
      typicalMinutes: typical,
      weekday: weekdayOf(today),
      longSessionRecently,
      longestMinutes: longestMinutes(activities, today),
      daysToRace: options.daysToRace ?? null,
    }),
    directions: buildDirections(evaluation, readings, options),
    readings,
  };
}
