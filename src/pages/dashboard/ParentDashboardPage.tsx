import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  User,
  Users,
} from "lucide-react";
import BigCalendar from "@/components/BigCalendar";
import Announcements from "@/components/Announcements";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

interface ParentInfo {
  id: string;
  name: string;
  surname: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface ChildStudent {
  id: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  img?: string | null;
  blood_type?: string | null;
  sex?: string | null;
  class_name?: string | null;
  grade_level?: number | null;
  status?: string | null;
}

interface ParentDashData {
  parent: ParentInfo;
  children: ChildStudent[];
}

const ParentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<ParentDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getById<ParentDashData>("parents", user.id);
      if (res.success && res.data?.parent) {
        setData({
          parent: res.data.parent,
          children: res.data.children || [],
        });
      } else {
        setError(res.message || "Could not load parent and student profile.");
      }
    } catch {
      setError("Network error. Could not load student profiles.");
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
  const innerCardBg = isDark
    ? "bg-gray-800/70 border-gray-700/70"
    : "bg-slate-50/80 border-slate-200/80";
  const textPrimary = isDark ? "text-slate-100" : "text-slate-800";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      {/* ─── Parent & Children Section ─────────────────────────────────── */}
      {loading ? (
        <div
          className={`${cardBg} border rounded-2xl p-6 flex items-center justify-center gap-3 min-h-[140px] shadow-sm`}
        >
          <RefreshCw className="animate-spin text-amber-500" size={22} />
          <span className={`${textMuted} text-sm`}>Loading student profiles…</span>
        </div>
      ) : error || !data?.parent ? (
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
        <div className="flex flex-col gap-5">
          {/* Parent Welcome Bar */}
          <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {data.parent.name ? data.parent.name[0].toUpperCase() : "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-lg sm:text-xl font-bold ${textPrimary}`}>
                      Welcome, {data.parent.name} {data.parent.surname}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                      <Shield size={11} /> Parent / Guardian
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
                    {data.parent.email && (
                      <span className={`flex items-center gap-1 ${textMuted}`}>
                        <Mail size={12} className="text-amber-500" />
                        {data.parent.email}
                      </span>
                    )}
                    {data.parent.phone && (
                      <span className={`flex items-center gap-1 ${textMuted}`}>
                        <Phone size={12} className="text-emerald-500" />
                        {data.parent.phone}
                      </span>
                    )}
                    {data.parent.address && (
                      <span className={`flex items-center gap-1 ${textMuted}`}>
                        <MapPin size={12} className="text-rose-500" />
                        {data.parent.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-500" />
                  {data.children.length} {data.children.length === 1 ? "Student" : "Students"}
                </span>
              </div>
            </div>
          </div>

          {/* Children / Student Profiles Section */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className={`text-base font-bold ${textPrimary} flex items-center gap-2`}>
                <GraduationCap size={18} className="text-indigo-500" />
                Student Profile{data.children.length > 1 ? "s" : ""}
              </h2>
              <span className={`text-xs ${textMuted}`}>
                Select a student to view full academic records
              </span>
            </div>

            {data.children.length === 0 ? (
              <div
                className={`${cardBg} border rounded-2xl p-8 text-center shadow-sm`}
              >
                <User size={36} className="mx-auto text-slate-400 mb-2" />
                <h3 className={`text-sm font-semibold ${textPrimary}`}>No linked students</h3>
                <p className={`text-xs ${textMuted} mt-1 max-w-md mx-auto`}>
                  There are no student profiles currently associated with your account.
                  If your child is newly enrolled, please contact school administration.
                </p>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${
                  data.children.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1"
                } gap-4`}
              >
                {data.children.map((child) => (
                  <div
                    key={child.id}
                    className={`${cardBg} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden`}
                  >
                    {/* Top subtle accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-teal-500" />

                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {child.img ? (
                          <img
                            src={child.img}
                            alt={child.name}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                            {child.name ? child.name[0].toUpperCase() : "S"}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`text-base font-bold ${textPrimary}`}>
                            {child.name} {child.surname}
                          </h3>
                          {child.status && child.status !== "ACTIVE" && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              {child.status}
                            </span>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {child.class_name && (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                              Class: {child.class_name}
                            </span>
                          )}
                          {child.grade_level && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                              Grade {child.grade_level}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          {child.email && (
                            <span className={`flex items-center gap-1.5 truncate ${textMuted}`}>
                              <Mail size={12} className="text-indigo-500 flex-shrink-0" />
                              <span className="truncate">{child.email}</span>
                            </span>
                          )}
                          {child.phone && (
                            <span className={`flex items-center gap-1.5 ${textMuted}`}>
                              <Phone size={12} className="text-emerald-500 flex-shrink-0" />
                              {child.phone}
                            </span>
                          )}
                          {child.blood_type && (
                            <span className={`flex items-center gap-1.5 ${textMuted}`}>
                              <HeartPulse size={12} className="text-rose-500 flex-shrink-0" />
                              Blood: {child.blood_type}
                            </span>
                          )}
                          {child.address && (
                            <span className={`flex items-center gap-1.5 truncate ${textMuted}`}>
                              <MapPin size={12} className="text-amber-500 flex-shrink-0" />
                              <span className="truncate">{child.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-700/70 flex items-center justify-between">
                      <span className={`text-[11px] ${textMuted}`}>
                        Student ID: #{child.id}
                      </span>
                      <Link
                        to={`/list/students/${child.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg transition"
                      >
                        View Student Profile
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Schedule & Announcements ──────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="w-full xl:w-2/3">
          <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden h-full flex flex-col`}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className={`font-bold text-base ${textPrimary} flex items-center gap-2`}>
                <CalendarDays size={18} className="text-amber-500" />
                Child's Schedule
              </h2>
            </div>
            <div className="p-4 flex-1">
              <BigCalendar />
            </div>
          </div>
        </div>
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;
