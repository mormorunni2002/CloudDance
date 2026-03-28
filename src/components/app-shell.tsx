import Link from "next/link";
import type { Session } from "next-auth";
import { NAV_ITEMS, roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";

export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 xl:grid-cols-[280px,minmax(0,1fr)]">
        <aside className="border-b border-border bg-white px-6 py-6 xl:min-h-screen xl:border-b-0 xl:border-r">
          <div className="sticky top-6 space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">CloudDance CRM</p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">Broker outreach cockpit</h1>
              <p className="mt-2 text-sm text-muted">
                Local-first calling, enrichment, imports, and mailbox sync in one place.
              </p>
            </div>

            <nav className="space-y-2">
              {NAV_ITEMS.filter((item) => !item.adminOnly || session.user.role === "ADMIN").map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="rounded-2xl border border-border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Signed in as</p>
              <p className="mt-2 text-sm font-semibold text-ink">{session.user.name || session.user.email}</p>
              <p className="text-sm text-muted">{session.user.email}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand">
                {roleLabels[session.user.role]}
              </p>
              <div className="mt-4">
                <SignOutButton />
              </div>
            </div>
          </div>
        </aside>

        <main className="px-6 py-6 lg:px-8 xl:px-10">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
