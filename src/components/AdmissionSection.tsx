import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserPlus2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export interface AdmissionItem {
  id: number;
  application_no: string;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender: "MALE" | "FEMALE";
  blood_type?: string;
  address?: string;
  img?: string;
  grade_id?: number | string;
  class_id?: number | string;
  class_name?: string;
  grade_level?: number | string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  parent_id?: string;
  linked_parent_name?: string;
  linked_parent_surname?: string;
  previous_school?: string;
  status: "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED";
  notes?: string;
  applied_date?: string;
  enrolled_student_id?: string;
  created_at?: string;
}

export interface AdmissionCounts {
  total: number;
  pending: number;
  approved: number;
  waitlisted: number;
  rejected: number;
}

const ITEMS_PER_PAGE = 25;

const emptyAdmissionForm = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  blood_type: "AB+",
  sex: "FEMALE" as "MALE" | "FEMALE",
  date_of_birth: "",
  img: "",
  parent_id: "",
  class_id: "",
  grade_id: "",
  status: "PENDING" as "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED",
  notes: "",
  previous_school: "",
};

const emptyParentForm = {
  username: "",
  password: "",
  name: "",
  surname: "",
  email: "",
  phone: "",
  address: "",
};

// Status badge helper
const StatusBadge: React.FC<{ status: AdmissionItem["status"]; size?: "sm" | "xs" }> = ({ status, size = "sm" }) => {
  const base = size === "xs"
    ? "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
    : "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold";
  if (status === "APPROVED")
    return <span className={`${base} bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300`}><Check size={11} /> Approved</span>;
  if (status === "PENDING")
    return <span className={`${base} bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300`}><Clock size={11} /> Pending</span>;
  if (status === "WAITLISTED")
    return <span className={`${base} bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300`}><Sparkles size={11} /> Waitlisted</span>;
  return <span className={`${base} bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300`}><XCircle size={11} /> Rejected</span>;
};

