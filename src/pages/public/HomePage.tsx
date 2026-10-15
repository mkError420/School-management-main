import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  PhoneCall,
  School,
  Search,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BdGovEmblem } from "@/components/government/GovtEmblem";
import type { SchoolNotice, SchoolGalleryItem } from "@/types/site";

const EMERGENCY_HOTLINES = [
  { number: "৯৯৯", enNumber: "999", title: "জাতীয় জরুরি সেবা", desc: "পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস" },
  { number: "৩৩৩", enNumber: "333", title: "সরকারি তথ্য ও সেবা", desc: "জাতীয় হেল্পলাইন ও নাগরিক সেবা" },
  { number: "১০৯", enNumber: "109", title: "নারী ও শিশু হেল্পলাইন", desc: "সহিংসতা প্রতিরোধ সহায়তা" },
  { number: "১০৬", enNumber: "106", title: "দুদক হটলাইন", desc: "দুর্নীতি দমন কমিশন" },
  { number: "১৬৪৩০", enNumber: "16430", title: "সরকারি আইনি সেবা", desc: "বিনামূল্যে আইনি পরামর্শ" },
  { number: "১৬১২২", enNumber: "16122", title: "ডিজিটাল ভূমিসেবা", desc: "ভূমি মন্ত্রণালয় হেল্পলাইন" },
];

