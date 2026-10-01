import React, { useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views, type View } from "react-big-calendar";
import moment from "moment";
import { CalendarDays, GraduationCap, Layers3, Mail, MapPin, Phone, Users } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Link, useNavigate } from "react-router-dom";
import FormModal from "@/components/FormModal";
import { useAccessRole } from "@/context/AuthContext";

const localizer = momentLocalizer(moment);

export interface TeacherProfileDetails {
  teacher: {
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
    created_at?: string;
  };
  subjects: { id: number | string; name: string }[];
  classes: { id: number | string; name: string; grade_level?: number | null }[];
  supervised_classes: { id: number | string; name: string; grade_level?: number | null }[];
  lessons: {
    id: number | string;
    name: string;
    day: string;
    start_time: string;
    end_time: string;
    subject_name?: string | null;
    class_name?: string | null;
  }[];
  exams: {
    id: number | string;
    title: string;
    start_time: string;
    lesson_name?: string | null;
    subject_name?: string | null;
    class_name?: string | null;
  }[];
  assignments: {
    id: number | string;
    title: string;
    due_date: string;
    lesson_name?: string | null;
    subject_name?: string | null;
    class_name?: string | null;
  }[];
  students: {
    id: string;
    name: string;
    surname: string;
    email?: string | null;
    img?: string | null;
    class_name?: string | null;
    grade_level?: number | null;
  }[];
  results: { id: number | string; score: number }[];
  attendance: { total: number; present: number };
  announcements: {
    id: number | string;
    title: string;
    description?: string | null;
    date: string;
    class_name?: string | null;
  }[];
}

interface TeacherProfileViewProps {
  details: TeacherProfileDetails;
  onReload: () => void;
}

