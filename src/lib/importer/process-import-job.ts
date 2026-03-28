import fs from "fs/promises";
import path from "path";
import { ImportStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseBrokerageRows, parseSourceFile } from "@/lib/importer/parse";
import { persistParsedLeads } from "@/lib/importer/persist";
import { sha256 } from "@/lib/importer/detect";

export async function processImportJob({
  jobId,
  filePath,
}: {
  jobId: string;
  filePath: string;
}) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: ImportStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  try {
    const buffer = await fs.readFile(filePath);
    const parsedFile = await parseSourceFile(filePath);

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        filename: path.basename(filePath),
        sourceHash: sha256(buffer),
        fileType: parsedFile.fileType,
        encoding: parsedFile.encoding,
      },
    });

    if (parsedFile.fileType === "SEARCH_SUMMARY") {
      throw new Error(
        "This file looks like a search-summary export, not a broker lead export. Upload the results export with columns like 'Company name Latin alphabet' and 'Telephone number'.",
      );
    }

    if (parsedFile.fileType !== "BROKER_LEADS") {
      throw new Error(
        "Unrecognized import format. Expected a broker lead export with 'Company name Latin alphabet', 'Telephone number', 'Domain', and 'Website address' headers.",
      );
    }

    const parsedRows = parseBrokerageRows(parsedFile.rows);

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        totalRows: parsedFile.rows.length,
        leadRows: parsedRows.counters.leadRows,
        continuationRows: parsedRows.counters.continuationRows,
      },
    });

    const counters = await persistParsedLeads({
      jobId,
      leads: parsedRows.leads,
      createdById: job?.createdById,
      batchSize: Number(process.env.IMPORT_BATCH_SIZE || "250"),
    });

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: counters.errorsCount > 0 ? ImportStatus.PARTIAL : ImportStatus.COMPLETED,
        totalRows: parsedFile.rows.length,
        processedRows: counters.processedRows,
        leadRows: counters.leadRows,
        continuationRows: counters.continuationRows,
        leadsCreated: counters.leadsCreated,
        leadsUpdated: counters.leadsUpdated,
        contactsCreated: counters.contactsCreated,
        contactsUpdated: counters.contactsUpdated,
        errorsCount: counters.errorsCount,
        skippedRows: counters.skippedRows,
        summary: JSON.stringify(counters, null, 2),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportStatus.FAILED,
        errorLog: error instanceof Error ? error.stack || error.message : "Unknown import failure",
        completedAt: new Date(),
      },
    });
  } finally {
    await fs.rm(filePath, { force: true });
  }
}
