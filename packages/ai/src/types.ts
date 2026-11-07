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
}

export interface AIProvider {
  listModels(): Promise<string[]>;
  complete(messages: ChatMessage[]): Promise<string>;
  stream(messages: ChatMessage[]): AsyncIterable<string>;
}
