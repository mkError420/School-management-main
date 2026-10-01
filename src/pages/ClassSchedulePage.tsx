import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import { BookOpen, CalendarDays, Clock3, GraduationCap, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { hasAdminAccess, useAuth } from "@/context/AuthContext";
import "react-big-calendar/lib/css/react-big-calendar.css";

type ScheduleLesson = {
  id: number;
  class_id: string | number;
  teacher_id: string;
  title: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
  teacher_surname?: string;
};

type ScheduleChild = {
  id: string;
  name: string;
  surname: string;
  class_id: string | number;
  class_name?: string;
};

type ScheduleEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  subject: string;
  className: string;
  teacherName: string;
};

const localizer = momentLocalizer(moment);
const dayIndexes: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const timeOnDay = (date: Date, value: string) => {
  const timePart = String(value || "").replace("T", " ").split(" ").pop() || "00:00:00";
  const [hours = 0, minutes = 0] = timePart.split(":").map((part) => Number.parseInt(part, 10) || 0);
  return moment(date).hour(hours).minute(minutes).second(0).millisecond(0).toDate();
};

const ClassSchedulePage: React.FC = () => {
  const { role, user } = useAuth();
  const isAdmin = hasAdminAccess(role);
  const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
  const [children, setChildren] = useState<ScheduleChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const [selectedLesson, setSelectedLesson] = useState<ScheduleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await api.getDashboard();
        if (!active) return;
        if (!dashboard.success) {
          setError(dashboard.message || "Unable to load the class schedule.");
          return;
        }
        setSchedule(Array.isArray(dashboard.data?.schedule) ? dashboard.data.schedule : []);

        if (role === "parent" && user?.id) {
          const profile = await api.getById<any>("parents", user.id);
          if (!active) return;
          if (!profile.success) {
            setError(profile.message || "Unable to load your children's profiles.");
            return;
          }
          const parentChildren = Array.isArray(profile.data?.children) ? profile.data.children : [];
          setChildren(parentChildren);
          setSelectedChildId((current) => current || parentChildren[0]?.id || "");
        }
      } catch {
        if (active) setError("Unable to reach the server. Try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSchedule();
    return () => {
      active = false;
    };
  }, [role, user?.id]);

  const classOptions = useMemo(() => {
    const options = new Map<string, string>();
    schedule.forEach((lesson) => options.set(String(lesson.class_id), lesson.class_name || `Class ${lesson.class_id}`));
    return Array.from(options, ([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [schedule]);

  const teacherOptions = useMemo(() => {
    const options = new Map<string, string>();
    schedule.forEach((lesson) => options.set(lesson.teacher_id, [lesson.teacher_name, lesson.teacher_surname].filter(Boolean).join(" ") || lesson.teacher_id));
    return Array.from(options, ([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [schedule]);

  const visibleSchedule = useMemo(() => {
    let result = schedule;
    if (isAdmin && selectedClassId !== "all") result = result.filter((lesson) => String(lesson.class_id) === selectedClassId);
    if (isAdmin && selectedTeacherId !== "all") result = result.filter((lesson) => lesson.teacher_id === selectedTeacherId);
    if (role === "teacher" && selectedClassId !== "all") result = result.filter((lesson) => String(lesson.class_id) === selectedClassId);
    if (role === "parent") {
      const child = children.find((item) => item.id === selectedChildId);
      result = child ? result.filter((lesson) => String(lesson.class_id) === String(child.class_id)) : [];
    }
    return result;
  }, [children, isAdmin, role, schedule, selectedChildId, selectedClassId, selectedTeacherId]);

  const events = useMemo(() => {
    const weekStart = moment(calendarDate).startOf("week");
    return visibleSchedule.flatMap((lesson) => {
      const dayIndex = dayIndexes[String(lesson.day || "").toUpperCase()];
      if (dayIndex === undefined) return [];
      const day = weekStart.clone().add(dayIndex, "days").toDate();
      const subject = lesson.subject_name || lesson.title;
      const teacherName = [lesson.teacher_name, lesson.teacher_surname].filter(Boolean).join(" ");
      return [{
        id: lesson.id,
        title: [subject, lesson.class_name].filter(Boolean).join(" · "),
        start: timeOnDay(day, lesson.start_time),
        end: timeOnDay(day, lesson.end_time),
        subject,
        className: lesson.class_name || `Class ${lesson.class_id}`,
        teacherName,
      }];
    });
  }, [calendarDate, visibleSchedule]);

  const selectedChild = children.find((child) => child.id === selectedChildId);
  const title = role === "teacher" ? "My Teaching Schedule" : role === "student" ? "My Class Schedule" : role === "parent" ? "Child's Class Schedule" : "Class Schedule";

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-sky-700"><CalendarDays size={14} /> Academic / Timetable</p>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{isAdmin ? "Browse lessons by class or teacher." : role === "parent" ? "View the timetable linked to your child's profile." : "View lessons assigned to your profile."}</p>
        </div>
        <p className="text-sm font-medium text-gray-600">{visibleSchedule.length} lesson{visibleSchedule.length === 1 ? "" : "s"}</p>
      </header>

      <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 bg-gray-50/70 p-4">
          {isAdmin && <label className="min-w-48 flex-1 text-xs font-semibold text-gray-600">Class
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600">
              <option value="all">All classes</option>
              {classOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>}
          {(isAdmin || role === "teacher") && <label className="min-w-48 flex-1 text-xs font-semibold text-gray-600">{isAdmin ? "Teacher" : "My classes"}
            <select value={isAdmin ? selectedTeacherId : selectedClassId} onChange={(event) => isAdmin ? setSelectedTeacherId(event.target.value) : setSelectedClassId(event.target.value)} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600">
              <option value="all">{isAdmin ? "All teachers" : "All my classes"}</option>
              {(isAdmin ? teacherOptions : classOptions).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
            </select>
          </label>}
          {role === "parent" && <label className="min-w-48 flex-1 text-xs font-semibold text-gray-600">Child profile
            <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)} disabled={children.length === 0} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-800 outline-none focus:border-sky-600 disabled:bg-gray-100">
              {children.length === 0 && <option value="">No student profiles linked</option>}
              {children.map((child) => <option key={child.id} value={child.id}>{child.name} {child.surname}{child.class_name ? ` · ${child.class_name}` : ""}</option>)}
            </select>
          </label>}
          {role === "student" && <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"><GraduationCap size={16} className="text-sky-700" />Personal class timetable</div>}
          {role === "parent" && selectedChild && <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700"><UsersRound size={16} className="text-sky-700" />{selectedChild.class_name || "Linked class"}</div>}
        </div>

        {error && <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {selectedLesson && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 bg-sky-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sky-950">
            <span className="flex items-center gap-2 font-semibold"><BookOpen size={15} />{selectedLesson.subject}</span>
            <span className="flex items-center gap-2"><UsersRound size={15} />{selectedLesson.className}</span>
            <span className="flex items-center gap-2"><GraduationCap size={15} />{selectedLesson.teacherName || "Teacher not assigned"}</span>
            <span className="flex items-center gap-2"><Clock3 size={15} />{moment(selectedLesson.start).format("ddd, h:mm A")}–{moment(selectedLesson.end).format("h:mm A")}</span>
          </div>
          <button type="button" onClick={() => setSelectedLesson(null)} className="text-xs font-semibold text-sky-800 hover:underline">Dismiss</button>
        </div>}

        <div className="h-[calc(100vh-250px)] min-h-[520px] p-3 sm:p-5">
          {loading ? <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading schedule...</div> : role === "parent" && children.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-gray-500">No student profiles are linked to this parent account.</div> : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={[Views.WEEK, Views.DAY]}
              view={calendarView}
              date={calendarDate}
              onView={setCalendarView}
              onNavigate={setCalendarDate}
              onSelectEvent={(event) => setSelectedLesson(event as ScheduleEvent)}
              min={new Date(2025, 0, 1, 7, 0, 0)}
              max={new Date(2025, 0, 1, 18, 0, 0)}
              style={{ height: "100%" }}
              eventPropGetter={() => ({ style: { backgroundColor: "#d9eff8", border: "1px solid #94cfe3", color: "#123b4c", borderRadius: "5px" } })}
              messages={{ noEventsInRange: "No lessons scheduled for this period." }}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassSchedulePage;
