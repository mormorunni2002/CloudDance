import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    throw new Error("Usage: npm run user:password -- user@example.com NewPassword123!");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`Password updated for ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
