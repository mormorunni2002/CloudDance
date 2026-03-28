import { processImportJob } from "@/lib/importer/process-import-job";
import { prisma } from "@/lib/db";

async function main() {
  const [jobId, filePath] = process.argv.slice(2);
  if (!jobId || !filePath) {
    throw new Error("Usage: tsx scripts/import-worker.ts <jobId> <filePath>");
  }

  await processImportJob({ jobId, filePath });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
