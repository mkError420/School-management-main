import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter,
  GraduationCap,
  Grid,
  Layers,
  List,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import {
  StaffGender,
  StaffMember,
  StaffStats,
  StaffStatus,
  StaffType,
} from "@/types/staff";

const ITEMS_PER_PAGE = 12;

const defaultStaffSeed: StaffMember[] = [
  {
    id: "stf_1",
    staff_no: "STF-T0001",
    name: "John",
    surname: "Doe",
    email: "john@doe.com",
    phone: "1234567890",
    type: "TEACHING",
    designation: "Mathematics Teacher",
    department: "Academic Faculty",
    gender: "MALE",
    blood_type: "A+",
    address: "123 Main St, Springfield",
    salary: 3800,
    joining_date: "2023-01-10",
    status: "ACTIVE",
    qualification: "M.Sc Mathematics, B.Ed",
    notes: "Lead instructor for high school calculus and algebra",
    subjects: [{ id: 1, name: "Math" }],
    classes: [{ id: 1, name: "1A" }],
  },
  {
    id: "stf_2",
    staff_no: "STF-T0002",
    name: "Jane",
    surname: "Doe",
    email: "jane@doe.com",
    phone: "1234567891",
    type: "TEACHING",
    designation: "English Literature Teacher",
    department: "Academic Faculty",
    gender: "FEMALE",
    blood_type: "O+",
    address: "123 Main St, Springfield",
    salary: 3750,
    joining_date: "2023-01-12",
    status: "ACTIVE",
    qualification: "M.A. English, B.Ed",
    notes: "Specializes in modern creative writing and literature",
    subjects: [{ id: 2, name: "English" }],
    classes: [{ id: 2, name: "1B" }],
  },
  {
    id: "stf_3",
    staff_no: "STF-T0003",
    name: "Mike",
    surname: "Geller",
    email: "mike@geller.com",
    phone: "1234567892",
    type: "TEACHING",
    designation: "Physics Teacher",
    department: "Academic Faculty",
    gender: "MALE",
    blood_type: "B+",
    address: "456 Elm St, Springfield",
    salary: 3900,
    joining_date: "2022-09-01",
    status: "ACTIVE",
    qualification: "B.Sc Physics, M.Ed",
    notes: "Supervises senior school science lab experiments",
    subjects: [{ id: 4, name: "Physics" }],
    classes: [{ id: 3, name: "2A" }],
  },
  {
    id: "stf_4",
    staff_no: "STF-A0001",
    name: "Eleanor",
    surname: "Vance",
    email: "eleanor.admin@school.edu",
    phone: "+1 555-0201",
    type: "ADMINISTRATIVE",
    designation: "Head of Administration",
    department: "Administration",
    gender: "FEMALE",
    blood_type: "A+",
    address: "742 Evergreen Terrace, Suite 10",
    salary: 4500,
    joining_date: "2021-06-15",
    status: "ACTIVE",
    qualification: "MBA - Educational Leadership",
    notes: "Oversees campus administration, accreditation and staff operations",
  },
  {
    id: "stf_5",
    staff_no: "STF-F0002",
    name: "Marcus",
    surname: "Sterling",
    email: "marcus.finance@school.edu",
    phone: "+1 555-0202",
    type: "NON_TEACHING",
    designation: "Senior Bursar & Accountant",
    department: "Finance & Accounts",
    gender: "MALE",
    blood_type: "B+",
    address: "12 Financial District Ave",
    salary: 4200,
    joining_date: "2022-03-01",
    status: "ACTIVE",
    qualification: "CPA, B.Sc Accounting",
    notes: "Manages student tuition fee records, budget planning and payroll",
  },
  {
    id: "stf_6",
    staff_no: "STF-L0003",
    name: "Beatrice",
    surname: "Holloway",
    email: "beatrice.lib@school.edu",
    phone: "+1 555-0203",
    type: "SUPPORT",
    designation: "Chief Librarian",
    department: "Library & Media Resources",
    gender: "FEMALE",
    blood_type: "O+",
    address: "88 Oakwood Lane",
    salary: 3100,
    joining_date: "2023-08-20",
    status: "ACTIVE",
    qualification: "M.Sc Library & Information Science",
    notes: "Curates reading curriculum, book lending inventory and e-library",
  },
  {
    id: "stf_7",
    staff_no: "STF-I0004",
    name: "David",
    surname: "Kovacs",
    email: "david.it@school.edu",
    phone: "+1 555-0204",
    type: "SUPPORT",
    designation: "IT Systems Administrator",
    department: "IT & Computer Lab",
    gender: "MALE",
    blood_type: "AB+",
    address: "304 Tech Boulevard",
    salary: 3900,
    joining_date: "2024-02-10",
    status: "ACTIVE",
    qualification: "B.Sc Computer Engineering, CCNA",
    notes: "Manages campus Wi-Fi, computer labs, student portals and hardware",
  },
  {
    id: "stf_8",
    staff_no: "STF-H0005",
    name: "Clara",
    surname: "Oswald",
    email: "clara.health@school.edu",
    phone: "+1 555-0205",
    type: "SUPPORT",
    designation: "School Nurse & First Aid Lead",
    department: "Health & Medical Clinic",
    gender: "FEMALE",
    blood_type: "A-",
    address: "19 Meadowbrook Rd",
    salary: 3200,
    joining_date: "2024-01-08",
    status: "ACTIVE",
    qualification: "Registered Nurse (RN), Pediatric First Aid",
    notes: "Attends to daily student healthcare, medical records and wellness checks",
  },
];

