"use server";

import { revalidatePath } from "next/cache";
import { ActivityType, EmailProvider, LeadStatus, Priority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth-helpers";
import { createLeadActivity } from "@/lib/activity";
import { defaultDispositionToLeadStatus } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/phone";
import { cleanString, normalizeDomain, normalizeText, parseInteger } from "@/lib/utils";
import { connectPlaceholderEmailAccount, sendPlaceholderLeadEmail, syncPlaceholderEmailAccount } from "@/lib/email";
import { buildPlaceholderRecordingUrl } from "@/lib/integrations/cloudtalk";

function asNullableString(value: FormDataEntryValue | null) {
  return cleanString(value);
}

function parseDateTime(value: FormDataEntryValue | null) {
  const stringValue = asNullableString(value);
  return stringValue ? new Date(stringValue) : null;
}

export async function updateLeadAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));
  const brokerageName = String(formData.get("brokerageName"));

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      brokerageName,
      normalizedBrokerageName: normalizeText(brokerageName) ?? brokerageName.toLowerCase(),
      lineOfBusiness: asNullableString(formData.get("lineOfBusiness")),
      tradeDescription: asNullableString(formData.get("tradeDescription")),
      website: asNullableString(formData.get("website")),
      normalizedWebsite: normalizeDomain(formData.get("website")),
      domain: normalizeDomain(formData.get("domain")) || normalizeDomain(formData.get("website")),
      phone: asNullableString(formData.get("phone")),
      normalizedPhone: normalizePhoneNumber(formData.get("phone")),
      city: asNullableString(formData.get("city")),
      state: asNullableString(formData.get("state")),
      address: asNullableString(formData.get("address")),
      npnLicenseInfo: asNullableString(formData.get("npnLicenseInfo")),
      agencySize: asNullableString(formData.get("agencySize")),
      carrierAppointments: asNullableString(formData.get("carrierAppointments")),
      specialtyNiche: asNullableString(formData.get("specialtyNiche")),
      linkedinCompanyProfile: asNullableString(formData.get("linkedinCompanyProfile")),
      officeSize: asNullableString(formData.get("officeSize")),
      employeeCount: parseInteger(formData.get("employeeCount")),
      producerNames: asNullableString(formData.get("producerNames")),
      emailVerificationNotes: asNullableString(formData.get("emailVerificationNotes")),
      notesSummary: asNullableString(formData.get("notesSummary")),
      status: String(formData.get("status")) as LeadStatus,
      hasPhone: Boolean(asNullableString(formData.get("phone")) || asNullableString(formData.get("mobile"))),
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.LEAD_UPDATED,
    summary: "Updated brokerage/enrichment fields.",
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/queue");
}

