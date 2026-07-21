import Link from "next/link";

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

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-5 py-4"
    >
      {currentPage > 1 ? (
        <Link
          href={href(currentPage - 1)}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-stone-500">
        Página {currentPage} de {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={href(currentPage + 1)}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Siguiente →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
