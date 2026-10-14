import clsx from "clsx";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-slate-200/80", className)} />;
}

export function TablePageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-72" />
        <SkeletonBlock className="h-4 w-[34rem] max-w-full" />
      </div>
      <SkeletonBlock className="h-14 w-full rounded-md bg-slate-200/70" />
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
        <div className="border-b border-line bg-slate-50 px-5 py-4">
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid gap-4 px-5 py-4" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-8 w-24 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="rounded-lg border border-line bg-surface p-5 shadow-panel space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-4/5" />
            </div>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <SkeletonBlock className="h-8 w-24" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-8 w-8" />
                <SkeletonBlock className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-72" />
          <SkeletonBlock className="h-4 w-[26rem] max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-40 rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-md border border-line bg-surface p-4 shadow-panel space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-line bg-surface p-5 shadow-panel space-y-4">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-64 w-full" />
        </div>
        <div className="rounded-md border border-line bg-surface p-5 shadow-panel space-y-4">
          <SkeletonBlock className="h-4 w-44" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BillingSkeleton() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-72" />
          <SkeletonBlock className="h-4 w-[30rem] max-w-full" />
        </div>
        <SkeletonBlock className="h-10 w-44 rounded-md" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-xl border border-slate-100 bg-surface p-5 shadow-panel">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-72 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-slate-100 bg-surface p-5 shadow-panel">
          <SkeletonBlock className="h-6 w-36" />
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-full" />
          ))}
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </div>
    </section>
  );
}

export function FormPageSkeleton({ blocks = 4 }: { blocks?: number }) {
  return (
    <section className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-[28rem] max-w-full" />
      </div>
      <div className="rounded-lg border border-line bg-surface p-5 shadow-panel space-y-4">
        {Array.from({ length: blocks }).map((_, index) => (
          <SkeletonBlock key={index} className="h-12 w-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonBlock className="h-40 w-full rounded-lg" />
        <SkeletonBlock className="h-40 w-full rounded-lg" />
      </div>
    </section>
  );
}
