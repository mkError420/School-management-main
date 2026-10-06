"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, RefreshCw, Users, Percent, Calendar } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

export interface AttendanceDayPoint {
  name: string;
  date?: string;
  present: number; // Percentage or Count
  absent: number;
  present_count?: number;
  absent_count?: number;
  total?: number;
  rate?: number;
}

const defaultWeeklyData: AttendanceDayPoint[] = [
  { name: "Sun", present: 92, absent: 8, present_count: 23, absent_count: 2, total: 25, rate: 92 },
  { name: "Mon", present: 88, absent: 12, present_count: 22, absent_count: 3, total: 25, rate: 88 },
  { name: "Tue", present: 85, absent: 15, present_count: 21, absent_count: 4, total: 25, rate: 85 },
  { name: "Wed", present: 90, absent: 10, present_count: 22, absent_count: 3, total: 25, rate: 90 },
  { name: "Thu", present: 82, absent: 18, present_count: 20, absent_count: 5, total: 25, rate: 82 },
];

const AttendanceChart: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#f1f5f9";

  const [chartData, setChartData] = useState<AttendanceDayPoint[]>(defaultWeeklyData);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"percentage" | "count">("percentage");

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      // First try dedicated attendance chart endpoint, fallback to getDashboard()
      const res = await api.getAttendanceChartData();
      if (res?.success && Array.isArray(res.data?.attendance) && res.data.attendance.length > 0) {
        setChartData(res.data.attendance);
      } else {
        const dashRes = await api.getDashboard();
        if (dashRes?.success && Array.isArray(dashRes.data?.attendance) && dashRes.data.attendance.length > 0) {
          setChartData(dashRes.data.attendance);
        }
      }
    } catch {
      // Retain previous or fallback data gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Re-fetch when page is focused (e.g. user returns from Attendance Records tab)
  useEffect(() => {
    const onFocus = () => {
      loadAttendance();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadAttendance]);

  // Compute summary stats for the weekly period
  const stats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { avgRate: 0, totalStudents: 0, latestDate: "" };
    }
    let totalPresent = 0;
    let totalAll = 0;
    let rateSum = 0;
    let validRateDays = 0;

    chartData.forEach((d) => {
      if (d.present_count !== undefined && d.total !== undefined) {
        totalPresent += d.present_count;
        totalAll += d.total;
      }
      if (d.rate !== undefined) {
        rateSum += d.rate;
        validRateDays++;
      } else if (typeof d.present === "number") {
        rateSum += d.present;
        validRateDays++;
      }
    });

    const avgRate = validRateDays > 0 ? Math.round(rateSum / validRateDays) : 0;
    const latestDate = chartData[chartData.length - 1]?.date || "";
    return { avgRate, totalStudents: totalAll, latestDate };
  }, [chartData]);

  // Format data based on view mode (percentage vs count)
  const displayData = useMemo(() => {
    return chartData.map((d) => {
      if (viewMode === "count") {
        return {
          ...d,
          presentValue: d.present_count !== undefined ? d.present_count : d.present,
          absentValue: d.absent_count !== undefined ? d.absent_count : d.absent,
        };
      }
      // Percentage mode
      const rate = d.rate !== undefined ? d.rate : d.present;
      return {
        ...d,
        presentValue: rate,
        absentValue: d.absent !== undefined ? d.absent : Math.max(0, 100 - rate),
      };
    });
  }, [chartData, viewMode]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm h-full flex flex-col justify-between transition">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Weekly Attendance
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={11} />
              {stats.avgRate}% Avg Rate
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {stats.latestDate
              ? `Live attendance trends • Latest: ${stats.latestDate}`
              : "Live student attendance trends across academic days"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-gray-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("percentage")}
              title="Show as Percentage Rate"
              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                viewMode === "percentage"
                  ? "bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Percent size={11} />
              Rate
            </button>
            <button
              type="button"
              onClick={() => setViewMode("count")}
              title="Show as Student Count"
              className={`px-2 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                viewMode === "count"
                  ? "bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Users size={11} />
              Count
            </button>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={loadAttendance}
            disabled={loading}
            title="Refresh Attendance Data"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-750 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>

          {/* Link to Attendance Records */}
          <Link
            to="/list/attendance"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition"
            title="Open Attendance Records & Roll Call"
          >
            <span>Records</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="w-full h-[310px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            barSize={18}
            margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: tickColor, fontSize: 12 }}
              tickLine={false}
              domain={viewMode === "percentage" ? [0, 100] : [0, "auto"]}
              tickFormatter={(v) => (viewMode === "percentage" ? `${v}%` : String(v))}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                borderColor: isDark ? "#374151" : "#e2e8f0",
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#f1f5f9" : "#0f172a",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                fontSize: "12px",
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const dataItem = payload[0]?.payload as AttendanceDayPoint & {
                  presentValue: number;
                  absentValue: number;
                };
                if (!dataItem) return null;

                const isPct = viewMode === "percentage";
                const presDisplay = isPct
                  ? `${dataItem.presentValue}%`
                  : `${dataItem.presentValue} student${dataItem.presentValue === 1 ? "" : "s"}`;
                const absDisplay = isPct
                  ? `${dataItem.absentValue}%`
                  : `${dataItem.absentValue} student${dataItem.absentValue === 1 ? "" : "s"}`;

                return (
                  <div className="p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-lg text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-gray-700 pb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {label} {dataItem.date ? `(${dataItem.date})` : ""}
                      </span>
                      {dataItem.total !== undefined && (
                        <span className="text-[11px] text-slate-400">
                          {dataItem.total} Total
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Present:</span>
                      <span>
                        {presDisplay}
                        {dataItem.present_count !== undefined && isPct && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({dataItem.present_count} students)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400 font-semibold">
                      <span>Absent:</span>
                      <span>
                        {absDisplay}
                        {dataItem.absent_count !== undefined && isPct && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({dataItem.absent_count} students)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              align="left"
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: "14px", fontSize: "12px" }}
              formatter={(val) =>
                val === "presentValue"
                  ? viewMode === "percentage"
                    ? "Present Rate (%)"
                    : "Present Students"
                  : viewMode === "percentage"
                  ? "Absent Rate (%)"
                  : "Absent Students"
              }
            />
            <Bar
              dataKey="presentValue"
              fill="#10b981"
              legendType="circle"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="absentValue"
              fill="#f43f5e"
              legendType="circle"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;