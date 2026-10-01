import React, { useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views, type View } from "react-big-calendar";
import moment from "moment";
import { CalendarDays, GraduationCap, Mail, MapPin, Phone, Trophy, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Link, useNavigate } from "react-router-dom";
import FormModal from "@/components/FormModal";
import { useAccessRole } from "@/context/AuthContext";

const localizer = momentLocalizer(moment);

export interface StudentProfileDetails {
  student: {
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
    class_id?: number | null;
    grade_id?: number | null;
    class_name?: string | null;
    grade_level?: number | null;
    parent_id?: string | null;
    parent_name?: string | null;
    parent_surname?: string | null;
    parent_phone?: string | null;
  };
  attendance: {
    id: number | string;
    date: string;
    present: boolean | number | string;
    lesson_name?: string | null;
    lesson_day?: string | null;
  }[];
  results: {
    id: number | string;
    score: number;
    exam_title?: string | null;
    assignment_title?: string | null;
    subject_name?: string | null;
    date?: string | null;
  }[];
  lessons: {
    id: number | string;
    name: string;
    day: string;
    start_time: string;
    end_time: string;
    subject_name?: string | null;
    teacher_id?: string | null;
    teacher_name?: string | null;
    teacher_surname?: string | null;
  }[];
  teachers: {
    id: string;
    name: string;
    surname: string;
    email?: string | null;
    img?: string | null;
    subject_name?: string | null;
  }[];
  exams: { id: number | string; title: string; start_time: string; lesson_name?: string | null; subject_name?: string | null }[];
  assignments: { id: number | string; title: string; due_date: string; lesson_name?: string | null; subject_name?: string | null }[];
  announcements: { id: number | string; title: string; description?: string | null; date: string; class_name?: string | null }[];
}

interface StudentProfileViewProps {
  details: StudentProfileDetails;
  onReload: () => void;
}

interface ScheduleEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  resource: StudentProfileDetails["lessons"][number];
}

const dayIndex: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const makeCalendarDate = (day: string, value: string) => {
  const source = new Date(value.replace(" ", "T"));
  const date = moment().startOf("week").day(dayIndex[day.toUpperCase()] ?? 1).toDate();
  if (!Number.isNaN(source.getTime())) date.setHours(source.getHours(), source.getMinutes(), 0, 0);
  return date;
};

const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; tint: string }> = ({ icon, value, label, tint }) => (
  <div className="flex min-h-[76px] items-center gap-3 rounded-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tint}`}>{icon}</span>
    <div className="min-w-0"><p className="text-xl font-semibold leading-tight text-gray-900">{value}</p><p className="mt-0.5 text-xs text-gray-500">{label}</p></div>
  </div>
);

