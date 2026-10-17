import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
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
  RotateCcw,
  Save,
  School,
  Shield,
  Sparkles,
  Star,
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
import type {
  SchoolWebsiteContent,
  SchoolNotice,
  SchoolDownloadItem,
  SchoolGalleryItem,
  SchoolCoCurricularItem,
  SchoolQuickLink,
  SchoolTeacherMember,
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
  const { websiteContent, saveWebsiteContent } = useSiteSettings();
  const [draft, setDraft] = useState<SchoolWebsiteContent>(websiteContent);
  const [activeTab, setActiveTab] = useState<ContentTab>("identity");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [editLangMode, setEditLangMode] = useState<EditLangMode>("dual");
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

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
    } catch {}

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
    } catch {}

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
    } catch {}

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

  const tabs: { id: ContentTab; label: string; icon: LucideIcon }[] = [
    { id: "identity", label: "১. বিদ্যালয় পরিচয়", icon: School },
    { id: "hero_about", label: "২. ব্যানার ও ইতিহাস", icon: LayoutDashboard },
    { id: "leadership", label: "৩. প্রশাসন ও বাণী", icon: GraduationCap },
    { id: "teachers", label: "৪. শিক্ষক ও কর্মকর্তা", icon: UserCheck },
    { id: "statistics", label: "৫. পরিসংখ্যান", icon: Award },
    { id: "notices", label: "৬. নোটিশ বোর্ড", icon: Bell },
    { id: "downloads", label: "৭. ডাউনলোড ও রুটিন", icon: Download },
    { id: "admission", label: "৮. ভর্তি তথ্য", icon: BookOpen },
    { id: "gallery", label: "৯. ফটো গ্যালারি", icon: ImageIcon },
    { id: "study_co", label: "১০. স্টাডি কর্নার", icon: BookOpen },
    { id: "links", label: "১১. সরকারি লিঙ্ক", icon: LinkIcon },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 font-sans">
      {/* Top Header */}
      <header className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006a4e] text-white">
              <Shield size={14} />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-[#006a4e] dark:text-emerald-400">
              সুপার অ্যাডমিন ড্যাশবোর্ড · দ্বিভাষিক (বাংলা ও ইংরেজি) ওয়েবসাইট ব্যবস্থাপনা
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            ওয়েবসাইটের সকল পেজের কনটেন্ট ও দ্বিভাষিক অনুবাদ (Bangla & English)
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            এই ড্যাশবোর্ড থেকে সুপার অ্যাডমিন সরাসরি বাংলা ও ইংরেজি উভয় ভাষার কনটেন্ট পরিচালনা, অটোমেটিক ট্রান্সলেশন এবং লাইভ পাবলিশ করতে পারেন।
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
          >
            <RotateCcw size={14} />
            <span>ডিফল্ট টেমপ্লেট</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <span>লাইভ ওয়েবসাইট</span>
            <ExternalLink size={14} />
          </a>
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
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                editLangMode === "bn"
                  ? "bg-[#006a4e] text-white shadow-2xs"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              }`}
            >
              <span>🇧🇩 বাংলা</span>
            </button>

            <button
              type="button"
              onClick={() => setEditLangMode("en")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                editLangMode === "en"
                  ? "bg-blue-700 text-white shadow-2xs"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              }`}
            >
              <span>🇬🇧 English</span>
            </button>

            <button
              type="button"
              onClick={() => setEditLangMode("dual")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                editLangMode === "dual"
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
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#006a4e] text-white shadow-xs"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          role="status"
          className={`mb-5 flex items-center justify-between rounded-md border p-3.5 text-xs font-semibold ${
            feedback.type === "success"
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
            </div>
          </section>
        )}

        {/* TAB 2: HERO & ABOUT */}
        {activeTab === "hero_about" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LayoutDashboard size={16} className="text-[#006a4e]" />
                ২. হোম ব্যানার, পরিচিতি ও লক্ষ্য-উদ্দেশ্য (Bilingual)
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                হোম ব্যানার ছবি (Image URL or Path)
                <input
                  type="text"
                  value={draft.heroImage}
                  onChange={(e) => updateField("heroImage", e.target.value)}
                  className={inputClass}
                />
              </label>

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

        {/* TAB 3: LEADERSHIP */}
        {activeTab === "leadership" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap size={16} className="text-[#006a4e]" />
                ৩. প্রধান শিক্ষক, সহকারী প্রধান শিক্ষক ও সভাপতি মহোদয়ের তথ্য (Bilingual)
              </span>
              <button
                type="button"
                onClick={handleTranslateCurrentTab}
                className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e] hover:bg-emerald-200"
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

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  ছবির লিঙ্ক (Image URL)
                  <input
                    type="text"
                    value={draft.principalPhoto}
                    onChange={(e) => updateField("principalPhoto", e.target.value)}
                    className={inputClass}
                  />
                </label>

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
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50/40 p-4">
              <h3 className="text-xs font-bold text-amber-900">সভাপতি, ম্যানেজিং কমিটি (SMC President)</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700">
                  সভাপতির নাম (বাংলায়)
                  <input
                    type="text"
                    value={draft.smcPresidentName}
                    onChange={(e) => updateField("smcPresidentName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800">
                  President Name (English)
                  <input
                    type="text"
                    value={draft.smcPresidentNameEn || ""}
                    onChange={(e) => updateField("smcPresidentNameEn", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700">
                  সভাপতির বার্তা (বাংলায়)
                  <textarea
                    rows={3}
                    value={draft.smcPresidentMessage}
                    onChange={(e) => updateField("smcPresidentMessage", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="text-xs font-semibold text-blue-800">
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

        {/* TAB 4: TEACHERS (CRUD) */}
        {activeTab === "teachers" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck size={16} className="text-[#006a4e]" />
                  <span>৪. শিক্ষক ও কর্মকর্তা তালিকা (দ্বিভাষিক ব্যবস্থাপনা) ({(draft.teachers || []).length} জন)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  প্রতিটি শিক্ষকের নাম, পদবী, বিষয় ও শিক্ষাগত যোগ্যতা বাংলা ও ইংরেজি উভয় ভাষায় সংরক্ষণ করুন।
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
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e] shadow-2xs hover:bg-emerald-100"
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

            <div className="mt-4 space-y-4">
              {(draft.teachers || []).map((teacher, index) => (
                <div
                  key={teacher.id || index}
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 transition hover:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-[#006a4e]">শিক্ষক #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => translateTeacherItem(index)}
                        className="text-xs text-[#006a4e] hover:underline flex items-center gap-1"
                      >
                        <Sparkles size={12} />
                        <span>অটো অনুবাদ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTeacher(index)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
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

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
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

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
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

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
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

                    <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
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
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: STATISTICS */}
        {activeTab === "statistics" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award size={16} className="text-[#006a4e]" />
                ৫. বিদ্যালয় পরিসংখ্যান ও একাডেমিক সাফল্য (বাংলা ও ইংরেজি সংখ্যা)
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

        {/* TAB 6: NOTICES */}
        {activeTab === "notices" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell size={16} className="text-[#da291c]" />
                  <span>৬. নোটিশ বোর্ড ব্যবস্থাপনা ({draft.notices.length} টি নোটিশ — দ্বিভাষিক)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  নোটিশের শিরোনাম, ক্যাটাগরি ও বিস্তারিত বিবরণ বাংলা এবং ইংরেজি উভয় ভাষায় লিখুন অথবা অটো-অনুবাদ ব্যবহার করুন।
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
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#006a4e]"
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
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e]">
                      নোটিশ #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => translateNoticeItem(index)}
                        className="text-xs text-[#006a4e] hover:underline flex items-center gap-1"
                      >
                        <Sparkles size={12} />
                        <span>ইংরেজি অনুবাদ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNotice(index)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
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

        {/* TAB 7: DOWNLOADS */}
        {activeTab === "downloads" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Download size={16} className="text-[#006a4e]" />
                  <span>৭. ডাউনলোড ও ক্লাস রুটিন (দ্বিভাষিক)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  ক্লাস রুটিন, সিলেবাস ও বার্ষিক ক্যালেন্ডার বাংলা ও ইংরেজি শিরোনামে প্রকাশ করুন।
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
                    <span className="text-xs font-bold text-[#006a4e]">ফাইল #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeDownloadItem(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>মুছুন</span>
                    </button>
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
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 8: ADMISSION INFO */}
        {activeTab === "admission" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-[#006a4e]" />
              <span>৮. অনলাইন ভর্তি তথ্য ও নীতিমালা (দ্বিভাষিক)</span>
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
              </div>
            </div>
          </section>
        )}

        {/* TAB 9: GALLERY */}
        {activeTab === "gallery" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#006a4e]" />
                  <span>৯. ফটো গ্যালারি ব্যবস্থাপনা (দ্বিভাষিক)</span>
                </h2>
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
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-3.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-[#006a4e]">ছবি #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
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

                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ছবির ইউআরএল (Image URL)
                      <input
                        type="text"
                        value={photo.imageUrl}
                        onChange={(e) => updateGalleryItem(index, "imageUrl", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 10: STUDY CORNER */}
        {activeTab === "study_co" && (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b pb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-[#006a4e]" />
                  <span>১০.১ Study Corner — মূল তথ্য ও ব্যানার (দ্বিভাষিক)</span>
                </h2>
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
              </div>
            </section>
          </div>
        )}

        {/* TAB 11: LINKS */}
        {activeTab === "links" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <LinkIcon size={16} className="text-[#006a4e]" />
                  <span>১১. সরকারি ও প্রয়োজনীয় লিঙ্কসমূহ (দ্বিভাষিক)</span>
                </h2>
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
                  className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] dark:border-slate-700"
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

                  <button
                    type="button"
                    onClick={() => removeQuickLink(index)}
                    aria-label="মুছুন"
                    className="mt-5 flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} />
                  </button>
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
