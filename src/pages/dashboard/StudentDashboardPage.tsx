import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";
import BigCalendar from "@/components/BigCalendar";
import EventCalendar from "@/components/EventCalendar";
import Announcements from "@/components/Announcements";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

interface StudentInfo {
  id: string;
  name: string;
  surname: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  img?: string | null;
  blood_type?: string | null;
  sex?: string | null;
  class_name?: string | null;
  grade_level?: number | null;
  parent_name?: string | null;
  parent_surname?: string | null;
  parent_phone?: string | null;
}

interface StudentDashData {
  student: StudentInfo;
  attendance?: { present: boolean | number | string }[];
  lessons?: { id: string | number; name: string }[];
  teachers?: { id: string; name: string; surname: string }[];
  exams?: { id: string | number; title: string }[];
  assignments?: { id: string | number; title: string }[];
  results?: { id: string | number; score: number }[];
}

const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<StudentDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getById<StudentDashData>("students", user.id);
      if (res.success && res.data?.student) {
        setData(res.data);
      } else {
        setError(res.message || "Could not load student profile.");
      }
    } catch {
      setError("Network error. Could not load your student profile.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cardBg = isDark
    ? "bg-gray-800 border-gray-700/80"
    : "bg-white border-slate-200/90";
  const textPrimary = isDark ? "text-slate-100" : "text-slate-800";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  // Calculate attendance rate
  const attendanceList = data?.attendance || [];
  const presentCount = attendanceList.filter(
    (a) => a.present === true || a.present === 1 || a.present === "1"
  ).length;
  const attendanceRate =
    attendanceList.length > 0
      ? Math.round((presentCount / attendanceList.length) * 100)
      : null;

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      {/* ─── Profile Header Card ──────────────────────────────────────── */}
      {loading ? (
        <div
          className={`${cardBg} border rounded-2xl p-6 flex items-center justify-center gap-3 min-h-[140px] shadow-sm`}
        >
          <RefreshCw className="animate-spin text-emerald-500" size={22} />
          <span className={`${textMuted} text-sm`}>Loading your profile…</span>
        </div>
      ) : error || !data?.student ? (
        <div
          className={`${cardBg} border rounded-2xl p-6 flex items-center justify-between shadow-sm`}
        >
          <p className="text-rose-500 text-sm">{error || "Profile unavailable."}</p>
          <button
            onClick={loadData}
            className="text-xs text-indigo-500 hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
          {/* Top gradient strip */}
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {data.student.img ? (
                <img
                  src={data.student.img}
                  alt={data.student.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center text-3xl font-bold shadow-md border-4 border-white dark:border-gray-700">
                  {data.student.name ? data.student.name[0].toUpperCase() : "S"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>
                  Welcome, {data.student.name} {data.student.surname}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  <GraduationCap size={12} /> Student
                </span>
                {data.student.class_name && (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    Class: {data.student.class_name}
                  </span>
                )}
                {data.student.grade_level && (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Grade {data.student.grade_level}
                  </span>
                )}
              </div>
              <p className={`text-sm ${textMuted} mb-3`}>@{data.student.username}</p>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                {data.student.email && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <Mail size={13} className="text-teal-500 flex-shrink-0" />
                    {data.student.email}
                  </span>
                )}
                {data.student.phone && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <Phone size={13} className="text-emerald-500 flex-shrink-0" />
                    {data.student.phone}
                  </span>
                )}
                {data.student.address && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <MapPin size={13} className="text-rose-500 flex-shrink-0" />
                    {data.student.address}
                  </span>
                )}
                {data.student.blood_type && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <HeartPulse size={13} className="text-rose-500 flex-shrink-0" />
                    Blood: {data.student.blood_type}
                  </span>
                )}
                {(data.student.parent_name || data.student.parent_surname) && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <UserCheck size={13} className="text-indigo-500 flex-shrink-0" />
                    Guardian: {data.student.parent_name} {data.student.parent_surname}
                    {data.student.parent_phone && ` (${data.student.parent_phone})`}
                  </span>
                )}
              </div>
            </div>

            {/* View Full Profile link */}
            <Link
              to={`/list/students/${data.student.id}`}
              className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 px-3.5 py-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex-shrink-0"
            >
              Full Profile →
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-slate-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 dark:divide-gray-700">
            <div className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className={`text-xl font-bold ${textPrimary}`}>
                  {attendanceRate !== null ? `${attendanceRate}%` : "—"}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${textMuted}`}>Attendance</p>
            </div>

            <div className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <BookOpen size={16} className="text-teal-500" />
                <span className={`text-xl font-bold ${textPrimary}`}>
                  {data.lessons?.length || 0}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${textMuted}`}>Lessons</p>
            </div>

            <div className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Users size={16} className="text-indigo-500" />
                <span className={`text-xl font-bold ${textPrimary}`}>
                  {data.teachers?.length || 0}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${textMuted}`}>Teachers</p>
            </div>

            <div className="p-3 md:p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Award size={16} className="text-amber-500" />
                <span className={`text-xl font-bold ${textPrimary}`}>
                  {data.results?.length || (data.exams?.length || 0) + (data.assignments?.length || 0)}
                </span>
              </div>
              <p className={`text-[11px] font-medium ${textMuted}`}>Assessments</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content: Class Schedule + Right Column ───────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Schedule */}
        <div className="w-full xl:w-2/3">
          <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden h-full flex flex-col`}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className={`font-bold text-base ${textPrimary} flex items-center gap-2`}>
                <CalendarDays size={18} className="text-emerald-500" />
                My Class Schedule
              </h2>
            </div>
            <div className="p-4 flex-1">
              <BigCalendar />
            </div>
          </div>
        </div>

        {/* Right Column: Calendar + Announcements */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
