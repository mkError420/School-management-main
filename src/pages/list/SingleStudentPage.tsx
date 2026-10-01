import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck, Mail, MapPin, Phone, Trophy, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormModal from "@/components/FormModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface StudentDetails {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  img?: string | null;
  blood_type?: string | null;
  sex?: string | null;
  class_id?: number;
  grade_id?: number;
  class_name?: string | null;
  grade_level?: number | null;
  parent_id?: string;
  parent_name?: string | null;
  parent_surname?: string | null;
  parent_phone?: string | null;
}

interface AttendanceRecord {
  id: number | string;
  date: string;
  present: boolean | number;
  lesson_name?: string | null;
  lesson_day?: string | null;
}

interface StudentResult {
  id: number | string;
  score: number;
  exam_title?: string | null;
  assignment_title?: string | null;
  subject_name?: string | null;
}

interface StudentDetailsResponse {
  student: StudentDetails;
  attendance: AttendanceRecord[];
  results: StudentResult[];
}

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: "medium" });
};

const SingleStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [details, setDetails] = useState<StudentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!id) {
      setError("A student ID was not provided.");
      setLoading(false);
      return;
    }

    api.getById<StudentDetailsResponse>("students", id).then((response) => {
      if (!active) return;
      if (!response.success || !response.data?.student) {
        setDetails(null);
        setError(response.message || "Unable to load this student.");
        return;
      }
      setDetails({
        student: response.data.student,
        attendance: response.data.attendance || [],
        results: response.data.results || [],
      });
    }).catch((requestError: unknown) => {
      if (!active) return;
      setDetails(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to load this student.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, reload]);

  if (loading) {
    return <div className="m-4 flex min-h-64 items-center justify-center text-sm text-gray-500">Loading student details...</div>;
  }

  if (error || !details) {
    return (
      <div className="m-4 rounded-xl border border-red-200 bg-white p-6" role="alert">
        <h1 className="text-lg font-semibold text-gray-900">Student details unavailable</h1>
        <p className="mt-2 text-sm text-red-700">{error || "This student could not be found."}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setReload((value) => value + 1)} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Retry</button>
          <Link to="/list/students" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Back to students</Link>
        </div>
      </div>
    );
  }

  const { student, attendance, results } = details;
  const fullName = `${student.name} ${student.surname}`.trim();
  const attendanceCount = attendance.filter((record) => Boolean(Number(record.present))).length;
  const attendanceRate = attendance.length ? Math.round((attendanceCount / attendance.length) * 100) : null;
  const averageScore = results.length
    ? Math.round(results.reduce((total, result) => total + Number(result.score || 0), 0) / results.length)
    : null;

  return (
    <div className="m-4 mt-0 flex-1 space-y-4 pb-6">
      <Link to="/list/students" className="inline-flex items-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} aria-hidden="true" /> All students
      </Link>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {student.img ? (
              <img src={student.img} alt={fullName} className="h-20 w-20 shrink-0 rounded-full bg-gray-100 object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl font-semibold text-amber-800" aria-hidden="true">
                {student.name?.[0]}{student.surname?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-amber-700">Student profile</p>
              <h1 className="mt-1 break-words text-2xl font-semibold text-gray-900">{fullName}</h1>
              <p className="mt-1 text-sm text-gray-500">ID: {student.id} <span className="px-1 text-gray-300">·</span> @{student.username}</p>
            </div>
          </div>
          {role === "admin" && (
            <div className="flex shrink-0 items-center gap-2">
              <FormModal table="student" type="update" data={student} onSuccess={() => setReload((value) => value + 1)} />
              <FormModal table="student" type="delete" id={student.id} onSuccess={() => navigate("/list/students", { replace: true })} />
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3"><Mail size={17} className="mt-0.5 text-gray-400" /><div className="min-w-0"><p className="text-xs text-gray-500">Email</p><p className="break-words text-sm font-medium text-gray-800">{student.email || "Not provided"}</p></div></div>
          <div className="flex items-start gap-3"><Phone size={17} className="mt-0.5 text-gray-400" /><div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-800">{student.phone || "Not provided"}</p></div></div>
          <div className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 text-gray-400" /><div><p className="text-xs text-gray-500">Address</p><p className="text-sm font-medium text-gray-800">{student.address || "Not provided"}</p></div></div>
          <div className="flex items-start gap-3"><Users size={17} className="mt-0.5 text-gray-400" /><div><p className="text-xs text-gray-500">Parent / guardian</p><p className="text-sm font-medium text-gray-800">{[student.parent_name, student.parent_surname].filter(Boolean).join(" ") || "Not assigned"}</p><p className="mt-0.5 text-xs text-gray-500">{student.parent_phone || ""}</p></div></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
          <span>{student.grade_level ? `Grade ${student.grade_level}` : "Grade not assigned"}</span>
          <span>{student.class_name ? `Class ${student.class_name}` : "Class not assigned"}</span>
          <span className="capitalize">{student.sex?.toLowerCase() || "Sex not provided"}</span>
          <span>{student.blood_type ? `Blood type ${student.blood_type}` : "Blood type not provided"}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-gray-500"><CalendarCheck size={17} /> Attendance</div><p className="mt-2 text-2xl font-semibold text-gray-900">{attendanceRate === null ? "—" : `${attendanceRate}%`}</p><p className="mt-1 text-xs text-gray-500">{attendanceCount} present of {attendance.length} records</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-gray-500"><Trophy size={17} /> Average result</div><p className="mt-2 text-2xl font-semibold text-gray-900">{averageScore === null ? "—" : `${averageScore}%`}</p><p className="mt-1 text-xs text-gray-500">Across {results.length} recorded results</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-gray-500"><Users size={17} /> Class</div><p className="mt-2 text-2xl font-semibold text-gray-900">{student.class_name || "—"}</p><p className="mt-1 text-xs text-gray-500">{student.grade_level ? `Grade ${student.grade_level}` : "No grade assigned"}</p></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold text-gray-900">Attendance history</h2><span className="text-sm text-gray-500">{attendance.length} records</span></div>
          {attendance.length ? (
            <div className="mt-4 max-h-[28rem] overflow-auto">
              <table className="w-full min-w-[360px] text-left text-sm">
                <thead className="sticky top-0 bg-white"><tr className="border-b border-gray-100 text-xs uppercase text-gray-500"><th className="pb-3 pr-4">Date</th><th className="pb-3 pr-4">Lesson</th><th className="pb-3">Status</th></tr></thead>
                <tbody>{attendance.map((record) => {
                  const present = Boolean(Number(record.present));
                  return <tr key={record.id} className="border-b border-gray-50"><td className="py-3 pr-4 text-gray-600">{formatDate(record.date)}</td><td className="py-3 pr-4 text-gray-800">{record.lesson_name || "—"}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${present ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{present ? "Present" : "Absent"}</span></td></tr>;
                })}</tbody>
              </table>
            </div>
          ) : <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-500">No attendance records.</p>}
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold text-gray-900">Results</h2><span className="text-sm text-gray-500">{results.length} total</span></div>
          {results.length ? (
            <div className="mt-4 max-h-[28rem] overflow-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="sticky top-0 bg-white"><tr className="border-b border-gray-100 text-xs uppercase text-gray-500"><th className="pb-3 pr-4">Assessment</th><th className="pb-3 pr-4">Subject</th><th className="pb-3">Score</th></tr></thead>
                <tbody>{results.map((result) => <tr key={result.id} className="border-b border-gray-50"><td className="py-3 pr-4 font-medium text-gray-800">{result.exam_title || result.assignment_title || "Assessment"}</td><td className="py-3 pr-4 text-gray-600">{result.subject_name || "—"}</td><td className="py-3 font-semibold text-gray-800">{result.score}%</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-500">No results recorded.</p>}
        </section>
      </div>
    </div>
  );
};

export default SingleStudentPage;
