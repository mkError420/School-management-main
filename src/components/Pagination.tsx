import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, total, limit }) => {
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  const start = total && limit ? (page - 1) * limit + 1 : undefined;
  const end = total && limit ? Math.min(page * limit, total) : undefined;

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      {total !== undefined && limit !== undefined ? (
        <p className="text-xs">
          Showing <span className="font-semibold text-gray-800">{start}–{end}</span> of{" "}
          <span className="font-semibold text-gray-800">{total}</span> results
        </p>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                  page === p
                    ? "bg-lamaSky text-gray-800 shadow-sm"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;