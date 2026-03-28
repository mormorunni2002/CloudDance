import Link from "next/link";
import { requireSession } from "@/lib/auth-helpers";
import { getQueueForUser } from "@/lib/lead-queries";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PhoneLink } from "@/components/phone-link";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { formatDate } from "@/lib/utils";

type SearchParams = {
  currentLeadId?: string;
};

export default async function QueuePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireSession();
  const resolved = searchParams;
  const queue = await getQueueForUser(session.user.id, resolved.currentLeadId);

  if (!queue.assignments.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My queue"
          description="Work assigned brokerages in sequence: open next lead, click to call, log the result, schedule follow-up, repeat until caffeine or victory runs out."
        />
        <EmptyState
          title="Your queue is empty"
          description="Ask an admin to assign brokerages to you, or import more data first."
          action={<Link href="/leads" className="button-primary">Browse leads</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My queue"
        description="Assigned leads are ordered oldest-touch first so callers can keep momentum without forgetting follow-ups."
        actions={
          queue.nextLead ? (
            <Link href={`/leads/${queue.nextLead.id}`} className="button-primary">
              Open next lead
            </Link>
          ) : null
        }
      />

      {queue.nextLead ? (
        <section className="card border-brand/20 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Next lead up</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">{queue.nextLead.brokerageName}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <LeadStatusBadge status={queue.nextLead.status} />
                <span className="badge border-slate-200 bg-slate-50 text-slate-700">
                  Last contacted: {formatDate(queue.nextLead.lastContactedAt)}
                </span>
                <span className="badge border-slate-200 bg-slate-50 text-slate-700">
                  {queue.nextLead.lineOfBusiness || "No line of business yet"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {queue.nextLead.phone ? <PhoneLink phone={queue.nextLead.phone} /> : <span className="text-muted">No main phone on file</span>}
                {queue.nextLead.website ? (
                  <a
                    href={queue.nextLead.website.startsWith("http") ? queue.nextLead.website : `https://${queue.nextLead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary"
                  >
                    Open website
                  </a>
                ) : null}
              </div>
            </div>

            <div className="min-w-[260px] rounded-2xl border border-border bg-slate-50 p-5">
              <p className="text-sm font-semibold text-ink">Top contacts</p>
              <div className="mt-3 space-y-3">
                {queue.nextLead.contacts.length ? (
                  queue.nextLead.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-xl border border-border bg-white p-3">
                      <p className="text-sm font-semibold text-ink">{contact.fullName || "Unnamed contact"}</p>
                      <p className="text-xs text-muted">{contact.title || "No title yet"}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {contact.phone ? <PhoneLink phone={contact.phone} /> : null}
                        {contact.email ? <p className="text-muted">{contact.email}</p> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No contacts yet. Enrich this lead before you dial blindly.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Brokerage</th>
              <th>Status</th>
              <th>Phone</th>
              <th>State</th>
              <th>Last contacted</th>
            </tr>
          </thead>
          <tbody>
            {queue.assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <Link href={`/leads/${assignment.lead.id}`} className="font-semibold text-brand hover:text-brand-dark">
                    {assignment.lead.brokerageName}
                  </Link>
                  <div className="mt-1 text-xs text-muted">{assignment.lead.lineOfBusiness || "—"}</div>
                </td>
                <td>
                  <LeadStatusBadge status={assignment.lead.status} />
                </td>
                <td>{assignment.lead.phone ? <PhoneLink phone={assignment.lead.phone} /> : "—"}</td>
                <td>{assignment.lead.state || "—"}</td>
                <td>{formatDate(assignment.lead.lastContactedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
