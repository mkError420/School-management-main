import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Home,
  Image as ImageIcon,
  Printer,
  Search,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import type { SchoolNotice } from "@/types/site";

export const NoticesPage: React.FC = () => {
  const { websiteContent: content, t, lang, formatDigits } = useSiteSettings();
  const [activeCategory, setActiveCategory] = useState<string>("সকল");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);

  const categories = [
    { key: "সকল", labelBn: "সকল", labelEn: "All" },
    { key: "ভর্তি", labelBn: "ভর্তি", labelEn: "Admission" },
    { key: "পরীক্ষা", labelBn: "পরীক্ষা", labelEn: "Exam" },
    { key: "একাডেমিক", labelBn: "একাডেমিক", labelEn: "Academic" },
    { key: "সাধারণ", labelBn: "সাধারণ", labelEn: "General" },
  ];

  const filteredNotices = useMemo(() => {
    const list = Array.isArray(content.notices) ? content.notices : [];
    return list.filter((item) => {
      const matchCat =
        activeCategory === "সকল" ||
        item.category?.toLowerCase() === activeCategory.toLowerCase() ||
        (activeCategory === "ভর্তি" && (item.category?.includes("ভর্তি") || item.category?.toLowerCase().includes("admission") || item.categoryEn?.toLowerCase().includes("admission"))) ||
        (activeCategory === "পরীক্ষা" && (item.category?.includes("পরীক্ষা") || item.category?.toLowerCase().includes("exam") || item.categoryEn?.toLowerCase().includes("exam"))) ||
        (activeCategory === "একাডেমিক" && (item.category?.includes("একাডেমিক") || item.category?.toLowerCase().includes("academic") || item.categoryEn?.toLowerCase().includes("academic")));

      const search = searchTerm.trim().toLowerCase();
      const matchSearch =
        !search ||
        item.title?.toLowerCase().includes(search) ||
        item.titleEn?.toLowerCase().includes(search) ||
        item.content?.toLowerCase().includes(search) ||
        item.contentEn?.toLowerCase().includes(search);
      return matchCat && matchSearch;
    });
  }, [content.notices, activeCategory, searchTerm]);

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
        {filteredNotices.map((notice, index) => {
          const noticeDate = notice.date ? new Date(notice.date) : new Date();
          const day = noticeDate.getDate();
          const month = noticeDate.toLocaleDateString(lang === "en" ? "en-US" : "bn-BD", { month: "short" });
          const year = noticeDate.getFullYear();

          return (
            <article
              key={notice.id || index}
              className="group flex flex-col gap-4 rounded-lg border border-[#e5eee8] bg-white p-4 transition hover:border-[#006a4e] hover:bg-[#fafffb] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-md border border-emerald-800 bg-[#006a4e] text-white shadow-2xs">
                  <span className="text-lg font-bold leading-none">{formatDigits(day)}</span>
                  <span className="mt-0.5 text-xs font-semibold uppercase">{month}</span>
                  <span className="text-[10px] text-emerald-200">{formatDigits(year)}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                      {t(notice.category, notice.categoryEn) || t("সাধারণ", "General")}
                    </span>
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

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedNotice(notice)}
                  className="inline-flex items-center gap-1.5 rounded bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
                >
                  <Eye size={14} />
                  <span>{t("বিস্তারিত পড়ুন", "View Details")}</span>
                </button>
              </div>
            </article>
          );
        })}

        {filteredNotices.length === 0 && (
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-2xl rounded-lg border border-emerald-700 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#006a4e] p-4 text-white">
              <div className="flex items-center gap-2">
                <div>
                  <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-gray-950">
                    {t(selectedNotice.category, selectedNotice.categoryEn) || t("নোটিশ", "Notice")}
                  </span>
                  <h3 className="mt-0.5 text-sm font-bold sm:text-base">
                    {t("সরকারি নোটিশ পত্র", "Official Notice Document")}
                  </h3>
                </div>
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

              {/* Attachment Display (Image or PDF) */}
              {selectedNotice.fileUrl && selectedNotice.fileUrl !== "#" && selectedNotice.fileUrl.trim() !== "" && (
                <div className="mt-4">
                  {selectedNotice.fileUrl.startsWith("data:image/") ||
                  /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(selectedNotice.fileUrl) ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#006a4e] flex items-center gap-1.5">
                          <ImageIcon size={14} />
                          <span>{t("সংযুক্ত নোটিশ পত্র (ছবি):", "Attached Notice Document (Image):")}</span>
                        </span>
                        <a
                          href={selectedNotice.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006a4e] hover:underline"
                        >
                          <Download size={12} />
                          <span>{t("ডাউনলোড করুন", "Download")}</span>
                        </a>
                      </div>
                      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img
                          src={selectedNotice.fileUrl}
                          alt={t(selectedNotice.title, selectedNotice.titleEn)}
                          className="max-h-[380px] w-full object-contain bg-gray-50 p-1"
                        />
                      </div>
                    </div>
                  ) : selectedNotice.fileUrl.startsWith("data:application/pdf") ||
                    /\.pdf(\?.*)?$/i.test(selectedNotice.fileUrl) ? (
                    <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-600 text-white font-bold text-xs shadow-2xs">
                            PDF
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">
                              {t("অফিসিয়াল নোটিশ পত্র (PDF ডকুমেন্ট)", "Official Notice Document (PDF)")}
                            </p>
                            <p className="text-[11px] text-gray-600">
                              {t(
                                "মূল নোটিশের অফিসিয়াল পিডিএফ ফাইলটি দেখতে বা ডাউনলোড করতে নিচের বাটনে চাপ দিন",
                                "Click the button below to view or download the official PDF notice file"
                              )}
                            </p>
                          </div>
                        </div>

                        <a
                          href={selectedNotice.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 shrink-0"
                        >
                          <FileText size={14} />
                          <span>{t("পিডিএফ দেখুন ও ডাউনলোড", "View & Download PDF")}</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-800">
                        <ExternalLink size={14} className="text-blue-600 shrink-0" />
                        <span>{t("সংযুক্ত ফাইল বা ওয়েব লিঙ্ক", "Attached File or Link")}</span>
                      </div>
                      <a
                        href={selectedNotice.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Download size={13} />
                        <span>{t("ফাইল খুলুন", "Open File")}</span>
                      </a>
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
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <Printer size={13} />
                    <span>{t("প্রিন্ট করুন", "Print")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(null)}
                    className="rounded bg-[#006a4e] px-4 py-1.5 font-bold text-white hover:bg-[#00503a]"
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
