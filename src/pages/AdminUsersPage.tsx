import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  BookOpen,
  Check,
  ClipboardCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { UserRole, useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export type AdminRole = "super_admin" | "admin" | "teacher" | "student" | "parent";

export interface DashboardSectionItem {
  id: string;
  label: string;
  labelBn: string;
  route: string;
  category: "dashboards" | "academics" | "finance" | "assessment" | "communication" | "system";
  categoryName: string;
  categoryNameBn: string;
  description: string;
}

export const ALL_DASHBOARD_SECTIONS: DashboardSectionItem[] = [
  // Primary Dashboards
  {
    id: "dashboard_admin",
    label: "Admin Dashboard",
    labelBn: "প্রধান প্রশাসনিক ড্যাশবোর্ড",
    route: "/admin",
    category: "dashboards",
    categoryName: "Dashboards",
    categoryNameBn: "মূল ড্যাশবোর্ড ভিউ",
    description: "বিদ্যালয়ের সামগ্রিক সার্বিক পরিসংখ্যান, নোটিশ ও দ্রুত লিঙ্ক",
  },
  {
    id: "dashboard_teacher",
    label: "Teacher Dashboard",
    labelBn: "শিক্ষক ড্যাশবোর্ড",
    route: "/teacher",
    category: "dashboards",
    categoryName: "Dashboards",
    categoryNameBn: "মূল ড্যাশবোর্ড ভিউ",
    description: "শিক্ষকের ক্লাস রুটিন, শ্রেণির হাজিরা, পরীক্ষা ও অ্যাসাইনমেন্ট",
  },
  {
    id: "dashboard_student",
    label: "Student Dashboard",
    labelBn: "শিক্ষার্থী ড্যাশবোর্ড",
    route: "/student",
    category: "dashboards",
    categoryName: "Dashboards",
    categoryNameBn: "মূল ড্যাশবোর্ড ভিউ",
    description: "ক্লাস রুটিন, পরীক্ষার ফলাফল, বাড়ির কাজ ও ফি পরিশোধ অবস্থা",
  },
  {
    id: "dashboard_parent",
    label: "Parent Dashboard",
    labelBn: "অভিভাবক ড্যাশবোর্ড",
    route: "/parent",
    category: "dashboards",
    categoryName: "Dashboards",
    categoryNameBn: "মূল ড্যাশবোর্ড ভিউ",
    description: "সন্তানের উপস্থিতি, রিপোর্ট কার্ড, প্রগতি ও ফি রশিদ",
  },

  // Academics Management
  {
    id: "academic_teachers",
    label: "Teachers Management",
    labelBn: "শিক্ষক তালিকা ও প্রোফাইল",
    route: "/list/teachers",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "সকল শিক্ষকের তথ্য, প্রোফাইল, ফোন নম্বর ও বিষয় বণ্টন",
  },
  {
    id: "academic_students",
    label: "Students Directory & Promotion",
    labelBn: "শিক্ষার্থী ও সেশন প্রমোশন",
    route: "/list/students",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "শিক্ষার্থী তথ্য, সেশন প্রমোশন ও পুনঃভর্তি ব্যবস্থাপনা",
  },
  {
    id: "academic_admissions",
    label: "Admissions & Applications",
    labelBn: "ভর্তি আবেদন ও ট্র্যাকিং",
    route: "/admissions",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "অনলাইন ও কাউন্টার ভর্তি আবেদন যাচাই ও রোল বরাদ্দ",
  },
  {
    id: "academic_classes",
    label: "Classes & Sections",
    labelBn: "শ্রেণি ও সেকশন ব্যবস্থাপনা",
    route: "/list/classes",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "শ্রেণি, শাখা, শিফট ও আসন সংখ্যা পরিচালনা",
  },
  {
    id: "academic_subjects",
    label: "Subjects & Curriculum",
    labelBn: "পাঠ্য বিষয়সমূহ",
    route: "/list/subjects",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "জাতীয় শিক্ষাক্রম অনুযায়ী বিষয় ও বিষয় শিক্ষক সংযুক্তি",
  },
  {
    id: "academic_schedule",
    label: "Class Schedule & Routine",
    labelBn: "ক্লাস রুটিন ও সময়সূচি",
    route: "/class-schedule",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "সাপ্তাহিক পিরিয়ড ও ক্লাস রুটিন সময়সূচি",
  },
  {
    id: "academic_parents",
    label: "Parents Directory",
    labelBn: "অভিভাবক ডিরেক্টরি",
    route: "/list/parents",
    category: "academics",
    categoryName: "Academics",
    categoryNameBn: "একাডেমিক ব্যবস্থাপনা",
    description: "অভিভাবকের তথ্য, মোবাইল নম্বর ও জাতীয় পরিচয়পত্র",
  },

  // Finance & Accounts
  {
    id: "finance_fees",
    label: "Fees Collection & Defaulters",
    labelBn: "ফি আদায় ও বকেয়া খাতা",
    route: "/fees",
    category: "finance",
    categoryName: "Finance",
    categoryNameBn: "অর্থ ও হিসাবরক্ষণ",
    description: "ফি ইনভয়েস জেনারেট, দ্রুত কাউন্টার আদায় ও বকেয়া তালিকা",
  },
  {
    id: "finance_expenses",
    label: "Expenses Management",
    labelBn: "বিদ্যালয় খরচ ও ভাউচার",
    route: "/expenses",
    category: "finance",
    categoryName: "Finance",
    categoryNameBn: "অর্থ ও হিসাবরক্ষণ",
    description: "বিদ্যালয়ের দৈনন্দিন ব্যয়, বিল ও ভাউচার সংরক্ষণ",
  },
  {
    id: "finance_revenue",
    label: "Revenue & Accounts Balance",
    labelBn: "আয়-ব্যয় ও রাজস্ব বিশ্লেষণ",
    route: "/revenue",
    category: "finance",
    categoryName: "Finance",
    categoryNameBn: "অর্থ ও হিসাবরক্ষণ",
    description: "মাসিক ও বার্ষিক আয়-ব্যয় বিবরণী ও আর্থিক পরিসংখ্যান",
  },

  // Assessments & Records
  {
    id: "assessment_attendance",
    label: "Attendance & Daily Roll Call",
    labelBn: "দৈনিক হাজিরা ও রোল কল",
    route: "/list/attendance",
    category: "assessment",
    categoryName: "Assessment",
    categoryNameBn: "মূল্যায়ন ও রেকর্ড",
    description: "দৈনিক শ্রেণি হাজিরা, স্প্রেডশিট রেজিস্টার ও ছুটির হিসাব",
  },
  {
    id: "assessment_exams",
    label: "Exams & Timetables",
    labelBn: "পরীক্ষা ও পরীক্ষার রুটিন",
    route: "/list/exams",
    category: "assessment",
    categoryName: "Assessment",
    categoryNameBn: "মূল্যায়ন ও রেকর্ড",
    description: "সাময়িক ও বার্ষিক পরীক্ষার রুটিন ও আসন বিন্যাস",
  },
  {
    id: "assessment_assignments",
    label: "Assignments & Homework",
    labelBn: "বাড়ির কাজ ও অ্যাসাইনমেন্ট",
    route: "/list/assignments",
    category: "assessment",
    categoryName: "Assessment",
    categoryNameBn: "মূল্যায়ন ও রেকর্ড",
    description: "শিক্ষার্থী বাড়ির কাজ প্রদান, জমা ও মূল্যায়ন",
  },
  {
    id: "assessment_results",
    label: "Results & GPA Marksheets",
    labelBn: "ফলাফল ও গ্রেডশিট",
    route: "/list/results",
    category: "assessment",
    categoryName: "Assessment",
    categoryNameBn: "মূল্যায়ন ও রেকর্ড",
    description: "নম্বর এন্ট্রি, জিপিএ মূল্যায়ন ও প্রগ্রেসিভ রিপোর্ট কার্ড",
  },

  // Campus Communication
  {
    id: "comm_events",
    label: "Events & Calendar",
    labelBn: "ইভেন্ট ক্যালেন্ডার",
    route: "/list/events",
    category: "communication",
    categoryName: "Communication",
    categoryNameBn: "যোগাযোগ ও নোটিশ",
    description: "বার্ষিক ক্রীড়া, জাতীয় দিবস ও ছুটি সংক্রান্ত ক্যালেন্ডার",
  },
  {
    id: "comm_messages",
    label: "Internal Messaging",
    labelBn: "বার্তা ও যোগাযোগ",
    route: "/list/messages",
    category: "communication",
    categoryName: "Communication",
    categoryNameBn: "যোগাযোগ ও নোটিশ",
    description: "শিক্ষক, অভিভাবক ও প্রশাসনের সরাসরি বার্তা আদান-প্রদান",
  },
  {
    id: "comm_notices",
    label: "Notices & Announcements",
    labelBn: "নোটিশ বোর্ড ও ঘোষণা",
    route: "/list/announcements",
    category: "communication",
    categoryName: "Communication",
    categoryNameBn: "যোগাযোগ ও নোটিশ",
    description: "জরুরি নোটিশ, শ্রেণি নোটিফিকেশন ও নোটিশ বোর্ড",
  },

  // System & Administration
  {
    id: "system_staff",
    label: "Staff & Human Resources",
    labelBn: "কর্মকর্তা ও কর্মচারী (HR)",
    route: "/list/staff",
    category: "system",
    categoryName: "System",
    categoryNameBn: "প্রশাসন ও নিয়ন্ত্রণ",
    description: "অফিস সহকারী, একাউন্ট্যান্ট ও অন্যান্য কর্মচারীদের তালিকা",
  },
  {
    id: "system_roles",
    label: "All Role & Permissions",
    labelBn: "সকল রোল ও অনুমতি (All Role)",
    route: "/admin-users",
    category: "system",
    categoryName: "System",
    categoryNameBn: "প্রশাসন ও নিয়ন্ত্রণ",
    description: "অ্যাডমিনিস্ট্রেটর তৈরি, রোল নির্ধারণ ও সেকশন অধিকার",
  },
  {
    id: "system_website",
    label: "Public Website Content",
    labelBn: "পাবলিক ওয়েবসাইট কনটেন্ট",
    route: "/website-content",
    category: "system",
    categoryName: "System",
    categoryNameBn: "প্রশাসন ও নিয়ন্ত্রণ",
    description: "বিদ্যালয়ের মূল পাবলিক ওয়েবসাইটের নোটিশ, গ্যালারি ও তথ্য",
  },
  {
    id: "system_settings",
    label: "Institute Settings",
    labelBn: "প্রতিষ্ঠান সেটিংস",
    route: "/settings",
    category: "system",
    categoryName: "System",
    categoryNameBn: "প্রশাসন ও নিয়ন্ত্রণ",
    description: "বিদ্যালয়ের নাম, লোগো, শিফট ও সাধারণ কনফিগারেশন",
  },
];

const ROLE_DEFAULT_SECTIONS: Record<AdminRole, string[]> = {
  super_admin: ALL_DASHBOARD_SECTIONS.map((s) => s.id),
  admin: [
    "dashboard_admin",
    "academic_teachers",
    "academic_students",
    "academic_admissions",
    "academic_classes",
    "academic_subjects",
    "academic_schedule",
    "academic_parents",
    "finance_fees",
    "finance_expenses",
    "finance_revenue",
    "assessment_attendance",
    "assessment_exams",
    "assessment_assignments",
    "assessment_results",
    "comm_events",
    "comm_messages",
    "comm_notices",
    "system_staff",
    "system_settings",
  ],
  teacher: [
    "dashboard_teacher",
    "academic_teachers",
    "academic_students",
    "academic_classes",
    "academic_schedule",
    "assessment_attendance",
    "assessment_exams",
    "assessment_assignments",
    "assessment_results",
    "comm_events",
    "comm_messages",
    "comm_notices",
  ],
  student: [
    "dashboard_student",
    "academic_schedule",
    "assessment_exams",
    "assessment_assignments",
    "assessment_results",
    "assessment_attendance",
    "comm_events",
    "comm_notices",
  ],
  parent: [
    "dashboard_parent",
    "finance_fees",
    "assessment_attendance",
    "assessment_results",
    "assessment_exams",
    "comm_events",
    "comm_notices",
  ],
};

const ROLE_DASHBOARD_ROUTES: Record<AdminRole, string> = {
  super_admin: "/dashboard",
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
};

interface AdminAccount {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  dashboard_sections?: string[];
  created_at: string;
}

interface AdminDraft {
  username: string;
  email: string;
  role: AdminRole;
  password: string;
  dashboard_sections: string[];
}

const emptyDraft: AdminDraft = {
  username: "",
  email: "",
  role: "admin",
  password: "",
  dashboard_sections: ROLE_DEFAULT_SECTIONS.admin,
};

const fieldClass =
  "w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-hidden transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900";

const AdminUsersPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<AdminDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<AdminAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sectionSearch, setSectionSearch] = useState("");
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const response = await api.getAll("admins");
    if (response.success && Array.isArray(response.data?.admins)) {
      setAdmins(response.data.admins);
      setError(null);
    } else {
      setError(response.message || "Unable to load administrator accounts.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAdmins();
  }, []);

  const filteredAdmins = admins.filter((admin) =>
    `${admin.username} ${admin.email} ${admin.role}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const startCreate = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      dashboard_sections: [...ROLE_DEFAULT_SECTIONS.admin],
    });
    setError(null);
    setNotice(null);
    setSectionSearch("");
    setDialogOpen(true);
  };

  const startEdit = (admin: AdminAccount) => {
    setEditingId(admin.id);
    const initialSections = Array.isArray(admin.dashboard_sections) && admin.dashboard_sections.length > 0
      ? admin.dashboard_sections
      : ROLE_DEFAULT_SECTIONS[admin.role] || ROLE_DEFAULT_SECTIONS.admin;
    setDraft({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      password: "",
      dashboard_sections: [...initialSections],
    });
    setError(null);
    setNotice(null);
    setSectionSearch("");
    setDialogOpen(true);
  };

  const handleRoleChangeInDraft = (newRole: AdminRole) => {
    const defaultSections = ROLE_DEFAULT_SECTIONS[newRole] || ROLE_DEFAULT_SECTIONS.admin;
    setDraft((prev) => ({
      ...prev,
      role: newRole,
      dashboard_sections: [...defaultSections],
    }));
  };

  const toggleSection = (sectionId: string) => {
    setDraft((prev) => {
      const exists = prev.dashboard_sections.includes(sectionId);
      const updated = exists
        ? prev.dashboard_sections.filter((id) => id !== sectionId)
        : [...prev.dashboard_sections, sectionId];
      return { ...prev, dashboard_sections: updated };
    });
  };

  const handleSelectAllSections = () => {
    setDraft((prev) => ({
      ...prev,
      dashboard_sections: ALL_DASHBOARD_SECTIONS.map((s) => s.id),
    }));
  };

  const handleClearAllSections = () => {
    setDraft((prev) => ({
      ...prev,
      dashboard_sections: [],
    }));
  };

  const handleApplyRoleDefaults = () => {
    const defaults = ROLE_DEFAULT_SECTIONS[draft.role] || ROLE_DEFAULT_SECTIONS.admin;
    setDraft((prev) => ({
      ...prev,
      dashboard_sections: [...defaults],
    }));
  };

  // Direct access to individual role dashboard
  const handleAccessRole = async (targetRole: AdminRole, targetUserId?: string) => {
    setSwitchingRole(targetRole);
    setError(null);
    try {
      const res = await switchRole(targetRole, targetUserId);
      if (res?.success) {
        const destination = ROLE_DASHBOARD_ROUTES[targetRole] || "/dashboard";
        navigate(destination);
      } else {
        setError(res?.message || `Unable to switch to ${targetRole} dashboard.`);
      }
    } catch {
      setError(`Failed to switch to ${targetRole} dashboard.`);
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const payload: Record<string, any> = {
      username: draft.username.trim(),
      email: draft.email.trim(),
      role: draft.role,
      dashboard_sections: draft.dashboard_sections,
    };
    if (draft.password) payload.password = draft.password;

    try {
      const response = editingId
        ? await api.update("admins", editingId, payload)
        : await api.create("admins", payload);
      if (!response.success) {
        setError(response.message || "Unable to save administrator account.");
        return;
      }
      setDialogOpen(false);
      setNotice(editingId ? "Administrator account updated successfully." : "Administrator account created successfully.");
      await loadAdmins();
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await api.delete("admins", confirmingDelete.id);
      if (!response.success) {
        setError(response.message || "Unable to delete administrator account.");
        return;
      }
      setConfirmingDelete(null);
      setNotice("Administrator account deleted.");
      await loadAdmins();
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Group sections by category
  const categoriesList = useMemo(() => {
    const map = new Map<string, { categoryName: string; categoryNameBn: string; items: DashboardSectionItem[] }>();
    ALL_DASHBOARD_SECTIONS.forEach((section) => {
      if (sectionSearch.trim()) {
        const query = sectionSearch.toLowerCase();
        const match =
          section.label.toLowerCase().includes(query) ||
          section.labelBn.toLowerCase().includes(query) ||
          section.route.toLowerCase().includes(query);
        if (!match) return;
      }

      if (!map.has(section.category)) {
        map.set(section.category, {
          categoryName: section.categoryName,
          categoryNameBn: section.categoryNameBn,
          items: [],
        });
      }
      map.get(section.category)!.items.push(section);
    });
    return Array.from(map.entries());
  }, [sectionSearch]);

  const quickRoles: Array<{
    role: AdminRole;
    title: string;
    titleBn: string;
    route: string;
    badge: string;
    badgeColor: string;
    description: string;
    icon: any;
  }> = [
      {
        role: "super_admin",
        title: "Super Admin",
        titleBn: "সুপার অ্যাডমিন ড্যাশবোর্ড",
        route: "/dashboard",
        badge: "Full System Access",
        badgeColor: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200",
        description: "রুট এক্সেস, সকল ড্যাশবোর্ড মডিউল, ওয়েবসাইট কন্টেন্ট ও সিস্টেম সেটিংস",
        icon: ShieldCheck,
      },
      {
        role: "admin",
        title: "School Administrator",
        titleBn: "বিদ্যালয় অ্যাডমিন ড্যাশবোর্ড",
        route: "/admin",
        badge: "Institutional Management",
        badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200",
        description: "শিক্ষার্থী ভর্তি, সেশন প্রমোশন, ফি আদায়, শ্রেণি ও কর্মী ব্যবস্থাপনা",
        icon: LayoutDashboard,
      },
      {
        role: "teacher",
        title: "Teacher Portal",
        titleBn: "শিক্ষক ড্যাশবোর্ড পোর্টাল",
        route: "/teacher",
        badge: "Class & Attendance",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200",
        description: "ক্লাস রুটিন, দৈনিক হাজিরা রোল কল, পরীক্ষা ও অ্যাসাইনমেন্ট",
        icon: GraduationCap,
      },
      {
        role: "student",
        title: "Student Portal",
        titleBn: "শিক্ষার্থী ড্যাশবোর্ড ভিউ",
        route: "/student",
        badge: "Learning & Results",
        badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200",
        description: "ক্লাস সময়সূচি, পরীক্ষার ফলাফল, বাড়ির কাজ ও প্রমোশন হিস্টোরি",
        icon: BookOpen,
      },
      {
        role: "parent",
        title: "Parent Portal",
        titleBn: "অভিভাবক ড্যাশবোর্ড ভিউ",
        route: "/parent",
        badge: "Progress & Fees",
        badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200",
        description: "সন্তানের উপস্থিতি হার, ফলাফল বিশ্লেষণ ও ফি ইনভয়েস পেমেন্ট",
        icon: Users,
      },
    ];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 space-y-6">
      {/* ─── Top Page Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 border-b border-gray-200 dark:border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300">
              <Shield size={18} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400">
                Administration & Access Control
              </p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                All Role & Administrator Management
              </h1>
            </div>
          </div>
          <p className="mt-1.5 text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Create administrator accounts, configure module dashboard sections, and access individual roles directly.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-sky-800 shadow-sm cursor-pointer"
        >
          <Plus size={16} aria-hidden="true" />
          Create Administrator
        </button>
      </header>

      {/* ─── QUICK ROLE DASHBOARD ACCESS (সরাসরি ড্যাশবোর্ড প্রবেশ) ─────── */}
      <section className="rounded-2xl border border-sky-200/80 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-gray-850 dark:via-gray-800 dark:to-gray-850 p-4 md:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Direct Role Dashboard Access (ব্যক্তিগত রোল ড্যাশবোর্ড সরাসরি প্রবেশ)
            </h2>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
            Super admin can test and operate any role individually
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickRoles.map((item) => {
            const Icon = item.icon;
            const isCurrent = user?.role === item.role;
            const isSwitching = switchingRole === item.role;

            return (
              <div
                key={item.role}
                className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 shadow-2xs hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-gray-700 text-sky-700 dark:text-sky-300">
                      <Icon size={17} />
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.title}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.titleBn}</h3>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isCurrent ? "Active Now" : item.route}
                  </span>
                  <button
                    type="button"
                    disabled={isSwitching}
                    onClick={() => handleAccessRole(item.role)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:text-sky-800 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <span>{isCurrent ? "Open View" : "Access Role"}</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Table Section ───────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs">
        <div className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-700 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">
              Administrator Accounts & Role Access
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {admins.length} account{admins.length === 1 ? "" : "s"} configured in system
            </p>
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-900 px-3 py-2 sm:max-w-xs">
            <Search size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
            <span className="sr-only">Search administrators</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username, email, role..."
              className="min-w-0 flex-1 bg-transparent text-xs md:text-sm outline-hidden text-gray-800 dark:text-gray-100"
            />
          </label>
        </div>

        {notice && (
          <p role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-xs md:text-sm text-emerald-800 font-medium">
            {notice}
          </p>
        )}
        {error && !dialogOpen && (
          <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-xs md:text-sm text-red-700 font-medium">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs md:text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Account / Identity</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role Access</th>
                <th className="px-4 py-3 font-semibold">Dashboard Sections</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Loading administrator accounts...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    {search ? "No matching accounts found." : "No administrator accounts configured."}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const sectionCount = Array.isArray(admin.dashboard_sections) ? admin.dashboard_sections.length : 0;
                  const isYou = admin.id === user?.id;

                  return (
                    <tr key={admin.id} className="transition hover:bg-slate-50/80 dark:hover:bg-gray-750">
                      {/* Identity */}
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                          <UserRound size={16} className="text-gray-400" aria-hidden="true" />
                          {admin.username}
                          {isYou && (
                            <span className="rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                              You
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">{admin.email || "—"}</td>

                      {/* Role Access Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${admin.role === "super_admin"
                            ? "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300"
                            : admin.role === "teacher"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : admin.role === "student"
                                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                                : admin.role === "parent"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                            }`}
                        >
                          {admin.role === "super_admin" ? (
                            <ShieldCheck size={13} aria-hidden="true" />
                          ) : (
                            <Shield size={13} aria-hidden="true" />
                          )}
                          <span className="capitalize">{admin.role.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Dashboard Sections Badge */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-gray-700 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <LayoutDashboard size={12} />
                            {sectionCount === 0 || sectionCount >= ALL_DASHBOARD_SECTIONS.length
                              ? "All 24 Sections"
                              : `${sectionCount} Sections`}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">
                        {admin.created_at ? new Date(admin.created_at.replace(" ", "T")).toLocaleDateString() : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end items-center gap-1.5">
                          {/* Access Role Dashboard */}
                          <button
                            type="button"
                            onClick={() => handleAccessRole(admin.role, admin.id)}
                            title={`Access ${admin.username} (${admin.role}) dashboard individually`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer"
                          >
                            <Eye size={13} />
                            <span className="hidden md:inline">Access Role</span>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => startEdit(admin)}
                            aria-label={`Edit ${admin.username}`}
                            title="Edit account & dashboard sections"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-gray-700 transition cursor-pointer"
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setConfirmingDelete(admin);
                            }}
                            disabled={isYou}
                            aria-label={`Delete ${admin.username}`}
                            title={isYou ? "You cannot delete your own account" : "Delete account"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-gray-700 transition disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 size={14} aria-hidden="true" />
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
      </section>

      {/* ─── CREATE / EDIT ADMINISTRATOR MODAL DIALOG ────────────────────── */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialogOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-form-title"
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-gray-850 shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-slate-50/70 dark:bg-gray-900/50">
              <div>
                <h2 id="admin-form-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {editingId ? "Edit Administrator & Role Access" : "Create Administrator & Dashboard Sections"}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Set account identity and grant individual dashboard sections for this role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs md:text-sm text-red-700 font-medium">
                  {error}
                </p>
              )}

              {/* Account Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/60">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Username (ইউজারনেম)
                  <input
                    required
                    minLength={3}
                    maxLength={64}
                    autoComplete="username"
                    value={draft.username}
                    onChange={(event) => setDraft({ ...draft, username: event.target.value })}
                    className={`${fieldClass} mt-1.5`}
                    placeholder="e.g. principal_admin"
                  />
                </label>

                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Email Address (ইমেইল)
                  <input
                    required={!editingId}
                    type="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                    className={`${fieldClass} mt-1.5`}
                    placeholder="admin@school.edu.bd"
                  />
                </label>

                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Role Access (রোল অ্যাক্সেস)
                  <select
                    value={draft.role}
                    disabled={editingId === user?.id}
                    onChange={(event) => handleRoleChangeInDraft(event.target.value as AdminRole)}
                    className={`${fieldClass} mt-1.5 font-semibold text-sky-800 dark:text-sky-300 cursor-pointer`}
                  >
                    <option value="super_admin">Super admin · Full system access</option>
                    <option value="admin">Admin · School management & operations</option>
                    <option value="teacher">Teacher · Class schedule, attendance & marks</option>
                    <option value="student">Student · Timetable, homework & results</option>
                    <option value="parent">Parent · Child tracking & fee payments</option>
                  </select>
                </label>

                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Password {editingId && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
                  <div className="relative mt-1.5">
                    <input
                      required={!editingId}
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={draft.password}
                      onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                      className={`${fieldClass} pr-10`}
                      placeholder={editingId ? "••••••••" : "At least 8 characters"}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              </div>

              {/* ─── DASHBOARD SECTIONS & PERMISSIONS MATRIX ─────────────── */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <LayoutDashboard size={16} className="text-sky-600 dark:text-sky-400" />
                      Dashboard Sections & Module Access (সকল ড্যাশবোর্ড সেকশন ও মডিউল অধিকার)
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Check the dashboard views and management modules accessible to this role.
                    </p>
                  </div>

                  {/* Quick Select Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200">
                      {draft.dashboard_sections.length} of {ALL_DASHBOARD_SECTIONS.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllSections}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllSections}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition cursor-pointer"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyRoleDefaults}
                      title="Apply recommended sections for selected role"
                      className="px-2 py-1 text-[11px] font-semibold rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 hover:bg-sky-200 transition cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>

                {/* Section Filter Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    placeholder="Filter sections (e.g. fees, attendance, exam, schedule)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  {sectionSearch && (
                    <button
                      type="button"
                      onClick={() => setSectionSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Categories Grouped Tiles */}
                <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
                  {categoriesList.map(([catKey, categoryGroup]) => (
                    <div
                      key={catKey}
                      className="rounded-xl border border-gray-200 dark:border-gray-700/80 bg-slate-50/40 dark:bg-gray-900/40 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-gray-200/80 dark:border-gray-700/60">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                          {categoryGroup.categoryNameBn} · {categoryGroup.categoryName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {categoryGroup.items.filter((item) => draft.dashboard_sections.includes(item.id)).length} /{" "}
                          {categoryGroup.items.length} active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryGroup.items.map((sec) => {
                          const isChecked = draft.dashboard_sections.includes(sec.id);

                          return (
                            <label
                              key={sec.id}
                              onClick={() => toggleSection(sec.id)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${isChecked
                                ? "bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 shadow-2xs"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => { }} // Controlled by label click
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold truncate">{sec.label}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                                    {sec.route}
                                  </span>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{sec.labelBn}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-400 mt-0.5 leading-tight">
                                  {sec.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                {/* Direct access button from modal */}
                <button
                  type="button"
                  onClick={() => handleAccessRole(draft.role)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3.5 py-2 text-xs font-bold text-sky-800 dark:text-sky-300 hover:bg-sky-100 transition cursor-pointer"
                >
                  <Eye size={15} />
                  <span>Access {draft.role.toUpperCase()} Dashboard Individually</span>
                </button>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50 transition cursor-pointer shadow-sm"
                  >
                    <Check size={16} aria-hidden="true" />
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Administrator"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ─── Delete Confirmation Alert Dialog ────────────────────────────── */}
      {confirmingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setConfirmingDelete(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-admin-title"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-850 p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <h2 id="delete-admin-title" className="font-bold text-gray-900 dark:text-gray-100 text-base">
              Delete Administrator: {confirmingDelete.username}?
            </h2>
            <p className="mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              This permanently removes the administrator account and all its module permissions. The last super-admin account cannot be deleted.
            </p>
            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmingDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50 transition cursor-pointer"
              >
                <Trash2 size={14} aria-hidden="true" />
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