export async function addContactAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));
  const firstName = asNullableString(formData.get("firstName"));
  const lastName = asNullableString(formData.get("lastName"));
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || asNullableString(formData.get("fullName"));

  await prisma.contact.create({
    data: {
      leadId,
      firstName,
      lastName,
      fullName,
      normalizedFullName: normalizeText(fullName),
      title: asNullableString(formData.get("title")),
      phone: asNullableString(formData.get("phone")),
      normalizedPhone: normalizePhoneNumber(formData.get("phone")),
      mobile: asNullableString(formData.get("mobile")),
      normalizedMobile: normalizePhoneNumber(formData.get("mobile")),
      email: asNullableString(formData.get("email")),
      normalizedEmail: normalizeText(formData.get("email")),
      linkedinUrl: asNullableString(formData.get("linkedinUrl")),
      emailVerified: formData.get("emailVerified") === "on" ? true : null,
      isPrimary: formData.get("isPrimary") === "on",
      notes: asNullableString(formData.get("notes")),
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.CONTACT_ADDED,
    summary: `Added contact ${fullName || asNullableString(formData.get("email")) || "Untitled contact"}.`,
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function assignLeadAction(formData: FormData) {
  const session = await requireAdmin();
  const leadId = String(formData.get("leadId"));
  const userId = asNullableString(formData.get("userId"));
  const notes = asNullableString(formData.get("notes"));

  await prisma.leadAssignment.updateMany({
    where: {
      leadId,
      isCurrent: true,
    },
    data: {
      isCurrent: false,
      unassignedAt: new Date(),
    },
  });

  if (userId) {
    await prisma.leadAssignment.create({
      data: {
        leadId,
        userId,
        assignedById: session.user.id,
        notes,
        isCurrent: true,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await createLeadActivity({
      leadId,
      userId: session.user.id,
      type: ActivityType.ASSIGNMENT_CHANGED,
      summary: `Assigned lead to ${user?.name || user?.email || "user"}.`,
    });
  } else {
    await createLeadActivity({
      leadId,
      userId: session.user.id,
      type: ActivityType.ASSIGNMENT_CHANGED,
      summary: "Removed current lead assignment.",
    });
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/queue");
  revalidatePath("/leads");
}

export async function addNoteAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));
  const body = String(formData.get("body"));
  const contactId = asNullableString(formData.get("contactId"));

  await prisma.note.create({
    data: {
      leadId,
      contactId,
      userId: session.user.id,
      body,
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.NOTE_ADDED,
    summary: `Added note${contactId ? " to a contact" : ""}.`,
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function logCallAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));
  const contactId = asNullableString(formData.get("contactId"));
  const dispositionId = asNullableString(formData.get("dispositionId"));
  const phoneNumber = asNullableString(formData.get("phoneNumber")) || "";
  const notes = asNullableString(formData.get("notes"));
  const recordingUrlInput = asNullableString(formData.get("recordingUrl"));
  const durationSeconds = Number(formData.get("durationSeconds") || 0) || null;
  const startedAt = parseDateTime(formData.get("startedAt")) || new Date();
  const endedAt = durationSeconds ? new Date(startedAt.getTime() + durationSeconds * 1000) : parseDateTime(formData.get("endedAt"));
  const cloudTalkCallId = asNullableString(formData.get("cloudTalkCallId"));

  const call = await prisma.call.create({
    data: {
      leadId,
      contactId,
      userId: session.user.id,
      dispositionId,
      phoneNumber,
      normalizedPhone: normalizePhoneNumber(phoneNumber),
      notes,
      durationSeconds,
      startedAt,
      endedAt,
      cloudTalkCallId,
      providerStatus: "LOGGED_MANUALLY",
    },
  });

  if (recordingUrlInput || formData.get("createPlaceholderRecording") === "on") {
    await prisma.recording.create({
      data: {
        callId: call.id,
        provider: "cloudtalk-placeholder",
        url: recordingUrlInput || buildPlaceholderRecordingUrl(call.id),
        durationSeconds: durationSeconds ?? undefined,
      },
    });
  }

  const disposition = dispositionId
    ? await prisma.disposition.findUnique({ where: { id: dispositionId } })
    : null;

  const mappedLeadStatus = disposition ? defaultDispositionToLeadStatus[disposition.key] : undefined;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      lastContactedAt: startedAt,
      ...(mappedLeadStatus ? { status: mappedLeadStatus } : {}),
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.CALL_LOGGED,
    summary: `Logged ${disposition?.label?.toLowerCase() || "call"}${phoneNumber ? ` with ${phoneNumber}` : ""}.`,
    detail: {
      callId: call.id,
      durationSeconds,
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/queue");
}

export async function createTaskAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));

  await prisma.task.create({
    data: {
      leadId,
      userId: asNullableString(formData.get("userId")) || session.user.id,
      title: String(formData.get("title")),
      description: asNullableString(formData.get("description")),
      dueAt: parseDateTime(formData.get("dueAt")),
      priority: (String(formData.get("priority") || "MEDIUM") as Priority) || Priority.MEDIUM,
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.TASK_CREATED,
    summary: `Created task "${String(formData.get("title"))}".`,
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function completeTaskAction(formData: FormData) {
  const session = await requireSession();
  const taskId = String(formData.get("taskId"));
  const leadId = String(formData.get("leadId"));

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.TASK_COMPLETED,
    summary: `Completed task "${task.title}".`,
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function createFollowUpAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));

  await prisma.followUp.create({
    data: {
      leadId,
      userId: asNullableString(formData.get("userId")) || session.user.id,
      dueAt: parseDateTime(formData.get("dueAt")) || new Date(),
      note: asNullableString(formData.get("note")),
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: LeadStatus.FOLLOW_UP,
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.FOLLOW_UP_CREATED,
    summary: "Scheduled follow-up.",
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/queue");
}

export async function completeFollowUpAction(formData: FormData) {
  const session = await requireSession();
  const followUpId = String(formData.get("followUpId"));
  const leadId = String(formData.get("leadId"));

  await prisma.followUp.update({
    where: { id: followUpId },
    data: {
      completedAt: new Date(),
    },
  });

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.FOLLOW_UP_COMPLETED,
    summary: "Completed follow-up.",
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function saveTagsAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));
  const tagsInput = String(formData.get("tags") || "");
  const tags = Array.from(
    new Set(
      tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

  await prisma.leadTag.deleteMany({ where: { leadId } });

  for (const name of tags) {
    const tag = await prisma.tag.upsert({
      where: { name: name.toLowerCase() },
      update: {},
      create: {
        name: name.toLowerCase(),
      },
    });

    await prisma.leadTag.create({
      data: {
        leadId,
        tagId: tag.id,
      },
    });
  }

  await createLeadActivity({
    leadId,
    userId: session.user.id,
    type: ActivityType.TAGS_UPDATED,
    summary: tags.length ? `Updated tags: ${tags.join(", ")}.` : "Cleared tags.",
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/queue");
}

export async function connectEmailAccountAction(formData: FormData) {
  const session = await requireSession();
  const provider = String(formData.get("provider")) as EmailProvider;
  const emailAddress = String(formData.get("emailAddress") || session.user.email || "");

  await connectPlaceholderEmailAccount({
    userId: session.user.id,
    provider,
    emailAddress,
    displayName: session.user.name || session.user.email,
  });

  revalidatePath("/settings/integrations");
  revalidatePath("/leads");
}

export async function syncEmailAccountAction(formData: FormData) {
  const session = await requireSession();
  const accountId = String(formData.get("accountId"));

  await syncPlaceholderEmailAccount({
    accountId,
    actingUserId: session.user.id,
  });

  revalidatePath("/settings/integrations");
}

export async function sendLeadEmailAction(formData: FormData) {
  const session = await requireSession();
  const leadId = String(formData.get("leadId"));
  const accountId = String(formData.get("accountId"));
  const threadId = asNullableString(formData.get("threadId"));
  const to = String(formData.get("to") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const cc = String(formData.get("cc") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const bcc = String(formData.get("bcc") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const subject = String(formData.get("subject") || "");
  const bodyText = String(formData.get("bodyText") || "");

  await sendPlaceholderLeadEmail({
    leadId,
    accountId,
    to,
    cc,
    bcc,
    subject,
    bodyText,
    threadId,
    actingUserId: session.user.id,
  });

  revalidatePath(`/leads/${leadId}`);
}
