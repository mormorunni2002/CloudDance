import Link from "next/link";
import { buildPageHref } from "@/lib/utils";

export function PaginationControls({
  pathname,
  searchParams,
  page,
  pageCount,
}: {
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-muted">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildPageHref(pathname, searchParams, { page: page - 1 })}
          className="button-secondary"
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <Link
          href={buildPageHref(pathname, searchParams, { page: page + 1 })}
          className="button-secondary"
          aria-disabled={page >= pageCount}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
