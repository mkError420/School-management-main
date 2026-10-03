import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  GraduationCap,
  LayoutGrid,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const DAY_INDEXES: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const SCHOOL_DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"] as const;
const DAY_LABELS: Record<string, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

interface CalendarLesson {
  id: number;
  class_id?: string | number;
  teacher_id?: string;
  subject_id?: string | number;
  name?: string;
  title?: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
  teacher_surname?: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  lesson: CalendarLesson;
}

const extractTime = (val: string | undefined): string => {
  if (!val) return "00:00";
  const str = String(val).trim();
  const part = str.includes(" ") ? str.split(" ")[1] : str.includes("T") ? str.split("T")[1] : str;
  return part.slice(0, 5);
};

const formatTime12h = (val: string | undefined): string => {
  if (!val) return "";
  const time = extractTime(val);
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10) || 0;
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
};

const COLOR_CLASSES = [
  {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
    text: "text-sky-900 dark:text-sky-100",
    subtext: "text-sky-600 dark:text-sky-400",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    text: "text-emerald-900 dark:text-emerald-100",
    subtext: "text-emerald-600 dark:text-emerald-400",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
    text: "text-violet-900 dark:text-violet-100",
    subtext: "text-violet-600 dark:text-violet-400",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    text: "text-amber-900 dark:text-amber-100",
    subtext: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
    text: "text-indigo-900 dark:text-indigo-100",
    subtext: "text-indigo-600 dark:text-indigo-400",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
    text: "text-rose-900 dark:text-rose-100",
    subtext: "text-rose-600 dark:text-rose-400",
  },
];

const getLessonColor = (subjectName: string | undefined, id: number) => {
  const key = String(subjectName || "").toLowerCase();
  if (key.includes("math")) return COLOR_CLASSES[0];
  if (key.includes("sci") || key.includes("bio") || key.includes("chem")) return COLOR_CLASSES[1];
  if (key.includes("eng") || key.includes("lit")) return COLOR_CLASSES[2];
  if (key.includes("hist") || key.includes("geog")) return COLOR_CLASSES[3];
  if (key.includes("comp") || key.includes("it")) return COLOR_CLASSES[4];
  return COLOR_CLASSES[id % COLOR_CLASSES.length];
};

const BigCalendar: React.FC = () => {
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const [activeTab, setActiveTab] = useState<"grid" | "calendar">("grid");
  const [lessons, setLessons] = useState<CalendarLesson[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<CalendarLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getDashboard()
      .then((response) => {
        if (!active) return;
        if (!response.success) {
          setError(response.message || "Unable to load your schedule.");
          return;
        }

        const rawSchedule: CalendarLesson[] = Array.isArray(response.data?.schedule) ? response.data.schedule : [];
        setLessons(rawSchedule);

        const weekStart = moment().startOf("week").toDate();
        const calendarEvents: CalendarEvent[] = rawSchedule.flatMap((lesson) => {
          const dayIndex = DAY_INDEXES[String(lesson.day || "").toUpperCase()];
          if (dayIndex === undefined) return [];

          const startTime = extractTime(lesson.start_time);
          const endTime = extractTime(lesson.end_time);
          const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
          const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);

          const start = new Date(weekStart);
          const end = new Date(weekStart);
          start.setDate(start.getDate() + dayIndex);
          end.setDate(end.getDate() + dayIndex);
          start.setHours(startHour, startMinute, 0, 0);
          end.setHours(endHour, endMinute, 0, 0);

          return [
            {
              id: lesson.id,
              title: [lesson.subject_name || lesson.name || lesson.title, lesson.class_name].filter(Boolean).join(" · "),
              start,
              end,
              lesson,
            },
          ];
        });

        setEvents(calendarEvents);
      })
      .catch(() => {
        if (active) setError("Unable to load schedule.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const lessonsByDay = useMemo(() => {
    const map: Record<string, CalendarLesson[]> = {};
    SCHOOL_DAYS.forEach((d) => {
      map[d] = [];
    });
    lessons.forEach((l) => {
      const d = String(l.day || "").toUpperCase();
      if (map[d]) {
        map[d].push(l);
      } else {
        map[d] = [l];
      }
    });
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => extractTime(a.start_time).localeCompare(extractTime(b.start_time)));
    });
    return map;
  }, [lessons]);

  const currentDayName = moment().format("dddd").toUpperCase();

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Mini Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("grid")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeTab === "grid"
                ? "bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <LayoutGrid size={13} />
            <span>Weekly Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeTab === "calendar"
                ? "bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <CalendarIcon size={13} />
            <span>Calendar</span>
          </button>
        </div>

        <Link
          to="/class-schedule"
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition"
        >
          <span>Full Timetable</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-xs text-gray-500">Loading timetable...</div>
      ) : activeTab === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 overflow-x-auto min-h-[380px]">
          {SCHOOL_DAYS.map((day) => {
            const dayLessons = lessonsByDay[day] || [];
            const isToday = currentDayName === day;

            return (
              <div
                key={day}
                className={`flex flex-col rounded-xl border p-2.5 transition ${
                  isToday
                    ? "border-sky-300 dark:border-sky-800 bg-sky-50/20 dark:bg-sky-950/20 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                }`}
              >
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700/60 pb-1.5 mb-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {DAY_LABELS[day]?.slice(0, 3)}
                  </span>
                  {isToday ? (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Today
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">{dayLessons.length}</span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {dayLessons.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic text-center py-4">No lessons</p>
                  ) : (
                    dayLessons.map((l) => {
                      const color = getLessonColor(l.subject_name || l.name, l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => setSelectedLesson(l)}
                          className={`rounded-lg border p-2 text-left cursor-pointer transition hover:shadow-sm ${color.bg} ${color.border}`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                            <span>{formatTime12h(l.start_time)}</span>
                            <span>{formatTime12h(l.end_time)}</span>
                          </div>
                          <p className="mt-1 font-bold text-xs text-gray-900 dark:text-white truncate">
                            {l.subject_name || l.name || l.title}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {l.class_name || "Class"} · {[l.teacher_name, l.teacher_surname].filter(Boolean).join(" ")}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-[480px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={["week", "day"]}
            view={calendarView}
            style={{ height: "98%" }}
            onView={(newView) => setCalendarView(newView)}
            onSelectEvent={(event: any) => setSelectedLesson(event.lesson)}
            min={new Date(2026, 0, 1, 7, 0, 0)}
            max={new Date(2026, 0, 1, 18, 0, 0)}
            eventPropGetter={() => ({
              style: {
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                border: "1px solid #bae6fd",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
              },
            })}
          />
        </div>
      )}

      {/* Quick Lesson Detail Dialog */}
      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedLesson(null);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 text-xs font-bold">
                {selectedLesson.subject_name || selectedLesson.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {selectedLesson.name || selectedLesson.title}
            </h3>

            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-sky-600" />
                <span>
                  {DAY_LABELS[selectedLesson.day] || selectedLesson.day} · {formatTime12h(selectedLesson.start_time)} –{" "}
                  {formatTime12h(selectedLesson.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <UsersRound size={13} className="text-emerald-600" />
                <span>Class: {selectedLesson.class_name || `Class ${selectedLesson.class_id}`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap size={13} className="text-violet-600" />
                <span>
                  Teacher: {[selectedLesson.teacher_name, selectedLesson.teacher_surname].filter(Boolean).join(" ") || "Unassigned"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <Link
                to="/class-schedule"
                className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
              >
                Open Full Schedule <ExternalLink size={12} />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BigCalendar;