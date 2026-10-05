import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LineChart as LineChartIcon,
  Percent,
  PieChart,
  Printer,
  Receipt,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  RevenueAnalyticsData,
  RevenueCategoryBreakdown,
  RevenueMonthData,
  RevenueSummaryMetrics,
  RevenueTransactionItem,
} from "@/types/revenue";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const defaultEmptySummary: RevenueSummaryMetrics = {
  total_income: 0,
  total_billed: 0,
  total_pending_fees: 0,
  collection_rate: 0,
  total_expenses: 0,
  paid_expenses: 0,
  pending_expenses: 0,
  approved_expenses: 0,
  net_revenue: 0,
  profit_margin: 0,
  status: "surplus",
  payments_count: 0,
  expenses_count: 0,
};

const ITEMS_PER_PAGE = 15;

const RevenueSection: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { siteName = "School Management", currencySymbol: cs = "$" } = useSiteSettings();

  // Helper – currency formatting
  const fmt = useCallback(
    (n: number | string) => {
      const num = Number(n);
      return `${cs}${(isNaN(num) ? 0 : num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [cs]
  );

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "transactions" | "statement">("overview");

  // Filter state
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear, currentYear - 1, currentYear - 2]);
  const [periodPreset, setPeriodPreset] = useState<"year" | "this_month" | "last_month" | "quarter" | "custom" | "all">("year");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Chart configuration
  const [chartType, setChartType] = useState<"bars" | "area" | "net">("bars");

  // Ledger / Transaction tab filters
  const [transSearch, setTransSearch] = useState("");
  const [transTypeFilter, setTransTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [transCategoryFilter, setTransCategoryFilter] = useState<string>("ALL");
  const [transPage, setTransPage] = useState(1);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<RevenueSummaryMetrics>(defaultEmptySummary);
  const [chartData, setChartData] = useState<RevenueMonthData[]>([]);
  const [feeCategories, setFeeCategories] = useState<RevenueCategoryBreakdown[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<RevenueCategoryBreakdown[]>([]);
  const [transactions, setTransactions] = useState<RevenueTransactionItem[]>([]);

  // Print & Statement dialog
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Core Data Collector & Calculator: Gathers Fees & Expenses and builds analytics
  const loadRevenueData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // Prepare query parameters
        const queryParams: Record<string, string | number> = {
          year: selectedYear,
        };
        if (periodPreset === "custom" && customStartDate && customEndDate) {
          queryParams.start_date = customStartDate;
          queryParams.end_date = customEndDate;
        }

        // Try direct backend API first
        let apiData: RevenueAnalyticsData | null = null;
        try {
          const res = await api.getRevenueSummary(queryParams);
          if (res.success && res.data) {
            apiData = res.data;
          }
        } catch {
          // Backend revenue endpoint might be unreachable or fallback needed
        }

        // Simultaneously fetch raw Fees and Expenses to guarantee complete, real-time data
        // even if local changes were made or MySQL is in mock/offline mode
        let rawInvoices: any[] = [];
        let rawPayments: any[] = [];
        let rawFeeCats: any[] = [];
        let rawExpenses: any[] = [];

        // 1. Fetch fees data
        try {
          const [feesRes, payRes, catRes] = await Promise.all([
            api.getAll("fees", { limit: 500 }),
            api.getFeePayments({ limit: 500 }),
            api.getFeeCategories(),
          ]);

          if (feesRes.success && Array.isArray(feesRes.data?.fees)) {
            rawInvoices = feesRes.data.fees;
          }
          if (payRes.success && Array.isArray(payRes.data?.payments)) {
            rawPayments = payRes.data.payments;
          }
          if (catRes.success && Array.isArray(catRes.data?.categories)) {
            rawFeeCats = catRes.data.categories;
          }
        } catch {}

        // Fallback to localStorage for Fees if API returned empty
        if (rawInvoices.length === 0) {
          const storedInv = localStorage.getItem("mk_school_fees_invoices");
          if (storedInv) {
            try { rawInvoices = JSON.parse(storedInv); } catch {}
          }
        }
        if (rawPayments.length === 0) {
          const storedPay = localStorage.getItem("mk_school_fee_payments");
          if (storedPay) {
            try { rawPayments = JSON.parse(storedPay); } catch {}
          }
        }
        if (rawFeeCats.length === 0) {
          const storedCats = localStorage.getItem("mk_school_fee_categories");
          if (storedCats) {
            try { rawFeeCats = JSON.parse(storedCats); } catch {}
          }
        }

        // 2. Fetch expenses data
        try {
          const expRes = await api.getAll("expenses", { limit: 500 });
          const raw = expRes.data ?? expRes.message;
          if (raw && typeof raw === "object" && Array.isArray((raw as any).expenses)) {
            rawExpenses = (raw as any).expenses;
          } else if (Array.isArray(raw)) {
            rawExpenses = raw;
          }
        } catch {}

        // Fallback to localStorage for Expenses if empty
        if (rawExpenses.length === 0) {
          const storedExp = localStorage.getItem("mk_school_expenses");
          if (storedExp) {
            try { rawExpenses = JSON.parse(storedExp); } catch {}
          }
        }

        // If API returned solid populated data and we have no newer local overrides, use API data
        if (apiData && apiData.summary && (apiData.summary.total_income > 0 || apiData.summary.total_expenses > 0)) {
          setSummary(apiData.summary);
          setChartData(apiData.chart || []);
          setFeeCategories(apiData.fee_categories || []);
          setExpenseCategories(apiData.expense_categories || []);
          setTransactions(apiData.recent_transactions || []);
          if (Array.isArray(apiData.available_years) && apiData.available_years.length > 0) {
            setAvailableYears(apiData.available_years);
          }
          return;
        }

        // Otherwise: Synthesize full analytics directly from raw Fees and Expenses collections!
        // This calculates Revenue with 100% precision directly from both sources.

        // Filter date predicates
        const matchesDateFilter = (dateStr?: string) => {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;

          if (periodPreset === "all") return true;

          if (periodPreset === "custom" && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return d >= start && d <= end;
          }

          if (periodPreset === "this_month") {
            const now = new Date();
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
          }

          if (periodPreset === "last_month") {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
          }

          if (periodPreset === "quarter") {
            const now = new Date();
            const currentQ = Math.floor(now.getMonth() / 3);
            const itemQ = Math.floor(d.getMonth() / 3);
            return d.getFullYear() === now.getFullYear() && itemQ === currentQ;
          }

          // Default: By selected year
          return d.getFullYear() === selectedYear;
        };

        // 1. Calculate Fee Revenues
        let calculatedIncome = 0;
        let calculatedBilled = 0;
        let calculatedPendingFees = 0;
        let paymentsCount = 0;

        const feeCatMap: Record<string, { id?: any; name: string; amount: number; billed: number; count: number }> = {};
        rawFeeCats.forEach((c) => {
          feeCatMap[String(c.id)] = { id: c.id, name: c.name, amount: 0, billed: 0, count: 0 };
        });

        // Sum from fee invoices (for billed amounts, due amounts, category assignments)
        rawInvoices.forEach((inv) => {
          const invDate = inv.updated_at || inv.created_at || inv.due_date;
          if (matchesDateFilter(invDate)) {
            const bill = Number(inv.amount || 0) - Number(inv.discount || 0);
            const paid = Number(inv.paid_amount || 0);
            calculatedBilled += bill;
            calculatedPendingFees += Math.max(0, bill - paid);

            const catId = String(inv.fee_category_id || 1);
            if (!feeCatMap[catId]) {
              feeCatMap[catId] = {
                id: catId,
                name: inv.category_name || "Tuition / Academic Fee",
                amount: 0,
                billed: 0,
                count: 0,
              };
            }
            feeCatMap[catId].billed += bill;
            feeCatMap[catId].amount += paid;
            feeCatMap[catId].count += 1;
          }
        });

        // Unified list of transaction items
        const unifiedTransactions: RevenueTransactionItem[] = [];

        // Sum from fee payments (actual cash inflow)
        if (rawPayments.length > 0) {
          rawPayments.forEach((p) => {
            const pDate = p.payment_date || p.created_at;
            if (matchesDateFilter(pDate)) {
              const amt = Number(p.amount || 0);
              calculatedIncome += amt;
              paymentsCount += 1;

              unifiedTransactions.push({
                id: `fee_${p.id || Math.random()}`,
                type: "INCOME",
                title: p.invoice_title || p.title || "Student Fee Payment",
                ref_no: p.receipt_no || `REC-${p.id || 100}`,
                category: p.category_name || "Fee Collection",
                amount: amt,
                date: (pDate || "").split("T")[0] || new Date().toISOString().split("T")[0],
                payment_method: p.payment_method || "CASH",
                party: p.student_name ? `${p.student_name} ${p.student_surname || ""}` : "Student",
                status: "PAID",
                notes: p.notes || "",
              });
            }
          });
        } else {
          // If no separate payment logs, use invoice paid amounts as income
          calculatedIncome = rawInvoices.reduce((acc, inv) => {
            const invDate = inv.updated_at || inv.created_at || inv.due_date;
            if (matchesDateFilter(invDate)) {
              return acc + Number(inv.paid_amount || 0);
            }
            return acc;
          }, 0);
          paymentsCount = rawInvoices.filter((inv) => Number(inv.paid_amount || 0) > 0).length;

          rawInvoices.forEach((inv) => {
            if (Number(inv.paid_amount || 0) > 0) {
              const invDate = inv.updated_at || inv.created_at || inv.due_date;
              if (matchesDateFilter(invDate)) {
                unifiedTransactions.push({
                  id: `inv_${inv.id}`,
                  type: "INCOME",
                  title: inv.title || "Tuition Fee Invoice",
                  ref_no: inv.invoice_no || `INV-${inv.id}`,
                  category: inv.category_name || "Tuition",
                  amount: Number(inv.paid_amount || 0),
                  date: (invDate || "").split("T")[0] || new Date().toISOString().split("T")[0],
                  payment_method: "CASH",
                  party: inv.student_name ? `${inv.student_name} ${inv.student_surname || ""}` : "Student",
                  status: inv.status || "PAID",
                  notes: inv.notes || "",
                });
              }
            }
          });
        }

        // 2. Calculate Expenses
        let calculatedExpenses = 0;
        let paidExpenses = 0;
        let pendingExpenses = 0;
        let approvedExpenses = 0;
        let expensesCount = 0;

        const expCatMap: Record<string, { category: string; name: string; amount: number; count: number }> = {
          SALARY: { category: "SALARY", name: "Staff Salaries", amount: 0, count: 0 },
          UTILITIES: { category: "UTILITIES", name: "Utilities (Electric, Water, Gas)", amount: 0, count: 0 },
          MAINTENANCE: { category: "MAINTENANCE", name: "Building Maintenance", amount: 0, count: 0 },
          SUPPLIES: { category: "SUPPLIES", name: "Office & School Supplies", amount: 0, count: 0 },
          TRANSPORT: { category: "TRANSPORT", name: "Transportation", amount: 0, count: 0 },
          MARKETING: { category: "MARKETING", name: "Marketing & Promotion", amount: 0, count: 0 },
          EVENTS: { category: "EVENTS", name: "Events & Activities", amount: 0, count: 0 },
          OTHER: { category: "OTHER", name: "Other Expenses", amount: 0, count: 0 },
        };

        rawExpenses.forEach((exp) => {
          if (exp.status === "REJECTED") return;
          const expDate = exp.paid_date || exp.expense_date || exp.created_at;
          if (matchesDateFilter(expDate)) {
            const amt = Number(exp.amount || 0);
            calculatedExpenses += amt;
            expensesCount += 1;

            if (exp.status === "PAID") paidExpenses += amt;
            else if (exp.status === "PENDING") pendingExpenses += amt;
            else if (exp.status === "APPROVED") approvedExpenses += amt;

            const cat = exp.category || "OTHER";
            if (!expCatMap[cat]) {
              expCatMap[cat] = { category: cat, name: cat, amount: 0, count: 0 };
            }
            expCatMap[cat].amount += amt;
            expCatMap[cat].count += 1;

            unifiedTransactions.push({
              id: `exp_${exp.id}`,
              type: "EXPENSE",
              title: exp.title || "School Expenditure",
              ref_no: exp.expense_no || `EXP-${exp.id}`,
              category: expCatMap[cat]?.name || cat,
              amount: amt,
              date: (expDate || "").split("T")[0] || new Date().toISOString().split("T")[0],
              payment_method: exp.payment_method || "CASH",
              party: exp.vendor || "Payee / Supplier",
              status: exp.status || "APPROVED",
              notes: exp.description || exp.notes || "",
            });
          }
        });

        // Net calculations
        const netRev = calculatedIncome - calculatedExpenses;
        const marginPct = calculatedIncome > 0 ? (netRev / calculatedIncome) * 100 : 0;
        const colRate = calculatedBilled > 0 ? (calculatedIncome / calculatedBilled) * 100 : 100;

        setSummary({
          total_income: calculatedIncome,
          total_billed: calculatedBilled,
          total_pending_fees: calculatedPendingFees,
          collection_rate: Math.min(100, Math.round(colRate * 10) / 10),
          total_expenses: calculatedExpenses,
          paid_expenses: paidExpenses,
          pending_expenses: pendingExpenses,
          approved_expenses: approvedExpenses,
          net_revenue: netRev,
          profit_margin: Math.round(marginPct * 10) / 10,
          status: netRev >= 0 ? "surplus" : "deficit",
          payments_count: paymentsCount,
          expenses_count: expensesCount,
        });

        // 3. Month by Month Trend Data (for 12 months of selectedYear)
        const monthlyChart: RevenueMonthData[] = [];
        for (let m = 0; m < 12; m++) {
          const monthIncome = (rawPayments.length > 0 ? rawPayments : rawInvoices).reduce((acc, item) => {
            const d = new Date(item.payment_date || item.updated_at || item.created_at || item.due_date);
            if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear && d.getMonth() === m) {
              return acc + Number(item.amount || item.paid_amount || 0);
            }
            return acc;
          }, 0);

          const monthExpense = rawExpenses.reduce((acc, item) => {
            if (item.status === "REJECTED") return acc;
            const d = new Date(item.paid_date || item.expense_date || item.created_at);
            if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear && d.getMonth() === m) {
              return acc + Number(item.amount || 0);
            }
            return acc;
          }, 0);

          const net = monthIncome - monthExpense;
          const margin = monthIncome > 0 ? (net / monthIncome) * 100 : 0;

          monthlyChart.push({
            name: SHORT_MONTHS[m],
            month: m + 1,
            income: Math.round(monthIncome * 100) / 100,
            expense: Math.round(monthExpense * 100) / 100,
            net: Math.round(net * 100) / 100,
            margin: Math.round(margin * 10) / 10,
          });
        }
        setChartData(monthlyChart);

        // 4. Category Breakdowns
        const feeCatsList: RevenueCategoryBreakdown[] = Object.values(feeCatMap)
          .filter((c) => c.amount > 0 || c.billed > 0)
          .map((c) => ({
            id: c.id,
            name: c.name,
            amount: c.amount,
            billed: c.billed,
            count: c.count,
            percentage: calculatedIncome > 0 ? Math.round((c.amount / calculatedIncome) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.amount - a.amount);
        setFeeCategories(feeCatsList);

        const expCatsList: RevenueCategoryBreakdown[] = Object.values(expCatMap)
          .filter((c) => c.amount > 0)
          .map((c) => ({
            category: c.category,
            name: c.name,
            amount: c.amount,
            count: c.count,
            percentage: calculatedExpenses > 0 ? Math.round((c.amount / calculatedExpenses) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.amount - a.amount);
        setExpenseCategories(expCatsList);

        // 5. Sort transactions descending by date
        unifiedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(unifiedTransactions);

        // Available years discovery
        const discoveredYears = new Set<number>([currentYear]);
        [...rawPayments, ...rawInvoices, ...rawExpenses].forEach((item) => {
          const d = new Date(item.payment_date || item.expense_date || item.due_date || item.created_at);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            if (y >= 2020 && y <= 2030) discoveredYears.add(y);
          }
        });
        const sortedYears = Array.from(discoveredYears).sort((a, b) => b - a);
        setAvailableYears(sortedYears);
      } catch (err: any) {
        console.error("Error loading revenue data:", err);
        setError("Unable to process financial statistics. Please check your data sources.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear, periodPreset, customStartDate, customEndDate]
  );

  useEffect(() => {
    void loadRevenueData();
  }, [loadRevenueData]);

  // Filtered transactions for the ledger table
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (transTypeFilter !== "ALL" && t.type !== transTypeFilter) return false;
      if (transCategoryFilter !== "ALL" && t.category !== transCategoryFilter) return false;
      if (transSearch.trim()) {
        const q = transSearch.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesRef = t.ref_no.toLowerCase().includes(q);
        const matchesParty = t.party.toLowerCase().includes(q);
        const matchesCat = t.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRef && !matchesParty && !matchesCat) return false;
      }
      return true;
    });
  }, [transactions, transTypeFilter, transCategoryFilter, transSearch]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (transPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, transPage]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date", "Type", "Reference", "Title", "Category", "Party/Payee", "Payment Method", "Amount", "Status"];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.ref_no}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.party.replace(/"/g, '""')}"`,
      `"${t.payment_method}"`,
      t.type === "INCOME" ? t.amount : -t.amount,
      `"${t.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `School_Revenue_Ledger_${selectedYear}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tooltip colors & styling
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#334155" : "#f1f5f9";

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const inc = Number(payload.find((p: any) => p.dataKey === "income")?.value || 0);
      const exp = Number(payload.find((p: any) => p.dataKey === "expense")?.value || 0);
      const net = inc - exp;
      return (
        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[220px] text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {label} {selectedYear}
            </span>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Financial Flow</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Fees (Revenue):
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(inc)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Expenses:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{fmt(exp)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span className="font-bold text-gray-700 dark:text-gray-300">Net Profit / Margin:</span>
              <span className={`font-black ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {fmt(net)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 1. SECTION HEADER & QUICK ACTIONS */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Revenue & Financial Performance
                </h1>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Automated net revenue calculations synthesizing student Fee collections and operational Expenses
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Date Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar size={14} className="text-gray-400 mr-2" />
              <select
                aria-label="Select Fiscal Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-gray-800 dark:text-gray-200 font-semibold focus:outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Presets */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter size={14} className="text-gray-400 mr-2" />
              <select
                aria-label="Select Time Period"
                value={periodPreset}
                onChange={(e) => setPeriodPreset(e.target.value as any)}
                className="bg-transparent text-gray-800 dark:text-gray-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="year" className="dark:bg-gray-800">Full Year {selectedYear}</option>
                <option value="this_month" className="dark:bg-gray-800">This Month</option>
                <option value="last_month" className="dark:bg-gray-800">Last Month</option>
                <option value="quarter" className="dark:bg-gray-800">Current Quarter</option>
                <option value="custom" className="dark:bg-gray-800">Custom Date Range</option>
                <option value="all" className="dark:bg-gray-800">All Time Records</option>
              </select>
            </div>

            {/* Custom Date Pickers */}
            {periodPreset === "custom" && (
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-xs">
                <input
                  type="date"
                  aria-label="Start Date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  aria-label="End Date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none"
                />
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => void loadRevenueData(true)}
              disabled={refreshing}
              title="Refresh financial analytics"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium transition"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition shadow-sm"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Print / Statement button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm shadow-indigo-600/20"
            >
              <Printer size={14} />
              <span>Statement</span>
            </button>
          </div>
        </div>

        {/* Error banner if any */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-amber-600 hover:underline font-semibold ml-2">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* 2. TOP KPI CARDS – FINANCIAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue (Fees Inflow) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Revenue (Fees)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {loading ? "..." : fmt(summary.total_income)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.collection_rate}% collected
              </span>
              <span>•</span>
              <span>{summary.payments_count} transactions</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Total Billed: <strong className="text-gray-700 dark:text-gray-300">{fmt(summary.total_billed)}</strong></span>
            <span>Due: <strong className="text-amber-600 dark:text-amber-400">{fmt(summary.total_pending_fees)}</strong></span>
          </div>
        </div>

        {/* Card 2: Total Operating Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {loading ? "..." : fmt(summary.total_expenses)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {fmt(summary.paid_expenses)} paid
              </span>
              <span>•</span>
              <span>{summary.expenses_count} items</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Pending Payables:</span>
            <strong className="text-rose-600 dark:text-rose-400">{fmt(summary.pending_expenses)}</strong>
          </div>
        </div>

        {/* Card 3: Net Revenue (Surplus / Deficit) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div
            className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none group-hover:scale-110 transition ${
              summary.net_revenue >= 0 ? "bg-indigo-500/10" : "bg-red-500/10"
            }`}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Net Revenue / Profit
            </span>
            <div
              className={`p-2 rounded-xl border ${
                summary.net_revenue >= 0
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800"
              }`}
            >
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black tracking-tight ${
                summary.net_revenue >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {loading ? "..." : (summary.net_revenue < 0 ? "-" : "+") + fmt(Math.abs(summary.net_revenue))}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  summary.net_revenue >= 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {summary.net_revenue >= 0 ? "+" : ""}
                {summary.profit_margin}% Margin
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {summary.net_revenue >= 0 ? "Operational Surplus" : "Operational Deficit"}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Formula:</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">Revenue - Expenses</span>
          </div>
        </div>

        {/* Card 4: Operating Health & Ratio */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Financial Health
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mt-3">
            {summary.total_income > 0 ? (
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {Math.round((summary.total_expenses / summary.total_income) * 100)}%
              </div>
            ) : (
              <div className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">0%</div>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Operating Expense Ratio</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>Projected Net:</span>
            <strong className="text-gray-800 dark:text-gray-200">
              {fmt(summary.total_billed - (summary.paid_expenses + summary.pending_expenses))}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "overview"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <BarChart3 size={16} />
          <span>Overview & Visual Trends</span>
        </button>

        <button
          onClick={() => setActiveTab("breakdown")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "breakdown"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <PieChart size={16} />
          <span>Category Inflows & Outflows</span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "transactions"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Receipt size={16} />
          <span>Cash Flow Ledger ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("statement")}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
            activeTab === "statement"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <FileText size={16} />
          <span>Profit & Loss Statement</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Main Chart Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100">
                  Monthly Revenue vs Expenditure Comparison
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tracking monthly cash inflows (Fees) against operational outflows (Expenses) for {selectedYear}
                </p>
              </div>

              {/* Chart Type Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setChartType("bars")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    chartType === "bars"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>Bar Chart</span>
                </button>
                <button
                  onClick={() => setChartType("area")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    chartType === "area"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>Area Chart</span>
                </button>
                <button
                  onClick={() => setChartType("net")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    chartType === "net"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  <LineChartIcon size={14} />
                  <span>Net Margin</span>
                </button>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bars" ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={tickColor} tickLine={false} axisLine={{ stroke: gridColor }} />
                    <YAxis
                      stroke={tickColor}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                      tickFormatter={(v) => `${cs}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "14px" }} />
                    <Bar dataKey="income" name="Fee Revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    <Bar dataKey="expense" name="Expenditures" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                ) : chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorRevExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={tickColor} tickLine={false} axisLine={{ stroke: gridColor }} />
                    <YAxis
                      stroke={tickColor}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                      tickFormatter={(v) => `${cs}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "14px" }} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Fee Revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevIncome)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expenditures"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevExpense)"
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="name" stroke={tickColor} tickLine={false} axisLine={{ stroke: gridColor }} />
                    <YAxis
                      stroke={tickColor}
                      tickLine={false}
                      axisLine={{ stroke: gridColor }}
                      tickFormatter={(v) => `${cs}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "14px" }} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net Balance (Surplus/Deficit)"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#6366f1" }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Financial Performance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">
                  Month-by-Month Financial Summary ({selectedYear})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Itemized monthly performance with net operating profit and profit margin percentage
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Fee Income</th>
                    <th className="py-3 px-4 text-right">Expenses</th>
                    <th className="py-3 px-4 text-right">Net Revenue</th>
                    <th className="py-3 px-4 text-right">Margin %</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {chartData.map((row) => {
                    const isPositive = row.net >= 0;
                    const hasActivity = row.income > 0 || row.expense > 0;
                    return (
                      <tr key={row.month} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition">
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                          {MONTH_NAMES[row.month - 1]}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {fmt(row.income)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                          {fmt(row.expense)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {(row.net < 0 ? "-" : "+") + fmt(Math.abs(row.net))}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 font-semibold">
                          {row.income > 0 ? `${row.margin}%` : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasActivity ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPositive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              {isPositive ? "Surplus" : "Deficit"}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50/90 dark:bg-gray-900/90 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    <td className="py-3.5 px-4 text-gray-900 dark:text-gray-100">Annual Total</td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      {fmt(summary.total_income)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">
                      {fmt(summary.total_expenses)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right text-sm ${
                        summary.net_revenue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {(summary.net_revenue < 0 ? "-" : "+") + fmt(Math.abs(summary.net_revenue))}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-900 dark:text-gray-100">
                      {summary.profit_margin}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                          summary.net_revenue >= 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                        }`}
                      >
                        {summary.net_revenue >= 0 ? "SURPLUS" : "DEFICIT"}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY INFLOWS & OUTFLOWS */}
      {activeTab === "breakdown" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Fee Revenue by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                      Revenue by Fee Category
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Collected income broken down across fee types
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {fmt(summary.total_income)}
                </span>
              </div>

              {feeCategories.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No fee categories recorded for this time range.
                </div>
              ) : (
                <div className="space-y-4">
                  {feeCategories.map((cat, idx) => (
                    <div key={cat.id || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{fmt(cat.amount)}</span>
                          <span className="text-[11px] text-gray-400 ml-2">({cat.percentage}%)</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{cat.count} payments / invoices</span>
                        {cat.billed !== undefined && cat.billed > 0 && (
                          <span>Billed: {fmt(cat.billed)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
              <span>Total Fee Streams: <strong>{feeCategories.length}</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% of Revenue</span>
            </div>
          </div>

          {/* Right Column: Expenditures by Expense Category */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 md:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                      Expenditures by Category
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Operating costs broken down across school expenses
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                  {fmt(summary.total_expenses)}
                </span>
              </div>

              {expenseCategories.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No expense records found for this period.
                </div>
              ) : (
                <div className="space-y-4">
                  {expenseCategories.map((cat, idx) => (
                    <div key={cat.category || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{fmt(cat.amount)}</span>
                          <span className="text-[11px] text-gray-400 ml-2">({cat.percentage}%)</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{cat.count} expenditure entries</span>
                        <span>{cat.percentage}% of costs</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
              <span>Total Expense Categories: <strong>{expenseCategories.length}</strong></span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">100% of Outflows</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CASH FLOW & UNIFIED LEDGER */}
      {activeTab === "transactions" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 md:p-5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions by title, student, vendor, or ref..."
                value={transSearch}
                onChange={(e) => {
                  setTransSearch(e.target.value);
                  setTransPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Type & Category Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-gray-400 mr-2">Type:</span>
                <select
                  aria-label="Filter by Type"
                  value={transTypeFilter}
                  onChange={(e) => {
                    setTransTypeFilter(e.target.value as any);
                    setTransPage(1);
                  }}
                  className="bg-transparent text-gray-800 dark:text-gray-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="dark:bg-gray-800">All Flow Types</option>
                  <option value="INCOME" className="dark:bg-gray-800">Income (Fees) Only</option>
                  <option value="EXPENSE" className="dark:bg-gray-800">Expenses Only</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium transition"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Flow Type</th>
                  <th className="py-3 px-4">Title / Purpose</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Student / Vendor</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No transaction records match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t) => {
                    const isIncome = t.type === "INCOME";
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition">
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono">
                          {t.date}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              isIncome
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                            }`}
                          >
                            {isIncome ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {isIncome ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                          {t.title}
                        </td>
                        <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                          {t.ref_no}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                          {t.category}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {t.party}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {t.payment_method}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-black text-sm ${
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}{fmt(t.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              t.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : t.status === "APPROVED"
                                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredTransactions.length === 0 ? 0 : (transPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(transPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} items
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={transPage <= 1}
                onClick={() => setTransPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-semibold text-gray-700 dark:text-gray-300">
                {transPage} / {totalPages}
              </span>
              <button
                disabled={transPage >= totalPages}
                onClick={() => setTransPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROFIT & LOSS STATEMENT */}
      {activeTab === "statement" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 shadow-sm max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {siteName}
            </h2>
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mt-1">
              Statement of Financial Performance (Profit & Loss)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Period: For Fiscal Year {selectedYear} • Currency: {cs}
            </p>
          </div>

          {/* I. Operating Revenues */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-emerald-600">
              <h4 className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs tracking-wider">
                I. Operating Revenue (Fees Inflow)
              </h4>
              <span className="text-xs text-gray-500">Collected Amount</span>
            </div>
            <div className="space-y-2 text-xs">
              {feeCategories.map((c) => (
                <div key={c.id || c.name} className="flex items-center justify-between py-1 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-750">
                  <span className="pl-4">{c.name}</span>
                  <span className="font-semibold">{fmt(c.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                <span>Total Operating Revenue</span>
                <span>{fmt(summary.total_income)}</span>
              </div>
            </div>
          </div>

          {/* II. Operating Expenses */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-rose-600">
              <h4 className="font-black text-gray-900 dark:text-gray-100 uppercase text-xs tracking-wider">
                II. Operating Expenditures
              </h4>
              <span className="text-xs text-gray-500">Disbursed Amount</span>
            </div>
            <div className="space-y-2 text-xs">
              {expenseCategories.map((c) => (
                <div key={c.category || c.name} className="flex items-center justify-between py-1 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-750">
                  <span className="pl-4">{c.name}</span>
                  <span className="font-semibold">{fmt(c.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-sm font-bold text-rose-700 dark:text-rose-400">
                <span>Total Operating Expenses</span>
                <span>{fmt(summary.total_expenses)}</span>
              </div>
            </div>
          </div>

          {/* III. Net Profit / (Loss) */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-base font-black">
              <span className="text-gray-900 dark:text-gray-100">
                III. Net Operating {summary.net_revenue >= 0 ? "Surplus (Profit)" : "Deficit (Loss)"}
              </span>
              <span
                className={
                  summary.net_revenue >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }
              >
                {(summary.net_revenue < 0 ? "-" : "+") + fmt(Math.abs(summary.net_revenue))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>Operating Profit Margin</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{summary.profit_margin}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Printer size={15} />
              <span>Print Official Statement</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. PRINT STATEMENT MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Financial Statement Summary
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 space-y-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>School:</span>
                  <span>{siteName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reporting Fiscal Year:</span>
                  <span className="font-mono">{selectedYear}</span>
                </div>
                <div className="flex justify-between">
                  <span>Generated Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold text-emerald-600">
                  <span>Total Revenue Collected (Fees):</span>
                  <span>{fmt(summary.total_income)}</span>
                </div>
                <div className="flex justify-between font-semibold text-rose-600">
                  <span>Total Operating Expenses:</span>
                  <span>{fmt(summary.total_expenses)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Net Operating Revenue:</span>
                  <span
                    className={
                      summary.net_revenue >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }
                  >
                    {(summary.net_revenue < 0 ? "-" : "+") + fmt(Math.abs(summary.net_revenue))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Net Profit Margin:</span>
                  <span>{summary.profit_margin}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueSection;
