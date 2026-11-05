import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, X } from "lucide-react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAccessRole } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";
import { useSearchParamState } from "@/lib/useSearchParamState";
import StudentFeesView from "@/components/fees/StudentFeesView";

const columns = [
  { header: "Info", accessor: "info" },
  { header: "Phone", accessor: "phone", className: "hidden md:table-cell" },
  { header: "Students", accessor: "students", className: "hidden md:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "actions" },
];

const ParentsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useSearchParamState();
  const [page, setPage] = useState(1);
  const [selectedParentForFees, setSelectedParentForFees] = useState<any | null>(null);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("parents", "parents", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
      <td className="flex items-center gap-3 py-4">
        <img
          src={
            item.img
              ? item.img
              : `https://ui-avatars.com/api/?name=${item.name}+${item.surname}&background=D32F45&color=fff`
          }
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
            <span>{item.name} {item.surname}</span>
            {item.nid && (
              <span className="font-mono text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded">
                NID: {item.nid}
              </span>
            )}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.phone || "—"}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
        {item.students && item.students.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 items-center">
            {item.students.map((s: any, idx: number) => {
              const fullName = `${s.name || ""} ${s.surname || ""}`.trim();
              const version = s.version || "Bangla";
              return (
                <Link
                  key={s.id || idx}
                  to={`/list/students/${s.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#707E94]/10 dark:bg-[#707E94]/20 text-[#707E94] dark:text-[#a4b3c7] border border-[#707E94]/30 dark:border-[#707E94]/30 hover:bg-[#707E94]/20 dark:hover:bg-[#707E94]/30 transition group"
                  title={`View student profile of ${fullName}`}
                >
                  <span className="font-semibold group-hover:underline">{fullName || "Student"}</span>
                  {s.class_name && (
                    <span className="text-[10px] text-gray-500 font-normal">({s.class_name})</span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    version.toLowerCase() === "english"
                      ? "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  }`}>
                    {version}
                  </span>
                  {s.student_type && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {s.student_type}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">—</span>
        )}
      </td>
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedParentForFees(item)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
            title="View Family Fees & Payment Record"
          >
            <Coins size={14} />
          </button>
          {role === "admin" && (
            <>
              <FormModal table="parent" type="update" data={item} onSuccess={fetchData} />
              <FormModal table="parent" type="delete" id={item.id} onSuccess={fetchData} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Parents</h1>
        <div className="w-full sm:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search parents..." />
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No parents found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />

      {/* Family Fees Modal */}
      {selectedParentForFees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-6 border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-800/80">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
                <Coins size={17} className="text-[#005a40]" />
                <span>
                  {selectedParentForFees.name} {selectedParentForFees.surname} — Children Fee Invoices
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParentForFees(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3 sm:p-4 max-h-[82vh] overflow-y-auto">
              <StudentFeesView
                parentId={selectedParentForFees.id}
                childrenStudents={selectedParentForFees.students}
                showStudentColumn={true}
                title={`${selectedParentForFees.name} ${selectedParentForFees.surname}'s Family Fees`}
                subtitle="Track paid vouchers, due balances, and upcoming scheduled term fees"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsPage;


