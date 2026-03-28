import Link from "next/link";
import { requireSession } from "@/lib/auth-helpers";
import { getFilterOptions, getLeadsPage } from "@/lib/lead-queries";
import { PageHeader } from "@/components/page-header";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { PaginationControls } from "@/components/pagination-controls";
import { PhoneLink } from "@/components/phone-link";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";

type SearchParams = {
  page?: string;
  q?: string;
  state?: string;
  lineOfBusiness?: string;
  agencySize?: string;
  hasPhone?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireSession();
  const resolved = searchParams;
  const [filters, results] = await Promise.all([getFilterOptions(), getLeadsPage(resolved)]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Brokerage-first lead list with server-side search, filters, current assignee, and quick access to the lead detail workspace."
        actions={
          <div className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-muted shadow-panel">
            {results.count} total matches
          </div>
        }
      />

      <section className="card p-5">
        <form className="grid gap-4 xl:grid-cols-[minmax(240px,1fr),repeat(4,minmax(0,180px)),auto]">
          <div className="space-y-1">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" defaultValue={resolved.q} placeholder="Brokerage, domain, phone, contact..." />
          </div>
          <div className="space-y-1">
            <label htmlFor="lineOfBusiness">Line of business</label>
            <select id="lineOfBusiness" name="lineOfBusiness" defaultValue={resolved.lineOfBusiness ?? ""}>
              <option value="">All</option>
              {filters.linesOfBusiness.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="agencySize">Agency size</label>
            <select id="agencySize" name="agencySize" defaultValue={resolved.agencySize ?? ""}>
              <option value="">All</option>
              {filters.agencySizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="state">State</label>
            <select id="state" name="state" defaultValue={resolved.state ?? ""}>
              <option value="">All</option>
              {filters.states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="hasPhone">Has phone</label>
            <select id="hasPhone" name="hasPhone" defaultValue={resolved.hasPhone ?? ""}>
              <option value="">All</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="button-primary">
              Apply filters
            </button>
            <Link href="/leads" className="button-secondary">
              Reset
            </Link>
          </div>
        </form>
      </section>

      {results.leads.length ? (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Brokerage</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Primary contact</th>
                <th>Phone</th>
                <th>State</th>
                <th>Agency size</th>
                <th>Last contacted</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {results.leads.map((lead) => {
                const assignee = lead.assignments[0]?.user;
                const primaryContact = lead.contacts[0];
                return (
                  <tr key={lead.id}>
                    <td className="min-w-[240px]">
                      <Link href={`/leads/${lead.id}`} className="font-semibold text-brand hover:text-brand-dark">
                        {lead.brokerageName}
                      </Link>
                      <div className="mt-1 text-xs text-muted">
                        {lead.lineOfBusiness || "No line of business yet"}
                      </div>
                      {lead.website ? <div className="mt-1 text-xs text-muted">{lead.website}</div> : null}
                    </td>
                    <td>
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td>{assignee?.name || assignee?.email || "Unassigned"}</td>
                    <td>
                      {primaryContact ? (
                        <>
                          <div className="font-medium text-ink">{primaryContact.fullName || "Unnamed contact"}</div>
                          <div className="text-xs text-muted">{primaryContact.email || "No email yet"}</div>
                        </>
                      ) : (
                        <span className="text-muted">No contacts</span>
                      )}
                    </td>
                    <td>{lead.phone ? <PhoneLink phone={lead.phone} /> : <span className="text-muted">—</span>}</td>
                    <td>{lead.state || "—"}</td>
                    <td>{lead.agencySize || "—"}</td>
                    <td>{formatDate(lead.lastContactedAt)}</td>
                    <td>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {lead.tags.length ? (
                          lead.tags.map(({ tag }) => (
                            <span key={tag.id} className="badge border-slate-200 bg-slate-50 text-slate-700">
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No leads match these filters"
          description="Try broadening the search or import a broker results export first."
          action={<Link href="/imports" className="button-primary">Import leads</Link>}
        />
      )}

      <PaginationControls pathname="/leads" searchParams={resolved} page={results.page} pageCount={results.pageCount} />
    </div>
  );
}
