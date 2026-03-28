import { ActivityType } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createLeadActivity({
  leadId,
  userId,
  type,
  summary,
  detail,
}: {
  leadId: string;
  userId?: string | null;
  type: ActivityType;
  summary: string;
  detail?: Record<string, unknown> | null;
}) {
  return prisma.activity.create({
    data: {
      leadId,
      userId: userId ?? null,
      type,
      summary,
      detail: detail ?? undefined,
    },
  });
}
