import React, { useEffect, useState } from "react";
import Image from "@/components/Image";
import { Link } from "react-router-dom";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAccessRole } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";

interface Teacher {
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
  subjects?: { id: number; name: string }[];
  classes?: { id: number; name: string }[];
}

const columns = [
  { header: "Info", accessor: "info" },
  { header: "Teacher ID", accessor: "id", className: "hidden md:table-cell" },
  { header: "Subjects", accessor: "subjects", className: "hidden md:table-cell" },
  { header: "Classes", accessor: "classes", className: "hidden md:table-cell" },
  { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "actions" },
];

const TeachersPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: teachers, loading, error, pagination, refresh: fetchTeachers } = useApiList<Teacher>("teachers", "teachers", page, 10, search);

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    if (page > pagination.pages) setPage(pagination.pages);
  }, [page, pagination.pages]);

  const renderRow = (item: Teacher) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="flex items-center gap-3 py-4">
        <img
          src={item.img || `https://ui-avatars.com/api/?name=${item.name}+${item.surname}&background=C3EBFA&color=333`}
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
        {item.subjects?.map((s) => s.name).join(", ") || "—"}
      </td>
      <td className="hidden md:table-cell text-gray-600">
        {item.classes?.map((c) => c.name).join(", ") || "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600">{item.phone || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600 max-w-[160px] truncate">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link to={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSkyLight hover:bg-lamaSky transition" title="View">
              <Image src="/view.png" alt="view" width={15} height={15} />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormModal table="teacher" type="update" data={item} onSuccess={fetchTeachers} />
              <FormModal table="teacher" type="delete" id={item.id} onSuccess={fetchTeachers} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      {/* Top */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">{role === "teacher" ? "My Teacher Profile" : "All Teachers"}</h1>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search teachers..." />
          <div className="flex items-center gap-2 self-end">
            {role === "admin" && (
              <FormModal table="teacher" type="create" onSuccess={fetchTeachers} />
            )}
          </div>
        </div>
      </div>

      <Table columns={columns} renderRow={renderRow} data={teachers} loading={loading} error={error} onRetry={fetchTeachers} emptyMessage="No teachers found" />

      <Pagination
        page={page}
        totalPages={pagination.pages}
        onPageChange={setPage}
        total={pagination.total}
        limit={pagination.limit}
      />
    </div>
  );
};

export default TeachersPage;
