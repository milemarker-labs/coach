import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AIChatInput } from "./ai-chat-input.tsx";
import { suggestedQuestions } from "./suggestions.ts";

/** Compact chat entry for the dashboard. It hands the question to the full chat page. */
export function CoachEntryCard({ className }: { className?: string }) {
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();

  function ask(prompt: string) {
    const text = prompt.trim();
    if (text) navigate("/coach", { state: { prompt: text } });
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          Ask Coach
        </CardTitle>
        <Link to="/coach" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Open chat <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="mt-3 space-y-3">
        <AIChatInput id="dashboard-ask" compact value={draft} onChange={setDraft} onSubmit={() => ask(draft)} placeholder="Ask about training, recovery, or your next workout" />
        <ul className="flex flex-wrap gap-1.5">
          {suggestedQuestions.slice(0, 3).map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => ask(question)}
                className="rounded-md border border-border px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-border-hover hover:text-platinum active:scale-[0.98]"
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
