import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
      <div className="card p-8 text-center">
        <h1 className="text-3xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 text-sm text-muted">
          That lead, page, or secret CRM wormhole could not be found.
        </p>
        <div className="mt-6">
          <Link href="/" className="button-primary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
