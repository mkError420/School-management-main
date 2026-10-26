import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Info,
  Languages,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  Monitor,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Save,
  School,
  Search,
  Shield,
  Sliders,
  Sparkles,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Wand2,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { ImageUploadField } from "@/components/ImageUploadField";
import type {
  SchoolWebsiteContent,
  SchoolNotice,
  SchoolDownloadItem,
  SchoolGalleryItem,
  SchoolCoCurricularItem,
  SchoolQuickLink,
  SchoolTeacherMember,
  SchoolTickerItem,
  SchoolCodeOfConductRule,
  AdmissionSeatCapacityItem,
  StudyCornerBook,
  StudyCornerResource,
  StudyCornerStat,
  StudyCornerLink,
  StudyCornerTip,
} from "@/types/site";
import { DEFAULT_ADMISSION_SEAT_MATRIX, DEFAULT_WEBSITE_CONTENT } from "@/types/site";
import {
  autoTranslateWebsiteContent,
  translateBnToEn,
  translateEnToBn,
  toEnglishDigits,
} from "@/lib/translation";

type ContentTab =
  | "identity"
  | "ticker"
  | "hero_about"
  | "leadership"
  | "teachers"
  | "statistics"
  | "notices"
  | "downloads"
  | "admission"
  | "gallery"
  | "study_co"
  | "links"
  | "conduct";

type EditLangMode = "bn" | "en" | "dual";

