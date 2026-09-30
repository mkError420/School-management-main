import React, { useEffect, useState, useCallback } from "react";
import Image from "@/components/Image";
import { Link } from "react-router-dom";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

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
  const { role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 10 };
    if (search) params.search = search;
    const res = await api.getAll("students", params);
    if (res.success && res.data?.students) {
      setStudents(res.data.students);
      setPagination(res.data.pagination || { total: 0, pages: 1, limit: 10 });
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { setPage(1); }, [search]);

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
      <td className="hidden md:table-cell text-gray-600">{item.grade_level || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600">{item.phone || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600 max-w-[160px] truncate">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link to={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSkyLight hover:bg-lamaSky transition" title="View">
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
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search students..." />
          <div className="flex items-center gap-2 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-300 transition">
              <Image src="/filter.png" alt="filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-300 transition">
              <Image src="/sort.png" alt="sort" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal table="student" type="create" onSuccess={fetchStudents} />
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={students} loading={loading} emptyMessage="No students found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

export default StudentsPage;
