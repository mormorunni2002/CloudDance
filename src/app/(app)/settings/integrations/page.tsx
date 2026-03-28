import { EmailProvider } from "@prisma/client";
import { requireSession } from "@/lib/auth-helpers";
import { getAllEmailAccounts, getUserEmailAccounts } from "@/lib/email";
import { connectEmailAccountAction, syncEmailAccountAction } from "@/app/(app)/actions";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SubmitButton } from "@/components/submit-button";
import { formatDateTime } from "@/lib/utils";

export default async function IntegrationsPage() {
  const session = await requireSession();

  const [myAccounts, allAccounts] = await Promise.all([
    getUserEmailAccounts(session.user.id),
    session.user.role === "ADMIN" ? getAllEmailAccounts() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Placeholder connectors now, real credentials later. The seams are here already so CloudTalk, Gmail, and Outlook can graduate from stunt doubles when you're ready."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]">
        <SectionCard title="Connect mailbox" subtitle="Creates placeholder Gmail or Outlook accounts so threads, sync controls, and send flows are ready for real OAuth later.">
          <div className="grid gap-4 md:grid-cols-2">
            <form action={connectEmailAccountAction} className="rounded-2xl border border-border bg-slate-50 p-4">
              <input type="hidden" name="provider" value={EmailProvider.GMAIL} />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">Gmail placeholder</p>
                <div className="space-y-2">
                  <label htmlFor="gmailAddress">Email address</label>
                  <input id="gmailAddress" name="emailAddress" defaultValue={session.user.email ?? ""} />
                </div>
                <SubmitButton label="Connect Gmail" pendingLabel="Connecting..." />
              </div>
            </form>

            <form action={connectEmailAccountAction} className="rounded-2xl border border-border bg-slate-50 p-4">
              <input type="hidden" name="provider" value={EmailProvider.MICROSOFT} />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">Outlook placeholder</p>
                <div className="space-y-2">
                  <label htmlFor="outlookAddress">Email address</label>
                  <input id="outlookAddress" name="emailAddress" defaultValue={session.user.email ?? ""} />
                </div>
                <SubmitButton label="Connect Outlook" pendingLabel="Connecting..." />
              </div>
            </form>
          </div>
        </SectionCard>

        <SectionCard title="CloudTalk placeholder" subtitle="Clickable E.164 numbers are already wired for CloudTalk click-to-call URLs.">
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Set <code className="rounded bg-slate-100 px-1.5 py-0.5">CLOUDTALK_CLICK_TO_CALL_URL_TEMPLATE</code> to control how phone links are opened.
            </p>
            <pre className="overflow-auto rounded-xl border border-border bg-slate-50 p-4 text-xs text-slate-700">
{`tel:{phone}
cloudtalk://call?number={phone}
https://your-proxy.local/call?number={phone}`}
            </pre>
            <p>
              Call logs and recording links are stored in the CRM already; when you add the real CloudTalk credentials later, you can swap the placeholder client for the real API client without changing the UI surface.
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="My email accounts" subtitle="Manual placeholder sync and account status.">
        {myAccounts.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {myAccounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-ink">
                  {account.provider.toLowerCase()} • {account.emailAddress}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Sync status: {account.syncStatus} • Last synced {formatDateTime(account.lastSyncedAt)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  OAuth placeholder: {account.oauthConnection?.status || "not connected"}
                </p>
                <form action={syncEmailAccountAction} className="mt-4">
                  <input type="hidden" name="accountId" value={account.id} />
                  <SubmitButton label="Run placeholder sync" pendingLabel="Syncing..." className="button-secondary" />
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No email accounts connected for this user yet.</p>
        )}
      </SectionCard>

      {session.user.role === "ADMIN" ? (
        <SectionCard title="All email accounts" subtitle="Admin visibility across placeholder Gmail / Outlook connections.">
          {allAccounts.length ? (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Provider</th>
                    <th>Email</th>
                    <th>Sync status</th>
                    <th>Last synced</th>
                  </tr>
                </thead>
                <tbody>
                  {allAccounts.map((account) => (
                    <tr key={account.id}>
                      <td>{account.user.name || account.user.email}</td>
                      <td>{account.provider}</td>
                      <td>{account.emailAddress}</td>
                      <td>{account.syncStatus}</td>
                      <td>{formatDateTime(account.lastSyncedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">No accounts connected anywhere yet.</p>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
