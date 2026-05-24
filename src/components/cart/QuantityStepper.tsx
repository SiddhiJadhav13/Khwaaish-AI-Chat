import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  compact?: boolean;
};

export const QuantityStepper = ({
  value,
  onIncrease,
  onDecrease,
  compact = false,
}: QuantityStepperProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-app-border bg-white px-2 py-1",
        compact ? "text-xs" : "text-sm"
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        className="rounded-full p-1 text-app-text-muted hover:text-app-text"
      >
        <Minus size={compact ? 12 : 14} />
      </button>
      <span className="min-w-4 text-center font-semibold">{value}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="rounded-full p-1 text-app-primary hover:text-app-primary/80"
      >
        <Plus size={compact ? 12 : 14} />
      </button>
    </div>
  );
};
