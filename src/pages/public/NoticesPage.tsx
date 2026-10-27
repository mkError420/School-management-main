import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Home,
  Image as ImageIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";
import type { SchoolNotice } from "@/types/site";

const normalizeNoticeCategory = (rawCat?: string | null) => {
  const c = (rawCat || "").trim().toLowerCase();
  if (c === "admission" || c === "ভর্তি") {
    return { bn: "ভর্তি", en: "Admission" };
  }
  if (c === "examination" || c === "exam" || c === "পরীক্ষা") {
    return { bn: "পরীক্ষা", en: "Examination" };
  }
  if (c === "academic" || c === "একাডেমিক") {
    return { bn: "একাডেমিক", en: "Academic" };
  }
  return { bn: "সাধারণ", en: "General" };
};

export const NoticesPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState<string>("সকল");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [dbNotices, setDbNotices] = useState<SchoolNotice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch live announcements from database (All Announcements section)
  const fetchLiveNotices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getAll("announcements", { page: 1, limit: 100 });
      if (res.success && Array.isArray(res.data?.announcements)) {
        const token = api.getToken();
        const mapped: SchoolNotice[] = res.data.announcements.map((item: any) => {
          let attachUrl = item.attachment_url || (item.document_attachment ? `/backend/api/announcements?action=attachment&id=${item.id}` : null);
          if (attachUrl && token && !attachUrl.includes("token=")) {
            attachUrl += `${attachUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
          }
          const catInfo = normalizeNoticeCategory(item.category);
          return {
            id: String(item.id),
            title: item.title,
            titleEn: item.title,
            date: item.date ? String(item.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            category: catInfo.bn,
            categoryEn: catInfo.en,
            className: item.class_name ? String(item.class_name) : undefined,
            content: item.description || "",
            contentEn: item.description || "",
            fileUrl: attachUrl || "#",
          };
        });
        setDbNotices(mapped);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveNotices();

    const handleUpdated = () => {
      void fetchLiveNotices();
    };
    window.addEventListener("school-announcements-updated", handleUpdated);
    return () => {
      window.removeEventListener("school-announcements-updated", handleUpdated);
    };
  }, [fetchLiveNotices]);

  const categories = [
    { key: "সকল", labelBn: "সকল", labelEn: "All" },
    { key: "ভর্তি", labelBn: "ভর্তি", labelEn: "Admission" },
    { key: "পরীক্ষা", labelBn: "পরীক্ষা", labelEn: "Examination" },
    { key: "একাডেমিক", labelBn: "একাডেমিক", labelEn: "Academic" },
    { key: "সাধারণ", labelBn: "সাধারণ", labelEn: "General" },
  ];

  const filteredNotices = useMemo(() => {
    // Only live notices from database
    const list = dbNotices;
    return list.filter((item) => {
      const matchCat =
        activeCategory === "সকল" ||
        item.category?.toLowerCase() === activeCategory.toLowerCase() ||
        (activeCategory === "ভর্তি" && (item.category?.includes("ভর্তি") || item.categoryEn?.toLowerCase() === "admission")) ||
        (activeCategory === "পরীক্ষা" && (item.category?.includes("পরীক্ষা") || item.categoryEn?.toLowerCase() === "examination" || item.categoryEn?.toLowerCase() === "exam")) ||
        (activeCategory === "একাডেমিক" && (item.category?.includes("একাডেমিক") || item.categoryEn?.toLowerCase() === "academic")) ||
        (activeCategory === "সাধারণ" && (item.category?.includes("সাধারণ") || item.categoryEn?.toLowerCase() === "general"));

      const search = searchTerm.trim().toLowerCase();
      const matchSearch =
        !search ||
        item.title?.toLowerCase().includes(search) ||
        item.titleEn?.toLowerCase().includes(search) ||
        item.content?.toLowerCase().includes(search) ||
        item.contentEn?.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });
  }, [dbNotices, activeCategory, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="flex items-center gap-1 hover:text-[#006a4e]">
          <Home size={14} />
          <span>{t("হোম", "Home")}</span>
        </Link>
        <span>/</span>
        <span className="text-[#006a4e]">{t("নোটিশ বোর্ড", "Notice Board")}</span>
      </nav>

      {/* Page Header */}
      <div className="rounded-lg border border-[#cbe0d3] bg-[#004d38] p-6 text-white shadow-md sm:p-8">
        <span className="rounded bg-[#da291c] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
          {t("প্রাতিষ্ঠানিক ঘোষণা", "Institutional Announcements")}
        </span>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {t("বিদ্যালয় নোটিশ বোর্ড", "School Notice Board")}
        </h2>
        <p className="mt-1 text-xs text-emerald-200 sm:text-sm">
          {t(
            "ভর্তি, পরীক্ষা, ছুটির তালিকা ও দাপ্তরিক নোটিশের কেন্দ্রীয় সংরক্ষণাগার",
            "Central repository of admissions, exams, holidays, and official directives"
          )}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                activeCategory === cat.key
                  ? "bg-[#006a4e] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
              }`}
            >
              {t(cat.labelBn, cat.labelEn)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("নোটিশ খুঁজুন...", "Search notices...")}
            className="w-full rounded-md border border-[#cbe0d3] bg-[#f9fbf9] py-2 pl-8 pr-3 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:bg-white"
          />
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3.5">
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            <Loader2 size={20} className="mr-2 animate-spin text-[#006a4e]" />
            <span>{t("নোটিশ লোড হচ্ছে...", "Loading notices...")}</span>
          </div>
        )}

        {!loading && filteredNotices.map((notice, index) => {
          const noticeDate = notice.date ? new Date(notice.date) : new Date();
          const day = noticeDate.getDate();
          const month = noticeDate.toLocaleDateString(lang === "en" ? "en-US" : "bn-BD", { month: "short" });
          const year = noticeDate.getFullYear();

          return (
            <article
              key={notice.id || index}
              onClick={() => setSelectedNotice(notice)}
              className="group flex flex-col gap-4 rounded-lg border border-[#e5eee8] bg-white p-4 transition hover:border-[#006a4e] hover:bg-[#fafffb] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between cursor-pointer"
            >
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border border-emerald-800 bg-[#006a4e] text-white shadow-2xs">
                  <span className="text-lg font-bold leading-none">{formatDigits(day)}</span>
                  <span className="mt-0.5 text-xs font-semibold uppercase">{month}</span>
                  <span className="text-[10px] text-emerald-200">{formatDigits(year)}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                      notice.categoryEn === "Admission"
                        ? "bg-purple-100 text-purple-800"
                        : notice.categoryEn === "Examination"
                        ? "bg-amber-100 text-amber-900"
                        : notice.categoryEn === "Academic"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}>
                      {t(notice.category, notice.categoryEn) || t("সাধারণ", "General")}
                    </span>
                    {notice.className && (
                      <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                        {t(`শ্রেণি: ${notice.className}`, `Class: ${notice.className}`)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {t("তারিখ:", "Date:")} {formatDigits(notice.date)}
                    </span>

                    {notice.fileUrl && notice.fileUrl !== "#" && notice.fileUrl.trim() !== "" && (
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        notice.fileUrl.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(notice.fileUrl)
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : notice.fileUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(notice.fileUrl)
                          ? "bg-emerald-50 text-[#006a4e] border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {notice.fileUrl.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(notice.fileUrl) ? (
                          <>
                            <FileText size={11} className="text-red-600" />
                            <span>{t("পিডিএফ সংযুক্ত", "PDF Attached")}</span>
                          </>
                        ) : notice.fileUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(notice.fileUrl) ? (
                          <>
                            <ImageIcon size={11} className="text-[#006a4e]" />
                            <span>{t("ছবি সংযুক্ত", "Image Attached")}</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink size={11} className="text-blue-600" />
                            <span>{t("ফাইল সংযুক্ত", "File Attached")}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-gray-900 sm:text-base group-hover:text-[#006a4e] transition">
                    {t(notice.title, notice.titleEn)}
                  </h3>
                  {(notice.content || notice.contentEn) && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600">
                      {t(notice.content, notice.contentEn)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center text-gray-400 group-hover:text-[#006a4e] transition self-end sm:self-center">
                <ChevronRight size={18} className="transition group-hover:translate-x-0.5" />
              </div>
            </article>
          );
        })}

        {!loading && filteredNotices.length === 0 && (
          <div className="rounded-md border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
            {t("কোনো নোটিশ পাওয়া যায়নি।", "No notices found.")}
          </div>
        )}
      </div>

      {/* Notice Viewer Modal */}
      {selectedNotice && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedNotice(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-lg border border-emerald-700 bg-white shadow-2xl my-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-[#006a4e] p-4 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-gray-950">
                    {t(selectedNotice.category, selectedNotice.categoryEn) || t("সাধারণ", "General")}
                  </span>
                  {selectedNotice.className && (
                    <span className="rounded bg-white/20 border border-white/30 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {t(`শ্রেণি: ${selectedNotice.className}`, `Class: ${selectedNotice.className}`)}
                    </span>
                  )}
                  <h3 className="text-sm font-bold sm:text-base">
                    {t("সরকারি নোটিশ পত্র", "Official Notice Document")}
                  </h3>
                </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="rounded p-1 text-white hover:bg-white/20"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500">
                  {t("তারিখ:", "Date:")} {formatDigits(selectedNotice.date || "2026-10-15")}
                </p>
                <h4 className="mt-1 text-lg font-bold text-gray-900">
                  {t(selectedNotice.title, selectedNotice.titleEn)}
                </h4>
              </div>

              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-800">
                {t(selectedNotice.content, selectedNotice.contentEn) ||
                  t(
                    "উক্ত বিষয়ের প্রেক্ষিতে সকল শিক্ষক, শিক্ষার্থী ও অভিভাবকদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, নোটিশটি যথাযথভাবে অনুসরণ করার নির্দেশ প্রদান করা হলো। বিস্তারিত তথ্যের জন্য বিদ্যালয় কার্যালয়ে যোগাযোগ করুন।",
                    "All teachers, students, and guardians are hereby notified to adhere to this directive. For further inquiries, please contact the school office."
                  )}
              </div>

              {/* Attachment Display (Same as Download Corner: Routine & Syllabus) */}
              {selectedNotice.fileUrl && selectedNotice.fileUrl !== "#" && selectedNotice.fileUrl.trim() !== "" && (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#e4ede7] bg-[#fbfdfc] p-4 transition hover:border-[#006a4e] hover:shadow-2xs">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">
                        {selectedNotice.fileUrl.startsWith("data:image/") ||
                        /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(selectedNotice.fileUrl) ? (
                          <ImageIcon size={22} />
                        ) : (
                          <FileText size={22} />
                        )}
                      </div>
                      <div>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {t(selectedNotice.category, selectedNotice.categoryEn) || t("নোটিশ সংযুক্তি", "Notice Attachment")}
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-gray-900">
                          {t(selectedNotice.title, selectedNotice.titleEn)}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {t("প্রকাশের তারিখ:", "Published:")} {formatDigits(selectedNotice.date || "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={selectedNotice.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
                        title={t("নতুন ট্যাবে বড় করে দেখুন", "Open Full in New Tab")}
                      >
                        <ExternalLink size={13} />
                        <span>{t("পূর্ণাঙ্গ ভিউ", "Full View")}</span>
                      </a>
                      <a
                        href={selectedNotice.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center justify-center gap-1.5 rounded bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
                      >
                        <Download size={14} />
                        <span>
                          {selectedNotice.fileUrl.startsWith("data:image/") ||
                          /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(selectedNotice.fileUrl)
                            ? t("ফাইল / ছবি ডাউনলোড", "Download File / Image")
                            : t("পিডিএফ ডাউনলোড", "Download PDF")}
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Embedded Document on Display */}
                  {selectedNotice.fileUrl.startsWith("data:image/") ||
                  /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(selectedNotice.fileUrl) ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 shadow-inner">
                      <img
                        src={selectedNotice.fileUrl}
                        alt={t(selectedNotice.title, selectedNotice.titleEn)}
                        className="max-h-[520px] w-full object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-inner">
                      <object
                        data={selectedNotice.fileUrl}
                        type="application/pdf"
                        className="h-[460px] sm:h-[560px] w-full"
                      >
                        <iframe
                          src={selectedNotice.fileUrl}
                          className="h-[460px] sm:h-[560px] w-full border-0"
                          title={t(selectedNotice.title, selectedNotice.titleEn)}
                        >
                          <div className="flex flex-col items-center justify-center p-8 text-center bg-white">
                            <FileText size={36} className="text-red-500 mb-2" />
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              {t("পিডিএফ ডকুমেন্ট", "PDF Document")}
                            </p>
                            <p className="text-[11px] text-gray-500 mb-3">
                              {t("সরাসরি দেখতে নিচের বাটনে ক্লিক করুন", "Click below to view the PDF file")}
                            </p>
                            <a
                              href={selectedNotice.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                            >
                              <ExternalLink size={13} />
                              <span>{t("পিডিএফ ফাইলটি দেখুন", "View PDF File")}</span>
                            </a>
                          </div>
                        </iframe>
                      </object>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs">
                <div>
                  <p className="font-semibold text-gray-800">{t("আদেশক্রমে,", "By Order,")}</p>
                  <p className="font-bold text-[#006a4e]">
                    {t(content.principalName, content.principalNameEn) || t("প্রধান শিক্ষক", "Principal")}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {lang === "en" ? content.schoolName : (content.schoolNameBn || content.schoolName)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(null)}
                    className="rounded bg-[#006a4e] px-5 py-1.5 font-bold text-white hover:bg-[#00503a] transition shadow-xs"
                  >
                    {t("ঠিক আছে", "Close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
