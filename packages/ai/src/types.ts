export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SportWindow {
  sport: string;
  activities: number;
  distanceMeters: number;
  movingTimeSeconds: number;
}

export interface CoachActivityFact {
  id: string;
  name: string;
  sport: string;
  startedAt: string;
  /** Calendar date in the athlete timezone, `YYYY-MM-DD`. */
  localDate: string;
  /** 24-hour clock in the athlete timezone, `HH:mm`. */
  localTime: string;
  weekday: string;
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  averageSpeedMps: number | null;
  averageHeartRate: number | null;
}

/** The Marker fitness score and today's direction, computed from the stored history. */
export interface CoachMarkerFact {
  name: string;
  value: number;
  band: string;
  delta7: number | null;
  components: { label: string; value: number | null; detail: string }[];
  /** `kind` is rest, easy, steady, quality or long. */
  call: { kind: string; title: string; reason: string; minutes: number | null };
  directions: { title: string; detail: string }[];
}

export interface CoachContext {
  /** Calendar date in the athlete timezone, `YYYY-MM-DD`. */
  today: string;
  /** 24-hour clock in the athlete timezone, `HH:mm`. */
  nowLocalTime: string;
  weekday: string;
  timeZone: string;
  last7Days: SportWindow[];
  previous7Days: SportWindow[];
  recentActivities: CoachActivityFact[];
  /** Optional so older callers and tests keep working. */
  marker?: CoachMarkerFact;
}

export interface AIProvider {
  listModels(): Promise<string[]>;
  complete(messages: ChatMessage[]): Promise<string>;
  stream(messages: ChatMessage[]): AsyncIterable<string>;
}