interface CalendarLesson {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  resource: TeacherProfileDetails["lessons"][number];
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

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ details, onReload }) => {
  const role = useAccessRole();
  const navigate = useNavigate();
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const teacher = details.teacher;
  const fullName = `${teacher.name} ${teacher.surname}`.trim();
  const allClasses = useMemo(() => Array.from(new Map([...details.classes, ...details.supervised_classes].map((item) => [String(item.id), item])).values()), [details.classes, details.supervised_classes]);
  const averageScore = details.results.length
    ? Math.min(100, Math.max(0, details.results.reduce((sum, result) => sum + Number(result.score || 0), 0) / details.results.length))
    : null;
  const attendanceRate = details.attendance.total
    ? Math.round((Number(details.attendance.present) / Number(details.attendance.total)) * 100)
    : null;
  const calendarEvents: CalendarLesson[] = useMemo(() => details.lessons.map((lesson) => ({
    id: lesson.id,
    title: [lesson.name, lesson.subject_name, lesson.class_name].filter(Boolean).join(" · "),
    start: makeCalendarDate(lesson.day, lesson.start_time),
    end: makeCalendarDate(lesson.day, lesson.end_time),
    resource: lesson,
  })), [details.lessons]);

  const shortcuts = [
    { href: "#teacher-classes", label: "Teacher's Classes", style: "bg-sky-100 text-sky-900 hover:bg-sky-200" },
    { href: "#teacher-students", label: "Teacher's Students", style: "bg-rose-100 text-rose-900 hover:bg-rose-200" },
    { href: "#teacher-lessons", label: "Teacher's Lessons", style: "bg-violet-100 text-violet-900 hover:bg-violet-200" },
    { href: "#teacher-exams", label: "Teacher's Exams", style: "bg-amber-100 text-amber-900 hover:bg-amber-200" },
    { href: "#teacher-assignments", label: "Teacher's Assignments", style: "bg-pink-100 text-pink-900 hover:bg-pink-200" },
  ];

  return (
    <div className="m-4 mt-0 flex-1 space-y-3 pb-8">
      <div className="flex items-center justify-between gap-3 py-2">
        <Link to="/list/teachers" className="text-sm font-medium text-gray-600 hover:text-gray-900">← All teachers</Link>
        {role === "admin" && <div className="flex items-center gap-2"><FormModal table="teacher" type="update" data={teacher} onSuccess={onReload} /><FormModal table="teacher" type="delete" id={teacher.id} onSuccess={() => navigate("/list/teachers", { replace: true })} /></div>}
      </div>

      <div className="grid items-stretch gap-3 xl:grid-cols-3">
        <section className="flex min-w-0 items-center gap-4 rounded-md bg-sky-200 p-4 text-slate-900 xl:col-span-1">
          {teacher.img ? <img src={teacher.img} alt={fullName} className="h-24 w-24 shrink-0 rounded-full border-2 border-white/70 object-cover" /> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/70 text-2xl font-semibold text-sky-900">{teacher.name[0]}{teacher.surname[0]}</div>}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/70">Teacher profile</p>
            <h1 className="mt-1 break-words text-lg font-bold">{fullName}</h1>
            <p className="mt-0.5 truncate text-xs text-slate-700">ID: {teacher.id} · @{teacher.username}</p>
            <div className="mt-3 grid gap-1 text-xs text-slate-800 sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-1.5"><Mail size={12} /> <span className="truncate">{teacher.email || "Email not provided"}</span></span>
              <span className="flex min-w-0 items-center gap-1.5"><Phone size={12} /> <span className="truncate">{teacher.phone || "Phone not provided"}</span></span>
              <span className="flex min-w-0 items-center gap-1.5"><MapPin size={12} /> <span className="truncate">{teacher.address || "Address not provided"}</span></span>
              <span className="flex min-w-0 items-center gap-1.5"><GraduationCap size={12} /> <span className="truncate capitalize">{[teacher.sex?.toLowerCase(), teacher.blood_type].filter(Boolean).join(" · ") || "Details not provided"}</span></span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:col-span-1">
          <StatCard icon={<CalendarDays size={17} />} value={attendanceRate === null ? "—" : `${attendanceRate}%`} label="Attendance" tint="bg-sky-50 text-sky-700" />
          <StatCard icon={<Layers3 size={17} />} value={details.subjects.length} label="Subjects" tint="bg-violet-50 text-violet-700" />
          <StatCard icon={<CalendarDays size={17} />} value={details.lessons.length} label="Lessons" tint="bg-amber-50 text-amber-700" />
          <StatCard icon={<Users size={17} />} value={allClasses.length} label="Classes" tint="bg-rose-50 text-rose-700" />
        </section>

        <section className="rounded-md border border-gray-100 bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-base font-semibold text-gray-900">Shortcuts</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {shortcuts.map((shortcut) => <a key={shortcut.href} href={shortcut.href} className={`rounded-md px-3 py-2 text-xs font-medium transition ${shortcut.style}`}>{shortcut.label}</a>)}
          </div>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section id="teacher-lessons" className="min-w-0 rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-900">Teacher's Schedule</h2>
            <span className="text-xs text-gray-500">{details.lessons.length} lessons</span>
          </div>
          {calendarEvents.length ? (
            <div className="h-[480px] min-w-0 text-sm">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
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
                tooltipAccessor={(event) => `${event.resource.name} · ${event.resource.subject_name || "Subject"} · ${event.resource.class_name || "Class"}`}
                eventPropGetter={() => ({ style: { backgroundColor: "#0e7490", border: "0", borderRadius: "4px", color: "#fff", padding: "3px 5px" } })}
              />
            </div>
          ) : <p className="rounded-md bg-gray-50 p-5 text-sm text-gray-500">No lessons are assigned to this teacher yet.</p>}
        </section>

        <div className="flex min-w-0 flex-col gap-3">
          <section className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Performance</h2>
            {averageScore === null ? <p className="py-12 text-center text-sm text-gray-500">No assessment results yet.</p> : (
              <div className="relative h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: averageScore }, { value: Math.max(0, 100 - averageScore) }]} dataKey="value" startAngle={180} endAngle={0} cx="50%" cy="78%" innerRadius="58%" outerRadius="88%" paddingAngle={1}>
                      <Cell fill="#c084fc" />
                      <Cell fill="#fca5a5" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 top-[46%] text-center">
                  <p className="text-2xl font-bold text-gray-800">{(averageScore / 10).toFixed(1)}</p>
                  <p className="text-xs text-gray-500">of 10 max · {details.results.length} results</p>
                </div>
                <p className="absolute inset-x-0 bottom-0 text-center text-xs font-medium text-gray-600">Student average assessment score</p>
              </div>
            )}
          </section>

          <section className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold text-gray-900">Announcements</h2><Link to="/list/announcements" className="text-xs font-medium text-sky-700 hover:underline">View all</Link></div>
            <div className="mt-3 space-y-2">
              {details.announcements.length ? details.announcements.map((item, index) => <article key={item.id} className={`rounded-md p-3 ${["bg-violet-50", "bg-amber-50", "bg-sky-50"][index % 3]}`}>
                <div className="flex items-start justify-between gap-2"><h3 className="min-w-0 text-sm font-medium text-gray-900">{item.title}</h3><time className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-gray-500">{formatDate(item.date)}</time></div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">{item.description || ""}</p>
                <p className="mt-1 text-[10px] text-gray-500">{item.class_name || "All classes"}</p>
              </article>) : <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-500">No announcements for this teacher's classes.</p>}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section id="teacher-classes" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Classes</h2><span className="text-xs text-gray-500">{allClasses.length}</span></div>
          {allClasses.length ? <div className="mt-3 divide-y divide-gray-100">{allClasses.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="font-medium text-gray-800">{item.name}</span><span className="text-xs text-gray-500">{item.grade_level ? `Grade ${item.grade_level}` : "Grade not set"}{details.supervised_classes.some((entry) => String(entry.id) === String(item.id)) ? " · Supervisor" : " · Teacher"}</span></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No classes assigned.</p>}
        </section>

        <section id="teacher-students" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Students</h2><span className="text-xs text-gray-500">{details.students.length}</span></div>
          {details.students.length ? <div className="mt-3 max-h-72 divide-y divide-gray-100 overflow-auto">{details.students.map((student) => <Link key={student.id} to={`/list/students/${student.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50"><span className="font-medium text-gray-800">{student.name} {student.surname}</span><span className="text-xs text-gray-500">{student.class_name || "No class"}</span></Link>)}</div> : <p className="mt-3 text-sm text-gray-500">No students in this teacher's classes.</p>}
        </section>

        <section id="teacher-exams" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Exams</h2><span className="text-xs text-gray-500">{details.exams.length}</span></div>
          {details.exams.length ? <div className="mt-3 divide-y divide-gray-100">{details.exams.map((exam) => <div key={exam.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{exam.title}</p><p className="truncate text-xs text-gray-500">{exam.subject_name || exam.lesson_name} · {exam.class_name || "Class not set"}</p></div><time className="shrink-0 text-xs text-gray-500">{formatDate(exam.start_time)}</time></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No exams scheduled.</p>}
        </section>

        <section id="teacher-assignments" className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900">Assignments</h2><span className="text-xs text-gray-500">{details.assignments.length}</span></div>
          {details.assignments.length ? <div className="mt-3 divide-y divide-gray-100">{details.assignments.map((assignment) => <div key={assignment.id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-800">{assignment.title}</p><p className="truncate text-xs text-gray-500">{assignment.subject_name || assignment.lesson_name} · {assignment.class_name || "Class not set"}</p></div><time className="shrink-0 text-xs text-gray-500">Due {formatDate(assignment.due_date)}</time></div>)}</div> : <p className="mt-3 text-sm text-gray-500">No assignments.</p>}
        </section>
      </div>
    </div>
  );
};

export default TeacherProfileView;