import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { jobId: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = params;

  const job = await prisma.importJob.findUnique({
    where: { id: jobId },
    include: {
      createdBy: {
        select: { email: true, name: true },
      },
      rows: {
        take: 10,
        orderBy: { rowNumber: "desc" },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
