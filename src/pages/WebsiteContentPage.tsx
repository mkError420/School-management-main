import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  Download,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutDashboard,
  Link as LinkIcon,
  Plus,
  RotateCcw,
  Save,
  School,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
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
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 font-['Hind_Siliguri','Inter',sans-serif]">
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

                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
                      ফাইল বা পিডিএফ লিঙ্ক (ঐচ্ছিক)
                      <input
                        type="text"
                        value={notice.fileUrl || ""}
                        onChange={(e) => updateNotice(index, "fileUrl", e.target.value)}
                        placeholder="#"
                        className={inputClass}
                      />
                    </label>

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
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="border-b pb-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-[#006a4e]" />
              <span>১০. Study Corner — পাঠ ও গবেষণা কেন্দ্র</span>
            </h2>

            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-700">
                  Study Corner শিরোনাম
                  <input
                    type="text"
                    value={draft.studyCornerTitle}
                    onChange={(e) => updateField("studyCornerTitle", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700">
                  অনুপ্রেরণামূলক উক্তি (Quote)
                  <input
                    type="text"
                    value={draft.studyCornerQuote}
                    onChange={(e) => updateField("studyCornerQuote", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700">
                  ছবির লিঙ্ক (Image URL)
                  <input
                    type="text"
                    value={draft.studyCornerImage}
                    onChange={(e) => updateField("studyCornerImage", e.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="block text-xs font-semibold text-gray-700">
                  বিস্তারিত বিবরণ
                  <textarea
                    rows={3}
                    value={draft.studyCornerText}
                    onChange={(e) => updateField("studyCornerText", e.target.value)}
                    className={textareaClass}
                  />
                </label>
              </div>
            </div>
          </section>
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
