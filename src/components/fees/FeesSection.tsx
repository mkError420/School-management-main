import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Pencil,
  Percent,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  FeeCategory,
  FeeInvoice,
  FeePayment,
  FeeReceiptData,
  FeeStats,
  FeeStatus,
  PaymentMethod,
} from "@/types/fees";

// Default initial categories if API/localStorage is empty
const defaultCategories: FeeCategory[] = [
  { id: 1, name: "Monthly Tuition Fee", code: "TUIT", default_amount: 150, frequency: "MONTHLY", status: "ACTIVE", description: "Standard monthly academic tuition" },
  { id: 2, name: "Admission / Enrollment Fee", code: "ADMS", default_amount: 350, frequency: "ONE_TIME", status: "ACTIVE", description: "One-time registration fee" },
  { id: 3, name: "Term Examination Fee", code: "EXAM", default_amount: 50, frequency: "TERMLY", status: "ACTIVE", description: "Exam assessment and stationery" },
  { id: 4, name: "School Transport Fee", code: "TRAN", default_amount: 80, frequency: "MONTHLY", status: "ACTIVE", description: "Bus route transport service" },
  { id: 5, name: "Library & Learning Resources", code: "LIBR", default_amount: 30, frequency: "ANNUALLY", status: "ACTIVE", description: "Digital library and book lending" },
  { id: 6, name: "Computer & Science Lab Fee", code: "LAB", default_amount: 45, frequency: "TERMLY", status: "ACTIVE", description: "Lab apparatus and IT equipment" },
  { id: 7, name: "Sports & Extra-Curricular", code: "SPRT", default_amount: 40, frequency: "ANNUALLY", status: "ACTIVE", description: "Athletics, tournaments, and clubs" },
  { id: 8, name: "Uniform & Study Pack", code: "UNIF", default_amount: 120, frequency: "ONE_TIME", status: "ACTIVE", description: "Official uniform and textbooks" },
];

// Fallback sample students if students API is not populated
const sampleStudentsFallback = [
  { id: "s1", name: "John", surname: "Doe", email: "john@doe.com", phone: "1234567890", class_id: 1, class_name: "1A", grade_level: 1, parent_name: "Robert", parent_surname: "Doe", parent_phone: "1234567890" },
  { id: "s2", name: "Jane", surname: "Doe", email: "jane@doe.com", phone: "1234567891", class_id: 2, class_name: "1B", grade_level: 1, parent_name: "Sarah", parent_surname: "Doe", parent_phone: "1234567891" },
  { id: "s3", name: "Mike", surname: "Geller", email: "mike@geller.com", phone: "1234567892", class_id: 3, class_name: "2A", grade_level: 2, parent_name: "Monica", parent_surname: "Geller", parent_phone: "1234567892" },
  { id: "s4", name: "Jay", surname: "French", email: "jay@gmail.com", phone: "1234567893", class_id: 4, class_name: "2B", grade_level: 2, parent_name: "David", parent_surname: "French", parent_phone: "1234567893" },
  { id: "s5", name: "Jane", surname: "Smith", email: "janesmith@gmail.com", phone: "1234567894", class_id: 5, class_name: "3A", grade_level: 3, parent_name: "Thomas", parent_surname: "Smith", parent_phone: "1234567894" },
  { id: "s6", name: "Anna", surname: "Santiago", email: "anna@gmail.com", phone: "1234567895", class_id: 6, class_name: "3B", grade_level: 3, parent_name: "Carlos", parent_surname: "Santiago", parent_phone: "1234567895" },
  { id: "s7", name: "Allen", surname: "Black", email: "allen@black.com", phone: "1234567896", class_id: 7, class_name: "4A", grade_level: 4, parent_name: "Arthur", parent_surname: "Black", parent_phone: "1234567896" },
  { id: "s8", name: "Ophelia", surname: "Castro", email: "ophelia@castro.com", phone: "1234567897", class_id: 8, class_name: "4B", grade_level: 4, parent_name: "Maria", parent_surname: "Castro", parent_phone: "1234567897" },
  { id: "s9", name: "Derek", surname: "Briggs", email: "derek@briggs.com", phone: "1234567898", class_id: 9, class_name: "5A", grade_level: 5, parent_name: "James", parent_surname: "Briggs", parent_phone: "1234567898" },
  { id: "s10", name: "John", surname: "Glover", email: "john@glover.com", phone: "1234567899", class_id: 10, class_name: "5B", grade_level: 5, parent_name: "Edward", parent_surname: "Glover", parent_phone: "1234567899" },
];

