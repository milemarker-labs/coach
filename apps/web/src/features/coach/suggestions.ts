import type { CallKind, MarkerScore } from "@coach/shared";

export const suggestedQuestions = [
  "How did my last week compare with the one before?",
  "Am I ready for a hard session tomorrow?",
  "What should my next long run look like?",
  "Where has my pace changed the most recently?",
];

export type SuggestionKind = "call" | "direction" | "score" | "general";

export interface Suggestion {
  text: string;
  kind: SuggestionKind;
}

const callQuestions: Record<CallKind, string> = {
  rest: "What should a good recovery day look like today?",
  easy: "Give me an easy session for today",
  steady: "What steady session should I do today?",
  quality: "Give me a quality workout for today",
  long: "Plan my long session for today",
};

const directionQuestions: Record<string, string> = {
  taper: "How should I taper for my race?",
  "ease-ramp": "How do I ease my training ramp this week?",
  build: "How should I add volume this week?",
  consistency: "How can I fit one more session into my week?",
  momentum: "How do I turn my fading fitness around?",
  efficiency: "What should my easy days look like?",
  base: "How do I build my aerobic base?",
};

/**
 * Questions shaped by the athlete's own numbers: today's call, the directions, and the score itself.
 * Falls back to the generic list when there is no score yet.
 */
export function smartSuggestions(marker: MarkerScore | null, limit = 5): Suggestion[] {
  if (!marker) return suggestedQuestions.map((text) => ({ text, kind: "general" }));
  const out: Suggestion[] = [{ text: callQuestions[marker.call.kind], kind: "call" }];
  for (const direction of marker.directions) {
    const text = direction.id.startsWith("praise-") ? "What's going well in my training right now?" : directionQuestions[direction.id];
    if (text) out.push({ text, kind: "direction" });
  }
  out.push({ text: `Why is my ${marker.name} ${marker.value}, and how do I raise it?`, kind: "score" });
  for (const text of suggestedQuestions) out.push({ text, kind: "general" });

  const seen = new Set<string>();
  return out.filter((item) => (seen.has(item.text) ? false : (seen.add(item.text), true))).slice(0, limit);
}
