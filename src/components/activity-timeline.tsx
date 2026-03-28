import { formatDateTime } from "@/lib/utils";

type ActivityItem = {
  id: string;
  summary: string;
  createdAt: Date;
  type: string;
  user?: {
    name: string | null;
    email: string | null;
  } | null;
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{item.summary}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted">{item.type.replaceAll("_", " ")}</p>
            </div>
            <p className="text-xs text-muted">{formatDateTime(item.createdAt)}</p>
          </div>
          <p className="mt-2 text-sm text-muted">
            {item.user?.name || item.user?.email || "System"}
          </p>
        </li>
      ))}
    </ol>
  );
}
