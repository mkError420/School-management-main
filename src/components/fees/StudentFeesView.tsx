import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { FeeInvoice, FeeReceiptData, FeeStatus } from "@/types/fees";
import FeeReceiptSlipModal from "./FeeReceiptSlipModal";

export interface StudentFeesViewProps {
  studentId?: string | number;
  parentId?: string | number;
  initialFees?: FeeInvoice[];
  initialSummary?: {
    total_billed: number;
    total_paid: number;
    total_due: number;
    upcoming_due: number;
    overdue_due?: number;
    total_invoices?: number;
    paid_count?: number;
    due_count?: number;
    upcoming_count?: number;
  };
  childrenStudents?: Array<{ id: string | number; name: string; surname?: string; roll?: string; class_name?: string }>;
  title?: string;
  subtitle?: string;
  showStudentColumn?: boolean;
}

export const StudentFeesView: React.FC<StudentFeesViewProps> = ({
  studentId,
  parentId,
  initialFees,
  initialSummary,
  childrenStudents,
  title = "Fee Invoices & Payment Record",
  subtitle = "View paid vouchers, outstanding balances, and upcoming scheduled term fees",
  showStudentColumn = false,
}) => {
  const { currencySymbol: cs } = useSiteSettings();
  const fmt = (n: number | string | undefined) =>
    `${cs}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const [invoices, setInvoices] = useState<FeeInvoice[]>(initialFees || []);
  const [loading, setLoading] = useState<boolean>(!initialFees);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "DUE" | "UPCOMING">("ALL");
  const [search, setSearch] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("ALL");

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<FeeReceiptData | null>(null);

  const fetchFees = useCallback(async () => {
    if (!studentId && !parentId) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: 100 };
      if (studentId) params.student_id = studentId;
      if (parentId) params.parent_id = parentId;

      const res: any = await api.getAll("fees", params);
      const list = res.data?.fees || res.fees || [];
      setInvoices(list);
    } catch (err: any) {
      setError(err?.message || "Could not fetch fee records.");
    } finally {
      setLoading(false);
    }
  }, [studentId, parentId]);

  useEffect(() => {
    if (initialFees) {
      setInvoices(initialFees);
    } else {
      fetchFees();
    }
  }, [initialFees, fetchFees]);

  // Compute live summary stats
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let upcomingDue = 0;
    let paidCount = 0;
    let dueCount = 0;
    let upcomingCount = 0;

    for (const inv of invoices) {
      const net = inv.net_amount ?? (inv.amount - (inv.discount || 0));
      const paid = inv.paid_amount || 0;
      const due = inv.due_amount ?? Math.max(0, net - paid);

      totalBilled += net;
      totalPaid += paid;
      totalDue += due;

      if (inv.status === "PAID" || due === 0) {
        paidCount++;
      } else if (due > 0) {
        dueCount++;
        if (inv.due_date >= todayStr) {
          upcomingDue += due;
          upcomingCount++;
        }
      }
    }

    return {
      totalBilled: initialSummary?.total_billed ?? totalBilled,
      totalPaid: initialSummary?.total_paid ?? totalPaid,
      totalDue: initialSummary?.total_due ?? totalDue,
      upcomingDue: initialSummary?.upcoming_due ?? upcomingDue,
      totalCount: invoices.length,
      paidCount: initialSummary?.paid_count ?? paidCount,
      dueCount: initialSummary?.due_count ?? dueCount,
      upcomingCount: initialSummary?.upcoming_count ?? upcomingCount,
    };
  }, [invoices, initialSummary, todayStr]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      // Child student filter
      if (selectedChildId !== "ALL" && String(inv.student_id) !== String(selectedChildId)) {
        return false;
      }

      // Tab filter
      const net = inv.net_amount ?? (inv.amount - (inv.discount || 0));
      const paid = inv.paid_amount || 0;
      const due = inv.due_amount ?? Math.max(0, net - paid);

      if (activeTab === "PAID" && inv.status !== "PAID" && due > 0) return false;
      if (activeTab === "DUE" && due <= 0) return false;
      if (activeTab === "UPCOMING" && (due <= 0 || inv.due_date < todayStr)) return false;

      // Search term
      if (q) {
        const invNo = (inv.invoice_no || "").toLowerCase();
        const title = (inv.title || "").toLowerCase();
        const cat = (inv.category_name || "").toLowerCase();
        const sName = `${inv.student_name || ""} ${inv.student_surname || ""}`.toLowerCase();
        const sRoll = (inv as any).student_roll ? String((inv as any).student_roll).toLowerCase() : "";
        if (
          !invNo.includes(q) &&
          !title.includes(q) &&
          !cat.includes(q) &&
          !sName.includes(q) &&
          !sRoll.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, activeTab, search, selectedChildId, todayStr]);

  const openReceiptForInvoice = (inv: FeeInvoice) => {
    const net = inv.net_amount ?? (inv.amount - (inv.discount || 0));
    const paid = inv.paid_amount || 0;
    const due = inv.due_amount ?? Math.max(0, net - paid);

    const receipt: FeeReceiptData = {
      id: inv.id,
      receipt_no: `SLIP-${inv.invoice_no}`,
      invoice_id: inv.id,
      student_id: inv.student_id,
      amount: paid > 0 ? paid : net,
      payment_method: paid > 0 ? "CASH" : "OTHER",
      payment_date: inv.created_at ? inv.created_at.slice(0, 10) : todayStr,
      invoice_no: inv.invoice_no,
      invoice_title: inv.title,
      category_name: inv.category_name,
      invoice_amount: inv.amount,
      discount: inv.discount,
      net_amount: net,
      total_paid: paid,
      remaining_due: due,
      due_date: inv.due_date,
      academic_year: inv.academic_year || "2026-2027",
      student_name: inv.student_name,
      student_surname: inv.student_surname,
      student_code: inv.student_id,
      class_name: inv.class_name,
      grade_level: inv.grade_level,
      transaction_ref: `TXN-${inv.invoice_no}`,
    };
    setReceiptData(receipt);
  };

  const getRelativeDueInfo = (dueDate: string, isPaid: boolean) => {
    if (isPaid) return { text: "Cleared", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400" };
    if (!dueDate) return { text: "Due on Notice", color: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300" };

    const due = new Date(dueDate);
    const now = new Date(todayStr);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}`,
        color: "text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 font-bold",
      };
    }
    if (diffDays === 0) {
      return {
        text: "Due Today",
        color: "text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 font-bold",
      };
    }
    return {
      text: `Due in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
      color: "text-sky-800 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300",
    };
  };

  return (
    <section className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/90 shadow-sm overflow-hidden transition">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/80 bg-gradient-to-r from-gray-50/70 via-white to-gray-50/40 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Coins size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                {stats.totalCount} {stats.totalCount === 1 ? "Record" : "Records"}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => fetchFees()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            title="Refresh Fee Invoices"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Stat Cards: Paid, Due, Upcoming */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-gray-50/40 dark:bg-gray-900/30">
        {/* Paid Fees Card */}
        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-gray-800 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Paid Fees</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              {stats.paidCount} Cleared
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
            {fmt(stats.totalPaid)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Settled via bank, mobile banking, or counter
          </div>
        </div>

        {/* Due / Outstanding Card */}
        <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-gray-800 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-600 dark:text-rose-400" />
              <span>Due Balance</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
              {stats.dueCount} Pending
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
            {fmt(stats.totalDue)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Current outstanding &amp; past-due fees
          </div>
        </div>

        {/* Upcoming Fees Card */}
        <div className="p-4 rounded-xl border border-sky-200/80 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/80 to-white dark:from-sky-950/30 dark:to-gray-800 shadow-2xs">
          <div className="flex items-center justify-between text-sky-800 dark:text-sky-300">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-sky-600 dark:text-sky-400" />
              <span>Upcoming Fees</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
              {stats.upcomingCount} Scheduled
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-700 dark:text-sky-400 tracking-tight">
            {fmt(stats.upcomingDue)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Payable in future term &amp; month cycles
          </div>
        </div>
      </div>

      {/* Filter and Tab Toolbar */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Scope Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Invoices", count: stats.totalCount },
            { id: "PAID", label: "Paid", count: stats.paidCount },
            { id: "DUE", label: "Due Balance", count: stats.dueCount },
            { id: "UPCOMING", label: "Upcoming", count: stats.upcomingCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                  : "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id
                  ? "bg-white/20 dark:bg-slate-900/20 text-current"
                  : "bg-gray-200/80 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Child Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          {childrenStudents && childrenStudents.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-xs focus:outline-hidden"
              >
                <option value="ALL">All Children ({childrenStudents.length})</option>
                {childrenStudents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.surname || ""} {c.class_name ? `(${c.class_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table Body */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <RefreshCw className="animate-spin inline-block mr-2" size={16} />
          Loading fee records...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-rose-600 dark:text-rose-400">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchFees()}
            className="mt-2 text-xs font-semibold underline text-sky-600"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center">
          <Receipt size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No invoices found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {search ? "No fee invoices matched your search filter." : "There are no fee records under this section."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-800/60 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-3 px-4">Invoice / Category</th>
                {(showStudentColumn || (childrenStudents && childrenStudents.length > 1)) && (
                  <th className="py-3 px-4">Student</th>
                )}
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Billed Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Due Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredInvoices.map((inv) => {
                const net = inv.net_amount ?? (inv.amount - (inv.discount || 0));
                const paid = inv.paid_amount || 0;
                const due = inv.due_amount ?? Math.max(0, net - paid);
                const isPaid = inv.status === "PAID" || due <= 0;
                const rel = getRelativeDueInfo(inv.due_date, isPaid);

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition group"
                  >
                    {/* Invoice & Category */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                          <Receipt size={14} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            {inv.title || inv.category_name || "Academic Fee"}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            #{inv.invoice_no} • {inv.academic_year || "2026-2027"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Student Info if parent */}
                    {(showStudentColumn || (childrenStudents && childrenStudents.length > 1)) && (
                      <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {[inv.student_name, inv.student_surname].filter(Boolean).join(" ") || "Student"}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {inv.class_name ? `Class ${inv.class_name}` : "General"}
                        </div>
                      </td>
                    )}

                    {/* Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {inv.due_date}
                      </div>
                      <span className={`inline-block px-1.5 py-0.2 rounded-sm text-[10px] mt-0.5 ${rel.color}`}>
                        {rel.text}
                      </span>
                    </td>

                    {/* Billed */}
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">
                      <div>{fmt(net)}</div>
                      {Number(inv.discount || 0) > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {fmt(inv.amount)}
                        </span>
                      )}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {fmt(paid)}
                    </td>

                    {/* Due Balance */}
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className={due > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}>
                        {due > 0 ? fmt(due) : "৳0.00 (Cleared)"}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === "PAID" || due === 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : inv.status === "PARTIAL"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : inv.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            : "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800"
                        }`}
                      >
                        {inv.status === "PAID" || due === 0 ? "PAID" : inv.status}
                      </span>
                    </td>

                    {/* Actions: View / Print Slip */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openReceiptForInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#005a40]/10 hover:bg-[#005a40]/20 text-[#005a40] dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 dark:text-emerald-300 border border-[#005a40]/30 transition"
                        title="View Official Money Receipt Voucher"
                      >
                        <Printer size={13} />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Voucher Slip Modal */}
      {receiptData && (
        <FeeReceiptSlipModal
          receiptData={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </section>
  );
};

export default StudentFeesView;
