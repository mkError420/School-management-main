import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileUp,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Info,
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

const WebsiteContentPage: React.FC = () => {
  const { websiteContent, saveWebsiteContent } = useSiteSettings();
  const [draft, setDraft] = useState<SchoolWebsiteContent>(websiteContent);
  const [activeTab, setActiveTab] = useState<ContentTab>("identity");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  // Notice handlers
  const addNotice = () => {
    const newNotice: SchoolNotice = {
      id: "n_" + Date.now(),
      title: "",
      date: new Date().toISOString().slice(0, 10),
      category: "সাধারণ",
      content: "",
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

  const [uploadingNoticeIndex, setUploadingNoticeIndex] = useState<number | null>(null);
  const [noticeUploadError, setNoticeUploadError] = useState<{ index: number; message: string } | null>(null);

  const handleNoticeFileUpload = async (index: number, file: File) => {
    // 10 MB limit
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
    } catch {
      // Fallback to FileReader base64 DataURL
    }

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
      category: "রুটিন",
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

  // Gallery handlers
  const addGalleryItem = () => {
    const newItem: SchoolGalleryItem = {
      id: "g_" + Date.now(),
      title: "",
      category: "ক্যাম্পাস",
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

  // Teacher handlers
  const addTeacher = () => {
    const newTeacher: SchoolTeacherMember = {
      id: "t_" + Date.now(),
      name: "",
      designation: "সহকারী শিক্ষক",
      subject: "সাধারণ বিষয়",
      qualification: "স্নাতক / স্নাতকোত্তর",
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

  // Quick links handlers
  const addQuickLink = () => {
    const newLink: SchoolQuickLink = { label: "", url: "#" };
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
    const newBook: StudyCornerBook = { title: "", author: "", category: "গণিত" };
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
      description: "",
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
    const newStat: StudyCornerStat = { label: "", value: "" };
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
    const newLink: StudyCornerLink = { name: "", url: "https://", desc: "" };
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
    const newTip: StudyCornerTip = { tip: "" };
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

  const updateStudyCornerTip = (index: number, value: string) => {
    setDraft((prev) => ({
      ...prev,
      studyCornerTips: (prev.studyCornerTips || []).map((item, i) =>
        i === index ? { ...item, tip: value } : item
      ),
    }));
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে সকল তথ্য ডিফল্ট বাংলাদেশ সরকারি স্কুল টেমপ্লেটে রিসেট করতে চান?")) {
      setDraft(DEFAULT_WEBSITE_CONTENT);
      setFeedback({ type: "success", message: "ডিফল্ট বাংলাদেশ সরকারি স্কুল টেমপ্লেট তথ্য লোড হয়েছে।" });
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
          message: "অভিনন্দন! সরকারি স্কুল ওয়েবসাইটের সকল পেজের তথ্য সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে।",
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
              সুপার অ্যাডমিন ড্যাশবোর্ড · মাল্টি-পেজ ওয়েবসাইট ব্যবস্থাপনা
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            সরকারি স্কুল ওয়েবসাইটের সকল পেজের কনটেন্ট পরিবর্তন
          </h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            এই ড্যাশবোর্ড থেকে সুপার অ্যাডমিন সরাসরি হোমপেজ, আমাদের কথা, প্রশাসন, শিক্ষক তালিকা, নোটিশ বোর্ড, ক্লাস রুটিন, ভর্তি তথ্য ও গ্যালারি পেজের সকল তথ্য ডায়নামিকভাবে নিয়ন্ত্রণ করতে পারেন।
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
              : "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <Check size={16} /> : <Info size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: IDENTITY */}
        {activeTab === "identity" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <School size={16} className="text-[#006a4e]" />
              <span>১. বিদ্যালয়ের পরিচয় ও প্রাতিষ্ঠানিক তথ্য</span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                বিদ্যালয়ের নাম (বাংলায়) *
                <input
                  type="text"
                  value={draft.schoolNameBn}
                  onChange={(e) => updateField("schoolNameBn", e.target.value)}
                  placeholder="যেমন: এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়"
                  className={inputClass}
                  required
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                School Name (English) *
                <input
                  type="text"
                  value={draft.schoolName}
                  onChange={(e) => updateField("schoolName", e.target.value)}
                  placeholder="e.g. MK Government Model High School"
                  className={inputClass}
                  required
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                বিদ্যালয়ের মূলমন্ত্র (বাংলায়)
                <input
                  type="text"
                  value={draft.mottoBn}
                  onChange={(e) => updateField("mottoBn", e.target.value)}
                  placeholder="জ্ঞান, শৃঙ্খলা ও মনুষ্যত্ব"
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                School Motto (English)
                <input
                  type="text"
                  value={draft.motto}
                  onChange={(e) => updateField("motto", e.target.value)}
                  placeholder="Education, Discipline and Humanity"
                  className={inputClass}
                />
              </label>

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

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                সংশ্লিষ্ট শিক্ষা বোর্ড
                <input
                  type="text"
                  value={draft.boardName}
                  onChange={(e) => updateField("boardName", e.target.value)}
                  placeholder="ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড"
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                জেলা ও বিভাগ
                <input
                  type="text"
                  value={draft.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  placeholder="ঢাকা, বাংলাদেশ"
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                স্থাপিত সন
                <input
                  type="text"
                  value={draft.establishedYear}
                  onChange={(e) => updateField("establishedYear", e.target.value)}
                  placeholder="1985"
                  className={inputClass}
                />
              </label>

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

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                অফিস সময়সূচী
                <input
                  type="text"
                  value={draft.officeHours}
                  onChange={(e) => updateField("officeHours", e.target.value)}
                  placeholder="রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০"
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                সম্পূর্ণ ঠিকানা
                <input
                  type="text"
                  value={draft.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ"
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                টিকার নোটিশ (জরুরি সংবাদ স্ক্রল)
                <input
                  type="text"
                  value={draft.breakingNews}
                  onChange={(e) => updateField("breakingNews", e.target.value)}
                  placeholder="২০২৬ শিক্ষাবর্ষে ভর্তি আবেদন চলমান রয়েছে..."
                  className={inputClass}
                />
              </label>
            </div>
          </section>
        )}

        {/* TAB 2: HERO & ABOUT */}
        {activeTab === "hero_about" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutDashboard size={16} className="text-[#006a4e]" />
              <span>২. হোম ব্যানার, পরিচিতি ও লক্ষ্য-উদ্দেশ্য</span>
            </h2>

            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                হোম ব্যানার প্রধান শিরোনাম *
                <input
                  type="text"
                  value={draft.heroTitle}
                  onChange={(e) => updateField("heroTitle", e.target.value)}
                  className={inputClass}
                  required
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                হোম ব্যানার উপ-শিরোনাম
                <input
                  type="text"
                  value={draft.heroSubtitle}
                  onChange={(e) => updateField("heroSubtitle", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                হোম ব্যানার পরিচিতি বিবরণ
                <textarea
                  rows={3}
                  value={draft.heroDescription}
                  onChange={(e) => updateField("heroDescription", e.target.value)}
                  className={textareaClass}
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                হোম ব্যানার ছবি (Image URL or Path)
                <input
                  type="text"
                  value={draft.heroImage}
                  onChange={(e) => updateField("heroImage", e.target.value)}
                  className={inputClass}
                />
              </label>

              <div className="border-t pt-4">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পরিচিতি পেজের শিরোনাম
                  <input
                    type="text"
                    value={draft.aboutTitle}
                    onChange={(e) => updateField("aboutTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                বিদ্যালয় পরিচিতি বিবরণ (About Us)
                <textarea
                  rows={4}
                  value={draft.aboutText}
                  onChange={(e) => updateField("aboutText", e.target.value)}
                  className={textareaClass}
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                বিদ্যালয়ের ইতিহাস (History of the School)
                <textarea
                  rows={3}
                  value={draft.historyText}
                  onChange={(e) => updateField("historyText", e.target.value)}
                  className={textareaClass}
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                ক্যাম্পাস পরিচিতি (Campus Overview)
                <textarea
                  rows={3}
                  value={draft.campusOverview}
                  onChange={(e) => updateField("campusOverview", e.target.value)}
                  className={textareaClass}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  আমাদের লক্ষ্য (Mission)
                  <textarea
                    rows={3}
                    value={draft.missionText}
                    onChange={(e) => updateField("missionText", e.target.value)}
                    className={textareaClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  আমাদের দৃষ্টিভঙ্গি (Vision)
                  <textarea
                    rows={3}
                    value={draft.visionText}
                    onChange={(e) => updateField("visionText", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: LEADERSHIP */}
        {activeTab === "leadership" && (
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={16} className="text-[#006a4e]" />
              <span>৩. প্রধান শিক্ষক, সহকারী প্রধান শিক্ষক ও সভাপতি মহোদয়ের তথ্য</span>
            </h2>

            {/* Principal */}
            <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <h3 className="text-xs font-bold text-[#006a4e] dark:text-emerald-400">প্রধান শিক্ষক</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  নাম
                  <input
                    type="text"
                    value={draft.principalName}
                    onChange={(e) => updateField("principalName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পদবি
                  <input
                    type="text"
                    value={draft.principalTitle}
                    onChange={(e) => updateField("principalTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  যোগ্যতা
                  <input
                    type="text"
                    value={draft.principalQualification}
                    onChange={(e) => updateField("principalQualification", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-3">
                  ছবির লিঙ্ক (Image URL)
                  <input
                    type="text"
                    value={draft.principalPhoto}
                    onChange={(e) => updateField("principalPhoto", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-3">
                  প্রধান শিক্ষকের শুভেচ্ছা বাণী
                  <textarea
                    rows={4}
                    value={draft.principalMessage}
                    onChange={(e) => updateField("principalMessage", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>

            {/* Assistant Principal */}
            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">সহকারী প্রধান শিক্ষক</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  নাম
                  <input
                    type="text"
                    value={draft.asstPrincipalName}
                    onChange={(e) => updateField("asstPrincipalName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  পদবি
                  <input
                    type="text"
                    value={draft.asstPrincipalTitle}
                    onChange={(e) => updateField("asstPrincipalTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  ছবির লিঙ্ক
                  <input
                    type="text"
                    value={draft.asstPrincipalPhoto}
                    onChange={(e) => updateField("asstPrincipalPhoto", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  সহকারী প্রধান শিক্ষকের বাণী
                  <textarea
                    rows={3}
                    value={draft.asstPrincipalMessage}
                    onChange={(e) => updateField("asstPrincipalMessage", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>

            {/* SMC President */}
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50/40 p-4">
              <h3 className="text-xs font-bold text-amber-900">সভাপতি, ম্যানেজিং কমিটি (SMC)</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700">
                  সভাপতির নাম
                  <input
                    type="text"
                    value={draft.smcPresidentName}
                    onChange={(e) => updateField("smcPresidentName", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700">
                  পদবি
                  <input
                    type="text"
                    value={draft.smcPresidentTitle}
                    onChange={(e) => updateField("smcPresidentTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 sm:col-span-2">
                  সভাপতির ছবির লিঙ্ক
                  <input
                    type="text"
                    value={draft.smcPresidentPhoto}
                    onChange={(e) => updateField("smcPresidentPhoto", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="text-xs font-semibold text-gray-700 sm:col-span-2">
                  সভাপতির বার্তা
                  <textarea
                    rows={3}
                    value={draft.smcPresidentMessage}
                    onChange={(e) => updateField("smcPresidentMessage", e.target.value)}
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
                  <span>৪. শিক্ষক ও কর্মকর্তা তালিকা ব্যবস্থাপনা ({(draft.teachers || []).length} জন)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  পাবলিক ওয়েবসাইট `/teachers-list` পেজের শিক্ষক ও কর্মকর্তা তালিকা নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={addTeacher}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
              >
                <Plus size={14} />
                <span>নতুন শিক্ষক / কর্মকর্তা যোগ করুন</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {(draft.teachers || []).map((teacher, index) => (
                <div
                  key={teacher.id || index}
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-4 transition hover:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#006a4e]">
                      শিক্ষক/কর্মকর্তা #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTeacher(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      শিক্ষকের নাম *
                      <input
                        type="text"
                        value={teacher.name}
                        onChange={(e) => updateTeacher(index, "name", e.target.value)}
                        placeholder="যেমন: এস. এম. তানভীর আহমেদ"
                        className={inputClass}
                        required
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      পদবি
                      <input
                        type="text"
                        value={teacher.designation}
                        onChange={(e) => updateTeacher(index, "designation", e.target.value)}
                        placeholder="সিনিয়র শিক্ষক / সহকারী শিক্ষক"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      পাঠদানের বিষয়
                      <input
                        type="text"
                        value={teacher.subject}
                        onChange={(e) => updateTeacher(index, "subject", e.target.value)}
                        placeholder="গণিত / বাংলা / ইংরেজি"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      শিক্ষাগত যোগ্যতা
                      <input
                        type="text"
                        value={teacher.qualification}
                        onChange={(e) => updateTeacher(index, "qualification", e.target.value)}
                        placeholder="বি.এস.সি (অনার্স), এম.এস.সি"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি
                      <select
                        value={teacher.category}
                        onChange={(e) => updateTeacher(index, "category", e.target.value as any)}
                        className={inputClass}
                      >
                        <option value="শিক্ষক">শিক্ষক</option>
                        <option value="প্রশাসন">প্রশাসন</option>
                        <option value="কর্মচারী">কর্মচারী</option>
                      </select>
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ছবির লিংক (Photo URL)
                      <input
                        type="text"
                        value={teacher.photo || ""}
                        onChange={(e) => updateTeacher(index, "photo", e.target.value)}
                        placeholder="https://... বা /images/avatar.png"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ফোন নম্বর
                      <input
                        type="text"
                        value={teacher.phone || ""}
                        onChange={(e) => updateTeacher(index, "phone", e.target.value)}
                        placeholder="+880 1..."
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                      ইমেইল
                      <input
                        type="email"
                        value={teacher.email || ""}
                        onChange={(e) => updateTeacher(index, "email", e.target.value)}
                        placeholder="teacher@mkschool.edu.bd"
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
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award size={16} className="text-[#006a4e]" />
              <span>৫. বিদ্যালয় পরিসংখ্যান ও একাডেমিক সাফল্য</span>
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                মোট শিক্ষার্থী সংখ্যা
                <input
                  type="text"
                  value={draft.studentCount}
                  onChange={(e) => updateField("studentCount", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                মোট শিক্ষক সংখ্যা
                <input
                  type="text"
                  value={draft.teacherCount}
                  onChange={(e) => updateField("teacherCount", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                কর্মচারী সংখ্যা
                <input
                  type="text"
                  value={draft.staffCount}
                  onChange={(e) => updateField("staffCount", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                শ্রেণি কক্ষ সংখ্যা
                <input
                  type="text"
                  value={draft.classCount}
                  onChange={(e) => updateField("classCount", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                পাসের হার (%)
                <input
                  type="text"
                  value={draft.passRate}
                  onChange={(e) => updateField("passRate", e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                জিপিএ-৫ প্রাপ্তি
                <input
                  type="text"
                  value={draft.gpa5Count}
                  onChange={(e) => updateField("gpa5Count", e.target.value)}
                  className={inputClass}
                />
              </label>
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
                  <span>৬. নোটিশ বোর্ড ব্যবস্থাপনা ({draft.notices.length} টি নোটিশ)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  সকল প্রকার ভর্তি, পরীক্ষা, ফলাফল ও প্রাতিষ্ঠানিক আদেশ যোগ বা অপসারণ করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={addNotice}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
              >
                <Plus size={14} />
                <span>নতুন নোটিশ যোগ করুন</span>
              </button>
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
                    <button
                      type="button"
                      onClick={() => removeNotice(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                      নোটিশের শিরোনাম *
                      <input
                        type="text"
                        value={notice.title}
                        onChange={(e) => updateNotice(index, "title", e.target.value)}
                        className={inputClass}
                        required
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      তারিখ
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
                        onChange={(e) => updateNotice(index, "category", e.target.value)}
                        className={inputClass}
                      >
                        <option value="সাধারণ">সাধারণ</option>
                        <option value="ভর্তি">ভর্তি</option>
                        <option value="পরীক্ষা">পরীক্ষা</option>
                        <option value="একাডেমিক">একাডেমিক</option>
                      </select>
                    </label>

                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <FileText size={13} className="text-[#006a4e]" />
                          <span>ফাইল বা পিডিএফ লিঙ্ক (ছবি বা পিডিএফ আপলোড)</span>
                        </label>
                        <span className="text-[10px] text-gray-500 font-medium">
                          PDF, JPG, PNG, WebP (সর্বোচ্চ ১০MB)
                        </span>
                      </div>

                      {/* Hidden File Input for this specific notice */}
                      <input
                        type="file"
                        id={`notice-file-input-${notice.id || index}`}
                        accept="application/pdf,image/png,image/jpeg,image/webp,image/svg+xml,.pdf,.jpg,.jpeg,.png,.webp,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleNoticeFileUpload(index, file);
                          }
                          e.target.value = "";
                        }}
                      />

                      {/* File Card if file is attached and not '#' */}
                      {notice.fileUrl && notice.fileUrl.trim() !== "" && notice.fileUrl.trim() !== "#" ? (
                        <div className="rounded-md border border-gray-200 bg-white p-2.5 shadow-2xs dark:border-slate-700 dark:bg-slate-800/80">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {notice.fileUrl.startsWith("data:image/") ||
                              /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(notice.fileUrl) ? (
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded border border-emerald-300 bg-gray-50 dark:border-emerald-700">
                                  <img
                                    src={notice.fileUrl}
                                    alt="Notice file"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : notice.fileUrl.startsWith("data:application/pdf") ||
                                /\.pdf(\?.*)?$/i.test(notice.fileUrl) ? (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-red-200 bg-red-100 text-red-700 font-bold text-[10px] shadow-2xs dark:border-red-800 dark:bg-red-950/60 dark:text-red-400">
                                  PDF
                                </div>
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-[#006a4e]">
                                  <LinkIcon size={18} />
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-[#006a4e] dark:bg-emerald-950/60 dark:text-emerald-300">
                                    {notice.fileUrl.startsWith("data:image/") ||
                                    /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(notice.fileUrl)
                                      ? "সংযুক্ত ছবি"
                                      : notice.fileUrl.startsWith("data:application/pdf") ||
                                        /\.pdf(\?.*)?$/i.test(notice.fileUrl)
                                      ? "সংযুক্ত পিডিএফ"
                                      : "সংযুক্ত ওয়েব লিঙ্ক"}
                                  </span>
                                  {uploadingNoticeIndex === index && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006a4e]">
                                      <Loader2 size={12} className="animate-spin" />
                                      আপলোড হচ্ছে...
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-300 max-w-[200px] sm:max-w-[300px]">
                                  {notice.fileUrl.startsWith("data:")
                                    ? "লোকাল ফাইল ডাটা (সফলভাবে যুক্ত)"
                                    : notice.fileUrl}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <a
                                href={notice.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200"
                                title="প্রিভিউ দেখুন"
                              >
                                <Eye size={12} />
                                <span>দেখুন</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(
                                    `notice-file-input-${notice.id || index}`
                                  ) as HTMLInputElement;
                                  el?.click();
                                }}
                                disabled={uploadingNoticeIndex === index}
                                className="inline-flex items-center gap-1 rounded bg-[#006a4e] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#00503a] disabled:opacity-50"
                              >
                                <Upload size={12} />
                                <span>নতুন ফাইল</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => updateNotice(index, "fileUrl", "")}
                                className="inline-flex items-center gap-1 rounded bg-red-50 p-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
                                title="ফাইল মুছুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div
                            onClick={() => {
                              const el = document.getElementById(
                                `notice-file-input-${notice.id || index}`
                              ) as HTMLInputElement;
                              el?.click();
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleNoticeFileUpload(index, file);
                            }}
                            className="group flex cursor-pointer items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-white p-3 text-center transition hover:border-[#006a4e] hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-[#006a4e]"
                          >
                            {uploadingNoticeIndex === index ? (
                              <div className="flex items-center gap-2 py-1 text-xs font-semibold text-[#006a4e]">
                                <Loader2 size={16} className="animate-spin" />
                                <span>ফাইল আপলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#006a4e] transition group-hover:scale-110 dark:bg-emerald-950/60 dark:text-emerald-400">
                                  <FileUp size={16} />
                                </div>
                                <div className="text-left text-xs">
                                  <p className="font-bold text-gray-800 dark:text-gray-200">
                                    ছবি বা পিডিএফ ফাইল আপলোড করতে ক্লিক করুন
                                  </p>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    বা ফাইল টেনে এনে এখানে ড্রপ করুন (PDF, JPG, PNG, WebP — সর্বোচ্চ ১০MB)
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500 shrink-0">অথবা সরাসরি লিঙ্ক দিন:</span>
                            <input
                              type="text"
                              value={notice.fileUrl || ""}
                              onChange={(e) => updateNotice(index, "fileUrl", e.target.value)}
                              placeholder="https://... বা ফাইলের লিঙ্ক"
                              className="flex-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs text-black outline-none transition focus:border-[#006a4e] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {noticeUploadError && noticeUploadError.index === index && (
                        <div className="flex items-center gap-1.5 rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{noticeUploadError.message}</span>
                          <button
                            type="button"
                            onClick={() => setNoticeUploadError(null)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-3">
                      নোটিশের পূর্ণাঙ্গ বিবরণ
                      <textarea
                        rows={2}
                        value={notice.content || ""}
                        onChange={(e) => updateNotice(index, "content", e.target.value)}
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
                  <span>৭. ডাউনলোড ও একাডেমিক রুটিন ব্যবস্থাপনা</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  ক্লাস রুটিন, সিলেবাস ও শিক্ষাপঞ্জি ডাউনলোড আইটেম।
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

            <div className="mt-4 space-y-3">
              {(draft.downloads || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-3.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-[#006a4e]">ডাউনলোড #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeDownloadItem(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                      ফাইলের নাম / শিরোনাম
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateDownloadItem(index, "title", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateDownloadItem(index, "category", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      প্রকাশের তারিখ
                      <input
                        type="date"
                        value={item.publishDate}
                        onChange={(e) => updateDownloadItem(index, "publishDate", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                      ফাইল ডাউনলোড লিঙ্ক (PDF URL or Path)
                      <input
                        type="text"
                        value={item.fileUrl}
                        onChange={(e) => updateDownloadItem(index, "fileUrl", e.target.value)}
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
              <span>৮. অনলাইন ভর্তি তথ্য ও নীতিমালা</span>
            </h2>

            <div className="mt-4 space-y-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                ভর্তি নির্দেশিকা ও সাধারণ নিয়মাবলি
                <textarea
                  rows={4}
                  value={draft.admissionGuidelines}
                  onChange={(e) => updateField("admissionGuidelines", e.target.value)}
                  placeholder="মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তরের ডিজিটাল লটারির মাধ্যমে..."
                  className={textareaClass}
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                শ্রেণিভিত্তিক আসন সংখ্যা বিবরণ
                <input
                  type="text"
                  value={draft.admissionSeats}
                  onChange={(e) => updateField("admissionSeats", e.target.value)}
                  placeholder="৬ষ্ঠ শ্রেণি: ১২০ আসন · ৭ম শ্রেণি: ৩০ আসন..."
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                সরকারি অনলাইন ভর্তি পোর্টাল লিঙ্ক (GSA URL)
                <input
                  type="text"
                  value={draft.admissionFormUrl}
                  onChange={(e) => updateField("admissionFormUrl", e.target.value)}
                  placeholder="https://gsa.teletalk.com.bd"
                  className={inputClass}
                />
              </label>
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
                  <span>৯. ফটো গ্যালারি ব্যবস্থাপনা</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  বিদ্যালয় ক্যাম্পাস, ল্যাব, প্রাত্যহিক সমাবেশ ও জাতীয় দিবসের ছবি।
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
                      ছবির শিরোনাম
                      <input
                        type="text"
                        value={photo.title}
                        onChange={(e) => updateGalleryItem(index, "title", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি
                      <input
                        type="text"
                        value={photo.category}
                        onChange={(e) => updateGalleryItem(index, "category", e.target.value)}
                        className={inputClass}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ছবির ইউআরএল (Image URL or Path)
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
            {/* 1. Basic Info & Banner */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b pb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-[#006a4e]" />
                  <span>১০.১ Study Corner — মূল তথ্য, ব্যানার ও উক্তি</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Study Corner পেজের শীর্ষ ব্যানার, পরিচিতি, অনুপ্রেরণামূলক উক্তি ও সময়সূচি পরিচালনা করুন।
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Study Corner শিরোনাম (Title)
                  <input
                    type="text"
                    value={draft.studyCornerTitle || ""}
                    onChange={(e) => updateField("studyCornerTitle", e.target.value)}
                    placeholder="Study Corner — জ্ঞান অন্বেষণের কেন্দ্র"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  সাব-টাইটেল / স্লোগান (Subtitle)
                  <input
                    type="text"
                    value={draft.studyCornerSubtitle || ""}
                    onChange={(e) => updateField("studyCornerSubtitle", e.target.value)}
                    placeholder="শিক্ষার্থীদের সমৃদ্ধ মানসিক বিকাশ ও জ্ঞান আহরণের জন্য বিদ্যালয়ের বিশেষ পাঠ ও গবেষণা কেন্দ্র"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  কভার ছবির লিঙ্ক (Image URL)
                  <input
                    type="text"
                    value={draft.studyCornerImage || ""}
                    onChange={(e) => updateField("studyCornerImage", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  বিস্তারিত বিবরণ (Detailed Overview)
                  <textarea
                    rows={3}
                    value={draft.studyCornerText || ""}
                    onChange={(e) => updateField("studyCornerText", e.target.value)}
                    placeholder="বিদ্যালয়ের Study Corner হলো শিক্ষার্থীদের জন্য একটি বিশেষ পাঠ ও গবেষণা কেন্দ্র..."
                    className={textareaClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  অনুপ্রেরণামূলক উক্তি (Quote)
                  <input
                    type="text"
                    value={draft.studyCornerQuote || ""}
                    onChange={(e) => updateField("studyCornerQuote", e.target.value)}
                    placeholder="“জ্ঞানই শক্তি। পড়ো এবং নিজেকে আলোকিত করো।”"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  উক্তির বক্তা / উৎস (Quote Author / Attribution)
                  <input
                    type="text"
                    value={draft.studyCornerQuoteAuthor || ""}
                    onChange={(e) => updateField("studyCornerQuoteAuthor", e.target.value)}
                    placeholder="Study Corner, বিদ্যালয় পাঠ কেন্দ্র"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  খোলা থাকার দিনসমূহ (Days)
                  <input
                    type="text"
                    value={draft.studyCornerDays || ""}
                    onChange={(e) => updateField("studyCornerDays", e.target.value)}
                    placeholder="সোমবার - শনিবার"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  সময়সূচি (Visiting Hours)
                  <input
                    type="text"
                    value={draft.studyCornerHours || ""}
                    onChange={(e) => updateField("studyCornerHours", e.target.value)}
                    placeholder="সকাল ৮:০০ - বিকাল ৪:০০"
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                  প্রবেশ নীতি / শর্ত (Fee / Policy)
                  <input
                    type="text"
                    value={draft.studyCornerFee || ""}
                    onChange={(e) => updateField("studyCornerFee", e.target.value)}
                    placeholder="বিনামূল্যে প্রবেশ"
                    className={inputClass}
                  />
                </label>
              </div>
            </section>

            {/* 2. Quick Highlights / Stats */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award size={16} className="text-[#006a4e]" />
                    <span>১০.২ ব্যানার পরিসংখ্যান (Quick Stats)</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    ব্যানারে প্রদর্শিত ৪টি হাইলাইট পরিসংখ্যান (বই সংখ্যা, ই-রিসোর্স, পাঠক, আসন)।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addStudyCornerStat}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন পরিসংখ্যান যোগ করুন</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(draft.studyCornerStats || []).map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-gray-200 bg-[#fbfdfc] p-3.5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-[#006a4e]">পরিসংখ্যান #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeStudyCornerStat(idx)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>মুছুন</span>
                      </button>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        লেবেল (Label)
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => updateStudyCornerStat(idx, "label", e.target.value)}
                          placeholder="রেফারেন্স বই"
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        মান (Value)
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => updateStudyCornerStat(idx, "value", e.target.value)}
                          placeholder="৫০০+"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Facilities / Resource Cards */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookMarked size={16} className="text-[#006a4e]" />
                    <span>১০.৩ সুযোগ-সুবিধাসমূহ (Facilities & Learning Zones)</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Study Corner-এর সুবিধা ও বিশেষ জোনের কার্ডসমূহ (ডিজিটাল লাইব্রেরি, শান্ত পাঠ কক্ষ ইত্যাদি)।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addStudyCornerResource}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন সুবিধা যোগ করুন</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(draft.studyCornerResources || []).map((res, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-[#fbfdfc] p-3.5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-[#006a4e]">সুবিধা #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeStudyCornerResource(idx)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>মুছুন</span>
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                        সুবিধার শিরোনাম (Title)
                        <input
                          type="text"
                          value={res.title}
                          onChange={(e) => updateStudyCornerResource(idx, "title", e.target.value)}
                          placeholder="ডিজিটাল লাইব্রেরি অ্যাক্সেস"
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        আইকন (Icon)
                        <select
                          value={res.icon || "BookOpen"}
                          onChange={(e) => updateStudyCornerResource(idx, "icon", e.target.value)}
                          className={inputClass}
                        >
                          <option value="BookOpen">BookOpen (বই)</option>
                          <option value="BookMarked">BookMarked (বুকমার্ক)</option>
                          <option value="Users">Users (গ্রুপ)</option>
                          <option value="Monitor">Monitor (কম্পিউটার)</option>
                          <option value="Award">Award (পুরস্কার)</option>
                          <option value="Lightbulb">Lightbulb (আইডিয়া)</option>
                          <option value="Clock">Clock (সময়)</option>
                          <option value="Wifi">Wifi (ইন্টারনেট)</option>
                          <option value="Star">Star (তারা)</option>
                        </select>
                      </label>

                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-3">
                        বিবরণ (Description)
                        <input
                          type="text"
                          value={res.description}
                          onChange={(e) => updateStudyCornerResource(idx, "description", e.target.value)}
                          placeholder="মুক্তপাঠ ও শিক্ষা বাতায়নের ই-বুক ও ভিডিও লেকচার"
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Book Catalogue Management */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={16} className="text-[#006a4e]" />
                      <span>১০.৪ পাঠাগারের বই ক্যাটালগ (Book Catalogue)</span>
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      মোট {(draft.studyCornerBooks || []).length} টি বই
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    শিক্ষার্থীদের জন্য পাঠাগারে রক্ষিত বইয়ের তালিকা, লেখক ও বিষয়ভিত্তিক ক্যাটাগরি পরিচালনা করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addStudyCornerBook}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন বই যোগ করুন</span>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(draft.studyCornerBooks || []).map((book, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2.5 rounded-lg border border-gray-200 bg-[#fbfdfc] p-3 sm:grid-cols-[2fr_1.5fr_1.2fr_auto] sm:items-center dark:border-slate-700 dark:bg-slate-800"
                  >
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      বইয়ের নাম (Book Title)
                      <input
                        type="text"
                        value={book.title}
                        onChange={(e) => updateStudyCornerBook(idx, "title", e.target.value)}
                        placeholder="বইয়ের নাম লিখুন..."
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      লেখক / সংকলক (Author)
                      <input
                        type="text"
                        value={book.author}
                        onChange={(e) => updateStudyCornerBook(idx, "author", e.target.value)}
                        placeholder="লেখকের নাম..."
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ক্যাটাগরি (Category)
                      <input
                        type="text"
                        list="study-book-categories"
                        value={book.category}
                        onChange={(e) => updateStudyCornerBook(idx, "category", e.target.value)}
                        placeholder="যেমন: গণিত, বিজ্ঞান..."
                        className={inputClass}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeStudyCornerBook(idx)}
                      title="বই মুছুন"
                      aria-label="বই মুছুন"
                      className="mt-4 sm:mt-5 flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <datalist id="study-book-categories">
                  <option value="গণিত" />
                  <option value="বিজ্ঞান" />
                  <option value="সাহিত্য" />
                  <option value="ইংরেজি" />
                  <option value="ইতিহাস" />
                  <option value="পদার্থবিজ্ঞান" />
                  <option value="রসায়ন" />
                  <option value="তথ্যপ্রযুক্তি" />
                  <option value="সাধারণ জ্ঞান" />
                  <option value="জীববিজ্ঞান" />
                  <option value="বাংলাদেশ স্টাডিজ" />
                </datalist>
              </div>
            </section>

            {/* 5. Digital Resources Links */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Monitor size={16} className="text-[#006a4e]" />
                    <span>১০.৫ ডিজিটাল শিক্ষা রিসোর্স ও পোর্টাল লিঙ্ক</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    মুক্তপাঠ, শিক্ষা বাতায়ন, এনসিটিবি বা খান একাডেমির মত ই-লার্নিং পোর্টাল লিঙ্ক।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addStudyCornerLink}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন রিসোর্স লিঙ্ক যোগ করুন</span>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(draft.studyCornerLinks || []).map((link, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2.5 rounded-lg border border-gray-200 bg-[#fbfdfc] p-3 sm:grid-cols-[1.5fr_1.5fr_2fr_auto] sm:items-center dark:border-slate-700 dark:bg-slate-800"
                  >
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      পোর্টাল / রিসোর্স নাম
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => updateStudyCornerLink(idx, "name", e.target.value)}
                        placeholder="মুক্তপাঠ (ই-লার্নিং)"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      ওয়েবসাইট লিঙ্ক (URL)
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateStudyCornerLink(idx, "url", e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      সংক্ষিপ্ত বিবরণ
                      <input
                        type="text"
                        value={link.desc}
                        onChange={(e) => updateStudyCornerLink(idx, "desc", e.target.value)}
                        placeholder="সরকারি ই-বুক ও ভিডিও কোর্স"
                        className={inputClass}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeStudyCornerLink(idx)}
                      title="লিঙ্ক মুছুন"
                      aria-label="লিঙ্ক মুছুন"
                      className="mt-4 sm:mt-5 flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. Study Tips */}
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lightbulb size={16} className="text-[#006a4e]" />
                    <span>১০.৬ কার্যকর অধ্যয়নের টিপস ও কৌশল (Study Tips)</span>
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    শিক্ষার্থীদের জন্য অনুপ্রেরণামূলক ও কার্যকর অধ্যয়নের কৌশল পরিচালনা করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addStudyCornerTip}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                >
                  <Plus size={14} />
                  <span>নতুন টিপস যোগ করুন</span>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {(draft.studyCornerTips || []).map((tipItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-[#fbfdfc] p-3 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#006a4e]/10 text-xs font-bold text-[#006a4e]">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={tipItem.tip}
                      onChange={(e) => updateStudyCornerTip(idx, e.target.value)}
                      placeholder="যেমন: প্রতিদিন কমপক্ষে ৩০ মিনিট বই পড়ার অভ্যাস গড়ে তোলো..."
                      className={inputClass + " mt-0 flex-1"}
                    />
                    <button
                      type="button"
                      onClick={() => removeStudyCornerTip(idx)}
                      title="টিপস মুছুন"
                      aria-label="টিপস মুছুন"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
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
                  <span>১১. সরকারি ও প্রয়োজনীয় লিঙ্কসমূহ</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  শিক্ষা মন্ত্রণালয়, মাউশি, শিক্ষা বোর্ড ও অন্যান্য সরকারি বাতায়ন লিঙ্ক।
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
                  className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-3 sm:grid-cols-[1fr_1fr_auto] dark:border-slate-700"
                >
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    লিঙ্কের শিরোনাম
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateQuickLink(index, "label", e.target.value)}
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

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#006a4e] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#00503a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={15} />
            <span>{saving ? "সংরক্ষণ ও প্রকাশ হচ্ছে..." : "সংরক্ষণ ও প্রকাশ করুন (Save & Publish)"}</span>
          </button>
        </footer>
      </form>
    </div>
  );
};

export default WebsiteContentPage;
