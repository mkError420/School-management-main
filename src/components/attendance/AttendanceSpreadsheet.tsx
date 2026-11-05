import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  RefreshCw,
  Search,
  Check,
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  UserCheck,
  UserX,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";

export interface SpreadsheetDate {
  date: string;
  day_num: number | string;
  day_name: string;
  is_weekend: boolean;
}

export interface SpreadsheetStudent {
  id: string;
  name: string;
  surname: string;
  roll?: string;
  img?: string;
  class_id?: number | string;
  class_name?: string;
}

export interface AttendanceCell {
  id?: number | string;
  present: boolean;
  notes?: string;
  lesson_id?: number | string;
  lesson_name?: string;
}

interface AttendanceLesson {
  id: number | string;
  name: string;
  subject_name?: string;
  class_id?: number | string;
  class_name?: string;
  teacher_name?: string;
  teacher_surname?: string;
  start_time?: string;
  end_time?: string;
}

interface AttendanceSpreadsheetProps {
  classes: Array<{ id: number | string; name: string }>;
  lessons: AttendanceLesson[];
  initialClassId?: string | number;
  role?: string;
  onRefreshParent?: () => void;
}

export const AttendanceSpreadsheet: React.FC<AttendanceSpreadsheetProps> = ({
  classes,
  lessons,
  initialClassId,
  role = "admin",
  onRefreshParent,
}) => {
  // Current Month State (YYYY-MM)
  const today = useMemo(() => new Date(), []);
  const currentMonthStr = useMemo(
    () => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
    [today]
  );
  const todayYmd = useMemo(
    () =>
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`,
    [today]
  );

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState<string>(todayYmd);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId ? String(initialClassId) : "all"
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Data
  const [dates, setDates] = useState<SpreadsheetDate[]>([]);
  const [students, setStudents] = useState<SpreadsheetStudent[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, AttendanceCell>>>({});
  const [lessonMatrix, setLessonMatrix] = useState<Record<string, Record<string, Record<string, AttendanceCell>>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [columnMenuDate, setColumnMenuDate] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentMonthStr);
  };

  const formatMonthTitle = (monthStr: string) => {
    const [y, m] = monthStr.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Fetch spreadsheet matrix data from backend
  const fetchSpreadsheetData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        month: selectedMonth,
      };
      const selectedLesson = selectedLessonId === "all"
        ? undefined
        : lessons.find((lesson) => String(lesson.id) === selectedLessonId);
      if (selectedClassId && selectedClassId !== "all") {
        params.class_id = selectedClassId;
      } else if (selectedLesson?.class_id) {
        params.class_id = selectedLesson.class_id;
      }
      if (selectedLessonId !== "all") params.lesson_id = selectedLessonId;
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.getAttendanceSpreadsheet(params);
      if (res?.success && res.data) {
        setDates(res.data.dates || []);
        setStudents(res.data.students || []);
        setMatrix(res.data.matrix || {});
        setLessonMatrix(res.data.lesson_matrix || {});
      } else {
        // Fallback local calendar generation if backend returned empty or offline
        generateFallbackDates(selectedMonth);
        setStudents([]);
        setMatrix({});
        setLessonMatrix({});
      }
    } catch {
      generateFallbackDates(selectedMonth);
      setStudents([]);
      setMatrix({});
      setLessonMatrix({});
    } finally {
      setLoading(false);
    }
  }, [lessons, selectedMonth, selectedClassId, selectedLessonId, search]);

  const generateFallbackDates = (monthStr: string) => {
    const [y, m] = monthStr.split("-").map(Number);
    const numDays = new Date(y, m, 0).getDate();
    const dList: SpreadsheetDate[] = [];
    for (let day = 1; day <= numDays; day++) {
      const dt = new Date(y, m - 1, day);
      const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
      const dayW = dt.getDay();
      const isWeekend = dayW === 5 || dayW === 6; // Fri, Sat
      dList.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day_num: day,
        day_name: dayName,
        is_weekend: isWeekend,
      });
    }
    setDates(dList);
  };

  useEffect(() => {
    fetchSpreadsheetData();
  }, [fetchSpreadsheetData]);

  // ─── Automated Calculations ────────────────────────────────────────────────
  // Calculate per-student stats (Present, Absent, Total Marked, Rate %)
  const studentStats = useMemo(() => {
    const stats: Record<
      string,
      { present: number; absent: number; total: number; rate: number }
    > = {};

    students.forEach((st) => {
      let p = 0;
      let a = 0;
      let total = 0;
      const stRecords = matrix[st.id] || {};

      dates.forEach((d) => {
        const cell = stRecords[d.date];
        if (cell !== undefined && cell !== null) {
          total++;
          if (cell.present) p++;
          else a++;
        }
      });

      const rate = total > 0 ? Math.round((p / total) * 1000) / 10 : 0;
      stats[st.id] = { present: p, absent: a, total, rate };
    });

    return stats;
  }, [students, dates, matrix]);

  // Calculate per-date column stats (Present count, Absent count, Total count, Daily Rate %)
  const dateStats = useMemo(() => {
    const stats: Record<
      string,
      { present: number; absent: number; total: number; rate: number }
    > = {};

    dates.forEach((d) => {
      let p = 0;
      let a = 0;
      let total = 0;

      students.forEach((st) => {
        const cell = matrix[st.id]?.[d.date];
        if (cell !== undefined && cell !== null) {
          total++;
          if (cell.present) p++;
          else a++;
        }
      });

      const rate = total > 0 ? Math.round((p / total) * 100) : 0;
      stats[d.date] = { present: p, absent: a, total, rate };
    });

    return stats;
  }, [dates, students, matrix]);

  // Overall Class Period Summary
  const overallSummary = useMemo(() => {
    let totalP = 0;
    let totalA = 0;
    let totalMarked = 0;

    Object.values(studentStats).forEach((st) => {
      totalP += st.present;
      totalA += st.absent;
      totalMarked += st.total;
    });

    const rate = totalMarked > 0 ? Math.round((totalP / totalMarked) * 1000) / 10 : 0;
    return {
      present: totalP,
      absent: totalA,
      totalMarked,
      rate,
    };
  }, [studentStats]);

  const availableLessons = useMemo(
    () => lessons.filter((lesson) => {
      if (!lesson.class_id) return false;
      return selectedClassId === "all" || String(lesson.class_id) === selectedClassId;
    }),
    [lessons, selectedClassId]
  );

  useEffect(() => {
    if (selectedLessonId !== "all" && !availableLessons.some((lesson) => String(lesson.id) === selectedLessonId)) {
      setSelectedLessonId("all");
    }
  }, [availableLessons, selectedLessonId]);

  const dailyLessonGroups = useMemo(() => availableLessons
    .filter((lesson) => selectedLessonId === "all" || String(lesson.id) === selectedLessonId)
    .map((lesson) => {
      const lessonStudents = students.filter((student) => String(student.class_id) === String(lesson.class_id));
      const className = lesson.class_name
        || classes.find((item) => String(item.id) === String(lesson.class_id))?.name
        || lessonStudents[0]?.class_name
        || "Class";
      return {
        id: String(lesson.id),
        lesson,
        className,
        subjectName: lesson.subject_name || lesson.name || "Subject",
        students: lessonStudents,
      };
    })
    .filter((group) => group.students.length > 0)
    .sort((left, right) => {
      const classOrder = classes.findIndex((item) => String(item.id) === String(left.lesson.class_id))
        - classes.findIndex((item) => String(item.id) === String(right.lesson.class_id));
      if (classOrder !== 0) return classOrder;
      return left.subjectName.localeCompare(right.subjectName) || left.lesson.name.localeCompare(right.lesson.name);
    }), [availableLessons, classes, selectedLessonId, students]);

  const dailySummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let marked = 0;
    const rosterCount = dailyLessonGroups.reduce((count, group) => count + group.students.length, 0);

    dailyLessonGroups.forEach((group) => group.students.forEach((student) => {
      const attendance = lessonMatrix[student.id]?.[selectedDate]?.[group.id];
      if (!attendance) return;
      marked++;
      if (attendance.present) present++;
      else absent++;
    }));

    return {
      present,
      absent,
      marked,
      unmarked: Math.max(0, rosterCount - marked),
      rate: marked ? Math.round((present / marked) * 100) : 0,
    };
  }, [dailyLessonGroups, lessonMatrix, selectedDate]);

  const selectedDateIsWeekend = [5, 6].includes(new Date(`${selectedDate}T00:00:00`).getDay());

  const setAttendanceDate = (date: string) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedMonth(date.slice(0, 7));
  };

  const changeAttendanceDate = (offset: number) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day + offset);
    setAttendanceDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
  };

  // ─── In-Cell Marking & Interactive Toggle ─────────────────────────────────
  const handleCellClick = async (studentId: string, dateStr: string) => {
    if (role !== "admin" && role !== "teacher") return;
    if (selectedLessonId === "all") {
      setFeedback({ type: "error", message: "Select a subject to update its monthly attendance register." });
      return;
    }

    const cellKey = `${studentId}_${dateStr}`;
    setSavingKey(cellKey);

    const currentCell = matrix[studentId]?.[dateStr];

    // Cycle: Unmarked -> Present (true) -> Absent (false) -> Unmarked (remove)
    let nextStatus: boolean | null = null;
    if (currentCell === undefined || currentCell === null) {
      nextStatus = true; // Mark Present
    } else if (currentCell.present === true) {
      nextStatus = false; // Mark Absent
    } else {
      nextStatus = null; // Clear / Unmarked
    }

    // Optimistic UI Update
    setMatrix((prev) => {
      const nextMatrix = { ...prev };
      const studentObj = { ...(nextMatrix[studentId] || {}) };
      if (nextStatus === null) {
        delete studentObj[dateStr];
      } else {
        studentObj[dateStr] = {
          present: nextStatus,
          notes: currentCell?.notes || "",
        };
      }
      nextMatrix[studentId] = studentObj;
      return nextMatrix;
    });

    try {
      if (nextStatus !== null) {
        const student = students.find((item) => item.id === studentId);
        const response = await api.markAttendanceRecord({
          student_id: studentId,
          date: dateStr,
          present: nextStatus ? 1 : 0,
          lesson_id: selectedLessonId,
          class_id: student?.class_id || (selectedClassId !== "all" ? selectedClassId : undefined),
        });
        if (!response.success) throw new Error(response.message || "Failed to save attendance.");
      } else if (currentCell?.id) {
        const response = await api.delete("attendance", currentCell.id);
        if (!response.success) throw new Error(response.message || "Failed to clear attendance.");
      }
      if (onRefreshParent) onRefreshParent();
      await fetchSpreadsheetData();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to update attendance cell." });
      fetchSpreadsheetData();
    } finally {
      setSavingKey(null);
    }
  };

  const setDailyAttendance = async (student: SpreadsheetStudent, lesson: AttendanceLesson, present: boolean) => {
    const lessonId = String(lesson.id);
    const cellKey = `${student.id}_${selectedDate}_${lessonId}`;
    setSavingKey(cellKey);
    try {
      const currentCell = lessonMatrix[student.id]?.[selectedDate]?.[lessonId];
      const response = await api.markAttendanceRecord({
        student_id: student.id,
        date: selectedDate,
        present: present ? 1 : 0,
        lesson_id: lesson.id,
        class_id: student.class_id || undefined,
      });
      if (!response.success) throw new Error(response.message || "Failed to save attendance.");
      setMatrix((previous) => ({
        ...previous,
        [student.id]: {
          ...(previous[student.id] || {}),
          [selectedDate]: {
            ...currentCell,
            present,
            lesson_id: currentCell?.lesson_id || lesson?.id,
          },
        },
      }));
      setLessonMatrix((previous) => ({
        ...previous,
        [student.id]: {
          ...(previous[student.id] || {}),
          [selectedDate]: {
            ...(previous[student.id]?.[selectedDate] || {}),
            [lessonId]: {
              ...currentCell,
              present,
              lesson_id: lesson.id,
              lesson_name: lesson.name,
            },
          },
        },
      }));
      setFeedback({ type: "success", message: `${student.name} ${student.surname} marked ${present ? "present" : "absent"}.` });
      if (onRefreshParent) onRefreshParent();
      await fetchSpreadsheetData();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to save attendance." });
      await fetchSpreadsheetData();
    } finally {
      setSavingKey(null);
    }
  };

  // ─── Batch Marking: Mark All Students for a Specific Date ─────────────────
  const handleMarkAllForDate = async (
    dateStr: string,
    markPresent: boolean,
    roster: SpreadsheetStudent[] = students,
    lessonGroups: Array<{ lesson: AttendanceLesson; students: SpreadsheetStudent[] }> = dailyLessonGroups
  ) => {
    if (roster.length === 0) return;
    setColumnMenuDate(null);

    const batches = lessonGroups.filter((group) => group.students.length > 0);
    if (batches.length === 0) {
      setFeedback({ type: "error", message: "No subject lessons are available for this class and date." });
      return;
    }

    // Optimistic UI update
    setLessonMatrix((previous) => {
      const nextMatrix = { ...previous };
      batches.forEach(({ lesson, students: lessonStudents }) => {
        const lessonId = String(lesson.id);
        lessonStudents.forEach((student) => {
          nextMatrix[student.id] = { ...(nextMatrix[student.id] || {}) };
          nextMatrix[student.id][dateStr] = { ...(nextMatrix[student.id][dateStr] || {}) };
          nextMatrix[student.id][dateStr][lessonId] = {
            ...nextMatrix[student.id][dateStr][lessonId],
            present: markPresent,
            lesson_id: lesson.id,
            lesson_name: lesson.name,
          };
        });
      });
      return nextMatrix;
    });

    try {
      const results = await Promise.all(batches.map(({ lesson, students: classStudents }) =>
        api.create("attendance", {
          date: dateStr,
          class_id: lesson.class_id,
          batch: classStudents.map((student) => ({
            student_id: student.id,
            date: dateStr,
            present: markPresent ? 1 : 0,
            lesson_id: lesson.id,
          })),
        })
      ));
      const failedResult = results.find((result) => !result?.success);
      if (failedResult) throw new Error(failedResult.message || "Some class attendance could not be saved.");
      setFeedback({
        type: "success",
        message: `Marked ${batches.reduce((count, batch) => count + batch.students.length, 0)} subject attendance records as ${markPresent ? "Present" : "Absent"} for ${dateStr}.`,
      });
      if (onRefreshParent) onRefreshParent();
      await fetchSpreadsheetData();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Batch mark update failed." });
      await fetchSpreadsheetData();
    }
  };

  // Clear all markings for a day
  const handleClearAllForDate = async (dateStr: string) => {
    if (selectedLessonId === "all") {
      setFeedback({ type: "error", message: "Select a subject before clearing monthly attendance." });
      return;
    }
    setColumnMenuDate(null);
    setMatrix((prev) => {
      const nextMatrix = { ...prev };
      students.forEach((st) => {
        if (nextMatrix[st.id]) {
          const updated = { ...nextMatrix[st.id] };
          delete updated[dateStr];
          nextMatrix[st.id] = updated;
        }
      });
      return nextMatrix;
    });

    // Delete records for each student on this date
    try {
      const deletePromises = students
        .map((st) => matrix[st.id]?.[dateStr]?.id)
        .filter(Boolean)
        .map((id) => api.delete("attendance", id!));
      const deleteResults = await Promise.all(deletePromises);
      const failedResult = deleteResults.find((result) => !result?.success);
      if (failedResult) throw new Error(failedResult.message || "Some attendance marks could not be cleared.");
      setFeedback({ type: "success", message: `Cleared attendance marks for ${dateStr}.` });
      if (onRefreshParent) onRefreshParent();
      await fetchSpreadsheetData();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Failed to clear attendance marks." });
      await fetchSpreadsheetData();
    }
  };

  // ─── Export CSV Spreadsheet ────────────────────────────────────────────────
  const handleExportSpreadsheetCsv = () => {
    if (selectedLessonId === "all") {
      setFeedback({ type: "error", message: "Select a subject to export its monthly attendance register." });
      return;
    }
    if (students.length === 0 || dates.length === 0) {
      setFeedback({ type: "error", message: "No attendance data to export." });
      return;
    }

    const headers = [
      "Roll No",
      "Student Name",
      ...dates.map((d) => `"${d.day_num} (${d.day_name})"`),
      "Present",
      "Absent",
      "Total Marked",
      "Attendance Rate (%)",
    ];

    const rows = students.map((st) => {
      const stCells = dates.map((d) => {
        const cell = matrix[st.id]?.[d.date];
        if (cell === undefined || cell === null) return `"-"`;
        return cell.present ? `"P"` : `"A"`;
      });
      const stat = studentStats[st.id] || { present: 0, absent: 0, total: 0, rate: 0 };
      return [
        `"${st.roll || ""}"`,
        `"${st.name} ${st.surname}"`,
        ...stCells,
        stat.present,
        stat.absent,
        stat.total,
        `"${stat.rate}%"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_spreadsheet_${selectedMonth}_class_${selectedClassId || "all"}_lesson_${selectedLessonId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white animate-in slide-in-from-top ${
            feedback.type === "success" ? "bg-emerald-600 shadow-emerald-500/20" : "bg-rose-600 shadow-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">বাংলাদেশি দৈনিক হাজিরা খাতা</h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Take attendance by class and date · Friday and Saturday are weekly holidays</p>
        </div>
        <div className="inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-gray-700 dark:bg-gray-900" role="group" aria-label="Attendance view">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            aria-pressed={viewMode === "daily"}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${viewMode === "daily" ? "bg-[#006a4e] text-white shadow-sm" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-gray-800"}`}
          >
            Daily Roll Call
          </button>
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            aria-pressed={viewMode === "monthly"}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${viewMode === "monthly" ? "bg-[#006a4e] text-white shadow-sm" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-gray-800"}`}
          >
            Monthly Register
          </button>
        </div>
      </div>

      {/* ─── Spreadsheet Top Controls & Filter Bar ────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap print:hidden">
        
        {/* Left: Class Selection & Live Search */}
        <div className="flex items-center flex-wrap gap-2.5 flex-1 min-w-[280px]">
          {/* Class Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Class:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs md:text-sm font-semibold py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  Class {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subject:</span>
            <select
              value={selectedLessonId}
              onChange={(event) => setSelectedLessonId(event.target.value)}
              className="max-w-[240px] text-xs md:text-sm font-semibold py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {availableLessons.map((lesson) => {
                const className = lesson.class_name
                  || classes.find((item) => String(item.id) === String(lesson.class_id))?.name
                  || "";
                const subjectName = lesson.subject_name || lesson.name;
                const label = selectedClassId === "all" ? `${subjectName} · Class ${className}` : subjectName;
                return <option key={lesson.id} value={String(lesson.id)}>{label}</option>;
              })}
            </select>
          </label>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter student in spreadsheet..."
              className="w-full pl-8 pr-7 py-1.5 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {viewMode === "daily" ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-gray-700 dark:bg-gray-900">
            <button type="button" onClick={() => changeAttendanceDate(-1)} aria-label="Previous day" className="rounded-md p-1.5 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-gray-800">
              <ChevronLeft size={16} />
            </button>
            <label className="flex items-center gap-2 px-1.5">
              <Calendar size={15} className="text-[#006a4e] dark:text-emerald-300" />
              <span className="sr-only">Attendance date</span>
              <input type="date" value={selectedDate} onChange={(event) => setAttendanceDate(event.target.value)} className="w-[145px] border-0 bg-transparent p-0 text-xs font-bold text-slate-800 focus:ring-0 dark:text-slate-100" />
            </label>
            <button type="button" onClick={() => changeAttendanceDate(1)} aria-label="Next day" className="rounded-md p-1.5 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-gray-800">
              <ChevronRight size={16} />
            </button>
            {selectedDate !== todayYmd && (
              <button type="button" onClick={() => setAttendanceDate(todayYmd)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-[#006a4e] hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-300">
                Today
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-gray-700">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={14} className="text-[#006a4e] dark:text-emerald-300" />
              <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[120px] text-center">
                {formatMonthTitle(selectedMonth)}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
            {selectedMonth !== currentMonthStr && (
              <button
                onClick={handleCurrentMonth}
                className="text-[11px] font-semibold text-[#006a4e] dark:text-emerald-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-gray-700 hover:bg-emerald-50 transition ml-1"
              >
                Current Month
              </button>
            )}
          </div>
        )}

        {/* Right: Legend & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status Legends */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-medium bg-slate-50 dark:bg-gray-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> P = Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> A = Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-gray-600"></span> — = Unmarked
            </span>
          </div>

          {/* Export & Refresh */}
          <button
            onClick={handleExportSpreadsheetCsv}
            disabled={selectedLessonId === "all"}
            title="Export Spreadsheet to CSV"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100 dark:hover:bg-gray-750 border border-slate-200 dark:border-gray-700 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handlePrint}
            title="Print Attendance Spreadsheet"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100 dark:hover:bg-gray-750 border border-slate-200 dark:border-gray-700 transition cursor-pointer"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={fetchSpreadsheetData}
            disabled={loading}
            title="Refresh Spreadsheet"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100 dark:hover:bg-gray-750 border border-slate-200 dark:border-gray-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {viewMode === "daily" ? (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-5">
          {[
            { label: "Subject roster", value: dailyLessonGroups.reduce((count, group) => count + group.students.length, 0), color: "text-slate-800 dark:text-slate-100" },
            { label: "Present", value: dailySummary.present, color: "text-emerald-700 dark:text-emerald-300" },
            { label: "Absent", value: dailySummary.absent, color: "text-rose-700 dark:text-rose-300" },
            { label: "Not marked", value: dailySummary.unmarked, color: "text-amber-700 dark:text-amber-300" },
            { label: "Daily attendance", value: `${dailySummary.rate}%`, color: "text-[#006a4e] dark:text-emerald-300" },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-slate-100 px-3 py-2 dark:border-gray-700">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      ) : selectedLessonId !== "all" ? (
      /* ─── Calculated Month Statistics Banner ────────────────────────────── */
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Students</span>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {students.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <UserCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Present Marks</span>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {overallSummary.present}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <UserX size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Absent Marks</span>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
              {overallSummary.absent}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#707E94]/10 dark:bg-[#707E94]/20 text-[#707E94] dark:text-[#a4b3c7] flex items-center justify-center font-bold">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Class Monthly Rate</span>
            <div className="flex items-baseline gap-1.5">
              <p className="text-lg font-extrabold text-[#707E94] dark:text-[#a4b3c7]">
                {overallSummary.rate}%
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                ({overallSummary.totalMarked} records)
              </span>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {viewMode === "daily" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Daily class register · {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h3>
              <p className={`mt-0.5 text-xs ${selectedDateIsWeekend ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                {selectedDateIsWeekend ? "Weekly holiday (Friday / Saturday) · Records can still be viewed or updated." : "Select Present or Absent for each student. Unmarked students are not included in the daily rate."}
              </p>
            </div>
            {(role === "admin" || role === "teacher") && dailyLessonGroups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading || students.length === 0}
                  onClick={() => handleMarkAllForDate(selectedDate, true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserCheck size={14} /> Mark all present
                </button>
                <button
                  type="button"
                  disabled={loading || students.length === 0}
                  onClick={() => handleMarkAllForDate(selectedDate, false)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-gray-800 dark:text-rose-300"
                >
                  <UserX size={14} /> Mark all absent
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
              <RefreshCw size={26} className="animate-spin text-[#006a4e]" />
              <p className="text-xs font-medium">Loading class attendance register...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Users size={34} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No students found for this class.</p>
              <p className="text-xs">Choose another class or add students to the class.</p>
            </div>
          ) : dailyLessonGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Calendar size={34} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No subject lessons are configured for this class.</p>
              <p className="text-xs">Add a class lesson before recording subject-wise attendance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {dailyLessonGroups.map((group) => {
                const classPresent = group.students.filter((student) => lessonMatrix[student.id]?.[selectedDate]?.[group.id]?.present).length;
                const classAbsent = group.students.filter((student) => {
                  const record = lessonMatrix[student.id]?.[selectedDate]?.[group.id];
                  return record && !record.present;
                }).length;
                const classMarked = classPresent + classAbsent;
                return (
                  <div key={group.id} className="border-b border-slate-200 last:border-b-0 dark:border-gray-700">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 px-4 py-2.5 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#006a4e] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Class {group.className}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{group.subjectName}</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">{group.lesson.name}{group.lesson.start_time ? ` · ${group.lesson.start_time.slice(0, 5)}` : ""} · {group.students.length} students · {classMarked} marked · {classPresent} present · {classAbsent} absent</p>
                        </div>
                      </div>
                      {(role === "admin" || role === "teacher") && (
                        <div className="flex gap-1.5">
                          <button type="button" disabled={savingKey !== null} onClick={() => handleMarkAllForDate(selectedDate, true, group.students, [group])} className="rounded border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-gray-800 dark:text-emerald-300">
                            Present all
                          </button>
                          <button type="button" disabled={savingKey !== null} onClick={() => handleMarkAllForDate(selectedDate, false, group.students, [group])} className="rounded border border-rose-200 bg-white px-2 py-1 text-[10px] font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-gray-800 dark:text-rose-300">
                            Absent all
                          </button>
                        </div>
                      )}
                    </div>
                    <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-white text-[10px] uppercase tracking-wide text-slate-500 dark:bg-gray-800 dark:text-slate-400">
                          <th className="w-16 px-4 py-2 text-center">Roll</th>
                          <th className="px-4 py-2">Student name</th>
                          <th className="w-36 px-4 py-2 text-center">Attendance</th>
                          <th className="w-56 px-4 py-2 text-right">Mark status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {group.students.map((student, index) => {
                          const attendance = lessonMatrix[student.id]?.[selectedDate]?.[group.id];
                          const saving = savingKey === `${student.id}_${selectedDate}_${group.id}`;
                          return (
                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-gray-750">
                              <td className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">{student.roll || index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-[#006a4e] dark:bg-gray-700 dark:text-emerald-300">
                                    {student.img ? <img src={student.img} alt="" className="h-full w-full object-cover" /> : (student.name?.[0] || "S").toUpperCase()}
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-100">{student.name} {student.surname}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {saving ? <span className="inline-flex items-center gap-1 text-slate-500"><RefreshCw size={13} className="animate-spin" /> Saving</span> : attendance ? (
                                  <span className={`inline-flex min-w-20 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${attendance.present ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                                    {attendance.present ? "উপস্থিত · Present" : "অনুপস্থিত · Absent"}
                                  </span>
                                ) : <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Not marked</span>}
                              </td>
                              <td className="px-4 py-3">
                                {(role === "admin" || role === "teacher") ? (
                                  <div className="flex justify-end gap-2">
                                    <button type="button" disabled={saving || Boolean(attendance?.present)} onClick={() => setDailyAttendance(student, group.lesson, true)} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold disabled:cursor-default ${attendance?.present ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-gray-800 dark:text-emerald-300"}`}>
                                      <CheckCircle2 size={13} /> Present
                                    </button>
                                    <button type="button" disabled={saving || Boolean(attendance && !attendance.present)} onClick={() => setDailyAttendance(student, group.lesson, false)} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold disabled:cursor-default ${attendance && !attendance.present ? "border-rose-700 bg-rose-700 text-white" : "border-rose-200 bg-white text-rose-800 hover:bg-rose-50 dark:border-rose-900 dark:bg-gray-800 dark:text-rose-300"}`}>
                                      <X size={13} /> Absent
                                    </button>
                                  </div>
                                ) : <p className="text-right text-[11px] text-slate-500">View only</p>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : selectedLessonId === "all" ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Users size={32} className="text-[#006a4e] dark:text-emerald-300" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Choose a subject register</h3>
          <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">Monthly attendance is maintained separately for each subject. Select a subject above to view or update its register.</p>
        </div>
      ) : (
      /* ─── Monthly Attendance Register ───────────────────────────────────── */
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-xs overflow-hidden relative">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <p className="text-xs font-medium">Generating interactive attendance spreadsheet...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Users size={36} className="text-slate-300 dark:text-slate-600 mb-1" />
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              No students found for this class
            </p>
            <p className="text-slate-400">Please select another class or add students first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[72vh] relative">
            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
              {/* Table Header: Sticky Top & Sticky Left */}
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-gray-850 border-b border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 font-bold shadow-2xs">
                <tr>
                  {/* Sticky Column 1: Roll */}
                  <th className="sticky left-0 z-30 bg-slate-100 dark:bg-gray-850 py-2.5 px-3 w-14 text-center border-r border-slate-200 dark:border-gray-700">
                    Roll
                  </th>

                  {/* Sticky Column 2: Student Particulars */}
                  <th className="sticky left-14 z-30 bg-slate-100 dark:bg-gray-850 py-2.5 px-4 min-w-[190px] border-r-2 border-slate-300 dark:border-gray-650 shadow-xs">
                    Student Name
                  </th>

                  {/* Date Columns: 1 to 31 */}
                  {dates.map((d) => {
                    const isToday = d.date === todayYmd;
                    const isMenuOpen = columnMenuDate === d.date;

                    return (
                      <th
                        key={d.date}
                        className={`py-2 px-1 text-center min-w-[38px] max-w-[42px] border-r border-slate-200 dark:border-gray-700/60 relative group ${
                          isToday
                            ? "bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-extrabold ring-1 ring-indigo-400 inset-0"
                            : d.is_weekend
                            ? "bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-normal leading-tight opacity-75">
                            {d.day_name}
                          </span>
                          <span className="text-xs font-black leading-tight">
                            {d.day_num}
                          </span>
                        </div>

                        {/* Interactive Column Menu Button (Teacher / Admin can mark whole day) */}
                        {(role === "admin" || role === "teacher") && (
                          <div className="relative mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setColumnMenuDate(isMenuOpen ? null : d.date);
                              }}
                              title={`Bulk mark options for ${d.date}`}
                              className="w-4 h-4 rounded text-[9px] font-bold bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition inline-flex items-center justify-center opacity-40 group-hover:opacity-100 cursor-pointer"
                            >
                              ▼
                            </button>

                            {/* Column Popover Action Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 p-2 min-w-[140px] text-left text-xs font-medium space-y-1 animate-in fade-in"
                              >
                                <p className="text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-gray-700 pb-1 mb-1">
                                  {d.date} Options:
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleMarkAllForDate(d.date, true)}
                                  className="w-full text-left px-2 py-1 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5"
                                >
                                  <Check size={12} /> Mark All Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkAllForDate(d.date, false)}
                                  className="w-full text-left px-2 py-1 rounded-md text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                                >
                                  <X size={12} /> Mark All Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClearAllForDate(d.date)}
                                  className="w-full text-left px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center gap-1.5"
                                >
                                  <RotateCcw size={12} /> Clear Day
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}

                  {/* Calculated Columns (Sticky Right on Wide view) */}
                  <th className="py-2.5 px-2 text-center w-14 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-l-2 border-slate-300 dark:border-gray-650 font-bold">
                    P
                  </th>
                  <th className="py-2.5 px-2 text-center w-14 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-l border-slate-200 dark:border-gray-700 font-bold">
                    A
                  </th>
                  <th className="py-2.5 px-2 text-center w-16 bg-slate-100 dark:bg-gray-850 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-gray-700 font-bold">
                    Total
                  </th>
                  <th className="py-2.5 px-3 text-center w-20 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-l border-slate-200 dark:border-gray-700 font-black">
                    Rate %
                  </th>
                </tr>
              </thead>

              {/* Table Body: Student Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-gray-750 font-medium">
                {students.map((st) => {
                  const stat = studentStats[st.id] || { present: 0, absent: 0, total: 0, rate: 0 };
                  const rateBadgeColor =
                    stat.total === 0
                      ? "text-slate-400 bg-slate-50 border-slate-200"
                      : stat.rate >= 85
                      ? "text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : stat.rate >= 70
                      ? "text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                      : "text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300";

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition group"
                    >
                      {/* Sticky Col 1: Roll */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-indigo-50/50 dark:group-hover:bg-gray-750 py-2 px-3 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-gray-700">
                        {st.roll || "—"}
                      </td>

                      {/* Sticky Col 2: Student Avatar & Name */}
                      <td className="sticky left-14 z-10 bg-white dark:bg-gray-800 group-hover:bg-indigo-50/50 dark:group-hover:bg-gray-750 py-2 px-4 border-r-2 border-slate-300 dark:border-gray-650 shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#707E94]/15 dark:bg-[#707E94]/20 flex items-center justify-center text-[10px] font-bold text-[#707E94] dark:text-[#a4b3c7] overflow-hidden flex-shrink-0">
                            {st.img ? (
                              <img src={st.img} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(st.name?.[0] || "S").toUpperCase()}</span>
                            )}
                          </div>
                          <div className="truncate max-w-[160px]">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                              {st.name} {st.surname}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date Cells */}
                      {dates.map((d) => {
                        const cell = matrix[st.id]?.[d.date];
                        const cellKey = `${st.id}_${d.date}`;
                        const isSaving = savingKey === cellKey;
                        const isToday = d.date === todayYmd;

                        return (
                          <td
                            key={d.date}
                            onClick={() => handleCellClick(st.id, d.date)}
                            title={`${st.name}: ${d.date} (${cell === undefined ? "Unmarked" : cell.present ? "Present" : "Absent"}). Click to toggle.`}
                            className={`py-1.5 px-0.5 text-center border-r border-slate-200/80 dark:border-gray-700/60 select-none cursor-pointer transition ${
                              isToday
                                ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                                : d.is_weekend
                                ? "bg-slate-50/60 dark:bg-gray-850/40"
                                : ""
                            } hover:scale-105 active:scale-95`}
                          >
                            <div className="flex items-center justify-center">
                              {isSaving ? (
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : cell === undefined || cell === null ? (
                                <span className="inline-block w-6 h-6 leading-6 rounded-md text-[11px] font-bold text-slate-300 dark:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition">
                                  —
                                </span>
                              ) : cell.present ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500 text-white font-extrabold text-[11px] shadow-2xs hover:bg-emerald-600 transition">
                                  P
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-500 text-white font-extrabold text-[11px] shadow-2xs hover:bg-rose-600 transition">
                                  A
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Row Calculated Statistics */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-l-2 border-slate-300 dark:border-gray-650">
                        {stat.present}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/10 border-l border-slate-200 dark:border-gray-700">
                        {stat.absent}
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-gray-700">
                        {stat.total}
                      </td>
                      <td className="py-2 px-2.5 text-center border-l border-slate-200 dark:border-gray-700">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${rateBadgeColor}`}>
                          {stat.total > 0 ? `${stat.rate}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer: Column Summary Calculations per Date */}
              <tfoot className="sticky bottom-0 z-20 bg-slate-100 dark:bg-gray-850 border-t-2 border-slate-300 dark:border-gray-650 font-bold text-slate-800 dark:text-slate-100 shadow-sm">
                <tr>
                  {/* Sticky Footer Left */}
                  <td
                    colSpan={2}
                    className="sticky left-0 z-30 bg-slate-100 dark:bg-gray-850 py-3 px-4 border-r-2 border-slate-300 dark:border-gray-650 text-xs font-bold uppercase tracking-wider"
                  >
                    <div className="flex items-center justify-between">
                      <span>Daily Class Rate</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({students.length} students)
                      </span>
                    </div>
                  </td>

                  {/* Daily Date Summary Cells */}
                  {dates.map((d) => {
                    const dStat = dateStats[d.date] || { present: 0, absent: 0, total: 0, rate: 0 };
                    const isToday = d.date === todayYmd;

                    return (
                      <td
                        key={d.date}
                        className={`py-2 px-0.5 text-center border-r border-slate-200 dark:border-gray-700 ${
                          isToday
                            ? "bg-indigo-100/60 dark:bg-indigo-950/50"
                            : d.is_weekend
                            ? "bg-amber-50/30 dark:bg-amber-950/20"
                            : ""
                        }`}
                      >
                        {dStat.total > 0 ? (
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              {dStat.present}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {dStat.rate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Calculated Overall Totals */}
                  <td className="py-2.5 px-2 text-center text-emerald-700 dark:text-emerald-400 font-black border-l-2 border-slate-300 dark:border-gray-650">
                    {overallSummary.present}
                  </td>
                  <td className="py-2.5 px-2 text-center text-rose-700 dark:text-rose-400 font-black border-l border-slate-200 dark:border-gray-700">
                    {overallSummary.absent}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300 font-bold border-l border-slate-200 dark:border-gray-700">
                    {overallSummary.totalMarked}
                  </td>
                  <td className="py-2.5 px-2 text-center border-l border-slate-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-950/40">
                    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-black text-indigo-700 dark:text-indigo-300">
                      {overallSummary.rate}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Spreadsheet Instruction Hint */}
      {viewMode === "monthly" && <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 print:hidden">
        <p>
          <strong className="text-slate-700 dark:text-slate-300">Tip:</strong> Click any cell to cycle through:{" "}
          <span className="text-emerald-600 font-semibold">[P] Present</span> &rarr;{" "}
          <span className="text-rose-600 font-semibold">[A] Absent</span> &rarr;{" "}
          <span className="text-slate-500 font-semibold">[—] Clear</span>. Attendance rate is calculated dynamically.
        </p>
        <p>
          Use column ▼ dropdown to batch mark the entire class for that date.
        </p>
      </div>}
    </div>
  );
};

export default AttendanceSpreadsheet;
