import Link from "next/link";
import { buttonClasses } from "@/components/ui";

interface AdminPaginationProps {
  pathname: string;
  currentPage: number;
  totalPages: number;
  pageParam?: string;
  query?: Record<string, string>;
}

export function AdminPagination({
  pathname,
  currentPage,
  totalPages,
  pageParam = "page",
  query = {},
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  function href(page: number) {
    const params = new URLSearchParams(query);
    if (page > 1) {
      params.set(pageParam, String(page));
    } else {
      params.delete(pageParam);
    }
    const suffix = params.toString();
    return suffix ? `${pathname}?${suffix}` : pathname;
  }

  const linkClass = buttonClasses({ variant: "secundario", size: "sm" });

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      {currentPage > 1 ? (
        <Link href={href(currentPage - 1)} className={linkClass}>
          <span aria-hidden="true">←</span> Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="type-body-sm tabular-nums text-text-secondary">
        Página {currentPage} de {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={href(currentPage + 1)} className={linkClass}>
          Siguiente <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
