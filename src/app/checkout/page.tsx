import { PaymentSummaryCard } from "@/components/checkout/PaymentSummaryCard";
import { ProductCarousel } from "@/components/products/ProductCarousel";
import { Button } from "@/components/ui/button";
import { products } from "@/data/mock";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-app-bg px-5 pb-10 pt-8">
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-xs font-semibold text-app-primary">Checkout</p>
          <h1 className="text-2xl font-semibold">Confirm your delivery</h1>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Delivery Address</h2>
          <p className="mt-2 text-sm text-app-text">34 Palm Street, Mumbai</p>
          <p className="text-xs text-app-text-muted">
            Landmark: Near Central Park
          </p>
          <Button variant="secondary" className="mt-4 w-full">
            Change Address
          </Button>
        </div>

        <PaymentSummaryCard note="Tip: Add Rs 49 more to unlock free delivery." />

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Coupons</h2>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-app-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">FRESH50</p>
              <p className="text-xs text-app-text-muted">
                Save Rs 50 on first order
              </p>
            </div>
            <Button size="sm" variant="secondary">
              Apply
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Recommended Add-ons</h2>
          <p className="text-xs text-app-text-muted">
            Complements based on your cart
          </p>
          <div className="mt-3">
            <ProductCarousel products={products.slice(2, 6)} />
          </div>
        </div>

        <Button className="w-full" size="lg">
          Pay and Place Order
        </Button>
      </div>
    </div>
  );
}
