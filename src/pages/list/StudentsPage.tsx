import React, { useEffect, useState } from "react";
import Image from "@/components/Image";
import { Link } from "react-router-dom";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAccessRole } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";
import { GraduationCap, ArrowRight, UserPlus } from "lucide-react";

interface Student {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  address: string;
  img?: string;
  blood_type: string;
  sex: string;
  class_name?: string;
  grade_level?: number;
}

const columns = [
  { header: "Info", accessor: "info" },
  { header: "Student ID", accessor: "id", className: "hidden md:table-cell" },
  { header: "Grade", accessor: "grade", className: "hidden md:table-cell" },
  { header: "Class", accessor: "class", className: "hidden md:table-cell" },
  { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "actions" },
];

const StudentsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: students, loading, error, pagination, refresh: fetchStudents } = useApiList<Student>("students", "students", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const renderRow = (item: Student) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="flex items-center gap-3 py-4">
        <img
          src={item.img || `https://ui-avatars.com/api/?name=${item.name}+${item.surname}&background=FAE27C&color=333`}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-gray-800">{item.name} {item.surname}</h3>
          <p className="text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell text-gray-600">{item.id}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.grade_level ? `Grade ${item.grade_level}` : "—"}
      </td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600">{item.phone || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600 max-w-[160px] truncate">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link to={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSkyLight hover:bg-lamaSky transition" title="View student profile">
              <Image src="/view.png" alt="view" width={15} height={15} />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormModal table="student" type="update" data={item} onSuccess={fetchStudents} />
              <FormModal table="student" type="delete" id={item.id} onSuccess={fetchStudents} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-purple-600" />
          <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Students</h1>
          {!loading && pagination.total > 0 && (
            <span className="hidden md:inline-flex items-center bg-purple-100 text-purple-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {pagination.total} enrolled
            </span>
          )}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search students..." />
        </div>
      </div>

      {/* Admissions Info Banner — admin only */}
      {role === "admin" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-lamaPurpleLight px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
              <UserPlus size={17} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-900">
                Students are enrolled through the Admissions workflow
              </p>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Submit an admission application and approve it to automatically create a student account with login credentials and class assignment.
              </p>
            </div>
          </div>
          <Link
            to="/admissions"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-semibold shadow-sm shadow-purple-500/20 transition"
          >
            <span>Go to Admissions</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Student Table */}
      <Table
        columns={columns}
        renderRow={renderRow}
        data={students}
        loading={loading}
        error={error}
        onRetry={fetchStudents}
        emptyMessage={
          role === "admin"
            ? "No students enrolled yet. Use the Admissions page to register and approve new students."
            : "No students found."
        }
      />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

export default StudentsPage;
