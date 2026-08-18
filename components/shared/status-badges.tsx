import { Badge } from "@/components/ui/badge";
import type {
  CostCategory,
  OrderStatus,
  ShippingMethod,
  TripStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const orderStyles: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  "DP Paid": "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300",
  "Full Paid": "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  "Out of Stock/Refund":
    "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300",
};

const tripStyles: Record<TripStatus, string> = {
  Planning: "bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-300",
  "On Trip": "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300",
  Completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  Cancelled: "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300",
};

const shippingStyles: Record<ShippingMethod, string> = {
  Handcarry: "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:text-teal-300",
  Express: "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-300",
  "Cargo Laut":
    "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-300",
};

const costStyles: Record<CostCategory, string> = {
  Makan: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-300",
  Cargo: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300",
  Transport:
    "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-300",
  Akomodasi:
    "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300",
  Lainnya: "bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-300",
};

function Pill({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {label}
    </Badge>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Pill label={status} className={orderStyles[status]} />;
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return <Pill label={status} className={tripStyles[status]} />;
}

export function ShippingBadge({ method }: { method: ShippingMethod }) {
  return <Pill label={method} className={shippingStyles[method]} />;
}

export function CostCategoryBadge({ category }: { category: CostCategory }) {
  return <Pill label={category} className={costStyles[category]} />;
}
