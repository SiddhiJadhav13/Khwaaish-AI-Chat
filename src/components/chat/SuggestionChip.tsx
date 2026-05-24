import { cn } from "@/lib/utils";

type SuggestionChipProps = {
  label: string;
  onClick?: () => void;
  active?: boolean;
};

export const SuggestionChip = ({
  label,
  onClick,
  active = false,
}: SuggestionChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-xs font-medium transition-transform duration-200 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer",
        active
          ? "border-app-primary bg-app-primary text-white shadow-xs"
          : "border-app-border bg-white text-app-text hover:bg-black/[0.03]"
      )}
    >
      {label}
    </button>
  );
};
