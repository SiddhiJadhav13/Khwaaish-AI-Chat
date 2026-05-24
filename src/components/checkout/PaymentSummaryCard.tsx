"use client";

import { formatPrice } from "@/utils/format";
import { useCartStore } from "@/store/cart";

type PaymentSummaryCardProps = {
  note?: string;
};

export const PaymentSummaryCard = ({ note }: PaymentSummaryCardProps) => {
  const { items } = useCartStore();
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 400 ? 0 : 29;
  const total = subtotal + deliveryFee;

  return (
    <div className="rounded-3xl border border-app-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Payment Summary</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-app-text-muted">Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-app-text-muted">Delivery fee</span>
          <span className="font-semibold">
            {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-app-border pt-2">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatPrice(total)}</span>
        </div>
      </div>
      {note ? (
        <p className="mt-3 text-xs text-app-text-muted">{note}</p>
      ) : null}
    </div>
  );
};
