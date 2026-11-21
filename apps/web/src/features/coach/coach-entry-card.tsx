import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useMarker } from "@/features/score/use-marker.ts";
import { AIChatInput } from "./ai-chat-input.tsx";
import { CoachOrb } from "./coach-orb.tsx";
import { smartSuggestions } from "./suggestions.ts";

/** Compact chat entry for the dashboard. It hands the question to the full chat page. */
export function CoachEntryCard({ className }: { className?: string }) {
  const [draft, setDraft] = useState("");
  const navigate = useNavigate();
  const { marker } = useMarker();
  const suggestions = smartSuggestions(marker, 3);

  function ask(prompt: string) {
    const text = prompt.trim();
    if (text) navigate("/coach", { state: { prompt: text } });
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <CoachOrb size={22} />
          Ask Coach
        </CardTitle>
        <Link to="/coach" className="group flex items-center gap-1 text-xs font-semibold text-primary">
          Open chat <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="mt-4 space-y-3">
        <AIChatInput id="dashboard-ask" compact value={draft} onChange={setDraft} onSubmit={() => ask(draft)} placeholder="Ask about training, recovery, or your next workout" />
        <motion.ul
          className="flex flex-wrap gap-1.5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {suggestions.map((suggestion) => (
            <motion.li key={suggestion.text} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
              <motion.button
                type="button"
                onClick={() => ask(suggestion.text)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full border border-border bg-surface-2/50 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {suggestion.text}
              </motion.button>
            </motion.li>
          ))}
        </motion.ul>
      </CardContent>
    </Card>
  );
}
