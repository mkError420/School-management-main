import React, { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  LayoutGrid,
  ListFilter,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { hasAdminAccess, useAuth } from "@/context/AuthContext";
import "react-big-calendar/lib/css/react-big-calendar.css";

export type ScheduleLesson = {
  id: number;
  class_id: string | number;
  teacher_id: string;
  subject_id: string | number;
  name?: string;
  title?: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_name?: string;
  class_name?: string;
  grade_level?: string | number;
  teacher_name?: string;
  teacher_surname?: string;
};

export type ScheduleChild = {
  id: string;
  name: string;
  surname: string;
  class_id: string | number;
  class_name?: string;
};

export type LessonDraft = {
  name: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
};

export type LessonDetailedData = {
  lesson: ScheduleLesson;
  students?: Array<{ id: string; name: string; surname: string; email?: string }>;
  attendance?: Array<{ id: number; date: string; present: boolean | number }>;
  exams?: Array<{ id: number; title: string; start_time: string; end_time: string }>;
  assignments?: Array<{ id: number; title: string; start_date: string; due_date: string }>;
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

const DAY_INDEXES: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const emptyLessonDraft: LessonDraft = {
  name: "",
  day: "MONDAY",
  start_time: "08:30",
  end_time: "09:30",
  subject_id: "",
  class_id: "",
  teacher_id: "",
};

const localizer = momentLocalizer(moment);

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

const calculateDuration = (startVal: string, endVal: string): number => {
  const [sh, sm] = extractTime(startVal).split(":").map(Number);
  const [eh, em] = extractTime(endVal).split(":").map(Number);
  const startMins = (sh || 0) * 60 + (sm || 0);
  const endMins = (eh || 0) * 60 + (em || 0);
  return Math.max(0, endMins - startMins);
};

const timeOnDay = (date: Date, value: string) => {
  const timePart = String(value || "").replace("T", " ").split(" ").pop() || "00:00:00";
  const [hours = 0, minutes = 0] = timePart.split(":").map((part) => Number.parseInt(part, 10) || 0);
  return moment(date).hour(hours).minute(minutes).second(0).millisecond(0).toDate();
};

const COLOR_PALETTES = [
  {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
    hoverBorder: "hover:border-sky-400 dark:hover:border-sky-600",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border border-sky-300 dark:border-sky-700",
    subtext: "text-sky-600 dark:text-sky-400",
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700",
    subtext: "text-emerald-600 dark:text-emerald-400",
  },
  {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    hoverBorder: "hover:border-violet-400 dark:hover:border-violet-600",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200 border border-violet-300 dark:border-violet-700",
    subtext: "text-violet-600 dark:text-violet-400",
  },
  {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-600",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700",
    subtext: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    hoverBorder: "hover:border-indigo-400 dark:hover:border-indigo-600",
    badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700",
    subtext: "text-indigo-600 dark:text-indigo-400",
  },
  {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    hoverBorder: "hover:border-rose-400 dark:hover:border-rose-600",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700",
    subtext: "text-rose-600 dark:text-rose-400",
  },
  {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
    hoverBorder: "hover:border-teal-400 dark:hover:border-teal-600",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 border border-teal-300 dark:border-teal-700",
    subtext: "text-teal-600 dark:text-teal-400",
  },
];

const getSubjectColor = (subjectName: string | undefined, id: number = 0) => {
  const key = String(subjectName || "").toLowerCase();
  if (key.includes("math")) return COLOR_PALETTES[0];
  if (key.includes("sci") || key.includes("chem") || key.includes("phys")) return COLOR_PALETTES[1];
  if (key.includes("eng") || key.includes("lit") || key.includes("lang")) return COLOR_PALETTES[2];
  if (key.includes("hist") || key.includes("geog")) return COLOR_PALETTES[3];
  if (key.includes("comp") || key.includes("it")) return COLOR_PALETTES[4];
  if (key.includes("art") || key.includes("music")) return COLOR_PALETTES[5];
  if (key.includes("sport") || key.includes("pe")) return COLOR_PALETTES[6];
  return COLOR_PALETTES[Math.abs(Number(id)) % COLOR_PALETTES.length];
};

const getLiveStatus = (lesson: ScheduleLesson) => {
  const currentDay = moment().format("dddd").toUpperCase();
  const lessonDay = String(lesson.day || "").toUpperCase();

  if (currentDay !== lessonDay) {
    return { status: "scheduled", label: "Scheduled", badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
  }

  const now = moment();
  const currentMinutes = now.hours() * 60 + now.minutes();
  const [sh, sm] = extractTime(lesson.start_time).split(":").map(Number);
  const [eh, em] = extractTime(lesson.end_time).split(":").map(Number);
  const startMinutes = (sh || 0) * 60 + (sm || 0);
  const endMinutes = (eh || 0) * 60 + (em || 0);

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    const remaining = endMinutes - currentMinutes;
    return {
      status: "live",
      label: `Live Now (${remaining}m left)`,
      badgeClass: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 animate-pulse font-semibold",
      remaining,
    };
  }

  if (currentMinutes < startMinutes) {
    const startsIn = startMinutes - currentMinutes;
    const timeText = startsIn > 60 ? `in ${Math.floor(startsIn / 60)}h ${startsIn % 60}m` : `in ${startsIn}m`;
    return {
      status: "upcoming",
      label: `Upcoming (${timeText})`,
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
    };
  }

  return {
    status: "completed",
    label: "Completed",
    badgeClass: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
};

const ClassSchedulePage: React.FC = () => {
  const { role, user } = useAuth();
  const isAdmin = hasAdminAccess(role);

  const [schedule, setSchedule] = useState<ScheduleLesson[]>([]);
  const [children, setChildren] = useState<ScheduleChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "agenda" | "calendar">("grid");

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);

  // Lesson Detail Modal
  const [detailsLesson, setDetailsLesson] = useState<ScheduleLesson | null>(null);
  const [detailedData, setDetailedData] = useState<LessonDetailedData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add / Edit Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLessonDraft);
  const [savingLesson, setSavingLesson] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [lessonToDelete, setLessonToDelete] = useState<ScheduleLesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);

  // Admin options
  const [classes, setClasses] = useState<Array<{ id: string | number; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; surname: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string | number; name: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Load Lessons
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await api.getDashboard();
        if (!active) return;
        if (!dashboard.success) {
          setError(dashboard.message || "Unable to load schedule.");
          return;
        }

        const rawSchedule = Array.isArray(dashboard.data?.schedule) ? dashboard.data.schedule : [];
        setSchedule(rawSchedule);

        if (role === "parent" && user?.id) {
          const profile = await api.getById<any>("parents", user.id);
          if (!active) return;
          if (profile.success) {
            const kids = Array.isArray(profile.data?.children) ? profile.data.children : [];
            setChildren(kids);
            setSelectedChildId((c) => c || kids[0]?.id || "");
          }
        }
      } catch {
        if (active) setError("Unable to connect to the server.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [role, user?.id, reloadKey]);

  // Load Admin Dropdown Options
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    Promise.all([
      api.getAll("classes", { page: 1, limit: 1000 }),
      api.getAll("teachers", { page: 1, limit: 1000 }),
      api.getAll("subjects", { page: 1, limit: 1000 }),
    ]).then(([classRes, teacherRes, subjectRes]) => {
      if (!active) return;
      if (classRes.success && classRes.data?.classes) setClasses(classRes.data.classes);
      if (teacherRes.success && teacherRes.data?.teachers) setTeachers(teacherRes.data.teachers);
      if (subjectRes.success && subjectRes.data?.subjects) setSubjects(subjectRes.data.subjects);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  // Fetch Full Details for Selected Lesson
  useEffect(() => {
    if (!detailsLesson) {
      setDetailedData(null);
      return;
    }
    let active = true;
    setLoadingDetails(true);
    api
      .getById<LessonDetailedData>("lessons", detailsLesson.id)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setDetailedData(res.data);
        } else {
          setDetailedData({ lesson: detailsLesson });
        }
      })
      .catch(() => {
        if (active) setDetailedData({ lesson: detailsLesson });
      })
      .finally(() => {
        if (active) setLoadingDetails(false);
      });

    return () => {
      active = false;
    };
  }, [detailsLesson]);

  // Class options derived from schedule & API
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    schedule.forEach((lesson) => {
      map.set(String(lesson.class_id), lesson.class_name || `Class ${lesson.class_id}`);
    });
    classes.forEach((c) => {
      map.set(String(c.id), c.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, schedule]);

  // Teacher options
  const teacherOptions = useMemo(() => {
    return teachers
      .map((t) => ({ id: t.id, name: `${t.name} ${t.surname}`.trim() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers]);

  // Visible Schedule Filtered
  const visibleSchedule = useMemo(() => {
    let list = schedule;

    if (role === "parent") {
      const child = children.find((c) => c.id === selectedChildId);
      list = child ? list.filter((l) => String(l.class_id) === String(child.class_id)) : [];
    }

    if (role === "teacher" && selectedClassId !== "all") {
      list = list.filter((l) => String(l.class_id) === selectedClassId);
    }

    if (isAdmin) {
      if (selectedClassId !== "all") {
        list = list.filter((l) => String(l.class_id) === selectedClassId);
      }
      if (selectedTeacherId !== "all") {
        list = list.filter((l) => l.teacher_id === selectedTeacherId);
      }
    }

    if (selectedDayFilter !== "all") {
      list = list.filter((l) => String(l.day || "").toUpperCase() === selectedDayFilter.toUpperCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((l) => {
        const title = (l.name || l.title || "").toLowerCase();
        const subject = (l.subject_name || "").toLowerCase();
        const className = (l.class_name || "").toLowerCase();
        const teacher = `${l.teacher_name || ""} ${l.teacher_surname || ""}`.toLowerCase();
        return title.includes(q) || subject.includes(q) || className.includes(q) || teacher.includes(q);
      });
    }

    return [...list].sort((a, b) => extractTime(a.start_time).localeCompare(extractTime(b.start_time)));
  }, [children, isAdmin, role, schedule, searchQuery, selectedChildId, selectedClassId, selectedDayFilter, selectedTeacherId]);

  // Lessons Grouped By Day
  const lessonsByDay = useMemo(() => {
    const map: Record<string, ScheduleLesson[]> = {};
    SCHOOL_DAYS.forEach((d) => {
      map[d] = [];
    });
    visibleSchedule.forEach((lesson) => {
      const dayKey = String(lesson.day || "").toUpperCase();
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(lesson);
    });

    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => extractTime(a.start_time).localeCompare(extractTime(b.start_time)));
    });
    return map;
  }, [visibleSchedule]);

  // Live status for today
  const todayHighlight = useMemo(() => {
    const currentDay = moment().format("dddd").toUpperCase();
    const todayList = lessonsByDay[currentDay] || [];
    const live = todayList.map((l) => ({ lesson: l, info: getLiveStatus(l) })).find((x) => x.info.status === "live");
    const upcoming = todayList.map((l) => ({ lesson: l, info: getLiveStatus(l) })).find((x) => x.info.status === "upcoming");
    return {
      currentDay,
      count: todayList.length,
      liveLesson: live?.lesson,
      liveInfo: live?.info,
      upcomingLesson: upcoming?.lesson,
    };
  }, [lessonsByDay]);

  // Calendar Events
  const calendarEvents = useMemo(() => {
    const weekStart = moment(calendarDate).startOf("week");
    return visibleSchedule.flatMap((lesson) => {
      const dayIndex = DAY_INDEXES[String(lesson.day || "").toUpperCase()];
      if (dayIndex === undefined) return [];
      const day = weekStart.clone().add(dayIndex, "days").toDate();
      const subject = lesson.subject_name || lesson.name || lesson.title || "Lesson";
      return [
        {
          id: lesson.id,
          title: [subject, lesson.class_name].filter(Boolean).join(" · "),
          start: timeOnDay(day, lesson.start_time),
          end: timeOnDay(day, lesson.end_time),
          subject,
          lesson,
        },
      ];
    });
  }, [calendarDate, visibleSchedule]);

  const pageTitle = useMemo(() => {
    if (role === "teacher") return "My Teaching Timetable";
    if (role === "student") return "My Class Timetable";
    if (role === "parent") return "Child's Class Timetable";
    return "Master Class Schedule";
  }, [role]);

  // Actions
  const openNewLesson = (defaultDay?: string) => {
    setEditingLessonId(null);
    setLessonDraft({
      ...emptyLessonDraft,
      day: defaultDay || (selectedDayFilter !== "all" ? selectedDayFilter : "MONDAY"),
      class_id: selectedClassId === "all" ? String(classes[0]?.id || "") : selectedClassId,
      teacher_id: selectedTeacherId === "all" ? teachers[0]?.id || "" : selectedTeacherId,
      subject_id: String(subjects[0]?.id || ""),
    });
    setFormError(null);
    setEditorOpen(true);
  };

  const openEditLesson = (lesson: ScheduleLesson) => {
    setEditingLessonId(lesson.id);
    setLessonDraft({
      name: lesson.name || lesson.title || "",
      day: String(lesson.day || "MONDAY").toUpperCase(),
      start_time: extractTime(lesson.start_time),
      end_time: extractTime(lesson.end_time),
      subject_id: String(lesson.subject_id),
      class_id: String(lesson.class_id),
      teacher_id: lesson.teacher_id,
    });
    setFormError(null);
    setEditorOpen(true);
    setDetailsLesson(null);
  };

  const saveLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!lessonDraft.name.trim() || !lessonDraft.class_id || !lessonDraft.teacher_id || !lessonDraft.subject_id) {
      setFormError("Please fill out all required fields.");
      return;
    }
    if (lessonDraft.end_time <= lessonDraft.start_time) {
      setFormError("End time must be later than start time.");
      return;
    }

    setSavingLesson(true);
    const date = moment(calendarDate).format("YYYY-MM-DD");
    const payload = {
      ...lessonDraft,
      name: lessonDraft.name.trim(),
      day: lessonDraft.day.toUpperCase(),
      start_time: `${date} ${lessonDraft.start_time}:00`,
      end_time: `${date} ${lessonDraft.end_time}:00`,
    };

    try {
      const res = editingLessonId ? await api.update("lessons", editingLessonId, payload) : await api.create("lessons", payload);
      if (!res.success) {
        setFormError(res.message || "Failed to save lesson schedule.");
        return;
      }
      setEditorOpen(false);
      setReloadKey((v) => v + 1);
    } catch {
      setFormError("Unable to reach the server. Please try again.");
    } finally {
      setSavingLesson(false);
    }
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    setDeletingLesson(true);
    try {
      const res = await api.delete("lessons", lessonToDelete.id);
      if (!res.success) {
        alert(res.message || "Unable to delete lesson.");
        return;
      }
      setLessonToDelete(null);
      setDetailsLesson(null);
      setReloadKey((v) => v + 1);
    } catch {
      alert("Unable to reach server.");
    } finally {
      setDeletingLesson(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Day", "Start Time", "End Time", "Duration (min)", "Subject", "Lesson Name", "Class", "Teacher"];
    const rows = visibleSchedule.map((l) => [
      l.day,
      formatTime12h(l.start_time),
      formatTime12h(l.end_time),
      calculateDuration(l.start_time, l.end_time),
      l.subject_name || "",
      l.name || l.title || "",
      l.class_name || `Class ${l.class_id}`,
      [l.teacher_name, l.teacher_surname].filter(Boolean).join(" ") || "Unassigned",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Class_Schedule_${moment().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto w-full max-w-[1700px] p-3 sm:p-5 md:p-6 space-y-6">
      {/* PRINT HEADER */}
      <div className="hidden print:block mb-4 border-b border-gray-300 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="text-sm text-gray-600">Generated on {moment().format("LLLL")} · Total {visibleSchedule.length} Lessons Scheduled</p>
      </div>

      {/* TOP HEADER */}
      <header className="flex flex-col gap-4 border-b border-gray-200 dark:border-gray-800 pb-5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              <Sparkles size={13} className="text-sky-500" /> Academic Timetable & Scheduling
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{pageTitle}</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {isAdmin
                ? "Organize, view, and manage school timetable schedules across all classrooms and teachers."
                : role === "teacher"
                ? "Manage your weekly teaching periods, classroom assignments, and lesson schedule."
                : role === "parent"
                ? "Monitor your child's weekly classes, subjects, and instructor timetable."
                : "Browse your daily periods, lesson times, and teacher assignments."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setReloadKey((v) => v + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 shadow-sm transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-sky-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={visibleSchedule.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 shadow-sm transition disabled:opacity-40"
            >
              <Download size={14} className="text-gray-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={visibleSchedule.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 shadow-sm transition disabled:opacity-40"
            >
              <Printer size={14} className="text-gray-500" />
              <span>Print Timetable</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => openNewLesson()}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition"
              >
                <Plus size={16} />
                <span>Add Lesson</span>
              </button>
            )}
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium uppercase tracking-wider">Total Lessons</span>
              <BookOpen size={16} className="text-sky-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{visibleSchedule.length}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Across active school week</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium uppercase tracking-wider">Today's Classes</span>
              <CalendarDays size={16} className="text-emerald-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{todayHighlight.count}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">{todayHighlight.currentDay}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium uppercase tracking-wider">Subjects</span>
              <Award size={16} className="text-violet-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(visibleSchedule.map((l) => String(l.subject_id))).size}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Curriculum disciplines</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium uppercase tracking-wider">Classes</span>
              <UsersRound size={16} className="text-amber-500" />
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(visibleSchedule.map((l) => String(l.class_id))).size}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Student cohorts</p>
          </div>
        </div>

        {/* LIVE / UPCOMING BANNER */}
        {todayHighlight.liveLesson ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Class In Session Now · {todayHighlight.liveInfo?.remaining}m remaining
                </span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {todayHighlight.liveLesson.subject_name || todayHighlight.liveLesson.name} · {todayHighlight.liveLesson.class_name} (
                  {formatTime12h(todayHighlight.liveLesson.start_time)} – {formatTime12h(todayHighlight.liveLesson.end_time)})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailsLesson(todayHighlight.liveLesson!)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              Class Details <ChevronRight size={14} />
            </button>
          </div>
        ) : todayHighlight.upcomingLesson ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="text-sky-600 dark:text-sky-400" size={18} />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">Upcoming Next Today</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {todayHighlight.upcomingLesson.subject_name || todayHighlight.upcomingLesson.name} · {todayHighlight.upcomingLesson.class_name} at{" "}
                  {formatTime12h(todayHighlight.upcomingLesson.start_time)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDetailsLesson(todayHighlight.upcomingLesson!)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:underline"
            >
              View Info <ChevronRight size={14} />
            </button>
          </div>
        ) : null}
      </header>

      {/* FILTER & VIEW TOOLBAR */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search subject, lesson, teacher, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Selectors & Switchers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {role === "parent" && children.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Child:</span>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 outline-none"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.surname} ({c.class_name || "Class"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(isAdmin || role === "teacher") && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 outline-none"
                >
                  <option value="all">All Classes ({classOptions.length})</option>
                  {classOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Teacher:</span>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 outline-none"
                >
                  <option value="all">All Teachers ({teacherOptions.length})</option>
                  {teacherOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Mode Buttons */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Timetable</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("agenda")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "agenda"
                    ? "bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <ListFilter size={14} />
                <span className="hidden sm:inline">Agenda</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === "calendar"
                    ? "bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-300 shadow-sm font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <CalendarIcon size={14} />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Day Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 mr-1 flex items-center gap-1">
              <Filter size={13} /> Day:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDayFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedDayFilter === "all"
                  ? "bg-sky-600 text-white font-semibold shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              All Days ({visibleSchedule.length})
            </button>

            {SCHOOL_DAYS.map((day) => {
              const count = (lessonsByDay[day] || []).length;
              const isToday = moment().format("dddd").toUpperCase() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayFilter(day)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    selectedDayFilter === day
                      ? "bg-sky-600 text-white font-semibold shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Today"></span>}
                  <span>{DAY_LABELS[day] || day}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      selectedDayFilter === day ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {(selectedClassId !== "all" || selectedTeacherId !== "all" || selectedDayFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassId("all");
                setSelectedTeacherId("all");
                setSelectedDayFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
            >
              <X size={13} /> Reset Filters
            </button>
          )}
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-3 text-gray-500">
            <RefreshCw className="animate-spin text-sky-600" size={32} />
            <p className="text-sm font-medium">Loading schedule...</p>
          </div>
        ) : visibleSchedule.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center gap-3 p-6 text-center">
            <CalendarDays size={42} className="text-gray-400" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">No lessons match your current filters</h3>
            <p className="text-sm text-gray-500 max-w-md">There are no classes scheduled for the selected criteria.</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openNewLesson()}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition"
              >
                <Plus size={15} /> Add Lesson
              </button>
            )}
          </div>
        ) : (
          <>
            {/* GRID TIMETABLE VIEW */}
            {viewMode === "grid" && (
              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-[700px]">
                  {(selectedDayFilter === "all" ? SCHOOL_DAYS : [selectedDayFilter as typeof SCHOOL_DAYS[number]]).map((day) => {
                    const dayLessons = lessonsByDay[day] || [];
                    const isToday = moment().format("dddd").toUpperCase() === day;

                    return (
                      <div
                        key={day}
                        className={`flex flex-col rounded-xl border transition ${
                          isToday
                            ? "border-sky-400 dark:border-sky-600 bg-sky-50/20 dark:bg-sky-950/10 shadow-sm"
                            : "border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between border-b px-3.5 py-3 rounded-t-xl ${
                            isToday
                              ? "border-sky-200 dark:border-sky-800/80 bg-sky-100/60 dark:bg-sky-900/40"
                              : "border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-800/70"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{DAY_LABELS[day] || day}</span>
                            {isToday && (
                              <span className="rounded-full bg-sky-600 text-white px-2 py-0.2 text-[10px] font-semibold uppercase tracking-wider">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-500 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                            {dayLessons.length}
                          </span>
                        </div>

                        <div className="p-3 flex-1 flex flex-col gap-3 min-h-[300px]">
                          {dayLessons.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800 p-4 text-center">
                              <p className="text-xs text-gray-400">No classes</p>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openNewLesson(day)}
                                  className="mt-2 text-xs font-semibold text-sky-600 hover:underline"
                                >
                                  + Add Lesson
                                </button>
                              )}
                            </div>
                          ) : (
                            dayLessons.map((lesson) => {
                              const palette = getSubjectColor(lesson.subject_name || lesson.name, lesson.id);
                              const live = getLiveStatus(lesson);
                              const duration = calculateDuration(lesson.start_time, lesson.end_time);

                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => setDetailsLesson(lesson)}
                                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 shadow-sm transition hover:shadow-md cursor-pointer ${palette.bg} ${palette.border} ${palette.hoverBorder}`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-2">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                      <Clock size={12} className={palette.subtext} />
                                      {formatTime12h(lesson.start_time)} – {formatTime12h(lesson.end_time)}
                                    </span>
                                    <span className="rounded-md bg-white/70 dark:bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                                      {duration}m
                                    </span>
                                  </div>

                                  <div className="mb-2">
                                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${palette.badge}`}>
                                      {lesson.subject_name || lesson.name || "Subject"}
                                    </span>
                                    <h4 className="mt-1 font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                                      {lesson.name || lesson.title || lesson.subject_name}
                                    </h4>
                                  </div>

                                  <div className="flex flex-col gap-1 border-t border-black/5 dark:border-white/5 pt-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1 font-medium truncate">
                                        <UsersRound size={13} className="text-gray-400" />
                                        {lesson.class_name || `Class ${lesson.class_id}`}
                                      </span>
                                      {live.status === "live" && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
                                        </span>
                                      )}
                                    </div>
                                    <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                      <GraduationCap size={13} className="text-gray-400" />
                                      {[lesson.teacher_name, lesson.teacher_surname].filter(Boolean).join(" ") || "Teacher unassigned"}
                                    </span>
                                  </div>

                                  {/* Quick Hover Actions */}
                                  <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-1 shadow border border-gray-200 dark:border-gray-700">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDetailsLesson(lesson);
                                      }}
                                      title="View Details"
                                      className="p-1 rounded text-gray-600 hover:text-sky-600 hover:bg-gray-100"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    {isAdmin && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditLesson(lesson);
                                          }}
                                          title="Edit"
                                          className="p-1 rounded text-gray-600 hover:text-sky-600 hover:bg-gray-100"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLessonToDelete(lesson);
                                          }}
                                          title="Delete"
                                          className="p-1 rounded text-gray-600 hover:text-red-600 hover:bg-red-50"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AGENDA VIEW */}
            {viewMode === "agenda" && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(selectedDayFilter === "all" ? SCHOOL_DAYS : [selectedDayFilter as typeof SCHOOL_DAYS[number]]).map((day) => {
                  const dayLessons = lessonsByDay[day] || [];
                  const isToday = moment().format("dddd").toUpperCase() === day;

                  return (
                    <div key={day} className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">{DAY_LABELS[day] || day}</h3>
                          {isToday && (
                            <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-xs font-semibold">
                              Today
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{dayLessons.length} lessons</span>
                        </div>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => openNewLesson(day)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
                          >
                            <Plus size={14} /> Add lesson to {DAY_LABELS[day]}
                          </button>
                        )}
                      </div>

                      {dayLessons.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No scheduled lessons for this day.</p>
                      ) : (
                        <div className="space-y-3">
                          {dayLessons.map((lesson) => {
                            const palette = getSubjectColor(lesson.subject_name || lesson.name, lesson.id);
                            const live = getLiveStatus(lesson);
                            const duration = calculateDuration(lesson.start_time, lesson.end_time);

                            return (
                              <div
                                key={lesson.id}
                                onClick={() => setDetailsLesson(lesson)}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md cursor-pointer ${palette.bg} ${palette.border} ${palette.hoverBorder}`}
                              >
                                <div className="flex items-start sm:items-center gap-3">
                                  <div className="flex flex-col items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-center min-w-[100px] shrink-0">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                      {formatTime12h(lesson.start_time)}
                                    </span>
                                    <span className="text-[10px] text-gray-500">to {formatTime12h(lesson.end_time)}</span>
                                    <span className="mt-1 rounded bg-gray-100 dark:bg-gray-800 px-1 text-[9px] font-semibold text-gray-600 dark:text-gray-400">
                                      {duration} mins
                                    </span>
                                  </div>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${palette.badge}`}>
                                        {lesson.subject_name || lesson.name}
                                      </span>
                                      <span className="rounded-md bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {lesson.class_name || `Class ${lesson.class_id}`}
                                      </span>
                                      {live.status !== "scheduled" && (
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${live.badgeClass}`}>
                                          {live.label}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                      {lesson.name || lesson.title}
                                    </h4>
                                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                      <GraduationCap size={13} className="text-gray-400" />
                                      Instructor: {[lesson.teacher_name, lesson.teacher_surname].filter(Boolean).join(" ") || "Unassigned"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailsLesson(lesson);
                                    }}
                                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 shadow-sm"
                                  >
                                    View Details
                                  </button>
                                  {isAdmin && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditLesson(lesson);
                                        }}
                                        className="rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 p-1.5 text-sky-700 hover:bg-sky-100"
                                        title="Edit"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLessonToDelete(lesson);
                                        }}
                                        className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 p-1.5 text-red-700 hover:bg-red-100"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* CALENDAR VIEW */}
            {viewMode === "calendar" && (
              <div className="h-[750px] p-4 sm:p-5">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  views={[Views.WEEK, Views.DAY]}
                  view={calendarView}
                  date={calendarDate}
                  onView={setCalendarView}
                  onNavigate={setCalendarDate}
                  onSelectEvent={(event: any) => setDetailsLesson(event.lesson)}
                  min={new Date(2026, 0, 1, 7, 0, 0)}
                  max={new Date(2026, 0, 1, 18, 0, 0)}
                  style={{ height: "100%" }}
                  eventPropGetter={(event: any) => {
                    const palette = getSubjectColor(event.subject, event.id);
                    return {
                      className: `${palette.bg} ${palette.border} border shadow-sm font-medium`,
                      style: { color: "#0f172a", borderRadius: "8px" },
                    };
                  }}
                  messages={{ noEventsInRange: "No lessons scheduled for this time range." }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL 1: LESSON DETAILS MODAL */}
      {detailsLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailsLesson(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            {(() => {
              const palette = getSubjectColor(detailsLesson.subject_name || detailsLesson.name, detailsLesson.id);
              const live = getLiveStatus(detailsLesson);
              const duration = calculateDuration(detailsLesson.start_time, detailsLesson.end_time);

              return (
                <>
                  <div className={`p-5 border-b ${palette.bg} ${palette.border}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${palette.badge}`}>
                        {detailsLesson.subject_name || detailsLesson.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${live.badgeClass}`}>
                          {live.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDetailsLesson(null)}
                          className="rounded-lg p-1 text-gray-500 hover:bg-black/5"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                      {detailsLesson.name || detailsLesson.title || detailsLesson.subject_name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {DAY_LABELS[detailsLesson.day] || detailsLesson.day} · {formatTime12h(detailsLesson.start_time)} –{" "}
                      {formatTime12h(detailsLesson.end_time)} ({duration} minutes)
                    </p>
                  </div>

                  <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <UsersRound size={13} className="text-sky-500" /> Class & Section
                        </span>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {detailsLesson.class_name || `Class ${detailsLesson.class_id}`}
                        </p>
                        {detailsLesson.grade_level && (
                          <p className="text-xs text-gray-500">Grade Level {detailsLesson.grade_level}</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap size={13} className="text-emerald-500" /> Assigned Teacher
                        </span>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {[detailsLesson.teacher_name, detailsLesson.teacher_surname].filter(Boolean).join(" ") || "Unassigned"}
                        </p>
                        <p className="text-xs text-gray-500">{detailsLesson.subject_name || "Instructor"}</p>
                      </div>
                    </div>

                    {loadingDetails ? (
                      <div className="flex items-center justify-center p-4 text-xs text-gray-500 gap-2">
                        <RefreshCw size={14} className="animate-spin text-sky-600" />
                        Fetching academic records...
                      </div>
                    ) : detailedData ? (
                      <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between text-xs py-1">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Users size={14} className="text-gray-400" /> Enrolled Students
                          </span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {detailedData.students?.length ?? "—"} Students
                          </span>
                        </div>

                        {detailedData.attendance && detailedData.attendance.length > 0 && (
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-gray-500 flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-500" /> Attendance Records
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {detailedData.attendance.length} session entries
                            </span>
                          </div>
                        )}

                        {detailedData.exams && detailedData.exams.length > 0 && (
                          <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-3">
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                              <Award size={14} /> Scheduled Exams ({detailedData.exams.length})
                            </span>
                            <div className="space-y-1">
                              {detailedData.exams.map((exam) => (
                                <div key={exam.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                  <span>{exam.title}</span>
                                  <span className="text-gray-500">{moment(exam.start_time).format("MMM D, h:mm A")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {detailedData.assignments && detailedData.assignments.length > 0 && (
                          <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/20 p-3">
                            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5 mb-1.5">
                              <FileText size={14} /> Course Assignments ({detailedData.assignments.length})
                            </span>
                            <div className="space-y-1">
                              {detailedData.assignments.map((asg) => (
                                <div key={asg.id} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                                  <span>{asg.title}</span>
                                  <span className="text-gray-500">Due {moment(asg.due_date).format("MMM D")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3.5">
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditLesson(detailsLesson)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 shadow-sm"
                        >
                          <Pencil size={13} /> Edit Lesson
                        </button>
                        <button
                          type="button"
                          onClick={() => setLessonToDelete(detailsLesson)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 shadow-sm"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => setDetailsLesson(null)}
                      className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT LESSON MODAL (ADMIN ONLY) */}
      {editorOpen && isAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !savingLesson) setEditorOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingLessonId ? "Edit Lesson Schedule" : "Add New Lesson Schedule"}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Assign a classroom period, instructor, and subject. Conflicts are prevented automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                disabled={savingLesson}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={saveLesson} className="p-6 space-y-4">
              {formError && (
                <div role="alert" className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Lesson / Topic Title <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  maxLength={255}
                  placeholder="e.g. Mathematics 101, Advanced Chemistry..."
                  value={lessonDraft.name}
                  onChange={(e) => setLessonDraft({ ...lessonDraft, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Day of the Week <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {SCHOOL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setLessonDraft({ ...lessonDraft, day })}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition text-center ${
                        lessonDraft.day === day
                          ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {DAY_LABELS[day]?.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={lessonDraft.subject_id}
                    onChange={(e) => setLessonDraft({ ...lessonDraft, subject_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Class / Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={lessonDraft.class_id}
                    onChange={(e) => setLessonDraft({ ...lessonDraft, class_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Instructor / Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={lessonDraft.teacher_id}
                  onChange={(e) => setLessonDraft({ ...lessonDraft, teacher_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.surname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={lessonDraft.start_time}
                    onChange={(e) => setLessonDraft({ ...lessonDraft, start_time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="time"
                    value={lessonDraft.end_time}
                    onChange={(e) => setLessonDraft({ ...lessonDraft, end_time: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {lessonDraft.start_time && lessonDraft.end_time && (
                <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={14} className="text-sky-600" />
                    Session Duration:
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {calculateDuration(lessonDraft.start_time, lessonDraft.end_time)} minutes
                  </span>
                </div>
              )}

              <footer className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  disabled={savingLesson}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLesson}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition disabled:opacity-50"
                >
                  <Save size={14} />
                  {savingLesson ? "Saving..." : editingLessonId ? "Save Changes" : "Save Lesson"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {lessonToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deletingLesson) setLessonToDelete(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 dark:bg-red-950/60 p-2.5">
                <Trash2 size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Scheduled Lesson?</h3>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-gray-900 dark:text-white">
                {lessonToDelete.subject_name || lessonToDelete.name}
              </strong>{" "}
              for{" "}
              <strong className="text-gray-900 dark:text-white">
                {lessonToDelete.class_name || `Class ${lessonToDelete.class_id}`}
              </strong>{" "}
              on {DAY_LABELS[lessonToDelete.day] || lessonToDelete.day} at{" "}
              {formatTime12h(lessonToDelete.start_time)}? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLessonToDelete(null)}
                disabled={deletingLesson}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteLesson()}
                disabled={deletingLesson}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deletingLesson ? "Deleting..." : "Delete Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSchedulePage;
