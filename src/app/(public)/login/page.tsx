import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="flex flex-col justify-center rounded-3xl bg-ink p-8 text-white shadow-panel lg:p-12">
          <p className="mb-4 inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
            Clouddance CRM
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            Brokerage-first outreach CRM for faster calling, cleaner enrichment, and fewer spreadsheet migraines.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200">
            Assign leads, click-to-call through CloudTalk, log outcomes, enrich brokerages with multiple contacts,
            and keep tasks, follow-ups, emails, and import history in one place.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-300">Workflow</dt>
              <dd className="mt-2 text-sm font-medium text-white">Queue → Call → Note → Follow up → Next</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-300">Scale</dt>
              <dd className="mt-2 text-sm font-medium text-white">Designed for 500k+ leads with server-side filters</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-300">Integrations</dt>
              <dd className="mt-2 text-sm font-medium text-white">CloudTalk + Gmail + Outlook placeholder ready</dd>
            </div>
          </dl>
        </section>

        <section className="card self-center p-8">
          <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-2 text-sm text-muted">
            Seeded development accounts are set in <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code>.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-ink">Default dev credentials</p>
            <div className="mt-3 space-y-1">
              <p>
                <span className="font-medium">Admin:</span> alex@clouddance.insure / ChangeMe-Admin123!
              </p>
              <p>
                <span className="font-medium">SDR:</span> partnerships@clouddance.insure / ChangeMe-SDR123!
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