export const HomePage: React.FC = () => {
  const { websiteContent: content } = useSiteSettings();
  const [activeNoticeCategory, setActiveNoticeCategory] = useState<string>("সকল");
  const [noticeSearch, setNoticeSearch] = useState<string>("");
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [previewImage, setPreviewImage] = useState<SchoolGalleryItem | null>(null);

  const noticeCategories = ["সকল", "ভর্তি", "পরীক্ষা", "একাডেমিক", "সাধারণ"];

  const filteredNotices = useMemo(() => {
    const list = Array.isArray(content.notices) ? content.notices : [];
    return list.filter((item) => {
      const matchesCategory =
        activeNoticeCategory === "সকল" ||
        item.category?.toLowerCase() === activeNoticeCategory.toLowerCase() ||
        (activeNoticeCategory === "ভর্তি" && (item.category?.includes("ভর্তি") || item.category?.toLowerCase().includes("admission"))) ||
        (activeNoticeCategory === "পরীক্ষা" && (item.category?.includes("পরীক্ষা") || item.category?.toLowerCase().includes("exam"))) ||
        (activeNoticeCategory === "একাডেমিক" && (item.category?.includes("একাডেমিক") || item.category?.toLowerCase().includes("academic")));
      const matchesSearch =
        !noticeSearch.trim() ||
        item.title?.toLowerCase().includes(noticeSearch.toLowerCase()) ||
        item.content?.toLowerCase().includes(noticeSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [content.notices, activeNoticeCategory, noticeSearch]);

  return (
    <div className="space-y-8">
      {/* ─── HERO BANNER ─── */}
      <section className="relative overflow-hidden rounded-lg border border-[#cbe0d3] bg-[#004d38] text-white shadow-lg">
        <div className="absolute inset-0 z-0">
          <img
            src={content.heroImage || "/images/bgimage.jpg"}
            alt="School Campus"
            className="h-full w-full object-cover object-center opacity-30 mix-blend-luminosity"
            onError={(e) => {
              e.currentTarget.src = "/images/bgimage.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#003627] via-[#004d38]/90 to-transparent" />
        </div>

        <div className="relative z-10 px-5 py-12 sm:px-10 sm:py-16 md:max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-xs">
            <BdGovEmblem size={16} />
            <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত সরকারি মডেল বিদ্যাপীঠ</span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {content.heroTitle || "ঐতিহ্যবাহী এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ে স্বাগতম"}
          </h2>

          <p className="mt-3 text-sm font-semibold text-amber-300 sm:text-base">
            {content.heroSubtitle || "জ্ঞান, চরিত্র ও দেশপ্রেমের চেতনায় আলোকিত সমৃদ্ধ আগামী"}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-white/90 sm:text-sm md:leading-6">
            {content.heroDescription ||
              "সুশৃঙ্খল শিক্ষাদান, আদর্শ নৈতিক চরিত্র গঠন এবং যুগোপযোগী ডিজিটাল শিক্ষার সমন্বয়ে শিক্ষার্থীদের ভবিষ্যৎ বিনির্মাণে আমরা অঙ্গীকারাবদ্ধ।"}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/admission"
              className="inline-flex items-center gap-2 rounded-md bg-[#eab308] px-5 py-2.5 text-xs font-bold text-gray-950 shadow-md transition hover:bg-[#fde047] sm:text-sm"
            >
              <BookOpen size={16} />
              <span>{content.admissionBtnText || "ভর্তি তথ্য ও আবেদন"}</span>
            </Link>

            <Link
              to="/notices"
              className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/15 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/25 sm:text-sm"
            >
              <Bell size={16} />
              <span>নোটিশ বোর্ড দেখুন</span>
            </Link>

            <Link
              to="/academics"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-emerald-950/60 px-4 py-2.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-900 sm:text-sm"
            >
              <Download size={15} />
              <span>ক্লাস রুটিন ও সিলেবাস</span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#006a4e] via-[#da291c] to-[#006a4e]" />
      </section>

      {/* ─── 2-COLUMN LAYOUT ─── */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Left Column (Primary Content) */}
        <div className="space-y-8 lg:col-span-8">
          {/* ABOUT & AT A GLANCE */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                  <School size={16} />
                </span>
                <h3 className="text-xl font-bold text-[#005a40]">
                  {content.aboutTitle || "বিদ্যালয় পরিচিতি ও গৌরবময় ইতিহাস"}
                </h3>
              </div>
              <Link to="/about" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>বিস্তারিত পরিচিতি</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
              <p>{content.aboutText}</p>
            </div>

            {/* Mission & Vision Cards */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-emerald-100 bg-[#f4f9f6] p-3.5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                  <Compass size={14} />
                  <span>আমাদের লক্ষ্য (Mission)</span>
                </p>
                <p className="mt-1.5 text-xs leading-5 text-gray-700">{content.missionText}</p>
              </div>

              <div className="rounded-md border border-amber-100 bg-[#fefce8] p-3.5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <Sparkles size={14} />
                  <span>আমাদের দৃষ্টিভঙ্গি (Vision)</span>
                </p>
                <p className="mt-1.5 text-xs leading-5 text-gray-700">{content.visionText}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-6 border-t border-[#eaf1ec] pt-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                এক নজরে বিদ্যালয়ের পরিসংখ্যান
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {[
                  { label: "মোট শিক্ষার্থী", value: content.studentCount || "১,৫০০+", icon: Users, color: "text-[#006a4e] bg-emerald-50" },
                  { label: "শিক্ষকমণ্ডলী", value: content.teacherCount || "৫২", icon: GraduationCap, color: "text-blue-700 bg-blue-50" },
                  { label: "কর্মচারীবৃন্দ", value: content.staffCount || "১৬", icon: HeartHandshake, color: "text-teal-700 bg-teal-50" },
                  { label: "শ্রেণি কক্ষ", value: content.classCount || "২৪", icon: BookOpen, color: "text-amber-700 bg-amber-50" },
                  { label: "পাসের হার", value: content.passRate || "১০০%", icon: Award, color: "text-emerald-700 bg-emerald-50" },
                  { label: "জিপিএ-৫", value: content.gpa5Count || "১২৫+", icon: CheckCircle2, color: "text-purple-700 bg-purple-50" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-[#e2ece5] bg-white p-3 text-center shadow-2xs transition hover:border-[#006a4e] hover:shadow-xs"
                    >
                      <span className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full ${stat.color}`}>
                        <Icon size={16} />
                      </span>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      <p className="text-[11px] font-medium text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* PRINCIPAL'S MESSAGE PREVIEW */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                  <GraduationCap size={16} />
                </span>
                <h3 className="text-xl font-bold text-[#005a40]">
                  {content.principalTitle || "প্রধান শিক্ষক মহোদয়ের বাণী"}
                </h3>
              </div>
              <Link to="/administration" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>সম্পূর্ণ বাণী পড়ুন</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row">
              <div className="shrink-0 text-center sm:w-44">
                <div className="relative mx-auto h-40 w-32 overflow-hidden rounded-md border-2 border-[#006a4e] bg-gray-100 shadow-md">
                  <img
                    src={content.principalPhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
                    alt={content.principalName || "প্রধান শিক্ষক"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/avatar.png";
                    }}
                  />
                </div>
                <h4 className="mt-2 text-sm font-bold text-gray-900">{content.principalName || "মোঃ আবদুর রহমান"}</h4>
                <p className="text-xs font-semibold text-[#006a4e]">{content.principalTitle || "প্রধান শিক্ষক"}</p>
                <p className="text-[10px] text-gray-500">{content.principalQualification}</p>
              </div>

              <div className="flex-1">
                <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-4 text-sm leading-relaxed text-gray-800">
                  <p className="italic line-clamp-5">“{content.principalMessage}”</p>
                </div>
                <div className="mt-3 text-right">
                  <Link to="/administration" className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline">
                    <span>প্রশাসন ও সহকারী প্রধান শিক্ষকের বাণী</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* NOTICE BOARD PREVIEW */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex flex-col gap-3 border-b border-[#e2ece5] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#da291c] text-white">
                    <Bell size={16} />
                  </span>
                  <h3 className="text-xl font-bold text-[#005a40]">বিদ্যালয় নোটিশ বোর্ড</h3>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">সকল প্রকার ভর্তি, পরীক্ষা, ফলাফল ও প্রাতিষ্ঠানিক নোটিশ</p>
              </div>

              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  placeholder="নোটিশ খুঁজুন..."
                  className="w-full rounded-md border border-[#cbe0d3] bg-[#f9fbf9] py-1.5 pl-8 pr-3 text-xs text-gray-900 outline-none transition focus:border-[#006a4e] focus:bg-white"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
              {noticeCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveNoticeCategory(cat)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    activeNoticeCategory === cat
                      ? "bg-[#006a4e] text-white shadow-xs"
                      : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredNotices.slice(0, 4).map((notice, index) => {
                const noticeDate = notice.date ? new Date(notice.date) : new Date();
                const day = noticeDate.getDate();
                const month = noticeDate.toLocaleDateString("bn-BD", { month: "short" });
                const year = noticeDate.getFullYear();

                return (
                  <article
                    key={notice.id || index}
                    className="group flex flex-col gap-3 rounded-lg border border-[#e5eee8] bg-white p-3.5 transition hover:border-[#006a4e] hover:bg-[#fafffb] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border border-emerald-800 bg-[#006a4e] text-white shadow-2xs">
                        <span className="text-base font-bold leading-none">{day}</span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase">{month}</span>
                        <span className="text-[9px] text-emerald-200">{year}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            {notice.category || "সাধারণ"}
                          </span>
                          <span className="text-[11px] text-gray-500">{notice.date}</span>
                        </div>
                        <h4 className="mt-1 font-bold text-gray-900 transition group-hover:text-[#006a4e]">
                          {notice.title}
                        </h4>
                        {notice.content && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">{notice.content}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedNotice(notice)}
                        className="inline-flex items-center gap-1 rounded bg-[#006a4e] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#00503a]"
                      >
                        <Eye size={13} />
                        <span>বিস্তারিত</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3 text-center">
              <Link
                to="/notices"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#006a4e] px-4 py-2 text-xs font-bold text-[#006a4e] hover:bg-emerald-50"
              >
                <span>সকল নোটিশ আর্কাইভ দেখুন ({content.notices?.length || 0})</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {/* ACADEMICS & DOWNLOADS PREVIEW */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                  <Download size={16} />
                </span>
                <h3 className="text-xl font-bold text-[#005a40]">একাডেমিক রুটিন ও সিলেবাস</h3>
              </div>
              <Link to="/academics" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>সকল ডাউনলোড</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(content.downloads || []).slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-[#e4ede7] bg-[#fbfdfc] p-3.5 transition hover:border-[#006a4e]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-50 text-red-700">
                      <FileText size={20} />
                    </div>
                    <div>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {item.category}
                      </span>
                      <p className="mt-1 text-xs font-bold text-gray-900">{item.title}</p>
                      <p className="text-[10px] text-gray-500">প্রকাশ: {item.publishDate}</p>
                    </div>
                  </div>
                  <a
                    href={item.fileUrl || "#"}
                    download
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#006a4e] text-white transition hover:bg-[#00503a]"
                  >
                    <Download size={15} />
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* STUDY CORNER PREVIEW */}
          <section className="relative overflow-hidden rounded-lg border-2 border-[#006a4e]/30 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-[#006a4e]/20 pb-3">
              <div>
                <span className="rounded bg-[#006a4e] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  পাঠ ও গবেষণা কেন্দ্র
                </span>
                <h3 className="mt-2 text-xl font-bold text-blue-950">
                  {content.studyCornerTitle || "Study Corner — জ্ঞান অন্বেষণের কেন্দ্র"}
                </h3>
              </div>
              <Link to="/study-corner" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>সম্পূর্ণ কর্নার দেখুন</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-36 w-32 shrink-0 overflow-hidden rounded-md border-2 border-[#006a4e] bg-white shadow-md sm:mx-0">
                <img
                  src={content.studyCornerImage || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600"}
                  alt="Study Corner"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2">
                <p className="font-serif text-sm font-semibold italic text-blue-900">
                  {content.studyCornerQuote}
                </p>
                <p className="text-xs leading-5 text-gray-700 line-clamp-3">
                  {content.studyCornerText}
                </p>
              </div>
            </div>
          </section>

          {/* GALLERY PREVIEW */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                  <ImageIcon size={16} />
                </span>
                <h3 className="text-xl font-bold text-[#005a40]">বিদ্যালয় ফটো গ্যালারি</h3>
              </div>
              <Link to="/gallery" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>সকল ছবি দেখুন</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(content.gallery || []).slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setPreviewImage(photo)}
                  className="group relative cursor-pointer overflow-hidden rounded-md border border-[#cbe0d3] bg-gray-100 shadow-2xs"
                >
                  <div className="aspect-4/3 w-full overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/images/bgimage.jpg";
                      }}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                    <span className="rounded bg-[#006a4e] px-1.5 py-0.5 text-[9px] font-bold">
                      {photo.category}
                    </span>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold">{photo.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Head Teacher Card */}
          <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
            <div className="bg-[#006a4e] px-4 py-2.5 text-white">
              <h4 className="text-sm font-bold">প্রধান শিক্ষক</h4>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto h-32 w-28 overflow-hidden rounded border border-emerald-700 bg-gray-100 shadow-xs">
                <img
                  src={content.principalPhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
                  alt={content.principalName || "প্রধান শিক্ষক"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/avatar.png";
                  }}
                />
              </div>
              <h5 className="mt-2 text-sm font-bold text-gray-900">{content.principalName || "মোঃ আবদুর রহমান"}</h5>
              <p className="text-[11px] font-semibold text-[#006a4e]">{content.principalTitle || "প্রধান শিক্ষক"}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{content.principalQualification}</p>
              <div className="mt-3 border-t border-gray-100 pt-2">
                <Link
                  to="/administration"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline"
                >
                  <span>সম্পূর্ণ পরিচিতি ও বার্তা</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="overflow-hidden rounded-lg border border-red-200 bg-white shadow-xs">
            <div className="bg-[#da291c] px-4 py-2.5 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">জাতীয় জরুরি সেবা হটলাইন</h4>
              <PhoneCall size={15} />
            </div>
            <div className="divide-y divide-gray-100 p-2">
              {EMERGENCY_HOTLINES.map((hl) => (
                <div key={hl.number} className="flex items-center justify-between p-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{hl.title}</p>
                    <p className="text-[10px] text-gray-500">{hl.desc}</p>
                  </div>
                  <a
                    href={`tel:${hl.enNumber}`}
                    className="rounded px-2.5 py-1 text-xs font-extrabold text-white shadow-2xs"
                    style={{ background: hl.number === "৯৯৯" ? "#da291c" : "#006a4e" }}
                  >
                    {hl.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Important Govt Links */}
          <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
            <div className="bg-[#006a4e] px-4 py-2.5 text-white">
              <h4 className="text-sm font-bold">গুরুত্বপূর্ণ সরকারি বাতায়ন</h4>
            </div>
            <div className="divide-y divide-gray-100 p-2 text-xs">
              {(content.quickLinks || []).map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 font-medium text-gray-700 transition hover:bg-emerald-50 hover:text-[#006a4e]"
                >
                  <span className="line-clamp-1">{link.label}</span>
                  <ExternalLink size={12} className="shrink-0 text-emerald-700" />
                </a>
              ))}
            </div>
          </div>

          {/* Visitors */}
          <div className="rounded-lg border border-[#dde5df] bg-white p-4 shadow-xs text-center text-xs text-gray-600">
            <p className="font-bold text-[#006a4e]">ওয়েবসাইট পরিদর্শক পরিসংখ্যান</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded bg-gray-50 p-2">
                <p className="text-sm font-bold text-gray-900">৪৫২</p>
                <p className="text-[10px] text-gray-500">আজকের পরিদর্শক</p>
              </div>
              <div className="rounded bg-gray-50 p-2">
                <p className="text-sm font-bold text-gray-900">৮৪,১২০</p>
                <p className="text-[10px] text-gray-500">সর্বমোট পরিদর্শক</p>
              </div>
            </div>
            {content.facebookUrl && (
              <a
                href={content.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Share2 size={13} />
                <span>অফিসিয়াল ফেসবুক পেজ</span>
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg bg-black">
            <img src={previewImage.imageUrl} alt={previewImage.title} className="max-h-[80vh] w-auto object-contain" />
            <div className="p-3 text-white">
              <span className="rounded bg-[#006a4e] px-2 py-0.5 text-xs font-bold">{previewImage.category}</span>
              <p className="mt-1 text-sm font-semibold">{previewImage.title}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
