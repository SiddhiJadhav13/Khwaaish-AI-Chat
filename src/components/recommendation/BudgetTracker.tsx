"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleDollarSign, TrendingDown, ArrowRightLeft, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { getSmartBudgetSubstitutions } from "@/services/recommendation";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";

export const BudgetTracker = () => {
  const { items, addItem, removeItem } = useCartStore();
  const { activeBudget, setActiveBudget } = useUIStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const budgetSubstitutions = useMemo(() => {
    return getSmartBudgetSubstitutions(items);
  }, [items]);

  if (!activeBudget) return null;

  const remaining = activeBudget - subtotal;
  const isOver = remaining < 0;
  const absRemaining = Math.abs(remaining);
  const ratio = Math.min(subtotal / activeBudget, 1);

  // Define status colors based on budget exhaustion
  let progressColor = "bg-emerald-500";
  let textColor = "text-emerald-700";
  let bgGradient = "bg-emerald-50/90 border-emerald-100/30";
  let progressBg = "bg-emerald-200/40";

  if (ratio > 0.9) {
    progressColor = "bg-rose-500";
    textColor = "text-rose-700";
    bgGradient = "bg-rose-50/90 border-rose-100/30";
    progressBg = "bg-rose-200/40";
  } else if (ratio > 0.7) {
    progressColor = "bg-amber-500";
    textColor = "text-amber-700";
    bgGradient = "bg-amber-50/90 border-amber-100/30";
    progressBg = "bg-amber-200/40";
  }

  const handleSwap = (originalId: string, replacement: any, qty: number) => {
    removeItem(originalId);
    addItem(replacement, qty);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border-b border-app-border/40 backdrop-blur-md px-4 py-2 flex flex-col gap-2 transition-all duration-300 ${bgGradient}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CircleDollarSign size={14} className={textColor} />
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[11px] font-bold text-app-text truncate">
              {isOver ? "Over Budget!" : "Budget Limit:"}
            </span>
            <span className={`text-[11px] font-extrabold ${textColor} whitespace-nowrap`}>
              {isOver ? `${formatPrice(absRemaining)} over` : `${formatPrice(remaining)} left`}
            </span>
            <span className="text-[10px] text-app-text-muted/70 whitespace-nowrap">
              (of {formatPrice(activeBudget)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {budgetSubstitutions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 bg-white/80 hover:bg-white px-2 py-0.5 rounded-full border border-black/5 text-[9px] font-extrabold shadow-xs transition-all text-app-text active:scale-95 cursor-pointer"
            >
              <Sparkles size={10} className="text-amber-500 animate-pulse" />
              <span>{budgetSubstitutions.length} Swap{budgetSubstitutions.length > 1 ? "s" : ""}</span>
              {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveBudget(undefined)}
            className="text-app-text-muted hover:text-rose-500 p-0.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            title="Remove budget limit"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Progress Bar - elegant and horizontal */}
      <div className="w-full h-1 rounded-full overflow-hidden relative flex items-center">
        <div className={`absolute inset-0 rounded-full ${progressBg}`} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full z-10 ${progressColor}`}
        />
      </div>

      {/* Expandable swap panel */}
      <AnimatePresence>
        {isExpanded && budgetSubstitutions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="overflow-hidden border-t border-black/5 pt-2 mt-0.5"
          >
            <div className="flex items-center gap-1 mb-1.5">
              <Sparkles size={11} className="text-amber-500" />
              <span className="text-[9px] font-bold text-app-text uppercase tracking-wider">Available Smart Savings</span>
            </div>
            
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar pb-0.5">
              {budgetSubstitutions.map(({ originalItem, cheaperItem, savings }) => (
                <motion.div
                  key={`${originalItem.id}-sub`}
                  className="flex items-center justify-between rounded-xl border border-black/5 bg-white/70 px-2.5 py-1.5 shadow-xs"
                >
                  <div className="flex-1 pr-2 min-w-0">
                    <p className="text-[10px] font-medium text-app-text leading-tight truncate">
                      Swap <span className="font-semibold text-rose-600">{originalItem.title}</span> ➔{" "}
                      <span className="font-semibold text-emerald-600">{cheaperItem.title}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-app-text-muted">
                      <span className="flex items-center text-emerald-600 font-extrabold gap-0.5">
                        <TrendingDown size={9} /> Save {formatPrice(savings)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-5 rounded-lg text-[9px] px-1.5 font-extrabold flex items-center gap-0.5 bg-white hover:bg-emerald-500 hover:text-white border border-black/5 hover:border-emerald-500 transition-all duration-200"
                    onClick={() => handleSwap(originalItem.id, cheaperItem, originalItem.quantity)}
                  >
                    <ArrowRightLeft size={8} />
                    Swap
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
