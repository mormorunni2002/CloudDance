import { hash } from "bcryptjs";
import { ActivityType, PrismaClient, Role, LeadStatus } from "@prisma/client";

const prisma = new PrismaClient();

const dispositionSeeds = [
  { key: "UNWORKED", label: "Unworked", sortOrder: 1, isDefault: true },
  { key: "ATTEMPTED", label: "Attempted", sortOrder: 2 },
  { key: "CONNECTED", label: "Connected", sortOrder: 3 },
  { key: "INTERESTED", label: "Interested", sortOrder: 4 },
  { key: "FOLLOW_UP", label: "Follow Up", sortOrder: 5 },
  { key: "CLOSED_WON", label: "Closed Won", sortOrder: 6 },
  { key: "CLOSED_LOST", label: "Closed Lost", sortOrder: 7 },
  { key: "BAD_DATA", label: "Bad Data", sortOrder: 8 },
] as const;

const demoLead = {
  brokerageName: "Sample Brokerage Group",
  normalizedBrokerageName: "sample brokerage group",
  lineOfBusiness: "Commercial Lines",
  tradeDescription: "Commercial insurance brokerage",
  website: "https://samplebrokerage.example",
  normalizedWebsite: "samplebrokerage.example",
  domain: "samplebrokerage.example",
  phone: "+1 415 555 0100",
  normalizedPhone: "+14155550100",
  city: "San Francisco",
  state: "CA",
  address: "123 Market St",
  agencySize: "11-50",
  specialtyNiche: "Cyber, EPLI",
  hasPhone: true,
  status: LeadStatus.UNWORKED,
};

async function upsertUser(email: string, name: string, role: Role, password: string) {
  const passwordHash = await hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, isActive: true },
    create: { email, name, role, passwordHash, isActive: true },
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "alex@clouddance.insure";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Admin123!";
  const sdrEmail = process.env.SEED_SDR_EMAIL ?? "partnerships@clouddance.insure";
  const sdrPassword = process.env.SEED_SDR_PASSWORD ?? "ChangeMe-SDR123!";

  const admin = await upsertUser(adminEmail, "Alex", Role.ADMIN, adminPassword);
  const sdr = await upsertUser(sdrEmail, "Partnerships SDR", Role.SDR, sdrPassword);

  for (const disposition of dispositionSeeds) {
    await prisma.disposition.upsert({
      where: { key: disposition.key },
      update: disposition,
      create: disposition,
    });
  }

  const seedDemoData = process.env.SEED_DEMO_DATA === "true";

  if (seedDemoData) {
    const existing = await prisma.lead.findFirst({
      where: { normalizedBrokerageName: demoLead.normalizedBrokerageName },
    });

    if (!existing) {
      const lead = await prisma.lead.create({ data: demoLead });
      await prisma.contact.create({
        data: {
          leadId: lead.id,
          firstName: "Jamie",
          lastName: "Rivera",
          fullName: "Jamie Rivera",
          normalizedFullName: "jamie rivera",
          title: "Producer",
          email: "jamie@samplebrokerage.example",
          normalizedEmail: "jamie@samplebrokerage.example",
          phone: "+1 415 555 0111",
          normalizedPhone: "+14155550111",
          isPrimary: true,
        },
      });
      await prisma.leadAssignment.create({
        data: {
          leadId: lead.id,
          userId: sdr.id,
          assignedById: admin.id,
          isCurrent: true,
          notes: "Demo assignment",
        },
      });
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          userId: admin.id,
          type: ActivityType.LEAD_IMPORTED,
          summary: "Demo lead seeded for local development.",
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`SDR login:   ${sdrEmail} / ${sdrPassword}`);
  console.log("To change a password later, run: npm run user:password -- user@example.com NewPassword123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
