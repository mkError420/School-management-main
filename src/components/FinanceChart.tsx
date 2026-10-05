import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Wallet,
  Receipt,
  Scale,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";

export interface FinanceMonthData {
  name: string;
  month: number;
  income: number;
  expense: number;
  profit: number;
}

export interface FinanceSummary {
  year: number;
  available_years: number[];
  chart: FinanceMonthData[];
  total_income: number;
  total_expense: number;
  net_balance: number;
}

interface FinanceChartProps {
  initialYear?: number;
}

const FinanceChart: React.FC<FinanceChartProps> = ({ initialYear }) => {
  const { theme } = useTheme();
  const { currencySymbol: cs = "$" } = useSiteSettings();
  const isDark = theme === "dark";

  const [year, setYear] = useState<number>(initialYear || new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
  ]);
  const [data, setData] = useState<FinanceMonthData[]>([]);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
  });
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = useCallback(
    (amount: number) => {
      return `${cs}${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [cs]
  );

  const formatYAxis = (val: number) => {
    if (Math.abs(val) >= 1_000_000) return `${cs}${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${cs}${(val / 1_000).toFixed(0)}k`;
    return `${cs}${val}`;
  };

  const loadData = useCallback(
    async (targetYear: number, silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await api.getFinanceChartData(targetYear);
        if (res.success && res.data) {
          const payload: FinanceSummary = res.data;
          setData(Array.isArray(payload.chart) ? payload.chart : []);
          setSummary({
            total_income: Number(payload.total_income || 0),
            total_expense: Number(payload.total_expense || 0),
            net_balance: Number(payload.net_balance || 0),
          });
          if (Array.isArray(payload.available_years) && payload.available_years.length > 0) {
            setAvailableYears(payload.available_years);
          }
        } else {
          setError(res.message || "Failed to load financial statistics.");
        }
      } catch (err: any) {
        setError(err.message || "Unable to connect to financial metrics service.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadData(year);
  }, [year, loadData]);

  // Styling tokens for charts
  const tickColor = isDark ? "#9ca3af" : "#64748b";
  const gridColor = isDark ? "#334155" : "#f1f5f9";
  const isSurplus = summary.net_balance >= 0;

  // Custom rich tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incVal = Number(payload.find((p: any) => p.dataKey === "income")?.value || 0);
      const expVal = Number(payload.find((p: any) => p.dataKey === "expense")?.value || 0);
      const profitVal = incVal - expVal;
      const profitPositive = profitVal >= 0;

      return (
        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[210px] text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {label} {year}
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Monthly Finance</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                Fees (Income):
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(incVal)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Expenses:
              </span>
              <span className="font-bold text-rose-500 dark:text-rose-400">
                {formatCurrency(expVal)}
              </span>
            </div>

            <div className="pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Net Balance:</span>
              <span
                className={`font-bold flex items-center gap-0.5 ${
                  profitPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {profitPositive ? "+" : ""}
                {formatCurrency(profitVal)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 w-full h-full p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
      {/* HEADER SECTION */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Scale size={18} />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
                Financial Performance
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Fees as Income vs. Expenses
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monthly overview of collected school fees (revenue) paired against operating expenditures.
            </p>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-2">
            {/* Year Selector */}
            <div className="relative flex items-center">
              <Calendar size={13} className="absolute left-2.5 text-gray-400 pointer-events-none" />
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="pl-7 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type Toggle */}
            <div className="inline-flex rounded-xl p-0.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setChartType("line")}
                title="Line Chart View"
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  chartType === "line"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <LineChartIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                title="Bar Chart View"
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  chartType === "bar"
                    ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <BarChart3 size={14} />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void loadData(year)}
              disabled={loading}
              title="Refresh Finance Data"
              className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
            </button>
          </div>
        </div>

        {/* SUMMARY STATS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          {/* Income (Fees) */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100/80 dark:border-indigo-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                <Receipt size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                  Fees Collected (Income)
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(summary.total_income)}
                </span>
              </div>
            </div>
            <Link
              to="/fees"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Expenses */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50/70 to-orange-50/40 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-100/80 dark:border-rose-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/30">
                <Wallet size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                  Total Expenses
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(summary.total_expense)}
                </span>
              </div>
            </div>
            <Link
              to="/expenses"
              className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowDownRight size={12} />
            </Link>
          </div>

          {/* Net Balance / Surplus */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isSurplus
                ? "bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-100/80 dark:border-emerald-800/40"
                : "bg-gradient-to-br from-amber-50/70 to-rose-50/40 dark:from-amber-950/30 dark:to-rose-950/20 border-amber-100/80 dark:border-amber-800/40"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-sm ${
                  isSurplus ? "bg-emerald-600 shadow-emerald-600/30" : "bg-amber-600 shadow-amber-600/30"
                }`}
              >
                {isSurplus ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                  Net Balance ({isSurplus ? "Surplus" : "Deficit"})
                </span>
                <span
                  className={`text-base font-bold ${
                    isSurplus
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {isSurplus ? "+" : ""}
                  {formatCurrency(summary.net_balance)}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSurplus
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
              }`}
            >
              {isSurplus ? "Healthy" : "Attention"}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="mb-2 p-2.5 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadData(year)}
            className="font-bold underline ml-2 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* CHART CANVAS */}
      <div className="w-full flex-1 min-h-[300px] pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={data}
              margin={{ top: 10, right: 25, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
                tickLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                align="center"
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: "14px" }}
                formatter={(value: string) => {
                  if (value === "income") return <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fees Collected (Income)</span>;
                  if (value === "expense") return <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Expenses</span>;
                  return value;
                }}
              />
              <Line
                name="income"
                type="monotone"
                dataKey="income"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 3, fill: "#6366f1" }}
                activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2 }}
              />
              <Line
                name="expense"
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ r: 3, fill: "#f43f5e" }}
                activeDot={{ r: 6, stroke: "#f43f5e", strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 10, right: 25, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
                tickLine={false}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                align="center"
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: "14px" }}
                formatter={(value: string) => {
                  if (value === "income") return <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fees Collected (Income)</span>;
                  if (value === "expense") return <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Expenses</span>;
                  return value;
                }}
              />
              <Bar
                name="income"
                dataKey="income"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                name="expense"
                dataKey="expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* FOOTER CAPTION */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time aggregation from verified Fee Payments &amp; Operating Expenses.</span>
        </span>
        <div className="flex items-center gap-3">
          <Link to="/fees" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Fees Breakdown &rarr;
          </Link>
          <Link to="/expenses" className="text-rose-600 dark:text-rose-400 hover:underline font-medium">
            Expense Log &rarr;
          </Link>
          <Link to="/revenue" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            Revenue Analytics &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FinanceChart;