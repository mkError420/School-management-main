import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CalendarClock, Mail, MapPin, Phone, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormModal from "@/components/FormModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface TeacherDetails {
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
}

interface TeacherRelation {
  id: number | string;
  name: string;
  grade_level?: number | null;
}

interface TeacherLesson {
  id: number | string;
  name: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_name?: string | null;
  class_name?: string | null;
}

interface TeacherDetailsResponse {
  teacher: TeacherDetails;
  subjects: TeacherRelation[];
  classes: TeacherRelation[];
  supervised_classes: TeacherRelation[];
  lessons: TeacherLesson[];
}

const formatDateTime = (value: string) => {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const SingleTeacherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [details, setDetails] = useState<TeacherDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    if (!id) {
      setError("A teacher ID was not provided.");
      setLoading(false);
      return;
    }

    api.getById<TeacherDetailsResponse>("teachers", id).then((response) => {
      if (!active) return;
      if (!response.success || !response.data?.teacher) {
        setDetails(null);
        setError(response.message || "Unable to load this teacher.");
        return;
      }
      setDetails({
        teacher: response.data.teacher,
        subjects: response.data.subjects || [],
        classes: response.data.classes || [],
        supervised_classes: response.data.supervised_classes || [],
        lessons: response.data.lessons || [],
      });
    }).catch((requestError: unknown) => {
      if (!active) return;
      setDetails(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to load this teacher.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, reload]);

  if (loading) {
    return <div className="m-4 flex min-h-64 items-center justify-center text-sm text-gray-500">Loading teacher details...</div>;
  }

  if (error || !details) {
    return (
      <div className="m-4 rounded-xl border border-red-200 bg-white p-6" role="alert">
        <h1 className="text-lg font-semibold text-gray-900">Teacher details unavailable</h1>
        <p className="mt-2 text-sm text-red-700">{error || "This teacher could not be found."}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setReload((value) => value + 1)} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Retry</button>
          <Link to="/list/teachers" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Back to teachers</Link>
        </div>
      </div>
    );
  }

  const { teacher, subjects, classes, supervised_classes: supervisedClasses, lessons } = details;
  const fullName = `${teacher.name} ${teacher.surname}`.trim();

  return (
    <div className="m-4 mt-0 flex-1 space-y-4 pb-6">
      <Link to="/list/teachers" className="inline-flex items-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} aria-hidden="true" /> All teachers
      </Link>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {teacher.img ? (
              <img src={teacher.img} alt={fullName} className="h-20 w-20 shrink-0 rounded-full bg-gray-100 object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-100 text-2xl font-semibold text-sky-800" aria-hidden="true">
                {teacher.name?.[0]}{teacher.surname?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-sky-700">Teacher profile</p>
              <h1 className="mt-1 break-words text-2xl font-semibold text-gray-900">{fullName}</h1>
              <p className="mt-1 text-sm text-gray-500">ID: {teacher.id} <span className="px-1 text-gray-300">·</span> @{teacher.username}</p>
            </div>
          </div>
          {role === "admin" && (
            <div className="flex shrink-0 items-center gap-2">
              <FormModal table="teacher" type="update" data={teacher} onSuccess={() => setReload((value) => value + 1)} />
              <FormModal table="teacher" type="delete" id={teacher.id} onSuccess={() => navigate("/list/teachers", { replace: true })} />
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3"><Mail size={17} className="mt-0.5 text-gray-400" /><div className="min-w-0"><p className="text-xs text-gray-500">Email</p><p className="break-words text-sm font-medium text-gray-800">{teacher.email || "Not provided"}</p></div></div>
          <div className="flex items-start gap-3"><Phone size={17} className="mt-0.5 text-gray-400" /><div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-800">{teacher.phone || "Not provided"}</p></div></div>
          <div className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 text-gray-400" /><div><p className="text-xs text-gray-500">Address</p><p className="text-sm font-medium text-gray-800">{teacher.address || "Not provided"}</p></div></div>
          <div className="flex items-start gap-3"><Users size={17} className="mt-0.5 text-gray-400" /><div><p className="text-xs text-gray-500">Personal details</p><p className="text-sm font-medium capitalize text-gray-800">{[teacher.sex?.toLowerCase(), teacher.blood_type].filter(Boolean).join(" · ") || "Not provided"}</p></div></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-gray-500"><BookOpen size={17} /> Subjects</div><p className="mt-2 text-2xl font-semibold text-gray-900">{subjects.length}</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-gray-500"><Users size={17} /> Assigned classes</div><p className="mt-2 text-2xl font-semibold text-gray-900">{classes.length}</p></div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-sm text-gray-500"><CalendarClock size={17} /> Lessons</div><p className="mt-2 text-2xl font-semibold text-gray-900">{lessons.length}</p></div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Subjects</h2>
          {subjects.length ? <ul className="mt-4 flex flex-wrap gap-2">{subjects.map((subject) => <li key={subject.id} className="rounded-md bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800">{subject.name}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No subjects assigned.</p>}
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Classes</h2>
          {!classes.length && !supervisedClasses.length ? <p className="mt-3 text-sm text-gray-500">No classes assigned or supervised.</p> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-gray-100 text-xs uppercase text-gray-500"><th className="pb-2 pr-4">Class</th><th className="pb-2 pr-4">Grade</th><th className="pb-2">Assignment</th></tr></thead>
                <tbody>
                  {classes.map((item) => <tr key={`assigned-${item.id}`} className="border-b border-gray-50"><td className="py-2.5 pr-4 font-medium text-gray-800">{item.name}</td><td className="py-2.5 pr-4 text-gray-600">{item.grade_level ? `Grade ${item.grade_level}` : "—"}</td><td className="py-2.5 text-gray-600">Teacher</td></tr>)}
                  {supervisedClasses.map((item) => <tr key={`supervised-${item.id}`} className="border-b border-gray-50"><td className="py-2.5 pr-4 font-medium text-gray-800">{item.name}</td><td className="py-2.5 pr-4 text-gray-600">{item.grade_level ? `Grade ${item.grade_level}` : "—"}</td><td className="py-2.5 text-gray-600">Supervisor</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-base font-semibold text-gray-900">Lesson schedule</h2><p className="mt-1 text-sm text-gray-500">Lessons assigned to this teacher</p></div>
          <span className="shrink-0 text-sm text-gray-500">{lessons.length} total</span>
        </div>
        {lessons.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-gray-100 text-xs uppercase text-gray-500"><th className="pb-3 pr-4">Lesson</th><th className="pb-3 pr-4">Subject</th><th className="pb-3 pr-4">Class</th><th className="pb-3 pr-4">Day</th><th className="pb-3">Time</th></tr></thead>
              <tbody>{lessons.map((lesson) => <tr key={lesson.id} className="border-b border-gray-50"><td className="py-3 pr-4 font-medium text-gray-800">{lesson.name}</td><td className="py-3 pr-4 text-gray-600">{lesson.subject_name || "—"}</td><td className="py-3 pr-4 text-gray-600">{lesson.class_name || "—"}</td><td className="py-3 pr-4 capitalize text-gray-600">{lesson.day?.toLowerCase() || "—"}</td><td className="py-3 text-gray-600">{formatDateTime(lesson.start_time)} – {formatDateTime(lesson.end_time)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-500">No lessons assigned.</p>}
      </section>
    </div>
  );
};

export default SingleTeacherPage;
