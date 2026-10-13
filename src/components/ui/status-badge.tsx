import { cn } from "@/lib/utils";

const NEUTRAL = "bg-surface text-muted ring-line";
const SUCCESS = "bg-success-bg text-success ring-success/20";
const WARN = "bg-warn-bg text-warn ring-warn/20";
const DANGER = "bg-danger-bg text-danger ring-danger/20";
const INFO = "bg-info-bg text-info ring-info/20";
const VIOLET = "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300";

const ORDER: Record<string, string> = {
  PENDING: WARN,
  CONFIRMED: INFO,
  PROCESSING: VIOLET,
  SHIPPED: "bg-gold-500/12 text-gold-800 ring-gold-500/25 dark:text-gold-300",
  DELIVERED: SUCCESS,
  CANCELLED: NEUTRAL,
};

const PAYMENT: Record<string, string> = {
  UNPAID: NEUTRAL,
  PENDING: WARN,
  PAID: SUCCESS,
  FAILED: DANGER,
  REFUNDED: NEUTRAL,
};

const ENQUIRY: Record<string, string> = {
  NEW: WARN,
  IN_PROGRESS: INFO,
  RESOLVED: SUCCESS,
};

export function StatusBadge({ kind, value, label }: { kind: "order" | "payment" | "enquiry"; value: string; label: string }) {
  const map = kind === "order" ? ORDER : kind === "payment" ? PAYMENT : ENQUIRY;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", map[value] ?? NEUTRAL)}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {label}
    </span>
  );
}
