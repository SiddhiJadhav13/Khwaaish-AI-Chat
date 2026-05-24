"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { cn } from "@/lib/utils";
import { formatEta, formatPrice } from "@/utils/format";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

type ProductCardProps = {
  product: Product;
  variant?: "default" | "compact";
};

export const ProductCard = ({ product, variant = "default" }: ProductCardProps) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const existing = items.find((item) => item.id === product.id);
  const isCompact = variant === "compact";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "snap-start shrink-0 rounded-[22px] border border-app-border bg-white shadow-[0_14px_30px_rgba(17,24,39,0.12)]",
        isCompact ? "w-40 p-2 min-h-[152px]" : "w-48 p-3 min-h-[176px]"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn(
          "rounded-2xl bg-[linear-gradient(135deg,#f4fdf7,#ffffff)]",
          isCompact ? "p-1.5" : "p-2"
        )}>
          <Image
            src={product.image}
            alt={product.title}
            width={isCompact ? 44 : 52}
            height={isCompact ? 44 : 52}
          />
        </div>
        <span className={cn(
          "rounded-full bg-app-primary/10 font-semibold text-app-primary",
          isCompact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
        )}>
          {formatEta(product.etaMinutes)}
        </span>
      </div>
      <div className={cn("space-y-1", isCompact ? "mt-2" : "mt-3")}>
        <p className={cn(
          "font-semibold text-app-text",
          isCompact ? "text-[13px]" : "text-sm"
        )}>
          {product.title}
        </p>
        <p className={cn(
          "text-app-text-muted",
          isCompact ? "text-[11px]" : "text-xs"
        )}>
          {product.quantityLabel}
        </p>
      </div>
      <div className={cn("flex items-center justify-between", isCompact ? "mt-2" : "mt-3")}>
        <span className={cn("font-semibold", isCompact ? "text-[13px]" : "text-sm")}>
          {formatPrice(product.price)}
        </span>
        {existing ? (
          <QuantityStepper
            value={existing.quantity}
            onDecrease={() =>
              updateQuantity(existing.id, Math.max(existing.quantity - 1, 0))
            }
            onIncrease={() => updateQuantity(existing.id, existing.quantity + 1)}
          />
        ) : (
          <Button
            size="sm"
            className={cn("rounded-full", isCompact ? "h-8 px-3 text-[11px]" : "px-4")}
            onClick={() => addItem(product)}
          >
            Add
          </Button>
        )}
      </div>
    </motion.div>
  );
};
