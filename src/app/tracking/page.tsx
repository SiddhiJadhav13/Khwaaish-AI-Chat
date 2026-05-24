import { Button } from "@/components/ui/button";

const steps = [
  "Order confirmed",
  "Picking items",
  "Packing order",
  "Out for delivery",
];

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-app-bg px-6 pb-10 pt-10">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <p className="text-xs font-semibold text-app-primary">Live Tracking</p>
          <h1 className="text-2xl font-semibold">Your order is on the way</h1>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold">ETA 12-15 min</p>
          <p className="mt-2 text-xs text-app-text-muted">
            Rider: Arjun | Vehicle: KA 05 9123
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold">Order Status</p>
          <div className="mt-4 space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-app-primary/10 text-xs font-semibold text-app-primary">
                  {index + 1}
                </span>
                <span className="text-sm text-app-text">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" variant="secondary">
          Chat with Support
        </Button>
      </div>
    </div>
  );
}
