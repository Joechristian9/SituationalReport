import { cn } from "@/lib/utils"

// The highlight is a pseudo-element moved with `transform`, so the sweep runs on
// the compositor and never repaints. Reduced motion gets a static block.
function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-background/70 before:to-transparent",
        "dark:before:via-foreground/[0.06] motion-reduce:before:hidden",
        className
      )}
      {...props} />
  );
}

// Fades in after a short delay so near-instant loads never flash a skeleton;
// the space stays reserved meanwhile, so nothing shifts.
function SkeletonGroup({ label = "Loading…", className, children, ...props }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "animate-in fade-in-0 fill-mode-both delay-150 duration-300 motion-reduce:animate-none",
        className
      )}
      {...props}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function SkeletonTable({ rows = 5, columns = 4, label = "Loading records…", className }) {
  return (
    <SkeletonGroup label={label} className={cn("w-full", className)}>
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border py-4 last:border-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1", c === 0 && "max-w-[40%]", c === columns - 1 && "max-w-20")} />
          ))}
        </div>
      ))}
    </SkeletonGroup>
  );
}

function SkeletonForm({ fields = 4, label = "Loading form…", className }) {
  return (
    <SkeletonGroup label={label} className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full md:h-9" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full sm:w-32 md:h-9" />
    </SkeletonGroup>
  );
}

function SkeletonChart({ label = "Loading chart…", className }) {
  return (
    <SkeletonGroup label={label} className={cn("space-y-4 rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </SkeletonGroup>
  );
}

function SkeletonList({ rows = 3, label = "Loading…", className }) {
  return (
    <SkeletonGroup label={label} className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

export { Skeleton, SkeletonGroup, SkeletonTable, SkeletonForm, SkeletonChart, SkeletonList }
