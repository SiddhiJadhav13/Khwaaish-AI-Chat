export default function SplashPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#e7f9ef,transparent_60%)] px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-app-primary text-white shadow-xl">
        <span className="text-2xl font-semibold">K</span>
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Khwaaish AI</h1>
      <p className="mt-2 text-center text-sm text-app-text-muted">
        Groceries in conversation, delivered fast.
      </p>
      <div className="mt-10 w-full max-w-xs rounded-3xl bg-white p-4 text-center shadow-sm">
        <p className="text-xs text-app-text-muted">Loading your AI cart</p>
        <div className="mt-3 h-2 w-full rounded-full bg-app-bg">
          <div className="h-2 w-2/3 rounded-full bg-app-primary" />
        </div>
      </div>
    </div>
  );
}
