export default function DashboardLoading() {
  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        {/* タイトル */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-36 rounded-md bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        {/* カード × 3 */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-4/5 rounded bg-muted" />
              <div className="h-4 w-3/5 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
