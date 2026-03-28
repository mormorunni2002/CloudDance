import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleLabels } from "@/lib/constants";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}

export function assertCanAccessAdmin(role?: string | null) {
  if (role !== "ADMIN") {
    throw new Error(`Admin access required. Current role: ${role ?? "unknown"} (${role ? roleLabels[role as keyof typeof roleLabels] : "none"})`);
  }
}