const emptyStaffForm = {
  name: "",
  surname: "",
  type: "TEACHING" as StaffType,
  designation: "Academic Teacher",
  department: "Academic Faculty",
  email: "",
  phone: "",
  gender: "MALE" as StaffGender,
  blood_type: "O+",
  address: "",
  salary: 3500,
  joining_date: new Date().toISOString().split("T")[0],
  status: "ACTIVE" as StaffStatus,
  qualification: "",
  notes: "",
  // Teacher-specific fields
  username: "",
  password: "",
  subject_ids: [] as number[],
  class_ids: [] as number[],
};

const StaffSection: React.FC = () => {
  const { siteName, currencySymbol: cs } = useSiteSettings();
  const fmt = (n: number | string) =>
    `${cs}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Data states
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Filters & display
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editItem, setEditItem] = useState<StaffMember | null>(null);
  const [editFormData, setEditFormData] = useState(emptyStaffForm);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [detailsItem, setDetailsItem] = useState<StaffMember | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<StaffMember | null>(null);

  // Edit image upload handlers
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image file (JPG, PNG, or WebP).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must not exceed 5 MB.", "error");
      return;
    }

    setEditImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEditImagePreview(objectUrl);
  };

  const handleResetEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview(editItem?.img || null);
  };

  const closeEditModal = () => {
    setEditItem(null);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // Form
  const [formData, setFormData] = useState(emptyStaffForm);
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch staff data and auxiliary subjects/classes
  const loadStaffData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    // 1. Fetch auxiliary subjects & classes for teacher assignments
    try {
      const [subsRes, clsRes] = await Promise.all([
        api.getAll("subjects", { limit: 100 }),
        api.getAll("classes", { limit: 100 }),
      ]);
      if (subsRes.success && Array.isArray(subsRes.data?.subjects)) {
        setSubjects(subsRes.data.subjects);
      }
      if (clsRes.success && Array.isArray(clsRes.data?.classes)) {
        setClasses(clsRes.data.classes);
      }
    } catch {}

    // 2. Fetch staff list
    try {
      const res = await api.getAll("staff", { limit: 200 });
      let loadedStaff: StaffMember[] = [];

      if (res.success && Array.isArray(res.data?.staff)) {
        loadedStaff = res.data.staff;
      }

      // Check localStorage if backend returned empty
      if (loadedStaff.length === 0) {
        const stored = localStorage.getItem("mk_school_staff_list");
        if (stored) {
          try {
            loadedStaff = JSON.parse(stored);
          } catch {}
        }
      }

      // Also pull current teachers to make sure ALL teachers are represented in the staff directory!
      try {
        const teachersRes = await api.getAll("teachers", { limit: 100 });
        if (teachersRes.success && Array.isArray(teachersRes.data?.teachers)) {
          const apiTeachers = teachersRes.data.teachers;
          apiTeachers.forEach((t: any, idx: number) => {
            const exists = loadedStaff.some((s) => s.teacher_id === t.id || s.email === t.email);
            if (!exists) {
              loadedStaff.push({
                id: `stf_t_${t.id}`,
                staff_no: `STF-T${String(200 + idx).padStart(4, "0")}`,
                teacher_id: t.id,
                name: t.name,
                surname: t.surname,
                email: t.email,
                phone: t.phone,
                type: "TEACHING",
                designation: "Academic Teacher",
                department: "Academic Faculty",
                gender: t.sex === "FEMALE" ? "FEMALE" : "MALE",
                blood_type: t.blood_type || "O+",
                address: t.address || "Campus Residence",
                salary: 3800,
                joining_date: "2023-01-10",
                status: "ACTIVE",
                qualification: "Bachelor of Education (B.Ed)",
                img: t.img,
                subjects: t.subjects || [],
                classes: t.classes || [],
              });
            }
          });
        }
      } catch {}

      // If still empty (first run), initialize with default seed
      if (loadedStaff.length === 0) {
        loadedStaff = defaultStaffSeed;
        localStorage.setItem("mk_school_staff_list", JSON.stringify(loadedStaff));
      }

      setStaff(loadedStaff);
    } catch {
      // Local fallback
      const stored = localStorage.getItem("mk_school_staff_list");
      if (stored) {
        try {
          setStaff(JSON.parse(stored));
        } catch {
          setStaff(defaultStaffSeed);
        }
      } else {
        setStaff(defaultStaffSeed);
      }
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStaffData();
  }, [loadStaffData]);

  // Compute live statistics
  const stats: StaffStats = useMemo(() => {
    const total_staff = staff.length;
    const teaching_count = staff.filter((s) => s.type === "TEACHING").length;
    const non_teaching_count = staff.filter((s) => s.type === "NON_TEACHING").length;
    const administrative_count = staff.filter((s) => s.type === "ADMINISTRATIVE").length;
    const support_count = staff.filter((s) => s.type === "SUPPORT").length;
    const active_count = staff.filter((s) => s.status === "ACTIVE").length;
    const on_leave_count = staff.filter((s) => s.status === "ON_LEAVE").length;
    const total_monthly_payroll = staff.reduce((acc, s) => acc + Number(s.salary || 0), 0);

    return {
      total_staff,
      teaching_count,
      non_teaching_count,
      administrative_count,
      support_count,
      active_count,
      on_leave_count,
      total_monthly_payroll,
    };
  }, [staff]);

  // Unique departments list for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [staff]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (typeFilter !== "ALL" && s.type !== typeFilter) return false;
      if (deptFilter !== "ALL" && s.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = `${s.name} ${s.surname}`.toLowerCase().includes(q);
        const matchesNo = s.staff_no.toLowerCase().includes(q);
        const matchesEmail = (s.email || "").toLowerCase().includes(q);
        const matchesPhone = (s.phone || "").toLowerCase().includes(q);
        const matchesDesig = (s.designation || "").toLowerCase().includes(q);
        if (!matchesName && !matchesNo && !matchesEmail && !matchesPhone && !matchesDesig) return false;
      }
      return true;
    });
  }, [staff, typeFilter, deptFilter, statusFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStaff, page]);

  // Handle Create Staff / Teacher
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.surname.trim()) {
      showToast("First name and surname are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        type: formData.type,
        designation: formData.designation.trim() || (formData.type === "TEACHING" ? "Teacher" : "Staff Member"),
        department: formData.department.trim() || (formData.type === "TEACHING" ? "Academic Faculty" : "Operations"),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        gender: formData.gender,
        blood_type: formData.blood_type,
        address: formData.address.trim() || "Campus Staff Residence",
        salary: Number(formData.salary || 0),
        joining_date: formData.joining_date,
        status: formData.status,
        qualification: formData.qualification.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        // Teacher specific fields
        username: formData.username.trim() || undefined,
        password: formData.password || undefined,
        subject_ids: formData.subject_ids,
        class_ids: formData.class_ids,
      };

      const res = await api.create("staff", payload);
      let newStaffItem: StaffMember;

      if (res.success && res.data) {
        newStaffItem = res.data;
      } else {
        // Fallback create
        const prefix = formData.type === "TEACHING" ? "STF-T" : formData.type === "ADMINISTRATIVE" ? "STF-A" : "STF-S";
        const newId = `stf_${Date.now()}`;
        const newNo = `${prefix}${String(staff.length + 1).padStart(4, "0")}`;
        newStaffItem = {
          ...payload,
          id: newId,
          staff_no: newNo,
          subjects: subjects.filter((s) => formData.subject_ids.includes(s.id)),
          classes: classes.filter((c) => formData.class_ids.includes(c.id)),
        } as StaffMember;
      }

      const updated = [newStaffItem, ...staff];
      setStaff(updated);
      localStorage.setItem("mk_school_staff_list", JSON.stringify(updated));

      setCreateModalOpen(false);
      setFormData(emptyStaffForm);
      showToast(
        formData.type === "TEACHING"
          ? "Teacher added successfully to Staff and Academic Faculty!"
          : "Staff member added successfully!",
        "success"
      );
    } catch {
      showToast("Unable to save staff member. Please check server.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal with full profile state
  const openEditModal = (item: StaffMember) => {
    setEditItem(item);
    setEditFormData({
      name: item.name || "",
      surname: item.surname || "",
      type: item.type || "TEACHING",
      designation: item.designation || (item.type === "TEACHING" ? "Academic Teacher" : "Staff Member"),
      department: item.department || (item.type === "TEACHING" ? "Academic Faculty" : "Operations"),
      email: item.email || "",
      phone: item.phone || "",
      gender: (item.gender || "MALE") as StaffGender,
      blood_type: item.blood_type || "O+",
      address: item.address || "",
      salary: Number(item.salary || 0),
      joining_date: item.joining_date || new Date().toISOString().split("T")[0],
      status: (item.status || "ACTIVE") as StaffStatus,
      qualification: item.qualification || "",
      notes: item.notes || "",
      username: (item as any).username || "",
      password: "",
      subject_ids: item.subjects ? item.subjects.map((s) => s.id) : [],
      class_ids: item.classes ? item.classes.map((c) => c.id) : [],
    });
    setEditImageFile(null);
    setEditImagePreview(item.img || null);
    setShowEditPassword(false);
  };

  // Handle Edit Staff (full function with optional photo upload)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    if (!editFormData.name.trim() || !editFormData.surname.trim()) {
      showToast("First name and surname are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: editFormData.name.trim(),
        surname: editFormData.surname.trim(),
        type: editFormData.type,
        designation: editFormData.designation.trim() || (editFormData.type === "TEACHING" ? "Academic Teacher" : "Staff Member"),
        department: editFormData.department.trim() || (editFormData.type === "TEACHING" ? "Academic Faculty" : "Operations"),
        email: editFormData.email.trim() || undefined,
        phone: editFormData.phone.trim() || undefined,
        gender: editFormData.gender,
        blood_type: editFormData.blood_type,
        address: editFormData.address.trim() || undefined,
        salary: Number(editFormData.salary || 0),
        joining_date: editFormData.joining_date,
        status: editFormData.status,
        qualification: editFormData.qualification.trim() || undefined,
        notes: editFormData.notes.trim() || undefined,
      };

      if (editFormData.type === "TEACHING") {
        if (editFormData.username.trim()) payload.username = editFormData.username.trim();
        if (editFormData.password.trim()) payload.password = editFormData.password.trim();
        payload.subject_ids = editFormData.subject_ids;
        payload.class_ids = editFormData.class_ids;
      }

      let res: any;
      if (editImageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            if (Array.isArray(v)) {
              fd.append(k, JSON.stringify(v));
            } else {
              fd.append(k, String(v));
            }
          }
        });
        fd.append("img", editImageFile, editImageFile.name);
        res = await api.update("staff", editItem.id, fd);
      } else {
        res = await api.update("staff", editItem.id, payload);
      }

      const assignedSubjects = subjects.filter((s) => editFormData.subject_ids.includes(s.id));
      const assignedClasses = classes.filter((c) => editFormData.class_ids.includes(c.id));

      const updated = staff.map((s) =>
        s.id === editItem.id
          ? {
              ...s,
              ...payload,
              subjects: assignedSubjects,
              classes: assignedClasses,
              ...(res?.data ? res.data : {}),
            }
          : s
      );
      setStaff(updated);
      localStorage.setItem("mk_school_staff_list", JSON.stringify(updated));

      closeEditModal();
      showToast("Staff profile updated successfully!", "success");
    } catch {
      showToast("Failed to update staff record.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async () => {
    if (!deleteConfirmItem) return;

    try {
      await api.delete("staff", deleteConfirmItem.id);
      const updated = staff.filter((s) => s.id !== deleteConfirmItem.id);
      setStaff(updated);
      localStorage.setItem("mk_school_staff_list", JSON.stringify(updated));

      setDeleteConfirmItem(null);
      showToast("Staff member removed from directory.", "success");
    } catch {
      showToast("Unable to delete staff record.", "error");
    }
  };

  // Export Staff Directory to CSV
  const handleExportCSV = () => {
    const headers = ["Staff ID", "Full Name", "Type", "Designation", "Department", "Email", "Phone", "Salary", "Joining Date", "Status", "Qualifications"];
    const rows = filteredStaff.map((s) => [
      `"${s.staff_no}"`,
      `"${s.name} ${s.surname}"`,
      `"${s.type}"`,
      `"${s.designation.replace(/"/g, '""')}"`,
      `"${s.department.replace(/"/g, '""')}"`,
      `"${s.email || ""}"`,
      `"${s.phone || ""}"`,
      s.salary,
      `"${s.joining_date || ""}"`,
      `"${s.status}"`,
      `"${(s.qualification || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `School_Staff_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: StaffStatus) => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 size={11} /> Active
        </span>
      );
    }
    if (status === "ON_LEAVE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <Clock size={11} /> On Leave
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
        <X size={11} /> Inactive
      </span>
    );
  };

  const getTypeBadge = (type: StaffType) => {
    if (type === "TEACHING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#707E94]/10 text-[#707E94] border border-[#707E94]/30 dark:bg-[#707E94]/20 dark:text-[#a4b3c7] dark:border-[#707E94]/40">
          <GraduationCap size={11} /> Teacher
        </span>
      );
    }
    if (type === "ADMINISTRATIVE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
          <Shield size={11} /> Admin
        </span>
      );
    }
    if (type === "SUPPORT") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
          <Briefcase size={11} /> Support
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
        <Building2 size={11} /> Operational
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold border transition ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* 1. HEADER & QUICK ACTIONS */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#707E94] to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Staff & Faculty Directory
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Manage teaching faculty, administrative personnel, and support staff across all departments
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => void loadStaffData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium transition"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition shadow-sm"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => {
                setFormData(emptyStaffForm);
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D32F45] hover:bg-[#be2035] text-white text-xs font-semibold transition shadow-sm shadow-purple-600/20"
            >
              <UserPlus size={15} />
              <span>Add Staff / Teacher</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Staff
            </span>
            <div className="p-2 rounded-xl bg-[#707E94]/10 text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7]">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-2">
            {loading ? "..." : stats.total_staff}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Across {departmentsList.length || 4} Departments
          </div>
        </div>

        {/* Teaching Faculty (Teachers) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707E94] dark:text-[#a4b3c7]">
              Teachers (Faculty)
            </span>
            <div className="p-2 rounded-xl bg-[#707E94]/10 text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7]">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#707E94] dark:text-[#a4b3c7] mt-2">
            {loading ? "..." : stats.teaching_count}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Academic Instructors
          </div>
        </div>

        {/* Non-Teaching & Support */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Non-Teaching & Ops
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-2">
            {loading ? "..." : stats.non_teaching_count + stats.support_count + stats.administrative_count}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Admin, Finance, IT & Clinic
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active on Duty
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {loading ? "..." : stats.active_count}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {stats.on_leave_count} On Official Leave
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Monthly Payroll
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-2">
            {loading ? "..." : fmt(stats.total_monthly_payroll)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Estimated Monthly Salary Cost
          </div>
        </div>
      </div>

      {/* 3. TABS / FILTER BAR */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm space-y-4">
        {/* Quick Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => {
              setTypeFilter("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl transition ${
              typeFilter === "ALL"
                ? "bg-[#D32F45] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            All Staff ({staff.length})
          </button>

          <button
            onClick={() => {
              setTypeFilter("TEACHING");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              typeFilter === "TEACHING"
                ? "bg-[#D32F45] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <GraduationCap size={14} />
            <span>Teachers Only ({stats.teaching_count})</span>
          </button>

          <button
            onClick={() => {
              setTypeFilter("ADMINISTRATIVE");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              typeFilter === "ADMINISTRATIVE"
                ? "bg-[#D32F45] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <Shield size={14} />
            <span>Administrators ({stats.administrative_count})</span>
          </button>

          <button
            onClick={() => {
              setTypeFilter("NON_TEACHING");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              typeFilter === "NON_TEACHING"
                ? "bg-[#D32F45] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <Briefcase size={14} />
            <span>Operations & Finance ({stats.non_teaching_count})</span>
          </button>

          <button
            onClick={() => {
              setTypeFilter("SUPPORT");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              typeFilter === "SUPPORT"
                ? "bg-[#D32F45] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <Building2 size={14} />
            <span>Support & Services ({stats.support_count})</span>
          </button>
        </div>

        {/* Detailed Search & Select Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, designation, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Department Filter */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5">
              <span className="text-gray-400 mr-2">Dept:</span>
              <select
                aria-label="Filter by Department"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-800 dark:text-gray-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-gray-800">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d} className="dark:bg-gray-800">{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5">
              <span className="text-gray-400 mr-2">Status:</span>
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-gray-800 dark:text-gray-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-gray-800">All Statuses</option>
                <option value="ACTIVE" className="dark:bg-gray-800">Active</option>
                <option value="ON_LEAVE" className="dark:bg-gray-800">On Leave</option>
                <option value="INACTIVE" className="dark:bg-gray-800">Inactive</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "table" ? "bg-white dark:bg-gray-800 text-[#707E94] shadow-sm" : "text-gray-400"
                }`}
                title="Table view"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "cards" ? "bg-white dark:bg-gray-800 text-[#707E94] shadow-sm" : "text-gray-400"
                }`}
                title="Card grid view"
              >
                <Grid size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN STAFF LISTING */}
      {viewMode === "table" ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Designation & Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.img ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${item.name}+${item.surname}`
                              )}&background=8b5cf6&color=fff`
                            }
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-[#707E94]/30 dark:border-[#707E94]/40"
                          />
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              <span>{item.name} {item.surname}</span>
                              {item.type === "TEACHING" && (
                                <span title="Teaching Faculty">
                                  <GraduationCap size={13} className="text-[#707E94] dark:text-[#a4b3c7]" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              Joined {item.joining_date || "2023"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Staff ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-gray-600 dark:text-gray-400">
                        {item.staff_no}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {item.designation}
                        </div>
                        <div className="mt-0.5">{getTypeBadge(item.type)}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 font-medium">
                        {item.department}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-gray-500 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail size={12} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{item.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Phone size={12} className="text-gray-400 shrink-0" />
                          <span>{item.phone || "—"}</span>
                        </div>
                      </td>

                      {/* Salary */}
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">
                        {fmt(item.salary)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setDetailsItem(item)}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 dark:text-sky-300 transition"
                            title="View Staff Profile"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-[#707E94]/10 hover:bg-[#707E94]/15 text-[#707E94] dark:bg-[#707E94]/20 dark:hover:bg-[#707E94]/60 dark:text-[#a4b3c7] transition"
                            title="Edit Staff Member"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmItem(item)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredStaff.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filteredStaff.length)} of {filteredStaff.length} staff
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-semibold text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedStaff.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <img
                    src={
                      item.img ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${item.name}+${item.surname}`
                      )}&background=8b5cf6&color=fff`
                    }
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#707E94]/30 dark:border-[#707E94]/40 shadow-sm"
                  />
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    {item.name} {item.surname}
                  </h3>
                  <p className="text-xs text-[#707E94] dark:text-[#a4b3c7] font-medium">
                    {item.designation}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                    {item.staff_no} • {item.department}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{item.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{item.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins size={13} className="text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {fmt(item.salary)}/mo
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <div>{getTypeBadge(item.type)}</div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDetailsItem(item)}
                    className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg bg-[#707E94]/10 text-[#707E94] hover:bg-[#707E94]/15 transition"
                    title="Edit Staff Member"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD STAFF / TEACHER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#707E94]/15 dark:bg-[#707E94]/20 text-[#707E94] dark:text-[#a4b3c7]">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    Add New Staff / Teacher
                  </h3>
                  <p className="text-xs text-gray-500">
                    Register a new faculty or administrative employee
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 my-4 text-xs">
              {/* Staff Type Selector */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Staff Role & Classification *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "TEACHING", label: "Teacher / Faculty", icon: GraduationCap },
                    { value: "ADMINISTRATIVE", label: "Administrator", icon: Shield },
                    { value: "NON_TEACHING", label: "Operations / Finance", icon: Briefcase },
                    { value: "SUPPORT", label: "Support / Clinic / Lab", icon: Building2 },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            type: opt.value as StaffType,
                            designation: opt.value === "TEACHING" ? "Academic Teacher" : formData.designation,
                            department: opt.value === "TEACHING" ? "Academic Faculty" : formData.department,
                          });
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                          formData.type === opt.value
                            ? "bg-[#707E94]/10 border-[#707E94] text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7] dark:border-[#707E94] shadow-sm font-bold"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {formData.type === "TEACHING" && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#707E94]/10 dark:bg-[#707E94]/20 border border-[#707E94]/30 dark:border-[#707E94]/40 text-[#707E94] dark:text-[#a4b3c7] text-[11px] flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0" />
                    <span>
                      Adding as a <strong>Teacher</strong> will automatically create their teaching profile, enable subject assignments, and add them to the Teachers section.
                    </span>
                  </div>
                )}
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Surname / Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miller"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
              </div>

              {/* Contact & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0123"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
              </div>

              {/* Role Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Title / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Math Teacher, Bursar, Nurse"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30 cursor-pointer"
                  >
                    <option value="Academic Faculty">Academic Faculty</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="IT & Computer Lab">IT & Computer Lab</option>
                    <option value="Library & Media Resources">Library & Media Resources</option>
                    <option value="Health & Medical Clinic">Health & Medical Clinic</option>
                    <option value="Safety & Security">Safety & Security</option>
                    <option value="Facilities & Maintenance">Facilities & Maintenance</option>
                    <option value="Transportation">Transportation</option>
                  </select>
                </div>
              </div>

              {/* Teacher-Specific Fields (Subjects & Credentials) */}
              {formData.type === "TEACHING" && (
                <div className="p-3.5 rounded-xl bg-[#707E94]/10 dark:bg-[#707E94]/20 border border-[#707E94]/20 dark:border-[#707E94]/40 space-y-3">
                  <h4 className="font-bold text-[#707E94] dark:text-[#a4b3c7] text-xs flex items-center gap-1.5">
                    <GraduationCap size={15} /> Teacher Academic Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Portal Login Username
                      </label>
                      <input
                        type="text"
                        placeholder="Auto-generated if empty"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Initial Portal Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Default: teacher123"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-1.5 pr-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Assign Subjects */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Subjects
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.map((sub) => {
                        const isSelected = formData.subject_ids.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? formData.subject_ids.filter((id) => id !== sub.id)
                                : [...formData.subject_ids, sub.id];
                              setFormData({ ...formData, subject_ids: next });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              isSelected
                                ? "bg-[#D32F45] text-white border-[#707E94]"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assign Classes */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Teaching Classes
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {classes.map((cls) => {
                        const isSelected = formData.class_ids.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? formData.class_ids.filter((id) => id !== cls.id)
                                : [...formData.class_ids, cls.id];
                              setFormData({ ...formData, class_ids: next });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              isSelected
                                ? "bg-[#D32F45] text-white border-[#707E94]"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            Class {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Salary, Joining Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Salary ({cs})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duty Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30 cursor-pointer"
                  >
                    <option value="ACTIVE">Active Duty</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Gender, Blood Type, Qualifications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as StaffGender })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Qualifications / Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc, B.Ed, CPA"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Campus Residence"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Internal notes or responsibilities..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#D32F45] hover:bg-[#be2035] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  <span>{formData.type === "TEACHING" ? "Save & Create Teacher" : "Save Staff Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT STAFF MODAL */}
      {editItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#707E94]/15 dark:bg-[#707E94]/20 text-[#707E94] dark:text-[#a4b3c7]">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    Edit Staff Member ({editItem.staff_no})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Update staff classification, credentials, compensation, and academic assignments.
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 my-4 text-xs">
              {/* Photo Upload Section */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 flex flex-col sm:flex-row items-center gap-4">
                {/* Profile Photo Preview */}
                <div className="relative group shrink-0">
                  <img
                    src={
                      editImagePreview ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${editFormData.name || "Staff"}+${editFormData.surname || "Member"}`
                      )}&background=707E94&color=fff`
                    }
                    alt="Staff Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-gray-700 shadow-md ring-2 ring-[#707E94]/25"
                  />
                  <label
                    htmlFor="edit-staff-photo-input"
                    className="absolute inset-0 bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[10px] font-semibold gap-1 backdrop-blur-[1px]"
                    title="Click to change photo"
                  >
                    <Camera size={16} />
                    <span>Change</span>
                  </label>
                </div>

                {/* Upload Controls */}
                <div className="flex-1 w-full text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Profile Photograph
                    </span>
                    {editImageFile && (
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        New photo ready to save
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      id="edit-staff-photo-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleEditImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-staff-photo-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#707E94] hover:bg-[#5e6b7f] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
                    >
                      <Upload size={14} />
                      <span>{editImageFile ? "Change Selected Photo" : "Upload New Photo"}</span>
                    </label>

                    {editImageFile && (
                      <button
                        type="button"
                        onClick={handleResetEditImage}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium transition"
                        title="Cancel new selection and revert"
                      >
                        <X size={13} />
                        <span>Revert</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {editImageFile ? (
                      <span className="truncate block font-medium text-gray-700 dark:text-gray-300">
                        File: {editImageFile.name} ({(editImageFile.size / 1024).toFixed(0)} KB)
                      </span>
                    ) : (
                      "Supports JPG, PNG, or WebP up to 5 MB. Updates directory and linked faculty profile."
                    )}
                  </p>
                </div>
              </div>

              {/* Staff Type Selector */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Staff Role & Classification *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "TEACHING", label: "Teacher / Faculty", icon: GraduationCap },
                    { value: "ADMINISTRATIVE", label: "Administrator", icon: Shield },
                    { value: "NON_TEACHING", label: "Operations / Finance", icon: Briefcase },
                    { value: "SUPPORT", label: "Support / Clinic / Lab", icon: Building2 },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            type: opt.value as StaffType,
                            designation: opt.value === "TEACHING" ? (editFormData.designation === "Staff Member" ? "Academic Teacher" : editFormData.designation) : editFormData.designation,
                            department: opt.value === "TEACHING" ? (editFormData.department === "Operations" ? "Academic Faculty" : editFormData.department) : editFormData.department,
                          });
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                          editFormData.type === opt.value
                            ? "bg-[#707E94]/10 border-[#707E94] text-[#707E94] dark:bg-[#707E94]/20 dark:text-[#a4b3c7] dark:border-[#707E94] shadow-sm font-bold"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {editFormData.type === "TEACHING" && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#707E94]/10 dark:bg-[#707E94]/20 border border-[#707E94]/30 dark:border-[#707E94]/40 text-[#707E94] dark:text-[#a4b3c7] text-[11px] flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0" />
                    <span>
                      Teaching faculty profile: enables teacher portal access, subject assignments, and links directly to the Teachers section.
                    </span>
                  </div>
                )}
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Surname / Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.surname}
                    onChange={(e) => setEditFormData({ ...editFormData, surname: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
              </div>

              {/* Contact & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@school.edu"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0123"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
              </div>

              {/* Role Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Title / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30 cursor-pointer"
                  >
                    <option value="Academic Faculty">Academic Faculty</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="IT & Computer Lab">IT & Computer Lab</option>
                    <option value="Library & Media Resources">Library & Media Resources</option>
                    <option value="Health & Medical Clinic">Health & Medical Clinic</option>
                    <option value="Safety & Security">Safety & Security</option>
                    <option value="Facilities & Maintenance">Facilities & Maintenance</option>
                    <option value="Transportation">Transportation</option>
                  </select>
                </div>
              </div>

              {/* Teacher-Specific Fields (Subjects & Credentials) */}
              {editFormData.type === "TEACHING" && (
                <div className="p-3.5 rounded-xl bg-[#707E94]/10 dark:bg-[#707E94]/20 border border-[#707E94]/20 dark:border-[#707E94]/40 space-y-3">
                  <h4 className="font-bold text-[#707E94] dark:text-[#a4b3c7] text-xs flex items-center gap-1.5">
                    <GraduationCap size={15} /> Teacher Academic Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Portal Login Username
                      </label>
                      <input
                        type="text"
                        placeholder="Username"
                        value={editFormData.username}
                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Portal Password <span className="text-[10px] text-gray-400 font-normal">(leave blank to keep unchanged)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showEditPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                          className="w-full px-3 py-1.5 pr-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowEditPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          aria-label={showEditPassword ? "Hide password" : "Show password"}
                        >
                          {showEditPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Assign Subjects */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Subjects
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {subjects.map((sub) => {
                        const isSelected = editFormData.subject_ids.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? editFormData.subject_ids.filter((id) => id !== sub.id)
                                : [...editFormData.subject_ids, sub.id];
                              setEditFormData({ ...editFormData, subject_ids: next });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              isSelected
                                ? "bg-[#D32F45] text-white border-[#707E94]"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assign Classes */}
                  <div>
                    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Teaching Classes
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {classes.map((cls) => {
                        const isSelected = editFormData.class_ids.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? editFormData.class_ids.filter((id) => id !== cls.id)
                                : [...editFormData.class_ids, cls.id];
                              setEditFormData({ ...editFormData, class_ids: next });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                              isSelected
                                ? "bg-[#D32F45] text-white border-[#707E94]"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            Class {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Salary, Joining Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Salary ({cs})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.salary}
                    onChange={(e) => setEditFormData({ ...editFormData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.joining_date}
                    onChange={(e) => setEditFormData({ ...editFormData, joining_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Duty Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as StaffStatus })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#707E94]/30 cursor-pointer"
                  >
                    <option value="ACTIVE">Active Duty</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Gender, Blood Type, Qualifications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as StaffGender })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={editFormData.blood_type}
                    onChange={(e) => setEditFormData({ ...editFormData, blood_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Qualifications / Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. M.Sc, B.Ed, CPA"
                    value={editFormData.qualification}
                    onChange={(e) => setEditFormData({ ...editFormData, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Campus Residence"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Internal notes or responsibilities..."
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#D32F45] hover:bg-[#be2035] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. VIEW DETAILS MODAL */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-400 font-mono">STAFF PROFILE</span>
              <button
                onClick={() => setDetailsItem(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={
                  detailsItem.img ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${detailsItem.name}+${detailsItem.surname}`
                  )}&background=8b5cf6&color=fff`
                }
                alt=""
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#707E94]/30 dark:border-[#707E94]/40"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                    {detailsItem.name} {detailsItem.surname}
                  </h3>
                  {getStatusBadge(detailsItem.status)}
                </div>
                <p className="text-xs font-semibold text-[#707E94] dark:text-[#a4b3c7]">
                  {detailsItem.designation}
                </p>
                <p className="text-[11px] text-gray-400 font-mono">
                  {detailsItem.staff_no} • {detailsItem.department}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Staff Classification:</span>
                <span className="font-semibold">{getTypeBadge(detailsItem.type)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Email:</span>
                <span className="font-semibold">{detailsItem.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Phone:</span>
                <span className="font-semibold">{detailsItem.phone || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Monthly Compensation:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(detailsItem.salary)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Joined Campus:</span>
                <span className="font-mono">{detailsItem.joining_date || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Qualifications:</span>
                <span className="font-semibold">{detailsItem.qualification || "Educational Degree"}</span>
              </div>
              {detailsItem.type === "TEACHING" && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Teacher Profile:</span>
                  <Link
                    to={detailsItem.teacher_id ? `/list/teachers/${detailsItem.teacher_id}` : "/list/teachers"}
                    className="text-[#707E94] dark:text-[#a4b3c7] hover:underline font-bold"
                  >
                    Open Teacher Page &rarr;
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setDetailsItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D32F45] hover:bg-[#be2035] text-white text-xs font-semibold shadow-sm transition"
              >
                <Printer size={14} />
                <span>Print Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                Remove Staff Member?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove <strong>{deleteConfirmItem.name} {deleteConfirmItem.surname}</strong> ({deleteConfirmItem.staff_no}) from the staff registry?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSection;
