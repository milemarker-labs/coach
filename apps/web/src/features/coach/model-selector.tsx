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
  return (
    <div className="inline-flex h-8 max-w-full items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs" title={reachable ? "The model runs on this computer" : "The model is not reachable"}>
      <Cpu className="size-3.5 shrink-0 text-titanium" aria-hidden="true" />
      <span className="truncate font-medium text-platinum">{loading ? "Checking model" : (value ?? "No model configured")}</span>
      <span className={cn("size-1.5 shrink-0 rounded-full", loading ? "bg-faint" : reachable ? "bg-success" : "bg-danger")} aria-hidden="true" />
      <span className="sr-only">{reachable ? "Reachable" : "Not reachable"}</span>
    </div>
  );
}
