"use client";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
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

const defaultWeeklyData = [
  { name: "Sun", present: 92, absent: 8 },
  { name: "Mon", present: 88, absent: 12 },
  { name: "Tue", present: 85, absent: 15 },
  { name: "Wed", present: 90, absent: 10 },
  { name: "Thu", present: 82, absent: 18 },
];

const AttendanceChart: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#f1f5f9";

  const [chartData, setChartData] = useState(defaultWeeklyData);

  useEffect(() => {
    api.getDashboard().then((res) => {
      if (res?.success && res.data?.attendance && Array.isArray(res.data.attendance) && res.data.attendance.length > 0) {
        setChartData(res.data.attendance);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-slate-200/90 dark:border-gray-700/80 shadow-sm h-full flex flex-col justify-between transition">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Weekly Attendance
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={11} />
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Student attendance trends across academic weekdays
          </p>
        </div>

        <Link
          to="/list/attendance"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition"
          title="Open Attendance Records"
        >
          <span>Attendance Records</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={18} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
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
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
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
              formatter={(value: any, name: any) => [`${value}%`, name === "present" ? "Present" : "Absent"]}
            />
            <Legend
              align="left"
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: "16px", fontSize: "12px" }}
              formatter={(val) => (val === "present" ? "Present Rate" : "Absent Rate")}
            />
            <Bar
              dataKey="present"
              fill="#10b981"
              legendType="circle"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="absent"
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