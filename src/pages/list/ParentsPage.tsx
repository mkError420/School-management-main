import React, { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import { Link } from "react-router-dom";
import { useAccessRole } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";

const columns = [
  { header: "Info", accessor: "info" },
  { header: "Phone", accessor: "phone", className: "hidden md:table-cell" },
  { header: "Students", accessor: "students", className: "hidden md:table-cell" },
  { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "actions" },
];

const ParentsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("parents", "parents", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="flex items-center gap-3 py-4">
        <img
          src={
            item.img
              ? item.img
              : `https://ui-avatars.com/api/?name=${item.name}+${item.surname}&background=CFCEFF&color=333`
          }
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
      <td className="hidden md:table-cell text-gray-600">{item.phone}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.students?.map((s: any) => `${s.name} ${s.surname}`).join(", ") || "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600 max-w-[160px] truncate">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
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
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Parents</h1>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <TableSearch value={search} onChange={setSearch} placeholder="Search parents..." />
          <div className="flex items-center gap-2 self-end">
            {role === "admin" && <FormModal table="parent" type="create" onSuccess={fetchData} />}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No parents found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

export default ParentsPage;
