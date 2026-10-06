import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";
import BigCalendar from "@/components/BigCalendar";
import Announcements from "@/components/Announcements";
import AttendanceChart from "@/components/AttendanceChart";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

interface TeacherInfo {
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
}

interface TeacherDashData {
  teacher: TeacherInfo;
  subjects: { id: string | number; name: string }[];
  classes: { id: string | number; name: string; grade_level?: number | null }[];
  lessons: { id: string | number; name: string }[];
  students: { id: string; name: string; surname: string }[];
}

const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<TeacherDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getById<TeacherDashData>("teachers", user.id);
      if (res.success && res.data?.teacher) {
        setData({
          teacher: res.data.teacher,
          subjects: res.data.subjects || [],
          classes: res.data.classes || [],
          lessons: res.data.lessons || [],
          students: res.data.students || [],
        });
      } else {
        setError(res.message || "Could not load profile.");
      }
    } catch {
      setError("Network error. Could not load your profile.");
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

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      {/* ─── Profile Header Card ──────────────────────────────────────── */}
      {loading ? (
        <div
          className={`${cardBg} border rounded-2xl p-6 flex items-center justify-center gap-3 min-h-[140px] shadow-sm`}
        >
          <RefreshCw className="animate-spin text-indigo-500" size={22} />
          <span className={`${textMuted} text-sm`}>Loading your profile…</span>
        </div>
      ) : error || !data ? (
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
        <div
          className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}
        >
          {/* Top gradient strip */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

          <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {data.teacher.img ? (
                <img
                  src={data.teacher.img}
                  alt={data.teacher.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 text-white flex items-center justify-center text-3xl font-bold shadow-md border-4 border-white dark:border-gray-700">
                  {data.teacher.name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>
                  Welcome, {data.teacher.name} {data.teacher.surname}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                  <GraduationCap size={12} /> Teacher
                </span>
              </div>
              <p className={`text-sm ${textMuted} mb-3`}>@{data.teacher.username}</p>

              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                {data.teacher.email && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <Mail size={13} className="text-indigo-500 flex-shrink-0" />
                    {data.teacher.email}
                  </span>
                )}
                {data.teacher.phone && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <Phone size={13} className="text-emerald-500 flex-shrink-0" />
                    {data.teacher.phone}
                  </span>
                )}
                {data.teacher.address && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <MapPin size={13} className="text-rose-500 flex-shrink-0" />
                    {data.teacher.address}
                  </span>
                )}
                {data.teacher.blood_type && (
                  <span className={`flex items-center gap-1.5 ${textMuted}`}>
                    <span className="text-rose-500 font-bold text-[11px]">B+</span>
                    Blood: {data.teacher.blood_type}
                  </span>
                )}
              </div>
            </div>

            {/* View Full Profile link */}
            <Link
              to={`/list/teachers/${data.teacher.id}`}
              className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex-shrink-0"
            >
              Full Profile →
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-slate-100 dark:border-gray-700 grid grid-cols-4 divide-x divide-slate-100 dark:divide-gray-700">
            {[
              { label: "Subjects", value: data.subjects.length, icon: <BookOpen size={15} className="text-indigo-500" /> },
              { label: "Classes", value: data.classes.length, icon: <Layers3 size={15} className="text-violet-500" /> },
              { label: "Lessons", value: data.lessons.length, icon: <CalendarDays size={15} className="text-sky-500" /> },
              { label: "Students", value: data.students.length, icon: <Users size={15} className="text-emerald-500" /> },
            ].map((stat) => (
              <div key={stat.label} className="p-3 md:p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  {stat.icon}
                  <span className={`text-xl font-bold ${textPrimary}`}>{stat.value}</span>
                </div>
                <p className={`text-[11px] font-medium ${textMuted}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Main Content: Schedule + Right Panel ─────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Schedule */}
        <div className="flex-1 min-w-0">
          <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className={`font-bold text-base ${textPrimary} flex items-center gap-2`}>
                <CalendarDays size={17} className="text-indigo-500" />
                My Teaching Schedule
              </h2>
            </div>
            <div className="p-4">
              <BigCalendar />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-5">
          <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-gray-700">
              <h2 className={`font-bold text-sm ${textPrimary}`}>Weekly Attendance Trends</h2>
            </div>
            <div className="p-3">
              <AttendanceChart />
            </div>
          </div>
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
