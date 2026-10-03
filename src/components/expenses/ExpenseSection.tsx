import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
  X,
  Receipt,
  Building2,
  Layers,
  FileText,
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

const ExpenseSection: React.FC = () => {
  const { siteName, currencySymbol: cs } = useSiteSettings();
  const fmt = (n: number | string) => `${cs}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
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

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [detailsItem, setDetailsItem] = useState<Expense | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Expense | null>(null);

  // Form State
  const [formData, setFormData] = useState({
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Data
  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAll("expenses", {
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res.success && res.data) {
        setExpenses(Array.isArray(res.data.expenses) ? res.data.expenses : []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setError(res.message || "Unable to load expenses.");
      }
    } catch {
      setError("Unable to connect to expenses service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, [statusFilter, categoryFilter]);

  // Filtered by Search client-side
  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase().trim();
    return expenses.filter((item) => {
      const title = item.title.toLowerCase();
      const expenseNo = item.expense_no.toLowerCase();
      const vendor = (item.vendor || "").toLowerCase();
      const category = item.category.toLowerCase();
      return title.includes(q) || expenseNo.includes(q) || vendor.includes(q) || category.includes(q);
    });
  }, [expenses, search]);

  // Status badge helper
  const renderStatusBadge = (status: ExpenseStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            Paid
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
            <Check size={13} className="text-sky-600 dark:text-sky-400" />
            Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock size={13} className="text-amber-600 dark:text-amber-400" />
            Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <X size={13} className="text-rose-600 dark:text-rose-400" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      title: "",
      description: "",
      category: "SUPPLIES",
      amount: "",
      status: "PENDING",
      payment_method: "CASH",
      vendor: "",
      expense_date: new Date().toISOString().split("T")[0],
      due_date: "",
      transaction_ref: "",
      notes: "",
    });
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

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError("Amount must be greater than 0.");
      return;
    }

    if (!formData.expense_date) {
      setFormError("Expense date is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        amount: Number(formData.amount),
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
        await loadExpenses();
      } else {
        setFormError(res.message || "Failed to save expense.");
      }
    } catch {
      setFormError("Unable to reach server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await api.delete("expenses", deleteConfirmItem.id);
      if (res.success) {
        setDeleteConfirmItem(null);
        setDetailsItem(null);
        await loadExpenses();
      } else {
        alert(res.message || "Unable to delete expense.");
      }
    } catch {
      alert("Failed to reach server.");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Expense No",
      "Title",
      "Category",
      "Amount",
      "Status",
      "Payment Method",
      "Vendor",
      "Expense Date",
      "Paid Date",
    ];

    const rows = filteredExpenses.map((item) => [
      item.expense_no,
      item.title,
      item.category,
      item.amount,
      item.status,
      item.payment_method,
      item.vendor || "",
      item.expense_date,
      item.paid_date || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Expenses_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Wallet size={20} className="text-purple-600 dark:text-purple-400" />
              Expense Management
            </h2>
            <span className="text-[10px] bg-lamaPurpleLight border border-lamaPurple/60 px-2 py-0.5 rounded-full text-purple-800 font-semibold">
              2026/27 Session
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track and manage school expenses, payments, and vendor transactions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadExpenses}
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
            <span>Export</span>
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

      {/* EXPENSE METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Expenses */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "all"
              ? "bg-lamaPurpleLight dark:bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Total Expenses</span>
            <Wallet size={15} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{fmt(stats.total_expenses)}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{stats.total_count} transactions</p>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "PENDING"
              ? "bg-lamaYellowLight dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>Pending</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1">{fmt(stats.pending_amount)}</h3>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending_count} awaiting approval</p>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "APPROVED"
              ? "bg-lamaSkyLight dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-sky-700 dark:text-sky-400">
            <span>Approved</span>
            <Check size={15} className="text-sky-600" />
          </div>
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-200 mt-1">{fmt(stats.approved_amount)}</h3>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">{stats.approved_count} approved</p>
        </div>

        {/* Paid */}
        <div
          onClick={() => setStatusFilter("PAID")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "PAID"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>Paid</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{fmt(stats.paid_amount)}</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.paid_count} completed</p>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by title, expense no, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 pl-9 pr-8 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Categories</option>
            {defaultCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Status Reset */}
          {(statusFilter !== "all" || categoryFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setSearch("");
              }}
              className="text-xs font-semibold text-rose-600 hover:underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* EXPENSES TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3.5">Expense No</th>
              <th className="py-3 px-3.5">Title</th>
              <th className="py-3 px-3.5">Category</th>
              <th className="py-3 px-3.5">Amount</th>
              <th className="py-3 px-3.5">Vendor</th>
              <th className="py-3 px-3.5">Expense Date</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-purple-600" />
                    <span>Loading expense records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  No expense records found. Click "+ New Expense" to create one.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition cursor-pointer"
                  onClick={() => setDetailsItem(item)}
                >
                  {/* Expense No */}
                  <td className="py-3 px-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-purple-700 dark:text-purple-300">
                      {item.expense_no}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3 px-3.5">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {defaultCategories.find((c) => c.value === item.category)?.icon} {item.category}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {fmt(item.amount)}
                  </td>

                  {/* Vendor */}
                  <td className="py-3 px-3.5 text-gray-600 dark:text-gray-400">
                    {item.vendor || "—"}
                  </td>

                  {/* Expense Date */}
                  <td className="py-3 px-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {item.expense_date}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5">
                    {renderStatusBadge(item.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmItem(item);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 transition"
                        title="Delete"
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

      {/* CREATE/EDIT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editItem ? "Edit Expense" : "New Expense"}
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter expense title"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter expense description"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Amount ({cs}) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Status *
                  </label>
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Payment Method *
                  </label>
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Vendor
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Enter vendor name"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={formData.transaction_ref}
                  onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                  placeholder="Enter transaction reference"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter additional notes"
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-purple-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-500/20 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editItem ? "Update Expense" : "Create Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Expense Details</h3>
              <button
                type="button"
                onClick={() => setDetailsItem(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Expense No</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white font-mono">{detailsItem.expense_no}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.title}</span>
              </div>

              {detailsItem.description && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-right">{detailsItem.description}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(detailsItem.amount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</span>
                {renderStatusBadge(detailsItem.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment Method</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.payment_method}</span>
              </div>

              {detailsItem.vendor && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vendor</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.vendor}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Expense Date</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.expense_date}</span>
              </div>

              {detailsItem.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Due Date</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.due_date}</span>
                </div>
              )}

              {detailsItem.paid_date && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Paid Date</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{detailsItem.paid_date}</span>
                </div>
              )}

              {detailsItem.transaction_ref && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Transaction Ref</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-white font-mono">{detailsItem.transaction_ref}</span>
                </div>
              )}

              {detailsItem.notes && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-right">{detailsItem.notes}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setDetailsItem(null);
                    openEditModal(detailsItem);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailsItem(null);
                    setDeleteConfirmItem(detailsItem);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm shadow-red-500/20 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Expense</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this expense?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm shadow-red-500/20 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseSection;
