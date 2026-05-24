import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-app-bg px-6 pb-10 pt-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-app-primary/10 text-app-primary">
          <span className="text-2xl font-semibold">Done</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Order confirmed</h1>
        <p className="mt-2 text-sm text-app-text-muted">
          Your groceries are being packed. AI will keep you updated.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-5 text-left shadow-sm">
          <p className="text-sm font-semibold">ETA</p>
          <p className="mt-1 text-lg font-semibold text-app-primary">
            12-15 min
          </p>
          <p className="mt-2 text-xs text-app-text-muted">
            Rider assigned. Tracking starts shortly.
          </p>
        </div>

        <Button className="mt-8 w-full" size="lg">
          Track Order
        </Button>
      </div>
    </div>
  );
}
