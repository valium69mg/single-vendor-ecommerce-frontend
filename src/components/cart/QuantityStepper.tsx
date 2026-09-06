import { Minus, Plus } from "@phosphor-icons/react";
import { ICON } from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  max: number;
  min?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  const { t } = useTranslation();

  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <div className="inline-flex items-center border border-stone-300">
      <button
        type="button"
        aria-label={t("cart.decrease")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-none text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent",
        )}
        disabled={!canDecrease}
        onClick={() => canDecrease && onChange(value - 1)}
      >
        <Minus size={ICON.sm} aria-hidden />
      </button>
      <span
        className="min-w-8 select-none text-center font-store-body text-sm text-stone-900"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={t("cart.increase")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-none text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent",
        )}
        disabled={!canIncrease}
        onClick={() => canIncrease && onChange(value + 1)}
      >
        <Plus size={ICON.sm} aria-hidden />
      </button>
    </div>
  );
}
