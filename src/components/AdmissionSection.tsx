import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
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
  UserCheck,
  UserPlus,
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
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender: "MALE" | "FEMALE";
  blood_type?: string;
  address?: string;
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

const emptyAdmissionForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "MALE" as "MALE" | "FEMALE",
  blood_type: "A+",
  address: "",
  grade_id: "",
  class_id: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  previous_school: "",
  status: "PENDING" as "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED",
  notes: "",
  auto_enroll: false,
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

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // Options
  const [classes, setClasses] = useState<Array<{ id: string | number; name: string; grade_id?: number }>>([]);
  const [grades, setGrades] = useState<Array<{ id: string | number; level: number }>>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdmissionItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<AdmissionItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AdmissionItem | null>(null);

  // Form State
  const [formData, setFormData] = useState(emptyAdmissionForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Load Data
  const loadAdmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAll("admissions", {
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
        grade_id: gradeFilter !== "all" ? gradeFilter : undefined,
        search: search.trim() || undefined,
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
  };

  useEffect(() => {
    void loadAdmissions();
  }, [statusFilter, gradeFilter]);

  // Load Classes & Grades for selection
  useEffect(() => {
    Promise.all([
      api.getAll("classes", { limit: 1000 }),
      api.getAll("grades", { limit: 100 }),
    ]).then(([classRes, gradeRes]) => {
      if (classRes.success && classRes.data?.classes) setClasses(classRes.data.classes);
      if (gradeRes.success && gradeRes.data?.grades) setGrades(gradeRes.data.grades);
    }).catch(() => {});
  }, []);

  // Filtered by Search client-side if needed
  const filteredAdmissions = useMemo(() => {
    if (!search.trim()) return admissions;
    const q = search.toLowerCase().trim();
    return admissions.filter((item) => {
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const appNo = item.application_no.toLowerCase();
      const parent = (item.parent_name || item.linked_parent_name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      return fullName.includes(q) || appNo.includes(q) || parent.includes(q) || email.includes(q);
    });
  }, [admissions, search]);

  // Quick 1-Click Approve & Enroll
  const handleQuickApprove = async (item: AdmissionItem) => {
    setApprovingId(item.id);
    try {
      const res = await api.update("admissions", item.id, {
        status: "APPROVED",
      });
      if (res.success) {
        await loadAdmissions();
      } else {
        alert(res.message || "Failed to approve admission.");
      }
    } catch {
      alert("Failed to reach server.");
    } finally {
      setApprovingId(null);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      ...emptyAdmissionForm,
      grade_id: String(grades[0]?.id || ""),
      class_id: String(classes[0]?.id || ""),
    });
    setFormError(null);
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: AdmissionItem) => {
    setEditItem(item);
    setFormData({
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email || "",
      phone: item.phone || "",
      date_of_birth: item.date_of_birth || "",
      gender: item.gender || "MALE",
      blood_type: item.blood_type || "A+",
      address: item.address || "",
      grade_id: String(item.grade_id || ""),
      class_id: String(item.class_id || ""),
      parent_name: item.parent_name || "",
      parent_phone: item.parent_phone || "",
      parent_email: item.parent_email || "",
      previous_school: item.previous_school || "",
      status: item.status || "PENDING",
      notes: item.notes || "",
      auto_enroll: item.status === "APPROVED",
    });
    setFormError(null);
    setCreateModalOpen(true);
    setDetailsItem(null);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError("Student first and last names are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
      };

      const res = editItem
        ? await api.update("admissions", editItem.id, payload)
        : await api.create("admissions", payload);

      if (res.success) {
        setCreateModalOpen(false);
        await loadAdmissions();
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
        await loadAdmissions();
      } else {
        alert(res.message || "Unable to delete application.");
      }
    } catch {
      alert("Failed to reach server.");
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      "Application No",
      "Student Name",
      "Gender",
      "Date of Birth",
      "Grade",
      "Class",
      "Parent Name",
      "Parent Phone",
      "Parent Email",
      "Status",
      "Applied Date",
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
      item.status,
      item.applied_date || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Admissions_Report_${new Date().toISOString().split("T")[0]}.csv`);
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
              <UserPlus size={20} className="text-purple-600 dark:text-purple-400" />
              Student Admissions & Enrollment
            </h2>
            <span className="text-[10px] bg-lamaYellowLight border border-lamaYellow/60 px-2 py-0.5 rounded-full text-amber-800 font-semibold">
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
            onClick={loadAdmissions}
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
            <span>Export</span>
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

      {/* ADMISSION METRIC TILES (Matches UserCard / Lama design theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Applications */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "all"
              ? "bg-lamaPurpleLight dark:bg-purple-950/40 border-purple-400 ring-2 ring-purple-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Total Applied</span>
            <Users size={15} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{counts.total}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">All applications</p>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "PENDING"
              ? "bg-lamaYellowLight dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>Pending Review</span>
            <Clock size={15} className="text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1">{counts.pending}</h3>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Awaiting decision</p>
        </div>

        {/* Approved & Enrolled */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "APPROVED"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>Approved & Enrolled</span>
            <CheckCircle2 size={15} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{counts.approved}</h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Active students</p>
        </div>

        {/* Waitlisted / Other */}
        <div
          onClick={() => setStatusFilter("WAITLISTED")}
          className={`cursor-pointer rounded-xl p-3 border transition ${
            statusFilter === "WAITLISTED"
              ? "bg-lamaSkyLight dark:bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/20"
              : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
          }`}
        >
          <div className="flex justify-between items-center text-xs font-medium text-sky-700 dark:text-sky-400">
            <span>Waitlisted</span>
            <Sparkles size={15} className="text-sky-600" />
          </div>
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-200 mt-1">{counts.waitlisted}</h3>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">Pending seat opening</p>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by student name, app no, parent..."
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

        {/* Grade Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Grade:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Grades</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                Grade {g.level}
              </option>
            ))}
          </select>

          {/* Status Reset */}
          {(statusFilter !== "all" || gradeFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setGradeFilter("all");
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

      {/* ADMISSIONS TABLE / LIST */}
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
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-purple-600" />
                    <span>Loading admission records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAdmissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No admission applications found. Click "+ New Admission" to create one.
                </td>
              </tr>
            ) : (
              filteredAdmissions.map((item) => {
                const isApproved = item.status === "APPROVED";
                const isPending = item.status === "PENDING";
                const isWaitlisted = item.status === "WAITLISTED";
                const isRejected = item.status === "REJECTED";

                return (
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

                    {/* Student Name */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-lamaPurpleLight text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {item.first_name[0]}
                          {item.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                            {item.first_name} {item.last_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-gray-400">
                              {item.gender} · {item.blood_type || "A+"}
                            </span>
                            {item.enrolled_student_id && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Enrolled: {item.enrolled_student_id}
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

                    {/* Applied Date */}
                    <td className="py-3 px-3.5 text-gray-500 whitespace-nowrap">
                      {item.applied_date || "Recent"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold">
                          <Check size={12} /> Approved
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-semibold">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                      {isWaitlisted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2.5 py-0.5 text-[11px] font-semibold">
                          <Sparkles size={12} /> Waitlisted
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-2.5 py-0.5 text-[11px] font-semibold">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => void handleQuickApprove(item)}
                            disabled={approvingId === item.id}
                            title="1-Click Approve & Enroll Student"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[11px] font-semibold shadow-sm transition disabled:opacity-50"
                          >
                            <UserCheck size={13} />
                            <span>{approvingId === item.id ? "Enrolling..." : "Approve"}</span>
                          </button>
                        )}

                        {item.enrolled_student_id && (
                          <Link
                            to={`/list/students/${item.enrolled_student_id}`}
                            title={`View ${item.first_name} ${item.last_name} in All Students`}
                            className="p-1.5 rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition"
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dynamic Sync Status & Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 px-1 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            Showing <strong className="text-gray-800 dark:text-gray-200">{filteredAdmissions.length}</strong> applications
            {" · "}<strong className="text-emerald-700 dark:text-emerald-400">{counts.approved} enrolled</strong> (dynamically synced with All Students)
          </span>
        </div>
        <Link
          to="/list/students"
          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold transition"
        >
          <span>View All Students roster</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* MODAL 1: NEW / EDIT ADMISSION APPLICATION */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !submitting) setCreateModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/70 dark:bg-gray-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
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
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Student Personal Info */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2">
                  1. Student Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      placeholder="e.g. Alexander"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Last Name / Surname <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      placeholder="e.g. Wright"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: "MALE" })}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                          formData.gender === "MALE"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: "FEMALE" })}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                          formData.gender === "FEMALE"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Blood Type</label>
                    <select
                      value={formData.blood_type}
                      onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Residential Address
                    </label>
                    <input
                      placeholder="e.g. 742 Evergreen Terrace"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Placement */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2">
                  2. Academic Placement & Previous School
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Grade
                    </label>
                    <select
                      value={formData.grade_id}
                      onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    >
                      <option value="">Select Grade</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          Grade {g.level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Class
                    </label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Previous School
                    </label>
                    <input
                      placeholder="e.g. Lincoln Primary"
                      value={formData.previous_school}
                      onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2">
                  3. Parent / Guardian Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Parent / Guardian Name
                    </label>
                    <input
                      placeholder="e.g. Robert Wright"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Parent Phone</label>
                    <input
                      placeholder="e.g. +1 555-0193"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Parent Email</label>
                    <input
                      type="email"
                      placeholder="e.g. robert.w@example.com"
                      value={formData.parent_email}
                      onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Evaluation Notes */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2">
                  4. Application Status & Decision
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Admission Decision
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    >
                      <option value="PENDING">Pending Review</option>
                      <option value="APPROVED">Approved (Enrolls Student)</option>
                      <option value="WAITLISTED">Waitlisted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    {formData.status === "APPROVED" && (
                      <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={13} /> Approving will automatically enroll this student into the active roster.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Evaluation Notes / Remarks
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Notes on entrance exam, academic history, special requirements..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editItem ? "Save Changes" : "Submit Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPLICATION DETAILS DRAWER */}
      {detailsItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailsItem(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-purple-950/20">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-md">
                  {detailsItem.application_no}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      detailsItem.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : detailsItem.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : detailsItem.status === "WAITLISTED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {detailsItem.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDetailsItem(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                {detailsItem.first_name} {detailsItem.last_name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Applied on {detailsItem.applied_date || "Recent"}</p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              {/* Placement box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                    Academic Placement
                  </span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">
                    {detailsItem.grade_level ? `Grade ${detailsItem.grade_level}` : "Grade Pending"}
                  </p>
                  <p className="text-gray-500 mt-0.5">{detailsItem.class_name || "Class unassigned"}</p>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Student Specs</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-1">
                    {detailsItem.gender} · Blood {detailsItem.blood_type || "A+"}
                  </p>
                  <p className="text-gray-500 mt-0.5">DOB: {detailsItem.date_of_birth || "Not recorded"}</p>
                </div>
              </div>

              {/* Parent / Guardian Contact */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                  Parent / Guardian Details
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {detailsItem.parent_name || detailsItem.linked_parent_name || "Not specified"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
                    {detailsItem.parent_phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-gray-400" /> {detailsItem.parent_phone}
                      </span>
                    )}
                    {detailsItem.parent_email && (
                      <span className="flex items-center gap-1">
                        <Mail size={13} className="text-gray-400" /> {detailsItem.parent_email}
                      </span>
                    )}
                  </div>
                  {detailsItem.address && <p className="text-gray-500">Address: {detailsItem.address}</p>}
                </div>
              </div>

              {/* Previous School & Notes */}
              {detailsItem.previous_school && (
                <div className="text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Previous School Attended:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-0.5">{detailsItem.previous_school}</p>
                </div>
              )}

              {detailsItem.notes && (
                <div className="rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 p-3 text-xs">
                  <span className="font-bold text-purple-900 dark:text-purple-300">Evaluation Remarks / Notes:</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{detailsItem.notes}</p>
                </div>
              )}

              {/* If enrolled student ID is linked */}
              {detailsItem.enrolled_student_id && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    Enrolled into active student database (ID: {detailsItem.enrolled_student_id})
                  </span>
                  <Link
                    to={`/list/students/${detailsItem.enrolled_student_id}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
                  >
                    <span>View Student Profile</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-5 py-3.5">
              <div className="flex items-center gap-2">
                {detailsItem.status !== "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleQuickApprove(detailsItem);
                      setDetailsItem(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition"
                  >
                    <UserCheck size={14} /> Approve & Enroll
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal(detailsItem)}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDetailsItem(null)}
                className="rounded-xl bg-gray-200 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmItem(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-gray-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 p-2.5">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Admission Record?</h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Are you sure you want to remove the application for{" "}
              <strong>
                {deleteConfirmItem.first_name} {deleteConfirmItem.last_name}
              </strong>{" "}
              (Application #{deleteConfirmItem.application_no})?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
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
