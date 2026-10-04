import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  Expense,
  ExpenseStats,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
} from "@/types/expense";

const ITEMS_PER_PAGE = 20;

const defaultCategories: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: "SALARY", label: "Staff Salaries", icon: "💰" },
  { value: "UTILITIES", label: "Utilities (Electricity, Water, Gas)", icon: "⚡" },
  { value: "MAINTENANCE", label: "Building Maintenance", icon: "🔧" },
  { value: "SUPPLIES", label: "Office & School Supplies", icon: "📦" },
  { value: "TRANSPORT", label: "Transportation", icon: "🚌" },
  { value: "MARKETING", label: "Marketing & Promotion", icon: "📢" },
  { value: "EVENTS", label: "Events & Activities", icon: "🎉" },
  { value: "OTHER", label: "Other Expenses", icon: "📋" },
];

const emptyForm = {
  title: "",
  description: "",
  category: "SUPPLIES" as ExpenseCategory,
  amount: "",
  status: "PENDING" as ExpenseStatus,
  payment_method: "CASH" as PaymentMethod,
  vendor: "",
  expense_date: new Date().toISOString().split("T")[0],
  due_date: "",
  transaction_ref: "",
  notes: "",
};

const safeNum = (val: any) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const StatusBadge: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
  if (status === "PAID")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        <CheckCircle2 size={11} /> Paid
      </span>
    );
  if (status === "APPROVED")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
        <Check size={11} /> Approved
      </span>
    );
  if (status === "PENDING")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <Clock size={11} /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
      <X size={11} /> Rejected
    </span>
  );
};

