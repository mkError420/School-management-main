import React from "react";

interface Column {
  header: string;
  accessor: string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

const Table: React.FC<TableProps> = ({ columns, renderRow, data, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="w-full mt-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.accessor} className={`pb-3 pr-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td key={col.accessor} className={`py-3 pr-4 ${col.className || ""}`}>
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full mt-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.accessor} className={`pb-3 pr-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">{emptyMessage || "No records found"}</p>
        </div>
      </div>
    );
  }

  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
          {columns.map((col) => (
            <th key={col.accessor} className={`pb-3 pr-4 ${col.className || ""}`}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map((item) => renderRow(item))}</tbody>
    </table>
  );
};

export default Table;