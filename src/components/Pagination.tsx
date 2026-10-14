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
    <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 border-t border-gray-100 dark:border-gray-800">
      {total !== undefined && limit !== undefined ? (
        <p className="text-xs text-center sm:text-left text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{start}–{end}</span> of{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">{total}</span> results
        </p>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-700 dark:text-gray-200"
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
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition ${
                  page === p
                    ? "bg-[#707E94] text-white shadow-xs"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
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
          className="py-1.5 px-2.5 sm:px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-700 dark:text-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;