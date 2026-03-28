import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { processImportJob } from "@/lib/importer/process-import-job";

async function main() {
  const [sourcePath, createdByEmail] = process.argv.slice(2);
  if (!sourcePath) {
    throw new Error("Usage: npm run import:file -- ./path/to/file.csv [createdByEmail]");
  }

  const absoluteSourcePath = path.resolve(process.cwd(), sourcePath);
  const tempDirectory = path.join(process.cwd(), "tmp");
  await fs.mkdir(tempDirectory, { recursive: true });

  const copiedPath = path.join(tempDirectory, `${Date.now()}-${path.basename(absoluteSourcePath)}`);
  await fs.copyFile(absoluteSourcePath, copiedPath);

  let createdById: string | null = null;
  if (createdByEmail) {
    const user = await prisma.user.findUnique({ where: { email: createdByEmail.toLowerCase() } });
    createdById = user?.id ?? null;
  }

  const job = await prisma.importJob.create({
    data: {
      filename: path.basename(absoluteSourcePath),
      createdById,
    },
  });

  await processImportJob({ jobId: job.id, filePath: copiedPath });

  const finalJob = await prisma.importJob.findUnique({ where: { id: job.id } });
  console.log(JSON.stringify(finalJob, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
