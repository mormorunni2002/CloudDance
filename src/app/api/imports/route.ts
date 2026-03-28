import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function getTsxExecutable() {
  return process.platform === "win32" ? "node_modules/.bin/tsx.cmd" : "node_modules/.bin/tsx";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await request.formData();
  const upload = formData.get("file");

  if (!(upload instanceof File)) {
    return NextResponse.json({ error: "Please attach a CSV or XLSX file." }, { status: 400 });
  }

  const tempDirectory = path.join(process.cwd(), "tmp");
  await fs.mkdir(tempDirectory, { recursive: true });

  const arrayBuffer = await upload.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = upload.name.replace(/[^\w.\-() ]+/g, "_");
  const filePath = path.join(tempDirectory, `${Date.now()}-${safeName}`);

  await fs.writeFile(filePath, buffer);

  const job = await prisma.importJob.create({
    data: {
      filename: upload.name,
      createdById: session.user.id,
    },
  });

  const child = spawn(
    getTsxExecutable(),
    ["scripts/import-worker.ts", job.id, filePath],
    {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: "ignore",
    },
  );

  child.unref();

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    message: "Import job created. Refresh status in a few seconds.",
  });
}
