import { Cpu } from "lucide-react";
import { Select } from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";

/**
 * Shows which model answers. When `onChange` is given and several models are installed it
 * becomes a selector; otherwise it is a read-only status chip, because the API currently
 * picks the model from its own configuration.
 */
export function ModelSelector({
  models,
  value,
  reachable,
  loading = false,
  onChange,
}: {
  models: string[];
  value: string | null;
  reachable: boolean;
  loading?: boolean;
  onChange?: (model: string) => void;
}) {
  if (onChange && models.length > 1 && value) {
    return (
      <div className="w-52">
        <Select aria-label="Model" value={value} onChange={(event) => onChange(event.target.value)}>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </Select>
      </div>
    );
  }
  const dot = loading ? "bg-faint" : reachable ? "bg-success" : "bg-danger";
  return (
    <div
      className="glass inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-border px-3.5 text-xs"
      title={reachable ? "The model runs on this computer" : "The model is not reachable"}
    >
      <Cpu className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className={cn("truncate font-medium", loading ? "text-muted-foreground" : "text-foreground")}>{loading ? "Checking model" : (value ?? "No model configured")}</span>
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        {!loading ? <span className={cn("animate-ping-soft absolute inset-0 rounded-full", dot)} /> : null}
        <span className={cn("relative size-2 rounded-full", dot, loading && "animate-pulse")} />
      </span>
      <span className="sr-only">{loading ? "Checking" : reachable ? "Reachable" : "Not reachable"}</span>
    </div>
  );
}
