import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Filter,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAccessRole } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: number | string;
  date: string;
  present: boolean | number;
  student_id: string;
  student_name?: string;
  student_surname?: string;
  student_img?: string;
  student_class_id?: number | string;
  lesson_id?: number | string;
  lesson_name?: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
  teacher_surname?: string;
  notes?: string;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  rate: number;
}

interface ClassItem {
  id: number | string;
  name: string;
  grade_level?: number | string;
  capacity?: number;
}

interface LessonItem {
  id: number | string;
  name: string;
  subject_id?: number | string;
  class_id?: number | string;
  teacher_id?: string;
}

interface StudentItem {
  id: string;
  name: string;
  surname: string;
  username?: string;
  img?: string;
  class_id?: number | string;
  class_name?: string;
  grade_level?: number | string;
}

// ─── Fallback Sample Data ───────────────────────────────────────────────────

const FALLBACK_CLASSES: ClassItem[] = [
  { id: 1, name: "1A", grade_level: 1 },
  { id: 2, name: "1B", grade_level: 1 },
  { id: 3, name: "2A", grade_level: 2 },
  { id: 4, name: "2B", grade_level: 2 },
  { id: 7, name: "4A", grade_level: 4 },
];

const FALLBACK_STUDENTS: StudentItem[] = [
  { id: "s1", name: "John", surname: "Connor", username: "johnconnor", class_id: 1, class_name: "1A", img: "https://images.pexels.com/photos/2888150/pexels-photo-2888150.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { id: "s2", name: "Peter", surname: "Parker", username: "peterparker", class_id: 2, class_name: "1B", img: "https://images.pexels.com/photos/936126/pexels-photo-936126.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { id: "s3", name: "Gwen", surname: "Stacy", username: "gwenstacy", class_id: 3, class_name: "2A", img: "https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { id: "s4", name: "Dick", surname: "Grayson", username: "dickgrayson", class_id: 4, class_name: "2B", img: "https://images.pexels.com/photos/428328/pexels-photo-428328.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { id: "s5", name: "Jonathan", surname: "Lewis", username: "jonathanlewis", class_id: 7, class_name: "4A", img: "https://images.pexels.com/photos/1187765/pexels-photo-1187765.jpeg?auto=compress&cs=tinysrgb&w=1200" },
];

const FALLBACK_LESSONS: LessonItem[] = [
  { id: 1, name: "Math 101", class_id: 1 },
  { id: 2, name: "English Literature", class_id: 1 },
  { id: 3, name: "Physics Fundamentals", class_id: 2 },
  { id: 4, name: "Chemistry Lab", class_id: 2 },
  { id: 5, name: "Biology Exploration", class_id: 3 },
  { id: 6, name: "World History", class_id: 4 },
];

const FALLBACK_RECORDS: AttendanceRecord[] = [
  { id: 1, date: "2026-10-06", present: true, student_id: "s1", student_name: "John", student_surname: "Connor", class_name: "1A", student_class_id: 1, lesson_name: "Math 101", subject_name: "Mathematics" },
  { id: 2, date: "2026-10-06", present: true, student_id: "s2", student_name: "Peter", student_surname: "Parker", class_name: "1B", student_class_id: 2, lesson_name: "Physics Fundamentals", subject_name: "Physics" },
  { id: 3, date: "2026-10-06", present: false, student_id: "s3", student_name: "Gwen", student_surname: "Stacy", class_name: "2A", student_class_id: 3, lesson_name: "Biology Exploration", subject_name: "Biology" },
  { id: 4, date: "2026-10-05", present: true, student_id: "s1", student_name: "John", student_surname: "Connor", class_name: "1A", student_class_id: 1, lesson_name: "Math 101", subject_name: "Mathematics" },
  { id: 5, date: "2026-10-05", present: true, student_id: "s4", student_name: "Dick", student_surname: "Grayson", class_name: "2B", student_class_id: 4, lesson_name: "World History", subject_name: "History" },
  { id: 6, date: "2026-10-04", present: false, student_id: "s5", student_name: "Jonathan", student_surname: "Lewis", class_name: "4A", student_class_id: 7, lesson_name: "English Literature", subject_name: "English" },
];

export const AttendanceSection: React.FC = () => {
  const role = useAccessRole();
  const { siteName } = useSiteSettings();
  const { theme } = useTheme();

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<"records" | "rollcall" | "classes">("records");

  // Global Filter States for Records Tab
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "yesterday" | "week" | "month" | "custom">("all");
  const [customDate, setCustomDate] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data States
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Summary Metrics
  const [summary, setSummary] = useState<AttendanceSummary>({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0,
  });

  // Roll Call (Daily Sheet) State
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [rollCallDate, setRollCallDate] = useState<string>(todayStr);
  const [rollCallClassId, setRollCallClassId] = useState<string>("");
  const [rollCallLessonId, setRollCallLessonId] = useState<string>("");
  const [rollCallRoster, setRollCallRoster] = useState<Record<string, { present: boolean; note?: string }>>({});
  const [rollCallFilterSearch, setRollCallFilterSearch] = useState("");
  const [rollCallSaving, setRollCallSaving] = useState(false);

  // Class-wise Dynamic Students for Roll Call
  const [classStudents, setClassStudents] = useState<StudentItem[]>([]);
  const [classStudentsLoading, setClassStudentsLoading] = useState<boolean>(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [modalForm, setModalForm] = useState({
    student_id: "",
    class_id: "",
    lesson_id: "",
    date: todayStr,
    present: true,
    notes: "",
  });

  // Auto-dismiss feedback message
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // ─── Fetch Supporting Entities (Classes, Lessons, All Students) ───────────────

  const loadSupportingData = useCallback(async () => {
    try {
      const [resClasses, resLessons, resStudents] = await Promise.all([
        api.getAll("classes", { limit: 100 }),
        api.getAll("lessons", { limit: 200 }),
        api.getAll("students", { limit: 500 }),
      ]);

      if (resClasses?.success && Array.isArray(resClasses.data?.classes)) {
        setClasses(resClasses.data.classes);
        if (!rollCallClassId && resClasses.data.classes.length > 0) {
          setRollCallClassId(String(resClasses.data.classes[0].id));
        }
      } else {
        setClasses(FALLBACK_CLASSES);
        if (!rollCallClassId) setRollCallClassId(String(FALLBACK_CLASSES[0].id));
      }

      if (resLessons?.success && Array.isArray(resLessons.data?.lessons)) {
        setLessons(resLessons.data.lessons);
      } else {
        setLessons(FALLBACK_LESSONS);
      }

      if (resStudents?.success && Array.isArray(resStudents.data?.students)) {
        setAllStudents(resStudents.data.students);
      } else {
        setAllStudents(FALLBACK_STUDENTS);
      }
    } catch {
      setClasses(FALLBACK_CLASSES);
      setLessons(FALLBACK_LESSONS);
      setAllStudents(FALLBACK_STUDENTS);
    }
  }, [rollCallClassId]);

  useEffect(() => {
    loadSupportingData();
  }, [loadSupportingData]);

  // ─── Dynamic Class-Wise Students for Roll Call ─────────────────────────────
  // When admin selects a Class in Roll Call, fetch students for that class dynamically
  useEffect(() => {
    if (!rollCallClassId) return;

    let isMounted = true;
    setClassStudentsLoading(true);

    // Call students API with class_id parameter
    api.getAll("students", { class_id: rollCallClassId, limit: 300 })
      .then((res) => {
        if (!isMounted) return;

        let studentsList: StudentItem[] = [];
        if (res?.success && Array.isArray(res.data?.students) && res.data.students.length > 0) {
          studentsList = res.data.students;
        } else {
          // Fallback: filter loaded allStudents by class_id or class_name
          const selectedClassObj = classes.find((c) => String(c.id) === String(rollCallClassId));
          studentsList = allStudents.filter(
            (s) =>
              String(s.class_id) === String(rollCallClassId) ||
              (selectedClassObj && s.class_name === selectedClassObj.name)
          );
        }

        setClassStudents(studentsList);

        // Fetch existing attendance records for this class & date to pre-populate
        api.getAll("attendance", { date: rollCallDate, class_id: rollCallClassId, limit: 300 })
          .then((attRes) => {
            if (!isMounted) return;
            const existingMap: Record<string, { present: boolean; note?: string }> = {};

            if (attRes?.success && Array.isArray(attRes.data?.attendance) && attRes.data.attendance.length > 0) {
              attRes.data.attendance.forEach((r: any) => {
                existingMap[r.student_id] = {
                  present: Boolean(r.present),
                  note: r.notes || "",
                };
              });
            }

            // Build fresh roster for each student
            const nextRoster: Record<string, { present: boolean; note?: string }> = {};
            studentsList.forEach((st) => {
              if (existingMap[st.id] !== undefined) {
                nextRoster[st.id] = existingMap[st.id];
              } else {
                nextRoster[st.id] = { present: true, note: "" };
              }
            });
            setRollCallRoster(nextRoster);
          })
          .catch(() => {
            const nextRoster: Record<string, { present: boolean; note?: string }> = {};
            studentsList.forEach((st) => {
              nextRoster[st.id] = { present: true, note: "" };
            });
            setRollCallRoster(nextRoster);
          });
      })
      .catch(() => {
        if (!isMounted) return;
        const selectedClassObj = classes.find((c) => String(c.id) === String(rollCallClassId));
        const fallbackList = allStudents.filter(
          (s) =>
            String(s.class_id) === String(rollCallClassId) ||
            (selectedClassObj && s.class_name === selectedClassObj.name)
        );
        setClassStudents(fallbackList);
        const nextRoster: Record<string, { present: boolean; note?: string }> = {};
        fallbackList.forEach((st) => {
          nextRoster[st.id] = { present: true, note: "" };
        });
        setRollCallRoster(nextRoster);
      })
      .finally(() => {
        if (isMounted) setClassStudentsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rollCallClassId, rollCallDate, classes, allStudents]);

  // Lessons for the chosen roll-call class
  const classLessons = useMemo(() => {
    if (!rollCallClassId) return lessons;
    const filtered = lessons.filter(
      (l) => !l.class_id || String(l.class_id) === String(rollCallClassId)
    );
    return filtered.length > 0 ? filtered : lessons;
  }, [lessons, rollCallClassId]);

  // Auto-select lesson for roll-call when class changes
  useEffect(() => {
    if (classLessons.length > 0) {
      setRollCallLessonId(String(classLessons[0].id));
    } else if (lessons.length > 0) {
      setRollCallLessonId(String(lessons[0].id));
    }
  }, [classLessons, lessons, rollCallClassId]);

  // ─── Filter Bar: Dynamic Students of Selected Class ────────────────────────
  // When selectedClass changes in the Records tab, show only students of that class
  const classFilterStudents = useMemo(() => {
    if (selectedClass === "all") return allStudents;
    const selectedClassObj = classes.find((c) => String(c.id) === String(selectedClass));
    return allStudents.filter(
      (s) =>
        String(s.class_id) === String(selectedClass) ||
        (selectedClassObj && s.class_name === selectedClassObj.name)
    );
  }, [allStudents, selectedClass, classes]);

  // Date Filter Params Resolver
  const getDateFilterParams = useCallback(() => {
    const today = new Date();
    const formatYmd = (d: Date) => d.toISOString().split("T")[0];

    if (datePreset === "today") {
      return { date: formatYmd(today) };
    }
    if (datePreset === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { date: formatYmd(yesterday) };
    }
    if (datePreset === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { start_date: formatYmd(weekAgo), end_date: formatYmd(today) };
    }
    if (datePreset === "month") {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { start_date: formatYmd(monthAgo), end_date: formatYmd(today) };
    }
    if (datePreset === "custom" && customDate) {
      return { date: customDate };
    }
    return {};
  }, [datePreset, customDate]);

  // ─── Fetch Attendance Records ──────────────────────────────────────────────

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const dateParams = getDateFilterParams();
      const params: Record<string, string | number> = {
        page,
        limit,
        ...dateParams,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedClass !== "all") params.class_id = selectedClass;
      if (selectedStudent !== "all") params.student_id = selectedStudent;
      if (selectedStatus !== "all") params.status = selectedStatus;

      const res = await api.getAll("attendance", params);

      if (res?.success && res.data) {
        const rawList: AttendanceRecord[] = res.data.attendance || [];
        setRecords(rawList);

        if (res.data.pagination) {
          setTotalRecords(res.data.pagination.total || rawList.length);
          setTotalPages(res.data.pagination.pages || 1);
        } else {
          setTotalRecords(rawList.length);
          setTotalPages(Math.ceil(rawList.length / limit) || 1);
        }

        if (res.data.summary) {
          setSummary(res.data.summary);
        } else {
          const present = rawList.filter((r) => Boolean(r.present)).length;
          const total = rawList.length;
          const absent = total - present;
          setSummary({
            total,
            present,
            absent,
            rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
          });
        }
      } else {
        // Fallback demo data
        let filtered = [...FALLBACK_RECORDS];
        if (search.trim()) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.student_name?.toLowerCase().includes(q) ||
              r.student_surname?.toLowerCase().includes(q) ||
              r.class_name?.toLowerCase().includes(q) ||
              r.lesson_name?.toLowerCase().includes(q)
          );
        }
        if (selectedClass !== "all") {
          filtered = filtered.filter((r) => String(r.student_class_id) === String(selectedClass));
        }
        if (selectedStudent !== "all") {
          filtered = filtered.filter((r) => String(r.student_id) === String(selectedStudent));
        }
        if (selectedStatus !== "all") {
          const isPres = selectedStatus === "present";
          filtered = filtered.filter((r) => Boolean(r.present) === isPres);
        }
        setRecords(filtered);
        setTotalRecords(filtered.length);
        setTotalPages(1);
        const pres = filtered.filter((r) => Boolean(r.present)).length;
        setSummary({
          total: filtered.length,
          present: pres,
          absent: filtered.length - pres,
          rate: filtered.length > 0 ? Math.round((pres / filtered.length) * 100) : 0,
        });
      }
    } catch {
      setRecords(FALLBACK_RECORDS);
      setTotalRecords(FALLBACK_RECORDS.length);
      setTotalPages(1);
      setSummary({ total: 6, present: 4, absent: 2, rate: 66.7 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedClass, selectedStudent, selectedStatus, getDateFilterParams]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedClass, selectedStudent, selectedStatus, datePreset, customDate]);

  // ─── Inline Status Toggle ──────────────────────────────────────────────────

  const handleToggleStatus = async (record: AttendanceRecord) => {
    const newStatus = !record.present;
    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, present: newStatus } : r))
    );
    setSummary((prev) => {
      const nextPresent = newStatus ? prev.present + 1 : Math.max(0, prev.present - 1);
      const nextAbsent = newStatus ? Math.max(0, prev.absent - 1) : prev.absent + 1;
      return {
        ...prev,
        present: nextPresent,
        absent: nextAbsent,
        rate: prev.total > 0 ? Math.round((nextPresent / prev.total) * 1000) / 10 : 0,
      };
    });

    try {
      const res = await api.update("attendance", record.id, {
        present: newStatus ? 1 : 0,
        date: record.date,
        student_id: record.student_id,
        lesson_id: record.lesson_id,
      });
      if (res?.success) {
        setFeedback({
          type: "success",
          message: `Updated ${record.student_name || "student"} to ${newStatus ? "Present" : "Absent"}`,
        });
      } else {
        fetchRecords();
        setFeedback({ type: "error", message: res?.message || "Failed to update attendance status" });
      }
    } catch (err: any) {
      fetchRecords();
      setFeedback({ type: "error", message: err?.message || "Network error updating attendance" });
    }
  };

  // ─── Delete Record ─────────────────────────────────────────────────────────

  const handleDeleteRecord = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const res = await api.delete("attendance", deleteId);
      if (res?.success) {
        setFeedback({ type: "success", message: "Attendance record deleted successfully." });
        setDeleteId(null);
        fetchRecords();
      } else {
        setFeedback({ type: "error", message: res?.message || "Failed to delete record" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to delete record" });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Single Record Add / Edit with Dynamic Class Students ─────────────────

  const handleOpenAdd = () => {
    setEditingRecord(null);
    const initialClassId = classes[0]?.id ? String(classes[0].id) : "";
    const filteredClassStudents = allStudents.filter(
      (s) => !initialClassId || String(s.class_id) === initialClassId
    );
    const filteredClassLessons = lessons.filter(
      (l) => !l.class_id || String(l.class_id) === initialClassId
    );

    setModalForm({
      student_id: filteredClassStudents[0]?.id || (allStudents[0]?.id ?? ""),
      class_id: initialClassId,
      lesson_id: filteredClassLessons[0]?.id ? String(filteredClassLessons[0].id) : (lessons[0]?.id ? String(lessons[0].id) : ""),
      date: todayStr,
      present: true,
      notes: "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    const studentObj = allStudents.find((s) => s.id === rec.student_id);
    const determinedClassId = rec.student_class_id
      ? String(rec.student_class_id)
      : studentObj?.class_id
      ? String(studentObj.class_id)
      : "";

    setModalForm({
      student_id: rec.student_id,
      class_id: determinedClassId,
      lesson_id: rec.lesson_id ? String(rec.lesson_id) : "",
      date: rec.date || todayStr,
      present: Boolean(rec.present),
      notes: rec.notes || "",
    });
    setShowAddModal(true);
  };

  // Modal Dynamic Students
  const modalClassStudents = useMemo(() => {
    if (!modalForm.class_id) return allStudents;
    return allStudents.filter((s) => String(s.class_id) === String(modalForm.class_id));
  }, [allStudents, modalForm.class_id]);

  // Modal Dynamic Lessons
  const modalClassLessons = useMemo(() => {
    if (!modalForm.class_id) return lessons;
    const filtered = lessons.filter(
      (l) => !l.class_id || String(l.class_id) === String(modalForm.class_id)
    );
    return filtered.length > 0 ? filtered : lessons;
  }, [lessons, modalForm.class_id]);

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.student_id) {
      setFeedback({ type: "error", message: "Please select a student." });
      return;
    }
    if (!modalForm.lesson_id) {
      setFeedback({ type: "error", message: "Please select a lesson." });
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        date: modalForm.date,
        student_id: modalForm.student_id,
        lesson_id: modalForm.lesson_id,
        present: modalForm.present ? 1 : 0,
        notes: modalForm.notes,
      };

      let res;
      if (editingRecord) {
        res = await api.update("attendance", editingRecord.id, payload);
      } else {
        res = await api.create("attendance", payload);
      }

      if (res?.success) {
        setFeedback({
          type: "success",
          message: editingRecord
            ? "Attendance record updated successfully."
            : "New attendance record recorded successfully.",
        });
        setShowAddModal(false);
        fetchRecords();
      } else {
        setFeedback({ type: "error", message: res?.message || "Failed to save attendance record." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error saving attendance." });
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Roll Call Actions ─────────────────────────────────────────────────────

  const filteredRosterStudents = useMemo(() => {
    if (!rollCallFilterSearch.trim()) return classStudents;
    const q = rollCallFilterSearch.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.surname.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q))
    );
  }, [classStudents, rollCallFilterSearch]);

  const rollCallStats = useMemo(() => {
    const total = classStudents.length;
    let present = 0;
    classStudents.forEach((st) => {
      if (rollCallRoster[st.id]?.present) present++;
    });
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, rate };
  }, [classStudents, rollCallRoster]);

  const handleMarkAllRoster = (presentState: boolean) => {
    setRollCallRoster((prev) => {
      const next = { ...prev };
      classStudents.forEach((st) => {
        next[st.id] = { ...(next[st.id] || {}), present: presentState };
      });
      return next;
    });
  };

  const handleToggleRosterStudent = (studentId: string) => {
    setRollCallRoster((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        present: !prev[studentId]?.present,
      },
    }));
  };

  const handleRosterNoteChange = (studentId: string, note: string) => {
    setRollCallRoster((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { present: true }),
        note,
      },
    }));
  };

  const handleSaveRollCall = async () => {
    if (classStudents.length === 0) {
      setFeedback({ type: "error", message: "No students in this class to record attendance for." });
      return;
    }
    const finalLessonId = rollCallLessonId || (lessons[0]?.id ? String(lessons[0].id) : "1");

    setRollCallSaving(true);
    try {
      const batchPayload = classStudents.map((st) => ({
        student_id: st.id,
        lesson_id: finalLessonId,
        date: rollCallDate,
        present: rollCallRoster[st.id]?.present ? 1 : 0,
        notes: rollCallRoster[st.id]?.note || "",
      }));

      const res = await api.create("attendance", {
        date: rollCallDate,
        lesson_id: finalLessonId,
        batch: batchPayload,
      });

      if (res?.success) {
        setFeedback({
          type: "success",
          message: `Class attendance successfully saved for ${batchPayload.length} students on ${rollCallDate}!`,
        });
        fetchRecords();
      } else {
        setFeedback({ type: "error", message: res?.message || "Failed to save roll call." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Error submitting roll call." });
    } finally {
      setRollCallSaving(false);
    }
  };

  // ─── Export CSV & Print ────────────────────────────────────────────────────

  const handleExportCsv = () => {
    if (records.length === 0) {
      setFeedback({ type: "error", message: "No attendance records to export." });
      return;
    }

    const headers = ["ID", "Student Name", "Class", "Lesson / Subject", "Date", "Status"];
    const rows = records.map((r) => [
      r.id,
      `"${r.student_name || ""} ${r.student_surname || ""}".trim()`,
      `"${r.class_name || "—"}"`,
      `"${r.lesson_name || r.subject_name || "—"}"`,
      r.date,
      r.present ? "Present" : "Absent",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `attendance_records_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({ type: "success", message: "Attendance records exported to CSV successfully." });
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── Class Summaries Analytics ─────────────────────────────────────────────

  const classSummaries = useMemo(() => {
    return classes.map((c) => {
      const classRecs = records.filter(
        (r) => String(r.student_class_id) === String(c.id) || r.class_name === c.name
      );
      const total = classRecs.length;
      const present = classRecs.filter((r) => Boolean(r.present)).length;
      const absent = total - present;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const enrolledCount = allStudents.filter(
        (s) => String(s.class_id) === String(c.id) || s.class_name === c.name
      ).length;

      return {
        ...c,
        recordsCount: total,
        present,
        absent,
        rate,
        enrolledCount,
      };
    });
  }, [classes, records, allStudents]);

  const activeSelectedClassObj = useMemo(() => {
    return classes.find((c) => String(c.id) === String(rollCallClassId));
  }, [classes, rollCallClassId]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all transform duration-300 animate-in slide-in-from-top ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-rose-600 text-white shadow-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── Header & Top Actions ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Attendance Records & Roll Call
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Manage daily roll calls, track student attendance history, and review analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab("rollcall")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition shadow-sm ${
              activeTab === "rollcall"
                ? "bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700"
                : "bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750"
            }`}
          >
            <Sparkles size={15} className="text-amber-400" />
            Quick Roll Call
          </button>

          {(role === "admin" || role === "teacher") && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-sm transition"
            >
              <Plus size={16} />
              New Entry
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={handleExportCsv}
              title="Export as CSV"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handlePrint}
              title="Print Summary"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={fetchRecords}
              disabled={loading}
              title="Refresh Records"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPI Stats Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        {/* Total Records */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm relative overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Logged</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {summary.total}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Class attendance records
            </p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm relative overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={17} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {summary.rate}%
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.rate >= 80 ? "Optimal" : summary.rate >= 60 ? "Moderate" : "Low"}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-gray-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, summary.rate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Present Count */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm relative overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Present</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {summary.present}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Marked present in roster
            </p>
          </div>
        </div>

        {/* Absent Count */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm relative overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Absent</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX size={17} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {summary.absent}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Recorded absences
            </p>
          </div>
        </div>
      </div>

      {/* ─── Mode Tabs Navigation ────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-gray-700 gap-6">
        <button
          onClick={() => setActiveTab("records")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "records"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ClipboardCheck size={16} />
          Attendance Records
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-750 text-slate-600 dark:text-slate-300 font-medium">
            {totalRecords}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("rollcall")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "rollcall"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles size={16} className="text-amber-500" />
          Quick Roll Call Sheet
          {classStudents.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
              {classStudents.length} Students
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "classes"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers size={16} />
          Class Summaries
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-750 text-slate-600 dark:text-slate-300 font-medium">
            {classes.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: ATTENDANCE RECORDS ───────────────────────────────────── */}
      {activeTab === "records" && (
        <div className="flex flex-col gap-4">
          {/* Filter Bar with Dynamic Class-Wise Student Selector */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, class, or lesson..."
                className="w-full pl-9 pr-8 py-2 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Class Filter Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent("all"); // Reset student when class changes
                  }}
                  className="text-xs md:text-sm py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="all">All Classes</option>
                  {classes.map((c) => {
                    const studentCount = allStudents.filter(
                      (s) => String(s.class_id) === String(c.id) || s.class_name === c.name
                    ).length;
                    return (
                      <option key={c.id} value={String(c.id)}>
                        Class {c.name} {studentCount > 0 ? `(${studentCount} students)` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Dynamic Student Filter (Class-Wise) */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Student:</span>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="text-xs md:text-sm py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[190px] truncate"
                >
                  <option value="all">
                    {selectedClass === "all" ? "All Students" : "All in this Class"}
                  </option>
                  {classFilterStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.surname} ({st.username || st.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs md:text-sm py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                </select>
              </div>

              {/* Date Presets */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-gray-700">
                {(["all", "today", "yesterday", "week"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition ${
                      datePreset === preset
                        ? "bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {preset === "all" ? "All" : preset}
                  </button>
                ))}
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className={`text-xs py-0.5 px-2 rounded-lg bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none border-l border-slate-200 dark:border-gray-700 ${
                    datePreset === "custom" ? "font-semibold text-indigo-600 dark:text-indigo-400" : ""
                  }`}
                  title="Specific Date"
                />
              </div>

              {/* Clear Filter Button */}
              {(search || selectedClass !== "all" || selectedStudent !== "all" || selectedStatus !== "all" || datePreset !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedClass("all");
                    setSelectedStudent("all");
                    setSelectedStatus("all");
                    setDatePreset("all");
                    setCustomDate("");
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium px-2 py-1"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-gray-700/80 bg-slate-50/75 dark:bg-gray-750/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 hidden md:table-cell">Lesson / Subject</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status & Quick Toggle</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700/60 text-xs md:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="animate-spin text-indigo-600" size={24} />
                          <span>Loading attendance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ClipboardCheck size={36} className="text-slate-300 dark:text-slate-600" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            No attendance records found
                          </span>
                          <span className="text-xs text-slate-400">
                            Try adjusting filters or use Quick Roll Call to record attendance for a class.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-gray-750/30 transition text-slate-700 dark:text-slate-200"
                      >
                        {/* Student Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.student_img ? (
                              <img
                                src={item.student_img}
                                alt={item.student_name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-gray-700 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {item.student_name?.[0] || "S"}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {item.student_name} {item.student_surname}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                ID: {item.student_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-600">
                            Class {item.class_name || "—"}
                          </span>
                        </td>

                        {/* Lesson / Subject */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {item.lesson_name || "General Session"}
                            </span>
                            {item.subject_name && (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {item.subject_name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Calendar size={13} className="text-slate-400" />
                            <span>{item.date}</span>
                          </div>
                        </td>

                        {/* Status & Quick Toggle */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle Present / Absent"
                            className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                              item.present
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.present ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <span>{item.present ? "Present" : "Absent"}</span>
                            <span className="text-[10px] opacity-40 group-hover:opacity-100 transition ml-0.5">
                              ⇄
                            </span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Record"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
                            >
                              <Pencil size={14} />
                            </button>
                            {role === "admin" && (
                              <button
                                onClick={() => setDeleteId(item.id)}
                                title="Delete Record"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-100 dark:border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalRecords)} of {totalRecords} records
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: QUICK ROLL CALL / DAILY SHEET (CLASS-WISE) ────────────── */}
      {activeTab === "rollcall" && (
        <div className="flex flex-col gap-5">
          {/* Roll Call Setup Card */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
              {/* Roll Call Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Roll Call Date:
                </label>
                <input
                  type="date"
                  value={rollCallDate}
                  onChange={(e) => setRollCallDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Class Selection: Loads students dynamically from "All Students" */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Select Class:</span>
                  {classStudentsLoading && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 animate-pulse font-normal">
                      Loading students...
                    </span>
                  )}
                </label>
                <select
                  value={rollCallClassId}
                  onChange={(e) => setRollCallClassId(e.target.value)}
                  className="w-full py-2 px-3 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  {classes.map((c) => {
                    const count = allStudents.filter(
                      (s) => String(s.class_id) === String(c.id) || s.class_name === c.name
                    ).length;
                    return (
                      <option key={c.id} value={String(c.id)}>
                        Class {c.name} {c.grade_level ? `(Grade ${c.grade_level})` : ""} — {count} Students
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Lesson / Subject Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Lesson / Session:
                </label>
                <select
                  value={rollCallLessonId}
                  onChange={(e) => setRollCallLessonId(e.target.value)}
                  className="w-full py-2 px-3 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {classLessons.length > 0 ? (
                    classLessons.map((l) => (
                      <option key={l.id} value={String(l.id)}>
                        {l.name}
                      </option>
                    ))
                  ) : (
                    <option value="1">General Class Attendance</option>
                  )}
                </select>
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAllRoster(true)}
                disabled={classStudentsLoading || classStudents.length === 0}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAllRoster(false)}
                disabled={classStudentsLoading || classStudents.length === 0}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserX size={14} />
                All Absent
              </button>
            </div>
          </div>

          {/* Roll Call Live Status Bar & Search */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 flex-wrap text-xs md:text-sm font-semibold">
              <span className="text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>Class {activeSelectedClassObj?.name || ""} Roster:</span>
                <strong className="text-indigo-600 dark:text-indigo-400 px-2 py-0.5 bg-white dark:bg-gray-800 rounded-md shadow-xs border border-indigo-100 dark:border-gray-700">
                  {classStudents.length} Students
                </strong>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400">
                Present: <strong>{rollCallStats.present}</strong> ({rollCallStats.rate}%)
              </span>
              <span className="text-rose-700 dark:text-rose-400">
                Absent: <strong>{rollCallStats.absent}</strong>
              </span>
            </div>

            <div className="relative min-w-[200px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              />
              <input
                type="text"
                value={rollCallFilterSearch}
                onChange={(e) => setRollCallFilterSearch(e.target.value)}
                placeholder="Search class roster..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Roll Call Students Grid / List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/90 dark:border-gray-700/80 shadow-sm overflow-hidden">
            {classStudentsLoading ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <RefreshCw className="animate-spin text-indigo-600 mx-auto mb-2" size={26} />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Loading students from All Students for Class {activeSelectedClassObj?.name || ""}...
                </p>
              </div>
            ) : filteredRosterStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                <Users size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No students found in Class {activeSelectedClassObj?.name || ""}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  There are currently no students enrolled in this class in the system. You can assign or add students from the Students page.
                </p>
                <Link
                  to="/list/students"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <ExternalLink size={13} />
                  Open All Students Page
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-gray-750">
                {filteredRosterStudents.map((st, idx) => {
                  const state = rollCallRoster[st.id] ?? { present: true };
                  const isPresent = state.present;

                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                        isPresent
                          ? "hover:bg-slate-50/60 dark:hover:bg-gray-750/30"
                          : "bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40"
                      }`}
                    >
                      {/* Student Identity */}
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <span className="text-xs font-mono text-slate-400 w-5 text-right">
                          {idx + 1}.
                        </span>
                        {st.img ? (
                          <img
                            src={st.img}
                            alt={st.name}
                            className={`w-10 h-10 rounded-full object-cover border-2 flex-shrink-0 ${
                              isPresent
                                ? "border-emerald-500/80 shadow-xs shadow-emerald-500/10"
                                : "border-rose-500/80 shadow-xs shadow-rose-500/10"
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0 border-2 ${
                              isPresent
                                ? "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-950/40 dark:text-rose-300"
                            }`}
                          >
                            {st.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                              {st.name} {st.surname}
                            </h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-400">
                              Class {activeSelectedClassObj?.name || st.class_name || ""}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {st.username || st.id}
                          </p>
                        </div>
                      </div>

                      {/* Optional Note / Remarks */}
                      <div className="flex-1 max-w-sm">
                        <input
                          type="text"
                          value={state.note || ""}
                          onChange={(e) => handleRosterNoteChange(st.id, e.target.value)}
                          placeholder="Optional remarks (e.g. late 10m, sick leave)"
                          className="w-full py-1.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Status Toggle Switch */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-gray-700 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isPresent) handleToggleRosterStudent(st.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            isPresent
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <CheckCircle2 size={13} />
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isPresent) handleToggleRosterStudent(st.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            !isPresent
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <UserX size={13} />
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Save Action Bar */}
            <div className="p-4 bg-slate-50 dark:bg-gray-750/70 border-t border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Ready to record attendance for <strong>{rollCallStats.total}</strong> students in <strong>Class {activeSelectedClassObj?.name || ""}</strong> on <strong>{rollCallDate}</strong>
              </span>

              <button
                type="button"
                onClick={handleSaveRollCall}
                disabled={rollCallSaving || classStudentsLoading || filteredRosterStudents.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition"
              >
                {rollCallSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saving Roll Call...
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={16} />
                    Save Class Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: CLASS SUMMARIES & ANALYTICS ───────────────────────────── */}
      {activeTab === "classes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classSummaries.map((cls) => (
            <div
              key={cls.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm flex flex-col justify-between transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                        Class {cls.name}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {cls.grade_level ? `Grade ${cls.grade_level}` : "Academic Class"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      cls.rate >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : cls.rate >= 60
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                    }`}
                  >
                    {cls.rate}% Rate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-750">
                    <span className="text-[10px] text-slate-400 font-medium block">Enrolled</span>
                    <strong className="text-sm text-slate-800 dark:text-slate-200">
                      {cls.enrolledCount}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      Present
                    </span>
                    <strong className="text-sm text-emerald-700 dark:text-emerald-300">
                      {cls.present}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
                      Absent
                    </span>
                    <strong className="text-sm text-rose-700 dark:text-rose-300">
                      {cls.absent}
                    </strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-gray-700 h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, cls.rate))}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClass(String(cls.id));
                    setSelectedStudent("all");
                    setActiveTab("records");
                  }}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  View Records ({cls.recordsCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRollCallClassId(String(cls.id));
                    setActiveTab("rollcall");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Take Roll Call →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT ATTENDANCE RECORD (DYNAMIC CLASS-WISE) ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                {editingRecord ? "Edit Attendance Record" : "Add New Attendance Record"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 flex flex-col gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={modalForm.date}
                  onChange={(e) => setModalForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full py-2 px-3 text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Class Selector: Dynamically updates the student and lesson dropdowns */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={modalForm.class_id}
                  onChange={(e) => {
                    const newClassId = e.target.value;
                    const filteredStudents = allStudents.filter(
                      (s) => String(s.class_id) === String(newClassId)
                    );
                    const filteredLessons = lessons.filter(
                      (l) => !l.class_id || String(l.class_id) === String(newClassId)
                    );
                    setModalForm((f) => ({
                      ...f,
                      class_id: newClassId,
                      student_id: filteredStudents[0]?.id || "",
                      lesson_id: filteredLessons[0]?.id ? String(filteredLessons[0].id) : f.lesson_id,
                    }));
                  }}
                  className="w-full py-2 px-3 text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => {
                    const count = allStudents.filter(
                      (s) => String(s.class_id) === String(c.id) || s.class_name === c.name
                    ).length;
                    return (
                      <option key={c.id} value={String(c.id)}>
                        Class {c.name} {count > 0 ? `(${count} Students)` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Student Selector: Dynamically filtered to students in chosen class */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Student <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={modalForm.student_id}
                  onChange={(e) => setModalForm((f) => ({ ...f, student_id: e.target.value }))}
                  className="w-full py-2 px-3 text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a student...</option>
                  {modalClassStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.surname} ({st.username || st.id})
                    </option>
                  ))}
                </select>
                {modalClassStudents.length === 0 && modalForm.class_id && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                    No students currently enrolled in this class.
                  </p>
                )}
              </div>

              {/* Lesson / Session */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Lesson / Session <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={modalForm.lesson_id}
                  onChange={(e) => setModalForm((f) => ({ ...f, lesson_id: e.target.value }))}
                  className="w-full py-2 px-3 text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a lesson...</option>
                  {modalClassLessons.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Attendance Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status_radio"
                      checked={modalForm.present}
                      onChange={() => setModalForm((f) => ({ ...f, present: true }))}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Present
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status_radio"
                      checked={!modalForm.present}
                      onChange={() => setModalForm((f) => ({ ...f, present: false }))}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                      Absent
                    </span>
                  </label>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={modalForm.notes}
                  onChange={(e) => setModalForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. excused absence, medical leave..."
                  className="w-full py-2 px-3 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-gray-700 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : editingRecord ? "Update Record" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-gray-700 shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">
              Delete Attendance Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to remove this attendance entry? This action cannot be reversed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSection;
