import Link from "next/link";
import { requireSession } from "@/lib/auth-helpers";
import { getDashboardStats } from "@/lib/lead-queries";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionCard } from "@/components/section-card";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();
  const stats = await getDashboardStats(session.user.id, session.user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Keep the team moving: see lead volume, import health, open tasks, and queue pressure without spelunking through fifteen tabs."
        actions={
          <>
            <Link href="/queue" className="button-primary">
              Open my queue
            </Link>
            <Link href="/leads" className="button-secondary">
              Browse leads
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total leads" value={stats.totalLeads} subtext="All brokerages currently in the CRM" />
        <StatCard label="My assigned leads" value={stats.myAssignedLeads} subtext="Current active assignment count" />
        <StatCard label="Unassigned leads" value={stats.unassignedLeads} subtext="Good candidates for queue balancing" />
        <StatCard label="Open tasks" value={stats.openTasks} subtext="Tasks waiting to be completed" />
        <StatCard label="Due follow-ups" value={stats.dueFollowUps} subtext="Follow-ups due now or overdue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(340px,0.8fr)]">
        <SectionCard
          title="Recent import jobs"
          subtitle="Brokerage-first imports keep raw rows for traceability and dedupe updates without creating lead confetti."
          action={session.user.role === "ADMIN" ? <Link href="/imports" className="button-secondary">Manage imports</Link> : null}
        >
          {stats.recentImports.length ? (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Processed</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentImports.map((job) => (
                    <tr key={job.id}>
                      <td className="max-w-[260px]">
                        <p className="truncate font-medium text-ink">{job.filename}</p>
                      </td>
                      <td>{job.status}</td>
                      <td>{job.processedRows}/{job.totalRows || "—"}</td>
                      <td>{job.leadsCreated}</td>
                      <td>{job.leadsUpdated}</td>
                      <td>{formatDateTime(job.completedAt || job.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">No imports yet. The CRM is standing by, clinically bored, awaiting CSVs.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Fast next steps"
          subtitle="Recommended V1 usage flow for your team."
        >
          <ol className="space-y-4 text-sm text-slate-700">
            <li className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="font-semibold text-ink">1. Import brokerages</p>
              <p className="mt-1 text-muted">Upload a real results export or run the CLI importer for larger files.</p>
            </li>
            <li className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="font-semibold text-ink">2. Assign leads</p>
              <p className="mt-1 text-muted">Admin assigns brokerages to callers; SDRs then work from their queue.</p>
            </li>
            <li className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="font-semibold text-ink">3. Click to call</p>
              <p className="mt-1 text-muted">Use CloudTalk placeholder links, log dispositions, add notes, and queue follow-ups.</p>
            </li>
            <li className="rounded-xl border border-border bg-slate-50 p-4">
              <p className="font-semibold text-ink">4. Connect mailboxes</p>
              <p className="mt-1 text-muted">Connect placeholder Gmail or Outlook accounts now, then swap in real OAuth later.</p>
            </li>
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}
