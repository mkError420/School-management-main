import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Image from "@/components/Image";
import { useAccessRole } from "@/context/AuthContext";
import { useApiList } from "@/lib/useApiList";
import { api } from "@/lib/api";
import AttendanceSection from "@/components/attendance/AttendanceSection";
import { useSearchParamState } from "@/lib/useSearchParamState";

// ───────────────────────────────────────────────
// SUBJECTS
// ───────────────────────────────────────────────
export const SubjectsPage: React.FC = () => {
  const role = useAccessRole();
  const [search, setSearch] = useSearchParamState();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-sm hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
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
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Subjects</h1>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
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
  const [search, setSearch] = useSearchParamState();
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("classes", "classes", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Class Name", accessor: "name" },
    { header: "Capacity", accessor: "capacity", className: "hidden md:table-cell" },
    { header: "Supervisor", accessor: "supervisor", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-sm hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">{item.name}</td>
      <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">{item.capacity}</td>
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
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Classes</h1>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
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
  const [search, setSearch] = useSearchParamState();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
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
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Lessons</h1>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
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
  const [search, setSearch] = useSearchParamState();
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("exams", "exams", page, 10, search);
  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Exam Title", accessor: "title" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Teacher", accessor: "teacher", className: "hidden lg:table-cell" },
    { header: "Date", accessor: "date", className: "hidden lg:table-cell" },
    { header: "Status", accessor: "status" },
    { header: "Marks", accessor: "marks", className: "hidden md:table-cell" },
    { header: "Routine", accessor: "routine" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => {
    const isExpired = (() => {
      // 1. Check end_time if provided
      if (item?.end_time) {
        const end = moment(item.end_time);
        if (end.isValid()) {
          return end.isBefore(moment());
        }
      }

      // 2. Check start_time
      if (item?.start_time) {
        const startStr = String(item.start_time).trim();
        const start = moment(startStr);
        if (start.isValid()) {
          // If pure date (YYYY-MM-DD), expire at end of that day
          if (/^\d{4}-\d{2}-\d{2}$/.test(startStr)) {
            return start.endOf("day").isBefore(moment());
          }
          return start.isBefore(moment());
        }
      }

      // 3. Fallback to date field
      if (item?.date) {
        const dateStr = String(item.date).trim();
        const d = moment(dateStr);
        if (d.isValid()) {
          return d.endOf("day").isBefore(moment());
        }
      }

      return false;
    })();

    return (
      <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
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
          {item.start_time
            ? new Date(item.start_time).toLocaleDateString()
            : item.date
            ? new Date(item.date).toLocaleDateString()
            : "—"}
        </td>
        <td>
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Upcoming
            </span>
          )}
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
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Exams</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {role === 'admin' ? 'Manage exams and upload exam routines (PDF/image)' :
             role === 'teacher' ? 'Your class exams and routine documents' :
             'Upcoming exams and downloadable routine schedules'}
          </p>
        </div>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
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
  const [search, setSearch] = useSearchParamState();
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
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
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
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Assignments</h1>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
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
export { default as ResultsPage } from "./ResultsPage";

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
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const { data, loading, error, pagination, refresh: fetchData } = useApiList<any>("events", "events", page, 10, search);

  useEffect(() => {
    const q = searchParams.get("search") || "";
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { if (page > pagination.pages) setPage(pagination.pages); }, [page, pagination.pages]);

  const cols = [
    { header: "Title", accessor: "title" },
    { header: "Document", accessor: "document" },
    { header: "Class", accessor: "class", className: "hidden md:table-cell" },
    { header: "Start Date", accessor: "start", className: "hidden md:table-cell" },
    { header: "End Date", accessor: "end", className: "hidden lg:table-cell" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-700/30 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-700/40 text-xs hover:bg-primary-50 dark:hover:bg-[#1a2332] transition dark:text-gray-200">
      <td className="py-3 font-semibold text-gray-800 dark:text-gray-100">{item.title}</td>
      <td className="py-3">
        {item.attachment_url || item.document_attachment ? (
          <a
            href={`${item.attachment_url || `/backend/api/events?action=attachment&id=${item.id}`}${api.getToken() ? `&token=${encodeURIComponent(api.getToken()!)}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#707E94]/15 hover:bg-[#707E94]/25 text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7] transition"
          >
            {item.attachment_mime_type === "application/pdf" ? (
              <svg className="h-3.5 w-3.5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5zM9 13h2v5H9zm4-3h2v8h-2zm-8 1h2v4H5z"/>
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5 text-[#707E94] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
            <span className="truncate max-w-[120px]">{item.attachment_original_name || "Document"}</span>
          </a>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
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
    <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl flex-1 m-2 sm:m-4 mt-0 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">All Events</h1>
        <div className="flex gap-2.5 items-center w-full sm:w-auto justify-between sm:justify-end">
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
export { default as AnnouncementsPage } from "./AnnouncementsPage";

export default SubjectsPage;