const ExpenseSection: React.FC = () => {
  const { currencySymbol: cs } = useSiteSettings();
  const fmt = (n: number | string) =>
    `${cs}${safeNum(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [globalStats, setGlobalStats] = useState<ExpenseStats>({
    total_expenses: 0,
    pending_amount: 0,
    approved_amount: 0,
    paid_amount: 0,
    rejected_amount: 0,
    total_count: 0,
    pending_count: 0,
    approved_count: 0,
    paid_count: 0,
    rejected_count: 0,
    current_month_total: 0,
    current_year_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [detailsItem, setDetailsItem] = useState<Expense | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Expense | null>(null);

  // Form
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setCurrentPage(1);
    }, 350);
  };

  // Toast helper
  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load expenses (filtered) — also captures global stats in one call
  // Pass overrideParams to bypass the stale filter closure (e.g. right after creation)
  const loadExpenses = useCallback(async (silent = false, overrideParams?: Record<string, string | number>) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      let params: Record<string, string | number>;
      if (overrideParams !== undefined) {
        // Caller wants a specific set of params (e.g. empty = no filters)
        params = { limit: 500, ...overrideParams };
      } else {
        params = { limit: 500 };
        if (statusFilter !== "all") params.status = statusFilter;
        if (categoryFilter !== "all") params.category = categoryFilter;
        if (search.trim()) params.search = search.trim();
      }

      const res = await api.getAll("expenses", params);

      if (res.success) {
        // Backend returns: { data: { expenses: [...], total: N, stats: {...} } }
        const raw = res.data ?? res.message;
        // Extract the expenses array — guard against any non-array shape
        let expensesData: Expense[] = [];
        if (raw && typeof raw === "object" && Array.isArray((raw as any).expenses)) {
          expensesData = (raw as any).expenses;
        } else if (Array.isArray(raw)) {
          expensesData = raw;
        }
        setExpenses(expensesData);
      } else {
        setError(res.message || "Unable to load expenses.");
      }
    } catch {
      setError("Unable to connect to expenses service.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  // Load global (unfiltered) stats separately so stat tiles always show totals
  const loadGlobalStats = useCallback(async () => {
    try {
      const res = await api.getAll("expenses", { limit: 500 });
      const raw = res.data ?? res.message;
      if (res.success && raw && typeof raw === "object" && !Array.isArray(raw)) {
        const statsObj = (raw as any).stats;
        if (statsObj && typeof statsObj === "object" && !Array.isArray(statsObj)) {
          setGlobalStats({
            total_expenses:      safeNum(statsObj.total_expenses),
            pending_amount:      safeNum(statsObj.pending_amount),
            approved_amount:     safeNum(statsObj.approved_amount),
            paid_amount:         safeNum(statsObj.paid_amount),
            rejected_amount:     safeNum(statsObj.rejected_amount),
            total_count:         safeNum(statsObj.total_count),
            pending_count:       safeNum(statsObj.pending_count),
            approved_count:      safeNum(statsObj.approved_count),
            paid_count:          safeNum(statsObj.paid_count),
            rejected_count:      safeNum(statsObj.rejected_count),
            current_month_total: safeNum(statsObj.current_month_total),
            current_year_total:  safeNum(statsObj.current_year_total),
          });
        }
      }
    } catch {
      // silently fail — stat tiles will show zeros
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, search]);

  // Load global stats on mount and after mutations
  useEffect(() => {
    void loadGlobalStats();
  }, []);

  // Client-side filter by search (backup)
  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase().trim();
    return expenses.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const expNo = (item.expense_no || "").toLowerCase();
      const vendor = (item.vendor || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      return title.includes(q) || expNo.includes(q) || vendor.includes(q) || cat.includes(q);
    });
  }, [expenses, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE));
  const pagedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Quick status change
  const handleStatusChange = async (item: Expense, newStatus: ExpenseStatus) => {
    setChangingStatusId(item.id);
    try {
      const payload = {
        title: item.title,
        description: item.description || null,
        category: item.category,
        amount: item.amount,
        status: newStatus,
        payment_method: item.payment_method,
        vendor: item.vendor || null,
        expense_date: item.expense_date,
        due_date: item.due_date || null,
        transaction_ref: item.transaction_ref || null,
        notes: item.notes || null,
      };
      const res = await api.update("expenses", item.id, payload);
      if (res.success) {
        showToast(`Expense marked as ${newStatus.toLowerCase()}.`);
        if (detailsItem?.id === item.id) {
          setDetailsItem({ ...detailsItem, status: newStatus });
        }
        await loadExpenses(true);
        await loadGlobalStats();
      } else {
        showToast(res.message || "Failed to update status.", "error");
      }
    } catch {
      showToast("Failed to reach server.", "error");
    } finally {
      setChangingStatusId(null);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditItem(null);
    setFormData(emptyForm);
    setFormError(null);
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: Expense) => {
    setEditItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "SUPPLIES",
      amount: String(item.amount || ""),
      status: item.status || "PENDING",
      payment_method: item.payment_method || "CASH",
      vendor: item.vendor || "",
      expense_date: item.expense_date || new Date().toISOString().split("T")[0],
      due_date: item.due_date || "",
      transaction_ref: item.transaction_ref || "",
      notes: item.notes || "",
    });
    setFormError(null);
    setCreateModalOpen(true);
    setDetailsItem(null);
  };

  // Submit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) { setFormError("Title is required."); return; }
    if (!formData.amount || safeNum(formData.amount) <= 0) { setFormError("Amount must be greater than 0."); return; }
    if (!formData.expense_date) { setFormError("Expense date is required."); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        amount: safeNum(formData.amount),
        status: formData.status,
        payment_method: formData.payment_method,
        vendor: formData.vendor.trim() || null,
        expense_date: formData.expense_date,
        due_date: formData.due_date || null,
        transaction_ref: formData.transaction_ref.trim() || null,
        notes: formData.notes.trim() || null,
      };

      const res = editItem
        ? await api.update("expenses", editItem.id, payload)
        : await api.create("expenses", payload);

      if (res.success) {
        setCreateModalOpen(false);
        showToast(editItem ? "Expense updated successfully." : "New expense created.");

        if (!editItem) {
          // Reset filters so the new expense is visible
          setStatusFilter("all");
          setCategoryFilter("all");
          setSearch("");
          setSearchInput("");
          setCurrentPage(1);

          // Optimistic: prepend the new item immediately from the server response
          const createdItem = res.data ?? res.message;
          if (createdItem && typeof createdItem === "object" && (createdItem as any).id) {
            setExpenses((prev) => [(createdItem as Expense), ...prev.filter((e) => e.id !== (createdItem as any).id)]);
          }

          // Reload with NO filters (overrideParams = {}) to bypass stale closure
          await loadExpenses(true, {});
        } else {
          // Edit: reload with current filters
          await loadExpenses(true);
        }

        await loadGlobalStats();
      } else {
        setFormError(res.message || "Failed to save expense.");
      }
    } catch {
      setFormError("Unable to reach server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await api.delete("expenses", deleteConfirmItem.id);
      if (res.success) {
        setDeleteConfirmItem(null);
        setDetailsItem(null);
        showToast("Expense deleted.");
        await loadExpenses(true);
        await loadGlobalStats();
      } else {
        showToast(res.message || "Unable to delete expense.", "error");
      }
    } catch {
      showToast("Failed to reach server.", "error");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["Expense No", "Title", "Category", "Amount", "Status", "Payment Method", "Vendor", "Expense Date", "Paid Date"];
    const rows = filteredExpenses.map((item) => [
      item.expense_no || "",
      item.title || "",
      item.category || "",
      safeNum(item.amount),
      item.status || "",
      item.payment_method || "",
      item.vendor || "",
      item.expense_date || "",
      item.paid_date || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `Expenses_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTileClick = (val: string) => {
    setStatusFilter((prev) => (prev === val ? "all" : val));
    setCurrentPage(1);
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-2xl text-sm font-semibold text-white animate-in slide-in-from-bottom-3 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Wallet size={20} className="text-purple-600 dark:text-purple-400" />
              Expense Management
            </h2>
            <span className="text-[10px] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full text-purple-800 font-semibold">
              2026/27 Session
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track and manage school expenses, payments, and vendor transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadExpenses()}
            title="Refresh list"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-purple-600" : ""} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredExpenses.length === 0}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 shadow-sm transition disabled:opacity-50"
          >
            <Download size={14} className="text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-semibold shadow-sm shadow-purple-500/20 transition"
          >
            <Plus size={15} />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* STAT TILES — always global (unfiltered) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total */}
        <div
          onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "all"
            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Total Expenses</span>
            <Wallet size={14} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">{fmt(globalStats.total_expenses)}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{globalStats.total_count} transactions</p>
        </div>

        {/* Pending */}
        <div
          onClick={() => handleTileClick("PENDING")}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "PENDING"
            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>Pending</span>
            <Clock size={14} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mt-1 truncate">{fmt(globalStats.pending_amount)}</h3>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{globalStats.pending_count} awaiting</p>
        </div>

        {/* Approved */}
        <div
          onClick={() => handleTileClick("APPROVED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "APPROVED"
            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-sky-700 dark:text-sky-400">
            <span>Approved</span>
            <Check size={14} className="text-sky-600" />
          </div>
          <h3 className="text-lg font-bold text-sky-900 dark:text-sky-200 mt-1 truncate">{fmt(globalStats.approved_amount)}</h3>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">{globalStats.approved_count} approved</p>
        </div>

        {/* Paid */}
        <div
          onClick={() => handleTileClick("PAID")}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "PAID"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>Paid</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-1 truncate">{fmt(globalStats.paid_amount)}</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{globalStats.paid_count} completed</p>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by title, expense no, vendor..."
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 pl-9 pr-8 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Categories</option>
            {defaultCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {(statusFilter !== "all" || categoryFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setSearch(""); setSearchInput(""); setCurrentPage(1); }}
              className="text-xs font-semibold text-rose-600 hover:underline ml-1"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3.5">Expense No</th>
              <th className="py-3 px-3.5">Title</th>
              <th className="py-3 px-3.5">Category</th>
              <th className="py-3 px-3.5">Amount</th>
              <th className="py-3 px-3.5">Vendor</th>
              <th className="py-3 px-3.5">Date</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-purple-600" />
                    <span>Loading expense records...</span>
                  </div>
                </td>
              </tr>
            ) : pagedExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  {filteredExpenses.length === 0 && expenses.length > 0
                    ? "No expenses match your search or filters."
                    : 'No expense records found. Click "+ New Expense" to create one.'
                  }
                </td>
              </tr>
            ) : (
              pagedExpenses.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition cursor-pointer"
                  onClick={() => setDetailsItem(item)}
                >
                  {/* Expense No */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-purple-700 dark:text-purple-300">
                      {item.expense_no || "N/A"}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-3.5 max-w-[180px]">
                    <p className="font-semibold text-gray-900 dark:text-white leading-tight truncate">{item.title || "Untitled"}</p>
                    {item.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.description}</p>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {defaultCategories.find((c) => c.value === item.category)?.icon || "📋"} {item.category || "OTHER"}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {fmt(safeNum(item.amount))}
                  </td>

                  {/* Vendor */}
                  <td className="py-3 px-3.5 text-gray-500 truncate max-w-[120px]">
                    {item.vendor || "—"}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3.5 text-gray-500 whitespace-nowrap">
                    {item.expense_date || "—"}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailsItem(item)}
                        title="View Details"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800 transition"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-gray-800 transition"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem(item)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION + FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 px-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing <strong className="text-gray-800 dark:text-gray-200">
            {filteredExpenses.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)}
          </strong> of <strong className="text-gray-800 dark:text-gray-200">{filteredExpenses.length}</strong> expenses
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page =
                totalPages <= 7 ? i + 1 :
                currentPage <= 4 ? i + 1 :
                currentPage >= totalPages - 3 ? totalPages - 6 + i :
                currentPage - 3 + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${page === currentPage
                    ? "bg-purple-600 text-white"
                    : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: CREATE / EDIT ─── */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) setCreateModalOpen(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/20 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Wallet size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editItem ? "Edit Expense" : "New Expense"}
                  </h3>
                  <p className="text-xs text-gray-500">Academic Year 2026/27</p>
                </div>
              </div>
              <button type="button" onClick={() => setCreateModalOpen(false)} disabled={submitting}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter expense title"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter expense description"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Amount ({cs}) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ExpenseStatus })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Method *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="MOBILE_BANKING">Mobile Banking</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Enter vendor name"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Expense Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expense Date *</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Transaction Reference</label>
                <input
                  type="text"
                  value={formData.transaction_ref}
                  onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                  placeholder="Enter transaction reference"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter additional notes"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition resize-none"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-500/20 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editItem ? "Update Expense" : "Create Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DETAILS ─── */}
      {detailsItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailsItem(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/20">
              <div>
                <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                  {detailsItem.expense_no || "N/A"}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1.5">{detailsItem.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={detailsItem.status} />
                  <span className="text-xs text-gray-500">{detailsItem.expense_date}</span>
                </div>
              </div>
              <button type="button" onClick={() => setDetailsItem(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto text-xs">
              {/* Amount highlight */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                <span className="text-gray-500 font-medium">Total Amount</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{fmt(safeNum(detailsItem.amount))}</span>
              </div>

              {[
                ["Category", `${defaultCategories.find(c => c.value === detailsItem.category)?.icon || "📋"} ${detailsItem.category}`],
                ["Payment Method", detailsItem.payment_method],
                detailsItem.vendor ? ["Vendor", detailsItem.vendor] : null,
                detailsItem.due_date ? ["Due Date", detailsItem.due_date] : null,
                detailsItem.paid_date ? ["Paid Date", detailsItem.paid_date] : null,
                detailsItem.transaction_ref ? ["Transaction Ref", detailsItem.transaction_ref] : null,
              ].filter(Boolean).map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-gray-500 font-medium">{label as string}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-right max-w-[60%] truncate">{value as string}</span>
                </div>
              ))}

              {detailsItem.description && (
                <div className="pt-1">
                  <p className="text-gray-500 font-medium mb-1">Description</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{detailsItem.description}</p>
                </div>
              )}

              {detailsItem.notes && (
                <div className="rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-3">
                  <p className="font-bold text-purple-900 dark:text-purple-300 mb-1">Notes</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{detailsItem.notes}</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick status actions */}
                {detailsItem.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={changingStatusId === detailsItem.id}
                    onClick={() => void handleStatusChange(detailsItem, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <Check size={13} /> Approve
                  </button>
                )}
                {(detailsItem.status === "PENDING" || detailsItem.status === "APPROVED") && (
                  <button
                    type="button"
                    disabled={changingStatusId === detailsItem.id}
                    onClick={() => void handleStatusChange(detailsItem, "PAID")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} /> Mark Paid
                  </button>
                )}
                {detailsItem.status !== "REJECTED" && detailsItem.status !== "PAID" && (
                  <button
                    type="button"
                    disabled={changingStatusId === detailsItem.id}
                    onClick={() => void handleStatusChange(detailsItem, "REJECTED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <X size={13} /> Reject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal(detailsItem)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => { setDetailsItem(null); setDeleteConfirmItem(detailsItem); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              <button type="button" onClick={() => setDetailsItem(null)}
                className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: DELETE CONFIRM ─── */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteConfirmItem(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl border border-red-200 dark:border-red-900 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-950 p-2.5">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Expense?</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong>"{deleteConfirmItem.title}"</strong>{" "}
              ({deleteConfirmItem.expense_no})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseSection;
