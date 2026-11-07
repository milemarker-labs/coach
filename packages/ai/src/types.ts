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
  distanceMeters: number | null;
  movingTimeSeconds: number | null;
  averageSpeedMps: number | null;
  averageHeartRate: number | null;
}

export interface CoachContext {
  last7Days: SportWindow[];
  previous7Days: SportWindow[];
  recentActivities: CoachActivityFact[];
}

export interface AIProvider {
  listModels(): Promise<string[]>;
  complete(messages: ChatMessage[]): Promise<string>;
  stream(messages: ChatMessage[]): AsyncIterable<string>;
}
