import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  History,
  Layers,
  MessageSquare,
  Pencil,
  Percent,
  Phone,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
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
import FeeReceiptSlipModal from "./FeeReceiptSlipModal";
import { cleanFeeTitle, parseFeeItems } from "@/lib/cleanFeeText";

// 12 Academic Months in Bangladesh School / College Calendar
const BANGLA_MONTHS = [
  { key: "JAN", nameBn: "জানুয়ারি", nameEn: "January", order: 1 },
  { key: "FEB", nameBn: "ফেব্রুয়ারি", nameEn: "February", order: 2 },
  { key: "MAR", nameBn: "মার্চ", nameEn: "March", order: 3 },
  { key: "APR", nameBn: "এপ্রিল", nameEn: "April", order: 4 },
  { key: "MAY", nameBn: "মে", nameEn: "May", order: 5 },
  { key: "JUN", nameBn: "জুন", nameEn: "June", order: 6 },
  { key: "JUL", nameBn: "জুলাই", nameEn: "July", order: 7 },
  { key: "AUG", nameBn: "আগস্ট", nameEn: "August", order: 8 },
  { key: "SEP", nameBn: "সেপ্টেম্বর", nameEn: "September", order: 9 },
  { key: "OCT", nameBn: "অক্টোবর", nameEn: "October", order: 10 },
  { key: "NOV", nameBn: "নভেম্বর", nameEn: "November", order: 11 },
  { key: "DEC", nameBn: "ডিসেম্বর", nameEn: "December", order: 12 },
];

// Comprehensive Bangladesh School / College Fee Categories
const defaultCategories: FeeCategory[] = [
  { id: 1, name: "Monthly Tuition Fee (মাসিক বেতন)", code: "TUIT", default_amount: 800, frequency: "MONTHLY", status: "ACTIVE", category_group: "TUITION", description: "মাসিক নিয়মিত একাডেমিক বেতন (Monthly Academic Tuition Fee)" },
  { id: 2, name: "Admission Fee (ভর্তি ফি)", code: "ADMS", default_amount: 2500, frequency: "ONE_TIME", status: "ACTIVE", category_group: "ADMISSION", description: "নতুন শিক্ষার্থী ভর্তি ও রেজিস্ট্রেশন ফি (New Admission Registration)" },
  { id: 3, name: "Session Charge / Re-Admission (সেশন ফি / পুনর্ভর্তি)", code: "SESS", default_amount: 2000, frequency: "ANNUALLY", status: "ACTIVE", category_group: "ADMISSION", description: "বার্ষিক সেশন চার্জ ও পুনর্ভর্তি ফি (Annual Session Charge & Re-admission)" },
  { id: 4, name: "1st Term Exam Fee (১ম সাময়িক পরীক্ষা ফি)", code: "EXAM1", default_amount: 450, frequency: "TERMLY", status: "ACTIVE", category_group: "EXAM", description: "১ম সাময়িক / মিড-টার্ম পরীক্ষা মূল্যায়ন ও খাতা-প্রশ্ন ফি" },
  { id: 5, name: "Half-Yearly Exam Fee (অর্ধবার্ষিক পরীক্ষা ফি)", code: "EXAM2", default_amount: 500, frequency: "TERMLY", status: "ACTIVE", category_group: "EXAM", description: "অর্ধবার্ষিক পরীক্ষা মূল্যায়ন ফি (Half-Yearly Evaluation)" },
  { id: 6, name: "Annual / Final Exam Fee (বার্ষিক / ফাইনাল পরীক্ষা ফি)", code: "EXAM_FIN", default_amount: 600, frequency: "ANNUALLY", status: "ACTIVE", category_group: "EXAM", description: "চূড়ান্ত বার্ষিক পরীক্ষা ফি (Year Final Exam Evaluation)" },
  { id: 7, name: "Pre-Test & Test Exam Fee (প্রাক-নির্বাচনী ও টেস্ট পরীক্ষা ফি)", code: "TEST_EXAM", default_amount: 700, frequency: "TERMLY", status: "ACTIVE", category_group: "EXAM", description: "এসএসসি / এইচএসসি নির্বাচনী পরীক্ষা মূল্যায়ন ফি" },
  { id: 8, name: "Board Registration Fee (বোর্ড রেজিস্ট্রেশন ফি)", code: "BD_REG", default_amount: 850, frequency: "ONE_TIME", status: "ACTIVE", category_group: "BOARD", description: "শিক্ষা বোর্ড রেজিস্ট্রেশন ও প্রত্যয়ন ফি (JSC/SSC/HSC Board Registration)" },
  { id: 9, name: "Board Form Fill-up & Center Fee (বোর্ড ফরম পূরণ ও কেন্দ্র ফি)", code: "BD_FORM", default_amount: 2200, frequency: "ONE_TIME", status: "ACTIVE", category_group: "BOARD", description: "বোর্ড ফাইনাল পরীক্ষার ফরম পূরণ ও কেন্দ্র ফি" },
  { id: 10, name: "ICT & Computer Lab Fee (আইসিটি ও কম্পিউটার ল্যাব ফি)", code: "ICT_LAB", default_amount: 250, frequency: "MONTHLY", status: "ACTIVE", category_group: "LAB", description: "ডিজিটাল কম্পিউটার ল্যাব ব্যবহার ও আইসিটি প্রশিক্ষণ ফি" },
  { id: 11, name: "Science Practical Lab Fee (বিজ্ঞানাগার ল্যাব ফি)", code: "SCI_LAB", default_amount: 300, frequency: "TERMLY", status: "ACTIVE", category_group: "LAB", description: "পদার্থ, রসায়ন, জীববিজ্ঞান ও ব্যবহারিক ল্যাব ফি" },
  { id: 12, name: "Digital ID Card & Lanyard (ডিজিটাল আইডি কার্ড ও ফিতা)", code: "ID_CARD", default_amount: 150, frequency: "ONE_TIME", status: "ACTIVE", category_group: "STATIONERY", description: "স্মার্ট শিক্ষার্থী পরিচয়পত্র ও ফিতা ফি" },
  { id: 13, name: "Diary, Syllabus & Calendar (ডায়েরি, সিলেবাস ও ক্যালেন্ডার)", code: "DIARY_SYL", default_amount: 200, frequency: "ANNUALLY", status: "ACTIVE", category_group: "STATIONERY", description: "বিদ্যালয় ডায়েরি, বাৎসরিক একাডেমিক সিলেবাস ও ক্যালেন্ডার ফি" },
  { id: 14, name: "Sports, Cultural & Scout Fund (ক্রীড়া, সাংস্কৃতিক ও স্কাউট)", code: "SPRT_CLT", default_amount: 350, frequency: "ANNUALLY", status: "ACTIVE", category_group: "CO_CURRICULAR", description: "বার্ষিক ক্রীড়া প্রতিযোগিতা, সাংস্কৃতিক সপ্তাহ ও স্কাউট/রোভার ফান্ড" },
  { id: 15, name: "Library & Reading Room (লাইব্রেরি ও রিডিং রুম)", code: "LIBR", default_amount: 150, frequency: "ANNUALLY", status: "ACTIVE", category_group: "CO_CURRICULAR", description: "গ্রন্থাগার উন্নয়ন ও নিয়মিত বই ইস্যু সেবা ফি" },
  { id: 16, name: "Religious & Milad / Puja Fund (ধর্মীয় ও মিলাদ তহবিল)", code: "RELG_FND", default_amount: 120, frequency: "ANNUALLY", status: "ACTIVE", category_group: "CO_CURRICULAR", description: "ধর্মীয় অনুষ্ঠান, মিলাদ মাহফিল ও পূজা উদযাপন ফান্ড" },
  { id: 17, name: "School Development & Mosque (উন্নয়ন ও মসজিদ তহবিল)", code: "DEV_MOSQ", default_amount: 300, frequency: "ANNUALLY", status: "ACTIVE", category_group: "CO_CURRICULAR", description: "প্রতিষ্ঠান উন্নয়ন, অবকাঠামো সংস্কার ও মসজিদ তহবিল" },
  { id: 18, name: "Transport / Bus Service Fee (পরিবহন / বাস সার্ভিস ফি)", code: "TRAN", default_amount: 1200, frequency: "MONTHLY", status: "ACTIVE", category_group: "SERVICES", description: "স্কুল ও কলেজ বাস যাতায়াত সার্ভিস ফি (Monthly Transport)" },
  { id: 19, name: "Hostel & Dining Charge (হোস্টেল ও আবাসিক মেস ফি)", code: "HOSTEL", default_amount: 4500, frequency: "MONTHLY", status: "ACTIVE", category_group: "SERVICES", description: "আবাসিক ছাত্রাবাস সিট ভাড়া ও নিয়মিত ডাইনিং মেস ফি" },
  { id: 20, name: "Coaching & Special Class Fee (বিশেষ কোচিং ফি)", code: "COACHING", default_amount: 1000, frequency: "MONTHLY", status: "ACTIVE", category_group: "SERVICES", description: "দুর্বল শিক্ষার্থীদের বিশেষ কোচিং ও অতিরিক্ত ক্লাস ফি" },
  { id: 21, name: "Certificate & TC Fee (প্রশংসাপত্র ও ছাড়পত্র ফি)", code: "CERT_TC", default_amount: 250, frequency: "ONE_TIME", status: "ACTIVE", category_group: "OTHER", description: "মূল প্রশংসাপত্র, প্রত্যয়ন পত্র ও ছাড়পত্র (TC) ফি" },
  { id: 22, name: "Late Payment Fine (বিলম্ব ফি / জরিমানা)", code: "LATE_FINE", default_amount: 50, frequency: "ONE_TIME", status: "ACTIVE", category_group: "OTHER", description: "নির্ধারিত তারিখের পর বিল পরিশোধের বিলম্ব জরিমানা" },
];

