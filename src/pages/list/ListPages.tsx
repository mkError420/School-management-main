// Generic list page factory — used for Subjects, Classes, Lessons, Exams, Assignments, Results, Attendance, Events, Announcements

import React, { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import { useAuth } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";

// ───────────────────────────────────────────────
// SUBJECTS
// ───────────────────────────────────────────────
export const SubjectsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("subjects", "subjects", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Subject Name", accessor: "name" },
    { header: "Teachers", accessor: "teachers", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-sm hover:bg-purple-50 transition">
      <td className="py-3 font-medium text-gray-800">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.teachers?.map((t: any) => `${t.name} ${t.surname}`).join(", ") || "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="subject" type="update" data={item} onSuccess={fetchData} />
              <FormModal table="subject" type="delete" id={item.id} onSuccess={fetchData} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Subjects</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search subjects..." />
          {role === "admin" && <FormModal table="subject" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No subjects found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// CLASSES
// ───────────────────────────────────────────────
export const ClassesPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("classes", "classes", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Class Name", accessor: "name" },
    { header: "Capacity", accessor: "capacity", className: "hidden md:table-cell" },
    { header: "Grade", accessor: "grade_level", className: "hidden md:table-cell" },
    { header: "Supervisor", accessor: "supervisor", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-sm hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600">{item.capacity}</td>
      <td className="hidden md:table-cell text-gray-600">Grade {item.grade_level || item.grade_id}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.supervisor_name ? `${item.supervisor_name} ${item.supervisor_surname}` : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="class" type="update" data={item} onSuccess={fetchData} />
              <FormModal table="class" type="delete" id={item.id} onSuccess={fetchData} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Classes</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search classes..." />
          {role === "admin" && <FormModal table="class" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No classes found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// LESSONS
// ───────────────────────────────────────────────
export const LessonsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("lessons", "lessons", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Lesson Name", accessor: "name" },
    { header: "Day", accessor: "day", className: "hidden md:table-cell" },
    { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600 capitalize">{item.day?.toLowerCase()}</td>
      <td className="hidden md:table-cell text-gray-600">{item.subject_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600">
        {item.teacher_name ? `${item.teacher_name} ${item.teacher_surname}` : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="lesson" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="lesson" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Lessons</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search lessons..." />
          {(role === "admin" || role === "teacher") && <FormModal table="lesson" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No lessons found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// EXAMS
// ───────────────────────────────────────────────
export const ExamsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("exams", "exams", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Exam Title", accessor: "title" },
    { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">{item.title}</td>
      <td className="hidden md:table-cell text-gray-600">{item.subject_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.teacher_name ? `${item.teacher_name} ${item.teacher_surname}` : "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600">
        {item.start_time ? new Date(item.start_time).toLocaleDateString() : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="exam" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="exam" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Exams</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search exams..." />
          {(role === "admin" || role === "teacher") && <FormModal table="exam" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No exams found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// ASSIGNMENTS
// ───────────────────────────────────────────────
export const AssignmentsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("assignments", "assignments", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Title", accessor: "title" },
    { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Due Date", accessor: "due", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">{item.title}</td>
      <td className="hidden md:table-cell text-gray-600">{item.subject_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.teacher_name ? `${item.teacher_name} ${item.teacher_surname}` : "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600">
        {item.due_date ? new Date(item.due_date).toLocaleDateString() : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="assignment" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="assignment" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Assignments</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search assignments..." />
          {(role === "admin" || role === "teacher") && <FormModal table="assignment" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No assignments found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// RESULTS
// ───────────────────────────────────────────────
export const ResultsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("results", "results", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Student", accessor: "student" },
    { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
    { header: "Type", accessor: "type", className: "hidden md:table-cell" },
    { header: "Score", accessor: "score", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">
        {item.student_name} {item.student_surname}
      </td>
      <td className="hidden md:table-cell text-gray-600">{item.subject_name || "—"}</td>
      <td className="hidden md:table-cell">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.exam_id ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
          {item.exam_id ? "Exam" : "Assignment"}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <span className={`font-bold text-sm ${item.score >= 90 ? "text-green-600" : item.score >= 70 ? "text-yellow-600" : "text-red-500"}`}>
          {item.score}%
        </span>
      </td>
      <td className="hidden lg:table-cell text-gray-600">
        {item.date ? new Date(item.date).toLocaleDateString() : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="result" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="result" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Results</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search results..." />
          {(role === "admin" || role === "teacher") && <FormModal table="result" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No results found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// ATTENDANCE
// ───────────────────────────────────────────────
export const AttendancePage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("attendance", "attendance", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Student", accessor: "student" },
    { header: "Lesson", accessor: "lesson", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">
        {item.student_name} {item.student_surname}
      </td>
      <td className="hidden md:table-cell text-gray-600">{item.lesson_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600">{item.date}</td>
      <td>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {item.present ? "Present" : "Absent"}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="attendance" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="attendance" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">Attendance Records</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search attendance..." />
          {(role === "admin" || role === "teacher") && <FormModal table="attendance" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No attendance records found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// EVENTS
// ───────────────────────────────────────────────
export const EventsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("events", "events", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Title", accessor: "title" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Start Date", accessor: "start", className: "hidden md:table-cell" },
    { header: "End Date", accessor: "end", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3 font-semibold text-gray-800">{item.title}</td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "All Classes"}</td>
      <td className="hidden md:table-cell text-gray-600">
        {item.start_time ? new Date(item.start_time).toLocaleDateString() : "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600">
        {item.end_time ? new Date(item.end_time).toLocaleDateString() : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="event" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="event" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Events</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search events..." />
          {(role === "admin" || role === "teacher") && <FormModal table="event" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No events found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

// ───────────────────────────────────────────────
// ANNOUNCEMENTS
// ───────────────────────────────────────────────
export const AnnouncementsPage: React.FC = () => {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("announcements", "announcements", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Title", accessor: "title" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 even:bg-slate-50 text-xs hover:bg-purple-50 transition">
      <td className="py-3">
        <p className="font-semibold text-gray-800">{item.title}</p>
        <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">{item.description}</p>
      </td>
      <td className="hidden md:table-cell text-gray-600">{item.class_name || "All"}</td>
      <td className="hidden md:table-cell text-gray-600">{item.date}</td>
      <td>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="announcement" type="update" data={item} onSuccess={fetchData} />
              {role === "admin" && <FormModal table="announcement" type="delete" id={item.id} onSuccess={fetchData} />}
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800">All Announcements</h1>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search announcements..." />
          {(role === "admin" || role === "teacher") && <FormModal table="announcement" type="create" onSuccess={fetchData} />}
        </div>
      </div>
      <Table columns={cols} renderRow={renderRow} data={data} loading={loading} error={error} onRetry={fetchData} emptyMessage="No announcements found" />
      <Pagination page={page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
    </div>
  );
};

export default SubjectsPage;
