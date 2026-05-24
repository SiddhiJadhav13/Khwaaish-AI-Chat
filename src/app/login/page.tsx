import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-app-bg px-6 pb-10 pt-16">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <p className="text-xs font-semibold text-app-primary">Welcome back</p>
          <h1 className="text-2xl font-semibold">Login to Khwaaish</h1>
          <p className="text-sm text-app-text-muted">
            Continue your AI-powered grocery journey.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <label className="text-xs font-semibold text-app-text">
            Phone number
          </label>
          <Input className="mt-2" placeholder="Enter your number" />
          <label className="mt-4 block text-xs font-semibold text-app-text">
            OTP
          </label>
          <Input className="mt-2" placeholder="Enter OTP" />
          <Button className="mt-5 w-full">Continue</Button>
          <p className="mt-3 text-center text-xs text-app-text-muted">
            We will never spam you.
          </p>
        </div>

        <div className="rounded-3xl border border-dashed border-app-border bg-white p-4 text-center text-xs text-app-text-muted">
          New here? Start with instant guest checkout.
        </div>
      </div>
    </div>
  );
}