const AdmissionSection: React.FC = () => {
  const [admissions, setAdmissions] = useState<AdmissionItem[]>([]);
  const [counts, setCounts] = useState<AdmissionCounts>({
    total: 0,
    pending: 0,
    approved: 0,
    waitlisted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Options
  const [classes, setClasses] = useState<Array<{ id: string | number; name: string; grade_id?: number }>>([]);
  const [grades, setGrades] = useState<Array<{ id: string | number; level: number }>>([]);
  const [parents, setParents] = useState<Array<{ id: string | number; name: string; surname: string }>>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdmissionItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<AdmissionItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AdmissionItem | null>(null);

  // Form State
  const [formData, setFormData] = useState(emptyAdmissionForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [changingStatusId, setChangingStatusId] = useState<number | null>(null);

  // Inline parent creation
  const [parentMode, setParentMode] = useState<"existing" | "new">("existing");
  const [parentForm, setParentForm] = useState(emptyParentForm);
  const [selectedParentImage, setSelectedParentImage] = useState<File | null>(null);
  const [parentImagePreview, setParentImagePreview] = useState<string | null>(null);

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

  // Load Data
  const loadAdmissions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.getAll("admissions", {
        limit: 500,
        status: statusFilter !== "all" ? statusFilter : undefined as any,
        grade_id: gradeFilter !== "all" ? gradeFilter : undefined as any,
        search: search.trim() || undefined as any,
      });

      if (res.success && res.data) {
        setAdmissions(Array.isArray(res.data.admissions) ? res.data.admissions : []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      } else {
        setError(res.message || "Unable to load admissions.");
      }
    } catch {
      setError("Unable to connect to admissions service.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, gradeFilter, search]);

  useEffect(() => {
    void loadAdmissions();
    setCurrentPage(1);
  }, [statusFilter, gradeFilter, search]);

  // Load Classes, Grades & Parents for selection
  useEffect(() => {
    Promise.all([
      api.getAll("classes", { limit: 1000 }),
      api.getAll("grades", { limit: 100 }),
      api.getAll("parents", { limit: 1000 }),
    ]).then(([classRes, gradeRes, parentRes]) => {
      if (classRes.success && classRes.data?.classes) setClasses(classRes.data.classes);
      if (gradeRes.success && gradeRes.data?.grades) setGrades(gradeRes.data.grades);
      if (parentRes.success && parentRes.data?.parents) setParents(parentRes.data.parents);
    }).catch(() => { });
  }, []);

  // Client-side filtering (backup for when server doesn't support all filters)
  const filteredAdmissions = useMemo(() => {
    if (!search.trim()) return admissions;
    const q = search.toLowerCase().trim();
    return admissions.filter((item) => {
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const appNo = item.application_no.toLowerCase();
      const parent = (item.parent_name || item.linked_parent_name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const username = (item.username || "").toLowerCase();
      return fullName.includes(q) || appNo.includes(q) || parent.includes(q) || email.includes(q) || username.includes(q);
    });
  }, [admissions, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAdmissions.length / ITEMS_PER_PAGE));
  const pagedAdmissions = filteredAdmissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Status Change (approve/waitlist/reject)
  const handleStatusChange = async (item: AdmissionItem, newStatus: AdmissionItem["status"]) => {
    setChangingStatusId(item.id);
    try {
      const res = await api.update("admissions", item.id, { status: newStatus });
      if (res.success) {
        showToast(`Application ${newStatus.toLowerCase()} successfully.`);
        // Update detailsItem in-place if open
        if (detailsItem?.id === item.id) {
          setDetailsItem({ ...detailsItem, status: newStatus });
        }
        await loadAdmissions(true);
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
    setFormData({
      ...emptyAdmissionForm,
      grade_id: String(grades[0]?.id || ""),
      class_id: String(classes[0]?.id || ""),
      parent_id: String(parents[0]?.id || ""),
      blood_type: "AB+",
      sex: "FEMALE",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setParentMode("existing");
    setParentForm(emptyParentForm);
    setSelectedParentImage(null);
    setParentImagePreview(null);
    setFormError(null);
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: AdmissionItem) => {
    setEditItem(item);
    setFormData({
      username: item.username || "",
      password: "",
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
      blood_type: item.blood_type || "AB+",
      sex: (item.gender || "FEMALE") as "MALE" | "FEMALE",
      date_of_birth: item.date_of_birth || "",
      img: item.img || "",
      parent_id: String(item.parent_id || (parents[0]?.id ? String(parents[0].id) : "")),
      class_id: String(item.class_id || (classes[0]?.id ? String(classes[0].id) : "")),
      grade_id: String(item.grade_id || (grades[0]?.id ? String(grades[0].id) : "")),
      status: item.status || "PENDING",
      notes: item.notes || "",
      previous_school: item.previous_school || "",
    });
    setSelectedImage(null);
    setImagePreview(item.img || null);
    setParentMode("existing");
    setParentForm(emptyParentForm);
    setSelectedParentImage(null);
    setParentImagePreview(null);
    setFormError(null);
    setCreateModalOpen(true);
    setDetailsItem(null);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.username.trim()) { setFormError("Username is required."); return; }
    if (!editItem && (!formData.password || formData.password.length < 6)) {
      setFormError("Password is required (minimum 6 characters)."); return;
    }
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError("First name and last name are required."); return;
    }
    if (!formData.address.trim()) { setFormError("Address is required."); return; }
    if (!formData.blood_type.trim()) { setFormError("Blood type is required."); return; }

    if (parentMode === "existing" && !formData.parent_id) {
      setFormError("Please select an existing parent or create a new one."); return;
    }
    if (parentMode === "new") {
      if (!parentForm.name.trim() || !parentForm.surname.trim()) {
        setFormError("Parent first name and last name are required."); return;
      }
      if (!parentForm.username.trim()) { setFormError("Parent username is required."); return; }
      if (!parentForm.password || parentForm.password.length < 6) {
        setFormError("Parent password is required (minimum 6 characters)."); return;
      }
      if (!parentForm.phone.trim()) { setFormError("Parent phone number is required."); return; }
      if (!parentForm.address.trim()) { setFormError("Parent address is required."); return; }
    }

    if (!formData.class_id) { setFormError("Class is required."); return; }
    if (!formData.grade_id) { setFormError("Grade is required."); return; }

    setSubmitting(true);
    try {
      let resolvedParentId = formData.parent_id;

      if (parentMode === "new") {
        let parentRes;
        if (selectedParentImage) {
          const pfd = new FormData();
          pfd.append("username", parentForm.username.trim());
          pfd.append("password", parentForm.password.trim());
          pfd.append("name", parentForm.name.trim());
          pfd.append("surname", parentForm.surname.trim());
          if (parentForm.email.trim()) pfd.append("email", parentForm.email.trim());
          pfd.append("phone", parentForm.phone.trim());
          pfd.append("address", parentForm.address.trim());
          pfd.append("img", selectedParentImage, selectedParentImage.name);
          parentRes = await api.create("parents", pfd);
        } else {
          parentRes = await api.create("parents", {
            username: parentForm.username.trim(),
            password: parentForm.password.trim(),
            name: parentForm.name.trim(),
            surname: parentForm.surname.trim(),
            email: parentForm.email.trim() || null,
            phone: parentForm.phone.trim(),
            address: parentForm.address.trim(),
          });
        }
        if (!parentRes.success) {
          setFormError(parentRes.message || "Failed to create parent. Please try again.");
          setSubmitting(false); return;
        }
        const newParentId = parentRes.data?.id;
        if (!newParentId) {
          setFormError("Parent was created but ID could not be retrieved.");
          setSubmitting(false); return;
        }
        resolvedParentId = String(newParentId);
        const refreshed = await api.getAll("parents", { limit: 1000 });
        if (refreshed.success && refreshed.data?.parents) setParents(refreshed.data.parents);
      }

      let res;
      const commonPayload: Record<string, any> = {
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        name: formData.first_name.trim(),
        surname: formData.last_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim(),
        blood_type: formData.blood_type.trim(),
        sex: formData.sex,
        gender: formData.sex,
        date_of_birth: formData.date_of_birth || null,
        parent_id: resolvedParentId,
        class_id: formData.class_id,
        grade_id: formData.grade_id,
        status: formData.status,
        notes: formData.notes.trim() || null,
        previous_school: formData.previous_school.trim() || null,
      };
      if (formData.password && formData.password.trim().length >= 6) {
        commonPayload.password = formData.password.trim();
      }

      if (selectedImage) {
        const fd = new FormData();
        Object.entries(commonPayload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, String(v));
        });
        fd.append("img", selectedImage, selectedImage.name);
        res = editItem
          ? await api.update("admissions", editItem.id, fd)
          : await api.create("admissions", fd);
      } else {
        commonPayload.img = formData.img.trim() || null;
        res = editItem
          ? await api.update("admissions", editItem.id, commonPayload)
          : await api.create("admissions", commonPayload);
      }

      if (res.success) {
        setCreateModalOpen(false);
        setSelectedImage(null);
        setImagePreview(null);
        setParentMode("existing");
        setParentForm(emptyParentForm);
        setSelectedParentImage(null);
        setParentImagePreview(null);
        showToast(editItem ? "Application updated successfully." : "New admission application created.");
        await loadAdmissions(true);
      } else {
        setFormError(res.message || "Failed to save admission application.");
      }
    } catch {
      setFormError("Unable to reach server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admission
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await api.delete("admissions", deleteConfirmItem.id);
      if (res.success) {
        setDeleteConfirmItem(null);
        setDetailsItem(null);
        showToast("Application deleted.");
        await loadAdmissions(true);
      } else {
        showToast(res.message || "Unable to delete application.", "error");
      }
    } catch {
      showToast("Failed to reach server.", "error");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Application No", "Student Name", "Gender", "Date of Birth",
      "Grade", "Class", "Parent Name", "Parent Phone", "Parent Email",
      "Previous School", "Status", "Applied Date", "Notes",
    ];
    const rows = filteredAdmissions.map((item) => [
      item.application_no,
      `${item.first_name} ${item.last_name}`,
      item.gender,
      item.date_of_birth || "",
      item.grade_level ? `Grade ${item.grade_level}` : "",
      item.class_name || "",
      item.parent_name || item.linked_parent_name || "",
      item.parent_phone || "",
      item.parent_email || "",
      item.previous_school || "",
      item.status,
      item.applied_date || "",
      item.notes || "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Admissions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stat tile click handler (toggles filter)
  const handleTileClick = (val: string) => {
    setStatusFilter(prev => prev === val ? "all" : val);
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

      {/* SECTION HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <UserPlus size={20} className="text-purple-600 dark:text-purple-400" />
              Student Admissions &amp; Enrollment
            </h2>
            <span className="text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-amber-800 font-semibold">
              2026/27 Session
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Process new applicant registrations, review evaluations, and approve student classroom enrollments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAdmissions()}
            title="Refresh list"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-purple-600" : ""} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredAdmissions.length === 0}
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
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* STAT TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div
          onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "all"
            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Total Applied</span>
            <Users size={14} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{counts.total}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">All applications</p>
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
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1">{counts.pending}</h3>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Awaiting decision</p>
        </div>

        {/* Approved */}
        <div
          onClick={() => handleTileClick("APPROVED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "APPROVED"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>Approved</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{counts.approved}</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Active students</p>
        </div>

        {/* Waitlisted */}
        <div
          onClick={() => handleTileClick("WAITLISTED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "WAITLISTED"
            ? "bg-sky-50 dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-sky-700 dark:text-sky-400">
            <span>Waitlisted</span>
            <Sparkles size={14} className="text-sky-600" />
          </div>
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-200 mt-1">{counts.waitlisted}</h3>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Pending seat</p>
        </div>

        {/* Rejected */}
        <div
          onClick={() => handleTileClick("REJECTED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${statusFilter === "REJECTED"
            ? "bg-red-50 dark:bg-red-950/40 border-red-400 ring-2 ring-red-400/20"
            : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
            }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-red-700 dark:text-red-400">
            <span>Rejected</span>
            <XCircle size={14} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-900 dark:text-red-200 mt-1">{counts.rejected}</h3>
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">Not accepted</p>
        </div>
      </div>

      {/* SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search student name, app no, parent..."
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
          <Filter size={13} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Grade:</span>
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Grades</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>Grade {g.level}</option>
            ))}
          </select>

          {(statusFilter !== "all" || gradeFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setGradeFilter("all");
                setSearch("");
                setSearchInput("");
                setCurrentPage(1);
              }}
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
              <th className="py-3 px-3.5">Application</th>
              <th className="py-3 px-3.5">Applicant Student</th>
              <th className="py-3 px-3.5">Placement</th>
              <th className="py-3 px-3.5">Parent / Guardian</th>
              <th className="py-3 px-3.5">Applied Date</th>
              <th className="py-3 px-3.5">Status</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-purple-600" />
                    <span>Loading admission records...</span>
                  </div>
                </td>
              </tr>
            ) : pagedAdmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  {filteredAdmissions.length === 0 && admissions.length > 0
                    ? "No applications match your search or filters."
                    : "No admission applications found. Click \"+ New Admission\" to create one."
                  }
                </td>
              </tr>
            ) : (
              pagedAdmissions.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition cursor-pointer"
                  onClick={() => setDetailsItem(item)}
                >
                  {/* Application # */}
                  <td className="py-3 px-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-purple-700 dark:text-purple-300">
                      {item.application_no}
                    </span>
                  </td>

                  {/* Student */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2.5">
                      {item.img ? (
                        <img src={item.img} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {item.first_name[0]}{item.last_name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                          {item.first_name} {item.last_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-400">
                            {item.gender} · {item.blood_type || "—"}
                          </span>
                          {item.enrolled_student_id && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Enrolled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Placement */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {item.grade_level ? `Grade ${item.grade_level}` : "Grade pending"}
                    </span>
                    <p className="text-[11px] text-gray-400">{item.class_name || "Class unassigned"}</p>
                  </td>

                  {/* Parent */}
                  <td className="py-3 px-3.5">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                      {item.parent_name || item.linked_parent_name || "—"}
                    </p>
                    <p className="text-[11px] text-gray-400">{item.parent_phone || "No phone"}</p>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3.5 text-gray-500 whitespace-nowrap">
                    {item.applied_date || "Recent"}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      {item.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => void handleStatusChange(item, "APPROVED")}
                          disabled={changingStatusId === item.id}
                          title="Approve & Enroll Student"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[11px] font-semibold shadow-sm transition disabled:opacity-50"
                        >
                          <UserCheck size={13} />
                          <span>{changingStatusId === item.id ? "..." : "Approve"}</span>
                        </button>
                      )}

                      {item.enrolled_student_id && (
                        <Link
                          to={`/list/students/${item.enrolled_student_id}`}
                          title="View in All Students"
                          className="p-1.5 rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GraduationCap size={15} />
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setDetailsItem(item)}
                        title="View Details"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800 transition"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title="Edit Application"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-gray-800 transition"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmItem(item)}
                        title="Delete Application"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 transition"
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

      {/* PAGINATION + FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 px-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            Showing <strong className="text-gray-800 dark:text-gray-200">
              {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredAdmissions.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAdmissions.length)}
            </strong> of <strong className="text-gray-800 dark:text-gray-200">{filteredAdmissions.length}</strong> applications
            {" · "}<strong className="text-emerald-700 dark:text-emerald-400">{counts.approved} enrolled</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const page = totalPages <= 7 ? i + 1 : (
                  currentPage <= 4 ? i + 1 :
                    currentPage >= totalPages - 3 ? totalPages - 6 + i :
                      currentPage - 3 + i
                );
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <Link
            to="/list/students"
            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold transition"
          >
            <span>All Students</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ─────── MODAL 1: NEW / EDIT APPLICATION ─────── */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) setCreateModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editItem ? "Edit Admission Application" : "New Student Admission Application"}
                  </h3>
                  <p className="text-xs text-gray-500">Academic Year 2026/27</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── Student Info ── */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Information</h4>
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Username */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Username *</span>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editItem && editItem.enrolled_student_id)}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </label>

                {/* Password */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Password {editItem ? <span className="font-normal text-gray-400">(leave blank to keep)</span> : "*"}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required={!editItem}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* First name */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>First name *</span>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        first_name: val,
                        username: !editItem && (!prev.username || prev.username === `${prev.first_name.toLowerCase()}.${prev.last_name.toLowerCase()}`)
                          ? `${val.toLowerCase()}.${prev.last_name.toLowerCase()}`
                          : prev.username
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* Last name */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Last name *</span>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        last_name: val,
                        username: !editItem && (!prev.username || prev.username === `${prev.first_name.toLowerCase()}.${prev.last_name.toLowerCase()}`)
                          ? `${prev.first_name.toLowerCase()}.${val.toLowerCase()}`
                          : prev.username
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* Date of Birth */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> Date of Birth</span>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* Sex */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Sex *</span>
                  <select
                    required
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value as "MALE" | "FEMALE" })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                </label>

                {/* Email */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-1"><Mail size={13} className="text-gray-400" /> Email</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* Phone */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" /> Phone</span>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* Blood type */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Blood Type *</span>
                  <select
                    required
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </label>

                {/* Status (edit only) */}
                {editItem && (
                  <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <span>Application Status *</span>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AdmissionItem["status"] })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="WAITLISTED">Waitlisted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </label>
                )}

                {/* Address */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <span>Address *</span>
                  <textarea
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition resize-none"
                  />
                </label>

                {/* Previous school */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <span>Previous School Attended</span>
                  <input
                    type="text"
                    value={formData.previous_school}
                    onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                    placeholder="Name of previous school (if any)"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  />
                </label>

                {/* Notes */}
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <span>Evaluation Remarks / Notes</span>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes or evaluation remarks..."
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition resize-none"
                  />
                </label>

                {/* Photo Upload */}
                <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <span className="font-medium">Photo</span>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-3">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Student photo preview" className="h-20 w-20 rounded-xl border border-gray-200 dark:border-gray-700 object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500">No photo</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <label className="flex cursor-pointer items-center gap-2 w-fit rounded-lg border border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/30 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition">
                        <Upload size={13} />
                        <span>Choose photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (!file) return;
                            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                              setFormError("Choose a JPG, PNG, or WebP image."); e.target.value = ""; return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              setFormError("Photo must be no larger than 5 MB."); e.target.value = ""; return;
                            }
                            setSelectedImage(file);
                            setImagePreview(URL.createObjectURL(file));
                            setFormError(null);
                          }}
                        />
                      </label>
                      <p className="mt-1.5 text-xs text-gray-400">JPG, PNG, or WebP · max 5 MB</p>
                      {selectedImage && (
                        <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(editItem?.img || null); }} className="mt-1 text-xs text-red-500 hover:text-red-700 transition">
                          Remove selected photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Parent Section ── */}
              <div className="space-y-1 pt-1">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parent / Guardian</h4>
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Parent *</span>
                  {!editItem && (
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setParentMode("existing")}
                        className={`px-3 py-1.5 transition ${parentMode === "existing" ? "bg-purple-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                      >
                        Select existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setParentMode("new")}
                        className={`px-3 py-1.5 flex items-center gap-1.5 transition ${parentMode === "new" ? "bg-purple-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                      >
                        <UserPlus2 size={12} /> Create new
                      </button>
                    </div>
                  )}
                </div>

                {(parentMode === "existing" || editItem) && (
                  <select
                    required={parentMode === "existing" || Boolean(editItem)}
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  >
                    <option value="">Select parent</option>
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} {p.surname}</option>
                    ))}
                  </select>
                )}

                {parentMode === "new" && !editItem && (
                  <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/20 p-4 space-y-3">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <UserPlus2 size={13} /> New Parent Details — will be added to All Parents
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { label: "First name *", field: "name", type: "text", required: true },
                        { label: "Last name *", field: "surname", type: "text", required: true },
                        { label: "Username *", field: "username", type: "text", required: true },
                        { label: "Password * (min 6 chars)", field: "password", type: "password", required: true },
                        { label: "Email", field: "email", type: "email", required: false },
                        { label: "Phone *", field: "phone", type: "text", required: true },
                      ].map(({ label, field, type, required }) => (
                        <label key={field} className="flex flex-col gap-1 text-xs text-gray-700 dark:text-gray-300">
                          <span>{label}</span>
                          <input
                            type={type}
                            required={required}
                            autoComplete={type === "password" ? "new-password" : undefined}
                            minLength={type === "password" ? 6 : undefined}
                            value={(parentForm as any)[field]}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (field === "name") {
                                setParentForm(prev => ({
                                  ...prev, name: val,
                                  username: !prev.username || prev.username === `${prev.name.toLowerCase()}.${prev.surname.toLowerCase()}`
                                    ? `${val.toLowerCase()}.${prev.surname.toLowerCase()}` : prev.username
                                }));
                              } else if (field === "surname") {
                                setParentForm(prev => ({
                                  ...prev, surname: val,
                                  username: !prev.username || prev.username === `${prev.name.toLowerCase()}.${prev.surname.toLowerCase()}`
                                    ? `${prev.name.toLowerCase()}.${val.toLowerCase()}` : prev.username
                                }));
                              } else {
                                setParentForm({ ...parentForm, [field]: val });
                              }
                            }}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </label>
                      ))}
                      <label className="flex flex-col gap-1 text-xs text-gray-700 dark:text-gray-300 sm:col-span-2">
                        <span>Address *</span>
                        <textarea
                          required
                          rows={2}
                          value={parentForm.address}
                          onChange={(e) => setParentForm({ ...parentForm, address: e.target.value })}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-xs outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                        />
                      </label>
                      {/* Parent Photo */}
                      <div className="flex flex-col gap-1.5 text-xs text-gray-700 dark:text-gray-300 sm:col-span-2">
                        <span>Photo <span className="font-normal text-gray-400">(optional)</span></span>
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800/50 p-2.5">
                          {parentImagePreview ? (
                            <img src={parentImagePreview} alt="" className="h-14 w-14 rounded-lg border border-gray-200 dark:border-gray-600 object-cover" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-400">No photo</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <label className="flex cursor-pointer items-center gap-1.5 w-fit rounded-md border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition">
                              <Upload size={11} /> <span>Choose photo</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  if (!file) return;
                                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setFormError("Parent photo must be JPG, PNG, or WebP."); e.target.value = ""; return; }
                                  if (file.size > 5 * 1024 * 1024) { setFormError("Parent photo must be no larger than 5 MB."); e.target.value = ""; return; }
                                  setSelectedParentImage(file);
                                  setParentImagePreview(URL.createObjectURL(file));
                                  setFormError(null);
                                }}
                              />
                            </label>
                            {selectedParentImage && (
                              <button type="button" onClick={() => { setSelectedParentImage(null); setParentImagePreview(null); }} className="mt-1 text-[10px] text-red-500 hover:text-red-700 transition">Remove photo</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Placement Section ── */}
              <div className="space-y-1 pt-1">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academic Placement</h4>
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Class *</span>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <span>Grade *</span>
                  <select
                    required
                    value={formData.grade_id}
                    onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:border-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition"
                  >
                    <option value="">Select grade</option>
                    {grades.map((g) => <option key={g.id} value={g.id}>Grade {g.level}</option>)}
                  </select>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-purple-600 hover:bg-purple-700 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editItem ? "Save Changes" : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODAL 2: APPLICATION DETAILS ─────── */}
      {detailsItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailsItem(null);
          }}
        >
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {detailsItem.img ? (
                    <img src={detailsItem.img} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-lg shrink-0">
                      {detailsItem.first_name[0]}{detailsItem.last_name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {detailsItem.first_name} {detailsItem.last_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded">
                        {detailsItem.application_no}
                      </span>
                      <StatusBadge status={detailsItem.status} size="xs" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Applied: {detailsItem.applied_date || "Recent"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsItem(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto text-xs">
              {/* Username */}
              {detailsItem.username && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                  <span className="text-gray-500 font-medium">Username:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">@{detailsItem.username}</span>
                </div>
              )}

              {/* Placement + Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Academic Placement</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">
                    {detailsItem.grade_level ? `Grade ${detailsItem.grade_level}` : "Grade Pending"}
                  </p>
                  <p className="text-gray-500 mt-0.5">{detailsItem.class_name || "Class unassigned"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Student Info</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">
                    {detailsItem.gender} · Blood {detailsItem.blood_type || "—"}
                  </p>
                  <p className="text-gray-500 mt-0.5">DOB: {detailsItem.date_of_birth || "Not recorded"}</p>
                </div>
              </div>

              {/* Contact */}
              {(detailsItem.email || detailsItem.phone) && (
                <div className="flex flex-wrap gap-3 text-gray-600 dark:text-gray-400">
                  {detailsItem.phone && <span className="flex items-center gap-1"><Phone size={12} className="text-gray-400" />{detailsItem.phone}</span>}
                  {detailsItem.email && <span className="flex items-center gap-1"><Mail size={12} className="text-gray-400" />{detailsItem.email}</span>}
                </div>
              )}

              {/* Parent */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Parent / Guardian</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {detailsItem.parent_name || detailsItem.linked_parent_name || "Not specified"}
                </p>
                <div className="flex flex-wrap gap-4 text-gray-500">
                  {detailsItem.parent_phone && <span className="flex items-center gap-1"><Phone size={12} />{detailsItem.parent_phone}</span>}
                  {detailsItem.parent_email && <span className="flex items-center gap-1"><Mail size={12} />{detailsItem.parent_email}</span>}
                </div>
                {detailsItem.address && <p className="text-gray-400">Address: {detailsItem.address}</p>}
              </div>

              {/* Previous school */}
              {detailsItem.previous_school && (
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Previous School:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-0.5">{detailsItem.previous_school}</p>
                </div>
              )}

              {/* Notes */}
              {detailsItem.notes && (
                <div className="rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-3">
                  <span className="font-bold text-purple-900 dark:text-purple-300">Notes:</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{detailsItem.notes}</p>
                </div>
              )}

              {/* Enrolled link */}
              {detailsItem.enrolled_student_id && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 flex flex-wrap items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5 font-semibold text-xs">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    Enrolled (ID: {detailsItem.enrolled_student_id})
                  </span>
                  <Link
                    to={`/list/students/${detailsItem.enrolled_student_id}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 hover:underline text-xs"
                    onClick={() => setDetailsItem(null)}
                  >
                    View Student Profile <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3.5">
              {/* Status action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {detailsItem.status !== "APPROVED" && (
                  <button
                    type="button"
                    disabled={changingStatusId === detailsItem.id}
                    onClick={() => void handleStatusChange(detailsItem, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    <UserCheck size={13} /> Approve &amp; Enroll
                  </button>
                )}
                {detailsItem.status !== "WAITLISTED" && detailsItem.status !== "APPROVED" && (
                  <button
                    type="button"
                    disabled={changingStatusId === detailsItem.id}
                    onClick={() => void handleStatusChange(detailsItem, "WAITLISTED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Sparkles size={13} /> Waitlist
                  </button>
                )}
                {detailsItem.status !== "REJECTED" && (
                  <button
                    type="button"
                    disabled={changingStatusId === detailsItem.id}
                    onClick={() => void handleStatusChange(detailsItem, "REJECTED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <XCircle size={13} /> Reject
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
                  onClick={() => { setDeleteConfirmItem(detailsItem); setDetailsItem(null); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDetailsItem(null)}
                className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────── MODAL 3: DELETE CONFIRMATION ─────── */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmItem(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-950 p-2.5">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Admission Record?</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to permanently remove the application for{" "}
              <strong>{deleteConfirmItem.first_name} {deleteConfirmItem.last_name}</strong>{" "}
              (Application #{deleteConfirmItem.application_no})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdmissionSection;
