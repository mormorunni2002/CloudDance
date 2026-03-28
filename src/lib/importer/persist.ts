import { ActivityType, LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createLeadActivity } from "@/lib/activity";
import { normalizePhoneNumber } from "@/lib/phone";
import { normalizeDomain, normalizeText } from "@/lib/utils";
import type { ImportCounters, ParsedLeadInput } from "@/lib/importer/types";

function buildLeadLookup(parsedLead: ParsedLeadInput): Prisma.LeadWhereInput {
  const normalizedBrokerageName = normalizeText(parsedLead.brokerageName);
  const normalizedWebsite = normalizeDomain(parsedLead.website);
  const normalizedPhone = normalizePhoneNumber(parsedLead.phone);

  const or: Prisma.LeadWhereInput[] = [];
  if (parsedLead.domain) or.push({ domain: parsedLead.domain });
  if (normalizedWebsite) or.push({ normalizedWebsite });
  if (normalizedPhone) or.push({ normalizedPhone });

  if (or.length) {
    return {
      normalizedBrokerageName,
      OR: or,
    };
  }

  return {
    normalizedBrokerageName,
  };
}


function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null));
}

function pickExistingOrNew(existing: string | null | undefined, incoming: string | null | undefined) {
  return existing || incoming || null;
}

function buildLeadUpdateData(parsedLead: ParsedLeadInput) {
  return {
    brokerageName: parsedLead.brokerageName,
    normalizedBrokerageName: normalizeText(parsedLead.brokerageName) ?? parsedLead.brokerageName.toLowerCase(),
    tradeDescription: parsedLead.tradeDescription ?? null,
    lineOfBusiness: parsedLead.lineOfBusiness ?? null,
    website: parsedLead.website ?? null,
    normalizedWebsite: normalizeDomain(parsedLead.website),
    domain: parsedLead.domain ?? null,
    phone: parsedLead.phone ?? null,
    normalizedPhone: normalizePhoneNumber(parsedLead.phone),
    city: parsedLead.city ?? null,
    state: parsedLead.state ?? null,
    address: parsedLead.address ?? null,
    agencySize: parsedLead.agencySize ?? null,
    npnLicenseInfo: parsedLead.npnLicenseInfo ?? null,
    carrierAppointments: parsedLead.carrierAppointments ?? null,
    specialtyNiche: parsedLead.specialtyNiche ?? null,
    hasPhone: Boolean(parsedLead.phone),
    rawMetadata: parsedLead.rawMetadata ?? Prisma.JsonNull,
  };
}

function mergeLead(existing: Prisma.LeadGetPayload<{}>, parsedLead: ParsedLeadInput) {
  const incoming = buildLeadUpdateData(parsedLead);
  return {
    brokerageName: pickExistingOrNew(existing.brokerageName, incoming.brokerageName) ?? existing.brokerageName,
    normalizedBrokerageName: existing.normalizedBrokerageName || incoming.normalizedBrokerageName,
    tradeDescription: pickExistingOrNew(existing.tradeDescription, incoming.tradeDescription),
    lineOfBusiness: pickExistingOrNew(existing.lineOfBusiness, incoming.lineOfBusiness),
    website: pickExistingOrNew(existing.website, incoming.website),
    normalizedWebsite: pickExistingOrNew(existing.normalizedWebsite, incoming.normalizedWebsite),
    domain: pickExistingOrNew(existing.domain, incoming.domain),
    phone: pickExistingOrNew(existing.phone, incoming.phone),
    normalizedPhone: pickExistingOrNew(existing.normalizedPhone, incoming.normalizedPhone),
    city: pickExistingOrNew(existing.city, incoming.city),
    state: pickExistingOrNew(existing.state, incoming.state),
    address: pickExistingOrNew(existing.address, incoming.address),
    agencySize: pickExistingOrNew(existing.agencySize, incoming.agencySize),
    npnLicenseInfo: pickExistingOrNew(existing.npnLicenseInfo, incoming.npnLicenseInfo),
    carrierAppointments: pickExistingOrNew(existing.carrierAppointments, incoming.carrierAppointments),
    specialtyNiche: pickExistingOrNew(existing.specialtyNiche, incoming.specialtyNiche),
    hasPhone: existing.hasPhone || incoming.hasPhone,
    rawMetadata: existing.rawMetadata || incoming.rawMetadata,
  };
}