const StudentProfileView: React.FC<StudentProfileViewProps> = ({ details, onReload }) => {
  const role = useAccessRole();
  const navigate = useNavigate();
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const student = details.student;
  const fullName = `${student.name} ${student.surname}`.trim();
  const presentCount = details.attendance.filter((record) => Boolean(Number(record.present))).length;
  const attendanceRate = details.attendance.length ? Math.round((presentCount / details.attendance.length) * 100) : null;
  const averageScore = details.results.length
    ? Math.min(100, Math.max(0, details.results.reduce((sum, result) => sum + Number(result.score || 0), 0) / details.results.length))
    : null;
  const scheduleEvents: ScheduleEvent[] = useMemo(() => details.lessons.map((lesson) => ({
    id: lesson.id,
    title: [lesson.name, lesson.subject_name, lesson.teacher_name].filter(Boolean).join(" · "),
    start: makeCalendarDate(lesson.day, lesson.start_time),
    end: makeCalendarDate(lesson.day, lesson.end_time),
    resource: lesson,
  })), [details.lessons]);

  const shortcuts = [
    { href: "#student-lessons", label: "Student's Lessons", style: "bg-sky-100 text-sky-900 hover:bg-sky-200" },
    { href: "#student-teachers", label: "Student's Teachers", style: "bg-rose-100 text-rose-900 hover:bg-rose-200" },
    { href: "#student-exams", label: "Student's Exams", style: "bg-amber-100 text-amber-900 hover:bg-amber-200" },
    { href: "#student-assignments", label: "Student's Assignments", style: "bg-pink-100 text-pink-900 hover:bg-pink-200" },
    { href: "#student-results", label: "Student's Results", style: "bg-violet-100 text-violet-900 hover:bg-violet-200" },
  ];

  return (
    <div className="m-4 mt-0 flex-1 space-y-3 pb-8">
      <div className="flex items-center justify-between gap-3 py-2">
        <Link to="/list/students" className="text-sm font-medium text-gray-600 hover:text-gray-900">← All students</Link>
        {role === "admin" && <div className="flex items-center gap-2"><FormModal table="student" type="update" data={student} onSuccess={onReload} /><FormModal table="student" type="delete" id={student.id} onSuccess={() => navigate("/list/students", { replace: true })} /></div>}
      </div>

      <div className="grid items-stretch gap-3 xl:grid-cols-3">
        <section className="flex min-w-0 items-center gap-4 rounded-md bg-sky-200 p-4 text-slate-900">
          {student.img ? <img src={student.img} alt={fullName} className="h-24 w-24 shrink-0 rounded-full border-2 border-white/70 object-cover" /> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/70 text-2xl font-semibold text-sky-900">{student.name[0]}{student.surname[0]}</div>}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/70">Student profile</p>
            <h1 className="mt-1 break-words text-lg font-bold">{fullName}</h1>
            <p className="mt-0.5 truncate text-xs text-slate-700">ID: {student.id} · @{student.username}</p>
            <div className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-1.5"><Mail size={12} /><span className="truncate">{student.email || "Email not provided"}</span></span>
              <span className="flex min-w-0 items-center gap-1.5"><Phone size={12} /><span className="truncate">{student.phone || "Phone not provided"}</span></span>
              <span className="flex min-w-0 items-center gap-1.5"><MapPin size={12} /><span className="truncate">{student.address || "Address not provided"}</span></span>
              <span className="flex min-w-0 items-center gap-1.5"><Users size={12} /><span className="truncate">{[student.parent_name, student.parent_surname].filter(Boolean).join(" ") || "No guardian assigned"}</span></span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={<CalendarDays size={17} />} value={attendanceRate === null ? "—" : `${attendanceRate}%`} label="Attendance" tint="bg-sky-50 text-sky-700" />
          <StatCard icon={<GraduationCap size={17} />} value={student.grade_level ? `${student.grade_level}th` : "—"} label="Grade" tint="bg-violet-50 text-violet-700" />
          <StatCard icon={<CalendarDays size={17} />} value={details.lessons.length} label="Lessons" tint="bg-amber-50 text-amber-700" />
          <StatCard icon={<Users size={17} />} value={student.class_name || "—"} label="Class" tint="bg-rose-50 text-rose-700" />
        </section>

        <section className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Shortcuts</h2>
          <div className="mt-3 flex flex-wrap gap-2">{shortcuts.map((shortcut) => <a key={shortcut.href} href={shortcut.href} className={`rounded-md px-3 py-2 text-xs font-medium transition ${shortcut.style}`}>{shortcut.label}</a>)}</div>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section id="student-lessons" className="min-w-0 rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-gray-900">Student's Schedule</h2><span className="text-xs text-gray-500">{details.lessons.length} lessons</span></div>
          {scheduleEvents.length ? <div className="h-[480px] min-w-0 text-sm"><Calendar
            localizer={localizer}
            events={scheduleEvents}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            views={[Views.WEEK, Views.DAY]}
            view={calendarView}
            onView={setCalendarView}
            min={new Date(2020, 0, 1, 7, 0)}
            max={new Date(2020, 0, 1, 19, 0)}
            step={30}
            timeslots={2}
            tooltipAccessor={(event) => `${event.resource.name} · ${event.resource.subject_name || "Subject"} · ${event.resource.teacher_name || "Teacher"} ${event.resource.teacher_surname || ""}`}
            eventPropGetter={() => ({ style: { backgroundColor: "#0e7490", border: "0", borderRadius: "4px", color: "#fff", padding: "3px 5px" } })}
          /></div> : <p className="rounded-md bg-gray-50 p-5 text-sm text-gray-500">No lessons are scheduled for this class.</p>}
        </section>

        <div className="flex min-w-0 flex-col gap-3">
          <section className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Performance</h2>
            {averageScore === null ? <p className="py-12 text-center text-sm text-gray-500">No assessment results yet.</p> : <div className="relative h-52">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value: averageScore }, { value: Math.max(0, 100 - averageScore) }]} dataKey="value" startAngle={180} endAngle={0} cx="50%" cy="78%" innerRadius="58%" outerRadius="88%" paddingAngle={1}><Cell fill="#c084fc" /><Cell fill="#fca5a5" /></Pie></PieChart></ResponsiveContainer>
              <div className="pointer-events-none absolute inset-x-0 top-[46%] text-center"><p className="text-2xl font-bold text-gray-800">{(averageScore / 10).toFixed(1)}</p><p className="text-xs text-gray-500">of 10 max · {details.results.length} results</p></div>
              <p className="absolute inset-x-0 bottom-0 text-center text-xs font-medium text-gray-600">Average assessment score</p>
            </div>}
          </section>

          <section className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold text-gray-900">Announcements</h2><Link to="/list/announcements" className="text-xs font-medium text-sky-700 hover:underline">View all</Link></div>
            <div className="mt-3 space-y-2">{details.announcements.length ? details.announcements.map((item, index) => <article key={item.id} className={`rounded-md p-3 ${["bg-violet-50", "bg-amber-50", "bg-sky-50"][index % 3]}`}>
              <div className="flex items-start justify-between gap-2"><h3 className="min-w-0 text-sm font-medium text-gray-900">{item.title}</h3><time className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-gray-500">{formatDate(item.date)}</time></div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">{item.description || ""}</p>
              <p className="mt-1 text-[10px] text-gray-500">{item.class_name || "All classes"}</p>
            </article>) : <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">No announcements for this class.</p>}</div>
          </section>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section id="student-teachers" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Teachers</h2><span className="text-xs text-gray-500">{details.teachers.length}</span></div>
          {details.teachers.length ? <div className="mt-3 divide-y divide-gray-100">{details.teachers.map((teacher) => <div key={teacher.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{teacher.name} {teacher.surname}</p><p className="truncate text-xs text-gray-500">{teacher.subject_name || teacher.email || "Class teacher"}</p></div></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No teachers linked to this class yet.</p>}
        </section>

        <section id="student-exams" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Exams</h2><span className="text-xs text-gray-500">{details.exams.length}</span></div>
          {details.exams.length ? <div className="mt-3 divide-y divide-gray-100">{details.exams.map((exam) => <div key={exam.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{exam.title}</p><p className="truncate text-xs text-gray-500">{exam.subject_name || exam.lesson_name || "Class exam"}</p></div><time className="shrink-0 text-xs text-gray-500">{formatDate(exam.start_time)}</time></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No exams scheduled.</p>}
        </section>

        <section id="student-assignments" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Assignments</h2><span className="text-xs text-gray-500">{details.assignments.length}</span></div>
          {details.assignments.length ? <div className="mt-3 divide-y divide-gray-100">{details.assignments.map((assignment) => <div key={assignment.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{assignment.title}</p><p className="truncate text-xs text-gray-500">{assignment.subject_name || assignment.lesson_name || "Class assignment"}</p></div><time className="shrink-0 text-xs text-gray-500">Due {formatDate(assignment.due_date)}</time></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No assignments posted.</p>}
        </section>

        <section id="student-results" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Results</h2><span className="text-xs text-gray-500">{details.results.length}</span></div>
          {details.results.length ? <div className="mt-3 divide-y divide-gray-100">{details.results.map((result) => <div key={result.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{result.exam_title || result.assignment_title || "Assessment"}</p><p className="truncate text-xs text-gray-500">{result.subject_name || "Subject not available"}{result.date ? ` · ${formatDate(result.date)}` : ""}</p></div><span className="shrink-0 text-sm font-semibold text-gray-800">{result.score}%</span></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No results recorded.</p>}
        </section>
      </div>
    </div>
  );
};

export default StudentProfileView;