const WebsiteContentPage: React.FC = () => {
  const { websiteContent, saveWebsiteContent, siteLogo, saveSiteLogo, refreshSettings, isLoading, liveCounts } = useSiteSettings();
  const [draft, setDraft] = useState<SchoolWebsiteContent>(websiteContent);
  const [activeTab, setActiveTab] = useState<ContentTab>("identity");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editLangMode, setEditLangMode] = useState<EditLangMode>("dual");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [downloadSearch, setDownloadSearch] = useState("");
  const [admissionSeatSearch, setAdmissionSeatSearch] = useState("");
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState("সকল");
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGalleryIndex, setEditingGalleryIndex] = useState<number | null>(null);
  const [isSavingGalleryPhoto, setIsSavingGalleryPhoto] = useState(false);
  const [galleryForm, setGalleryForm] = useState<SchoolGalleryItem>({
    id: "",
    title: "",
    titleEn: "",
    category: "ক্যাম্পাস",
    categoryEn: "Campus",
    imageUrl: "",
  });
  const [showDirectPageLinks, setShowDirectPageLinks] = useState(false);
  const [syncingStaff, setSyncingStaff] = useState(false);
  const [liveStaffList, setLiveStaffList] = useState<any[]>([]);
  const [liveStaffStats, setLiveStaffStats] = useState<{
    total: number;
    teaching: number;
    admin: number;
    support: number;
  } | null>(null);

  const mapStaffArrayToTeachers = useCallback((rawStaff: any[]): SchoolTeacherMember[] => {
    return rawStaff.map((s, idx) => {
      const firstName = (s.name || "").trim();
      const surName = (s.surname || "").trim();
      const fullNameEn = surName ? `${firstName} ${surName}` : firstName;
      const fullNameBn = translateEnToBn(fullNameEn) || fullNameEn;

      const isTeaching = s.type === "TEACHING";
      const isAdmin = s.type === "ADMINISTRATIVE";
      const category: "শিক্ষক" | "প্রশাসন" | "কর্মচারী" = isTeaching
        ? "শিক্ষক"
        : isAdmin
          ? "প্রশাসন"
          : "কর্মচারী";

      const desigEn = s.designation || (isTeaching ? "Academic Teacher" : isAdmin ? "Administrative Officer" : "Staff Member");
      const desigBn = translateEnToBn(desigEn) || desigEn;

      const subjectRaw = s.subjects_list || (Array.isArray(s.subjects) ? s.subjects.join(", ") : s.subjects) || s.department || (isTeaching ? "General" : "Operations");
      const subjectEn = String(subjectRaw);
      const subjectBn = translateEnToBn(subjectEn) || subjectEn;

      const qualEn = s.qualification || (isTeaching ? "B.Ed / M.Ed" : "Diploma / Graduate");
      const qualBn = translateEnToBn(qualEn) || qualEn;

      return {
        id: s.id ? `stf_${s.id}` : `t_sync_${idx + 1}`,
        name: fullNameBn,
        nameEn: fullNameEn,
        designation: desigBn,
        designationEn: desigEn,
        subject: subjectBn,
        subjectEn: subjectEn,
        qualification: qualBn,
        qualificationEn: qualEn,
        phone: s.phone || "",
        email: s.email || "",
        photo: s.img || "/images/avatar.png",
        category,
      };
    });
  }, []);

  const loadLiveStaffStats = useCallback(async () => {
    let staff: any[] = [];
    try {
      const res = await api.getPublicStaffDirectory();
      if (res.success && Array.isArray(res.data?.staff)) {
        staff = res.data.staff;
      }
    } catch { }

    if (staff.length === 0) {
      try {
        const stored = localStorage.getItem("mk_school_staff_list");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            staff = parsed;
          }
        }
      } catch { }
    }

    if (staff.length > 0) {
      setLiveStaffList(staff);
      const total = staff.length;
      const teaching = staff.filter((s: any) => s.type === "TEACHING").length;
      const admin = staff.filter((s: any) => s.type === "ADMINISTRATIVE").length;
      const support = staff.filter((s: any) => s.type !== "TEACHING" && s.type !== "ADMINISTRATIVE").length;
      setLiveStaffStats({ total, teaching, admin, support });

      // If draft teachers are still the placeholder demo teachers (t1..t7), auto-sync with live staff
      setDraft((prev) => {
        const isDefaultPlaceholder =
          !prev.teachers ||
          prev.teachers.length === 0 ||
          (prev.teachers.length === 7 && prev.teachers[0]?.id === "t1" && prev.teachers[6]?.id === "t7");
        if (isDefaultPlaceholder) {
          return {
            ...prev,
            teachers: mapStaffArrayToTeachers(staff),
          };
        }
        return prev;
      });

      return staff;
    }

    return [];
  }, [mapStaffArrayToTeachers]);

  useEffect(() => {
    void loadLiveStaffStats();
  }, [loadLiveStaffStats]);

  // Leadership Selection & Dynamic Sync Handlers from Staff Directory
  const handleSelectPrincipalFromStaff = (staffId: string) => {
    if (!staffId) return;
    const member = liveStaffList.find((s) => String(s.id) === String(staffId));
    if (!member) return;
    const fullNameEn = `${member.name || ""} ${member.surname || ""}`.trim();
    const fullNameBn = translateEnToBn(fullNameEn) || fullNameEn;
    const desigEn = member.designation || "Headmaster";
    const desigBn = translateEnToBn(desigEn) || "প্রধান শিক্ষক";
    const qualEn = member.qualification || "";
    const qualBn = qualEn ? translateEnToBn(qualEn) : "";

    setDraft((prev) => ({
      ...prev,
      principalName: fullNameBn,
      principalNameEn: fullNameEn,
      principalTitle: desigBn,
      principalTitleEn: desigEn,
      principalQualification: qualBn || prev.principalQualification,
      principalQualificationEn: qualEn || prev.principalQualificationEn,
      principalPhone: member.phone || prev.principalPhone || "",
      principalEmail: member.email || prev.principalEmail || "",
      principalPhoto: member.img || prev.principalPhoto || "",
    }));

    setFeedback({
      type: "success",
      message: `Staff Directory থেকে ${fullNameBn} (${desigBn})-এর তথ্য প্রধান শিক্ষক হিসেবে সফলভাবে লোড হয়েছে! আপনি নিচে যেকোনো তথ্য সরাসরি এডিট করতে পারেন।`,
    });
  };

  const handleSelectAsstPrincipalFromStaff = (staffId: string) => {
    if (!staffId) return;
    const member = liveStaffList.find((s) => String(s.id) === String(staffId));
    if (!member) return;
    const fullNameEn = `${member.name || ""} ${member.surname || ""}`.trim();
    const fullNameBn = translateEnToBn(fullNameEn) || fullNameEn;
    const desigEn = member.designation || "Assistant Headmaster";
    const desigBn = translateEnToBn(desigEn) || "সহকারী প্রধান শিক্ষক";

    setDraft((prev) => ({
      ...prev,
      asstPrincipalName: fullNameBn,
      asstPrincipalNameEn: fullNameEn,
      asstPrincipalTitle: desigBn,
      asstPrincipalTitleEn: desigEn,
      asstPrincipalPhoto: member.img || prev.asstPrincipalPhoto || "",
    }));

    setFeedback({
      type: "success",
      message: `Staff Directory থেকে ${fullNameBn} (${desigBn})-এর তথ্য সহকারী প্রধান শিক্ষক হিসেবে সফলভাবে লোড হয়েছে!`,
    });
  };

  const handleSelectSmcPresidentFromStaff = (staffId: string) => {
    if (!staffId) return;
    const member = liveStaffList.find((s) => String(s.id) === String(staffId));
    if (!member) return;
    const fullNameEn = `${member.name || ""} ${member.surname || ""}`.trim();
    const fullNameBn = translateEnToBn(fullNameEn) || fullNameEn;
    const desigEn = member.designation || "President, Managing Committee";
    const desigBn = translateEnToBn(desigEn) || "সভাপতি, ম্যানেজিং কমিটি";

    setDraft((prev) => ({
      ...prev,
      smcPresidentName: fullNameBn,
      smcPresidentNameEn: fullNameEn,
      smcPresidentTitle: desigBn,
      smcPresidentTitleEn: desigEn,
      smcPresidentPhoto: member.img || prev.smcPresidentPhoto || "",
    }));

    setFeedback({
      type: "success",
      message: `Staff Directory থেকে ${fullNameBn}-এর তথ্য সভাপতি হিসেবে সফলভাবে লোড হয়েছে!`,
    });
  };

  const handleSyncLeadershipFromStaffDirectory = async () => {
    setSyncingStaff(true);
    setFeedback({
      type: "info",
      message: "Staff & Faculty Directory থেকে প্রধান শিক্ষক, সহকারী প্রধান শিক্ষক ও নেতৃবৃন্দের তথ্য সিঙ্ক করা হচ্ছে...",
    });

    try {
      let rawStaff: any[] = liveStaffList;
      if (rawStaff.length === 0) {
        const res = await api.getPublicStaffDirectory();
        if (res.success && Array.isArray(res.data?.staff)) {
          rawStaff = res.data.staff;
          setLiveStaffList(rawStaff);
        }
      }

      if (rawStaff.length === 0) {
        const stored = localStorage.getItem("mk_school_staff_list");
        if (stored) {
          try {
            rawStaff = JSON.parse(stored);
            setLiveStaffList(rawStaff);
          } catch { }
        }
      }

      if (rawStaff.length === 0) {
        setFeedback({
          type: "error",
          message: "Staff & Faculty Directory-তে কোনো তথ্য পাওয়া যায়নি। প্রথমে Staff সেকশনে শিক্ষক ও কর্মচারী যোগ করুন।",
        });
        return;
      }

      // 1. Detect Principal: designation containing headmaster, principal, প্রধান শিক্ষক
      const principalCandidate =
        rawStaff.find((s) => {
          const d = (s.designation || "").toLowerCase();
          return d.includes("principal") || d.includes("headmaster") || d.includes("প্রধান শিক্ষক") || d.includes("head master");
        }) ||
        rawStaff.find((s) => s.type === "TEACHING") ||
        rawStaff[0];

      // 2. Detect Assistant Principal: designation containing vice, asst, assistant headmaster, সহকারী প্রধান শিক্ষক
      const asstCandidate =
        rawStaff.find((s) => {
          if (principalCandidate && s.id === principalCandidate.id) return false;
          const d = (s.designation || "").toLowerCase();
          return d.includes("vice") || d.includes("asst") || d.includes("assistant head") || d.includes("সহকারী প্রধান শিক্ষক");
        }) ||
        rawStaff.filter((s) => s.type === "TEACHING" && (!principalCandidate || s.id !== principalCandidate.id))[0];

      // 3. Detect SMC President: designation containing president, smc, chairman, সভাপতি
      const smcCandidate =
        rawStaff.find((s) => {
          const d = (s.designation || "").toLowerCase();
          return d.includes("president") || d.includes("smc") || d.includes("chairman") || d.includes("সভাপতি");
        }) ||
        rawStaff.find((s) => s.type === "ADMINISTRATIVE" && (!principalCandidate || s.id !== principalCandidate.id) && (!asstCandidate || s.id !== asstCandidate.id));

      setDraft((prev) => {
        const updated = { ...prev };

        if (principalCandidate) {
          const pNameEn = `${principalCandidate.name || ""} ${principalCandidate.surname || ""}`.trim();
          const pNameBn = translateEnToBn(pNameEn) || pNameEn;
          const pDesigEn = principalCandidate.designation || "Headmaster";
          const pDesigBn = translateEnToBn(pDesigEn) || "প্রধান শিক্ষক";
          const pQualEn = principalCandidate.qualification || "";
          const pQualBn = pQualEn ? translateEnToBn(pQualEn) : "";

          updated.principalName = pNameBn;
          updated.principalNameEn = pNameEn;
          updated.principalTitle = pDesigBn;
          updated.principalTitleEn = pDesigEn;
          if (pQualBn) updated.principalQualification = pQualBn;
          if (pQualEn) updated.principalQualificationEn = pQualEn;
          if (principalCandidate.img) updated.principalPhoto = principalCandidate.img;
          if (principalCandidate.phone) updated.principalPhone = principalCandidate.phone;
          if (principalCandidate.email) updated.principalEmail = principalCandidate.email;
        }

        if (asstCandidate) {
          const aNameEn = `${asstCandidate.name || ""} ${asstCandidate.surname || ""}`.trim();
          const aNameBn = translateEnToBn(aNameEn) || aNameEn;
          const aDesigEn = asstCandidate.designation || "Assistant Headmaster";
          const aDesigBn = translateEnToBn(aDesigEn) || "সহকারী প্রধান শিক্ষক";

          updated.asstPrincipalName = aNameBn;
          updated.asstPrincipalNameEn = aNameEn;
          updated.asstPrincipalTitle = aDesigBn;
          updated.asstPrincipalTitleEn = aDesigEn;
          if (asstCandidate.img) updated.asstPrincipalPhoto = asstCandidate.img;
        }

        if (smcCandidate) {
          const sNameEn = `${smcCandidate.name || ""} ${smcCandidate.surname || ""}`.trim();
          const sNameBn = translateEnToBn(sNameEn) || sNameEn;
          const sDesigEn = smcCandidate.designation || "President, Managing Committee";
          const sDesigBn = translateEnToBn(sDesigEn) || "সভাপতি, ম্যানেজিং কমিটি";

          updated.smcPresidentName = sNameBn;
          updated.smcPresidentNameEn = sNameEn;
          updated.smcPresidentTitle = sDesigBn;
          updated.smcPresidentTitleEn = sDesigEn;
          if (smcCandidate.img) updated.smcPresidentPhoto = smcCandidate.img;
        }

        return updated;
      });

      setFeedback({
        type: "success",
        message: "Staff & Faculty Directory থেকে প্রধান শিক্ষক, সহকারী প্রধান শিক্ষক ও নেতৃবৃন্দের তথ্য সফলভাবে সিঙ্ক ও আপডেট করা হয়েছে! আপনি যেকোনো তথ্য নিচে সরাসরি সম্পাদনা করতে পারেন।",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "নেতৃত্ব ও প্রশাসন তথ্য সিঙ্ক করতে সমস্যা হয়েছে: " + (err?.message || ""),
      });
    } finally {
      setSyncingStaff(false);
    }
  };

  const handleSyncFromStaffDirectory = async () => {
    setSyncingStaff(true);
    setFeedback({
      type: "info",
      message: "Staff & Faculty Directory থেকে সকল শিক্ষক ও কর্মচারীর তথ্য সিঙ্ক করা হচ্ছে...",
    });

    try {
      let rawStaff: any[] = [];
      const res = await api.getPublicStaffDirectory();
      if (res.success && Array.isArray(res.data?.staff) && res.data.staff.length > 0) {
        rawStaff = res.data.staff;
      } else {
        const adminStaffRes = await api.getAll("staff", { limit: 200 });
        if (adminStaffRes.success && Array.isArray(adminStaffRes.data?.staff) && adminStaffRes.data.staff.length > 0) {
          rawStaff = adminStaffRes.data.staff;
        }
      }

      if (rawStaff.length === 0) {
        const stored = localStorage.getItem("mk_school_staff_list");
        if (stored) {
          try {
            rawStaff = JSON.parse(stored);
          } catch { }
        }
      }

      if (rawStaff.length === 0) {
        setFeedback({
          type: "error",
          message: "Staff & Faculty Directory-তে কোনো তথ্য পাওয়া যায়নি। প্রথমে Staff সেকশনে শিক্ষক ও কর্মচারী যুক্ত করুন।",
        });
        return;
      }

      const mappedTeachers = mapStaffArrayToTeachers(rawStaff);

      setDraft((prev) => ({
        ...prev,
        teachers: mappedTeachers,
        dynamicStaffDirectory: true,
      }));

      const total = mappedTeachers.length;
      const teaching = mappedTeachers.filter((t) => t.category === "শিক্ষক").length;
      const admin = mappedTeachers.filter((t) => t.category === "প্রশাসন").length;
      const support = mappedTeachers.filter((t) => t.category === "কর্মচারী").length;
      setLiveStaffStats({ total, teaching, admin, support });

      setFeedback({
        type: "success",
        message: `সফল! Staff & Faculty Directory থেকে মোট ${total} জন (শিক্ষক: ${teaching}, প্রশাসন: ${admin}, কর্মচারী: ${support}) ওয়েবসাইটের Faculty & Staff Directory-তে সিঙ্ক করা হয়েছে! পরিবর্তন সংরক্ষণ করতে 'সংরক্ষণ ও প্রকাশ' বাটনে ক্লিক করুন।`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "Staff & Faculty Directory সিঙ্ক করতে সমস্যা হয়েছে: " + (err?.message || ""),
      });
    } finally {
      setSyncingStaff(false);
    }
  };

  useEffect(() => {
    setDraft(websiteContent);
  }, [websiteContent]);

  const handleReloadFromDatabase = async () => {
    setSyncing(true);
    setFeedback({ type: "info", message: "ডাটাবেজ থেকে সর্বশেষ তথ্য লোড করা হচ্ছে..." });
    try {
      await refreshSettings();
      setFeedback({ type: "success", message: "ডাটাবেজ থেকে সর্বশেষ তথ্য সফলভাবে সিঙ্ক হয়েছে।" });
    } catch (err: any) {
      setFeedback({ type: "error", message: "ডাটাবেজ থেকে তথ্য লোড করতে সমস্যা হয়েছে: " + (err?.message || "") });
    } finally {
      setSyncing(false);
    }
  };

  const updateField = <K extends keyof SchoolWebsiteContent>(key: K, value: SchoolWebsiteContent[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
  const textareaClass =
    "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black outline-none transition focus:border-[#006a4e] focus:ring-2 focus:ring-[#006a4e]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-y";

  // Single field translator helpers
  const translateSingleFieldToEn = (sourceBnKey: keyof SchoolWebsiteContent, targetEnKey: keyof SchoolWebsiteContent) => {
    const sourceVal = String(draft[sourceBnKey] || "");
    if (!sourceVal.trim()) return;
    const translated = translateBnToEn(sourceVal);
    updateField(targetEnKey, translated as any);
  };

  const translateSingleFieldToBn = (sourceEnKey: keyof SchoolWebsiteContent, targetBnKey: keyof SchoolWebsiteContent) => {
    const sourceVal = String(draft[sourceEnKey] || "");
    if (!sourceVal.trim()) return;
    const translated = translateEnToBn(sourceVal);
    updateField(targetBnKey, translated as any);
  };

  // Full website translation
  const handleAutoTranslateAll = async (target: "en" | "bn") => {
    setTranslating(true);
    setFeedback({
      type: "info",
      message: target === "en" ? "ওয়েবসাইটের সকল কনটেন্ট স্বয়ংক্রিয় ইংরেজি অনুবাদ করা হচ্ছে..." : "ওয়েবসাইটের সকল কনটেন্ট বাংলায় অনুবাদ করা হচ্ছে...",
    });

    try {
      const translated = await autoTranslateWebsiteContent(draft, target);
      setDraft(translated);
      setFeedback({
        type: "success",
        message: target === "en"
          ? "সফল! সকল পেজের কনটেন্ট, নোটিশ, শিক্ষক ও তথ্য সঠিক ইংরেজিতে অনুবাদ ও যুক্ত হয়েছে। নিচে রিভিউ করে 'সংরক্ষণ ও প্রকাশ' বাটনে ক্লিক করুন।"
          : "সফল! সকল তথ্য বাংলায় অনুবাদ করা হয়েছে।",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "অনুবাদ সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      });
    } finally {
      setTranslating(false);
    }
  };

  // Translate active tab
  const handleTranslateCurrentTab = async () => {
    setTranslating(true);
    try {
      const translated = await autoTranslateWebsiteContent(draft, "en");
      // Merge only current tab's fields or full draft
      setDraft(translated);
      setFeedback({
        type: "success",
        message: "বর্তমান সেকশনের সকল তথ্য সফলভাবে ইংরেজিতে অনুবাদ করা হয়েছে।",
      });
    } finally {
      setTranslating(false);
    }
  };

  // Check if draft has unsaved edits
  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(websiteContent);
  }, [draft, websiteContent]);

  // Ticker Handlers
  const addTickerItem = () => {
    const newItem: SchoolTickerItem = {
      id: "tk_" + Date.now(),
      text: "",
      textEn: "",
      badge: "জরুরি",
      badgeEn: "Urgent",
      link: "",
      isActive: true,
      priority: "urgent",
    };
    setDraft((prev) => ({
      ...prev,
      tickerItems: [newItem, ...(prev.tickerItems || [])],
    }));
  };

  const removeTickerItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      tickerItems: (prev.tickerItems || []).filter((_, i) => i !== index),
    }));
  };

  const updateTickerItem = (index: number, field: keyof SchoolTickerItem, value: any) => {
    setDraft((prev) => ({
      ...prev,
      tickerItems: (prev.tickerItems || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const toggleTickerItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      tickerItems: (prev.tickerItems || []).map((item, i) =>
        i === index ? { ...item, isActive: item.isActive === false ? true : false } : item
      ),
    }));
  };

  const moveTickerItem = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const items = [...(prev.tickerItems || [])];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, tickerItems: items };
    });
  };

  const translateTickerItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      tickerItems: (prev.tickerItems || []).map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          textEn: item.textEn || translateBnToEn(item.text),
          badgeEn: item.badgeEn || translateBnToEn(item.badge || ""),
        };
      }),
    }));
  };

  // Reorder helpers for other lists
  const moveTeacher = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.teachers || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, teachers: list };
    });
  };

  const moveNotice = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.notices || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, notices: list };
    });
  };

  const moveDownloadItem = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.downloads || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, downloads: list };
    });
  };

  const moveQuickLink = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.quickLinks || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, quickLinks: list };
    });
  };



  // Notice handlers
  const addNotice = () => {
    const newNotice: SchoolNotice = {
      id: "n_" + Date.now(),
      title: "",
      titleEn: "",
      date: new Date().toISOString().slice(0, 10),
      category: "সাধারণ",
      categoryEn: "General",
      content: "",
      contentEn: "",
      fileUrl: "#",
    };
    setDraft((prev) => ({ ...prev, notices: [newNotice, ...prev.notices] }));
  };

  const removeNotice = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      notices: prev.notices.filter((_, i) => i !== index),
    }));
  };

  const updateNotice = (index: number, field: keyof SchoolNotice, value: string) => {
    setDraft((prev) => ({
      ...prev,
      notices: prev.notices.map((n, i) => (i === index ? { ...n, [field]: value } : n)),
    }));
  };

  const translateNoticeItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      notices: prev.notices.map((n, i) => {
        if (i !== index) return n;
        return {
          ...n,
          titleEn: n.titleEn || translateBnToEn(n.title),
          categoryEn: n.categoryEn || translateBnToEn(n.category),
          contentEn: n.contentEn || translateBnToEn(n.content || ""),
        };
      }),
    }));
  };

  const [uploadingNoticeIndex, setUploadingNoticeIndex] = useState<number | null>(null);
  const [noticeUploadError, setNoticeUploadError] = useState<{ index: number; message: string } | null>(null);

  const handleNoticeFileUpload = async (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setNoticeUploadError({ index, message: "ফাইলের সাইজ ১০ MB এর বেশি হতে পারবে না।" });
      return;
    }
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAllowed =
      validTypes.includes(file.type) ||
      ["pdf", "jpg", "jpeg", "png", "webp", "svg"].includes(ext);

    if (!isAllowed) {
      setNoticeUploadError({
        index,
        message: "শুধুমাত্র পিডিএফ (PDF) অথবা ছবি (JPG, PNG, WebP) ফাইল আপলোড করা যাবে।",
      });
      return;
    }

    setNoticeUploadError(null);
    setUploadingNoticeIndex(index);

    try {
      const response = await api.uploadNoticeFile(file);
      if (response.success && response.data?.file_url) {
        updateNotice(index, "fileUrl", response.data.file_url);
        setUploadingNoticeIndex(null);
        return;
      }
    } catch { }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        updateNotice(index, "fileUrl", result);
      }
      setUploadingNoticeIndex(null);
    };
    reader.onerror = () => {
      setNoticeUploadError({
        index,
        message: "ফাইল পড়তে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      });
      setUploadingNoticeIndex(null);
    };
    reader.readAsDataURL(file);
  };

  // Download item handlers
  const addDownloadItem = () => {
    const newItem: SchoolDownloadItem = {
      id: "d_" + Date.now(),
      title: "",
      titleEn: "",
      category: "রুটিন",
      categoryEn: "Routine",
      publishDate: new Date().toISOString().slice(0, 10),
      fileUrl: "#",
    };
    setDraft((prev) => ({ ...prev, downloads: [newItem, ...(prev.downloads || [])] }));
  };

  const removeDownloadItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      downloads: (prev.downloads || []).filter((_, i) => i !== index),
    }));
  };

  const updateDownloadItem = (index: number, field: keyof SchoolDownloadItem, value: string) => {
    setDraft((prev) => ({
      ...prev,
      downloads: (prev.downloads || []).map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const translateDownloadItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      downloads: (prev.downloads || []).map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          titleEn: item.titleEn || translateBnToEn(item.title),
          categoryEn: item.categoryEn || translateBnToEn(item.category),
        };
      }),
    }));
  };

  const [uploadingDownloadIndex, setUploadingDownloadIndex] = useState<number | null>(null);
  const [downloadUploadError, setDownloadUploadError] = useState<{ index: number; message: string } | null>(null);

  const handleDownloadFileUpload = async (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setDownloadUploadError({ index, message: "ফাইলের সাইজ ১০ MB এর বেশি হতে পারবে না।" });
      return;
    }
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAllowed =
      validTypes.includes(file.type) ||
      ["pdf", "jpg", "jpeg", "png", "webp", "svg"].includes(ext);

    if (!isAllowed) {
      setDownloadUploadError({
        index,
        message: "শুধুমাত্র পিডিএফ (PDF) অথবা ছবি (JPG, PNG, WebP) ফাইল আপলোড করা যাবে।",
      });
      return;
    }

    setDownloadUploadError(null);
    setUploadingDownloadIndex(index);

    try {
      const response = await api.uploadDownloadFile(file);
      if (response.success && response.data?.file_url) {
        updateDownloadItem(index, "fileUrl", response.data.file_url);
        setUploadingDownloadIndex(null);
        return;
      }
    } catch { }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        updateDownloadItem(index, "fileUrl", result);
      }
      setUploadingDownloadIndex(null);
    };
    reader.onerror = () => {
      setDownloadUploadError({
        index,
        message: "ফাইল পড়তে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      });
      setUploadingDownloadIndex(null);
    };
    reader.readAsDataURL(file);
  };

  // Gallery handlers
  const handleOpenAddGalleryModal = () => {
    setEditingGalleryIndex(null);
    setGalleryForm({
      id: "g_" + Date.now(),
      title: "",
      titleEn: "",
      category: "ক্যাম্পাস",
      categoryEn: "Campus",
      imageUrl: "",
    });
    setIsGalleryModalOpen(true);
  };

  const handleOpenEditGalleryModal = (index: number) => {
    const item = (draft.gallery || [])[index];
    if (!item) return;
    setEditingGalleryIndex(index);
    setGalleryForm({
      id: item.id || "g_" + Date.now(),
      title: item.title || "",
      titleEn: item.titleEn || "",
      category: item.category || "ক্যাম্পাস",
      categoryEn: item.categoryEn || "Campus",
      imageUrl: item.imageUrl || "",
    });
    setIsGalleryModalOpen(true);
  };

  const handleCloseGalleryModal = () => {
    setIsGalleryModalOpen(false);
    setEditingGalleryIndex(null);
    setIsSavingGalleryPhoto(false);
  };

  const handleSaveGalleryModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!galleryForm.title.trim()) {
      setFeedback({ type: "error", message: "ছবির শিরোনাম (বাংলায়) পূরণ করা বাধ্যতামূলক।" });
      return;
    }
    if (!galleryForm.imageUrl.trim()) {
      setFeedback({ type: "error", message: "গ্যালারির জন্য ছবি আপলোড করুন অথবা ছবির লিঙ্ক প্রদান করুন।" });
      return;
    }

    setIsSavingGalleryPhoto(true);

    const titleEnVal = galleryForm.titleEn?.trim() || translateBnToEn(galleryForm.title);
    const categoryEnVal = galleryForm.categoryEn?.trim() || translateBnToEn(galleryForm.category);

    const photoToSave: SchoolGalleryItem = {
      ...galleryForm,
      id: galleryForm.id || "g_" + Date.now(),
      title: galleryForm.title.trim(),
      titleEn: titleEnVal,
      category: galleryForm.category.trim() || "ক্যাম্পাস",
      categoryEn: categoryEnVal || "Campus",
      imageUrl: galleryForm.imageUrl.trim(),
    };

    let nextGallery: SchoolGalleryItem[];
    if (editingGalleryIndex !== null && editingGalleryIndex >= 0) {
      nextGallery = (draft.gallery || []).map((p, idx) => (idx === editingGalleryIndex ? photoToSave : p));
    } else {
      nextGallery = [photoToSave, ...(draft.gallery || [])];
    }

    const nextDraft: SchoolWebsiteContent = {
      ...draft,
      gallery: nextGallery,
    };

    setDraft(nextDraft);

    try {
      const res = await saveWebsiteContent(nextDraft);
      if (res.success) {
        setFeedback({
          type: "success",
          message:
            editingGalleryIndex !== null
              ? "গ্যালারির ছবিটি সফলভাবে আপডেট ও ডাটাবেজে সংরক্ষিত হয়েছে!"
              : "নতুন ছবিটি সফলভাবে গ্যালারিতে যুক্ত ও ডাটাবেজে সংরক্ষিত হয়েছে! লাইভ ওয়েবসাইটে সরাসরি দেখতে পারেন।",
        });
        handleCloseGalleryModal();
      } else {
        setFeedback({
          type: "error",
          message: res.message || "গ্যালারির ছবি ডাটাবেজে সংরক্ষণ করা যায়নি।",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "ডাটাবেজে সংরক্ষণ করতে সমস্যা হয়েছে: " + (err?.message || "নেটওয়ার্ক ত্রুটি"),
      });
    } finally {
      setIsSavingGalleryPhoto(false);
    }
  };

  const handleDeleteGalleryItem = async (index: number) => {
    const photo = (draft.gallery || [])[index];
    const confirmMsg = `আপনি কি নিশ্চিত যে "${photo?.title || "এই ছবি"}" গ্যালারি থেকে মুছে ফেলতে চান?`;
    if (!window.confirm(confirmMsg)) return;

    const nextGallery = (draft.gallery || []).filter((_, i) => i !== index);
    const nextDraft: SchoolWebsiteContent = {
      ...draft,
      gallery: nextGallery,
    };
    setDraft(nextDraft);

    try {
      const res = await saveWebsiteContent(nextDraft);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "ছবিটি সফলভাবে গ্যালারি ও ডাটাবেজ থেকে মুছে ফেলা হয়েছে।",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "মুছতে সমস্যা হয়েছে: " + (err?.message || ""),
      });
    }
  };

  const moveGalleryItem = async (index: number, direction: "up" | "down") => {
    const list = [...(draft.gallery || [])];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    const nextDraft = { ...draft, gallery: list };
    setDraft(nextDraft);
    try {
      await saveWebsiteContent(nextDraft);
    } catch { }
  };

  const translateGalleryItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          titleEn: item.titleEn || translateBnToEn(item.title),
          categoryEn: item.categoryEn || translateBnToEn(item.category),
        };
      }),
    }));
  };

  const handleResetGalleryToDefault = async () => {
    if (window.confirm("আপনি কি গ্যালারির পূর্বনির্ধারিত ডিফল্ট ছবিগুলো পুনরায় লোড করতে চান?")) {
      const nextDraft = {
        ...draft,
        gallery: DEFAULT_WEBSITE_CONTENT.gallery,
      };
      setDraft(nextDraft);
      try {
        const res = await saveWebsiteContent(nextDraft);
        if (res.success) {
          setFeedback({
            type: "success",
            message: "ডিফল্ট গ্যালারির ছবিগুলো সফলভাবে লোড ও ডাটাবেজে সংরক্ষিত হয়েছে।",
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: "রিস্টোর করতে সমস্যা হয়েছে: " + (err?.message || ""),
        });
      }
    }
  };

  // Legacy alias for compatibility
  const addGalleryItem = handleOpenAddGalleryModal;
  const removeGalleryItem = handleDeleteGalleryItem;
  const updateGalleryItem = (index: number, field: keyof SchoolGalleryItem, value: string) => {
    setDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  // Teacher handlers
  const addTeacher = () => {
    const newTeacher: SchoolTeacherMember = {
      id: "t_" + Date.now(),
      name: "",
      nameEn: "",
      designation: "সহকারী শিক্ষক",
      designationEn: "Assistant Teacher",
      subject: "সাধারণ বিষয়",
      subjectEn: "General Subjects",
      qualification: "স্নাতক / স্নাতকোত্তর",
      qualificationEn: "Graduate / Postgraduate",
      phone: "+880 1",
      email: "",
      photo: "/images/avatar.png",
      category: "শিক্ষক",
    };
    setDraft((prev) => ({ ...prev, teachers: [newTeacher, ...(prev.teachers || [])] }));
  };

  const removeTeacher = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).filter((_, i) => i !== index),
    }));
  };

  const updateTeacher = (index: number, field: keyof SchoolTeacherMember, value: string) => {
    setDraft((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const translateTeacherItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          nameEn: item.nameEn || translateBnToEn(item.name),
          designationEn: item.designationEn || translateBnToEn(item.designation),
          subjectEn: item.subjectEn || translateBnToEn(item.subject),
          qualificationEn: item.qualificationEn || translateBnToEn(item.qualification),
        };
      }),
    }));
  };

  // Quick links handlers
  const addQuickLink = () => {
    const newLink: SchoolQuickLink = { label: "", labelEn: "", url: "#" };
    setDraft((prev) => ({ ...prev, quickLinks: [...prev.quickLinks, newLink] }));
  };

  const removeQuickLink = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index),
    }));
  };

  const updateQuickLink = (index: number, field: keyof SchoolQuickLink, value: string) => {
    setDraft((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  // Study Corner Handlers
  const addStudyCornerBook = () => {
    const newBook: StudyCornerBook = { title: "", titleEn: "", author: "", authorEn: "", category: "গণিত", categoryEn: "Mathematics" };
    setDraft((prev) => ({
      ...prev,
      studyCornerBooks: [...(prev.studyCornerBooks || []), newBook],
    }));
  };

  const removeStudyCornerBook = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerBooks: (prev.studyCornerBooks || []).filter((_, i) => i !== index),
    }));
  };

  const updateStudyCornerBook = (index: number, field: keyof StudyCornerBook, value: string) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerBooks: (prev.studyCornerBooks || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addStudyCornerResource = () => {
    const newRes: StudyCornerResource = {
      title: "",
      titleEn: "",
      description: "",
      descriptionEn: "",
      icon: "BookOpen",
    };
    setDraft((prev) => ({
      ...prev,
      studyCornerResources: [...(prev.studyCornerResources || []), newRes],
    }));
  };

  const removeStudyCornerResource = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerResources: (prev.studyCornerResources || []).filter((_, i) => i !== index),
    }));
  };

  const updateStudyCornerResource = (index: number, field: keyof StudyCornerResource, value: string) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerResources: (prev.studyCornerResources || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addStudyCornerStat = () => {
    const newStat: StudyCornerStat = { label: "", labelEn: "", value: "", valueEn: "" };
    setDraft((prev) => ({
      ...prev,
      studyCornerStats: [...(prev.studyCornerStats || []), newStat],
    }));
  };

  const removeStudyCornerStat = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerStats: (prev.studyCornerStats || []).filter((_, i) => i !== index),
    }));
  };

  const updateStudyCornerStat = (index: number, field: keyof StudyCornerStat, value: string) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerStats: (prev.studyCornerStats || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addStudyCornerLink = () => {
    const newLink: StudyCornerLink = { name: "", nameEn: "", url: "https://", desc: "", descEn: "" };
    setDraft((prev) => ({
      ...prev,
      studyCornerLinks: [...(prev.studyCornerLinks || []), newLink],
    }));
  };

  const removeStudyCornerLink = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerLinks: (prev.studyCornerLinks || []).filter((_, i) => i !== index),
    }));
  };

  const updateStudyCornerLink = (index: number, field: keyof StudyCornerLink, value: string) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerLinks: (prev.studyCornerLinks || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addStudyCornerTip = () => {
    const newTip: StudyCornerTip = { tip: "", tipEn: "" };
    setDraft((prev) => ({
      ...prev,
      studyCornerTips: [...(prev.studyCornerTips || []), newTip],
    }));
  };

  const removeStudyCornerTip = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerTips: (prev.studyCornerTips || []).filter((_, i) => i !== index),
    }));
  };

  const updateStudyCornerTip = (index: number, field: "tip" | "tipEn", value: string) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerTips: (prev.studyCornerTips || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const [uploadingStudyCornerImage, setUploadingStudyCornerImage] = useState(false);
  const [studyCornerImageError, setStudyCornerImageError] = useState<string | null>(null);

  const handleStudyCornerImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setStudyCornerImageError("ছবির সাইজ ১০ MB এর বেশি হতে পারবে না।");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAllowed = validTypes.includes(file.type) || ["jpg", "jpeg", "png", "webp", "svg"].includes(ext);

    if (!isAllowed) {
      setStudyCornerImageError("শুধুমাত্র ছবি (JPG, PNG, WebP, SVG) ফাইল আপলোড করা যাবে।");
      return;
    }

    setStudyCornerImageError(null);
    setUploadingStudyCornerImage(true);

    try {
      const response = await api.uploadFile(file);
      if (response.success && response.data?.file_url) {
        updateField("studyCornerImage", response.data.file_url);
        setUploadingStudyCornerImage(false);
        return;
      }
    } catch { }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        updateField("studyCornerImage", result);
      }
      setUploadingStudyCornerImage(false);
    };
    reader.onerror = () => {
      setStudyCornerImageError("ছবি পড়তে ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
      setUploadingStudyCornerImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Code of Conduct & Dress Code Handlers
  const addCodeOfConductRule = () => {
    const nextIndex = (draft.codeOfConductRules || []).length + 1;
    const newRule: SchoolCodeOfConductRule = {
      id: "conduct_" + Date.now(),
      title: `${nextIndex}. `,
      titleEn: `${nextIndex}. `,
      description: "",
      descriptionEn: "",
      badge: "আচরণবিধি",
      badgeEn: "Conduct Rule",
    };
    setDraft((prev) => ({
      ...prev,
      codeOfConductRules: [...(prev.codeOfConductRules || []), newRule],
    }));
  };

  const removeCodeOfConductRule = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      codeOfConductRules: (prev.codeOfConductRules || []).filter((_, i) => i !== index),
    }));
  };

  const updateCodeOfConductRule = (index: number, field: keyof SchoolCodeOfConductRule, value: string) => {
    setDraft((prev) => ({
      ...prev,
      codeOfConductRules: (prev.codeOfConductRules || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const moveCodeOfConductRule = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.codeOfConductRules || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, codeOfConductRules: list };
    });
  };

  const translateCodeOfConductRule = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      codeOfConductRules: (prev.codeOfConductRules || []).map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          titleEn: item.titleEn || translateBnToEn(item.title),
          descriptionEn: item.descriptionEn || translateBnToEn(item.description),
          badgeEn: item.badgeEn || translateBnToEn(item.badge || ""),
        };
      }),
    }));
  };

  const resetCodeOfConductToDefault = () => {
    setDraft((prev) => ({
      ...prev,
      codeOfConductTitle: "শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা",
      codeOfConductTitleEn: "Student Code of Conduct & Dress Code",
      codeOfConductSubtitle: "বিদ্যালয়ের সুশৃঙ্খল ও আদর্শ শিক্ষণ পরিবেশ নিশ্চিত করতে শিক্ষার্থীদের জন্য আচরণবিধি ও পোশাক সংক্রান্ত নির্দেশিকা",
      codeOfConductSubtitleEn: "Guidelines on student conduct and dress code to ensure a disciplined and optimal learning environment",
      codeOfConductRules: [
        {
          id: "conduct_1",
          title: "১. ইউনিফর্ম ও ড্রেসকোড:",
          titleEn: "1. Uniform & Dress Code:",
          description: "সাদা শার্ট, নেভি ব্লু প্যান্ট/সালোয়ার, নির্ধারিত বিদ্যালয় মনোগ্রাম সম্বলিত ব্যাজ ও কালো জুতা পরিধান বাধ্যতামূলক।",
          descriptionEn: "White shirt, navy blue pants/salwar, school monogram badge, and black shoes are mandatory.",
          badge: "পোশাক নীতিমালা",
          badgeEn: "Dress Code",
        },
        {
          id: "conduct_2",
          title: "২. ক্লাসে উপস্থিতি:",
          titleEn: "2. Attendance Policy:",
          description: "সকল শিক্ষার্থীকে সকাল ৮:৫০ মিনিটের মধ্যে ক্যাম্পাসে উপস্থিত হতে হবে। ন্যূনতম ৮০% উপস্থিতি বাধ্যতামূলক।",
          descriptionEn: "All students must arrive at the campus by 8:50 AM. A minimum of 80% attendance is compulsory.",
          badge: "উপস্থিতি",
          badgeEn: "Attendance",
        },
        {
          id: "conduct_3",
          title: "৩. মোবাইল ফোন নিষেধাজ্ঞা:",
          titleEn: "3. Mobile Phone Policy:",
          description: "শ্রেণিকক্ষে শিক্ষার্থীদের স্মার্টফোন বা কোনো ইলেকট্রনিক গ্যাজেট আনা সম্পূর্ণ নিষিদ্ধ।",
          descriptionEn: "Bringing smartphones or electronic gadgets into classrooms is strictly prohibited.",
          badge: "শৃঙ্খলা বিধি",
          badgeEn: "Discipline",
        },
      ],
    }));
  };

  // Admission Seat Matrix Handlers
  const addAdmissionSeatItem = () => {
    const currentList = draft.admissionSeatMatrix || [];
    const nextNum = currentList.length + 1;
    const newItem: AdmissionSeatCapacityItem = {
      id: "seat_" + Date.now(),
      classBn: `নতুন শ্রেণি ${nextNum}`,
      classEn: `Class ${nextNum}`,
      sectionsBn: "ক ও খ শাখা",
      sectionsEn: "Sections A & B",
      seats: "50",
      suffixBn: "জন",
      suffixEn: "Seats",
      processBn: "অনলাইন আবেদন ও মেধা তালিকা",
      processEn: "Online Application & Merit List",
    };
    setDraft((prev) => ({
      ...prev,
      admissionSeatMatrix: [...(prev.admissionSeatMatrix || []), newItem],
    }));
  };

  const removeAdmissionSeatItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      admissionSeatMatrix: (prev.admissionSeatMatrix || []).filter((_, i) => i !== index),
    }));
  };

  const updateAdmissionSeatItem = (
    index: number,
    field: keyof AdmissionSeatCapacityItem,
    value: string
  ) => {
    setDraft((prev) => ({
      ...prev,
      admissionSeatMatrix: (prev.admissionSeatMatrix || []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const moveAdmissionSeatItem = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.admissionSeatMatrix || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, admissionSeatMatrix: list };
    });
  };

  const translateAdmissionSeatItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      admissionSeatMatrix: (prev.admissionSeatMatrix || []).map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          classEn: item.classEn || translateBnToEn(item.classBn),
          sectionsEn: item.sectionsEn || translateBnToEn(item.sectionsBn),
          suffixEn: item.suffixEn || translateBnToEn(item.suffixBn || "জন"),
          processEn: item.processEn || translateBnToEn(item.processBn),
        };
      }),
    }));
  };

  const resetAdmissionSeatMatrixToDefault = () => {
    if (window.confirm("আপনি কি শ্রেণিভিত্তিক আসন তালিকার ডিফল্ট ১৫টি শ্রেণি ও তথ্য পুনরায় লোড করতে চান?")) {
      setDraft((prev) => ({
        ...prev,
        admissionSeatMatrix: DEFAULT_ADMISSION_SEAT_MATRIX,
      }));
      setFeedback({
        type: "success",
        message: "শ্রেণিভিত্তিক আসন বিন্যাস তালিকায় ডিফল্ট ১৫টি শ্রেণি সফলভাবে লোড হয়েছে।",
      });
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!draft.schoolName.trim() || !draft.heroTitle.trim()) {
      setFeedback({ type: "error", message: "বিদ্যালয়ের নাম (ইংরেজি) এবং হোম ব্যানার শিরোনাম পূরণ করা আবশ্যক।" });
      return;
    }

    setSaving(true);
    try {
      const result = await saveWebsiteContent(draft);
      if (result.success) {
        setFeedback({
          type: "success",
          message: "অভিনন্দন! বাংলা ও ইংরেজি উভয় ভাষার সকল তথ্য সফলভাবে ব্যাকএন্ড ডাটাবেজে সংরক্ষিত ও প্রকাশিত হয়েছে। লাইভ ওয়েবসাইটে সরাসরি পরিবর্তন দেখতে পারেন।",
        });
      } else {
        setFeedback({
          type: "error",
          message: result.message || "ওয়েবসাইট কনটেন্ট ডাটাবেজে সংরক্ষণ করা যায়নি।",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: "সার্ভারে যোগাযোগ করা যায়নি: " + (err?.message || "নেটওয়ার্ক সমস্যা"),
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: ContentTab; label: string; icon: LucideIcon; badgeCount?: number }[] = [
    { id: "identity", label: "১. বিদ্যালয় পরিচয় ও লোগো", icon: School },
    {
      id: "ticker",
      label: "২. ব্রেকিং নোটিশ ও স্ক্রলিং টিকার",
      icon: Radio,
      badgeCount: (draft.tickerItems || []).filter((i) => i.isActive !== false).length,
    },
    { id: "hero_about", label: "৩. হোম ব্যানার ও ইতিহাস", icon: LayoutDashboard },
    { id: "leadership", label: "৪. প্রশাসন ও বাণী (Leadership)", icon: GraduationCap },
    {
      id: "teachers",
      label: "৫. শিক্ষক ও কর্মকর্তা পরিচিতি (Faculty & Staff)",
      icon: UserCheck,
      badgeCount: (draft.teachers || []).length,
    },
    { id: "statistics", label: "৬. পরিসংখ্যান ও সাফল্য", icon: Award },
    { id: "notices", label: "৭. নোটিশ বোর্ড", icon: Bell, badgeCount: (draft.notices || []).length },
    { id: "downloads", label: "৮. ডাউনলোড ও রুটিন", icon: Download, badgeCount: (draft.downloads || []).length },
    {
      id: "admission",
      label: "৯. ভর্তি তথ্য ও আসন",
      icon: BookOpen,
      badgeCount: (draft.admissionSeatMatrix || []).length,
    },
    { id: "gallery", label: "১০. ফটো গ্যালারি", icon: ImageIcon, badgeCount: (draft.gallery || []).length },
    { id: "study_co", label: "১১. স্টাডি কর্নার", icon: BookOpen },
    { id: "links", label: "১২. সরকারি লিঙ্ক", icon: LinkIcon, badgeCount: (draft.quickLinks || []).length },
    {
      id: "conduct",
      label: "১৩. শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা",
      icon: Shield,
      badgeCount: (draft.codeOfConductRules || []).length,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 font-sans">


      {/* Top Header */}
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006a4e] text-white">
              <Shield size={14} />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400">
              সুপার অ্যাডমিন ড্যাশবোর্ড · দ্বিভাষিক (বাংলা ও ইংরেজি) ওয়েবসাইট কনটেন্ট কন্ট্রোল
            </p>

            {isDirty ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <AlertCircle size={12} className="text-amber-600 animate-pulse" />
                <span>অসংরক্ষিত পরিবর্তন রয়েছে</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>ডাটাবেজ সিঙ্কড ও লাইভ</span>
              </span>
            )}
          </div>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            ওয়েবসাইটের সকল পেজের কনটেন্ট, ডায়নামিক টিকার ও মিডিয়া আপলোড
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            এই ড্যাশবোর্ড থেকে সুপার অ্যাডমিন সরাসরি লাইভ স্ক্রলিং টিকার, ছবি ও মনোগ্রাম আপলোড এবং দ্বিভাষিক কনটেন্ট পরিচালনা করতে পারেন।
          </p>
        </div>

        <div className="flex flex-wrap shrink-0 items-center gap-2">
          {/* Sync / Reload from Database */}
          <button
            type="button"
            disabled={syncing}
            onClick={handleReloadFromDatabase}
            title="ডাটাবেজ থেকে সর্বশেষ সংরক্ষিত কনটেন্ট রিফ্রেশ করুন"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-white px-2.5 py-2 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin text-[#006a4e]" : "text-[#006a4e]"} />
            <span className="hidden sm:inline">{syncing ? "সিঙ্ক হচ্ছে..." : "ডাটাবেজ সিঙ্ক"}</span>
          </button>




          {/* Live Page Jump Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDirectPageLinks((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <span>ওয়েবসাইট পেজ প্রিভিউ</span>
              <ChevronDown size={13} className={`transition ${showDirectPageLinks ? "rotate-180" : ""}`} />
            </button>

            {showDirectPageLinks && (
              <div
                className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                onClick={() => setShowDirectPageLinks(false)}
              >
                <div className="border-b px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  সরাসরি পেজ ভিজিট করুন
                </div>
                {[
                  { label: "প্রচ্ছদ (Home)", path: "/" },
                  { label: "আমাদের পরিচিতি (About)", path: "/about" },
                  { label: "প্রশাসন ও বাণী (Admin)", path: "/administration" },
                  { label: "শিক্ষকমণ্ডলী (Teachers)", path: "/teachers-list" },
                  { label: "নোটিশ বোর্ড (Notices)", path: "/notices" },
                  { label: "একাডেমিক ও রুটিন", path: "/academics" },
                  { label: "ভর্তি তথ্য (Admission)", path: "/admission" },
                  { label: "স্টাডি কর্নার (Study Corner)", path: "/study-corner" },
                  { label: "ফটো গ্যালারি (Gallery)", path: "/gallery" },
                  { label: "যোগাযোগ (Contact)", path: "/contact" },
                ].map((pg) => (
                  <a
                    key={pg.path}
                    href={pg.path}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e] dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    <span>{pg.label}</span>
                    <ExternalLink size={11} className="text-gray-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── TRANSLATION & LANGUAGE MANAGEMENT TOOLBAR ─── */}
      <div className="mb-6 rounded-lg border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 shadow-sm dark:border-emerald-800 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006a4e] text-white">
                <Globe size={14} />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400">
                দ্বিভাষিক ট্রান্সলেশন ও প্রদর্শন মোড (Translation Control)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
              বাংলা ও ইংরেজি ফিল্ডগুলো একসাথে বা পৃথকভাবে এডিট করুন এবং এক ক্লিকে স্বয়ংক্রিয় অনুবাদ করুন।
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setEditLangMode("bn")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${editLangMode === "bn"
                ? "bg-[#006a4e] text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                }`}
            >
              <span>🇧🇩 বাংলা</span>
            </button>

            <button
              type="button"
              onClick={() => setEditLangMode("en")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${editLangMode === "en"
                ? "bg-blue-700 text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                }`}
            >
              <span>🇬🇧 English</span>
            </button>

            <button
              type="button"
              onClick={() => setEditLangMode("dual")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${editLangMode === "dual"
                ? "bg-purple-700 text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                }`}
            >
              <Languages size={13} />
              <span>উভয় ভাষা (Side-by-Side)</span>
            </button>
          </div>
        </div>

        {/* Translation Actions */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-emerald-200/60 pt-3 dark:border-slate-700/60">
          <button
            type="button"
            disabled={translating}
            onClick={() => handleAutoTranslateAll("en")}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#00503a] disabled:opacity-60"
            title="বাংলা থেকে সমস্ত ফিল্ড ও নোটিশ ইংরেজিতে স্বয়ংক্রিয় অনুবাদ করুন"
          >
            {translating ? <Loader2 size={13} className="animate-spin" /> : null}
            <span>সম্পূর্ণ ওয়েবসাইট স্বয়ংক্রিয় ইংরেজি অনুবাদ (Auto-Translate to English)</span>
          </button>

          <button
            type="button"
            disabled={translating}
            onClick={handleTranslateCurrentTab}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-white px-3 py-1.5 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-50 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700"
          >
            <span>বর্তমান সেকশন অনুবাদ</span>
          </button>

          <button
            type="button"
            disabled={translating}
            onClick={() => handleAutoTranslateAll("bn")}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <Languages size={13} />
            <span>ইংরেজি থেকে বাংলায় রূপান্তর</span>
          </button>

          <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 size={14} className="text-[#006a4e]" />
            <span>দ্বিভাষিক সিঙ্ক সক্রিয়</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex overflow-x-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${isActive
                ? "bg-[#006a4e] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300"
                    }`}
                >
                  {tab.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          role="status"
          className={`mb-5 flex items-center justify-between rounded-md border p-3.5 text-xs font-semibold ${feedback.type === "success"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            : feedback.type === "error"
              ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
            }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <Check size={16} /> : feedback.type === "error" ? <AlertCircle size={16} /> : <Info size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-gray-500 hover:text-black dark:hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: IDENTITY */}
        {activeTab === "identity" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <School size={16} className="text-[#006a4e]" />
                ১. বিদ্যালয়ের পরিচয় ও প্রাতিষ্ঠানিক তথ্য
              </span>
              <span className="text-[11px] font-normal text-gray-500">
                {editLangMode === "dual" ? "বাংলা ও ইংরেজি উভয় ফিল্ড প্রদর্শিত হচ্ছে" : editLangMode === "bn" ? "বাংলা মোড" : "English Mode"}
              </span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* School Logo & Monogram Upload */}
              <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/30 p-3.5 dark:border-slate-700 dark:bg-slate-800/40">
                <ImageUploadField
                  label="বিদ্যালয়ের অফিশিয়াল লোগো / মনোগ্রাম (Official School Logo & Crest)"
                  labelEn="Official School Logo & Crest"
                  value={siteLogo}
                  onChange={async (newLogo) => {
                    await saveSiteLogo(newLogo);
                  }}
                  aspectRatio="square"
                  uploadEndpoint="logo"
                  helperText="ওয়েবসাইটের হেডার, ফুটার ও রেজাল্ট শিট/আইডি কার্ডে প্রদর্শিত হবে। স্বচ্ছ ব্যাকগ্রাউন্ডের PNG বা SVG ফাইল সেরা।"
                  presets={[{ label: "ডিফল্ট লোগো", url: "/images/logo.png" }]}
                />
              </div>

              {/* School Name */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      বিদ্যালয়ের নাম (বাংলায়) *
                    </label>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("schoolNameBn", "schoolName")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → Translate to English
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.schoolNameBn}
                    onChange={(e) => updateField("schoolNameBn", e.target.value)}
                    placeholder="যেমন: এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়"
                    className={inputClass}
                    required
                  />
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      School Name (English) *
                    </label>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToBn("schoolName", "schoolNameBn")}
                      className="text-[10px] font-bold text-blue-700 hover:underline"
                    >
                      → বাংলায় অনুবাদ
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.schoolName}
                    onChange={(e) => updateField("schoolName", e.target.value)}
                    placeholder="e.g. MK Government Model High School"
                    className={inputClass}
                    required
                  />
                </div>
              )}

              {/* Motto */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      বিদ্যালয়ের মূলমন্ত্র (বাংলায়)
                    </label>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("mottoBn", "motto")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → Translate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.mottoBn}
                    onChange={(e) => updateField("mottoBn", e.target.value)}
                    placeholder="জ্ঞান, শৃঙ্খলা ও মনুষ্যত্ব"
                    className={inputClass}
                  />
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      School Motto (English)
                    </label>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToBn("motto", "mottoBn")}
                      className="text-[10px] font-bold text-blue-700 hover:underline"
                    >
                      → বাংলায়
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.motto}
                    onChange={(e) => updateField("motto", e.target.value)}
                    placeholder="Education, Discipline and Humanity"
                    className={inputClass}
                  />
                </div>
              )}

              {/* EIIN & Code */}
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                ইআইআইএন (EIIN) *
                <input
                  type="text"
                  value={draft.eiin}
                  onChange={(e) => updateField("eiin", e.target.value)}
                  placeholder="123456"
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                বিদ্যালয় কোড (School Code)
                <input
                  type="text"
                  value={draft.schoolCode}
                  onChange={(e) => updateField("schoolCode", e.target.value)}
                  placeholder="1001"
                  className={inputClass}
                />
              </label>

              {/* Board Name */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    সংশ্লিষ্ট শিক্ষা বোর্ড (বাংলা)
                    <input
                      type="text"
                      value={draft.boardName}
                      onChange={(e) => updateField("boardName", e.target.value)}
                      placeholder="ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Education Board (English)
                    <input
                      type="text"
                      value={draft.boardNameEn || ""}
                      onChange={(e) => updateField("boardNameEn", e.target.value)}
                      placeholder="Board of Intermediate and Secondary Education, Dhaka"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* District */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    জেলা ও বিভাগ (বাংলা)
                    <input
                      type="text"
                      value={draft.district}
                      onChange={(e) => updateField("district", e.target.value)}
                      placeholder="ঢাকা, বাংলাদেশ"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    District & Division (English)
                    <input
                      type="text"
                      value={draft.districtEn || ""}
                      onChange={(e) => updateField("districtEn", e.target.value)}
                      placeholder="Dhaka, Bangladesh"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* Established Year */}
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                স্থাপিত সন (Established Year)
                <input
                  type="text"
                  value={draft.establishedYear}
                  onChange={(e) => {
                    updateField("establishedYear", e.target.value);
                    updateField("establishedYearEn", toEnglishDigits(e.target.value));
                  }}
                  placeholder="1985"
                  className={inputClass}
                />
              </label>

              {/* Phone */}
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                ফোন নম্বর
                <input
                  type="text"
                  value={draft.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+880 2 1234 5678"
                  className={inputClass}
                />
              </label>

              {/* Email */}
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                ইমেইল
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="info@mkschool.edu.bd"
                  className={inputClass}
                />
              </label>

              {/* Office Hours */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    অফিস সময়সূচী (বাংলা)
                    <input
                      type="text"
                      value={draft.officeHours}
                      onChange={(e) => updateField("officeHours", e.target.value)}
                      placeholder="রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Office Hours (English)
                    <input
                      type="text"
                      value={draft.officeHoursEn || ""}
                      onChange={(e) => updateField("officeHoursEn", e.target.value)}
                      placeholder="Sunday - Thursday: 9:00 AM - 4:00 PM"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* Address */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    বিদ্যালয়ের পূর্ণ ঠিকানা (বাংলা)
                    <input
                      type="text"
                      value={draft.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Full School Address (English)
                    <input
                      type="text"
                      value={draft.addressEn || ""}
                      onChange={(e) => updateField("addressEn", e.target.value)}
                      placeholder="College Road, Dhanmondi, Dhaka-1205, Bangladesh"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* Breaking News Ticker */}
              {(editLangMode === "bn" || editLangMode === "dual") && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      জরুরি স্ক্রলিং সংবাদ / ব্রেকিং নিউজ (বাংলায়)
                    </label>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("breakingNews", "breakingNewsEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → Translate to English
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.breakingNews}
                    onChange={(e) => updateField("breakingNews", e.target.value)}
                    placeholder="২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি আবেদন চলমান রয়েছে..."
                    className={inputClass}
                  />
                </div>
              )}

              {(editLangMode === "en" || editLangMode === "dual") && (
                <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Emergency Scrolling News / Breaking News (English)
                    <input
                      type="text"
                      value={draft.breakingNewsEn || ""}
                      onChange={(e) => updateField("breakingNewsEn", e.target.value)}
                      placeholder="Admission applications for Classes 6 to 9 are ongoing..."
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* Direct Link to Dedicated Ticker Tab */}
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50/40 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Radio size={14} className="text-red-600 animate-pulse" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    একাধিক ব্রেকিং নোটিশ, গতি নিয়ন্ত্রণ ও লাইভ প্রিভিউ পরিচালনা করতে চান?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("ticker")}
                  className="inline-flex items-center gap-1 rounded bg-[#006a4e] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <span>ডায়নামিক টিকার সেকশনে যান</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: TICKER & BREAKING NEWS */}
        {activeTab === "ticker" && (
          <section className="space-y-6">
            {/* 1. Live Running Ticker Interactive Preview */}
            <div className="rounded-lg border-2 border-emerald-600/40 bg-white p-5 shadow-xs dark:border-emerald-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#da291c] text-white">
                    <Radio size={14} className="animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      লাইভ টিকার প্রিভিউ (Live Ticker Running Preview)
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      ওয়েবসাইটে ভিজিটররা ঠিক যেভাবে নোটিশ স্ক্রলিং দেখতে পাবেন (কার্সর রাখলে স্ক্রল থেমে যাবে)।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                    গতি: {draft.tickerSpeed === "fast" ? "দ্রুত (Fast)" : draft.tickerSpeed === "slow" ? "ধীর (Slow)" : "স্বাভাবিক (Normal)"}
                  </span>
                </div>
              </div>

              {/* Ticker Bar Visual Demo */}
              <div className="mt-4 rounded-md border border-[#ffd700]/40 bg-[#fffbeb] p-2 shadow-inner text-gray-900 overflow-hidden">
                <div className="flex items-center">
                  <div className="flex shrink-0 items-center gap-1.5 rounded-sm bg-[#da291c] px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                    <Bell size={13} className="animate-bounce" />
                    <span>
                      {editLangMode === "en"
                        ? draft.tickerLabelEn || "Urgent Notice:"
                        : draft.tickerLabel || "জরুরি নোটিশ:"}
                    </span>
                  </div>

                  <div className="relative mx-3 flex-1 overflow-hidden text-xs font-semibold sm:text-sm">
                    <div
                      className="animate-ticker-horizontal items-center gap-12"
                      style={{
                        "--ticker-h-duration":
                          draft.tickerSpeed === "fast" ? "18s" : draft.tickerSpeed === "slow" ? "45s" : "28s",
                      } as React.CSSProperties}
                    >
                      {/* Repeat items for continuous infinite scroll */}
                      {[
                        ...(draft.tickerItems || []).filter((i) => i.isActive !== false),
                        ...(draft.tickerItems || []).filter((i) => i.isActive !== false),
                      ].map((item, idx) => (
                        <span key={idx} className="shrink-0 inline-flex items-center gap-1.5">
                          <span className="text-amber-500 font-bold">★</span>
                          {item.badge && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.priority === "urgent"
                                ? "bg-[#da291c] text-white"
                                : item.priority === "important"
                                  ? "bg-amber-200 text-amber-900"
                                  : "bg-emerald-100 text-[#006a4e]"
                                }`}
                            >
                              {editLangMode === "en" ? item.badgeEn || item.badge : item.badge}
                            </span>
                          )}
                          <span>{editLangMode === "en" ? item.textEn || item.text : item.text}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Global Ticker Settings */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400 flex items-center gap-2 border-b pb-2.5 dark:border-slate-700">
                <Sliders size={14} />
                টিকার কন্ট্রোল ও সেটিংসমূহ (Ticker Controls & Settings)
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Ticker Label (BN) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    টিকার ব্যাজ শিরোনাম (বাংলা)
                    <input
                      type="text"
                      value={draft.tickerLabel || "জরুরি নোটিশ:"}
                      onChange={(e) => updateField("tickerLabel", e.target.value)}
                      placeholder="জরুরি নোটিশ:"
                      className={inputClass}
                    />
                  </label>
                </div>

                {/* Ticker Label (EN) */}
                <div>
                  <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                    Ticker Badge Title (English)
                    <input
                      type="text"
                      value={draft.tickerLabelEn || "Urgent Notice:"}
                      onChange={(e) => updateField("tickerLabelEn", e.target.value)}
                      placeholder="Urgent Notice:"
                      className={inputClass}
                    />
                  </label>
                </div>

                {/* Ticker Speed */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    স্ক্রলিং গতি (Ticker Speed)
                    <select
                      value={draft.tickerSpeed || "normal"}
                      onChange={(e) => updateField("tickerSpeed", e.target.value as any)}
                      className={inputClass}
                    >
                      <option value="slow">ধীর (Slow - ৪২ সেকেন্ড)</option>
                      <option value="normal">স্বাভাবিক (Normal - ৩০ সেকেন্ড)</option>
                      <option value="fast">দ্রুত (Fast - ১৮ সেকেন্ড)</option>
                    </select>
                  </label>
                </div>

                {/* Include notices toggle */}
                <div className="sm:col-span-3 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="tickerIncludeNotices"
                      checked={draft.tickerIncludeNotices !== false}
                      onChange={(e) => updateField("tickerIncludeNotices", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#006a4e] focus:ring-[#006a4e]"
                    />
                    <label htmlFor="tickerIncludeNotices" className="cursor-pointer text-xs font-semibold text-gray-800 dark:text-gray-200">
                      নোটিশ বোর্ডের সাম্প্রতিক নোটিশসমূহ স্বয়ংক্রিয়ভাবে টিকারে অন্তর্ভুক্ত করুন (Auto-sync Recent Notices)
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {draft.tickerIncludeNotices !== false ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Disabled)"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Dynamic Ticker Announcements List (CRUD) */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell size={16} className="text-[#006a4e]" />
                    <span>ডায়নামিক ব্রেকিং নোটিশ তালিকা ({(draft.tickerItems || []).length}টি আইটেম)</span>
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    এখানে যে কোনো সংখ্যক ব্রেকিং নিউজ যোগ, সক্রিয়/নিষ্ক্রিয় ও সাজানো যাবে।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addTickerItem}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন ব্রেকিং নোটিশ যোগ করুন</span>
                </button>
              </div>

              {/* Ticker Items List */}
              <div className="mt-4 space-y-3.5">
                {(draft.tickerItems || []).length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-slate-700 dark:text-gray-400">
                    <p className="text-sm font-semibold">কোনো কাস্টম ব্রেকিং নোটিশ যোগ করা হয়নি।</p>
                    <p className="mt-1 text-xs">উপরে 'নতুন ব্রেকিং নোটিশ যোগ করুন' বাটনে ক্লিক করে প্রথম নোটিশ যোগ করুন।</p>
                  </div>
                ) : (
                  (draft.tickerItems || []).map((item, index) => (
                    <div
                      key={item.id || index}
                      className={`rounded-lg border p-4 transition ${item.isActive !== false
                        ? "border-gray-200 bg-[#fbfdfc] dark:border-slate-700 dark:bg-slate-800"
                        : "border-gray-200 bg-gray-100 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#006a4e] dark:text-emerald-400">
                            নোটিশ #{index + 1}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.priority === "urgent"
                              ? "bg-[#da291c] text-white"
                              : item.priority === "important"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-emerald-100 text-[#006a4e]"
                              }`}
                          >
                            {item.priority === "urgent"
                              ? "জরুরি (Urgent)"
                              : item.priority === "important"
                                ? "গুরুত্বপূর্ণ (Important)"
                                : "সাধারণ (Normal)"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Active / Inactive Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleTickerItem(index)}
                            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition ${item.isActive !== false
                              ? "bg-emerald-100 text-[#006a4e] hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300"
                              }`}
                          >
                            {item.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            <span>{item.isActive !== false ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                          </button>

                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveTickerItem(index, "up")}
                            title="উপরে নিন"
                            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                          >
                            <ArrowUp size={13} />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={index === (draft.tickerItems || []).length - 1}
                            onClick={() => moveTickerItem(index, "down")}
                            title="নিচে নিন"
                            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                          >
                            <ArrowDown size={13} />
                          </button>

                          {/* Auto Translate */}
                          <button
                            type="button"
                            onClick={() => translateTickerItem(index)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#006a4e] hover:underline dark:text-emerald-400"
                          >
                            <span>অনুবাদ</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removeTickerItem(index)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-0.5 ml-1"
                          >
                            <Trash2 size={13} />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Text (BN) */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            নোটিশ বার্তা (বাংলায়) *
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) => updateTickerItem(index, "text", e.target.value)}
                              placeholder="যেমন: ২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি আবেদন চলমান রয়েছে..."
                              className={inputClass}
                              required
                            />
                          </label>
                        </div>

                        {/* Text (EN) */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                            Notice Text (English)
                            <input
                              type="text"
                              value={item.textEn || ""}
                              onChange={(e) => updateTickerItem(index, "textEn", e.target.value)}
                              placeholder="e.g. Admission applications for Academic Year 2026 are ongoing..."
                              className={inputClass}
                            />
                          </label>
                        </div>

                        {/* Badge Tag (BN) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            ট্যাগ / ব্যাজ (বাংলায়)
                            <input
                              type="text"
                              value={item.badge || ""}
                              onChange={(e) => updateTickerItem(index, "badge", e.target.value)}
                              placeholder="যেমন: ভর্তি, পরীক্ষা, জরুরি, নোটিশ"
                              className={inputClass}
                            />
                          </label>
                        </div>

                        {/* Badge Tag (EN) */}
                        <div>
                          <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                            Tag / Badge (English)
                            <input
                              type="text"
                              value={item.badgeEn || ""}
                              onChange={(e) => updateTickerItem(index, "badgeEn", e.target.value)}
                              placeholder="e.g. Admission, Exam, Urgent, Event"
                              className={inputClass}
                            />
                          </label>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            অগ্রাধিকার (Priority Level)
                            <select
                              value={item.priority || "normal"}
                              onChange={(e) => updateTickerItem(index, "priority", e.target.value as any)}
                              className={inputClass}
                            >
                              <option value="urgent">জরুরি (Urgent - লাল ব্যাজ)</option>
                              <option value="important">গুরুত্বপূর্ণ (Important - সোনালী ব্যাজ)</option>
                              <option value="normal">সাধারণ (Normal - সবুজ ব্যাজ)</option>
                            </select>
                          </label>
                        </div>

                        {/* Link / URL */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            ক্লিক অ্যাকশন লিংক (Optional Link URL)
                            <input
                              type="text"
                              value={item.link || ""}
                              onChange={(e) => updateTickerItem(index, "link", e.target.value)}
                              placeholder="যেমন: /admission অথবা /notices অথবা https://..."
                              className={inputClass}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: HERO & ABOUT */}
        {activeTab === "hero_about" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LayoutDashboard size={16} className="text-[#006a4e]" />
                ৩. হোম ব্যানার, পরিচিতি ও লক্ষ্য-উদ্দেশ্য (Bilingual)
              </span>
              <button
                type="button"
                onClick={handleTranslateCurrentTab}
                className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <span>বর্তমান সেকশন অনুবাদ</span>
              </button>
            </h2>

            <div className="mt-4 space-y-4">
              {/* Hero Title */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(editLangMode === "bn" || editLangMode === "dual") && (
                  <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      হোম ব্যানার প্রধান শিরোনাম (বাংলায়) *
                      <input
                        type="text"
                        value={draft.heroTitle}
                        onChange={(e) => updateField("heroTitle", e.target.value)}
                        className={inputClass}
                        required
                      />
                    </label>
                  </div>
                )}

                {(editLangMode === "en" || editLangMode === "dual") && (
                  <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Home Banner Main Title (English) *
                      <input
                        type="text"
                        value={draft.heroTitleEn || ""}
                        onChange={(e) => updateField("heroTitleEn", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Hero Subtitle */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(editLangMode === "bn" || editLangMode === "dual") && (
                  <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      হোম ব্যানার উপ-শিরোনাম (বাংলায়)
                      <input
                        type="text"
                        value={draft.heroSubtitle}
                        onChange={(e) => updateField("heroSubtitle", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}

                {(editLangMode === "en" || editLangMode === "dual") && (
                  <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Home Banner Subtitle (English)
                      <input
                        type="text"
                        value={draft.heroSubtitleEn || ""}
                        onChange={(e) => updateField("heroSubtitleEn", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Hero Description */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(editLangMode === "bn" || editLangMode === "dual") && (
                  <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      হোম ব্যানার বিবরণ (বাংলায়)
                      <textarea
                        rows={3}
                        value={draft.heroDescription}
                        onChange={(e) => updateField("heroDescription", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                )}

                {(editLangMode === "en" || editLangMode === "dual") && (
                  <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Home Banner Description (English)
                      <textarea
                        rows={3}
                        value={draft.heroDescriptionEn || ""}
                        onChange={(e) => updateField("heroDescriptionEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Hero Image */}
              <div className="pt-2">
                <ImageUploadField
                  label="হোম ব্যানার কভার ছবি (Home Hero Banner Image)"
                  value={draft.heroImage}
                  onChange={(url) => updateField("heroImage", url)}
                  aspectRatio="banner"
                  helperText="ওয়েবসাইটের হোমপেজের শীর্ষ ব্যানার ছবি। ডিভাইস থেকে আপলোড করুন বা লিংক দিন। প্রস্তাবিত অনুপাত ১৬:৯ বা ব্যানার।"
                  presets={[
                    { label: "Default Banner", url: "/images/bgimage.jpg" },
                    { label: "School Campus", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1400" },
                    { label: "Academic Building", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1400" },
                    { label: "Students in Library", url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1400" },
                  ]}
                />
              </div>

              {/* About Title & Description */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        পরিচিতি পেজের শিরোনাম (বাংলায়)
                        <input
                          type="text"
                          value={draft.aboutTitle}
                          onChange={(e) => updateField("aboutTitle", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  )}

                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        About Page Title (English)
                        <input
                          type="text"
                          value={draft.aboutTitleEn || ""}
                          onChange={(e) => updateField("aboutTitleEn", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(editLangMode === "bn" || editLangMode === "dual") && (
                  <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      বিদ্যালয় পরিচিতি বিবরণ (বাংলায়)
                      <textarea
                        rows={4}
                        value={draft.aboutText}
                        onChange={(e) => updateField("aboutText", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                )}

                {(editLangMode === "en" || editLangMode === "dual") && (
                  <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      About Us Description (English)
                      <textarea
                        rows={4}
                        value={draft.aboutTextEn || ""}
                        onChange={(e) => updateField("aboutTextEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(editLangMode === "bn" || editLangMode === "dual") && (
                  <div className="rounded-md border border-emerald-100 bg-emerald-50/20 p-2.5 dark:border-emerald-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      বিদ্যালয়ের ইতিহাস (History in Bengali)
                      <textarea
                        rows={3}
                        value={draft.historyText}
                        onChange={(e) => updateField("historyText", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                )}

                {(editLangMode === "en" || editLangMode === "dual") && (
                  <div className="rounded-md border border-blue-100 bg-blue-50/20 p-2.5 dark:border-blue-900/30">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      History of the School (English)
                      <textarea
                        rows={3}
                        value={draft.historyTextEn || ""}
                        onChange={(e) => updateField("historyTextEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Mission & Vision */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      আমাদের লক্ষ্য (Mission in Bengali)
                      <textarea
                        rows={2}
                        value={draft.missionText}
                        onChange={(e) => updateField("missionText", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  )}
                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2">
                      Our Mission (English)
                      <textarea
                        rows={2}
                        value={draft.missionTextEn || ""}
                        onChange={(e) => updateField("missionTextEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  )}
                </div>

                <div>
                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      আমাদের দৃষ্টিভঙ্গি (Vision in Bengali)
                      <textarea
                        rows={2}
                        value={draft.visionText}
                        onChange={(e) => updateField("visionText", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  )}
                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2">
                      Our Vision (English)
                      <textarea
                        rows={2}
                        value={draft.visionTextEn || ""}
                        onChange={(e) => updateField("visionTextEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: LEADERSHIP / ADMINISTRATION & MESSAGES (DYNAMIC WITH STAFF DIRECTORY) */}
        {activeTab === "leadership" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#006a4e]" />
                  <span>৪. প্রশাসন ও শীর্ষ নেতৃবৃন্দের বাণী (Leadership & Administration)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  সফটওয়্যারের Staff & Faculty Directory (/list/staff) থেকে প্রধান শিক্ষক ও নেতৃবৃন্দের তথ্য সরাসরি নির্বাচন ও অটো-সিঙ্ক করুন, এবং প্রতিটি তথ্য সম্পূর্ণ কাস্টমাইজ ও সম্পাদনা করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={syncingStaff}
                  onClick={handleSyncLeadershipFromStaffDirectory}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#006a4e] bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#006a4e] shadow-xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 disabled:opacity-60 transition"
                  title="Staff & Faculty Directory থেকে প্রধান শিক্ষক, সহকারী প্রধান শিক্ষক ও নেতৃবৃন্দের তথ্য স্বয়ংক্রিয়ভাবে সিঙ্ক করুন"
                >
                  <RefreshCw size={13} className={syncingStaff ? "animate-spin text-[#006a4e]" : "text-[#006a4e]"} />
                  <span>Staff Directory থেকে অটো-সিঙ্ক</span>
                </button>

                <Link
                  to="/list/staff"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  title="সরাসরি সফটওয়্যারের Staff & Faculty Directory ওপেন করুন"
                >
                  <ExternalLink size={13} />
                  <span>Staff Directory ওপেন</span>
                </Link>

                <button
                  type="button"
                  onClick={handleTranslateCurrentTab}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  title="বাণী ও পদবী স্বয়ংক্রিয় ইংরেজি অনুবাদ করুন"
                >
                  <span>বাণী ও পদবী অনুবাদ</span>
                </button>
              </div>
            </div>

            {/* Live Staff & Faculty Directory Integration Banner */}
            <div className="mt-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50/50 p-4 text-xs dark:border-emerald-800/40 dark:from-slate-850 dark:via-slate-800 dark:to-slate-900">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-sm">Staff & Faculty Directory লাইভ ডায়নামিক সংযোগ (Live Dynamic Leadership Sync)</span>
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                    এই সেকশনটি সরাসরি সফটওয়্যার অ্যাডমিন ড্যাশবোর্ডের <span className="font-bold text-emerald-800 dark:text-emerald-300">Staff & Faculty Directory</span> (/list/staff)-এর সাথে সংযুক্ত। নিচের ড্রপডাউনগুলো থেকে যেকোনো শিক্ষক বা কর্মকর্তাকে নির্বাচন করলেই নাম, ছবি, পদবী ও যোগ্যতা স্বয়ংক্রিয়ভাবে লোড হবে। একই সাথে প্রতিটি তথ্য আপনি সরাসরি সম্পাদনা বা কাস্টমাইজ করতে পারবেন।
                  </p>
                </div>

                <button
                  type="button"
                  disabled={syncingStaff}
                  onClick={handleSyncLeadershipFromStaffDirectory}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a] disabled:opacity-60 transition"
                >
                  <Sparkles size={13} className="text-amber-300" />
                  <span>এক ক্লিকে সকল নেতৃত্ব তথ্য সিঙ্ক</span>
                </button>
              </div>

              {/* Dynamic Badges */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/80">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-2xs dark:bg-slate-800 dark:text-emerald-300">
                  <Users size={13} className="text-[#006a4e]" />
                  <span>মোট স্টাফ ও শিক্ষক:</span>
                  <span className="text-[#006a4e] dark:text-emerald-400 font-extrabold">{liveStaffStats?.total ?? liveStaffList.length} জন</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 shadow-2xs dark:bg-slate-800 dark:text-blue-300">
                  <GraduationCap size={13} className="text-blue-700" />
                  <span>শিক্ষকমণ্ডলী:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{liveStaffStats?.teaching ?? liveStaffList.filter(s => s.type === "TEACHING").length} জন</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-purple-900 shadow-2xs dark:bg-slate-800 dark:text-purple-300">
                  <Shield size={13} className="text-purple-700" />
                  <span>প্রশাসন:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{liveStaffStats?.admin ?? liveStaffList.filter(s => s.type === "ADMINISTRATIVE").length} জন</span>
                </span>
              </div>
            </div>

            {/* 1. PRINCIPAL / HEADMASTER */}
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#006a4e] text-white">
                    <GraduationCap size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#006a4e] dark:text-emerald-400">
                      ১. প্রধান শিক্ষক / অধ্যক্ষ (Principal / Headmaster)
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      বিদ্যালয়ের প্রধান নির্বাহী ও অ্যাকাডেমিক প্রধানের পরিচিতি ও বাণী
                    </p>
                  </div>
                </div>

                {/* Quick Selection Dropdown from Staff Directory */}
                {liveStaffList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300 shrink-0">
                      Staff Directory থেকে বেছে নিন:
                    </span>
                    <select
                      onChange={(e) => handleSelectPrincipalFromStaff(e.target.value)}
                      defaultValue=""
                      className="rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-900 shadow-2xs outline-none focus:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-300"
                    >
                      <option value="">-- ডিরেক্টরি থেকে নির্বাচন করুন --</option>
                      {liveStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.surname || ""} — {s.designation} ({s.staff_no})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between mb-1">
                    <span>প্রধান শিক্ষকের নাম (বাংলায়) *</span>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("principalName", "principalNameEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → English অনুবাদ
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.principalName}
                    onChange={(e) => updateField("principalName", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: মোঃ আবদুর রহমান"
                    required
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Principal Name (English) *
                  <input
                    type="text"
                    value={draft.principalNameEn || ""}
                    onChange={(e) => updateField("principalNameEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Md. Abdur Rahman"
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পদবি (বাংলায়)
                  <input
                    type="text"
                    value={draft.principalTitle}
                    onChange={(e) => updateField("principalTitle", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: প্রধান শিক্ষক"
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Title / Designation (English)
                  <input
                    type="text"
                    value={draft.principalTitleEn || ""}
                    onChange={(e) => updateField("principalTitleEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Headmaster / Principal"
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  শিক্ষাগত যোগ্যতা (বাংলায়)
                  <input
                    type="text"
                    value={draft.principalQualification}
                    onChange={(e) => updateField("principalQualification", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: এম.এ (ইংরেজি), বি.এড (১ম শ্রেণি)"
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Educational Qualification (English)
                  <input
                    type="text"
                    value={draft.principalQualificationEn || ""}
                    onChange={(e) => updateField("principalQualificationEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. M.A (English), B.Ed (1st Class)"
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  যোগাযোগ ফোন নম্বর (Phone)
                  <input
                    type="text"
                    value={draft.principalPhone || ""}
                    onChange={(e) => updateField("principalPhone", e.target.value)}
                    className={inputClass}
                    placeholder="+880 1712..."
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  অফিসিয়াল ইমেইল (Email)
                  <input
                    type="email"
                    value={draft.principalEmail || ""}
                    onChange={(e) => updateField("principalEmail", e.target.value)}
                    className={inputClass}
                    placeholder="headmaster@school.edu.bd"
                  />
                </label>

                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="প্রধান শিক্ষকের ছবি (Headmaster Photo)"
                    value={draft.principalPhoto}
                    onChange={(url) => updateField("principalPhoto", url)}
                    aspectRatio="portrait"
                    helperText="প্রধান শিক্ষকের পাসপোর্ট সাইজ বা পোর্ট্রেট ছবি আপলোড করুন।"
                    presets={[
                      { label: "Formal Portrait", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400" },
                      { label: "Avatar", url: "/images/avatar.png" },
                    ]}
                  />
                </div>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span>প্রধান শিক্ষকের শুভেচ্ছা বাণী (বাংলায়)</span>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("principalMessage", "principalMessageEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → বাণী ইংরেজিতে রূপান্তর
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={draft.principalMessage}
                    onChange={(e) => updateField("principalMessage", e.target.value)}
                    className={textareaClass}
                    placeholder="শিক্ষার্থীদের উদ্দেশ্যে প্রধান শিক্ষকের শুভেচ্ছা বক্তব্য..."
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                  Principal's Message (English)
                  <textarea
                    rows={4}
                    value={draft.principalMessageEn || ""}
                    onChange={(e) => updateField("principalMessageEn", e.target.value)}
                    className={textareaClass}
                    placeholder="Principal's message for students, guardians, and visitors..."
                  />
                </label>
              </div>
            </div>

            {/* 2. ASSISTANT PRINCIPAL */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white">
                    <UserCheck size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      ২. সহকারী প্রধান শিক্ষক (Assistant Headmaster / Vice Principal)
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      সহকারী প্রধান শিক্ষকের পরিচিতি ও দিকনির্দেশনামূলক বাণী
                    </p>
                  </div>
                </div>

                {/* Quick Selection Dropdown from Staff Directory */}
                {liveStaffList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 shrink-0">
                      Staff Directory থেকে বেছে নিন:
                    </span>
                    <select
                      onChange={(e) => handleSelectAsstPrincipalFromStaff(e.target.value)}
                      defaultValue=""
                      className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs outline-none focus:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">-- ডিরেক্টরি থেকে নির্বাচন করুন --</option>
                      {liveStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.surname || ""} — {s.designation} ({s.staff_no})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between mb-1">
                    <span>সহকারী প্রধান শিক্ষকের নাম (বাংলায়)</span>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("asstPrincipalName", "asstPrincipalNameEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → English অনুবাদ
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.asstPrincipalName}
                    onChange={(e) => updateField("asstPrincipalName", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: মুহাম্মদ কামরুল হাসান"
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Assistant Principal Name (English)
                  <input
                    type="text"
                    value={draft.asstPrincipalNameEn || ""}
                    onChange={(e) => updateField("asstPrincipalNameEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Muhammad Kamrul Hasan"
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পদবি (বাংলায়)
                  <input
                    type="text"
                    value={draft.asstPrincipalTitle || "সহকারী প্রধান শিক্ষক"}
                    onChange={(e) => updateField("asstPrincipalTitle", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: সহকারী প্রধান শিক্ষক"
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Title (English)
                  <input
                    type="text"
                    value={draft.asstPrincipalTitleEn || "Assistant Headmaster"}
                    onChange={(e) => updateField("asstPrincipalTitleEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Assistant Headmaster"
                  />
                </label>

                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="সহকারী প্রধান শিক্ষকের ছবি (Assistant Headmaster Photo)"
                    value={draft.asstPrincipalPhoto || ""}
                    onChange={(url) => updateField("asstPrincipalPhoto", url)}
                    aspectRatio="portrait"
                    helperText="সহকারী প্রধান শিক্ষকের পোর্ট্রেট ছবি আপলোড করুন।"
                    presets={[
                      { label: "Asst. Principal", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400" },
                      { label: "Avatar", url: "/images/avatar.png" },
                    ]}
                  />
                </div>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span>সহকারী প্রধান শিক্ষকের বাণী (বাংলায়)</span>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("asstPrincipalMessage", "asstPrincipalMessageEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → বাণী অনুবাদ
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={draft.asstPrincipalMessage}
                    onChange={(e) => updateField("asstPrincipalMessage", e.target.value)}
                    className={textareaClass}
                    placeholder="সহকারী প্রধান শিক্ষকের দিকনির্দেশনামূলক বাণী..."
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                  Assistant Principal's Message (English)
                  <textarea
                    rows={3}
                    value={draft.asstPrincipalMessageEn || ""}
                    onChange={(e) => updateField("asstPrincipalMessageEn", e.target.value)}
                    className={textareaClass}
                    placeholder="Assistant Principal's guidance message..."
                  />
                </label>
              </div>
            </div>

            {/* 3. SMC PRESIDENT & MANAGING COMMITTEE */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3 dark:border-amber-900/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white">
                    <Shield size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400">
                      ৩. সভাপতি, পরিচালনা পর্ষদ / ম্যানেজিং কমিটি (SMC President & Governing Body)
                    </h3>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      ম্যানেজিং কমিটির সভাপতি মহোদয়ের পরিচিতি ও দিকনির্দেশনামূলক বাণী
                    </p>
                  </div>
                </div>

                {/* Quick Selection Dropdown from Staff Directory */}
                {liveStaffList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 shrink-0">
                      Staff Directory থেকে বেছে নিন:
                    </span>
                    <select
                      onChange={(e) => handleSelectSmcPresidentFromStaff(e.target.value)}
                      defaultValue=""
                      className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs outline-none focus:border-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300"
                    >
                      <option value="">-- ডিরেক্টরি থেকে নির্বাচন করুন --</option>
                      {liveStaffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.surname || ""} — {s.designation} ({s.staff_no})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between mb-1">
                    <span>সভাপতির নাম (বাংলায়)</span>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("smcPresidentName", "smcPresidentNameEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → English অনুবাদ
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.smcPresidentName}
                    onChange={(e) => updateField("smcPresidentName", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: প্রফেসর ড. মুহাম্মদ আশরাফুল আলম"
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  President Name (English)
                  <input
                    type="text"
                    value={draft.smcPresidentNameEn || ""}
                    onChange={(e) => updateField("smcPresidentNameEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Prof. Dr. Muhammad Ashraful Alam"
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পদবি (বাংলায়)
                  <input
                    type="text"
                    value={draft.smcPresidentTitle || "সভাপতি, ম্যানেজিং কমিটি"}
                    onChange={(e) => updateField("smcPresidentTitle", e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: সভাপতি, ম্যানেজিং কমিটি"
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Title (English)
                  <input
                    type="text"
                    value={draft.smcPresidentTitleEn || "President, Managing Committee"}
                    onChange={(e) => updateField("smcPresidentTitleEn", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. President, Managing Committee"
                  />
                </label>

                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="সভাপতি মহোদয়ের ছবি (SMC President Photo)"
                    value={draft.smcPresidentPhoto || ""}
                    onChange={(url) => updateField("smcPresidentPhoto", url)}
                    aspectRatio="portrait"
                    helperText="সভাপতি মহোদয়ের পোর্ট্রেট ছবি আপলোড করুন।"
                    presets={[
                      { label: "President Formal", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" },
                      { label: "Avatar", url: "/images/avatar.png" },
                    ]}
                  />
                </div>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span>সভাপতির বার্তা (বাংলায়)</span>
                    <button
                      type="button"
                      onClick={() => translateSingleFieldToEn("smcPresidentMessage", "smcPresidentMessageEn")}
                      className="text-[10px] font-bold text-[#006a4e] hover:underline"
                    >
                      → বার্তা অনুবাদ
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={draft.smcPresidentMessage}
                    onChange={(e) => updateField("smcPresidentMessage", e.target.value)}
                    className={textareaClass}
                    placeholder="বিদ্যালয় পরিচালনা পর্ষদের সভাপতির অনুপ্রেরণামূলক বার্তা..."
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                  President's Message (English)
                  <textarea
                    rows={3}
                    value={draft.smcPresidentMessageEn || ""}
                    onChange={(e) => updateField("smcPresidentMessageEn", e.target.value)}
                    className={textareaClass}
                    placeholder="President's inspiring message for the institution..."
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: TEACHERS / FACULTY & STAFF DIRECTORY (CRUD + DYNAMIC SYNC) */}
        {activeTab === "teachers" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={16} className="text-[#006a4e]" />
                  <span>৫. শিক্ষক ও কর্মকর্তা পরিচিতি (Faculty & Staff Directory) ({(draft.teachers || []).length} জন)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  সফটওয়্যারের Staff & Faculty Directory (/list/staff) থেকে সরাসরি লাইভ ডায়নামিক সংযোগ এবং দ্বিভাষিক (বাংলা ও ইংরেজি) প্রোফাইল ব্যবস্থাপনা।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={syncingStaff}
                  onClick={handleSyncFromStaffDirectory}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#006a4e] bg-emerald-50 px-3.5 py-2 text-xs font-bold text-[#006a4e] shadow-xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 disabled:opacity-60 transition"
                  title="সফটওয়্যারের Staff & Faculty Directory থেকে সকল শিক্ষক ও কর্মচারীর তথ্য এখানে এক ক্লিকে সিঙ্ক করুন"
                >
                  <RefreshCw size={13} className={syncingStaff ? "animate-spin text-[#006a4e]" : "text-[#006a4e]"} />
                  <span>Staff & Faculty Directory থেকে অটো-সিঙ্ক</span>
                </button>

                <Link
                  to="/list/staff"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  title="সরাসরি সফটওয়্যারের Staff & Faculty Directory ওপেন করুন"
                >
                  <ExternalLink size={13} />
                  <span>Staff Directory ওপেন</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDraft((prev) => ({
                      ...prev,
                      teachers: (prev.teachers || []).map((t) => ({
                        ...t,
                        nameEn: t.nameEn || translateBnToEn(t.name),
                        designationEn: t.designationEn || translateBnToEn(t.designation),
                        subjectEn: t.subjectEn || translateBnToEn(t.subject),
                        qualificationEn: t.qualificationEn || translateBnToEn(t.qualification),
                      })),
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <span>সকল শিক্ষক তথ্য ইংরেজি অনুবাদ</span>
                </button>

                <button
                  type="button"
                  onClick={addTeacher}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন শিক্ষক যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Live Dashboard Dynamic Connection Banner */}
            <div className="mt-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50/50 p-4 text-xs dark:border-emerald-800/40 dark:from-slate-850 dark:via-slate-800 dark:to-slate-900">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-sm">সফটওয়্যার অ্যাডমিন ড্যাশবোর্ড 'Staff & Faculty Directory' লাইভ ডায়নামিক সংযোগ</span>
                  </div>
                  <p className="mt-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                    এই সেকশনটি সরাসরি সফটওয়্যার ড্যাশবোর্ডের <span className="font-bold text-emerald-800 dark:text-emerald-300">Staff & Faculty Directory</span> (/list/staff) এর সাথে রিয়েল-টাইমে সংযুক্ত। সফটওয়্যারে নতুন শিক্ষক বা কর্মচারী যোগ করা হলে তা লাইভ মোডে স্বয়ংক্রিয়ভাবে ওয়েবসাইটে প্রদর্শিত হয়।
                  </p>
                </div>

                {/* Live Mode Toggle */}
                <div className="flex shrink-0 items-center gap-2.5 rounded-lg border border-emerald-300 bg-white/95 px-3 py-2 shadow-2xs dark:border-emerald-700 dark:bg-slate-800">
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">
                      লাইভ ডিরেক্টরি প্রদর্শন মোড
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {draft.dynamicStaffDirectory !== false ? "সক্রিয় (Live Dynamic Active)" : "কাস্টম তালিকা মোড"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("dynamicStaffDirectory", draft.dynamicStaffDirectory === false ? true : false)}
                    className="text-[#006a4e] transition hover:scale-105"
                    title="ওয়েবসাইটে সরাসরি লাইভ Staff & Faculty Directory প্রদর্শনের মোড টগল করুন"
                  >
                    {draft.dynamicStaffDirectory !== false ? (
                      <ToggleRight size={28} className="text-[#006a4e]" />
                    ) : (
                      <ToggleLeft size={28} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Badges */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/80">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-2xs dark:bg-slate-800 dark:text-emerald-300">
                  <Users size={13} className="text-[#006a4e]" />
                  <span>মোট স্টাফ ও শিক্ষক:</span>
                  <span className="text-[#006a4e] dark:text-emerald-400 font-extrabold">{liveStaffStats?.total ?? (draft.teachers || []).length} জন</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 shadow-2xs dark:bg-slate-800 dark:text-blue-300">
                  <GraduationCap size={13} className="text-blue-700" />
                  <span>শিক্ষকমণ্ডলী (Academic Faculty):</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{liveStaffStats?.teaching ?? (draft.teachers || []).filter(t => t.category === "শিক্ষক").length} জন</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-purple-900 shadow-2xs dark:bg-slate-800 dark:text-purple-300">
                  <Shield size={13} className="text-purple-700" />
                  <span>প্রশাসন (Administration):</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400">{liveStaffStats?.admin ?? (draft.teachers || []).filter(t => t.category === "প্রশাসন").length} জন</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-teal-900 shadow-2xs dark:bg-slate-800 dark:text-teal-300">
                  <HeartHandshake size={13} className="text-teal-700" />
                  <span>কর্মচারীবৃন্দ (Staff & Support):</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">{liveStaffStats?.support ?? (draft.teachers || []).filter(t => t.category === "কর্মচারী").length} জন</span>
                </span>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md bg-gray-50 p-3 dark:bg-slate-800/60">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="নাম, পদবি বা বিষয় লিখে খুঁজুন..."
                  className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {teacherSearch && (
                  <button
                    type="button"
                    onClick={() => setTeacherSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                মোট শিক্ষক: <span className="font-bold text-[#006a4e] dark:text-emerald-400">{(draft.teachers || []).length}</span> জন
                {teacherSearch && (
                  <span className="ml-1 text-gray-600 dark:text-gray-300">
                    (খোঁজা হয়েছে: {(draft.teachers || []).filter(t => (t.name + t.nameEn + t.designation + t.subject).toLowerCase().includes(teacherSearch.toLowerCase())).length} জন)
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {(draft.teachers || [])
                .map((teacher, index) => ({ teacher, index }))
                .filter(({ teacher }) => {
                  if (!teacherSearch.trim()) return true;
                  const q = teacherSearch.toLowerCase();
                  return (
                    (teacher.name || "").toLowerCase().includes(q) ||
                    (teacher.nameEn || "").toLowerCase().includes(q) ||
                    (teacher.designation || "").toLowerCase().includes(q) ||
                    (teacher.designationEn || "").toLowerCase().includes(q) ||
                    (teacher.subject || "").toLowerCase().includes(q) ||
                    (teacher.subjectEn || "").toLowerCase().includes(q)
                  );
                })
                .map(({ teacher, index }) => (
                  <div
                    key={teacher.id || index}
                    className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 transition hover:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800"
                  >
                    {/* Header with order buttons & delete */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                          শিক্ষক #{index + 1}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-slate-700 dark:text-gray-300">
                          {teacher.category || "শিক্ষক"}
                        </span>
                        {teacher.name && (
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-xs">
                            — {teacher.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveTeacher(index, "up")}
                          disabled={index === 0}
                          title="উপরে নিন"
                          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTeacher(index, "down")}
                          disabled={index === (draft.teachers || []).length - 1}
                          title="নিচে নিন"
                          className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => translateTeacherItem(index)}
                          className="text-xs text-[#006a4e] hover:underline flex items-center gap-1 ml-1 dark:text-emerald-400"
                        >
                          <Sparkles size={12} />
                          <span>অটো অনুবাদ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTeacher(index)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 ml-1"
                        >
                          <Trash2 size={13} />
                          <span>মুছুন</span>
                        </button>
                      </div>
                    </div>

                    {/* Teacher Details with Image Upload */}
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                      {/* Photo Upload */}
                      <div className="sm:col-span-1">
                        <ImageUploadField
                          label="শিক্ষকের ছবি (Teacher Photo)"
                          value={teacher.photo || "/images/avatar.png"}
                          onChange={(url) => updateTeacher(index, "photo", url)}
                          aspectRatio="portrait"
                          helperText="পাসপোর্ট সাইজ বা পোর্ট্রেট ছবি আপলোড করুন।"
                          presets={[
                            { label: "Avatar Male", url: "/images/avatar.png" },
                            { label: "Photo 1", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300" },
                            { label: "Photo 2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300" },
                          ]}
                        />
                      </div>

                      {/* Fields */}
                      <div className="sm:col-span-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          ক্যাটাগরি *
                          <select
                            value={teacher.category || "শিক্ষক"}
                            onChange={(e) => updateTeacher(index, "category", e.target.value as any)}
                            className={inputClass}
                          >
                            <option value="শিক্ষক">শিক্ষক (Teacher)</option>
                            <option value="প্রশাসন">প্রশাসন (Administration)</option>
                            <option value="কর্মচারী">কর্মচারী (Staff)</option>
                          </select>
                        </label>

                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          ফোন নম্বর (Phone)
                          <input
                            type="text"
                            value={teacher.phone || ""}
                            onChange={(e) => updateTeacher(index, "phone", e.target.value)}
                            placeholder="+880 1712..."
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          ইমেইল (Email)
                          <input
                            type="email"
                            value={teacher.email || ""}
                            onChange={(e) => updateTeacher(index, "email", e.target.value)}
                            placeholder="teacher@school.edu.bd"
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          নাম (বাংলায়) *
                          <input
                            type="text"
                            value={teacher.name}
                            onChange={(e) => updateTeacher(index, "name", e.target.value)}
                            className={inputClass}
                            required
                          />
                        </label>

                        <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                          Name (English)
                          <input
                            type="text"
                            value={teacher.nameEn || ""}
                            onChange={(e) => updateTeacher(index, "nameEn", e.target.value)}
                            placeholder="e.g. Md. Abdur Rahman"
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          পদবি (বাংলায়)
                          <input
                            type="text"
                            value={teacher.designation}
                            onChange={(e) => updateTeacher(index, "designation", e.target.value)}
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                          Designation (English)
                          <input
                            type="text"
                            value={teacher.designationEn || ""}
                            onChange={(e) => updateTeacher(index, "designationEn", e.target.value)}
                            placeholder="e.g. Assistant Teacher"
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          বিষয় (বাংলায়)
                          <input
                            type="text"
                            value={teacher.subject}
                            onChange={(e) => updateTeacher(index, "subject", e.target.value)}
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                          Subject (English)
                          <input
                            type="text"
                            value={teacher.subjectEn || ""}
                            onChange={(e) => updateTeacher(index, "subjectEn", e.target.value)}
                            placeholder="e.g. Mathematics"
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          যোগ্যতা (বাংলায়)
                          <input
                            type="text"
                            value={teacher.qualification}
                            onChange={(e) => updateTeacher(index, "qualification", e.target.value)}
                            className={inputClass}
                          />
                        </label>

                        <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                          Qualification (English)
                          <input
                            type="text"
                            value={teacher.qualificationEn || ""}
                            onChange={(e) => updateTeacher(index, "qualificationEn", e.target.value)}
                            placeholder="e.g. B.Sc (Hons), M.Sc"
                            className={inputClass}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

              {(draft.teachers || []).length === 0 && (
                <div className="rounded-md border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500 dark:border-slate-700">
                  কোনো শিক্ষকের তথ্য নেই। 'নতুন শিক্ষক যোগ করুন' বাটনে ক্লিক করুন।
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 6: STATISTICS */}
        {activeTab === "statistics" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award size={16} className="text-[#006a4e]" />
                ৬. বিদ্যালয় পরিসংখ্যান ও একাডেমিক সাফল্য (বাংলা ও ইংরেজি সংখ্যা)
              </span>
              <button
                type="button"
                onClick={() => {
                  updateField("studentCountEn", toEnglishDigits(draft.studentCount));
                  updateField("teacherCountEn", toEnglishDigits(draft.teacherCount));
                  updateField("staffCountEn", toEnglishDigits(draft.staffCount));
                  updateField("classCountEn", toEnglishDigits(draft.classCount));
                  updateField("passRateEn", toEnglishDigits(draft.passRate));
                  updateField("gpa5CountEn", toEnglishDigits(draft.gpa5Count));
                  updateField("labCountEn", translateBnToEn(draft.labCount));
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006a4e] hover:underline"
              >
                <span>ইংরেজি সংখ্যায় রূপান্তর</span>
              </button>
            </h2>

            {/* Live Dashboard Sync Info Banner */}
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-100">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>সফটওয়্যার অ্যাডমিন ড্যাশবোর্ড থেকে অটো-সিঙ্ক (Live Dynamic Statistics)</span>
              </div>
              <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                ওয়েবসাইটের হোমপেজে &quot;School Statistics at a Glance&quot; সেকশনের শিক্ষার্থী (Students), শিক্ষক (Faculty), এবং কর্মচারী (Staff) সংখ্যা সরাসরি অ্যাডমিন ড্যাশবোর্ডের Teachers, Students, ও Staff সেকশন থেকে লাইভ ডায়নামিকভাবে গণনা করে প্রদর্শিত হয়।
              </p>
              {liveCounts && (
                <div className="mt-2.5 flex flex-wrap gap-3 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <span className="rounded bg-white px-2 py-1 shadow-2xs font-semibold text-emerald-900 dark:bg-slate-800 dark:text-emerald-200">
                    শিক্ষার্থী (Students): <span className="font-bold text-[#006a4e] dark:text-emerald-400">{liveCounts.students} জন</span>
                  </span>
                  <span className="rounded bg-white px-2 py-1 shadow-2xs font-semibold text-emerald-900 dark:bg-slate-800 dark:text-emerald-200">
                    শিক্ষক (Teachers/Faculty): <span className="font-bold text-blue-700 dark:text-blue-400">{liveCounts.teachers} জন</span>
                  </span>
                  <span className="rounded bg-white px-2 py-1 shadow-2xs font-semibold text-emerald-900 dark:bg-slate-800 dark:text-emerald-200">
                    কর্মচারী (Staff): <span className="font-bold text-teal-700 dark:text-teal-400">{liveCounts.staff} জন</span>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded border p-2.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  মোট শিক্ষার্থী সংখ্যা (বাংলা)
                  <input
                    type="text"
                    value={draft.studentCount}
                    onChange={(e) => {
                      updateField("studentCount", e.target.value);
                      updateField("studentCountEn", toEnglishDigits(e.target.value));
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2 block">
                  Total Students (English)
                  <input
                    type="text"
                    value={draft.studentCountEn || ""}
                    onChange={(e) => updateField("studentCountEn", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="rounded border p-2.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  মোট শিক্ষক সংখ্যা (বাংলা)
                  <input
                    type="text"
                    value={draft.teacherCount}
                    onChange={(e) => {
                      updateField("teacherCount", e.target.value);
                      updateField("teacherCountEn", toEnglishDigits(e.target.value));
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2 block">
                  Faculty Members (English)
                  <input
                    type="text"
                    value={draft.teacherCountEn || ""}
                    onChange={(e) => updateField("teacherCountEn", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="rounded border p-2.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  কর্মচারীবৃন্দ সংখ্যা (বাংলা)
                  <input
                    type="text"
                    value={draft.staffCount || ""}
                    onChange={(e) => {
                      updateField("staffCount", e.target.value);
                      updateField("staffCountEn", toEnglishDigits(e.target.value));
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2 block">
                  Staff Members (English)
                  <input
                    type="text"
                    value={draft.staffCountEn || ""}
                    onChange={(e) => updateField("staffCountEn", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="rounded border p-2.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পাসের হার (Pass Rate in Bangla)
                  <input
                    type="text"
                    value={draft.passRate}
                    onChange={(e) => {
                      updateField("passRate", e.target.value);
                      updateField("passRateEn", toEnglishDigits(e.target.value));
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2 block">
                  Pass Rate (English)
                  <input
                    type="text"
                    value={draft.passRateEn || ""}
                    onChange={(e) => updateField("passRateEn", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* TAB 7: NOTICES */}
        {activeTab === "notices" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell size={16} className="text-[#da291c]" />
                  <span>৭. নোটিশ বোর্ড ব্যবস্থাপনা ({draft.notices.length} টি নোটিশ — দ্বিভাষিক)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  নোটিশের শিরোনাম, ক্যাটাগরি, সংযুক্তি ও বিস্তারিত বিবরণ বাংলা এবং ইংরেজি উভয় ভাষায় লিখুন অথবা অটো-অনুবাদ ব্যবহার করুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft((prev) => ({
                      ...prev,
                      notices: (prev.notices || []).map((n) => ({
                        ...n,
                        titleEn: n.titleEn || translateBnToEn(n.title),
                        categoryEn: n.categoryEn || translateBnToEn(n.category),
                        contentEn: n.contentEn || translateBnToEn(n.content || ""),
                      })),
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <span>সকল নোটিশ ইংরেজি অনুবাদ</span>
                </button>

                <button
                  type="button"
                  onClick={addNotice}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন নোটিশ যোগ করুন</span>
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {draft.notices.map((notice, index) => (
                <div
                  key={notice.id || index}
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 transition hover:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                      নোটিশ #{index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveNotice(index, "up")}
                        disabled={index === 0}
                        title="উপরে নিন"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveNotice(index, "down")}
                        disabled={index === draft.notices.length - 1}
                        title="নিচে নিন"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => translateNoticeItem(index)}
                        className="text-xs text-[#006a4e] hover:underline flex items-center gap-1 ml-1 dark:text-emerald-400"
                      >
                        <Sparkles size={12} />
                        <span>ইংরেজি অনুবাদ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNotice(index)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 ml-1"
                      >
                        <Trash2 size={13} />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      নোটিশের শিরোনাম (বাংলায়) *
                      <input
                        type="text"
                        value={notice.title}
                        onChange={(e) => updateNotice(index, "title", e.target.value)}
                        className={inputClass}
                        required
                      />
                    </label>

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Notice Title (English) *
                      <input
                        type="text"
                        value={notice.titleEn || ""}
                        onChange={(e) => updateNotice(index, "titleEn", e.target.value)}
                        placeholder="e.g. Admission Notice 2026"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      তারিখ (Date)
                      <input
                        type="date"
                        value={notice.date}
                        onChange={(e) => updateNotice(index, "date", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি
                      <select
                        value={notice.category}
                        onChange={(e) => {
                          updateNotice(index, "category", e.target.value);
                          updateNotice(index, "categoryEn", translateBnToEn(e.target.value));
                        }}
                        className={inputClass}
                      >
                        <option value="সাধারণ">সাধারণ (General)</option>
                        <option value="ভর্তি">ভর্তি (Admission)</option>
                        <option value="পরীক্ষা">পরীক্ষা (Examination)</option>
                        <option value="একাডেমিক">একাডেমিক (Academic)</option>
                      </select>
                    </label>

                    {/* Notice Attachment Upload & URL */}
                    <div className="sm:col-span-2 rounded-md border border-gray-200 bg-gray-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            নোটিশের সংযুক্তি / বিজ্ঞপ্তি ফাইল (Attachment File / PDF / Image)
                          </label>
                          <span className="text-[11px] text-gray-500">
                            পিডিএফ বা ছবি ফাইল আপলোড করুন অথবা সরাসরি ফাইল লিংক দিন
                          </span>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs border border-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600">
                          <Upload size={13} className="text-[#006a4e] dark:text-emerald-400" />
                          <span>{uploadingNoticeIndex === index ? "আপলোড হচ্ছে..." : "ফাইল নির্বাচন ও আপলোড"}</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleNoticeFileUpload(index, f);
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={notice.fileUrl || ""}
                        onChange={(e) => updateNotice(index, "fileUrl", e.target.value)}
                        placeholder="https://... অথবা /uploads/notices/... অথবা আপলোড করুন"
                        className={`${inputClass} mt-1`}
                      />
                      {noticeUploadError?.index === index && (
                        <p className="mt-1 text-[11px] text-red-600">{noticeUploadError.message}</p>
                      )}
                    </div>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      বিস্তারিত বিবরণ (বাংলায়)
                      <textarea
                        rows={2}
                        value={notice.content || ""}
                        onChange={(e) => updateNotice(index, "content", e.target.value)}
                        className={textareaClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Notice Content (English)
                      <textarea
                        rows={2}
                        value={notice.contentEn || ""}
                        onChange={(e) => updateNotice(index, "contentEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 8: DOWNLOADS */}
        {activeTab === "downloads" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Download size={16} className="text-[#006a4e]" />
                  <span>৮. ডাউনলোড ও ক্লাস রুটিন (দ্বিভাষিক) ({draft.downloads.length} টি ফাইল)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  ক্লাস রুটিন, সিলেবাস ও বার্ষিক ক্যালেন্ডার ফাইল আপলোড করুন অথবা ডাউনলোড লিঙ্ক প্রদান করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={addDownloadItem}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
              >
                <Plus size={14} />
                <span>নতুন ডাউনলোড ফাইল যোগ করুন</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {(draft.downloads || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                      ফাইল #{index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveDownloadItem(index, "up")}
                        disabled={index === 0}
                        title="উপরে নিন"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDownloadItem(index, "down")}
                        disabled={index === (draft.downloads || []).length - 1}
                        title="নিচে নিন"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => translateDownloadItem(index)}
                        className="text-xs text-[#006a4e] hover:underline flex items-center gap-1 ml-1 dark:text-emerald-400"
                      >
                        <Sparkles size={12} />
                        <span>ইংরেজি অনুবাদ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDownloadItem(index)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 ml-1"
                      >
                        <Trash2 size={13} />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      শিরোনাম (বাংলায়) *
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateDownloadItem(index, "title", e.target.value)}
                        className={inputClass}
                        required
                      />
                    </label>

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Title (English) *
                      <input
                        type="text"
                        value={item.titleEn || ""}
                        onChange={(e) => updateDownloadItem(index, "titleEn", e.target.value)}
                        placeholder="e.g. Class Routine 2026 (PDF)"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি
                      <select
                        value={item.category || "রুটিন"}
                        onChange={(e) => {
                          updateDownloadItem(index, "category", e.target.value);
                          updateDownloadItem(index, "categoryEn", translateBnToEn(e.target.value));
                        }}
                        className={inputClass}
                      >
                        <option value="রুটিন">রুটিন (Routine)</option>
                        <option value="সিলেবাস">সিলেবাস (Syllabus)</option>
                        <option value="ক্যালেন্ডার">ক্যালেন্ডার (Calendar)</option>
                        <option value="ভর্তি ফরম">ভর্তি ফরম (Admission Form)</option>
                        <option value="অন্যান্য">অন্যান্য (Other)</option>
                      </select>
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      প্রকাশের তারিখ
                      <input
                        type="date"
                        value={item.publishDate || ""}
                        onChange={(e) => updateDownloadItem(index, "publishDate", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    {/* Download File Attachment Upload */}
                    <div className="sm:col-span-2 rounded-md border border-gray-200 bg-gray-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            ফাইল সংযুক্তি (PDF / Image File Upload)
                          </label>
                          <span className="text-[11px] text-gray-500">
                            পিডিএফ বা ছবি আপলোড করুন অথবা এক্সটার্নাল ড্রাইভ বা ক্লাউড লিঙ্ক দিন
                          </span>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs border border-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600">
                          <Upload size={13} className="text-[#006a4e] dark:text-emerald-400" />
                          <span>{uploadingDownloadIndex === index ? "আপলোড হচ্ছে..." : "ফাইল নির্বাচন ও আপলোড"}</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleDownloadFileUpload(index, f);
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={item.fileUrl || ""}
                        onChange={(e) => updateDownloadItem(index, "fileUrl", e.target.value)}
                        placeholder="https://... অথবা /uploads/... অথবা ফাইল আপলোড করুন"
                        className={`${inputClass} mt-1`}
                      />
                      {downloadUploadError?.index === index && (
                        <p className="mt-1 text-[11px] text-red-600">{downloadUploadError.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 9: ADMISSION INFO & CLASS SEATS */}
        {activeTab === "admission" && (
          <div className="space-y-6">
            {/* 1. General Admission Guidelines & URLs */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#006a4e]" />
                  ৯. অনলাইন ভর্তি তথ্য ও নীতিমালা (দ্বিভাষিক)
                </span>
                <button
                  type="button"
                  onClick={handleTranslateCurrentTab}
                  className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  <Sparkles size={11} />
                  <span>অনুবাদ সিঙ্ক</span>
                </button>
              </h2>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ভর্তি নির্দেশিকা (বাংলায়)
                      <textarea
                        rows={4}
                        value={draft.admissionGuidelines}
                        onChange={(e) => updateField("admissionGuidelines", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  )}

                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Admission Guidelines (English)
                      <textarea
                        rows={4}
                        value={draft.admissionGuidelinesEn || ""}
                        onChange={(e) => updateField("admissionGuidelinesEn", e.target.value)}
                        className={textareaClass}
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      শ্রেণিভিত্তিক আসন সংক্ষিপ্ত বিবরণ (বাংলায় সারসংক্ষেপ)
                      <input
                        type="text"
                        value={draft.admissionSeats}
                        onChange={(e) => updateField("admissionSeats", e.target.value)}
                        placeholder="যেমন: ৬ষ্ঠ শ্রেণি: ১২০ আসন · ৭ম শ্রেণি: ৩০ আসন · ৯ম শ্রেণি: ৬০ আসন"
                        className={inputClass}
                      />
                    </label>
                  )}

                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Admission Seats Summary (English)
                      <input
                        type="text"
                        value={draft.admissionSeatsEn || ""}
                        onChange={(e) => updateField("admissionSeatsEn", e.target.value)}
                        placeholder="e.g. Class 6: 120 seats · Class 7: 30 seats · Class 9: 60 seats"
                        className={inputClass}
                      />
                    </label>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      অনলাইন ভর্তি আবেদন লিংক (Online Admission Application URL)
                      <input
                        type="text"
                        value={draft.admissionFormUrl || ""}
                        onChange={(e) => updateField("admissionFormUrl", e.target.value)}
                        placeholder="https://gsa.teletalk.com.bd অথবা /admission"
                        className={inputClass}
                      />
                    </label>
                    <p className="mt-1 text-[11px] text-gray-500">
                      ওয়েবসাইটে আবেদনকারীরা সরাসরি অনলাইন ফরম পূরণ করতে পারেন। জমাকৃত সকল আবেদন প্রশাসনিক ড্যাশবোর্ডে জমা হয়।
                    </p>
                  </div>

                  <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#006a4e] block">
                        Student Admissions & Enrollment শাখা
                      </span>
                      <span className="text-[11px] text-gray-600">
                        ওয়েবসাইট থেকে জমা হওয়া আবেদনপত্র দেখতে ও অনুমোদন করতে ড্যাশবোর্ডের ভর্তি শাখায় যান।
                      </span>
                    </div>
                    <Link
                      to="/admissions"
                      className="inline-flex items-center gap-1 rounded-md bg-[#006a4e] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#00503a] shadow-xs"
                    >
                      <span>Admissions শাখায় যান</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Dynamic Class-wise Available Seats Matrix Management */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users size={16} className="text-[#006a4e]" />
                    <span>শ্রেণিভিত্তিক আসন সংখ্যা ও ভর্তি প্রক্রিয়া তালিকা (Class-wise Available Seats Table)</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                      {(draft.admissionSeatMatrix || []).length} টি শ্রেণি
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    ওয়েবসাইটের <Link to="/admission" target="_blank" className="text-[#006a4e] underline font-medium">/admission</Link> পেজে প্রদর্শিত 'Class-wise Available Seats' টেবিলটি এখান থেকেই সরাসরি নিয়ন্ত্রিত হয়। প্রতিটি শ্রেণির নাম, শাখা, মোট আসন সংখ্যা ও প্রক্রিয়া বাংলায় এবং ইংরেজিতে এডিট করুন।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={resetAdmissionSeatMatrixToDefault}
                    title="ডিফল্ট ১৫টি শ্রেণির তালিকা পুনরায় লোড করুন"
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  >
                    <RefreshCw size={13} />
                    <span>ডিফল্ট ১৫টি শ্রেণি লোড করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={addAdmissionSeatItem}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                  >
                    <Plus size={14} />
                    <span>+ নতুন শ্রেণি যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Search Filter for Classes */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={admissionSeatSearch}
                    onChange={(e) => setAdmissionSeatSearch(e.target.value)}
                    placeholder="শ্রেণি খুঁজুন (যেমন: নার্সারি, ৬ষ্ঠ, Class 9)..."
                    className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-8 text-xs text-black outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {admissionSeatSearch && (
                    <button
                      type="button"
                      onClick={() => setAdmissionSeatSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-gray-500">
                  মোট <b>{(draft.admissionSeatMatrix || []).length}</b> টি শ্রেণির আসন তথ্য সংজ্ঞায়িত
                </div>
              </div>

              {/* Class Cards List */}
              <div className="mt-4 space-y-3.5">
                {(draft.admissionSeatMatrix || []).length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center dark:border-slate-800">
                    <Users size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      বর্তমানে কোনো শ্রেণির আসন তথ্য তালিকাভুক্ত নেই।
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      নিচের বাটনে ক্লিক করে ডিফল্ট ১৫টি শ্রেণির তথ্য এক ক্লিকেই রিস্টোর করতে পারেন।
                    </p>
                    <button
                      type="button"
                      onClick={resetAdmissionSeatMatrixToDefault}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                    >
                      <RefreshCw size={13} />
                      <span>ডিফল্ট ১৫টি শ্রেণি লোড করুন</span>
                    </button>
                  </div>
                ) : (
                  (draft.admissionSeatMatrix || [])
                    .map((item, originalIndex) => ({ item, originalIndex }))
                    .filter(({ item }) => {
                      if (!admissionSeatSearch.trim()) return true;
                      const q = admissionSeatSearch.toLowerCase();
                      return (
                        (item.classBn || "").toLowerCase().includes(q) ||
                        (item.classEn || "").toLowerCase().includes(q) ||
                        (item.sectionsBn || "").toLowerCase().includes(q) ||
                        (item.sectionsEn || "").toLowerCase().includes(q) ||
                        (item.processBn || "").toLowerCase().includes(q) ||
                        (item.processEn || "").toLowerCase().includes(q)
                      );
                    })
                    .map(({ item, originalIndex }) => (
                      <div
                        key={item.id || originalIndex}
                        className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 shadow-2xs transition-all hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800"
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2.5 dark:border-slate-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                              শ্রেণি #{originalIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {item.classBn || "নতুন শ্রেণি"}
                            </span>
                            {item.classEn && (
                              <span className="text-xs text-blue-700 dark:text-blue-300">
                                ({item.classEn})
                              </span>
                            )}
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-[#006a4e] dark:border-slate-600 dark:bg-slate-700 dark:text-emerald-300">
                              আসন: {item.seats || "০"} {item.suffixBn || "জন"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveAdmissionSeatItem(originalIndex, "up")}
                              disabled={originalIndex === 0}
                              title="উপরে নিন"
                              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveAdmissionSeatItem(originalIndex, "down")}
                              disabled={originalIndex === (draft.admissionSeatMatrix || []).length - 1}
                              title="নিচে নিন"
                              className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => translateAdmissionSeatItem(originalIndex)}
                              title="ইংরেজিতে অনুবাদ করুন"
                              className="rounded p-1 text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              <Sparkles size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAdmissionSeatItem(originalIndex)}
                              title="শ্রেণিটি তালিকা থেকে মুছে ফেলুন"
                              className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Input Fields */}
                        <div className="mt-3.5 space-y-3">
                          {/* Row 1: Class Name BN & EN */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                শ্রেণির নাম (বাংলায়) *
                                <input
                                  type="text"
                                  value={item.classBn}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "classBn", e.target.value)}
                                  placeholder="যেমন: নার্সারি, কেজি, ৬ষ্ঠ শ্রেণি, একাদশ শ্রেণি"
                                  className={inputClass}
                                  required
                                />
                              </label>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Class Name (English) *
                                <input
                                  type="text"
                                  value={item.classEn}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "classEn", e.target.value)}
                                  placeholder="e.g. Class Nursery, Class KG, Class 6, Class 11 (HSC)"
                                  className={inputClass}
                                  required
                                />
                              </label>
                            )}
                          </div>

                          {/* Row 2: Sections BN & EN */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                শাখা / গ্রুপ (বাংলায়)
                                <input
                                  type="text"
                                  value={item.sectionsBn}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "sectionsBn", e.target.value)}
                                  placeholder="যেমন: ক ও খ শাখা অথবা বিজ্ঞান, মানবিক ও ব্যবসায় শিক্ষা"
                                  className={inputClass}
                                />
                              </label>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Sections / Streams (English)
                                <input
                                  type="text"
                                  value={item.sectionsEn}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "sectionsEn", e.target.value)}
                                  placeholder="e.g. Sections A & B or Science, Humanities & Business"
                                  className={inputClass}
                                />
                              </label>
                            )}
                          </div>

                          {/* Row 3: Seats & Suffix (Total seats, Unit note) */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                মোট আসন সংখ্যা (Total Seats) *
                                <input
                                  type="text"
                                  value={item.seats}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "seats", e.target.value)}
                                  placeholder="যেমন: 50, 60, 120"
                                  className={inputClass}
                                  required
                                />
                              </label>
                            </div>

                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <div>
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  আসন একক / মন্তব্য (বাংলা)
                                  <input
                                    type="text"
                                    value={item.suffixBn || ""}
                                    onChange={(e) => updateAdmissionSeatItem(originalIndex, "suffixBn", e.target.value)}
                                    placeholder="যেমন: জন, জন (আসন সাপেক্ষে), জন (টিসি সাপেক্ষে)"
                                    className={inputClass}
                                  />
                                </label>
                              </div>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <div>
                                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                  Seat Suffix / Condition (English)
                                  <input
                                    type="text"
                                    value={item.suffixEn || ""}
                                    onChange={(e) => updateAdmissionSeatItem(originalIndex, "suffixEn", e.target.value)}
                                    placeholder="e.g. Seats, Seats (Vacancy basis), Seats (TC basis)"
                                    className={inputClass}
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Row 4: Admission Process BN & EN */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                ভর্তির প্রক্রিয়া ও শর্ত (বাংলায়)
                                <input
                                  type="text"
                                  value={item.processBn}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "processBn", e.target.value)}
                                  placeholder="যেমন: অনলাইন আবেদন ও সরকারি লটারি / সরাসরি আবেদন ও মৌখিক সাক্ষাৎকার"
                                  className={inputClass}
                                />
                              </label>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Admission Process & Eligibility (English)
                                <input
                                  type="text"
                                  value={item.processEn}
                                  onChange={(e) => updateAdmissionSeatItem(originalIndex, "processEn", e.target.value)}
                                  placeholder="e.g. Online Application & Govt Lottery / Direct Application & Oral Interview"
                                  className={inputClass}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </section>

            {/* 3. Live Admission Page Preview */}
            <div className="rounded-lg border border-[#cde2d4] bg-[#f7faf8] p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#dde5df] pb-2.5 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400 flex items-center gap-1.5">
                  <Eye size={14} />
                  <span>লাইভ ওয়েবসাইট প্রিভিউ (Admission Page - Class-wise Available Seats Table Preview)</span>
                </span>
                <Link
                  to="/admission"
                  target="_blank"
                  className="text-xs font-semibold text-[#006a4e] hover:underline flex items-center gap-1 dark:text-emerald-400"
                >
                  <span>Admission পেজে লাইভ দেখুন</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              <section className="rounded-xl border border-[#dde5df] bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-base font-bold text-[#005a40] border-b pb-3 flex items-center gap-2 dark:text-emerald-300">
                  <Users size={18} />
                  <span>শ্রেণিভিত্তিক আসন বিন্যাস (Class-wise Available Seats)</span>
                </h3>

                <div className="mt-4">
                  <p className="text-xs text-gray-600 mb-3 dark:text-gray-300">
                    {draft.admissionSeats || "শ্রেণিভিত্তিক আসন বিন্যাস ও তথ্য"}
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-gray-200 dark:border-slate-700">
                      <thead>
                        <tr className="bg-[#006a4e] text-white">
                          <th className="border p-2.5 dark:border-slate-600">শ্রেণি (Class)</th>
                          <th className="border p-2.5 dark:border-slate-600">শাখা (Sections)</th>
                          <th className="border p-2.5 dark:border-slate-600">মোট আসন (Total Seats)</th>
                          <th className="border p-2.5 dark:border-slate-600">ভর্তির প্রক্রিয়া (Admission Process)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
                        {(draft.admissionSeatMatrix && draft.admissionSeatMatrix.length > 0
                          ? draft.admissionSeatMatrix
                          : DEFAULT_ADMISSION_SEAT_MATRIX
                        ).map((item, idx) => (
                          <tr
                            key={item.id || idx}
                            className="hover:bg-emerald-50/40 transition-colors odd:bg-white even:bg-[#fafcfa] dark:odd:bg-slate-800 dark:even:bg-slate-850 dark:hover:bg-slate-700"
                          >
                            <td className="border p-2.5 font-bold text-gray-900 dark:border-slate-700 dark:text-white">
                              {item.classBn} {item.classEn && <span className="font-normal text-gray-500 text-[11px]">({item.classEn})</span>}
                            </td>
                            <td className="border p-2.5 text-gray-700 dark:border-slate-700 dark:text-gray-300">
                              {item.sectionsBn}
                            </td>
                            <td className="border p-2.5 font-bold text-[#006a4e] whitespace-nowrap dark:border-slate-700 dark:text-emerald-400">
                              {item.seats} {item.suffixBn || "জন"}
                            </td>
                            <td className="border p-2.5 text-gray-700 dark:border-slate-700 dark:text-gray-300">
                              {item.processBn}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* TAB 10: GALLERY */}
        {activeTab === "gallery" && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#006a4e]" />
                    <span>১০. ফটো গ্যালারি ব্যবস্থাপনা (দ্বিভাষিক)</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                      {(draft.gallery || []).length} টি ছবি
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    বিদ্যালয় ক্যাম্পাস, সাংস্কৃতিক অনুষ্ঠান, বিজ্ঞান মেলা ও ক্রীড়া প্রতিযোগিতার ছবি আপলোড করুন ও সাজান। এটি লাইভ ওয়েবসাইটের{" "}
                    <Link to="/gallery" target="_blank" className="text-[#006a4e] underline font-medium">/gallery</Link>{" "}
                    পেজ ও প্রচ্ছদ (Home) পেজের গ্যালারি সেকশনে সরাসরি প্রদর্শিত হয়।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetGalleryToDefault}
                    title="ডিফল্ট গ্যালারির ছবিগুলো রিস্টোর করুন"
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  >
                    <RefreshCw size={13} />
                    <span>ডিফল্ট ছবি রিস্টোর</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddGalleryModal}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a] transition"
                  >
                    <Plus size={14} />
                    <span>নতুন ছবি যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Toolbar */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder="ছবি খুঁজুন (শিরোনাম বা ক্যাটাগরি)..."
                    className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-8 text-xs text-black outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {gallerySearch && (
                    <button
                      type="button"
                      onClick={() => setGallerySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Pills Filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {["সকল", "ক্যাম্পাস", "ল্যাব", "সমাবেশ", "ক্রীড়া", "বিজ্ঞান মেলা", "জাতীয় দিবস", "অন্যান্য"].map((cat) => {
                    const count = cat === "সকল"
                      ? (draft.gallery || []).length
                      : (draft.gallery || []).filter((p) => (p.category || "").includes(cat)).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setGalleryCategoryFilter(cat)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${galleryCategoryFilter === cat
                          ? "bg-[#006a4e] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-[#006a4e] dark:bg-slate-800 dark:text-gray-300"
                          }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] rounded-full px-1 ${galleryCategoryFilter === cat ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Cards Grid */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {(draft.gallery || [])
                  .map((photo, originalIndex) => ({ photo, originalIndex }))
                  .filter(({ photo }) => {
                    if (galleryCategoryFilter !== "সকল" && !(photo.category || "").includes(galleryCategoryFilter)) {
                      return false;
                    }
                    if (!gallerySearch.trim()) return true;
                    const q = gallerySearch.toLowerCase();
                    return (
                      (photo.title || "").toLowerCase().includes(q) ||
                      (photo.titleEn || "").toLowerCase().includes(q) ||
                      (photo.category || "").toLowerCase().includes(q) ||
                      (photo.categoryEn || "").toLowerCase().includes(q)
                    );
                  })
                  .map(({ photo, originalIndex }) => (
                    <div
                      key={photo.id || originalIndex}
                      className="group flex flex-col justify-between overflow-hidden rounded-lg border border-gray-200 bg-[#fbfdfc] shadow-2xs transition hover:border-[#006a4e] hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-slate-900">
                          <img
                            src={photo.imageUrl || "/images/bgimage.jpg"}
                            alt={photo.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = "/images/bgimage.jpg";
                            }}
                          />
                          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                            <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                              #{originalIndex + 1}
                            </span>
                            <span className="rounded bg-[#006a4e] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                              {photo.category || "ক্যাম্পাস"}
                            </span>
                          </div>
                        </div>

                        {/* Title Info */}
                        <div className="p-3.5 space-y-1">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 dark:text-white">
                            {photo.title || "নামবিহীন ছবি"}
                          </h4>
                          {photo.titleEn && (
                            <p className="text-[11px] text-gray-500 line-clamp-1 dark:text-gray-400">
                              {photo.titleEn}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="border-t border-gray-100 bg-gray-50/70 p-2.5 flex items-center justify-between dark:border-slate-700 dark:bg-slate-800/80">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveGalleryItem(originalIndex, "up")}
                            disabled={originalIndex === 0}
                            title="উপরে নিন"
                            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGalleryItem(originalIndex, "down")}
                            disabled={originalIndex === (draft.gallery || []).length - 1}
                            title="নিচে নিন"
                            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => translateGalleryItem(originalIndex)}
                            title="ইংরেজিতে অনুবাদ করুন"
                            className="rounded p-1 text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <Sparkles size={13} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditGalleryModal(originalIndex)}
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-bold text-[#006a4e] border border-emerald-300 shadow-2xs hover:bg-emerald-50 dark:bg-slate-700 dark:border-slate-600 dark:text-emerald-300"
                          >
                            <Pencil size={12} />
                            <span>এডিট</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryItem(originalIndex)}
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-bold text-red-600 border border-red-200 shadow-2xs hover:bg-red-50 dark:bg-slate-700 dark:border-slate-600 dark:text-red-400"
                          >
                            <Trash2 size={12} />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {(draft.gallery || []).length === 0 && (
                  <div className="col-span-full rounded-lg border-2 border-dashed border-gray-200 p-8 text-center dark:border-slate-800">
                    <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      গ্যালারিতে বর্তমানে কোনো ছবি যুক্ত করা নেই।
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddGalleryModal}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                    >
                      <Plus size={14} />
                      <span>প্রথম ছবি যোগ করুন</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Live Gallery Page Preview */}
            <div className="rounded-lg border border-[#cde2d4] bg-[#f7faf8] p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#dde5df] pb-2.5 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400 flex items-center gap-1.5">
                  <Eye size={14} />
                  <span>লাইভ ওয়েবসাইট প্রিভিউ (Gallery Page Live Preview)</span>
                </span>
                <Link
                  to="/gallery"
                  target="_blank"
                  className="text-xs font-semibold text-[#006a4e] hover:underline flex items-center gap-1 dark:text-emerald-400"
                >
                  <span>গ্যালারি পেজে সরাসরি দেখুন (/gallery)</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {(draft.gallery || []).slice(0, 6).map((item, idx) => (
                  <div key={item.id || idx} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xs">
                    <img
                      src={item.imageUrl || "/images/bgimage.jpg"}
                      alt={item.title}
                      className="aspect-4/3 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/bgimage.jpg";
                      }}
                    />
                    <div className="p-1.5 text-[11px] truncate font-medium text-gray-800">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: STUDY CORNER */}
        {activeTab === "study_co" && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-[#006a4e]" />
                    <span>১১. Study Corner — মূল তথ্য ও ব্যানার (দ্বিভাষিক)</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    স্টাডি কর্নারের ব্যানার ছবি, শিরোনাম, বাণী ও সময়সূচী ব্যবস্থাপনা করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTranslateCurrentTab}
                  className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  <Sparkles size={11} />
                  <span>অনুবাদ সিঙ্ক</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Study Corner শিরোনাম (বাংলা)
                  <input
                    type="text"
                    value={draft.studyCornerTitle || ""}
                    onChange={(e) => updateField("studyCornerTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Study Corner Title (English)
                  <input
                    type="text"
                    value={draft.studyCornerTitleEn || ""}
                    onChange={(e) => updateField("studyCornerTitleEn", e.target.value)}
                    placeholder="Study Corner — Center of Knowledge & Learning"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  উপ-শিরোনাম (বাংলা)
                  <input
                    type="text"
                    value={draft.studyCornerSubtitle || ""}
                    onChange={(e) => updateField("studyCornerSubtitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Subtitle (English)
                  <input
                    type="text"
                    value={draft.studyCornerSubtitleEn || ""}
                    onChange={(e) => updateField("studyCornerSubtitleEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

                {/* Study Corner Image Upload */}
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="স্টাডি কর্নার ব্যানার/কভার ছবি (Study Corner Cover Image)"
                    value={draft.studyCornerImage || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600"}
                    onChange={(url) => updateField("studyCornerImage", url)}
                    aspectRatio="video"
                    helperText="স্টাডি কর্নার পেজ ও হোমপেজে প্রদর্শিত মূল লাইব্রেরি/পাঠাগার ছবি আপলোড করুন।"
                    presets={[
                      { label: "Library Books", url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600" },
                      { label: "Study Hall", url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=600" },
                      { label: "Books Stack", url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600" },
                    ]}
                  />
                </div>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  বিবরণ (বাংলায়)
                  <textarea
                    rows={2}
                    value={draft.studyCornerText || ""}
                    onChange={(e) => updateField("studyCornerText", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                  Overview (English)
                  <textarea
                    rows={2}
                    value={draft.studyCornerTextEn || ""}
                    onChange={(e) => updateField("studyCornerTextEn", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  জ্ঞান বাণী / কোটেশন (বাংলা)
                  <input
                    type="text"
                    value={draft.studyCornerQuote || ""}
                    onChange={(e) => updateField("studyCornerQuote", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Inspirational Quote (English)
                  <input
                    type="text"
                    value={draft.studyCornerQuoteEn || ""}
                    onChange={(e) => updateField("studyCornerQuoteEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  বাণী বক্তা / রচয়িতা (বাংলা)
                  <input
                    type="text"
                    value={draft.studyCornerQuoteAuthor || ""}
                    onChange={(e) => updateField("studyCornerQuoteAuthor", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Quote Author (English)
                  <input
                    type="text"
                    value={draft.studyCornerQuoteAuthorEn || ""}
                    onChange={(e) => updateField("studyCornerQuoteAuthorEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  খোলার দিনসমূহ (বাংলা)
                  <input
                    type="text"
                    value={draft.studyCornerDays || ""}
                    onChange={(e) => updateField("studyCornerDays", e.target.value)}
                    placeholder="যেমন: সোমবার - শনিবার"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Opening Days (English)
                  <input
                    type="text"
                    value={draft.studyCornerDaysEn || ""}
                    onChange={(e) => updateField("studyCornerDaysEn", e.target.value)}
                    placeholder="e.g. Monday - Saturday"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  সময়সূচি (বাংলা)
                  <input
                    type="text"
                    value={draft.studyCornerHours || ""}
                    onChange={(e) => updateField("studyCornerHours", e.target.value)}
                    placeholder="যেমন: সকাল ৮:০০ - বিকাল ৪:০০"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Operating Hours (English)
                  <input
                    type="text"
                    value={draft.studyCornerHoursEn || ""}
                    onChange={(e) => updateField("studyCornerHoursEn", e.target.value)}
                    placeholder="e.g. 8:00 AM - 4:00 PM"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>
          </div>
        )}

        {/* TAB 12: LINKS */}
        {activeTab === "links" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <LinkIcon size={16} className="text-[#006a4e]" />
                  <span>১২. সরকারি ও প্রয়োজনীয় লিঙ্কসমূহ (দ্বিভাষিক) ({draft.quickLinks.length} টি লিঙ্ক)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  মন্ত্রণালয়, শিক্ষা বোর্ড ও প্রয়োজনীয় সরকারি পোর্টালের লিংকসমূহ যুক্ত ও পুনর্বিন্যাস করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={addQuickLink}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
              >
                <Plus size={14} />
                <span>নতুন লিঙ্ক যোগ করুন</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {draft.quickLinks.map((link, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto] dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    লিঙ্কের শিরোনাম (বাংলা)
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateQuickLink(index, "label", e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                    Label (English)
                    <input
                      type="text"
                      value={link.labelEn || ""}
                      onChange={(e) => updateQuickLink(index, "labelEn", e.target.value)}
                      placeholder="e.g. Ministry of Education"
                      className={inputClass}
                    />
                  </label>

                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    ওয়েবসাইট ঠিকানা (URL)
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => updateQuickLink(index, "url", e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <div className="flex items-center gap-1 mt-4">
                    <button
                      type="button"
                      onClick={() => moveQuickLink(index, "up")}
                      disabled={index === 0}
                      title="উপরে নিন"
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuickLink(index, "down")}
                      disabled={index === draft.quickLinks.length - 1}
                      title="নিচে নিন"
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateQuickLink(index, "labelEn", link.labelEn || translateBnToEn(link.label));
                      }}
                      title="অনুবাদ"
                      className="rounded p-1.5 text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <Sparkles size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuickLink(index)}
                      title="মুছুন"
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 13: CODE OF CONDUCT & DRESS CODE */}
        {activeTab === "conduct" && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield size={16} className="text-[#006a4e]" />
                    <span>১৩. শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা (Code of Conduct & Dress Code)</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    একাডেমিক পেজের "শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা" সেকশনের টাইটেল, ভূমিকা এবং প্রতিটি নিয়মাবলী সরাসরি এখান থেকে পরিচালনা করুন।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/*   <button
                    type="button"
                    onClick={resetCodeOfConductToDefault}
                    title="ডিফল্ট ৩টি নিয়ম ও নীতিমালায় ফিরিয়ে আনুন"
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  >
                    <RefreshCw size={13} />
                    <span className="hidden sm:inline">ডিফল্ট নিয়মাবলী আনুন</span>
                  </button> */}
                  <button
                    type="button"
                    onClick={addCodeOfConductRule}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                  >
                    <Plus size={14} />
                    <span>নতুন নিয়ম যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Section Heading & Subtitle Configuration */}
              <div className="mt-5 rounded-lg border border-emerald-100 bg-[#f8fbf9] p-4 dark:border-emerald-950/40 dark:bg-slate-800/60">
                <div className="mb-3 flex items-center justify-between border-b border-emerald-100 pb-2 dark:border-slate-700">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400 flex items-center gap-1.5">
                    <Layers size={13} />
                    <span>সেকশন শিরোনাম ও ভূমিকা পরিচিতি (Section Title & Subtitle)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (draft.codeOfConductTitle) {
                        updateField("codeOfConductTitleEn", translateBnToEn(draft.codeOfConductTitle));
                      }
                      if (draft.codeOfConductSubtitle) {
                        updateField("codeOfConductSubtitleEn", translateBnToEn(draft.codeOfConductSubtitle));
                      }
                    }}
                    title="শিরোনাম ও ভূমিকা ইংরেজিতে অনুবাদ করুন"
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-[#006a4e] hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-slate-700"
                  >
                    <Sparkles size={12} />
                    <span>ইংরেজি অনুবাদ</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      সেকশন প্রধান শিরোনাম (বাংলা)
                      <input
                        type="text"
                        value={draft.codeOfConductTitle || ""}
                        onChange={(e) => updateField("codeOfConductTitle", e.target.value)}
                        placeholder="যেমন: শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা"
                        className={inputClass}
                      />
                    </label>
                  )}

                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Section Main Title (English)
                      <input
                        type="text"
                        value={draft.codeOfConductTitleEn || ""}
                        onChange={(e) => updateField("codeOfConductTitleEn", e.target.value)}
                        placeholder="e.g. Student Code of Conduct & Dress Code"
                        className={inputClass}
                      />
                    </label>
                  )}

                  {(editLangMode === "bn" || editLangMode === "dual") && (
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      সংক্ষিপ্ত ভূমিকা বা নির্দেশনা (বাংলা - ঐচ্ছিক)
                      <input
                        type="text"
                        value={draft.codeOfConductSubtitle || ""}
                        onChange={(e) => updateField("codeOfConductSubtitle", e.target.value)}
                        placeholder="যেমন: বিদ্যালয়ের সার্বিক শৃঙ্খলা ও নিয়মানুবর্তিতা রক্ষার্থে..."
                        className={inputClass}
                      />
                    </label>
                  )}

                  {(editLangMode === "en" || editLangMode === "dual") && (
                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Brief Subtitle or Notice (English - Optional)
                      <input
                        type="text"
                        value={draft.codeOfConductSubtitleEn || ""}
                        onChange={(e) => updateField("codeOfConductSubtitleEn", e.target.value)}
                        placeholder="e.g. Guidelines to uphold campus discipline and academic integrity..."
                        className={inputClass}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Rules List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span>নীতিমালা ও আচরণবিধির তালিকা ({draft.codeOfConductRules?.length || 0} টি নিয়ম)</span>
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    তীর চিহ্নে ক্লিক করে নিয়মের ক্রম পরিবর্তন এবং অনুবাদ আইকন দিয়ে ইংরেজিতে রূপান্তর করতে পারেন
                  </span>
                </div>

                {(!draft.codeOfConductRules || draft.codeOfConductRules.length === 0) ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-slate-700">
                    <Shield size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      বর্তমানে কোনো আচরণবিধি বা নীতিমালা যুক্ত নেই
                    </p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                      নতুন নিয়ম যোগ করুন অথবা ডিফল্ট নীতিমালা ফিরিয়ে আনুন।
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={resetCodeOfConductToDefault}
                        className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
                      >
                        ডিফল্ট ৩টি নিয়ম লোড করুন
                      </button>
                      <button
                        type="button"
                        onClick={addCodeOfConductRule}
                        className="rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#00503a]"
                      >
                        + নতুন নিয়ম তৈরি করুন
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draft.codeOfConductRules.map((rule, index) => (
                      <div
                        key={rule.id || index}
                        className="rounded-lg border border-gray-200 bg-[#fcfdfd] p-4.5 transition hover:border-emerald-300 hover:shadow-2xs dark:border-slate-700 dark:bg-slate-800/70"
                      >
                        {/* Item Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {rule.title || `নিয়ম #${index + 1}`}
                            </span>
                            {rule.badge && (
                              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#006a4e] border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {rule.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveCodeOfConductRule(index, "up")}
                              disabled={index === 0}
                              title="উপরে নিন"
                              className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveCodeOfConductRule(index, "down")}
                              disabled={index === (draft.codeOfConductRules?.length || 0) - 1}
                              title="নিচে নিন"
                              className="rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => translateCodeOfConductRule(index)}
                              title="ইংরেজিতে অনুবাদ করুন"
                              className="rounded p-1.5 text-[#006a4e] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              <Sparkles size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCodeOfConductRule(index)}
                              title="নিয়মটি মুছে ফেলুন"
                              className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="mt-3.5 space-y-3">
                          {/* Title & Badge Row */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                নিয়মের শিরোনাম (বাংলা)
                                <input
                                  type="text"
                                  value={rule.title}
                                  onChange={(e) => updateCodeOfConductRule(index, "title", e.target.value)}
                                  placeholder="যেমন: ১. ইউনিফর্ম ও ড্রেসকোড:"
                                  className={inputClass}
                                />
                              </label>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Rule Title (English)
                                <input
                                  type="text"
                                  value={rule.titleEn || ""}
                                  onChange={(e) => updateCodeOfConductRule(index, "titleEn", e.target.value)}
                                  placeholder="e.g. 1. Uniform & Dress Code:"
                                  className={inputClass}
                                />
                              </label>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                ক্যাটাগরি / ব্যাজ (বাংলা - ঐচ্ছিক)
                                <input
                                  type="text"
                                  value={rule.badge || ""}
                                  onChange={(e) => updateCodeOfConductRule(index, "badge", e.target.value)}
                                  placeholder="যেমন: পোশাক নীতিমালা / উপস্থিতি / শৃঙ্খলা"
                                  className={inputClass}
                                />
                              </label>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Category / Badge (English - Optional)
                                <input
                                  type="text"
                                  value={rule.badgeEn || ""}
                                  onChange={(e) => updateCodeOfConductRule(index, "badgeEn", e.target.value)}
                                  placeholder="e.g. Dress Code / Attendance / Discipline"
                                  className={inputClass}
                                />
                              </label>
                            )}
                          </div>

                          {/* Description Textarea */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {(editLangMode === "bn" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                নীতিমালার বিস্তারিত বিবরণ (বাংলা)
                                <textarea
                                  rows={3}
                                  value={rule.description}
                                  onChange={(e) => updateCodeOfConductRule(index, "description", e.target.value)}
                                  placeholder="সাদা শার্ট, নেভি ব্লু প্যান্ট/সালোয়ার, নির্ধারিত বিদ্যালয় মনোগ্রাম সম্বলিত ব্যাজ ও কালো জুতা পরিধান বাধ্যতামূলক।"
                                  className={textareaClass}
                                />
                              </label>
                            )}

                            {(editLangMode === "en" || editLangMode === "dual") && (
                              <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Policy Description (English)
                                <textarea
                                  rows={3}
                                  value={rule.descriptionEn || ""}
                                  onChange={(e) => updateCodeOfConductRule(index, "descriptionEn", e.target.value)}
                                  placeholder="White shirt, navy blue pants/salwar, school monogram badge, and black shoes are mandatory."
                                  className={textareaClass}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Public Page Live Preview */}
            <div className="rounded-lg border border-[#cde2d4] bg-[#f7faf8] p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#dde5df] pb-2.5 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400 flex items-center gap-1.5">
                  <Eye size={14} />
                  <span>লাইভ ওয়েবসাইট প্রিভিউ (Academics Page Preview)</span>
                </span>
                <a
                  href="/academics"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#006a4e] hover:underline flex items-center gap-1"
                >
                  <span>Academics পেজ দেখুন</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-base font-bold text-[#005a40] border-b pb-2.5 flex items-center gap-2 dark:text-emerald-300">
                  <Shield size={16} />
                  <span>{draft.codeOfConductTitle || "শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা"}</span>
                </h3>
                {draft.codeOfConductSubtitle && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {draft.codeOfConductSubtitle}
                  </p>
                )}

                <div className="mt-4 space-y-3 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                  {(draft.codeOfConductRules || []).map((rule, idx) => (
                    <div key={rule.id || idx} className="rounded-md border border-gray-100 bg-[#f9fbf9] p-3.5 dark:border-slate-700 dark:bg-slate-800/80">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {rule.title || `নিয়ম ${idx + 1}`}
                        </p>
                        {rule.badge && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#006a4e] dark:bg-emerald-950 dark:text-emerald-300">
                            {rule.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {rule.description || "কোনো বিবরণ প্রদান করা হয়নি।"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Sticky Action Footer */}
        <footer className="sticky bottom-0 z-20 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(websiteContent);
                setFeedback(null);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
            >
              পরিবর্তন বাতিল
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800 inline-flex items-center gap-1"
            >
              <span>ওয়েবসাইট প্রিভিউ</span>
              <ExternalLink size={13} />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={translating}
              onClick={() => handleAutoTranslateAll("en")}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#006a4e] bg-emerald-50 px-4 py-2.5 text-xs font-bold text-[#006a4e] hover:bg-emerald-100"
            >
              <span>ইংরেজি অনুবাদ সিঙ্ক</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#006a4e] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00503a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={15} />
              <span>{saving ? "সংরক্ষণ ও প্রকাশ হচ্ছে..." : "সংরক্ষণ ও প্রকাশ করুন (Save & Publish)"}</span>
            </button>
          </div>
        </footer>
      </form>

      {/* GALLERY PHOTO ADD / EDIT MODAL */}
      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingGalleryPhoto) {
              handleCloseGalleryModal();
            }
          }}
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editingGalleryIndex !== null ? "ফটো গ্যালারি ছবি সম্পাদনা করুন" : "নতুন ফটো গ্যালারি ছবি যোগ করুন"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ছবি আপলোড করুন, বাংলা ও ইংরেজি শিরোনাম দিন। সেভ করার সাথে সাথে লাইভ ডাটাবেজ আপডেট হবে।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseGalleryModal}
                disabled={isSavingGalleryPhoto}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveGalleryModal} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Photo Upload via ImageUploadField */}
              <div>
                <ImageUploadField
                  label="ছবির ফাইল আপলোড অথবা লিঙ্ক দিন (Upload Photo or Paste URL) *"
                  value={galleryForm.imageUrl}
                  onChange={(url) => setGalleryForm((prev) => ({ ...prev, imageUrl: url }))}
                  aspectRatio="video"
                  uploadEndpoint="notice"
                  helperText="ছবি আপলোড করতে ড্র্যাগ ও ড্রপ করুন, অথবা আপনার কম্পিউটার থেকে ব্রাউজ করে নির্বাচন করুন (JPG, PNG, WebP)। সার্ভারে সরাসরি আপলোড হবে।"
                  presets={[
                    { label: "Campus Building", url: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=1200" },
                    { label: "Science Lab", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1200" },
                    { label: "Assembly / Students", url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200" },
                    { label: "Sports & Field", url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200" },
                    { label: "Library / Study", url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1200" },
                    { label: "Computer Lab", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200" },
                  ]}
                />
              </div>

              {/* Title Bengali */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  ছবির শিরোনাম (বাংলায়) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="যেমন: বার্ষিক বিজ্ঞান মেলা ও পুরষ্কার বিতরণী ২০২৬"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Title English with Auto Translate */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                    Photo Title (English)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (galleryForm.title) {
                        const translated = translateBnToEn(galleryForm.title);
                        setGalleryForm((prev) => ({ ...prev, titleEn: translated }));
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
                    title="বাংলা শিরোনাম থেকে স্বয়ংক্রিয় ইংরেজি অনুবাদ করুন"
                  >
                    <Sparkles size={11} />
                    <span>অটো ট্রান্সলেট</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={galleryForm.titleEn || ""}
                  onChange={(e) => setGalleryForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                  placeholder="e.g. Annual Science Fair & Award Ceremony 2026"
                  className="mt-1 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-black outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Category Selection & Custom */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    ক্যাটাগরি / বিভাগ (বাংলা)
                  </label>
                  <select
                    value={
                      ["ক্যাম্পাস", "ল্যাব", "সমাবেশ", "ক্রীড়া", "বিজ্ঞান মেলা", "জাতীয় দিবস", "সাংস্কৃতিক অনুষ্ঠান", "পুরস্কার বিতরণী"].includes(galleryForm.category)
                        ? galleryForm.category
                        : "অন্যান্য"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const catEnMap: Record<string, string> = {
                        "ক্যাম্পাস": "Campus",
                        "ল্যাব": "Lab",
                        "সমাবেশ": "Assembly",
                        "ক্রীড়া": "Sports",
                        "বিজ্ঞান মেলা": "Science Fair",
                        "জাতীয় দিবস": "National Day",
                        "সাংস্কৃতিক অনুষ্ঠান": "Cultural Program",
                        "পুরস্কার বিতরণী": "Award Ceremony",
                        "অন্যান্য": "Other",
                      };
                      if (val === "অন্যান্য") {
                        setGalleryForm((prev) => ({
                          ...prev,
                          category: "অন্যান্য",
                          categoryEn: prev.categoryEn || "Other",
                        }));
                      } else {
                        setGalleryForm((prev) => ({
                          ...prev,
                          category: val,
                          categoryEn: catEnMap[val] || val,
                        }));
                      }
                    }}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ক্যাম্পাস">ক্যাম্পাস (Campus)</option>
                    <option value="ল্যাব">ল্যাব ও পাঠাগার (Lab & Library)</option>
                    <option value="সমাবেশ">দৈনিক সমাবেশ (Assembly)</option>
                    <option value="ক্রীড়া">খেলাধুলা ও ক্রীড়া (Sports)</option>
                    <option value="বিজ্ঞান মেলা">বিজ্ঞান মেলা (Science Fair)</option>
                    <option value="জাতীয় দিবস">জাতীয় দিবস (National Day)</option>
                    <option value="সাংস্কৃতিক অনুষ্ঠান">সাংস্কৃতিক অনুষ্ঠান (Cultural Program)</option>
                    <option value="পুরস্কার বিতরণী">পুরস্কার বিতরণী (Award Ceremony)</option>
                    <option value="অন্যান্য">অন্যান্য (Custom / Other)</option>
                  </select>

                  {/* If custom category */}
                  {!["ক্যাম্পাস", "ল্যাব", "সমাবেশ", "ক্রীড়া", "বিজ্ঞান মেলা", "জাতীয় দিবস", "সাংস্কৃতিক অনুষ্ঠান", "পুরস্কার বিতরণী"].includes(galleryForm.category) && (
                    <input
                      type="text"
                      value={galleryForm.category === "অন্যান্য" ? "" : galleryForm.category}
                      onChange={(e) => setGalleryForm((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="কাস্টম ক্যাটাগরির নাম লিখুন..."
                      className="mt-2 w-full rounded-md border border-emerald-300 bg-emerald-50/50 px-3 py-1.5 text-xs text-black outline-none focus:border-[#006a4e] dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                      Category (English)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (galleryForm.category) {
                          const translated = translateBnToEn(galleryForm.category);
                          setGalleryForm((prev) => ({ ...prev, categoryEn: translated }));
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-400"
                    >
                      <Sparkles size={11} />
                      <span>অনুবাদ</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={galleryForm.categoryEn || ""}
                    onChange={(e) => setGalleryForm((prev) => ({ ...prev, categoryEn: e.target.value }))}
                    placeholder="e.g. Campus, Sports, Science Fair"
                    className="mt-1 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-black outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Preview Box */}
              {galleryForm.imageUrl && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="mb-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
                    <span>লাইভ প্রিভিউ (ওয়েবসাইটে যেমন দেখাবে)</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                      {galleryForm.category || "ক্যাম্পাস"}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-slate-800">
                      <img
                        src={galleryForm.imageUrl}
                        alt={galleryForm.title || "Preview"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&q=80&w=1200";
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-xs">
                        {galleryForm.title || "ছবির শিরোনাম এখানে প্রদর্শিত হবে"}
                      </h4>
                      {galleryForm.titleEn && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {galleryForm.titleEn}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between border-t pt-4 dark:border-slate-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Database size={13} className="text-[#006a4e]" />
                  <span>ডাটাবেজের সাথে সরাসরি কানেক্টেড</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseGalleryModal}
                    disabled={isSavingGalleryPhoto}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 transition"
                  >
                    বাতিল (Cancel)
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingGalleryPhoto}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a] transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingGalleryPhoto ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>ডাটাবেজে সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        <span>
                          {editingGalleryIndex !== null ? "আপডেট সংরক্ষণ করুন" : "ছবি যুক্ত ও সেভ করুন"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteContentPage;