// Fallback sample students with authentic Bangladesh School / College attributes
const sampleStudentsFallback = [
  { id: "s1", name: "আব্দুল্লাহ", surname: "আল মামুন", roll: "101", email: "mamun@gmail.com", phone: "01711223344", class_id: 1, class_name: "Class 6A", grade_level: 6, shift: "প্রভাতী (Morning)", group: "সাধারণ", parent_name: "রফিকুল ইসলাম", parent_phone: "01711223344" },
  { id: "s2", name: "ফাতেমা", surname: "তুজ জোহরা", roll: "102", email: "fatema@gmail.com", phone: "01819887766", class_id: 1, class_name: "Class 6A", grade_level: 6, shift: "প্রভাতী (Morning)", group: "সাধারণ", parent_name: "আবুল কালাম", parent_phone: "01819887766" },
  { id: "s3", name: "তানভীর", surname: "আহমেদ", roll: "201", email: "tanvir@gmail.com", phone: "01912345678", class_id: 2, class_name: "Class 7A", grade_level: 7, shift: "দিবা (Day)", group: "সাধারণ", parent_name: "মোশাররফ হোসেন", parent_phone: "01912345678" },
  { id: "s4", name: "নুসরাত", surname: "জাহান", roll: "202", email: "nusrat@gmail.com", phone: "01715678901", class_id: 2, class_name: "Class 7A", grade_level: 7, shift: "দিবা (Day)", group: "সাধারণ", parent_name: "আমিরুল হক", parent_phone: "01715678901" },
  { id: "s5", name: "সাকিব", surname: "আল হাসান", roll: "301", email: "sakib@gmail.com", phone: "01611223344", class_id: 3, class_name: "Class 8A", grade_level: 8, shift: "প্রভাতী (Morning)", group: "সাধারণ", parent_name: "খায়রুল আনাম", parent_phone: "01611223344" },
  { id: "s6", name: "মারিয়া", surname: "আক্তার", roll: "302", email: "maria@gmail.com", phone: "01511223344", class_id: 3, class_name: "Class 8A", grade_level: 8, shift: "প্রভাতী (Morning)", group: "সাধারণ", parent_name: "আব্দুর রহিম", parent_phone: "01511223344" },
  { id: "s7", name: "মেহেদী", surname: "হাসান", roll: "401", email: "mehedi@gmail.com", phone: "01719988776", class_id: 4, class_name: "Class 9 - বিজ্ঞান (Science)", grade_level: 9, shift: "দিবা (Day)", group: "বিজ্ঞান", parent_name: "আবু তাহের", parent_phone: "01719988776" },
  { id: "s8", name: "সুমাইয়া", surname: "খাতুন", roll: "402", email: "sumaiya@gmail.com", phone: "01815566778", class_id: 4, class_name: "Class 9 - বিজ্ঞান (Science)", grade_level: 9, shift: "দিবা (Day)", group: "বিজ্ঞান", parent_name: "নজরুল ইসলাম", parent_phone: "01815566778" },
  { id: "s9", name: "আরিফ", surname: "হোসেন", roll: "501", email: "arif@gmail.com", phone: "01918877665", class_id: 5, class_name: "Class 10 - ব্যবসায় শিক্ষা (Business)", grade_level: 10, shift: "দিবা (Day)", group: "ব্যবসায় শিক্ষা", parent_name: "জয়নাল আবেদীন", parent_phone: "01918877665" },
  { id: "s10", name: "সাদিয়া", surname: "ইসলাম", roll: "601", email: "sadia@gmail.com", phone: "01714455667", class_id: 6, class_name: "Class 11 - বিজ্ঞান (HSC Science)", grade_level: 11, shift: "দিবা (Day)", group: "বিজ্ঞান", parent_name: "মুস্তাফিজুর রহমান", parent_phone: "01714455667" },
];

