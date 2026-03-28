"use client";

import { useEffect, useMemo, useState } from "react";

type ImportStatusPayload = {
  jobId: string;
  status: string;
  message?: string;
};

type ImportJobSnapshot = {
  id: string;
  status: string;
  totalRows: number;
  processedRows: number;
  leadsCreated: number;
  leadsUpdated: number;
  contactsCreated: number;
  contactsUpdated: number;
  errorsCount: number;
  errorLog: string | null;
};

export function ImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ImportJobSnapshot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const done = useMemo(() => job && ["COMPLETED", "FAILED", "PARTIAL"].includes(job.status), [job]);

  useEffect(() => {
    if (!jobId || done) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/imports/${jobId}`);
      if (!response.ok) return;
      const data = (await response.json()) as ImportJobSnapshot;
      setJob(data);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [jobId, done]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a CSV or XLSX file first.");
      return;
    }

    try {
      setIsPending(true);
      setMessage(null);
      setJob(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportStatusPayload & { error?: string };
      if (!response.ok) {
        setMessage(data.error || "Import failed to start.");
        return;
      }

      setJobId(data.jobId);
      setMessage(data.message || "Import started.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-5">
        <div className="space-y-3">
          <label htmlFor="importFile" className="text-sm font-semibold text-ink">
            Upload broker results export
          </label>
          <input
            id="importFile"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-sm text-muted">
            The importer expects the brokerage-first export format with columns like{" "}
            <code className="rounded bg-white px-1.5 py-0.5">Company name Latin alphabet</code> and{" "}
            <code className="rounded bg-white px-1.5 py-0.5">Telephone number</code>.
          </p>
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? "Starting import..." : "Start import"}
          </button>
        </div>
      </form>

      {message ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>
      ) : null}

      {job ? (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Import job status</p>
              <p className="text-xs uppercase tracking-wide text-muted">{job.status}</p>
            </div>
            <p className="text-sm text-muted">
              Processed {job.processedRows} / {job.totalRows || "?"} rows
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Leads created</p>
              <p className="mt-2 font-semibold text-ink">{job.leadsCreated}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Leads updated</p>
              <p className="mt-2 font-semibold text-ink">{job.leadsUpdated}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Contacts created</p>
              <p className="mt-2 font-semibold text-ink">{job.contactsCreated}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Contacts updated</p>
              <p className="mt-2 font-semibold text-ink">{job.contactsUpdated}</p>
            </div>
            <div className="rounded-xl border border-border bg-slate-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Errors</p>
              <p className="mt-2 font-semibold text-ink">{job.errorsCount}</p>
            </div>
          </div>

          {job.errorLog ? (
            <pre className="mt-4 overflow-auto rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {job.errorLog}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
