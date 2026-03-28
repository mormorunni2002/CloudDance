import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ImportUploader } from "@/components/import-uploader";
import { SectionCard } from "@/components/section-card";
import { formatDateTime, truncate } from "@/lib/utils";

export default async function ImportsPage() {
  await requireAdmin();

  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      createdBy: {
        select: { name: true, email: true },
      },
      rows: {
        orderBy: { rowNumber: "desc" },
        take: 5,
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Imports"
        description="Upload results exports, validate the schema, queue import jobs, and keep raw row traceability so you can debug bad source files without developing a personal grudge against CSVs."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]">
        <SectionCard title="Upload import" subtitle="CSV and XLSX supported. Search-summary exports are rejected with a human-readable error.">
          <ImportUploader />
        </SectionCard>

        <SectionCard title="CLI path for large files" subtitle="For very large datasets, use the shared importer directly from your terminal.">
          <div className="space-y-3 text-sm text-slate-700">
            <p>Host import command:</p>
            <pre className="overflow-auto rounded-xl border border-border bg-slate-50 p-4 text-xs text-slate-700">
{`npm run import:file -- "./imports/USA Brokers Results.csv" alex@clouddance.insure`}
            </pre>
            <p>The CLI uses the same preflight validation, encoding fallback, brokerage-first grouping, dedupe logic, and raw import row storage as the UI.</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent jobs" subtitle="Most recent 25 import jobs.">
        {jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{job.filename}</p>
                    <p className="mt-1 text-xs text-muted">
                      {job.status} • {job.fileType} • created by {job.createdBy?.name || job.createdBy?.email || "system"} • {formatDateTime(job.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-slate-700">
                    {job.processedRows}/{job.totalRows || "?"} rows processed
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <div className="rounded-xl border border-border bg-white p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted">Lead rows</p>
                    <p className="mt-2 font-semibold text-ink">{job.leadRows}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted">Continuation rows</p>
                    <p className="mt-2 font-semibold text-ink">{job.continuationRows}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted">Leads created</p>
                    <p className="mt-2 font-semibold text-ink">{job.leadsCreated}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted">Leads updated</p>
                    <p className="mt-2 font-semibold text-ink">{job.leadsUpdated}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted">Contacts created</p>
                    <p className="mt-2 font-semibold text-ink">{job.contactsCreated}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-white p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-muted">Errors</p>
                    <p className="mt-2 font-semibold text-ink">{job.errorsCount}</p>
                  </div>
                </div>

                {job.errorLog ? (
                  <pre className="mt-4 overflow-auto rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    {truncate(job.errorLog, 600)}
                  </pre>
                ) : null}

                {job.rows.length ? (
                  <div className="mt-4 rounded-xl border border-border bg-white p-4">
                    <p className="text-sm font-semibold text-ink">Recent raw rows</p>
                    <div className="mt-3 space-y-2">
                      {job.rows.map((row) => (
                        <div key={row.id} className="rounded-lg border border-border bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-muted">
                            Row {row.rowNumber} • {row.status}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">{row.brokerageNameRaw || "No brokerage name on row"}</p>
                          {row.message ? <p className="mt-1 text-xs text-muted">{row.message}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No import jobs yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
