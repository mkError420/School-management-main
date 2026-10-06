import React, { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import { useAccessRole } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";
import { api } from "@/lib/api";
import AttendanceSection from "@/components/attendance/AttendanceSection";

// ───────────────────────────────────────────────
// SUBJECTS
// ───────────────────────────────────────────────
export const SubjectsPage: React.FC = () => {
  const role = useAccessRole();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Subjects</h1>
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
  const role = useAccessRole();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.capacity}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">Grade {item.grade_level || item.grade_id}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Classes</h1>
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
  const role = useAccessRole();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600 capitalize">{item.day?.toLowerCase()}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.subject_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.class_name || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Lessons</h1>
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
const RoutineBadge: React.FC<{
  examId: number | string;
  mime?: string;
  label?: string;
}> = ({ examId, mime, label }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { blob, filename, mime: fetchedMime } = await api.downloadExamAttachment(examId);
      const effectiveMime = fetchedMime || mime || "application/pdf";
      const fileBlob = blob.type ? blob : new Blob([blob], { type: effectiveMime });
      const objectUrl = URL.createObjectURL(fileBlob);

      const isViewable = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"].includes(effectiveMime);
      if (isViewable) {
        const opened = window.open(objectUrl, "_blank");
        if (!opened) {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = filename || label || "exam_routine.pdf";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename || label || "exam_routine";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      // Fallback: direct navigation with token query param
      const token = api.getToken();
      const directUrl = `/backend/api/exams?action=attachment&id=${encodeURIComponent(String(examId))}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      window.open(directUrl, "_blank");
    } finally {
      setLoading(false);
    }
  };

  const isPdf = mime === "application/pdf" || (!mime && (!label || label.toLowerCase().endsWith(".pdf")));

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={label ? `Open: ${label}` : "Open routine document"}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
        bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:scale-95
        dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60
        transition-all cursor-pointer shadow-xs disabled:opacity-50"
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : isPdf ? (
        <svg className="h-3.5 w-3.5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5zM9 13h2v5H9zm4-3h2v8h-2zm-8 1h2v4H5z"/>
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-sky-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9l4-4 4 4 4-6 4 6"/>
        </svg>
      )}
      <span>{loading ? "Opening..." : "Routine"}</span>
    </button>
  );
};

export const ExamsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("exams", "exams", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Exam Title", accessor: "title" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
    { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
    { header: "Marks", accessor: "marks", className: "hidden md:table-cell" },
    { header: "Routine", accessor: "routine" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">
        {item.title}
        {item.description && (
          <p className="text-xs font-normal text-gray-400 truncate max-w-[180px]">{item.description}</p>
        )}
      </td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.class_name || "—"}</td>
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
        {item.teacher_name ? `${item.teacher_name} ${item.teacher_surname}` : "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
        {item.start_time ? new Date(item.start_time).toLocaleDateString() : "—"}
      </td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
        {item.total_marks ? `${item.total_marks} pts` : "—"}
      </td>
      {/* Routine attachment badge — authenticated fetch to carry JWT token */}
      <td>
        {item.attachment_url ? (
          <RoutineBadge examId={item.id} mime={item.attachment_mime_type} label={item.attachment_original_name} />
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormModal table="exam" type="update" data={item} onSuccess={fetchData} />
              <FormModal table="exam" type="delete" id={item.id} onSuccess={fetchData} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Exams</h1>
          <p className="hidden md:block text-xs text-gray-400 mt-0.5">
            {role === 'admin' ? 'Manage exams and upload exam routines (PDF/image)' :
             role === 'teacher' ? 'Your class exams and routine documents' :
             'Upcoming exams and downloadable routine schedules'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <TableSearch value={search} onChange={setSearch} placeholder="Search exams..." />
          {role === "admin" && <FormModal table="exam" type="create" onSuccess={fetchData} />}
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
const AssignmentAttachmentBadge: React.FC<{
  assignmentId: number | string;
  mime?: string;
  label?: string;
}> = ({ assignmentId, mime, label }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { blob, filename, mime: fetchedMime } = await api.downloadAssignmentAttachment(assignmentId);
      const effectiveMime = fetchedMime || mime || "application/octet-stream";
      const fileBlob = blob.type ? blob : new Blob([blob], { type: effectiveMime });
      const objectUrl = URL.createObjectURL(fileBlob);

      const isViewable = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"].includes(effectiveMime);
      if (isViewable) {
        const opened = window.open(objectUrl, "_blank");
        if (!opened) {
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = filename || label || "assignment";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename || label || "assignment_document";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch {
      // Fallback: direct navigation with token query param
      const token = api.getToken();
      const directUrl = `/backend/api/assignments?action=attachment&id=${encodeURIComponent(String(assignmentId))}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      window.open(directUrl, "_blank");
    } finally {
      setLoading(false);
    }
  };

  const isPdf = mime === "application/pdf" || (!mime && Boolean(label?.toLowerCase().endsWith(".pdf")));
  const isImage = (mime && mime.startsWith("image/")) || (!mime && Boolean(label?.match(/\.(jpg|jpeg|png|webp|gif)$/i)));
  const isWord = (mime && (mime.includes("word") || mime.includes("document"))) || (!mime && Boolean(label?.match(/\.(doc|docx)$/i)));

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={label ? `Open / Download: ${label}` : "Open assignment file"}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
        bg-sky-100 text-sky-800 hover:bg-sky-200 active:scale-95
        dark:bg-sky-900/40 dark:text-sky-300 dark:hover:bg-sky-900/60
        transition-all cursor-pointer shadow-xs disabled:opacity-50"
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : isPdf ? (
        <svg className="h-3.5 w-3.5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5zM9 13h2v5H9zm4-3h2v8h-2zm-8 1h2v4H5z"/>
        </svg>
      ) : isImage ? (
        <svg className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ) : isWord ? (
        <svg className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-sky-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      )}
      <span className="truncate max-w-[120px]">{loading ? "Opening..." : (label || "Attachment")}</span>
    </button>
  );
};

export const AssignmentsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("assignments", "assignments", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Title", accessor: "title" },
    { header: "Attachment", accessor: "attachment" },
    { header: "Subject", accessor: "subject", className: "hidden md:table-cell" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden md:table-cell" },
    { header: "Due Date", accessor: "due", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">{item.title}</td>
      <td className="py-3">
        {item.assignment_attachment || item.attachment_url ? (
          <AssignmentAttachmentBadge
            assignmentId={item.id}
            mime={item.attachment_mime_type}
            label={item.attachment_original_name}
          />
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.subject_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.class_name || "—"}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
        {item.teacher_name ? `${item.teacher_name} ${item.teacher_surname}` : "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Assignments</h1>
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
  const role = useAccessRole();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">
        {item.student_name} {item.student_surname}
      </td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.subject_name || "—"}</td>
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
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Results</h1>
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
  return <AttendanceSection />;
};

// ───────────────────────────────────────────────
// EVENTS
// ───────────────────────────────────────────────
export const EventsPage: React.FC = () => {
  const role = useAccessRole();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">{item.title}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.class_name || "All Classes"}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
        {item.start_time ? new Date(item.start_time).toLocaleDateString() : "—"}
      </td>
      <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Events</h1>
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
  const role = useAccessRole();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition dark:text-gray-200">
      <td className="py-3">
        <p className="font-semibold text-gray-800 dark:text-gray-100">{item.title}</p>
        <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 line-clamp-1">{item.description}</p>
      </td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.class_name || "All"}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.date}</td>
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h1 className="hidden md:block text-lg font-semibold text-gray-800 dark:text-gray-100">All Announcements</h1>
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

