import type { LeadStatus } from "@prisma/client";
import { leadStatusLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

const toneByStatus: Record<LeadStatus, string> = {
  UNWORKED: "border-slate-200 bg-slate-100 text-slate-700",
  ATTEMPTED: "border-amber-200 bg-amber-50 text-amber-700",
  CONNECTED: "border-sky-200 bg-sky-50 text-sky-700",
  INTERESTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FOLLOW_UP: "border-violet-200 bg-violet-50 text-violet-700",
  CLOSED_WON: "border-green-200 bg-green-50 text-green-700",
  CLOSED_LOST: "border-rose-200 bg-rose-50 text-rose-700",
  BAD_DATA: "border-red-200 bg-red-50 text-red-700",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <span className={cn("badge", toneByStatus[status])}>{leadStatusLabels[status]}</span>;
}
