import { Skeleton } from "@/components/ui/skeleton";

type PageLoadingProps = {
  variant?: "cards" | "table" | "form" | "dashboard";
  rows?: number;
};

export function PageLoading({ variant = "cards", rows = 4 }: PageLoadingProps) {
  return (
    <div
      aria-busy="true"
      role="status"
      className="space-y-6"
    >
      <span className="sr-only">Yükleniyor...</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {variant === "dashboard" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : null}

      {variant === "form" ? (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="mt-5 h-11 w-36 rounded-2xl" />
        </div>
      ) : null}

      {variant === "table" ? (
        <div className="rounded-3xl border border-border bg-card p-4">
          <Skeleton className="mb-4 h-10 w-full max-w-xl rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : null}

      {variant === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

