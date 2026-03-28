export function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-ink">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-muted">{subtext}</p> : null}
    </div>
  );
}