async function upsertContact(leadId: string, contact: ParsedLeadInput["contacts"][number]) {
  const normalizedEmail = normalizeText(contact.email);
  const normalizedFullName = normalizeText(contact.fullName);
  const normalizedPhone = normalizePhoneNumber(contact.phone);

  const contactConditions = [
    normalizedEmail ? { normalizedEmail } : undefined,
    normalizedPhone ? { normalizedPhone } : undefined,
    normalizedFullName ? { normalizedFullName } : undefined,
  ].filter(Boolean) as Prisma.ContactWhereInput[];

  const existing = contactConditions.length
    ? await prisma.contact.findFirst({
        where: {
          leadId,
          OR: contactConditions,
        },
      })
    : null;

  if (existing) {
    await prisma.contact.update({
      where: { id: existing.id },
      data: {
        firstName: existing.firstName || contact.firstName || null,
        lastName: existing.lastName || contact.lastName || null,
        fullName: existing.fullName || contact.fullName || null,
        normalizedFullName: existing.normalizedFullName || normalizedFullName,
        email: existing.email || contact.email || null,
        normalizedEmail: existing.normalizedEmail || normalizedEmail,
        phone: existing.phone || contact.phone || null,
        normalizedPhone: existing.normalizedPhone || normalizedPhone,
      },
    });
    return { created: false };
  }

  await prisma.contact.create({
    data: {
      leadId,
      firstName: contact.firstName ?? null,
      lastName: contact.lastName ?? null,
      fullName: contact.fullName ?? null,
      normalizedFullName,
      email: contact.email ?? null,
      normalizedEmail,
      phone: contact.phone ?? null,
      normalizedPhone,
      sourceRowNumber: contact.rawRowNumber,
    },
  });

  return { created: true };
}

export async function persistParsedLeads({
  jobId,
  leads,
  createdById,
  batchSize = 250,
}: {
  jobId: string;
  leads: ParsedLeadInput[];
  createdById?: string | null;
  batchSize?: number;
}) {
  const counters: ImportCounters = {
    totalRows: 0,
    leadRows: 0,
    continuationRows: 0,
    processedRows: 0,
    leadsCreated: 0,
    leadsUpdated: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    errorsCount: 0,
    skippedRows: 0,
  };

  for (let index = 0; index < leads.length; index += batchSize) {
    const batch = leads.slice(index, index + batchSize);

    for (const parsedLead of batch) {
      try {
        counters.leadRows += 1;
        counters.totalRows += parsedLead.sourceRows.length;
        counters.continuationRows += Math.max(0, parsedLead.sourceRows.length - 1);

        const existingLead = await prisma.lead.findFirst({
          where: buildLeadLookup(parsedLead),
        });

        const lead =
          existingLead
            ? await prisma.lead.update({
                where: { id: existingLead.id },
                data: mergeLead(existingLead, parsedLead),
              })
            : await prisma.lead.create({
                data: {
                  ...buildLeadUpdateData(parsedLead),
                  status: LeadStatus.UNWORKED,
                },
              });

        if (existingLead) {
          counters.leadsUpdated += 1;
        } else {
          counters.leadsCreated += 1;
          await createLeadActivity({
            leadId: lead.id,
            userId: createdById,
            type: ActivityType.LEAD_IMPORTED,
            summary: `Imported lead from job ${jobId}.`,
            detail: { jobId, headerRowNumber: parsedLead.headerRowNumber },
          });
        }

        for (const contact of parsedLead.contacts) {
          const result = await upsertContact(lead.id, contact);
          if (result.created) counters.contactsCreated += 1;
          else counters.contactsUpdated += 1;
        }

        await prisma.importRow.createMany({
          data: parsedLead.sourceRows.map((sourceRow) => ({
            jobId,
            leadId: lead.id,
            rowNumber: sourceRow.rowNumber,
            rowType: sourceRow.rowType,
            brokerageNameRaw: parsedLead.brokerageName,
            status: "IMPORTED",
            payload: toJsonValue(sourceRow.payload),
          })),
          skipDuplicates: false,
        });

        counters.processedRows += parsedLead.sourceRows.length;
      } catch (error) {
        counters.errorsCount += 1;
        await prisma.importRow.create({
          data: {
            jobId,
            rowNumber: parsedLead.headerRowNumber,
            rowType: "lead",
            brokerageNameRaw: parsedLead.brokerageName,
            status: "ERROR",
            message: error instanceof Error ? error.message : "Unknown import error",
            payload: toJsonValue(parsedLead),
          },
        });
      }

      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          processedRows: counters.processedRows,
          leadRows: counters.leadRows,
          continuationRows: counters.continuationRows,
          leadsCreated: counters.leadsCreated,
          leadsUpdated: counters.leadsUpdated,
          contactsCreated: counters.contactsCreated,
          contactsUpdated: counters.contactsUpdated,
          errorsCount: counters.errorsCount,
          skippedRows: counters.skippedRows,
        },
      });
    }
  }

  return counters;
}
