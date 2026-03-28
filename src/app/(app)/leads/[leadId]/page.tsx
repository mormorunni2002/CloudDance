import Link from "next/link";
import { format as formatDateFns } from "date-fns";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth-helpers";
import {
  addContactAction,
  addNoteAction,
  assignLeadAction,
  completeFollowUpAction,
  completeTaskAction,
  connectEmailAccountAction,
  createFollowUpAction,
  createTaskAction,
  logCallAction,
  saveTagsAction,
  sendLeadEmailAction,
  syncEmailAccountAction,
  updateLeadAction,
} from "@/app/(app)/actions";
import { getLeadDetail, getAssignableUsers, getDispositions, getQueueForUser } from "@/lib/lead-queries";
import { getUserEmailAccounts } from "@/lib/email";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { SubmitButton } from "@/components/submit-button";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { PhoneLink } from "@/components/phone-link";
import { ActivityTimeline } from "@/components/activity-timeline";
import { formatDate, formatDateTime } from "@/lib/utils";
import { leadStatusOptions, priorityOptions } from "@/lib/constants";

function toDateTimeLocal(value?: Date | string | null) {
  if (!value) return "";
  return formatDateFns(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

type Params = {
  leadId: string;
};

export default async function LeadDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await requireSession();
  const { leadId } = params;

  const [lead, users, dispositions, queue, emailAccounts] = await Promise.all([
    getLeadDetail(leadId),
    getAssignableUsers(),
    getDispositions(),
    getQueueForUser(session.user.id, leadId),
    getUserEmailAccounts(session.user.id),
  ]);

  if (!lead) notFound();

  const currentAssignment = lead.assignments[0];
  const nextLead = queue.nextLead && queue.nextLead.id !== lead.id ? queue.nextLead : null;
  const currentTags = lead.tags.map((entry) => entry.tag.name).join(", ");
  const defaultEmailTo =
    lead.contacts
      .map((contact) => contact.email)
      .filter(Boolean)
      .join(", ") || "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.brokerageName}
        description="Work the lead from one screen: enrich the brokerage, add contacts, click to call, log dispositions, send placeholder emails, and tee up the next task."
        actions={
          <>
            <LeadStatusBadge status={lead.status} />
            {nextLead ? (
              <Link href={`/leads/${nextLead.id}`} className="button-primary">
                Next assigned lead
              </Link>
            ) : (
              <Link href="/queue" className="button-secondary">
                Back to queue
              </Link>
            )}
          </>
        }
      />

      <div className="section-grid">
        <div className="space-y-6">
          <SectionCard
            title="Lead overview"
            subtitle="Brokerage-level record and manual enrichment fields."
            action={
              <div className="flex flex-wrap gap-2">
                {lead.phone ? <PhoneLink phone={lead.phone} /> : null}
                {lead.website ? (
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary"
                  >
                    Open website
                  </a>
                ) : null}
              </div>
            }
          >
            <form action={updateLeadAction} className="space-y-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="form-grid">
                <div className="space-y-2">
                  <label htmlFor="brokerageName">Brokerage name</label>
                  <input id="brokerageName" name="brokerageName" defaultValue={lead.brokerageName} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status">Lead status</label>
                  <select id="status" name="status" defaultValue={lead.status}>
                    {leadStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="lineOfBusiness">Line of business</label>
                  <input id="lineOfBusiness" name="lineOfBusiness" defaultValue={lead.lineOfBusiness ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tradeDescription">Trade description</label>
                  <input id="tradeDescription" name="tradeDescription" defaultValue={lead.tradeDescription ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" defaultValue={lead.website ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="domain">Domain</label>
                  <input id="domain" name="domain" defaultValue={lead.domain ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone">Main phone</label>
                  <input id="phone" name="phone" defaultValue={lead.phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="state">State</label>
                  <input id="state" name="state" defaultValue={lead.state ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="city">City</label>
                  <input id="city" name="city" defaultValue={lead.city ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address">Address</label>
                  <input id="address" name="address" defaultValue={lead.address ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="agencySize">Agency size</label>
                  <input id="agencySize" name="agencySize" defaultValue={lead.agencySize ?? ""} placeholder="1-10, 11-50, 51-200..." />
                </div>
                <div className="space-y-2">
                  <label htmlFor="npnLicenseInfo">NPN / license info</label>
                  <input id="npnLicenseInfo" name="npnLicenseInfo" defaultValue={lead.npnLicenseInfo ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="carrierAppointments">Carrier appointments</label>
                  <input id="carrierAppointments" name="carrierAppointments" defaultValue={lead.carrierAppointments ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="specialtyNiche">Specialty / niche</label>
                  <input id="specialtyNiche" name="specialtyNiche" defaultValue={lead.specialtyNiche ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="linkedinCompanyProfile">LinkedIn / company profile</label>
                  <input id="linkedinCompanyProfile" name="linkedinCompanyProfile" defaultValue={lead.linkedinCompanyProfile ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="officeSize">Office size / employee count text</label>
                  <input id="officeSize" name="officeSize" defaultValue={lead.officeSize ?? ""} placeholder="e.g. 3 offices / 42 employees" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="employeeCount">Employee count</label>
                  <input id="employeeCount" name="employeeCount" type="number" defaultValue={lead.employeeCount ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="producerNames">Producer names</label>
                  <input id="producerNames" name="producerNames" defaultValue={lead.producerNames ?? ""} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="emailVerificationNotes">Email verification notes</label>
                  <input id="emailVerificationNotes" name="emailVerificationNotes" defaultValue={lead.emailVerificationNotes ?? ""} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="notesSummary">Brokerage notes summary</label>
                  <textarea id="notesSummary" name="notesSummary" defaultValue={lead.notesSummary ?? ""} rows={4} />
                </div>
              </div>

              <div className="flex justify-end">
                <SubmitButton label="Save lead updates" pendingLabel="Saving lead..." />
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Contacts"
            subtitle="Multiple points of contact per brokerage. Add direct emails, better phone numbers, titles, and LinkedIn URLs here."
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr),minmax(340px,0.85fr)]">
              <div className="space-y-4">
                {lead.contacts.length ? (
                  lead.contacts.map((contact) => (
                    <div key={contact.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {contact.fullName || "Unnamed contact"} {contact.isPrimary ? "• Primary" : ""}
                          </p>
                          <p className="text-xs text-muted">{contact.title || "No title yet"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {contact.phone ? <PhoneLink phone={contact.phone} /> : null}
                          {contact.mobile ? <PhoneLink phone={contact.mobile} /> : null}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
                        <p>Email: {contact.email || "—"}</p>
                        <p>LinkedIn: {contact.linkedinUrl || "—"}</p>
                        <p>Added from row: {contact.sourceRowNumber || "Manual"}</p>
                        <p>Notes: {contact.notes || "—"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No contacts yet. This is where the enrichment fun begins.</p>
                )}
              </div>

              <form action={addContactAction} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <input type="hidden" name="leadId" value={lead.id} />
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="firstName">First name</label>
                      <input id="firstName" name="firstName" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName">Last name</label>
                      <input id="lastName" name="lastName" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="title">Title</label>
                    <input id="title" name="title" placeholder="Producer, Principal, Account Exec..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contactEmail">Email</label>
                    <input id="contactEmail" name="email" type="email" placeholder="name@brokerage.com" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="contactPhone">Phone</label>
                      <input id="contactPhone" name="phone" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contactMobile">Mobile</label>
                      <input id="contactMobile" name="mobile" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contactLinkedIn">LinkedIn URL</label>
                    <input id="contactLinkedIn" name="linkedinUrl" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contactNotes">Notes</label>
                    <textarea id="contactNotes" name="notes" rows={3} />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-border" />
                    Mark as primary contact
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="emailVerified" className="h-4 w-4 rounded border-border" />
                    Email verified
                  </label>
                  <SubmitButton label="Add contact" pendingLabel="Adding contact..." />
                </div>
              </form>
            </div>
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Call log" subtitle="Use CloudTalk click-to-call links above, then log the disposition here.">
              <form action={logCallAction} className="space-y-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <div className="space-y-2">
                  <label htmlFor="callContactId">Contact</label>
                  <select id="callContactId" name="contactId" defaultValue="">
                    <option value="">No contact selected</option>
                    {lead.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.fullName || contact.email || "Unnamed contact"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="callPhone">Phone number</label>
                  <input id="callPhone" name="phoneNumber" defaultValue={lead.phone ?? lead.contacts[0]?.phone ?? ""} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="dispositionId">Disposition</label>
                  <select id="dispositionId" name="dispositionId" defaultValue={dispositions[0]?.id ?? ""}>
                    {dispositions.map((disposition) => (
                      <option key={disposition.id} value={disposition.id}>
                        {disposition.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="startedAt">Started at</label>
                    <input id="startedAt" name="startedAt" type="datetime-local" defaultValue={toDateTimeLocal(new Date())} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="durationSeconds">Duration (seconds)</label>
                    <input id="durationSeconds" name="durationSeconds" type="number" min={0} placeholder="180" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="cloudTalkCallId">CloudTalk call ID (placeholder)</label>
                  <input id="cloudTalkCallId" name="cloudTalkCallId" placeholder="Optional external call id" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="recordingUrl">Recording URL (optional)</label>
                  <input id="recordingUrl" name="recordingUrl" placeholder="Leave blank to auto-generate placeholder URL" />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="createPlaceholderRecording" className="h-4 w-4 rounded border-border" defaultChecked />
                  Create placeholder recording metadata if no URL is supplied
                </label>
                <div className="space-y-2">
                  <label htmlFor="callNotes">Call notes</label>
                  <textarea id="callNotes" name="notes" rows={4} placeholder="Outcome, objections, timing, carrier clues, and who actually answers the phone..." />
                </div>
                <SubmitButton label="Log call" pendingLabel="Logging call..." />
              </form>
            </SectionCard>

            <SectionCard title="Notes, tasks, and follow-ups" subtitle="Everything that keeps the queue moving without relying on human RAM.">
              <div className="space-y-6">
                <form action={addNoteAction} className="space-y-3 rounded-2xl border border-border bg-slate-50 p-4">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <div className="space-y-2">
                    <label htmlFor="noteContactId">Attach note to contact (optional)</label>
                    <select id="noteContactId" name="contactId" defaultValue="">
                      <option value="">Lead-level note</option>
                      {lead.contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.fullName || contact.email || "Unnamed contact"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="noteBody">Note</label>
                    <textarea id="noteBody" name="body" rows={3} required placeholder="Capture the useful bits while they are still warm." />
                  </div>
                  <SubmitButton label="Add note" pendingLabel="Saving note..." />
                </form>

                <form action={createTaskAction} className="space-y-3 rounded-2xl border border-border bg-slate-50 p-4">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <div className="space-y-2">
                    <label htmlFor="taskTitle">Task title</label>
                    <input id="taskTitle" name="title" required placeholder="Research licenses, verify email, ask for decision maker..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="taskDescription">Task description</label>
                    <textarea id="taskDescription" name="description" rows={3} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="taskDueAt">Due date</label>
                      <input id="taskDueAt" name="dueAt" type="datetime-local" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="taskPriority">Priority</label>
                      <select id="taskPriority" name="priority" defaultValue="MEDIUM">
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <SubmitButton label="Create task" pendingLabel="Creating task..." />
                </form>

                <form action={createFollowUpAction} className="space-y-3 rounded-2xl border border-border bg-slate-50 p-4">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <div className="space-y-2">
                    <label htmlFor="followUpDueAt">Follow-up due</label>
                    <input id="followUpDueAt" name="dueAt" type="datetime-local" defaultValue={toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000))} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="followUpNote">Follow-up note</label>
                    <textarea id="followUpNote" name="note" rows={3} placeholder="What should the next touch accomplish?" />
                  </div>
                  <SubmitButton label="Schedule follow-up" pendingLabel="Scheduling..." />
                </form>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Emails" subtitle="Placeholder Gmail / Outlook flows now, clean integration seam for real OAuth later.">
            {!emailAccounts.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No email account connected yet. Connect Gmail or Outlook in the sidebar, or from the integrations page.
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(340px,0.9fr)]">
              <div className="space-y-4">
                {lead.emailThreads.length ? (
                  lead.emailThreads.map((thread) => (
                    <div key={thread.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink">{thread.subject}</p>
                          <p className="text-xs text-muted">
                            {thread.emailAccount.provider.toLowerCase()} • {thread.emailAccount.emailAddress} • last message {formatDateTime(thread.lastMessageAt || thread.updatedAt)}
                          </p>
                        </div>
                        <span className="badge border-slate-200 bg-white text-slate-700">{thread.messages.length} messages</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {thread.messages.map((message) => (
                          <div key={message.id} className="rounded-xl border border-border bg-white p-3">
                            <p className="text-xs uppercase tracking-wide text-muted">
                              {message.direction} • {formatDateTime(message.sentAt)}
                            </p>
                            <p className="mt-1 text-sm font-medium text-ink">{message.fromAddress} → {message.toAddresses.join(", ")}</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{message.bodyText || "No body text."}</p>
                            <p className="mt-2 text-xs text-muted">{message.providerStatus || "Stored locally"}</p>
                          </div>
                        ))}
                      </div>
                      <form action={sendLeadEmailAction} className="mt-4 space-y-3 rounded-xl border border-border bg-white p-4">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="threadId" value={thread.id} />
                        <div className="space-y-2">
                          <label htmlFor={`accountId-reply-${thread.id}`}>From account</label>
                          <select id={`accountId-reply-${thread.id}`} name="accountId" defaultValue={thread.emailAccountId}>
                            {emailAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.provider.toLowerCase()} • {account.emailAddress}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`to-reply-${thread.id}`}>To</label>
                          <input id={`to-reply-${thread.id}`} name="to" defaultValue={defaultEmailTo} required />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`subject-reply-${thread.id}`}>Subject</label>
                          <input id={`subject-reply-${thread.id}`} name="subject" defaultValue={thread.subject.startsWith("Re:") ? thread.subject : `Re: ${thread.subject}`} required />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`body-reply-${thread.id}`}>Reply body</label>
                          <textarea id={`body-reply-${thread.id}`} name="bodyText" rows={4} required />
                        </div>
                        <SubmitButton label="Reply (placeholder send)" pendingLabel="Sending..." />
                      </form>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    No email threads linked yet. Compose below to create the first local placeholder thread for this lead.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {emailAccounts.length ? (
                  <form action={sendLeadEmailAction} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="composeAccountId">From account</label>
                        <select id="composeAccountId" name="accountId" defaultValue={emailAccounts[0]?.id ?? ""} required>
                          {emailAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.provider.toLowerCase()} • {account.emailAddress}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="composeTo">To</label>
                        <input id="composeTo" name="to" defaultValue={defaultEmailTo} required />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="composeCc">CC</label>
                          <input id="composeCc" name="cc" />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="composeBcc">BCC</label>
                          <input id="composeBcc" name="bcc" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="composeSubject">Subject</label>
                        <input id="composeSubject" name="subject" placeholder="Quick intro from Clouddance" required />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="composeBodyText">Body</label>
                        <textarea id="composeBodyText" name="bodyText" rows={8} required placeholder="This stores the outbound email in the CRM and is ready to swap over to real Gmail / Microsoft delivery once credentials are added." />
                      </div>
                      <SubmitButton label="Send email (placeholder)" pendingLabel="Sending..." />
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Connect a placeholder Gmail or Outlook account first to compose from the CRM.
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-ink">Quick connect</p>
                  <p className="mt-1 text-sm text-muted">Placeholder mailbox connections for local dev.</p>
                  <div className="mt-4 grid gap-3">
                    <form action={connectEmailAccountAction} className="space-y-3 rounded-xl border border-border bg-white p-3">
                      <input type="hidden" name="provider" value="GMAIL" />
                      <div className="space-y-2">
                        <label htmlFor="gmailQuickEmail">Gmail address</label>
                        <input id="gmailQuickEmail" name="emailAddress" defaultValue={session.user.email ?? ""} />
                      </div>
                      <SubmitButton label="Connect Gmail placeholder" pendingLabel="Connecting..." className="button-secondary" />
                    </form>

                    <form action={connectEmailAccountAction} className="space-y-3 rounded-xl border border-border bg-white p-3">
                      <input type="hidden" name="provider" value="MICROSOFT" />
                      <div className="space-y-2">
                        <label htmlFor="outlookQuickEmail">Outlook address</label>
                        <input id="outlookQuickEmail" name="emailAddress" defaultValue={session.user.email ?? ""} />
                      </div>
                      <SubmitButton label="Connect Outlook placeholder" pendingLabel="Connecting..." className="button-secondary" />
                    </form>

                    {emailAccounts.map((account) => (
                      <form key={account.id} action={syncEmailAccountAction} className="rounded-xl border border-border bg-white p-3">
                        <input type="hidden" name="accountId" value={account.id} />
                        <p className="text-sm font-semibold text-ink">
                          {account.provider.toLowerCase()} • {account.emailAddress}
                        </p>
                        <p className="mt-1 text-xs text-muted">Last synced: {formatDateTime(account.lastSyncedAt)}</p>
                        <div className="mt-3">
                          <SubmitButton label="Run placeholder sync" pendingLabel="Syncing..." className="button-secondary" />
                        </div>
                      </form>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <section className="sidebar-card">
            <h2 className="card-title">Assignment</h2>
            <p className="mt-1 text-sm text-muted">Current owner and quick admin reassignment tools.</p>
            <div className="mt-4 rounded-2xl border border-border bg-slate-50 p-4">
              <p className="text-sm font-semibold text-ink">{currentAssignment?.user.name || currentAssignment?.user.email || "Unassigned"}</p>
              <p className="mt-1 text-xs text-muted">
                Assigned {currentAssignment ? formatDateTime(currentAssignment.assignedAt) : "—"}
              </p>
            </div>

            {session.user.role === "ADMIN" ? (
              <form action={assignLeadAction} className="mt-4 space-y-4">
                <input type="hidden" name="leadId" value={lead.id} />
                <div className="space-y-2">
                  <label htmlFor="assignUserId">Assign to</label>
                  <select id="assignUserId" name="userId" defaultValue={currentAssignment?.userId ?? ""}>
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {(user.name || user.email) + ` (${user.role})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="assignNotes">Assignment note</label>
                  <textarea id="assignNotes" name="notes" rows={3} defaultValue={currentAssignment?.notes ?? ""} />
                </div>
                <SubmitButton label="Save assignment" pendingLabel="Saving..." />
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted">Only admins can reassign leads.</p>
            )}
          </section>

          <section className="sidebar-card">
            <h2 className="card-title">Tags</h2>
            <p className="mt-1 text-sm text-muted">Comma-separated tags for quick segmentation and clean list views.</p>
            <form action={saveTagsAction} className="mt-4 space-y-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="space-y-2">
                <label htmlFor="tags">Tags</label>
                <input id="tags" name="tags" defaultValue={currentTags} placeholder="cyber, west coast, producer-led" />
              </div>
              <SubmitButton label="Save tags" pendingLabel="Saving tags..." />
            </form>
          </section>

          <SectionCard title="Recent calls" subtitle="Latest disposition history and recording links.">
            {lead.calls.length ? (
              <div className="space-y-3">
                {lead.calls.map((call) => (
                  <div key={call.id} className="rounded-xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {call.disposition?.label || "Call"} • {call.phoneNumber}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDateTime(call.startedAt)} • {call.durationSeconds ? `${call.durationSeconds}s` : "Duration not logged"}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted">
                        <p>{call.user?.name || call.user?.email || "System"}</p>
                        <p>{call.providerStatus || "Manual log"}</p>
                      </div>
                    </div>
                    {call.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{call.notes}</p> : null}
                    {call.recordings.length ? (
                      <div className="mt-3 space-y-2">
                        {call.recordings.map((recording) => (
                          <a
                            key={recording.id}
                            href={recording.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-sm font-medium text-brand hover:text-brand-dark"
                          >
                            Open recording placeholder
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No calls logged yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Tasks" subtitle="Open work and completed tasks on this lead.">
            {lead.tasks.length ? (
              <div className="space-y-3">
                {lead.tasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{task.title}</p>
                        <p className="text-xs text-muted">
                          {task.priority} priority • due {formatDateTime(task.dueAt)} • owner {task.user?.name || task.user?.email || "—"}
                        </p>
                      </div>
                      <span className="badge border-slate-200 bg-white text-slate-700">{task.status}</span>
                    </div>
                    {task.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{task.description}</p> : null}
                    {task.status === "OPEN" ? (
                      <form action={completeTaskAction} className="mt-3">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="taskId" value={task.id} />
                        <SubmitButton label="Mark complete" pendingLabel="Completing..." className="button-secondary" />
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No tasks yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Follow-ups" subtitle="Scheduled callbacks and next touches.">
            {lead.followUps.length ? (
              <div className="space-y-3">
                {lead.followUps.map((followUp) => (
                  <div key={followUp.id} className="rounded-xl border border-border bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-ink">Due {formatDateTime(followUp.dueAt)}</p>
                    <p className="mt-1 text-xs text-muted">Owner: {followUp.user?.name || followUp.user?.email || "—"}</p>
                    {followUp.note ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{followUp.note}</p> : null}
                    {!followUp.completedAt ? (
                      <form action={completeFollowUpAction} className="mt-3">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="followUpId" value={followUp.id} />
                        <SubmitButton label="Complete follow-up" pendingLabel="Completing..." className="button-secondary" />
                      </form>
                    ) : (
                      <p className="mt-3 text-xs text-emerald-700">Completed {formatDateTime(followUp.completedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No follow-ups scheduled.</p>
            )}
          </SectionCard>

          <SectionCard title="Notes" subtitle="Human context you do not want trapped in someone's memory.">
            {lead.notes.length ? (
              <div className="space-y-3">
                {lead.notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{note.user.name || note.user.email}</p>
                      <p className="text-xs text-muted">{formatDateTime(note.createdAt)}</p>
                    </div>
                    {note.contact ? (
                      <p className="mt-1 text-xs text-muted">Linked to {note.contact.fullName || note.contact.email || "contact"}</p>
                    ) : null}
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No notes yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Activity timeline" subtitle="Everything this lead has endured so far.">
            <ActivityTimeline items={lead.activities} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
