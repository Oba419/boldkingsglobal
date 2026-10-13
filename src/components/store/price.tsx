import { formatNaira, type Kobo } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  kobo,
  compareAtKobo,
  from = false,
  size = "md",
}: {
  kobo: Kobo;
  compareAtKobo?: Kobo | null;
  from?: boolean;
  size?: "md" | "lg";
}) {
  const discounted = compareAtKobo != null && compareAtKobo > kobo;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={cn("font-bold tracking-tight text-ink tabular-nums", size === "lg" ? "text-3xl sm:text-4xl" : "text-[15px] sm:text-base")}>
        {from ? <span className="mr-1 text-[11px] font-medium tracking-wide text-muted uppercase">From</span> : null}
        {formatNaira(kobo)}
      </span>
      {discounted ? (
        <>
          <s className={cn("text-muted tabular-nums", size === "lg" ? "text-base" : "text-xs")}>
            <span className="sr-only">Was </span>
            {formatNaira(compareAtKobo)}
          </s>
          {size === "lg" ? (
            <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-semibold text-danger">
              Save {formatNaira(compareAtKobo - kobo)}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