export const FeesSection: React.FC = () => {
  const { siteName, currencySymbol: cs } = useSiteSettings();

  // Helper – format currency using Bangladesh Taka symbol (defaults to ৳)
  const fmt = (n: number | string | undefined) =>
    `${cs || "৳"}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Navigation Tabs for Bangladesh School / College System
  const [activeTab, setActiveTab] = useState<
    "quick_counter" | "invoices" | "batch_generator" | "categories" | "class_due_register" | "daily_register"
  >("quick_counter");

  // Core State
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>(defaultCategories);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<any[]>(sampleStudentsFallback);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: "Class 6A" },
    { id: 2, name: "Class 7A" },
    { id: 3, name: "Class 8A" },
    { id: 4, name: "Class 9 - বিজ্ঞান (Science)" },
    { id: 5, name: "Class 10 - ব্যবসায় শিক্ষা (Business)" },
    { id: 6, name: "Class 11 - বিজ্ঞান (HSC Science)" },
  ]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Quick Counter Collection State
  const [counterSelectedClass, setCounterSelectedClass] = useState<string>("ALL");
  const [counterSearchText, setCounterSearchText] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(sampleStudentsFallback[0]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["NOV"]);
  const [selectedOtherFeeIds, setSelectedOtherFeeIds] = useState<number[]>([]);
  const [counterLateFine, setCounterLateFine] = useState<number>(0);
  const [counterDiscount, setCounterDiscount] = useState<number>(0);
  const [counterWaiverType, setCounterWaiverType] = useState<string>("GENERAL");
  const [counterPaymentMethod, setCounterPaymentMethod] = useState<PaymentMethod>("CASH");
  const [counterTxnRef, setCounterTxnRef] = useState<string>("");
  const [counterPaidNow, setCounterPaidNow] = useState<number>(0);
  const [counterNotes, setCounterNotes] = useState<string>("");

  // Filters for Invoices Tab
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals State
  const [createInvoiceModal, setCreateInvoiceModal] = useState(false);
  const [bulkGenerateModal, setBulkGenerateModal] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<FeeInvoice | null>(null);
  const [receiptData, setReceiptData] = useState<FeeReceiptData | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; mode: "create" | "edit"; data?: FeeCategory | null }>({ open: false, mode: "create", data: null });
  const [editInvoiceModal, setEditInvoiceModal] = useState<FeeInvoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: "invoice" | "category"; id: number | string; label: string }>({ open: false, type: "invoice", id: 0, label: "" });

  // Batch Generator State
  const [batchClassId, setBatchClassId] = useState<string>("");
  const [batchCategoryIds, setBatchCategoryIds] = useState<number[]>([1, 10]); // Tuition + ICT Lab
  const [batchMonth, setBatchMonth] = useState<string>("নভেম্বর ২০২৬");
  const [batchAcademicYear, setBatchAcademicYear] = useState<string>("2026-2027");
  const [batchDueDate, setBatchDueDate] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [batchGenerating, setBatchGenerating] = useState<boolean>(false);

  // Daily Register Filter
  const [dailyDateFilter, setDailyDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);

  // Form states for Create Single Invoice
  const [invoiceForm, setInvoiceForm] = useState({
    student_id: "",
    fee_category_id: 1,
    title: "",
    amount: 800,
    discount: 0,
    late_fine: 0,
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    academic_year: "2026-2027",
    notes: "",
    collect_now: false,
    paid_now: 800,
    payment_method: "CASH" as PaymentMethod,
    transaction_ref: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    code: "",
    default_amount: 500,
    frequency: "MONTHLY" as FeeCategory["frequency"],
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    category_group: "TUITION" as FeeCategory["category_group"],
    description: "",
  });

  const [payForm, setPayForm] = useState({
    amount: 0,
    payment_method: "CASH" as PaymentMethod,
    payment_date: new Date().toISOString().split("T")[0],
    transaction_ref: "",
    notes: "",
  });

  // Toast Notification
  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Sync to local storage
  const syncToLocalStorage = (invList: FeeInvoice[], payList: FeePayment[], catList: FeeCategory[]) => {
    try {
      localStorage.setItem("mk_school_fees_invoices", JSON.stringify(invList));
      localStorage.setItem("mk_school_fee_payments", JSON.stringify(payList));
      localStorage.setItem("mk_school_fee_categories", JSON.stringify(catList));
      window.dispatchEvent(
        new CustomEvent("mk_fees_updated", {
          detail: { invoices: invList, payments: payList },
        })
      );
    } catch (e) {
      console.warn("Could not sync fees to localStorage", e);
    }
  };

  // Initial Data Loading
  const loadInitialData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Students & Classes
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.getAll("students", { limit: 100 }),
        api.getAll("classes", { limit: 100 }),
      ]);

      if (studentsRes.success && Array.isArray(studentsRes.data?.students) && studentsRes.data.students.length > 0) {
        setStudents(studentsRes.data.students);
        setSelectedStudent(studentsRes.data.students[0]);
      } else {
        setSelectedStudent(sampleStudentsFallback[0]);
      }

      if (classesRes.success && Array.isArray(classesRes.data?.classes) && classesRes.data.classes.length > 0) {
        setClasses(classesRes.data.classes);
      }
    } catch (err) {
      console.warn("Could not fetch auxiliary students/classes, using fallback.", err);
      setSelectedStudent(sampleStudentsFallback[0]);
    }

    // 2. Fetch Fees, Categories, Payments
    try {
      const [feesRes, catRes, payRes] = await Promise.all([
        api.getAll("fees", { limit: 200 }),
        api.getFeeCategories(),
        api.getFeePayments({ limit: 100 }),
      ]);

      let loadedInvoices: FeeInvoice[] = [];
      let loadedCategories: FeeCategory[] = [];
      let loadedPayments: FeePayment[] = [];

      const rawInvoices =
        (feesRes as any)?.data?.fees ||
        (feesRes as any)?.fees ||
        (feesRes as any)?.data?.invoices ||
        (feesRes as any)?.invoices;
      if (Array.isArray(rawInvoices) && rawInvoices.length > 0) {
        loadedInvoices = rawInvoices;
      }

      const rawCats = (catRes as any)?.data?.categories || (catRes as any)?.categories;
      if (Array.isArray(rawCats) && rawCats.length > 0) {
        loadedCategories = rawCats.map((c: any) => ({
          ...c,
          id: Number(c.id),
          default_amount: Number(c.default_amount) || 0,
        }));
      } else {
        const storedCatsRaw = localStorage.getItem("mk_school_fee_categories");
        if (storedCatsRaw) {
          try {
            const localCats: FeeCategory[] = JSON.parse(storedCatsRaw);
            if (Array.isArray(localCats) && localCats.length > 0) {
              loadedCategories = localCats;
            }
          } catch { }
        }
      }

      if (loadedCategories.length === 0) {
        loadedCategories = defaultCategories;
      }

      const rawPayments = (payRes as any)?.data?.payments || (payRes as any)?.payments;
      if (Array.isArray(rawPayments) && rawPayments.length > 0) {
        loadedPayments = rawPayments;
      }

      // Check localStorage if API empty
      if (loadedInvoices.length === 0) {
        const stored = localStorage.getItem("mk_school_fees_invoices");
        if (stored) {
          try {
            loadedInvoices = JSON.parse(stored);
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

      // Seed realistic initial dataset if completely empty
      if (loadedInvoices.length === 0) {
        const generated = generateFallbackData(sampleStudentsFallback, loadedCategories);
        loadedInvoices = generated.invoices;
        loadedPayments = generated.payments;
        syncToLocalStorage(loadedInvoices, loadedPayments, loadedCategories);
      }

      // Sanitize titles from legacy question marks
      loadedInvoices = loadedInvoices.map((inv) => ({
        ...inv,
        title: cleanFeeTitle(inv.title),
        category_name: cleanFeeTitle(inv.category_name),
      }));

      loadedCategories = loadedCategories.map((cat) => ({
        ...cat,
        name: cleanFeeTitle(cat.name),
        description: cleanFeeTitle(cat.description),
      }));

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
        syncToLocalStorage(generated.invoices, generated.payments, defaultCategories);
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

  // Fallback Generator with Authentic BD School Structure
  function generateFallbackData(studentList: any[], catList: FeeCategory[]) {
    const invs: FeeInvoice[] = [];
    const pays: FeePayment[] = [];
    let invSeq = 1001;
    let paySeq = 2001;
    const today = new Date();

    studentList.forEach((st, idx) => {
      // 1. Monthly Tuition Fee (মাসিক বেতন)
      const tuitionCat = catList.find((c) => c.code === "TUIT") || catList[0];
      const invNo = `INV-2026-${invSeq++}`;
      const amount = tuitionCat.default_amount;
      const discount = idx % 5 === 0 ? 100 : 0;
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
        dueDate.setDate(today.getDate() - 10);
      } else {
        dueDate.setDate(today.getDate() + 15);
      }

      const inv: FeeInvoice = {
        id: invSeq,
        invoice_no: invNo,
        student_id: String(st.id),
        student_name: st.name,
        student_surname: st.surname,
        student_roll: st.roll || String(100 + idx),
        student_email: st.email,
        student_phone: st.phone,
        class_name: st.class_name || "Class 6A",
        section_name: st.shift || "Morning",
        shift_name: st.shift || "প্রভাতী",
        group_name: st.group || "সাধারণ",
        grade_level: st.grade_level || 6,
        fee_category_id: tuitionCat.id,
        category_name: tuitionCat.name,
        category_code: tuitionCat.code,
        title: `মাসিক বেতন - ${today.toLocaleString("default", { month: "long" })} 2026`,
        due_date: dueDate.toISOString().split("T")[0],
        amount,
        discount,
        paid_amount: paid,
        net_amount: net,
        due_amount: Math.max(0, net - paid),
        status,
        academic_year: "2026-2027",
        notes: "নিয়মিত একাডেমিক মাসিক বেতন",
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
          student_roll: st.roll || String(100 + idx),
          class_name: inv.class_name,
          amount: paid,
          payment_method: idx % 2 === 0 ? "CASH" : "BKASH",
          transaction_ref: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          payment_date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
          notes: status === "PAID" ? "পরিশোধিত মানি রসিদ" : "আংশিক কিস্তি জমা",
        });
      }

      // 2. Extra Exam or ICT Lab Fee
      if (idx % 2 === 0) {
        const cat = catList.find((c) => c.code === (idx % 4 === 0 ? "EXAM1" : "ICT_LAB")) || catList[3];
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
          student_roll: st.roll || String(100 + idx),
          student_email: st.email,
          student_phone: st.phone,
          class_name: st.class_name || "Class 6A",
          grade_level: st.grade_level || 6,
          fee_category_id: cat.id,
          category_name: cat.name,
          category_code: cat.code,
          title: cat.name,
          due_date: new Date(today.getTime() + 18 * 86400000).toISOString().split("T")[0],
          amount: cat.default_amount,
          discount: 0,
          paid_amount: extraPaid,
          net_amount: extraNet,
          due_amount: Math.max(0, extraNet - extraPaid),
          status: extraStatus,
          academic_year: "2026-2027",
          notes: "পরীক্ষা ও ব্যবহারিক ল্যাব ফি",
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
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
            student_roll: st.roll || String(100 + idx),
            class_name: extraInv.class_name,
            amount: extraPaid,
            payment_method: "NAGAD",
            transaction_ref: `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            payment_date: new Date().toISOString().split("T")[0],
            notes: "অফিসিয়াল রসিদ ক্লিয়ারেন্স",
          });
        }
      }
    });

    return { invoices: invs, payments: pays };
  }

  // Quick Counter Calculations
  const counterTuitionFee = useMemo(() => {
    const tuitionCat = categories.find((c) => c.code === "TUIT");
    return tuitionCat ? Number(tuitionCat.default_amount) : 800;
  }, [categories]);

  const counterTuitionSubtotal = useMemo(() => {
    return selectedMonths.length * counterTuitionFee;
  }, [selectedMonths, counterTuitionFee]);

  const counterOtherFeesSubtotal = useMemo(() => {
    return selectedOtherFeeIds.reduce((sum, catId) => {
      const cat = categories.find((c) => c.id === catId);
      return sum + (cat ? Number(cat.default_amount) : 0);
    }, 0);
  }, [selectedOtherFeeIds, categories]);

  const counterGrossTotal = useMemo(() => {
    return counterTuitionSubtotal + counterOtherFeesSubtotal + Number(counterLateFine || 0);
  }, [counterTuitionSubtotal, counterOtherFeesSubtotal, counterLateFine]);

  const counterNetPayable = useMemo(() => {
    return Math.max(0, counterGrossTotal - Number(counterDiscount || 0));
  }, [counterGrossTotal, counterDiscount]);

  // Keep counterPaidNow in sync with net payable when it recalculates
  useEffect(() => {
    setCounterPaidNow(counterNetPayable);
  }, [counterNetPayable]);

  // Filtered Students for Quick Counter
  const counterFilteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass =
        counterSelectedClass === "ALL" ||
        String(s.class_id) === String(counterSelectedClass) ||
        String(s.class_name).toLowerCase().includes(String(counterSelectedClass).toLowerCase());
      const sTerm = counterSearchText.toLowerCase();
      const matchText =
        !sTerm ||
        `${s.name} ${s.surname || ""}`.toLowerCase().includes(sTerm) ||
        String(s.roll || "").toLowerCase().includes(sTerm) ||
        String(s.id || "").toLowerCase().includes(sTerm) ||
        String(s.phone || "").includes(sTerm);
      return matchClass && matchText;
    });
  }, [students, counterSelectedClass, counterSearchText]);

  // Student Invoices for currently selected student in counter
  const selectedStudentInvoices = useMemo(() => {
    if (!selectedStudent) return [];
    return invoices.filter((inv) => String(inv.student_id) === String(selectedStudent.id));
  }, [selectedStudent, invoices]);

  const selectedStudentTotalDue = useMemo(() => {
    return selectedStudentInvoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.due_amount || 0)), 0);
  }, [selectedStudentInvoices]);

  // KPI Statistics Calculation
  const stats: FeeStats = useMemo(() => {
    let total_billed = 0;
    let total_collected = 0;
    let total_due = 0;
    let total_overdue = 0;
    let paid_count = 0;
    let partial_count = 0;
    let unpaid_count = 0;
    let overdue_count = 0;

    invoices.forEach((inv) => {
      const billed = Number(inv.amount || 0) - Number(inv.discount || 0);
      const paid = Number(inv.paid_amount || 0);
      const due = Math.max(0, billed - paid);

      total_billed += billed;
      total_collected += paid;
      total_due += due;

      if (inv.status === "PAID") paid_count++;
      else if (inv.status === "PARTIAL") partial_count++;
      else if (inv.status === "OVERDUE") {
        overdue_count++;
        total_overdue += due;
      } else unpaid_count++;
    });

    const rate = total_billed > 0 ? (total_collected / total_billed) * 100 : 0;

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
      collection_rate: Math.round(rate * 10) / 10,
    };
  }, [invoices]);

  // Filtered Invoices for Invoices Table
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !search ||
        inv.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
        (inv.student_name && inv.student_name.toLowerCase().includes(search.toLowerCase())) ||
        (inv.student_surname && inv.student_surname.toLowerCase().includes(search.toLowerCase())) ||
        (inv.student_roll && inv.student_roll.includes(search)) ||
        inv.title.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
      const matchCategory = categoryFilter === "ALL" || String(inv.fee_category_id) === String(categoryFilter);
      const matchClass =
        classFilter === "ALL" || (inv.class_name && inv.class_name.toLowerCase().includes(classFilter.toLowerCase()));

      return matchSearch && matchStatus && matchCategory && matchClass;
    });
  }, [invoices, search, statusFilter, categoryFilter, classFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Handle Quick Counter Fee Collection & Print Slip
  const handleQuickCounterSubmit = async () => {
    if (!selectedStudent) {
      showToast("error", "অনুগ্রহ করে শিক্ষার্থী নির্বাচন করুন (Please select a student)");
      return;
    }
    if (counterPaidNow <= 0) {
      showToast("error", "আদায়কৃত টাকার পরিমাণ প্রদান করুন (Please enter paid amount)");
      return;
    }

    const receiptNo = `REC-2026-${Date.now().toString().slice(-5)}`;
    const invoiceNo = `INV-2026-${Date.now().toString().slice(-5)}`;

    const monthNames = selectedMonths
      .map((m) => BANGLA_MONTHS.find((b) => b.key === m)?.nameBn)
      .filter(Boolean)
      .join(", ");

    const itemsList: Array<{ name: string; amount: number; net?: number }> = [];
    if (selectedMonths.length > 0) {
      itemsList.push({
        name: `মাসিক বেতন (${monthNames})`,
        amount: counterTuitionSubtotal,
        net: counterTuitionSubtotal,
      });
    }
    selectedOtherFeeIds.forEach((id) => {
      const cat = categories.find((c) => c.id === id);
      if (cat) {
        const amt = Number(cat.default_amount || 0);
        itemsList.push({
          name: cleanFeeTitle(cat.name),
          amount: amt,
          net: amt,
        });
      }
    });

    if (itemsList.length === 0) {
      itemsList.push({
        name: "একাডেমিক ফি (Academic Fee)",
        amount: counterGrossTotal,
        net: counterNetPayable,
      });
    }

    const feeDescription = cleanFeeTitle(
      itemsList.map((it) => it.name).join(" + ")
    );

    const isFull = counterPaidNow >= counterNetPayable;
    const remainingDue = Math.max(0, counterNetPayable - counterPaidNow);

    // Create New Invoice Record
    const newInvoice: FeeInvoice = {
      id: Date.now(),
      invoice_no: invoiceNo,
      student_id: String(selectedStudent.id),
      student_name: selectedStudent.name,
      student_surname: selectedStudent.surname,
      student_roll: selectedStudent.roll || "101",
      student_phone: selectedStudent.phone,
      student_email: selectedStudent.email,
      class_name: selectedStudent.class_name || "General",
      grade_level: selectedStudent.grade_level || 6,
      parent_id: String((selectedStudent as any).parent_id || (selectedStudent as any).parentId || (selectedStudent as any).parent?.id || ""),
      parent_name: (selectedStudent as any).parent_name || (selectedStudent as any).parent?.name || "",
      parent_phone: (selectedStudent as any).parent_phone || (selectedStudent as any).parent?.phone || "",
      fee_category_id: 1,
      category_name: feeDescription,
      title: feeDescription || "একাডেমিক ফি আদায়",
      due_date: new Date().toISOString().split("T")[0],
      amount: counterTuitionSubtotal + counterOtherFeesSubtotal,
      discount: Number(counterDiscount || 0),
      late_fine: Number(counterLateFine || 0),
      paid_amount: counterPaidNow,
      net_amount: counterNetPayable,
      due_amount: remainingDue,
      status: isFull ? "PAID" : "PARTIAL",
      academic_year: "2026-2027",
      notes: counterNotes || `কাউন্টার আদায় (${counterWaiverType})`,
      fee_items: itemsList,
      created_at: new Date().toISOString(),
    };

    // Create New Payment Record
    const newPayment: FeePayment = {
      id: Date.now() + 1,
      receipt_no: receiptNo,
      invoice_id: newInvoice.id,
      invoice_no: invoiceNo,
      invoice_title: newInvoice.title,
      category_name: "একাডেমিক ফি আদায়",
      student_id: String(selectedStudent.id),
      student_name: selectedStudent.name,
      student_surname: selectedStudent.surname,
      student_roll: selectedStudent.roll,
      class_name: selectedStudent.class_name,
      amount: counterPaidNow,
      payment_method: counterPaymentMethod,
      transaction_ref: counterTxnRef || `TXN-BD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      payment_date: new Date().toISOString().split("T")[0],
      notes: counterNotes || "কাউন্টার ক্যাশ রসিদ",
    };

    // Try posting to API if online
    try {
      await api.create("fees", {
        student_id: selectedStudent.id,
        fee_category_id: 1,
        title: newInvoice.title,
        amount: newInvoice.amount,
        discount: newInvoice.discount,
        due_date: newInvoice.due_date,
        academic_year: newInvoice.academic_year,
        paid_now: counterPaidNow,
        payment_method: counterPaymentMethod,
        transaction_ref: newPayment.transaction_ref,
        notes: newInvoice.notes,
      });
    } catch (e) {
      console.warn("Saving to local state and localStorage", e);
    }

    const updatedInvoices = [newInvoice, ...invoices];
    const updatedPayments = [newPayment, ...payments];
    setInvoices(updatedInvoices);
    setPayments(updatedPayments);
    syncToLocalStorage(updatedInvoices, updatedPayments, categories);

    // Prepare printable 2-Part Money Receipt Voucher
    const receiptDoc: FeeReceiptData = {
      ...newPayment,
      invoice_amount: newInvoice.amount,
      discount: newInvoice.discount,
      late_fine: newInvoice.late_fine,
      total_paid: counterPaidNow,
      net_amount: counterNetPayable,
      remaining_due: remainingDue,
      due_date: newInvoice.due_date,
      academic_year: "2026-2027",
      student_code: String(selectedStudent.id),
      student_roll: selectedStudent.roll,
      student_phone: selectedStudent.phone,
      student_email: selectedStudent.email,
      class_name: selectedStudent.class_name,
      section_name: selectedStudent.shift,
      shift_name: selectedStudent.shift,
      parent_name: selectedStudent.parent_name,
      parent_phone: selectedStudent.parent_phone,
      fee_items: itemsList,
    };

    setReceiptData(receiptDoc);
    showToast("success", `মানি রসিদ #${receiptNo} সফলভাবে তৈরি হয়েছে! (Receipt generated)`);

    // Reset counter selections
    setSelectedMonths([]);
    setSelectedOtherFeeIds([]);
    setCounterDiscount(0);
    setCounterLateFine(0);
    setCounterTxnRef("");
    setCounterNotes("");
  };

  // Handle Batch Generation for entire class
  const handleBatchGenerate = async () => {
    if (!batchClassId) {
      showToast("error", "অনুগ্রহ করে শ্রেণি নির্বাচন করুন (Please select a class)");
      return;
    }
    if (batchCategoryIds.length === 0) {
      showToast("error", "কমপক্ষে একটি ফি খাত নির্বাচন করুন (Select at least one fee category)");
      return;
    }

    setBatchGenerating(true);

    const targetStudents = students.filter(
      (s) => batchClassId === "ALL" || String(s.class_id) === String(batchClassId) || s.class_name === batchClassId
    );

    if (targetStudents.length === 0) {
      showToast("error", "নির্বাচিত শ্রেণিতে কোন শিক্ষার্থী পাওয়া যায়নি (No students found)");
      setBatchGenerating(false);
      return;
    }

    const newInvs: FeeInvoice[] = [];
    const baseCount = invoices.length + 1000;

    targetStudents.forEach((st, idx) => {
      batchCategoryIds.forEach((catId, cIdx) => {
        const cat = categories.find((c) => c.id === catId);
        if (!cat) return;

        const invNo = `INV-2026-${baseCount + idx * 10 + cIdx}`;
        newInvs.push({
          id: Date.now() + idx * 100 + cIdx,
          invoice_no: invNo,
          student_id: String(st.id),
          student_name: st.name,
          student_surname: st.surname,
          student_roll: st.roll,
          student_phone: st.phone,
          student_email: st.email,
          class_name: st.class_name || "General",
          grade_level: st.grade_level || 6,
          parent_id: String((st as any).parent_id || (st as any).parentId || (st as any).parent?.id || ""),
          parent_name: (st as any).parent_name || (st as any).parent?.name || "",
          parent_phone: (st as any).parent_phone || (st as any).parent?.phone || "",
          fee_category_id: cat.id,
          category_name: cat.name,
          category_code: cat.code,
          title: `${cat.name} - ${batchMonth}`,
          due_date: batchDueDate,
          amount: cat.default_amount,
          discount: 0,
          paid_amount: 0,
          net_amount: cat.default_amount,
          due_amount: cat.default_amount,
          status: "UNPAID",
          academic_year: batchAcademicYear,
          notes: `গণ-ফি তৈরি (${batchMonth})`,
          fee_items: [{ name: cleanFeeTitle(`${cat.name} - ${batchMonth}`), amount: cat.default_amount }],
          created_at: new Date().toISOString(),
        });
      });
    });

    const updatedInvoices = [...newInvs, ...invoices];
    setInvoices(updatedInvoices);
    syncToLocalStorage(updatedInvoices, payments, categories);

    setBatchGenerating(false);
    setBulkGenerateModal(false);
    showToast(
      "success",
      `সফলভাবে ${newInvs.length} টি ফি ইনভয়েস তৈরি হয়েছে! (${newInvs.length} Invoices generated)`
    );
  };

  // Record Single Payment from Invoices Table
  const handleRecordPayment = (invoice: FeeInvoice) => {
    setPaymentModalInvoice(invoice);
    const due = Math.max(0, Number(invoice.amount) - Number(invoice.discount || 0) - Number(invoice.paid_amount || 0));
    setPayForm({
      amount: due,
      payment_method: "CASH",
      payment_date: new Date().toISOString().split("T")[0],
      transaction_ref: "",
      notes: "ইনভয়েস পরিশোধ",
    });
  };

  const submitRecordPayment = async () => {
    if (!paymentModalInvoice) return;
    if (payForm.amount <= 0) {
      showToast("error", "পরিশোধিত টাকার পরিমাণ দিন");
      return;
    }

    const net = Math.max(0, Number(paymentModalInvoice.amount) - Number(paymentModalInvoice.discount || 0));
    const newPaid = Number(paymentModalInvoice.paid_amount || 0) + payForm.amount;
    const isFull = newPaid >= net;
    const remainingDue = Math.max(0, net - newPaid);

    const receiptNo = `REC-2026-${Date.now().toString().slice(-5)}`;

    const newPayment: FeePayment = {
      id: Date.now(),
      receipt_no: receiptNo,
      invoice_id: paymentModalInvoice.id,
      invoice_no: paymentModalInvoice.invoice_no,
      invoice_title: paymentModalInvoice.title,
      category_name: paymentModalInvoice.category_name,
      student_id: paymentModalInvoice.student_id,
      student_name: paymentModalInvoice.student_name,
      student_surname: paymentModalInvoice.student_surname,
      student_roll: paymentModalInvoice.student_roll,
      class_name: paymentModalInvoice.class_name,
      amount: payForm.amount,
      payment_method: payForm.payment_method,
      transaction_ref: payForm.transaction_ref || `TXN-REC-${Date.now().toString().slice(-4)}`,
      payment_date: payForm.payment_date,
      notes: payForm.notes,
    };

    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === paymentModalInvoice.id) {
        return {
          ...inv,
          paid_amount: newPaid,
          due_amount: remainingDue,
          status: isFull ? ("PAID" as FeeStatus) : ("PARTIAL" as FeeStatus),
        };
      }
      return inv;
    });

    const updatedPayments = [newPayment, ...payments];
    setInvoices(updatedInvoices);
    setPayments(updatedPayments);
    syncToLocalStorage(updatedInvoices, updatedPayments, categories);

    // Open Money Receipt Slip
    const receiptDoc: FeeReceiptData = {
      ...newPayment,
      invoice_title: cleanFeeTitle(paymentModalInvoice.title),
      category_name: cleanFeeTitle(paymentModalInvoice.category_name),
      invoice_amount: paymentModalInvoice.amount,
      discount: paymentModalInvoice.discount,
      total_paid: newPaid,
      net_amount: net,
      remaining_due: remainingDue,
      due_date: paymentModalInvoice.due_date,
      academic_year: paymentModalInvoice.academic_year,
      student_code: paymentModalInvoice.student_id,
      student_roll: paymentModalInvoice.student_roll,
      student_phone: paymentModalInvoice.student_phone,
      student_email: paymentModalInvoice.student_email,
      class_name: paymentModalInvoice.class_name,
      section_name: paymentModalInvoice.section_name,
      fee_items: paymentModalInvoice.fee_items && paymentModalInvoice.fee_items.length > 0
        ? paymentModalInvoice.fee_items
        : parseFeeItems(cleanFeeTitle(paymentModalInvoice.title || paymentModalInvoice.category_name), paymentModalInvoice.amount),
    };

    setPaymentModalInvoice(null);
    setReceiptData(receiptDoc);
    showToast("success", `পেমেন্ট সম্পন্ন হয়েছে! রসিদ #${receiptNo}`);
  };

  // Print voucher from any invoice row
  const openReceiptFromInvoice = (inv: FeeInvoice) => {
    const net = Number(inv.net_amount ?? (Number(inv.amount) - Number(inv.discount || 0)));
    const feeItems = inv.fee_items && inv.fee_items.length > 0
      ? inv.fee_items
      : parseFeeItems(cleanFeeTitle(inv.title || inv.category_name), inv.amount);
    const slipDoc: FeeReceiptData = {
      id: Date.now(),
      receipt_no: `SLIP-${inv.invoice_no}`,
      invoice_id: inv.id,
      invoice_no: inv.invoice_no,
      invoice_title: cleanFeeTitle(inv.title),
      category_name: cleanFeeTitle(inv.category_name),
      student_id: inv.student_id,
      student_name: inv.student_name,
      student_surname: inv.student_surname,
      student_roll: inv.student_roll,
      student_phone: inv.student_phone,
      student_email: inv.student_email,
      class_name: inv.class_name,
      section_name: inv.section_name,
      amount: inv.paid_amount || net,
      payment_method: "CASH",
      payment_date: inv.created_at ? inv.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      invoice_amount: inv.amount,
      discount: inv.discount,
      late_fine: inv.late_fine,
      total_paid: inv.paid_amount,
      net_amount: net,
      remaining_due: inv.due_amount ?? Math.max(0, net - Number(inv.paid_amount || 0)),
      due_date: inv.due_date,
      academic_year: inv.academic_year,
      notes: inv.notes,
      fee_items: feeItems,
    };
    setReceiptData(slipDoc);
  };

  // Class-wise Due Summary
  const classDueSummary = useMemo(() => {
    const map: Record<
      string,
      {
        class_name: string;
        students_count: number;
        total_billed: number;
        total_paid: number;
        total_due: number;
        defaulters_count: number;
        defaulter_students: Array<{ name: string; roll: string; due: number; phone: string }>;
      }
    > = {};

    classes.forEach((c) => {
      map[c.name] = {
        class_name: c.name,
        students_count: 0,
        total_billed: 0,
        total_paid: 0,
        total_due: 0,
        defaulters_count: 0,
        defaulter_students: [],
      };
    });

    students.forEach((st) => {
      const cName = st.class_name || "General";
      if (!map[cName]) {
        map[cName] = {
          class_name: cName,
          students_count: 0,
          total_billed: 0,
          total_paid: 0,
          total_due: 0,
          defaulters_count: 0,
          defaulter_students: [],
        };
      }
      map[cName].students_count++;

      const stInvs = invoices.filter((i) => String(i.student_id) === String(st.id));
      let stDue = 0;
      stInvs.forEach((i) => {
        const billed = Number(i.amount || 0) - Number(i.discount || 0);
        const paid = Number(i.paid_amount || 0);
        const due = Math.max(0, billed - paid);
        map[cName].total_billed += billed;
        map[cName].total_paid += paid;
        map[cName].total_due += due;
        stDue += due;
      });

      if (stDue > 0) {
        map[cName].defaulters_count++;
        map[cName].defaulter_students.push({
          name: [st.name, st.surname].filter(Boolean).join(" "),
          roll: st.roll || "—",
          due: stDue,
          phone: st.phone || "—",
        });
      }
    });

    return Object.values(map);
  }, [classes, students, invoices]);

  // Daily Register Transactions
  const dailyFilteredPayments = useMemo(() => {
    return payments.filter((p) => !dailyDateFilter || p.payment_date === dailyDateFilter);
  }, [payments, dailyDateFilter]);

  const dailyTotalCollected = useMemo(() => {
    return dailyFilteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [dailyFilteredPayments]);

  const dailyCashTotal = useMemo(() => {
    return dailyFilteredPayments
      .filter((p) => p.payment_method === "CASH")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [dailyFilteredPayments]);

  const dailyMobileTotal = useMemo(() => {
    return dailyFilteredPayments
      .filter((p) => ["BKASH", "NAGAD", "ROCKET", "MOBILE_BANKING"].includes(p.payment_method))
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [dailyFilteredPayments]);

  const dailyBankTotal = useMemo(() => {
    return dailyFilteredPayments
      .filter((p) => ["BANK_TRANSFER", "CARD", "CHEQUE"].includes(p.payment_method))
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }, [dailyFilteredPayments]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all duration-300 ${notification.type === "success" ? "bg-emerald-800" : "bg-rose-700"
            }`}
        >
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00382B] via-[#005a40] to-[#0A7355] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold tracking-wide uppercase border border-white/15">
              <span>বাংলাদেশ স্কুল ও কলেজ ফি ম্যানেজমেন্ট সিস্টেম</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Fee Collection &amp; Accounts Management
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              দ্রুত ফি আদায় কাউন্টার, ১২ মাসের একাডেমিক বেতন, সেশন চার্জ, পরীক্ষা ফি, আইসিটি ল্যাব ও ২-কপি মানি রসিদ ভাউচার
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab("quick_counter")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${activeTab === "quick_counter"
                ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                }`}
            >
              <span>কাউন্টার কালেকশন (Fast Pay)</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateInvoiceModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 transition shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>একক ইনভয়েস তৈরি</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">সর্বমোট ধার্যকৃত ফি</span>
            <Receipt size={17} className="text-emerald-700" />
          </div>
          <div className="text-xl font-black text-slate-900">{fmt(stats.total_billed)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{stats.total_invoices} টি ইনভয়েস</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">সর্বমোট আদায়কৃত</span>
            <Wallet size={17} className="text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">{fmt(stats.total_collected)}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={12} />
            <span>আদায়ের হার {stats.collection_rate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">মোট বকেয়া (Due)</span>
            <Clock size={17} className="text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-600">{fmt(stats.total_due)}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">{stats.unpaid_count + stats.partial_count} টি বকেয়া বিল</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">মেয়াদোত্তীর্ণ ফি</span>
            <AlertCircle size={17} className="text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-600">{fmt(stats.total_overdue)}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">{stats.overdue_count} টি বিল নির্ধারিত সময় পার</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-800 to-teal-900 p-4 rounded-xl text-white shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-1">আজকের মোট কালেকশন</div>
          <div className="text-xl font-black text-white">{fmt(dailyTotalCollected)}</div>
          <div className="text-[10px] text-emerald-200 mt-1 font-medium">নগদ: {fmt(dailyCashTotal)} • মোবাইল: {fmt(dailyMobileTotal)}</div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex border-b border-slate-100 min-w-max">
          <button
            type="button"
            onClick={() => setActiveTab("quick_counter")}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "quick_counter"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <span>১. দ্রুত ফি আদায় কাউন্টার (Quick Counter)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "invoices"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Receipt size={15} />
            <span>২. ইনভয়েস ও বিল খাতা ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("batch_generator")}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "batch_generator"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Layers size={15} />
            <span>৩. শ্রেণিভিত্তিক গণ-ফি তৈরি (Batch Generator)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "categories"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Tag size={15} />
            <span>৪. ফি খাত ও হার নির্ধারণ ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("class_due_register")}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "class_due_register"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <Users size={15} />
            <span>৫. শ্রেণিভিত্তিক বকেয়া তালিকা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("daily_register")}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "daily_register"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
          >
            <FileSpreadsheet size={15} />
            <span>৬. দৈনিক আদায় রেজিস্টার (Cash Book)</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: QUICK COUNTER COLLECTION (দ্রুত ফি আদায় কাউন্টার) */}
      {/* ========================================================= */}
      {activeTab === "quick_counter" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Selection & Profile Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm">শিক্ষার্থী নির্বাচন (Student Selection)</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{counterFilteredStudents.length} জন</span>
              </div>

              {/* Class Filter Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">শ্রেণি (Class)</label>
                <select
                  value={counterSelectedClass}
                  onChange={(e) => setCounterSelectedClass(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="ALL">সকল শ্রেণি (All Classes)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Search Input */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="রোল, নাম বা মোবাইল দিয়ে খুঁজুন..."
                  value={counterSearchText}
                  onChange={(e) => setCounterSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Mini Students List */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-100 rounded-lg p-1.5 bg-slate-50/50">
                {counterFilteredStudents.map((st) => {
                  const isSelected = selectedStudent && String(selectedStudent.id) === String(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStudent(st)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer ${isSelected
                        ? "bg-emerald-800 text-white font-bold shadow-xs"
                        : "hover:bg-slate-100 text-slate-800 font-medium"
                        }`}
                    >
                      <div className="truncate">
                        <div>
                          {[st.name, st.surname].filter(Boolean).join(" ")}
                        </div>
                        <div className={`text-[10px] ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                          রোল: {st.roll || "—"} • {st.class_name || "General"}
                        </div>
                      </div>
                      <ChevronRight size={14} className={isSelected ? "text-emerald-200" : "text-slate-400"} />
                    </button>
                  );
                })}
              </div>

              {/* Selected Student Profile Badge */}
              {selectedStudent && (
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200/90 text-xs space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {selectedStudent.name ? selectedStudent.name[0] : "S"}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {[selectedStudent.name, selectedStudent.surname].filter(Boolean).join(" ")}
                      </h4>
                      <p className="text-[11px] text-emerald-900 font-bold">
                        রোল নং: {selectedStudent.roll || "—"} | আইডি: {selectedStudent.id}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {selectedStudent.class_name || "General"} • {selectedStudent.shift || "প্রভাতী"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200/80 pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">অভিভাবকের নাম</span>
                      <span className="font-semibold">{selectedStudent.parent_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">মোবাইল নম্বর</span>
                      <span className="font-mono font-semibold">{selectedStudent.phone || "—"}</span>
                    </div>
                  </div>

                  <div className="border-t border-emerald-200/80 pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">বর্তমান বকেয়া (Past Dues):</span>
                    <span className={`font-black text-xs ${selectedStudentTotalDue > 0 ? "text-rose-700" : "text-emerald-800"}`}>
                      {selectedStudentTotalDue > 0 ? fmt(selectedStudentTotalDue) : "বকেয়া নেই (Clear)"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Fee Selection, Waiver, Calculator, Payment */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt size={17} className="text-emerald-700" />
                    <span>ফি আদায় বিল ও গণনা (Fee Collection Counter)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">মাসিক বেতন ও নির্ধারিত ফি খাতসমূহ নির্বাচন করুন</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMonths(BANGLA_MONTHS.map((m) => m.key))}
                    className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md hover:bg-emerald-100 transition cursor-pointer"
                  >
                    সব মাস নির্বাচন
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonths([])}
                    className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md hover:bg-slate-200 transition cursor-pointer"
                  >
                    ক্লিয়ার
                  </button>
                </div>
              </div>

              {/* 12-Month Academic Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  মাসিক একাডেমিক বেতন ({fmt(counterTuitionFee)} / মাস)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {BANGLA_MONTHS.map((m) => {
                    const isChecked = selectedMonths.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedMonths(selectedMonths.filter((x) => x !== m.key));
                          } else {
                            setSelectedMonths([...selectedMonths, m.key]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${isChecked
                          ? "bg-emerald-800 text-white border-emerald-900 shadow-sm font-bold"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                      >
                        <div className="text-xs">{m.nameBn}</div>
                        <div className={`text-[10px] mt-0.5 ${isChecked ? "text-emerald-200" : "text-slate-500"}`}>
                          {m.nameEn}
                        </div>
                        {isChecked && (
                          <div className="mt-1 flex items-center justify-center">
                            <Check size={12} className="text-amber-300" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other Institutional Fee Heads Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  অন্যান্য ফি খাত (Other School/College Fees)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {categories
                    .filter((c) => c.code !== "TUIT")
                    .map((cat) => {
                      const isSelected = selectedOtherFeeIds.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${isSelected
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold"
                            : "bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOtherFeeIds([...selectedOtherFeeIds, cat.id]);
                              } else {
                                setSelectedOtherFeeIds(selectedOtherFeeIds.filter((id) => id !== cat.id));
                              }
                            }}
                            className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                          />
                          <div className="truncate">
                            <div className="truncate">{cat.name}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{fmt(cat.default_amount)}</div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Fine, Discount & Payment Method Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                {/* Late Fine */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    বিলম্ব ফি / জরিমানা (Late Fine)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={counterLateFine}
                    onChange={(e) => setCounterLateFine(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Waiver / Concession */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    মওকুফ / ছাড় (Waiver / Discount)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={counterDiscount}
                    onChange={(e) => setCounterDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Waiver Reason */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ছাড়ের কারণ (Waiver Category)
                  </label>
                  <select
                    value={counterWaiverType}
                    onChange={(e) => setCounterWaiverType(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="GENERAL">সাধারণ ছাড় (General)</option>
                    <option value="MERIT">মেধাবৃত্তি (Merit Scholarship)</option>
                    <option value="POOR_FUND">দরিদ্র তহবিল মওকুফ (Poor Fund)</option>
                    <option value="STAFF_CHILD">শিক্ষক/স্টাফ সন্তান (Staff Ward)</option>
                    <option value="SIBLING">সহোদর ভাই/বোন ছাড় (Sibling)</option>
                  </select>
                </div>
              </div>

              {/* Payment Mode & Trx ID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    পরিশোধের মাধ্যম (Payment Mode)
                  </label>
                  <select
                    value={counterPaymentMethod}
                    onChange={(e) => setCounterPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="CASH">নগদ টাকা (Cash Counter)</option>
                    <option value="BKASH">bKash (বিকাশ মার্চেন্ট)</option>
                    <option value="NAGAD">Nagad (নগদ)</option>
                    <option value="ROCKET">Rocket (ডাচ-বাংলা রকেট)</option>
                    <option value="BANK_TRANSFER">ব্যাংক ড্রাফট / চালান (Bank Slip)</option>
                    <option value="CARD">কার্ড / POS (Debit/Credit Card)</option>
                    <option value="CHEQUE">চেক (Cheque Payment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ট্রানজেকশন / রেফারেন্স আইডি
                  </label>
                  <input
                    type="text"
                    value={counterTxnRef}
                    onChange={(e) => setCounterTxnRef(e.target.value)}
                    placeholder="e.g. TRX982736 বা চালান নং"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    মন্তব্য (Counter Remarks)
                  </label>
                  <input
                    type="text"
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    placeholder="প্রয়োজনে বিশেষ নোট লিখুন..."
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Grand Calculator Strip & Collect Action */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span>মাসিক ফি: <strong>{fmt(counterTuitionSubtotal)}</strong></span>
                    <span>অন্যান্য ফি: <strong>{fmt(counterOtherFeesSubtotal)}</strong></span>
                    {counterLateFine > 0 && <span>বিলম্ব: <strong className="text-amber-400">+{fmt(counterLateFine)}</strong></span>}
                    {counterDiscount > 0 && <span>ছাড়: <strong className="text-emerald-400">-{fmt(counterDiscount)}</strong></span>}
                  </div>
                  <div className="text-sm font-normal text-slate-300">
                    সর্বমোট প্রদেয়: <strong className="text-xl text-white font-black">{fmt(counterNetPayable)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">আদায়কৃত টাকা (Paid Now)</span>
                    <input
                      type="number"
                      min="0"
                      value={counterPaidNow}
                      onChange={(e) => setCounterPaidNow(parseFloat(e.target.value) || 0)}
                      className="w-32 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickCounterSubmit}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg cursor-pointer"
                  >
                    <Printer size={16} />
                    <span>ফি আদায় ও রসিদ প্রিন্ট (Collect &amp; Print)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVOICES & BILLS REGISTER (ইনভয়েস ও বিল খাতা)      */}
      {/* ========================================================= */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="রোল, নাম, বা ইনভয়েস নং..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                <option value="ALL">সকল স্ট্যাটাস (All)</option>
                <option value="PAID">পরিশোধিত (Paid)</option>
                <option value="PARTIAL">আংশিক (Partial)</option>
                <option value="UNPAID">বকেয়া (Unpaid)</option>
                <option value="OVERDUE">মেয়াদোত্তীর্ণ (Overdue)</option>
              </select>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                <option value="ALL">সকল শ্রেণি (All Classes)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Fee Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white focus:outline-hidden"
              >
                <option value="ALL">সকল ফি খাত (All Heads)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732] transition shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>নতুন ইনভয়েস তৈরি</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3">ইনভয়েস নং</th>
                    <th className="py-3 px-3">শিক্ষার্থীর বিবরণ</th>
                    <th className="py-3 px-3">শ্রেণি ও রোল</th>
                    <th className="py-3 px-3">ফি বিবরণ ও খাত</th>
                    <th className="py-3 px-3 text-right">নির্ধারিত ফি</th>
                    <th className="py-3 px-3 text-right">আদায়কৃত</th>
                    <th className="py-3 px-3 text-right">বকেয়া</th>
                    <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                    <th className="py-3 px-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        কোন ইনভয়েস পাওয়া যায়নি (No invoices found)
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => {
                      const net = Number(inv.amount || 0) - Number(inv.discount || 0);
                      const paid = Number(inv.paid_amount || 0);
                      const due = Math.max(0, net - paid);

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            #{inv.invoice_no}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">
                              {[inv.student_name, inv.student_surname].filter(Boolean).join(" ") || "Student"}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              আইডি: {inv.student_id} {inv.student_phone ? `• ${inv.student_phone}` : ""}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{inv.class_name || "General"}</div>
                            <div className="text-[10px] text-slate-500">রোল: {inv.student_roll || "—"}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 truncate max-w-[200px]" title={inv.title}>
                              {cleanFeeTitle(inv.title || inv.category_name)}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-slate-500">মেয়াদ: {inv.due_date}</span>
                              {inv.fee_items && inv.fee_items.length > 1 && (
                                <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {inv.fee_items.length}টি খাত (বিস্তারিত)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">{fmt(net)}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">{fmt(paid)}</td>
                          <td className="py-3 px-3 text-right font-bold text-rose-700">{fmt(due)}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : inv.status === "PARTIAL"
                                  ? "bg-amber-100 text-amber-800"
                                  : inv.status === "OVERDUE"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                            >
                              {inv.status === "PAID"
                                ? "পরিশোধিত"
                                : inv.status === "PARTIAL"
                                  ? "আংশিক"
                                  : inv.status === "OVERDUE"
                                    ? "মেয়াদোত্তীর্ণ"
                                    : "বকেয়া"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status !== "PAID" && (
                                <button
                                  type="button"
                                  onClick={() => handleRecordPayment(inv)}
                                  className="p-1.5 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded-md transition cursor-pointer"
                                  title="পেমেন্ট নিন (Collect)"
                                >
                                  <Wallet size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openReceiptFromInvoice(inv)}
                                className="p-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition cursor-pointer"
                                title="বিস্তারিত ইনভয়েস ভাউচার (Details)"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openReceiptFromInvoice(inv)}
                                className="p-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition cursor-pointer"
                                title="মানি রসিদ প্রিন্ট (Print Slip)"
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
              <span>মোট {filteredInvoices.length} টি রেকর্ড (পৃষ্ঠা {currentPage} / {totalPages})</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BATCH FEE GENERATOR (শ্রেণিভিত্তিক গণ-ফি তৈরি)     */}
      {/* ========================================================= */}
      {activeTab === "batch_generator" && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-emerald-700" />
              <span>শ্রেণিভিত্তিক গণ-ফি তৈরি (Batch Monthly Fee Generator)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              সম্পূর্ণ ক্লাসের সকল শিক্ষার্থীর জন্য এক ক্লিকে মাসিক বেতন, পরীক্ষার ফি ও ল্যাব ফি জেনারেট করুন
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                শ্রেণি নির্বাচন (Target Class)
              </label>
              <select
                value={batchClassId}
                onChange={(e) => setBatchClassId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option value="">-- শ্রেণি বাছাই করুন --</option>
                <option value="ALL">সকল শ্রেণি একসাথে (All Enrolled Classes)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                মাস বা সেশন (Target Month / Session)
              </label>
              <input
                type="text"
                value={batchMonth}
                onChange={(e) => setBatchMonth(e.target.value)}
                placeholder="যেমন: নভেম্বর ২০২৬ বা ১ম সাময়িক পরীক্ষা"
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                শিক্ষাবর্ষ (Academic Session)
              </label>
              <input
                type="text"
                value={batchAcademicYear}
                onChange={(e) => setBatchAcademicYear(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                বিল পরিশোধের শেষ তারিখ (Due Date)
              </label>
              <input
                type="date"
                value={batchDueDate}
                onChange={(e) => setBatchDueDate(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Fee Heads Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              জেনারেট করার ফি খাতসমূহ নির্বাচন করুন (Select Fee Heads)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto">
              {categories.map((cat) => {
                const isSelected = batchCategoryIds.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${isSelected
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBatchCategoryIds([...batchCategoryIds, cat.id]);
                        } else {
                          setBatchCategoryIds(batchCategoryIds.filter((id) => id !== cat.id));
                        }
                      }}
                      className="mt-0.5 rounded text-emerald-700"
                    />
                    <div className="truncate">
                      <div>{cat.name}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{fmt(cat.default_amount)}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              disabled={batchGenerating}
              onClick={handleBatchGenerate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#005a40] text-white font-bold text-xs hover:bg-[#004732] transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {batchGenerating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>সকল শিক্ষার্থীর জন্য ইনভয়েস তৈরি করুন (Generate All)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FEE HEADS & RATES (ফি খাত ও হার নির্ধারণ)          */}
      {/* ========================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">বাংলাদেশ স্কুল ও কলেজ ফি তালিকা</h3>
              <p className="text-xs text-slate-500">সকল প্রকার একাডেমিক, সেশন, পরীক্ষা, ল্যাব ও সহশিক্ষা ফি খাত</p>
            </div>
            <button
              type="button"
              onClick={() => setCategoryModal({ open: true, mode: "create" })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732] transition cursor-pointer"
            >
              <Plus size={14} />
              <span>নতুন ফি খাত যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cat.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {cat.frequency}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-2">{cat.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{cat.description || "—"}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
                  <div className="font-black text-slate-900 text-sm">{fmt(cat.default_amount)}</div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCategoryModal({ open: true, mode: "edit", data: cat })}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition"
                      title="Edit Category"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: CLASS-WISE DUE DEFAULTER REGISTER                  */}
      {/* ========================================================= */}
      {activeTab === "class_due_register" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">শ্রেণিভিত্তিক বকেয়া তালিকা ও রিপোর্ট</h3>
              <p className="text-xs text-slate-500">কোন শ্রেণিতে কত টাকা বকেয়া আছে এবং বকেয়াদার শিক্ষার্থীর সংখ্যা</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
            >
              <Printer size={13} />
              <span>বকেয়া শিট প্রিন্ট</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classDueSummary.map((cls) => {
              const rate = cls.total_billed > 0 ? Math.round((cls.total_paid / cls.total_billed) * 100) : 0;
              return (
                <div key={cls.class_name} className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm">{cls.class_name}</h4>
                    <span className="text-[11px] font-semibold text-slate-500">{cls.students_count} জন শিক্ষার্থী</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">মোট ধার্য ফি</span>
                      <span className="font-bold text-slate-800">{fmt(cls.total_billed)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">আদায়কৃত ফি</span>
                      <span className="font-bold text-emerald-700">{fmt(cls.total_paid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">বকেয়া টাকা</span>
                      <span className="font-black text-rose-700">{fmt(cls.total_due)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">বকেয়াদার সংখ্যা</span>
                      <span className="font-bold text-slate-800">{cls.defaulters_count} জন</span>
                    </div>
                  </div>

                  {cls.defaulters_count > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">বকেয়া শিক্ষার্থী তালিকা:</div>
                      <div className="space-y-1 max-h-28 overflow-y-auto text-[11px]">
                        {cls.defaulter_students.map((st, i) => (
                          <div key={i} className="flex justify-between items-center text-slate-700 bg-slate-50 p-1 rounded">
                            <span className="truncate">রোল {st.roll}: {st.name}</span>
                            <span className="font-bold text-rose-700 ml-2">{fmt(st.due)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: DAILY CASH REGISTER (দৈনিক আদায় রেজিস্টার)          */}
      {/* ========================================================= */}
      {activeTab === "daily_register" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">দৈনিক ক্যাশ ও আদায় রেজিস্টার</h3>
              <p className="text-xs text-slate-500">তারিখ অনুযায়ী দৈনিক ক্যাশ বুক ও সকল রসিদের খতিয়ান</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dailyDateFilter}
                onChange={(e) => setDailyDateFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg p-2 font-medium"
              />
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#005a40] text-white rounded-lg hover:bg-[#004732] transition"
              >
                <Printer size={13} />
                <span>প্রিন্ট শিট</span>
              </button>
            </div>
          </div>

          {/* Daily KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">মোট আদায় (Total)</span>
              <span className="text-lg font-black text-slate-900">{fmt(dailyTotalCollected)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">নগদ কাউন্টার (Cash)</span>
              <span className="text-lg font-black text-emerald-700">{fmt(dailyCashTotal)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">মোবাইল ব্যাংকিং (bKash/Nagad)</span>
              <span className="text-lg font-black text-amber-600">{fmt(dailyMobileTotal)}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">ব্যাংক / চালান (Bank)</span>
              <span className="text-lg font-black text-indigo-700">{fmt(dailyBankTotal)}</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">রসিদ নং (Receipt)</th>
                  <th className="py-2.5 px-3">শিক্ষার্থী ও রোল</th>
                  <th className="py-2.5 px-3">শ্রেণি</th>
                  <th className="py-2.5 px-3">ফি বিবরণ</th>
                  <th className="py-2.5 px-3">মাধ্যম (Method)</th>
                  <th className="py-2.5 px-3">রেফারেন্স / TrxID</th>
                  <th className="py-2.5 px-3 text-right">আদায়কৃত টাকা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyFilteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      নির্বাচিত তারিখে কোন পেমেন্ট রেকর্ড নেই
                    </td>
                  </tr>
                ) : (
                  dailyFilteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">#{p.receipt_no}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {[p.student_name, p.student_surname].filter(Boolean).join(" ")}
                        <span className="text-[10px] text-slate-500 block">রোল: {p.student_roll || "—"}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{p.class_name || "General"}</td>
                      <td className="py-2.5 px-3 text-slate-700">{p.invoice_title || "একাডেমিক ফি"}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800 uppercase text-[10px]">
                        {p.payment_method}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {p.transaction_ref || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">{fmt(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECORD PAYMENT FOR AN INVOICE                      */}
      {/* ========================================================= */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wallet size={16} className="text-emerald-700" />
                <span>পেমেন্ট গ্রহণ (Record Payment)</span>
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900">
                {[paymentModalInvoice.student_name, paymentModalInvoice.student_surname].filter(Boolean).join(" ")}
              </div>
              <div className="text-slate-500">
                ইনভয়েস #{paymentModalInvoice.invoice_no} • {paymentModalInvoice.title}
              </div>
              <div className="font-black text-rose-700 pt-1">
                বকেয়া আছে:{" "}
                {fmt(
                  Math.max(
                    0,
                    Number(paymentModalInvoice.amount) -
                    Number(paymentModalInvoice.discount || 0) -
                    Number(paymentModalInvoice.paid_amount || 0)
                  )
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  আদায়কৃত টাকার পরিমাণ (Amount to Pay)
                </label>
                <input
                  type="number"
                  min="1"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  পরিশোধের মাধ্যম (Payment Mode)
                </label>
                <select
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value as PaymentMethod })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CASH">নগদ (Cash)</option>
                  <option value="BKASH">bKash (বিকাশ)</option>
                  <option value="NAGAD">Nagad (নগদ)</option>
                  <option value="ROCKET">Rocket (রকেট)</option>
                  <option value="BANK_TRANSFER">ব্যাংক ড্রাফট (Bank Slip)</option>
                  <option value="CARD">কার্ড (Card)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  ট্রানজেকশন / ব্যাংক রেফারেন্স
                </label>
                <input
                  type="text"
                  value={payForm.transaction_ref}
                  onChange={(e) => setPayForm({ ...payForm, transaction_ref: e.target.value })}
                  placeholder="Optional reference number"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={submitRecordPayment}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732]"
              >
                পেমেন্ট সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE SINGLE INVOICE                              */}
      {/* ========================================================= */}
      {createInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus size={16} className="text-emerald-700" />
                <span>নতুন ফি ইনভয়েস তৈরি (Create Fee Invoice)</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  শিক্ষার্থী নির্বাচন (Student)
                </label>
                <select
                  value={invoiceForm.student_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                >
                  <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      রোল {st.roll || "—"}: {[st.name, st.surname].filter(Boolean).join(" ")} ({st.class_name || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ফি খাত (Category)
                  </label>
                  <select
                    value={invoiceForm.fee_category_id}
                    onChange={(e) => {
                      const catId = Number(e.target.value);
                      const cat = categories.find((c) => c.id === catId);
                      setInvoiceForm({
                        ...invoiceForm,
                        fee_category_id: catId,
                        amount: cat ? cat.default_amount : invoiceForm.amount,
                        title: cat ? cat.name : invoiceForm.title,
                      });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    টাকার পরিমাণ (Amount)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  ইনভয়েস শিরোনাম (Title)
                </label>
                <input
                  type="text"
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  placeholder="e.g. মাসিক বেতন - নভেম্বর ২০২৬"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    মেয়াদ শেষ (Due Date)
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ছাড় / মওকুফ (Discount)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.discount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateInvoiceModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!invoiceForm.student_id) {
                    showToast("error", "শিক্ষার্থী বাছাই করুন");
                    return;
                  }
                  const st = students.find((s) => String(s.id) === String(invoiceForm.student_id));
                  const cat = categories.find((c) => c.id === invoiceForm.fee_category_id);
                  const net = Math.max(0, invoiceForm.amount - invoiceForm.discount);

                  const inv: FeeInvoice = {
                    id: Date.now(),
                    invoice_no: `INV-2026-${Date.now().toString().slice(-4)}`,
                    student_id: String(invoiceForm.student_id),
                    student_name: st?.name,
                    student_surname: st?.surname,
                    student_roll: st?.roll,
                    student_phone: st?.phone,
                    class_name: st?.class_name,
                    parent_id: String((st as any)?.parent_id || (st as any)?.parentId || (st as any)?.parent?.id || ""),
                    parent_name: (st as any)?.parent_name || (st as any)?.parent?.name || "",
                    parent_phone: (st as any)?.parent_phone || (st as any)?.parent?.phone || "",
                    fee_category_id: invoiceForm.fee_category_id,
                    category_name: cat?.name,
                    title: invoiceForm.title || cat?.name || "একাডেমিক ফি",
                    due_date: invoiceForm.due_date,
                    amount: invoiceForm.amount,
                    discount: invoiceForm.discount,
                    paid_amount: 0,
                    net_amount: net,
                    due_amount: net,
                    status: "UNPAID",
                    academic_year: invoiceForm.academic_year,
                    fee_items: [{ name: cleanFeeTitle(invoiceForm.title || cat?.name || "একাডেমিক ফি"), amount: invoiceForm.amount }],
                    created_at: new Date().toISOString(),
                  };

                  const updated = [inv, ...invoices];
                  setInvoices(updated);
                  syncToLocalStorage(updated, payments, categories);
                  setCreateInvoiceModal(false);
                  showToast("success", `ইনভয়েস #${inv.invoice_no} সফলভাবে তৈরি হয়েছে!`);
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732]"
              >
                ইনভয়েস সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CATEGORY                                */}
      {/* ========================================================= */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {categoryModal.mode === "create" ? "নতুন ফি খাত যোগ করুন" : "ফি খাত পরিবর্তন করুন"}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false, mode: "create", data: null })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  খাতের নাম (Fee Head Name)
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. বিজ্ঞানাগার ল্যাব ফি"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    কোড (Short Code)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SCI_LAB"
                    className="w-full p-2 border border-slate-200 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    ডিফল্ট রেট / টাকা
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={categoryForm.default_amount}
                    onChange={(e) => setCategoryForm({ ...categoryForm, default_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  আদায়ের সময়কাল (Frequency)
                </label>
                <select
                  value={categoryForm.frequency}
                  onChange={(e) => setCategoryForm({ ...categoryForm, frequency: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="MONTHLY">মাসিক (Monthly)</option>
                  <option value="TERMLY">সাময়িক / টার্ম (Termly)</option>
                  <option value="ANNUALLY">বাৎসরিক (Annually)</option>
                  <option value="ONE_TIME">এককালীন (One Time)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  সংক্ষিপ্ত বিবরণ (Description)
                </label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="খাত সম্পর্কিত সংক্ষিপ্ত তথ্য..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCategoryModal({ open: false, mode: "create", data: null })}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!categoryForm.name) {
                    showToast("error", "খাতের নাম লিখুন");
                    return;
                  }
                  const newCat: FeeCategory = {
                    id: Date.now(),
                    name: categoryForm.name,
                    code: categoryForm.code || `FEE_${Date.now().toString().slice(-3)}`,
                    default_amount: categoryForm.default_amount,
                    frequency: categoryForm.frequency,
                    status: "ACTIVE",
                    description: categoryForm.description,
                  };
                  const updated = [...categories, newCat];
                  setCategories(updated);
                  syncToLocalStorage(invoices, payments, updated);
                  setCategoryModal({ open: false, mode: "create", data: null });
                  showToast("success", "ফি খাত সফলভাবে যোগ করা হয়েছে!");
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#005a40] text-white hover:bg-[#004732]"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2-PART OFFICIAL BANGLADESH MONEY RECEIPT MODAL            */}
      {/* ========================================================= */}
      <FeeReceiptSlipModal receiptData={receiptData} onClose={() => setReceiptData(null)} />
    </div>
  );
};

export default FeesSection;
