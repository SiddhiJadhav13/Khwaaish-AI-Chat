"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { formatPrice } from "@/utils/format";

export const CartDrawer = () => {
  const { items, updateQuantity } = useCartStore();
  const { isCartOpen, setCartOpen } = useUIStore();

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 400 ? 0 : 29;

  return (
    <AnimatePresence>
      {isCartOpen ? (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] bg-white px-5 pb-8 pt-5 shadow-2xl"
            initial={{ y: 320 }}
            animate={{ y: 0 }}
            exit={{ y: 320 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-app-primary/10 p-2 text-app-primary">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your Cart</p>
                  <p className="text-xs text-app-text-muted">
                    {items.length} items selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-sm text-app-text-muted"
                onClick={() => setCartOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[45vh] space-y-3 overflow-y-auto">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-app-border p-4 text-center text-sm text-app-text-muted">
                  Your cart is empty. Add items from the chat.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-app-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-app-text-muted">
                        {item.quantityLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <QuantityStepper
                        value={item.quantity}
                        compact
                        onDecrease={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        onIncrease={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 space-y-2 rounded-2xl bg-app-bg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-app-text-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-app-text-muted">Delivery fee</span>
                <span className="font-semibold">
                  {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
                </span>
              </div>
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => setCartOpen(false)}
            >
              Proceed to Checkout
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
