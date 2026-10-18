import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  FileUp,
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
  Plus,
  Radio,
  RotateCcw,
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
import { DEFAULT_WEBSITE_CONTENT } from "@/types/site";
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
  StudyCornerBook,
  StudyCornerResource,
  StudyCornerStat,
  StudyCornerLink,
  StudyCornerTip,
} from "@/types/site";
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
  | "links";

type EditLangMode = "bn" | "en" | "dual";

const WebsiteContentPage: React.FC = () => {
  const { websiteContent, saveWebsiteContent, siteLogo, saveSiteLogo } = useSiteSettings();
  const [draft, setDraft] = useState<SchoolWebsiteContent>(websiteContent);
  const [activeTab, setActiveTab] = useState<ContentTab>("identity");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editLangMode, setEditLangMode] = useState<EditLangMode>("dual");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [downloadSearch, setDownloadSearch] = useState("");
  const [showDirectPageLinks, setShowDirectPageLinks] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(websiteContent);
  }, [websiteContent]);

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

  const moveGalleryItem = (index: number, direction: "up" | "down") => {
    setDraft((prev) => {
      const list = [...(prev.gallery || [])];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return prev;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return { ...prev, gallery: list };
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

  // JSON Export & Import handlers
  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draft, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `website_content_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setFeedback({ type: "success", message: "ওয়েবসাইট কনটেন্ট সফলভাবে JSON ফাইলে ব্যাকআপ ডাউনলোড হয়েছে।" });
    } catch {
      setFeedback({ type: "error", message: "ব্যাকআপ তৈরি করতে সমস্যা হয়েছে।" });
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object") {
          setDraft((prev) => ({ ...prev, ...parsed }));
          setFeedback({
            type: "success",
            message: "JSON ব্যাকআপ সফলভাবে ইমপোর্ট হয়েছে! পরিবর্তনগুলো রিভিউ করে 'সংরক্ষণ ও প্রকাশ' বাটনে ক্লিক করুন।",
          });
        }
      } catch {
        setFeedback({ type: "error", message: "ফাইলটি সঠিক JSON ফরম্যাটে নেই।" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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
  const addGalleryItem = () => {
    const newItem: SchoolGalleryItem = {
      id: "g_" + Date.now(),
      title: "",
      titleEn: "",
      category: "ক্যাম্পাস",
      categoryEn: "Campus",
      imageUrl: "/images/bgimage.jpg",
    };
    setDraft((prev) => ({ ...prev, gallery: [newItem, ...(prev.gallery || [])] }));
  };

  const removeGalleryItem = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index),
    }));
  };

  const updateGalleryItem = (index: number, field: keyof SchoolGalleryItem, value: string) => {
    setDraft((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
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

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে সকল তথ্য ডিফল্ট বাংলাদেশ সরকারি স্কুল টেমপ্লেটে রিসেট করতে চান? এতে বাংলা ও ইংরেজি উভয় ভাষার নমুনা তথ্য লোড হবে।")) {
      setDraft(DEFAULT_WEBSITE_CONTENT);
      setFeedback({ type: "success", message: "ডিফল্ট বাংলাদেশ সরকারি স্কুল টেমপ্লেট তথ্য (বাংলা ও ইংরেজি) লোড হয়েছে।" });
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
          message: "অভিনন্দন! বাংলা ও ইংরেজি উভয় ভাষার সকল তথ্য সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে। লাইভ ওয়েবসাইটে ভিজিট করে ভাষা পরিবর্তন করে দেখতে পারেন।",
        });
      } else {
        setFeedback({
          type: "error",
          message: result.message || "ওয়েবসাইট কনটেন্ট সংরক্ষণ করা যায়নি।",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "সার্ভারে যোগাযোগ করা যায়নি। লোকাল ব্রাউজারে সংরক্ষিত হয়েছে।",
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
    { id: "leadership", label: "৪. প্রশাসন ও বাণী", icon: GraduationCap },
    { id: "teachers", label: "৫. শিক্ষক ও কর্মকর্তা", icon: UserCheck, badgeCount: (draft.teachers || []).length },
    { id: "statistics", label: "৬. পরিসংখ্যান ও সাফল্য", icon: Award },
    { id: "notices", label: "৭. নোটিশ বোর্ড", icon: Bell, badgeCount: (draft.notices || []).length },
    { id: "downloads", label: "৮. ডাউনলোড ও রুটিন", icon: Download, badgeCount: (draft.downloads || []).length },
    { id: "admission", label: "৯. ভর্তি তথ্য ও আসন", icon: BookOpen },
    { id: "gallery", label: "১০. ফটো গ্যালারি", icon: ImageIcon, badgeCount: (draft.gallery || []).length },
    { id: "study_co", label: "১১. স্টাডি কর্নার", icon: BookOpen },
    { id: "links", label: "১২. সরকারি লিঙ্ক", icon: LinkIcon, badgeCount: (draft.quickLinks || []).length },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 font-sans">
      {/* Hidden JSON input for backup restore */}
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportJson}
        className="hidden"
      />

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

            {isDirty && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 shadow-2xs dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <AlertCircle size={12} className="text-amber-600 animate-pulse" />
                <span>অসংরক্ষিত পরিবর্তন রয়েছে</span>
              </span>
            )}
          </div>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            ওয়েবসাইটের সকল পেজের কনটেন্ট, ডায়নামিক টিকার ও মিডিয়া আপলোড
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            এই ড্যাশবোর্ড থেকে সুপার অ্যাডমিন সরাসরি লাইভ স্ক্রলিং টিকার, ছবি ও মনোগ্রাম আপলোড, দ্বিভাষিক কনটেন্ট ও ব্যাকআপ পরিচালনা করতে পারেন।
          </p>
        </div>

        <div className="flex flex-wrap shrink-0 items-center gap-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportJson}
            title="বর্তমান কনটেন্ট ব্যাকআপ JSON ফাইলে ডাউনলোড করুন"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <FileDown size={14} className="text-emerald-700 dark:text-emerald-400" />
            <span className="hidden sm:inline">ব্যাকআপ এক্সপোর্ট</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            title="পূর্ববর্তী ব্যাকআপ JSON ফাইল রিস্টোর করুন"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <FileUp size={14} className="text-blue-700 dark:text-blue-400" />
            <span className="hidden sm:inline">ব্যাকআপ রিস্টোর</span>
          </button>

          {/* Reset Template */}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <RotateCcw size={14} />
            <span>ডিফল্ট টেমপ্লেট</span>
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
            {translating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-amber-300" />}
            <span>সম্পূর্ণ ওয়েবসাইট স্বয়ংক্রিয় ইংরেজি অনুবাদ (Auto-Translate to English)</span>
          </button>

          <button
            type="button"
            disabled={translating}
            onClick={handleTranslateCurrentTab}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-white px-3 py-1.5 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-50 dark:bg-slate-800 dark:text-emerald-300 dark:hover:bg-slate-700"
          >
            <Wand2 size={13} />
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
                            <Sparkles size={12} />
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
                <Sparkles size={11} />
                <span>এই সেকশন অটো-অনুবাদ</span>
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

        {/* TAB 4: LEADERSHIP */}
        {activeTab === "leadership" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap size={16} className="text-[#006a4e]" />
                ৪. প্রধান শিক্ষক, সহকারী প্রধান শিক্ষক ও সভাপতি মহোদয়ের তথ্য (Bilingual)
              </span>
              <button
                type="button"
                onClick={handleTranslateCurrentTab}
                className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <Sparkles size={11} />
                <span>বাণী ও পদবী অনুবাদ</span>
              </button>
            </h2>

            {/* Principal */}
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <h3 className="text-xs font-bold text-[#006a4e] dark:text-emerald-400">প্রধান শিক্ষক / Headmaster</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  নাম (বাংলায়)
                  <input
                    type="text"
                    value={draft.principalName}
                    onChange={(e) => updateField("principalName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Name (English)
                  <input
                    type="text"
                    value={draft.principalNameEn || ""}
                    onChange={(e) => updateField("principalNameEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পদবি (বাংলায়)
                  <input
                    type="text"
                    value={draft.principalTitle}
                    onChange={(e) => updateField("principalTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Title (English)
                  <input
                    type="text"
                    value={draft.principalTitleEn || ""}
                    onChange={(e) => updateField("principalTitleEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  যোগ্যতা (বাংলায়)
                  <input
                    type="text"
                    value={draft.principalQualification}
                    onChange={(e) => updateField("principalQualification", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Qualification (English)
                  <input
                    type="text"
                    value={draft.principalQualificationEn || ""}
                    onChange={(e) => updateField("principalQualificationEn", e.target.value)}
                    className={inputClass}
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

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  প্রধান শিক্ষকের শুভেচ্ছা বাণী (বাংলায়)
                  <textarea
                    rows={4}
                    value={draft.principalMessage}
                    onChange={(e) => updateField("principalMessage", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Principal's Message (English)
                  <textarea
                    rows={4}
                    value={draft.principalMessageEn || ""}
                    onChange={(e) => updateField("principalMessageEn", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>

            {/* Assistant Principal */}
            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">সহকারী প্রধান শিক্ষক / Assistant Headmaster</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  নাম (বাংলায়)
                  <input
                    type="text"
                    value={draft.asstPrincipalName}
                    onChange={(e) => updateField("asstPrincipalName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Name (English)
                  <input
                    type="text"
                    value={draft.asstPrincipalNameEn || ""}
                    onChange={(e) => updateField("asstPrincipalNameEn", e.target.value)}
                    className={inputClass}
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
                  সহকারী প্রধান শিক্ষকের বাণী (বাংলায়)
                  <textarea
                    rows={2}
                    value={draft.asstPrincipalMessage}
                    onChange={(e) => updateField("asstPrincipalMessage", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300 sm:col-span-2">
                  Assistant Principal's Message (English)
                  <textarea
                    rows={2}
                    value={draft.asstPrincipalMessageEn || ""}
                    onChange={(e) => updateField("asstPrincipalMessageEn", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>

            {/* SMC President */}
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-400">সভাপতি, ম্যানেজিং কমিটি (SMC President)</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  সভাপতির নাম (বাংলায়)
                  <input
                    type="text"
                    value={draft.smcPresidentName}
                    onChange={(e) => updateField("smcPresidentName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  President Name (English)
                  <input
                    type="text"
                    value={draft.smcPresidentNameEn || ""}
                    onChange={(e) => updateField("smcPresidentNameEn", e.target.value)}
                    className={inputClass}
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

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  সভাপতির বার্তা (বাংলায়)
                  <textarea
                    rows={3}
                    value={draft.smcPresidentMessage}
                    onChange={(e) => updateField("smcPresidentMessage", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  President's Message (English)
                  <textarea
                    rows={3}
                    value={draft.smcPresidentMessageEn || ""}
                    onChange={(e) => updateField("smcPresidentMessageEn", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: TEACHERS (CRUD) */}
        {activeTab === "teachers" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={16} className="text-[#006a4e]" />
                  <span>৫. শিক্ষক ও কর্মকর্তা তালিকা (দ্বিভাষিক ব্যবস্থাপনা) ({(draft.teachers || []).length} জন)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  প্রতিটি শিক্ষকের ছবি আপলোড, নাম, পদবী, বিষয়, ক্যাটাগরি ও যোগাযোগ তথ্য বাংলা ও ইংরেজি উভয় ভাষায় সংরক্ষণ করুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
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
                  <Sparkles size={13} />
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
                <Sparkles size={12} />
                <span>ইংরেজি সংখ্যায় রূপান্তর</span>
              </button>
            </h2>

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
                  <Sparkles size={13} />
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

        {/* TAB 9: ADMISSION INFO */}
        {activeTab === "admission" && (
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  ভর্তি নির্দেশিকা (বাংলায়)
                  <textarea
                    rows={4}
                    value={draft.admissionGuidelines}
                    onChange={(e) => updateField("admissionGuidelines", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Admission Guidelines (English)
                  <textarea
                    rows={4}
                    value={draft.admissionGuidelinesEn || ""}
                    onChange={(e) => updateField("admissionGuidelinesEn", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  শ্রেণিভিত্তিক আসন সংখ্যা (বাংলায়)
                  <input
                    type="text"
                    value={draft.admissionSeats}
                    onChange={(e) => updateField("admissionSeats", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Admission Seats (English)
                  <input
                    type="text"
                    value={draft.admissionSeatsEn || ""}
                    onChange={(e) => updateField("admissionSeatsEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

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
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 10: GALLERY */}
        {activeTab === "gallery" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#006a4e]" />
                  <span>১০. ফটো গ্যালারি ব্যবস্থাপনা (দ্বিভাষিক) ({draft.gallery.length} টি ছবি)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  বিদ্যালয় ক্যাম্পাস, সাংস্কৃতিক অনুষ্ঠান ও ক্রীড়া প্রতিযোগিতার ছবি আপলোড করুন ও সাজান।
                </p>
              </div>

              <button
                type="button"
                onClick={addGalleryItem}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
              >
                <Plus size={14} />
                <span>নতুন ছবি যোগ করুন</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(draft.gallery || []).map((photo, index) => (
                <div
                  key={photo.id || index}
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                      ছবি #{index + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveGalleryItem(index, "up")}
                        disabled={index === 0}
                        title="উপরে নিন"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGalleryItem(index, "down")}
                        disabled={index === (draft.gallery || []).length - 1}
                        title="নিচে নিন"
                        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-black disabled:opacity-30 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => translateGalleryItem(index)}
                        className="text-xs text-[#006a4e] hover:underline flex items-center gap-1 ml-1 dark:text-emerald-400"
                      >
                        <Sparkles size={12} />
                        <span>অনুবাদ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(index)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 ml-1"
                      >
                        <Trash2 size={13} />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {/* Image Upload Field */}
                    <ImageUploadField
                      label="গ্যালারির ছবি (Gallery Image)"
                      value={photo.imageUrl}
                      onChange={(url) => updateGalleryItem(index, "imageUrl", url)}
                      aspectRatio="video"
                      helperText="ডিভাইস থেকে ছবি আপলোড করুন অথবা ফটো লিঙ্ক প্রদান করুন।"
                      presets={[
                        { label: "Campus View", url: "/images/bgimage.jpg" },
                        { label: "Sports Day", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800" },
                        { label: "Classroom", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800" },
                      ]}
                    />

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        ছবির শিরোনাম (বাংলায়)
                        <input
                          type="text"
                          value={photo.title}
                          onChange={(e) => updateGalleryItem(index, "title", e.target.value)}
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-blue-800 dark:text-blue-300">
                        Photo Title (English)
                        <input
                          type="text"
                          value={photo.titleEn || ""}
                          onChange={(e) => updateGalleryItem(index, "titleEn", e.target.value)}
                          placeholder="e.g. Main Academic Building"
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                        ক্যাটাগরি (Category)
                        <select
                          value={photo.category || "ক্যাম্পাস"}
                          onChange={(e) => {
                            updateGalleryItem(index, "category", e.target.value);
                            updateGalleryItem(index, "categoryEn", translateBnToEn(e.target.value));
                          }}
                          className={inputClass}
                        >
                          <option value="ক্যাম্পাস">ক্যাম্পাস (Campus)</option>
                          <option value="অনুষ্ঠান">অনুষ্ঠান (Events)</option>
                          <option value="ক্রীড়া">ক্রীড়া (Sports)</option>
                          <option value="পুরস্কার">পুরস্কার (Awards)</option>
                          <option value="অন্যান্য">অন্যান্য (Other)</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
              <Sparkles size={14} />
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
    </div>
  );
};

export default WebsiteContentPage;
