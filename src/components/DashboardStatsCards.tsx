import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  Briefcase,
  BookOpen,
  Building2,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  Scale,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardCounts {
  students: number;
  teachers: number;
  parents: number;
  staff: number;
  classes: number;
  lessons: number;
}

interface FinanceSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  year: number;
}

interface StatCardConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  value: string | number;
  href: string;
  gradient: string;
  iconBg: string;
  textColor: string;
  badgeColor: string;
  description: string;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 p-5 flex flex-col gap-3 min-h-[130px]">
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="w-14 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="w-20 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 mt-1" />
    <div className="w-28 h-4 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

const SkeletonFinCard: React.FC = () => (
  <div className="animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 p-5 flex flex-col gap-3 min-h-[130px]">
    <div className="flex justify-between items-center">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="w-16 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="w-32 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 mt-1" />
    <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<StatCardConfig> = ({
  label,
  icon,
  value,
  href,
  gradient,
  iconBg,
  textColor,
  badgeColor,
  description,
}) => (
  <Link
    to={href}
    className={`group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${gradient}`}
  >
    {/* Decorative circles */}
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

    <div className="flex justify-between items-start relative z-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} shadow-sm`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeColor}`}>
        2025/26
      </span>
    </div>

    <div className="relative z-10 mt-1">
      <p className={`text-3xl font-extrabold tracking-tight ${textColor}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className={`text-sm font-semibold mt-0.5 capitalize ${textColor} opacity-80`}>
        {label}
      </p>
    </div>

    <div className={`flex items-center gap-1 text-[11px] font-medium mt-auto relative z-10 ${textColor} opacity-70`}>
      <span>{description}</span>
      <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform duration-200" />
    </div>
  </Link>
);

// ─── Finance Card ────────────────────────────────────────────────────────────

interface FinanceCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  textColor: string;
  badgeText: string;
  badgeClass: string;
  href: string;
  trend?: "up" | "down" | "neutral";
}

const FinanceCard: React.FC<FinanceCardProps> = ({
  label,
  value,
  icon,
  gradient,
  iconBg,
  textColor,
  badgeText,
  badgeClass,
  href,
  trend,
}) => (
  <Link
    to={href}
    className={`group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${gradient}`}
  >
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

    <div className="flex justify-between items-start relative z-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} shadow-sm`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
        {badgeText}
      </span>
    </div>

    <div className="relative z-10 mt-1">
      <p className={`text-2xl font-extrabold tracking-tight ${textColor}`}>{value}</p>
      <p className={`text-sm font-semibold mt-0.5 ${textColor} opacity-80`}>{label}</p>
    </div>

    <div className={`flex items-center gap-1 text-[11px] font-medium mt-auto relative z-10 ${textColor} opacity-70`}>
      {trend === "up" && <TrendingUp size={12} />}
      {trend === "down" && <TrendingDown size={12} />}
      <span>View details</span>
      <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
    </div>
  </Link>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardStatsCards: React.FC = () => {
  const { currencySymbol: cs = "৳" } = useSiteSettings();
  const { role } = useAuth();

  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currentYear = new Date().getFullYear();

  const formatCurrency = useCallback(
    (amount: number) =>
      `${cs}${Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
    [cs]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, finRes] = await Promise.allSettled([
        api.getDashboard(),
        api.getFinanceChartData(currentYear),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.success && dashRes.value.data) {
        const d = dashRes.value.data;
        setCounts({
          students: Number(d.counts?.students ?? 0),
          teachers: Number(d.counts?.teachers ?? 0),
          parents: Number(d.counts?.parents ?? 0),
          staff: Number(d.counts?.staff ?? 0),
          classes: Number(d.counts?.classes ?? 0),
          lessons: Number(d.counts?.lessons ?? 0),
        });
      } else if (dashRes.status === "fulfilled") {
        setError(dashRes.value.message || "Failed to load dashboard stats.");
      }

      if (finRes.status === "fulfilled" && finRes.value.success && finRes.value.data) {
        const f = finRes.value.data;
        setFinance({
          total_income: Number(f.total_income ?? 0),
          total_expense: Number(f.total_expense ?? 0),
          net_balance: Number(f.net_balance ?? 0),
          year: Number(f.year ?? currentYear),
        });
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    void load();
  }, [load]);

  const isSurplus = (finance?.net_balance ?? 0) >= 0;
  const isAdmin = role === "admin" || role === "super_admin";

  // ── People cards ─────────────────────────────────────────────────────────
  const peopleCards: StatCardConfig[] = [
    {
      key: "students",
      label: "Students",
      icon: <GraduationCap size={20} className="text-white" />,
      value: counts?.students ?? 0,
      href: "/list/students",
      gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
      iconBg: "bg-white/20",
      textColor: "text-white",
      badgeColor: "bg-white/20 text-white",
      description: "View all students",
    },
    {
      key: "teachers",
      label: "Teachers",
      icon: <UserCheck size={20} className="text-white" />,
      value: counts?.teachers ?? 0,
      href: "/list/teachers",
      gradient: "bg-gradient-to-br from-sky-400 to-blue-600",
      iconBg: "bg-white/20",
      textColor: "text-white",
      badgeColor: "bg-white/20 text-white",
      description: "View all teachers",
    },
    {
      key: "parents",
      label: "Parents",
      icon: <Users size={20} className="text-white" />,
      value: counts?.parents ?? 0,
      href: "/list/parents",
      gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
      iconBg: "bg-white/20",
      textColor: "text-white",
      badgeColor: "bg-white/20 text-white",
      description: "View all parents",
    },
    {
      key: "staff",
      label: "Staff",
      icon: <Briefcase size={20} className="text-white" />,
      value: counts?.staff ?? 0,
      href: "/list/staff",
      gradient: "bg-gradient-to-br from-rose-400 to-pink-600",
      iconBg: "bg-white/20",
      textColor: "text-white",
      badgeColor: "bg-white/20 text-white",
      description: "View all staff",
    },
    {
      key: "classes",
      label: "Classes",
      icon: <Building2 size={20} className="text-white" />,
      value: counts?.classes ?? 0,
      href: "/list/classes",
      gradient: "bg-gradient-to-br from-teal-400 to-emerald-600",
      iconBg: "bg-white/20",
      textColor: "text-white",
      badgeColor: "bg-white/20 text-white",
      description: "Manage classes",
    },
    {
      key: "lessons",
      label: "Lessons",
      icon: <BookOpen size={20} className="text-white" />,
      value: counts?.lessons ?? 0,
      href: "/list/lessons",
      gradient: "bg-gradient-to-br from-indigo-400 to-blue-700",
      iconBg: "bg-white/20",
      textColor: "text-white",
      badgeColor: "bg-white/20 text-white",
      description: "View lesson plan",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-blue-600 rounded-full" />
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Dashboard Overview
          </h2>
          {lastUpdated && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          title="Refresh dashboard stats"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-violet-500" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
          <span>⚠ {error}</span>
          <button
            onClick={() => void load()}
            className="font-bold underline ml-2 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── People & Academics ────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500 mb-3">
          People &amp; Academics
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : peopleCards.map((card) => <StatCard key={card.key} {...card} />)}
        </div>
      </div>

      {/* ── Financial KPIs (admin / super_admin only) ─────────────────────── */}
      {isAdmin && (
        <div>
          <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500 mb-3">
            Financial Summary — {finance?.year ?? currentYear}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {loading || !finance ? (
              <>
                <SkeletonFinCard />
                <SkeletonFinCard />
                <SkeletonFinCard />
              </>
            ) : (
              <>
                <FinanceCard
                  label="Fees Collected (Income)"
                  value={formatCurrency(finance.total_income)}
                  icon={<Receipt size={20} className="text-white" />}
                  gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
                  iconBg="bg-white/20"
                  textColor="text-white"
                  badgeText="Income"
                  badgeClass="bg-white/20 text-white"
                  href="/fees"
                  trend="up"
                />
                <FinanceCard
                  label="Total Expenses"
                  value={formatCurrency(finance.total_expense)}
                  icon={<Wallet size={20} className="text-white" />}
                  gradient="bg-gradient-to-br from-rose-500 to-pink-600"
                  iconBg="bg-white/20"
                  textColor="text-white"
                  badgeText="Expense"
                  badgeClass="bg-white/20 text-white"
                  href="/expenses"
                  trend="down"
                />
                <FinanceCard
                  label={`Net Balance (${isSurplus ? "Surplus" : "Deficit"})`}
                  value={`${isSurplus ? "+" : ""}${formatCurrency(finance.net_balance)}`}
                  icon={<Scale size={20} className="text-white" />}
                  gradient={
                    isSurplus
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                      : "bg-gradient-to-br from-amber-500 to-orange-600"
                  }
                  iconBg="bg-white/20"
                  textColor="text-white"
                  badgeText={isSurplus ? "Healthy ✓" : "⚠ Deficit"}
                  badgeClass="bg-white/20 text-white"
                  href="/revenue"
                  trend={isSurplus ? "up" : "down"}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatsCards;
