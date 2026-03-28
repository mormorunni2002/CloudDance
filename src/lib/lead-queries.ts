import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampPage, getPagination } from "@/lib/pagination";

type LeadFilters = {
  page?: string | number | null;
  q?: string | null;
  state?: string | null;
  lineOfBusiness?: string | null;
  agencySize?: string | null;
  hasPhone?: string | null;
};

export async function getDashboardStats(userId?: string, role?: Role) {
  const [totalLeads, unassignedLeads, dueFollowUps, openTasks, recentImports, myAssignedLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({
      where: {
        assignments: {
          none: { isCurrent: true },
        },
      },
    }),
    prisma.followUp.count({
      where: {
        completedAt: null,
        dueAt: { lte: new Date() },
        ...(role === "SDR" && userId ? { userId } : {}),
      },
    }),
    prisma.task.count({
      where: {
        status: "OPEN",
        ...(role === "SDR" && userId ? { userId } : {}),
      },
    }),
    prisma.importJob.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.leadAssignment.count({
      where: {
        isCurrent: true,
        ...(userId ? { userId } : {}),
      },
    }),
  ]);

  return {
    totalLeads,
    unassignedLeads,
    dueFollowUps,
    openTasks,
    recentImports,
    myAssignedLeads,
  };
}

export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function getFilterOptions() {
  const [states, agencySizes, lines] = await Promise.all([
    prisma.lead.findMany({
      where: { state: { not: null } },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    }),
    prisma.lead.findMany({
      where: { agencySize: { not: null } },
      select: { agencySize: true },
      distinct: ["agencySize"],
      orderBy: { agencySize: "asc" },
    }),
    prisma.lead.findMany({
      where: { lineOfBusiness: { not: null } },
      select: { lineOfBusiness: true },
      distinct: ["lineOfBusiness"],
      orderBy: { lineOfBusiness: "asc" },
    }),
  ]);

  return {
    states: states.map((item) => item.state).filter(Boolean) as string[],
    agencySizes: agencySizes.map((item) => item.agencySize).filter(Boolean) as string[],
    linesOfBusiness: lines.map((item) => item.lineOfBusiness).filter(Boolean) as string[],
  };
}

export async function getLeadsPage(filters: LeadFilters) {
  const page = clampPage(filters.page);
  const { skip, take } = getPagination(page, 25);

  const where: Prisma.LeadWhereInput = {
    AND: [
      filters.state ? { state: filters.state } : {},
      filters.lineOfBusiness ? { lineOfBusiness: filters.lineOfBusiness } : {},
      filters.agencySize ? { agencySize: filters.agencySize } : {},
      filters.hasPhone === "true" ? { hasPhone: true } : {},
    ],
  };

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { brokerageName: { contains: q, mode: "insensitive" } },
      { website: { contains: q, mode: "insensitive" } },
      { domain: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      {
        contacts: {
          some: {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const [count, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      skip,
      take,
      orderBy: [{ brokerageName: "asc" }],
      select: {
        id: true,
        brokerageName: true,
        lineOfBusiness: true,
        agencySize: true,
        state: true,
        phone: true,
        website: true,
        hasPhone: true,
        status: true,
        lastContactedAt: true,
        tags: {
          include: { tag: true },
        },
        assignments: {
          where: { isCurrent: true },
          include: { user: true },
          take: 1,
        },
        contacts: {
          take: 1,
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    page,
    pageCount: Math.max(1, Math.ceil(count / take)),
    count,
    leads,
  };
}

export async function getLeadDetail(leadId: string) {
  return prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
      },
      assignments: {
        where: { isCurrent: true },
        include: { user: true, assignedBy: true },
        take: 1,
      },
      tags: {
        include: { tag: true },
        orderBy: { tag: { name: "asc" } },
      },
      notes: {
        include: { user: true, contact: true },
        orderBy: { createdAt: "desc" },
      },
      calls: {
        include: {
          user: true,
          contact: true,
          disposition: true,
          recordings: true,
        },
        orderBy: { startedAt: "desc" },
      },
      tasks: {
        include: { user: true },
        orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      },
      followUps: {
        include: { user: true },
        orderBy: { dueAt: "asc" },
      },
      emailThreads: {
        include: {
          emailAccount: true,
          messages: {
            orderBy: { sentAt: "asc" },
          },
        },
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      },
      activities: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function getDispositions() {
  return prisma.disposition.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCurrentAssignee(leadId: string) {
  return prisma.leadAssignment.findFirst({
    where: {
      leadId,
      isCurrent: true,
    },
    include: {
      user: true,
    },
  });
}

export async function getQueueForUser(userId: string, currentLeadId?: string) {
  const assignments = await prisma.leadAssignment.findMany({
    where: {
      userId,
      isCurrent: true,
      lead: {
        status: {
          notIn: ["CLOSED_WON", "CLOSED_LOST", "BAD_DATA"],
        },
      },
    },
    include: {
      lead: {
        include: {
          contacts: {
            take: 3,
            orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
          },
        },
      },
    },
    orderBy: [{ assignedAt: "asc" }],
  });

  assignments.sort((a, b) => {
    const aLast = a.lead.lastContactedAt ? new Date(a.lead.lastContactedAt).getTime() : 0;
    const bLast = b.lead.lastContactedAt ? new Date(b.lead.lastContactedAt).getTime() : 0;

    if (aLast !== bLast) return aLast - bLast;

    return new Date(a.lead.updatedAt).getTime() - new Date(b.lead.updatedAt).getTime();
  });

  const index = currentLeadId ? assignments.findIndex((item) => item.leadId === currentLeadId) : -1;
  const nextItem = index >= 0 ? assignments[index + 1] ?? null : assignments[0] ?? null;

  return {
    nextLead: nextItem?.lead ?? assignments[0]?.lead ?? null,
    assignments,
  };
}