const FeesSection: React.FC = () => {
  const { siteName, currencySymbol: cs } = useSiteSettings();
  // Helper – format a number as currency using the configured symbol
  const fmt = (n: number | string) => `${cs}${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "categories" | "class_summary">("invoices");

  // State
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>(defaultCategories);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<any[]>(sampleStudentsFallback);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: "1A" },
    { id: 2, name: "1B" },
    { id: 3, name: "2A" },
    { id: 4, name: "2B" },
    { id: 5, name: "3A" },
    { id: 6, name: "3B" },
    { id: 7, name: "4A" },
    { id: 8, name: "4B" },
    { id: 9, name: "5A" },
    { id: 10, name: "5B" },
  ]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters & Pagination for Invoices
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Payments log search
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");

  // Modals state
  const [createInvoiceModal, setCreateInvoiceModal] = useState(false);
  const [bulkGenerateModal, setBulkGenerateModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<FeeInvoice | null>(null);
  const [receiptData, setReceiptData] = useState<FeeReceiptData | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: FeeCategory | null }>({ open: false, mode: "create", data: null });
  const [editInvoiceModal, setEditInvoiceModal] = useState<FeeInvoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: "invoice" | "category"; id: number | string; label: string }>({ open: false, type: "invoice", id: 0, label: "" });

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    student_id: "",
    fee_category_id: 1,
    title: "",
    amount: 150,
    discount: 0,
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    academic_year: "2026-2027",
    notes: "",
    collect_now: false,
    paid_now: 150,
    payment_method: "CASH" as PaymentMethod,
    transaction_ref: "",
  });

  const [bulkForm, setBulkForm] = useState({
    class_id: "",
    fee_category_id: 1,
    title: "Monthly Tuition Fee - October 2026",
    amount: 150,
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    academic_year: "2026-2027",
    notes: "Batch monthly invoice",
  });

  const [payForm, setPayForm] = useState({
    amount: 0,
    payment_method: "CASH" as PaymentMethod,
    payment_date: new Date().toISOString().split("T")[0],
    transaction_ref: "",
    notes: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    code: "",
    default_amount: 100,
    frequency: "MONTHLY" as FeeCategory["frequency"],
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    description: "",
  });

  // Helper notification
  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Initial Data Seeding / Loading
  const loadInitialData = useCallback(async () => {
    setLoading(true);

    // 1. Try to fetch students and classes from API
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.getAll("students", { limit: 100 }),
        api.getAll("classes", { limit: 100 }),
      ]);

      if (studentsRes.success && Array.isArray(studentsRes.data?.students)) {
        setStudents(studentsRes.data.students);
      }
      if (classesRes.success && Array.isArray(classesRes.data?.classes)) {
        setClasses(classesRes.data.classes);
      }
    } catch (err) {
      console.warn("Could not fetch auxiliary students/classes, using fallback.", err);
    }

    // 2. Fetch fees from API
    try {
      const [feesRes, catRes, payRes] = await Promise.all([
        api.getAll("fees", { limit: 200 }),
        api.getFeeCategories(),
        api.getFeePayments({ limit: 100 }),
      ]);

      let loadedInvoices: FeeInvoice[] = [];
      let loadedCategories: FeeCategory[] = defaultCategories;
      let loadedPayments: FeePayment[] = [];

      if (feesRes.success && Array.isArray(feesRes.data?.fees)) {
        loadedInvoices = feesRes.data.fees;
      }
      if (catRes.success && Array.isArray(catRes.data?.categories) && catRes.data.categories.length > 0) {
        // Merge DB categories with any locally-edited ones stored in localStorage
        // This ensures edits that hit the DB are shown, but if DB is stale, local overrides win per-ID
        const dbCats: FeeCategory[] = catRes.data.categories;
        const storedCatsRaw = localStorage.getItem("mk_school_fee_categories");
        if (storedCatsRaw) {
          try {
            const localCats: FeeCategory[] = JSON.parse(storedCatsRaw);
            // Build a map of local overrides keyed by numeric ID
            const localMap = new Map(localCats.map((c) => [Number(c.id), c]));
            // For each DB category, prefer the local version if it has a newer default_amount
            loadedCategories = dbCats.map((dbCat) => {
              const local = localMap.get(Number(dbCat.id));
              // If local exists and its amount differs from DB, prefer local
              // (means DB update may have failed; keep local edit)
              if (local && Number(local.default_amount) !== Number(dbCat.default_amount)) {
                return { ...dbCat, ...local, id: dbCat.id };
              }
              return dbCat;
            });
          } catch {
            loadedCategories = dbCats;
          }
        } else {
          loadedCategories = dbCats;
        }
      }
      if (payRes.success && Array.isArray(payRes.data?.payments)) {
        loadedPayments = payRes.data.payments;
      }

      // If backend had no invoices or backend is empty, check localStorage or seed default mock set
      if (loadedInvoices.length === 0) {
        const stored = localStorage.getItem("mk_school_fees_invoices");
        if (stored) {
          try {
            loadedInvoices = JSON.parse(stored);
          } catch { }
        }
      }

      if (loadedCategories.length === 0) {
        const storedCats = localStorage.getItem("mk_school_fee_categories");
        if (storedCats) {
          try {
            loadedCategories = JSON.parse(storedCats);
          } catch { }
        }
      }

      if (loadedPayments.length === 0) {
        const storedPays = localStorage.getItem("mk_school_fee_payments");
        if (storedPays) {
          try {
            loadedPayments = JSON.parse(storedPays);
          } catch { }
        }
      }

      // If still empty (first run), generate comprehensive initial mock dataset
      if (loadedInvoices.length === 0) {
        const generated = generateFallbackData(sampleStudentsFallback, loadedCategories);
        loadedInvoices = generated.invoices;
        loadedPayments = generated.payments;
        localStorage.setItem("mk_school_fees_invoices", JSON.stringify(loadedInvoices));
        localStorage.setItem("mk_school_fee_payments", JSON.stringify(loadedPayments));
      }

      setInvoices(loadedInvoices);
      setCategories(loadedCategories);
      setPayments(loadedPayments);
    } catch (err: any) {
      console.warn("Failed loading from fees API, loading local storage cache.", err);
      const stored = localStorage.getItem("mk_school_fees_invoices");
      const storedCats = localStorage.getItem("mk_school_fee_categories");
      const storedPays = localStorage.getItem("mk_school_fee_payments");

      if (stored) {
        setInvoices(JSON.parse(stored));
      } else {
        const generated = generateFallbackData(sampleStudentsFallback, defaultCategories);
        setInvoices(generated.invoices);
        setPayments(generated.payments);
        localStorage.setItem("mk_school_fees_invoices", JSON.stringify(generated.invoices));
        localStorage.setItem("mk_school_fee_payments", JSON.stringify(generated.payments));
      }
      if (storedCats) setCategories(JSON.parse(storedCats));
      if (storedPays) setPayments(JSON.parse(storedPays));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  // Synchronize local storage when invoices/payments/categories update
  const syncToLocalStorage = (invList: FeeInvoice[], payList: FeePayment[], catList: FeeCategory[]) => {
    localStorage.setItem("mk_school_fees_invoices", JSON.stringify(invList));
    localStorage.setItem("mk_school_fee_payments", JSON.stringify(payList));
    localStorage.setItem("mk_school_fee_categories", JSON.stringify(catList));
  };

  // Helper generator for initial rich sample data
  function generateFallbackData(studentList: any[], catList: FeeCategory[]) {
    const invs: FeeInvoice[] = [];
    const pays: FeePayment[] = [];
    let invSeq = 1001;
    let paySeq = 2001;
    const today = new Date();

    studentList.forEach((st, idx) => {
      // 1. Tuition Fee
      const tuitionCat = catList.find((c) => c.code === "TUIT") || catList[0];
      const invNo = `INV-2026-${invSeq++}`;
      const amount = tuitionCat.default_amount;
      const discount = idx % 4 === 0 ? 15 : 0;
      const net = amount - discount;
      let status: FeeStatus = "UNPAID";
      let paid = 0;

      if (idx % 3 === 0) {
        status = "PAID";
        paid = net;
      } else if (idx % 3 === 1) {
        status = "PARTIAL";
        paid = Math.round(net / 2);
      } else {
        status = idx % 2 === 0 ? "OVERDUE" : "UNPAID";
        paid = 0;
      }

      const dueDate = new Date(today);
      if (status === "OVERDUE") {
        dueDate.setDate(today.getDate() - 12);
      } else {
        dueDate.setDate(today.getDate() + 15);
      }

      const inv: FeeInvoice = {
        id: invSeq,
        invoice_no: invNo,
        student_id: String(st.id),
        student_name: st.name,
        student_surname: st.surname,
        student_email: st.email,
        student_phone: st.phone,
        class_name: st.class_name || (st.class_id ? `Class ${st.class_id}` : "1A"),
        grade_level: st.grade_level || 1,
        fee_category_id: tuitionCat.id,
        category_name: tuitionCat.name,
        category_code: tuitionCat.code,
        title: `Tuition Fee - ${today.toLocaleString("default", { month: "long" })} 2026`,
        due_date: dueDate.toISOString().split("T")[0],
        amount,
        discount,
        paid_amount: paid,
        net_amount: net,
        due_amount: Math.max(0, net - paid),
        status,
        academic_year: "2026-2027",
        notes: "Regular academic tuition",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      };
      invs.push(inv);

      if (paid > 0) {
        pays.push({
          id: paySeq++,
          receipt_no: `REC-2026-${paySeq}`,
          invoice_id: inv.id,
          invoice_no: inv.invoice_no,
          invoice_title: inv.title,
          category_name: tuitionCat.name,
          student_id: String(st.id),
          student_name: st.name,
          student_surname: st.surname,
          class_name: inv.class_name,
          amount: paid,
          payment_method: idx % 2 === 0 ? "CASH" : "BANK_TRANSFER",
          transaction_ref: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          payment_date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
          notes: status === "PAID" ? "Full payment cleared" : "Partial installment",
        });
      }

      // 2. Extra Exam or Transport Fee for subset
      if (idx % 2 === 0) {
        const cat = catList.find((c) => c.code === (idx % 4 === 0 ? "EXAM" : "TRAN")) || catList[1];
        const extraNo = `INV-2026-${invSeq++}`;
        const extraNet = cat.default_amount;
        const extraPaid = idx % 4 === 0 ? extraNet : 0;
        const extraStatus: FeeStatus = idx % 4 === 0 ? "PAID" : "UNPAID";

        const extraInv: FeeInvoice = {
          id: invSeq,
          invoice_no: extraNo,
          student_id: String(st.id),
          student_name: st.name,
          student_surname: st.surname,
          student_email: st.email,
          student_phone: st.phone,
          class_name: st.class_name || "1A",
          grade_level: st.grade_level || 1,
          fee_category_id: cat.id,
          category_name: cat.name,
          category_code: cat.code,
          title: cat.name,
          due_date: new Date(today.getTime() + 20 * 86400000).toISOString().split("T")[0],
          amount: cat.default_amount,
          discount: 0,
          paid_amount: extraPaid,
          net_amount: extraNet,
          due_amount: extraNet - extraPaid,
          status: extraStatus,
          academic_year: "2026-2027",
          notes: "Scheduled fee requirement",
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        };
        invs.push(extraInv);

        if (extraPaid > 0) {
          pays.push({
            id: paySeq++,
            receipt_no: `REC-2026-${paySeq}`,
            invoice_id: extraInv.id,
            invoice_no: extraInv.invoice_no,
            invoice_title: extraInv.title,
            category_name: cat.name,
            student_id: String(st.id),
            student_name: st.name,
            student_surname: st.surname,
            class_name: extraInv.class_name,
            amount: extraPaid,
            payment_method: "CARD",
            transaction_ref: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            payment_date: new Date().toISOString().split("T")[0],
            notes: "Paid in full via card terminal",
          });
        }
      }
    });

    return { invoices: invs, payments: pays };
  }

  // Live KPI Calculations
  const stats: FeeStats = useMemo(() => {
    let total_billed = 0;
    let total_collected = 0;
    let total_due = 0;
    let total_overdue = 0;
    let paid_count = 0;
    let partial_count = 0;
    let unpaid_count = 0;
    let overdue_count = 0;

    const todayStr = new Date().toISOString().split("T")[0];

    invoices.forEach((inv) => {
      const net = Number(inv.amount) - Number(inv.discount || 0);
      const paid = Number(inv.paid_amount || 0);
      const due = Math.max(0, net - paid);

      total_billed += net;
      total_collected += paid;
      total_due += due;

      const isOverdue = inv.status === "OVERDUE" || (due > 0 && inv.due_date < todayStr);

      if (isOverdue) {
        total_overdue += due;
        overdue_count++;
      } else if (inv.status === "PAID" || due <= 0) {
        paid_count++;
      } else if (inv.status === "PARTIAL" || paid > 0) {
        partial_count++;
      } else {
        unpaid_count++;
      }
    });

    const collection_rate = total_billed > 0 ? Math.round((total_collected / total_billed) * 1000) / 10 : 0;

    return {
      total_billed,
      total_collected,
      total_due,
      total_overdue,
      total_invoices: invoices.length,
      paid_count,
      partial_count,
      unpaid_count,
      overdue_count,
      collection_rate,
    };
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesQuery =
          item.invoice_no?.toLowerCase().includes(q) ||
          item.student_name?.toLowerCase().includes(q) ||
          item.student_surname?.toLowerCase().includes(q) ||
          item.student_id?.toLowerCase().includes(q) ||
          item.title?.toLowerCase().includes(q) ||
          item.category_name?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status
      if (statusFilter !== "ALL") {
        const todayStr = new Date().toISOString().split("T")[0];
        const net = Number(item.amount) - Number(item.discount || 0);
        const due = Math.max(0, net - Number(item.paid_amount || 0));
        const isOverdue = item.status === "OVERDUE" || (due > 0 && item.due_date < todayStr);

        if (statusFilter === "OVERDUE" && !isOverdue) return false;
        if (statusFilter === "PAID" && item.status !== "PAID" && due > 0) return false;
        if (statusFilter === "PARTIAL" && (item.status !== "PARTIAL" || due <= 0)) return false;
        if (statusFilter === "UNPAID" && (item.status !== "UNPAID" || isOverdue || item.paid_amount > 0)) return false;
      }

      // Category
      if (categoryFilter !== "ALL" && String(item.fee_category_id) !== String(categoryFilter)) {
        return false;
      }

      // Class
      if (classFilter !== "ALL" && item.class_name !== classFilter) {
        return false;
      }

      return true;
    });
  }, [invoices, search, statusFilter, categoryFilter, classFilter]);

  // Paginated Invoices
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase();
        const matches =
          p.receipt_no.toLowerCase().includes(q) ||
          p.invoice_no?.toLowerCase().includes(q) ||
          p.student_name?.toLowerCase().includes(q) ||
          p.student_surname?.toLowerCase().includes(q) ||
          p.transaction_ref?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (paymentMethodFilter !== "ALL" && p.payment_method !== paymentMethodFilter) {
        return false;
      }
      return true;
    });
  }, [payments, paymentSearch, paymentMethodFilter]);

  // Class Summary calculation
  const classBreakdown = useMemo(() => {
    const map = new Map<string, { className: string; studentCount: Set<string>; billed: number; collected: number; due: number }>();

    invoices.forEach((inv) => {
      const cName = inv.class_name || "Unassigned";
      if (!map.has(cName)) {
        map.set(cName, {
          className: cName,
          studentCount: new Set(),
          billed: 0,
          collected: 0,
          due: 0,
        });
      }
      const row = map.get(cName)!;
      row.studentCount.add(inv.student_id);
      const net = Number(inv.amount) - Number(inv.discount || 0);
      const paid = Number(inv.paid_amount || 0);
      row.billed += net;
      row.collected += paid;
      row.due += Math.max(0, net - paid);
    });

    return Array.from(map.values()).map((r) => ({
      ...r,
      studentCountNum: r.studentCount.size,
      rate: r.billed > 0 ? Math.round((r.collected / r.billed) * 100) : 0,
    })).sort((a, b) => b.billed - a.billed);
  }, [invoices]);

  // Handlers: Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.student_id) {
      showToast("error", "Please select a student");
      return;
    }
    if (invoiceForm.amount <= 0) {
      showToast("error", "Amount must be greater than zero");
      return;
    }

    const selStudent = students.find((s) => String(s.id) === String(invoiceForm.student_id));
    const selCat = categories.find((c) => c.id === Number(invoiceForm.fee_category_id)) || categories[0];
    const net = Math.max(0, Number(invoiceForm.amount) - Number(invoiceForm.discount || 0));
    const paid = invoiceForm.collect_now ? Math.min(Number(invoiceForm.paid_now), net) : 0;

    let newStatus: FeeStatus = "UNPAID";
    if (paid >= net) newStatus = "PAID";
    else if (paid > 0) newStatus = "PARTIAL";
    else if (invoiceForm.due_date < new Date().toISOString().split("T")[0]) newStatus = "OVERDUE";

    const nextInvNo = `INV-${new Date().getFullYear()}-${String(invoices.length + 101).padStart(4, "0")}`;

    // Try API
    try {
      const res = await api.create("fees", {
        student_id: invoiceForm.student_id,
        fee_category_id: invoiceForm.fee_category_id,
        title: invoiceForm.title || `${selCat.name} - ${new Date().toLocaleString("default", { month: "short" })}`,
        amount: invoiceForm.amount,
        discount: invoiceForm.discount,
        due_date: invoiceForm.due_date,
        academic_year: invoiceForm.academic_year,
        notes: invoiceForm.notes,
        paid_now: paid,
        payment_method: invoiceForm.payment_method,
        transaction_ref: invoiceForm.transaction_ref,
      });

      if (res.success && res.data) {
        showToast("success", res.message || `Invoice ${res.data.invoice_no || nextInvNo} created!`);
      }
    } catch {
      // Fallback local update
    }

    const newInvoice: FeeInvoice = {
      id: Date.now(),
      invoice_no: nextInvNo,
      student_id: invoiceForm.student_id,
      student_name: selStudent?.name || "Student",
      student_surname: selStudent?.surname || "",
      student_email: selStudent?.email,
      student_phone: selStudent?.phone,
      class_name: selStudent?.class_name || (selStudent?.class_id ? `Class ${selStudent.class_id}` : "1A"),
      grade_level: selStudent?.grade_level || 1,
      fee_category_id: selCat.id,
      category_name: selCat.name,
      category_code: selCat.code,
      title: invoiceForm.title || `${selCat.name} - ${new Date().toLocaleString("default", { month: "short" })}`,
      due_date: invoiceForm.due_date,
      amount: Number(invoiceForm.amount),
      discount: Number(invoiceForm.discount || 0),
      paid_amount: paid,
      net_amount: net,
      due_amount: Math.max(0, net - paid),
      status: newStatus,
      academic_year: invoiceForm.academic_year,
      notes: invoiceForm.notes,
      created_at: new Date().toISOString(),
    };

    let updatedPayments = [...payments];
    if (paid > 0) {
      const recNo = `REC-${new Date().getFullYear()}-${String(payments.length + 101).padStart(4, "0")}`;
      const newPay: FeePayment = {
        id: Date.now() + 1,
        receipt_no: recNo,
        invoice_id: newInvoice.id,
        invoice_no: newInvoice.invoice_no,
        invoice_title: newInvoice.title,
        category_name: selCat.name,
        student_id: newInvoice.student_id,
        student_name: newInvoice.student_name,
        student_surname: newInvoice.student_surname,
        class_name: newInvoice.class_name,
        amount: paid,
        payment_method: invoiceForm.payment_method,
        transaction_ref: invoiceForm.transaction_ref || `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        payment_date: new Date().toISOString().split("T")[0],
        notes: "Initial payment upon invoice creation",
        created_at: new Date().toISOString(),
      };
      updatedPayments = [newPay, ...payments];
      setPayments(updatedPayments);
    }

    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    syncToLocalStorage(updatedInvoices, updatedPayments, categories);

    setCreateInvoiceModal(false);
    showToast("success", `Invoice ${nextInvNo} generated successfully!`);
  };

  // Handlers: Bulk Generate Invoices
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.class_id) {
      showToast("error", "Please select a target class");
      return;
    }
    if (bulkForm.amount <= 0) {
      showToast("error", "Amount must be greater than zero");
      return;
    }

    const targetStudents = students.filter(
      (s) => String(s.class_id) === String(bulkForm.class_id) || s.class_name === bulkForm.class_id
    );

    if (targetStudents.length === 0) {
      showToast("error", "No students found in the selected class");
      return;
    }

    const selCat = categories.find((c) => c.id === Number(bulkForm.fee_category_id)) || categories[0];

    try {
      await api.bulkGenerateFeeInvoices({
        class_id: Number(bulkForm.class_id) || undefined,
        fee_category_id: selCat.id,
        title: bulkForm.title,
        amount: Number(bulkForm.amount),
        due_date: bulkForm.due_date,
        academic_year: bulkForm.academic_year,
        notes: bulkForm.notes,
      });
    } catch { }

    const newInvoices: FeeInvoice[] = targetStudents.map((st, i) => {
      const invNo = `INV-${new Date().getFullYear()}-${String(invoices.length + i + 101).padStart(4, "0")}`;
      return {
        id: Date.now() + i,
        invoice_no: invNo,
        student_id: String(st.id),
        student_name: st.name,
        student_surname: st.surname,
        student_email: st.email,
        student_phone: st.phone,
        class_name: st.class_name || `Class ${bulkForm.class_id}`,
        grade_level: st.grade_level || 1,
        fee_category_id: selCat.id,
        category_name: selCat.name,
        category_code: selCat.code,
        title: bulkForm.title,
        due_date: bulkForm.due_date,
        amount: Number(bulkForm.amount),
        discount: 0,
        paid_amount: 0,
        net_amount: Number(bulkForm.amount),
        due_amount: Number(bulkForm.amount),
        status: bulkForm.due_date < new Date().toISOString().split("T")[0] ? "OVERDUE" : "UNPAID",
        academic_year: bulkForm.academic_year,
        notes: bulkForm.notes,
        created_at: new Date().toISOString(),
      };
    });

    const updatedInvoices = [...newInvoices, ...invoices];
    setInvoices(updatedInvoices);
    syncToLocalStorage(updatedInvoices, payments, categories);

    setBulkGenerateModal(false);
    showToast("success", `Generated ${newInvoices.length} invoices for Class ${bulkForm.class_id}!`);
  };

  // Handlers: Record Payment
  const openPaymentModal = (invoice: FeeInvoice) => {
    const net = Number(invoice.amount) - Number(invoice.discount || 0);
    const remaining = Math.max(0, net - Number(invoice.paid_amount || 0));
    setPaymentModalInvoice(invoice);
    setPayForm({
      amount: remaining,
      payment_method: "CASH",
      payment_date: new Date().toISOString().split("T")[0],
      transaction_ref: "",
      notes: "",
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const net = Number(paymentModalInvoice.amount) - Number(paymentModalInvoice.discount || 0);
    const currentPaid = Number(paymentModalInvoice.paid_amount || 0);
    const remaining = Math.max(0, net - currentPaid);

    if (payForm.amount <= 0) {
      showToast("error", "Payment amount must be greater than zero");
      return;
    }
    if (payForm.amount > remaining + 0.01) {
      showToast("error", `Payment exceeds remaining due balance of ${fmt(remaining)}`);
      return;
    }

    const newTotalPaid = currentPaid + Number(payForm.amount);
    let newStatus: FeeStatus = "PARTIAL";
    if (newTotalPaid >= net - 0.01) newStatus = "PAID";

    const recNo = `REC-${new Date().getFullYear()}-${String(payments.length + 101).padStart(4, "0")}`;

    // Try API
    try {
      await api.recordFeePayment({
        invoice_id: paymentModalInvoice.id,
        amount: Number(payForm.amount),
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
        transaction_ref: payForm.transaction_ref,
        notes: payForm.notes,
      });
    } catch { }

    const newPaymentRecord: FeePayment = {
      id: Date.now(),
      receipt_no: recNo,
      invoice_id: paymentModalInvoice.id,
      invoice_no: paymentModalInvoice.invoice_no,
      invoice_title: paymentModalInvoice.title,
      category_name: paymentModalInvoice.category_name,
      student_id: paymentModalInvoice.student_id,
      student_name: paymentModalInvoice.student_name,
      student_surname: paymentModalInvoice.student_surname,
      class_name: paymentModalInvoice.class_name,
      amount: Number(payForm.amount),
      payment_method: payForm.payment_method,
      transaction_ref: payForm.transaction_ref || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      payment_date: payForm.payment_date,
      notes: payForm.notes,
      created_at: new Date().toISOString(),
    };

    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === paymentModalInvoice.id) {
        return {
          ...inv,
          paid_amount: newTotalPaid,
          due_amount: Math.max(0, net - newTotalPaid),
          status: newStatus,
        };
      }
      return inv;
    });

    const updatedPayments = [newPaymentRecord, ...payments];
    setInvoices(updatedInvoices);
    setPayments(updatedPayments);
    syncToLocalStorage(updatedInvoices, updatedPayments, categories);

    // Prepare receipt data
    const receiptToOpen: FeeReceiptData = {
      ...newPaymentRecord,
      invoice_amount: paymentModalInvoice.amount,
      discount: paymentModalInvoice.discount,
      net_amount: net,
      total_paid: newTotalPaid,
      remaining_due: Math.max(0, net - newTotalPaid),
      due_date: paymentModalInvoice.due_date,
      academic_year: paymentModalInvoice.academic_year,
      student_code: paymentModalInvoice.student_id,
      student_email: paymentModalInvoice.student_email,
      student_phone: paymentModalInvoice.student_phone,
      site_name: siteName,
    };

    setPaymentModalInvoice(null);
    showToast("success", `Payment of ${fmt(payForm.amount)} recorded! Receipt ${recNo}`);
    setReceiptData(receiptToOpen);
  };

  // Handlers: View Receipt
  const handleOpenReceipt = (invoice: FeeInvoice) => {
    const net = Number(invoice.amount) - Number(invoice.discount || 0);
    const paid = Number(invoice.paid_amount || 0);
    const relatedPay = payments.find((p) => p.invoice_id === invoice.id || p.invoice_no === invoice.invoice_no);

    setReceiptData({
      id: relatedPay?.id || invoice.id,
      receipt_no: relatedPay?.receipt_no || `SLIP-${invoice.invoice_no}`,
      invoice_id: invoice.id,
      invoice_no: invoice.invoice_no,
      invoice_title: invoice.title,
      category_name: invoice.category_name,
      student_id: invoice.student_id,
      student_name: invoice.student_name,
      student_surname: invoice.student_surname,
      student_code: invoice.student_id,
      student_email: invoice.student_email,
      student_phone: invoice.student_phone,
      class_name: invoice.class_name,
      amount: relatedPay?.amount || paid,
      payment_method: relatedPay?.payment_method || "CASH",
      transaction_ref: relatedPay?.transaction_ref || `REF-${invoice.invoice_no.slice(-5)}`,
      payment_date: relatedPay?.payment_date || new Date().toISOString().split("T")[0],
      notes: relatedPay?.notes || invoice.notes || "Official school fee invoice receipt",
      invoice_amount: invoice.amount,
      discount: invoice.discount,
      net_amount: net,
      total_paid: paid,
      remaining_due: Math.max(0, net - paid),
      due_date: invoice.due_date,
      academic_year: invoice.academic_year,
      site_name: siteName,
    });
  };

  // Handlers: Edit Invoice
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoiceModal) return;

    const net = Math.max(0, Number(editInvoiceModal.amount) - Number(editInvoiceModal.discount || 0));
    const paid = Number(editInvoiceModal.paid_amount || 0);
    let newStatus: FeeStatus = "UNPAID";
    if (paid >= net) newStatus = "PAID";
    else if (paid > 0) newStatus = "PARTIAL";
    else if (editInvoiceModal.due_date < new Date().toISOString().split("T")[0]) newStatus = "OVERDUE";

    try {
      await api.update("fees", editInvoiceModal.id, {
        title: editInvoiceModal.title,
        amount: editInvoiceModal.amount,
        discount: editInvoiceModal.discount,
        due_date: editInvoiceModal.due_date,
        notes: editInvoiceModal.notes,
        status: newStatus,
      });
    } catch { }

    const updated = invoices.map((inv) =>
      inv.id === editInvoiceModal.id
        ? {
          ...editInvoiceModal,
          net_amount: net,
          due_amount: Math.max(0, net - paid),
          status: newStatus,
        }
        : inv
    );

    setInvoices(updated);
    syncToLocalStorage(updated, payments, categories);
    setEditInvoiceModal(null);
    showToast("success", `Invoice ${editInvoiceModal.invoice_no} updated!`);
  };

  // Handlers: Category Management
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast("error", "Category name is required");
      return;
    }

    if (categoryModal.mode === "create") {
      const tempId = Date.now();
      const newCat: FeeCategory = {
        id: tempId,
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim().toUpperCase() || categoryForm.name.slice(0, 4).toUpperCase(),
        default_amount: isNaN(Number(categoryForm.default_amount)) ? 0 : Number(categoryForm.default_amount),
        frequency: categoryForm.frequency,
        status: categoryForm.status,
        description: categoryForm.description,
        total_invoices: 0,
        total_revenue: 0,
      };

      try {
        const res = await api.createFeeCategory(newCat);
        // If the backend assigned a real ID, use it so future edits work
        if (res?.success && res?.data?.id) {
          newCat.id = Number(res.data.id);
        }
      } catch {
        showToast("error", "DB save failed — category saved locally only");
      }

      const updated = [...categories, newCat];
      setCategories(updated);
      syncToLocalStorage(invoices, payments, updated);
      showToast("success", `Category "${newCat.name}" added!`);
    } else if (categoryModal.mode === "edit" && categoryModal.data) {
      const catId = categoryModal.data.id;
      const safeAmount = isNaN(Number(categoryForm.default_amount)) ? 0 : Number(categoryForm.default_amount);
      // Use Number() coercion on both sides: PHP returns IDs as strings,
      // locally-created categories use Date.now() (number). Strict === would silently fail.
      const updatedCat = {
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim().toUpperCase(),
        default_amount: safeAmount,
        frequency: categoryForm.frequency,
        status: categoryForm.status,
        description: categoryForm.description,
      };
      const updated = categories.map((c) =>
        Number(c.id) === Number(catId) ? { ...c, ...updatedCat } : c
      );

      // First update local state & localStorage so UI reflects the change immediately
      setCategories(updated);
      syncToLocalStorage(invoices, payments, updated);

      // Then push to DB
      try {
        const res = await api.updateFeeCategory(catId, updatedCat);
        if (res?.success) {
          showToast("success", `Category "${categoryForm.name}" updated!`);
        } else {
          showToast("error", `DB update failed: ${res?.message || "Unknown error"}. Saved locally.`);
        }
      } catch (err: any) {
        showToast("error", `DB update failed: ${err?.message || "Network error"}. Saved locally.`);
      }
    }

    setCategoryModal({ open: false, mode: "create", data: null });
  };

  // Delete Action Confirm
  const executeDelete = async () => {
    if (deleteConfirm.type === "invoice") {
      try {
        await api.delete("fees", deleteConfirm.id);
      } catch { }
      const updatedInvs = invoices.filter((i) => i.id !== deleteConfirm.id);
      const updatedPays = payments.filter((p) => p.invoice_id !== deleteConfirm.id);
      setInvoices(updatedInvs);
      setPayments(updatedPays);
      syncToLocalStorage(updatedInvs, updatedPays, categories);
      showToast("success", `Invoice deleted`);
    } else if (deleteConfirm.type === "category") {
      try {
        await api.deleteFeeCategory(deleteConfirm.id);
      } catch { }
      const updated = categories.filter((c) => Number(c.id) !== Number(deleteConfirm.id));
      setCategories(updated);
      syncToLocalStorage(invoices, payments, updated);
      showToast("success", `Fee Category removed`);
    }
    setDeleteConfirm({ open: false, type: "invoice", id: 0, label: "" });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Invoice No", "Student ID", "Student Name", "Class", "Fee Category", `Billed (${cs})`, `Discount (${cs})`, `Paid (${cs})`, `Due (${cs})`, "Status", "Due Date"];
    const rows = filteredInvoices.map((inv) => [
      inv.invoice_no,
      inv.student_id,
      `"${inv.student_name} ${inv.student_surname || ""}"`,
      inv.class_name || "",
      `"${inv.category_name || ""}"`,
      inv.amount,
      inv.discount,
      inv.paid_amount,
      inv.due_amount,
      inv.status,
      inv.due_date,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `School_Fees_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Exported fee invoices to CSV!");
  };

  // Status badge styling helper
  const renderStatusBadge = (status: FeeStatus) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            PAID
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} className="text-amber-600" />
            PARTIAL
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertCircle size={13} className="text-rose-600" />
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={13} className="text-blue-600" />
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto text-gray-800">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${notification.type === "success"
            ? "bg-emerald-500 text-white border-emerald-600"
            : "bg-rose-500 text-white border-rose-600"
            }`}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-inner">
              <Wallet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Fee Management</h1>
                <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">
                  {stats.total_invoices} Invoices
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                Manage student billing, record fee payments, generate vouchers, and configure fee structures
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setRefreshing(true);
              void loadInitialData();
            }}
            disabled={refreshing}
            className="p-2.5 text-gray-600 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-xl transition shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin text-purple-600" : ""} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition shadow-sm"
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            onClick={() => setBulkGenerateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition shadow-sm"
          >
            <Layers size={15} />
            Bulk Generate
          </button>

          <button
            onClick={() => {
              const defaultCat = categories[0] || defaultCategories[0];
              setInvoiceForm({
                student_id: students[0]?.id || "",
                fee_category_id: defaultCat.id,
                title: `${defaultCat.name} - ${new Date().toLocaleString("default", { month: "short" })}`,
                amount: defaultCat.default_amount,
                discount: 0,
                due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
                academic_year: "2026-2027",
                notes: "",
                collect_now: false,
                paid_now: defaultCat.default_amount,
                payment_method: "CASH",
                transaction_ref: "",
              });
              setCreateInvoiceModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-200"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{fmt(stats.total_billed)}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="font-medium text-purple-600">{stats.total_invoices} invoices total</span>
              <span>across all terms</span>
            </div>
          </div>
          <div className="w-full bg-purple-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">{fmt(stats.total_collected)}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="inline-flex items-center font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <Percent size={11} className="mr-0.5" />
                {stats.collection_rate}% rate
              </span>
              <span>{stats.paid_count} fully settled</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, stats.collection_rate)}%` }} />
          </div>
        </div>

        {/* Pending Due */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Due</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">{fmt(stats.total_due)}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="font-medium text-amber-600">{stats.partial_count} partial</span>
              <span>â€¢</span>
              <span>{stats.unpaid_count} pending</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{
                width: `${stats.total_billed > 0 ? Math.min(100, (stats.total_due / stats.total_billed) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overdue Fees</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">{fmt(stats.total_overdue)}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-semibold text-[11px]">
                {stats.overdue_count} overdue invoices
              </span>
              <span>Action required</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{
                width: `${stats.total_billed > 0 ? Math.min(100, (stats.total_overdue / stats.total_billed) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === "invoices"
            ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          <FileText size={17} />
          <span>All Invoices</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-600">
            {filteredInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === "payments"
            ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          <CreditCard size={17} />
          <span>Payment Log</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-600">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === "categories"
            ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          <Tag size={17} />
          <span>Fee Structures & Categories</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-bold text-gray-600">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("class_summary")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === "class_summary"
            ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
            : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
        >
          <Building2 size={17} />
          <span>Class Collection Summary</span>
        </button>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header Filter Toolbar */}
          <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-gray-50/50">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoice #, student name, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Status Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status pills */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm text-xs font-medium">
                {(["ALL", "PAID", "PARTIAL", "UNPAID", "OVERDUE"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${statusFilter === st
                      ? "bg-purple-600 text-white font-semibold shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-purple-600"
              >
                <option value="ALL">All Fee Types</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Class Dropdown */}
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-purple-600"
              >
                <option value="ALL">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    Class {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Fee Category & Title</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Amount ({cs})</th>
                  <th className="py-3.5 px-4 text-right">Discount ({cs})</th>
                  <th className="py-3.5 px-4 text-right">Paid ({cs})</th>
                  <th className="py-3.5 px-4 text-right">Due Balance ({cs})</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText size={36} className="text-gray-300 stroke-1" />
                        <p className="font-semibold text-gray-600 text-sm">No fee invoices found</p>
                        <p className="text-xs text-gray-400">Try adjusting your filters or click "+ Create Invoice" to generate one.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((inv) => {
                    const net = Number(inv.amount) - Number(inv.discount || 0);
                    const paid = Number(inv.paid_amount || 0);
                    const due = Math.max(0, net - paid);
                    const isOverdue = inv.status === "OVERDUE" || (due > 0 && inv.due_date < new Date().toISOString().split("T")[0]);

                    return (
                      <tr key={inv.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-purple-700">
                          {inv.invoice_no}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-lamaYellow flex items-center justify-center font-bold text-xs text-gray-800 shrink-0">
                              {inv.student_name?.[0] || "S"}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {inv.student_name} {inv.student_surname}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                ID: {inv.student_id} â€¢ {inv.class_name ? `Class ${inv.class_name}` : "General"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-gray-800">{inv.title}</div>
                          <div className="inline-block mt-0.5 text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {inv.category_name || "Tuition"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className={`flex items-center gap-1 ${isOverdue ? "text-rose-600 font-semibold" : "text-gray-600"}`}>
                            <Calendar size={13} />
                            <span>{inv.due_date}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-gray-900">
                          {fmt(inv.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-500">
                          {Number(inv.discount) > 0 ? `-${fmt(inv.discount)}` : fmt(0)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                          {fmt(paid)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span className={due > 0 ? "text-rose-600" : "text-gray-400"}>
                            {fmt(due)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {renderStatusBadge(isOverdue ? "OVERDUE" : inv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {due > 0 && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 transition shadow-xs"
                                title="Collect payment"
                              >
                                <span className="font-bold text-[13px] leading-none">{cs}</span>
                                Pay
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenReceipt(inv)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition"
                              title="View and print receipt slip"
                            >
                              <Printer size={15} />
                            </button>

                            <button
                              onClick={() => setEditInvoiceModal(inv)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                              title="Edit invoice"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  type: "invoice",
                                  id: inv.id,
                                  label: `Invoice ${inv.invoice_no} (${inv.student_name} ${inv.student_surname})`,
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                              title="Delete invoice"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Column Totals Footer */}
              {paginatedInvoices.length > 0 && (() => {
                const totAmt = filteredInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
                const totDisc = filteredInvoices.reduce((s, i) => s + Number(i.discount || 0), 0);
                const totPaid = filteredInvoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
                const totDue = filteredInvoices.reduce((s, i) => {
                  const net = Number(i.amount) - Number(i.discount || 0);
                  return s + Math.max(0, net - Number(i.paid_amount || 0));
                }, 0);
                return (
                  <tfoot>
                    <tr className="border-t-2 border-purple-200 bg-purple-50/60 text-xs font-bold">
                      <td colSpan={4} className="py-3 px-4 text-gray-500 text-[11px] uppercase tracking-wide">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-gray-400">&#x3A3;</span>
                          Totals &middot; {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
                          <span className="ml-2 text-[10px] font-normal text-gray-400 hidden sm:inline">
                            Amount &minus; Discount &minus; Paid = Due Balance
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-800">{fmt(totAmt)}</td>
                      <td className="py-3 px-4 text-right text-rose-500">
                        {totDisc > 0 ? `-${fmt(totDisc)}` : "\u2014"}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">{fmt(totPaid)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={totDue > 0 ? "text-rose-700" : "text-gray-400"}>
                          {fmt(totDue)}
                        </span>
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-center text-[10px] text-gray-400 font-normal">
                        {totDue > 0
                          ? <span className="text-rose-500 font-semibold">{fmt(totDue)} outstanding</span>
                          : <span className="text-emerald-600 font-semibold">&#x2713; Fully settled</span>}
                      </td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 bg-gray-50/50">
            <div>
              Showing {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-medium hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-8 h-8 rounded-lg font-semibold transition ${currentPage === idx + 1
                      ? "bg-purple-600 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-medium hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS CASHBOOK */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search receipt #, invoice #, student name, reference..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="MOBILE_BANKING">Mobile Banking</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid ({cs})</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-400">
                      No payment records found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                        {p.receipt_no}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">
                          {p.student_name} {p.student_surname}
                        </div>
                        <div className="text-[11px] text-gray-400">Class: {p.class_name || "General"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-700">
                        {p.invoice_no || `INV-#${p.invoice_id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                          <CreditCard size={12} className="text-gray-500" />
                          {p.payment_method.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        {p.transaction_ref || "â€”"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {p.payment_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-sm">
                        {`+${fmt(p.amount)}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            const matchedInv = invoices.find((i) => i.id === p.invoice_id || i.invoice_no === p.invoice_no);
                            setReceiptData({
                              ...p,
                              invoice_amount: matchedInv?.amount || p.amount,
                              discount: matchedInv?.discount || 0,
                              net_amount: matchedInv ? Number(matchedInv.amount) - Number(matchedInv.discount || 0) : p.amount,
                              total_paid: matchedInv?.paid_amount || p.amount,
                              remaining_due: matchedInv ? Math.max(0, Number(matchedInv.amount) - Number(matchedInv.discount || 0) - Number(matchedInv.paid_amount || 0)) : 0,
                              due_date: matchedInv?.due_date || p.payment_date,
                              academic_year: matchedInv?.academic_year || "2026-2027",
                              student_code: p.student_id,
                              student_email: matchedInv?.student_email,
                              student_phone: matchedInv?.student_phone,
                              site_name: siteName,
                            });
                          }}
                          className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-medium inline-flex items-center gap-1 transition"
                        >
                          <Printer size={13} />
                          Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FEE CATEGORIES & STRUCTURE */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Configured Fee Types</h2>
              <p className="text-xs text-gray-500">Manage billing rules, frequencies, and standard tuition rates</p>
            </div>
            <button
              onClick={() => {
                setCategoryForm({
                  name: "",
                  code: "",
                  default_amount: 100,
                  frequency: "MONTHLY",
                  status: "ACTIVE",
                  description: "",
                });
                setCategoryModal({ open: true, mode: "create", data: null });
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm"
            >
              <Plus size={15} />
              Add Fee Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const catInvoices = invoices.filter((i) => i.fee_category_id === cat.id);
              const totalRevenue = catInvoices.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);

              return (
                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-100 text-purple-700">
                        {cat.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {cat.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mt-2">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description || "No description provided."}</p>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Default Amount:</span>
                        <span className="font-bold text-gray-900 text-sm">{fmt(cat.default_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Billing Frequency:</span>
                        <span className="font-medium text-gray-700">{cat.frequency.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Invoices Issued:</span>
                        <span className="font-medium text-purple-700">{catInvoices.length} invoices</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Total Collected:</span>
                        <span className="font-bold text-emerald-600">{fmt(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setCategoryForm({
                          name: cat.name,
                          code: cat.code,
                          default_amount: cat.default_amount,
                          frequency: cat.frequency,
                          status: cat.status,
                          description: cat.description || "",
                        });
                        setCategoryModal({ open: true, mode: "edit", data: cat });
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          open: true,
                          type: "category",
                          id: cat.id,
                          label: `Fee Category "${cat.name}"`,
                        })
                      }
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CLASS COLLECTION SUMMARY */}
      {activeTab === "class_summary" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Class-Wise Fee Collection Summary</h2>
            <p className="text-xs text-gray-500">Overview of total invoiced vs collection rate across academic classes</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4 text-center">Billed Students</th>
                  <th className="py-3.5 px-4 text-right">Total Billed</th>
                  <th className="py-3.5 px-4 text-right">Collected</th>
                  <th className="py-3.5 px-4 text-right">Pending Balance</th>
                  <th className="py-3.5 px-4 text-center">Progress</th>
                  <th className="py-3.5 px-4 text-center">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {classBreakdown.map((row) => (
                  <tr key={row.className} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                        {row.className}
                      </div>
                      <span>Class {row.className}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                      {row.studentCountNum}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                      ${row.billed.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      ${row.collected.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      ${row.due.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 w-44">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, row.rate)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                        {row.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE */}
      {createInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Create Student Fee Invoice</h3>
                  <p className="text-xs text-gray-500">Issue an individual fee invoice with optional instant collection</p>
                </div>
              </div>
              <button
                onClick={() => setCreateInvoiceModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Student selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Student <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={invoiceForm.student_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                >
                  <option value="">-- Choose student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.surname} (ID: {st.id}, Class: {st.class_name || st.class_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fee Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={invoiceForm.fee_category_id}
                    onChange={(e) => {
                      const sel = categories.find((c) => c.id === Number(e.target.value));
                      setInvoiceForm({
                        ...invoiceForm,
                        fee_category_id: Number(e.target.value),
                        amount: sel ? sel.default_amount : invoiceForm.amount,
                        paid_now: sel ? sel.default_amount : invoiceForm.paid_now,
                        title: sel ? `${sel.name} - ${new Date().toLocaleString("default", { month: "short" })}` : invoiceForm.title,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({cs}{c.default_amount})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.academic_year}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, academic_year: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Invoice Title / Description
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  placeholder="e.g. Monthly Tuition Fee - October 2026"
                />
              </div>

              {/* Financials: Amount, Discount, Net */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Fee Amount ({cs}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discount / Waiver ({cs})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.discount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Net Payable ({cs})
                  </label>
                  <input
                    type="text"
                    disabled
                    value={fmt(Math.max(0, invoiceForm.amount - invoiceForm.discount))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl font-bold text-purple-700"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={invoiceForm.due_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Optional memo or bank wire instructions"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Collect payment immediately toggle */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900">
                  <input
                    type="checkbox"
                    checked={invoiceForm.collect_now}
                    onChange={(e) =>
                      setInvoiceForm({
                        ...invoiceForm,
                        collect_now: e.target.checked,
                        paid_now: Math.max(0, invoiceForm.amount - invoiceForm.discount),
                      })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  Collect payment right now
                </label>

                {invoiceForm.collect_now && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Amount Paid Today ({cs})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max={Math.max(0, invoiceForm.amount - invoiceForm.discount)}
                        value={invoiceForm.paid_now}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, paid_now: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={invoiceForm.payment_method}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_method: e.target.value as PaymentMethod })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg"
                      >
                        <option value="CASH">Cash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CARD">Credit/Debit Card</option>
                        <option value="MOBILE_BANKING">Mobile Banking</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Transaction Ref / Receipt Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Deposit slip # or bKash TrxID"
                        value={invoiceForm.transaction_ref}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, transaction_ref: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateInvoiceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-200"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK GENERATE */}
      {bulkGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Bulk Generate Class Invoices</h3>
                  <p className="text-xs text-gray-500">Create invoices for an entire class in a single batch</p>
                </div>
              </div>
              <button
                onClick={() => setBulkGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBulkGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Class <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={bulkForm.class_id}
                  onChange={(e) => setBulkForm({ ...bulkForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      Class {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Fee Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bulkForm.fee_category_id}
                  onChange={(e) => {
                    const sel = categories.find((c) => c.id === Number(e.target.value));
                    setBulkForm({
                      ...bulkForm,
                      fee_category_id: Number(e.target.value),
                      amount: sel ? sel.default_amount : bulkForm.amount,
                      title: sel ? `${sel.name} - ${new Date().toLocaleString("default", { month: "long" })} 2026` : bulkForm.title,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (${c.default_amount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Invoice Title
                </label>
                <input
                  type="text"
                  required
                  value={bulkForm.title}
                  onChange={(e) => setBulkForm({ ...bulkForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount Per Student ({cs}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={bulkForm.amount}
                    onChange={(e) => setBulkForm({ ...bulkForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkForm.due_date}
                    onChange={(e) => setBulkForm({ ...bulkForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  This batch action will automatically generate an invoice with unique reference for every student in the selected class.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBulkGenerateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-200"
                >
                  Run Batch Generation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Record Fee Payment</h3>
                  <p className="text-xs text-gray-500">Collect fee installment or full payment against invoice</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Invoice context banner */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-gray-900">
                  {paymentModalInvoice.student_name} {paymentModalInvoice.student_surname}
                </div>
                <div className="text-gray-500">
                  Invoice #{paymentModalInvoice.invoice_no} â€¢ {paymentModalInvoice.title}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400">Remaining Balance</div>
                <div className="text-base font-bold text-rose-600">
                  {cs}
                  {(
                    Number(paymentModalInvoice.amount) -
                    Number(paymentModalInvoice.discount || 0) -
                    Number(paymentModalInvoice.paid_amount || 0)
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Payment Amount ({cs}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const rem =
                          Number(paymentModalInvoice.amount) -
                          Number(paymentModalInvoice.discount || 0) -
                          Number(paymentModalInvoice.paid_amount || 0);
                        setPayForm({ ...payForm, amount: Math.max(0, rem) });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition"
                    >
                      Full Due
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rem =
                          Number(paymentModalInvoice.amount) -
                          Number(paymentModalInvoice.discount || 0) -
                          Number(paymentModalInvoice.paid_amount || 0);
                        setPayForm({ ...payForm, amount: Math.round((rem / 2) * 100) / 100 });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition"
                    >
                      50% Due
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-base font-bold text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payForm.payment_method}
                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="MOBILE_BANKING">Mobile Banking (bKash / Nagad)</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Transaction Reference / Slip #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank Challan #, Card Auth code"
                  value={payForm.transaction_ref}
                  onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cashier Remarks
                </label>
                <textarea
                  rows={2}
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="Optional cashier note"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-200 flex items-center gap-1.5"
                >
                  <Check size={15} />
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE RECEIPT VOUCHER */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Top Toolbar (Non-printable) */}
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-purple-400" />
                <span className="font-bold text-sm">Official Fee Receipt Voucher</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition shadow-sm"
                >
                  <Printer size={14} />
                  Print Receipt
                </button>
                <button
                  onClick={() => setReceiptData(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" className="p-8 text-gray-800 bg-white">
              {/* Receipt Header */}
              <div className="border-b-2 border-purple-600 pb-5 mb-5 flex items-start justify-between">
                <div>
                  <div className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                    {siteName || "ACADEMIA"}
                  </div>
                  <div className="text-xs font-semibold text-purple-700 tracking-wider uppercase mt-0.5">
                    Official Fee Payment Receipt
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Academic Year: {receiptData.academic_year || "2026-2027"} â€¢ Accounts Division
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-purple-50 border border-purple-200 rounded-lg px-3 py-1 text-right">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase">Receipt No</div>
                    <div className="font-mono font-bold text-purple-700 text-sm">{receiptData.receipt_no}</div>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    <span className="font-semibold">Date:</span> {receiptData.payment_date}
                  </div>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs mb-5">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Student Name</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {receiptData.student_name} {receiptData.student_surname}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Student ID / Roll</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {receiptData.student_code || receiptData.student_id}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Class / Grade</span>
                  <span className="font-semibold text-gray-800">
                    {receiptData.class_name ? `Class ${receiptData.class_name}` : "General"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Payment Mode</span>
                  <span className="font-semibold text-emerald-700">
                    {receiptData.payment_method.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <table className="w-full text-left border-collapse text-xs mb-5">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase font-semibold">
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Invoice Amount</th>
                    <th className="py-2.5 text-right">Discount</th>
                    <th className="py-2.5 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 font-semibold text-gray-900">
                      {receiptData.invoice_title || "Academic Tuition Fee"}
                      <div className="text-[10px] text-gray-400 font-mono">Invoice #{receiptData.invoice_no}</div>
                    </td>
                    <td className="py-3 text-gray-600">{receiptData.category_name || "Tuition"}</td>
                    <td className="py-3 text-right font-medium">{fmt(receiptData.invoice_amount || receiptData.amount)}</td>
                    <td className="py-3 text-right text-gray-500">
                      {receiptData.discount ? `-${fmt(receiptData.discount)}` : `${cs}0.00`}
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900">
                      {fmt(receiptData.net_amount || receiptData.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Calculation Box */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Net Billed Amount:</span>
                    <span className="font-semibold text-gray-900">
                      {fmt(receiptData.net_amount || receiptData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold border-t border-gray-100 pt-2">
                    <span>Amount Paid (This Slip):</span>
                    <span>{fmt(receiptData.amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total Paid to Date:</span>
                    <span className="font-semibold text-gray-900">
                      {fmt(receiptData.total_paid || receiptData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold border-t-2 border-gray-200 pt-2 text-sm">
                    <span>Balance Outstanding:</span>
                    <span>{fmt(receiptData.remaining_due || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Watermark Status Seal */}
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/75 flex items-center justify-between mb-8">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Payment Status</div>
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={14} />
                    {receiptData.remaining_due === 0 ? "PAID IN FULL" : "PARTIAL PAYMENT SETTLED"}
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-400 font-mono">
                  Ref: {receiptData.transaction_ref || "VERIFIED"}
                </div>
              </div>

              {/* Dual Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-8 border-t border-dashed border-gray-300 text-center text-xs text-gray-500">
                <div>
                  <div className="h-10 border-b border-gray-400 mb-1" />
                  <div className="font-semibold text-gray-800">Accounts Officer / Cashier</div>
                  <div className="text-[10px] text-gray-400">Authorized Signature & Seal</div>
                </div>
                <div>
                  <div className="h-10 border-b border-gray-400 mb-1" />
                  <div className="font-semibold text-gray-800">Student / Guardian Copy</div>
                  <div className="text-[10px] text-gray-400">Received By</div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[10px] text-gray-400 mt-8 pt-4 border-t border-gray-100">
                This is a computer-generated voucher issued by {siteName}. All fees are subject to school financial terms.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INVOICE */}
      {editInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Edit Invoice</h3>
                <p className="text-xs text-gray-500">#{editInvoiceModal.invoice_no}</p>
              </div>
              <button
                onClick={() => setEditInvoiceModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editInvoiceModal.title}
                  onChange={(e) => setEditInvoiceModal({ ...editInvoiceModal, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount ({cs})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editInvoiceModal.amount}
                    onChange={(e) => setEditInvoiceModal({ ...editInvoiceModal, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount ({cs})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editInvoiceModal.discount}
                    onChange={(e) => setEditInvoiceModal({ ...editInvoiceModal, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={editInvoiceModal.due_date}
                  onChange={(e) => setEditInvoiceModal({ ...editInvoiceModal, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editInvoiceModal.notes || ""}
                  onChange={(e) => setEditInvoiceModal({ ...editInvoiceModal, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditInvoiceModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FEE CATEGORY */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {categoryModal.mode === "create" ? "Add Fee Category" : "Edit Fee Category"}
                </h3>
                <p className="text-xs text-gray-500">Configure fee type details and billing intervals</p>
              </div>
              <button
                onClick={() => setCategoryModal({ open: false, mode: "create", data: null })}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Laboratory Fee"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LAB"
                    maxLength={8}
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Default Amount ({cs})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={categoryForm.default_amount}
                    onChange={(e) => setCategoryForm({ ...categoryForm, default_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Frequency</label>
                  <select
                    value={categoryForm.frequency}
                    onChange={(e) => setCategoryForm({ ...categoryForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="TERMLY">Termly</option>
                    <option value="ANNUALLY">Annually</option>
                    <option value="ONE_TIME">One-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Optional details regarding this fee"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ open: false, mode: "create", data: null })}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-5 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-center text-base">Confirm Deletion</h3>
            <p className="text-xs text-gray-500 text-center mt-1">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{deleteConfirm.label}</span>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm({ open: false, type: "invoice", id: 0, label: "" })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesSection;







