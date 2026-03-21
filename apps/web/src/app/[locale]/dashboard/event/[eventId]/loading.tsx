export default function EventDetailLoading() {
  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-5 animate-pulse">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-8 w-3/4 rounded-md bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-9 w-20 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-9 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
            </div>
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </main>
  );
}
