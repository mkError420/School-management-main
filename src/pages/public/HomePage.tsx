import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Loader2,
  Pause,
  PhoneCall,
  Play,
  School,
  Search,
  Share2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";
import type { SchoolNotice, SchoolGalleryItem } from "@/types/site";

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

const EMERGENCY_HOTLINES = [
  { number: "৯৯৯", enNumber: "999", title: "জাতীয় জরুরি সেবা", titleEn: "National Emergency Service", desc: "পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস", descEn: "Police, Ambulance, Fire Service" },
  { number: "৩৩৩", enNumber: "333", title: "সরকারি তথ্য ও সেবা", titleEn: "Govt Info & Services", desc: "জাতীয় হেল্পলাইন ও নাগরিক সেবা", descEn: "National Citizen Helpdesk" },
  { number: "১০৯", enNumber: "109", title: "নারী ও শিশু হেল্পলাইন", titleEn: "Women & Child Helpline", desc: "সহিংসতা প্রতিরোধ সহায়তা", descEn: "Anti-Violence Support" },
  { number: "১০৬", enNumber: "106", title: "দুদক হটলাইন", titleEn: "Anti-Corruption Hotline", desc: "দুর্নীতি দমন কমিশন", descEn: "Anti-Corruption Commission" },
  { number: "১৬৪৩০", enNumber: "16430", title: "সরকারি আইনি সেবা", titleEn: "Government Legal Aid", desc: "বিনামূল্যে আইনি পরামর্শ", descEn: "Free Legal Advice" },
  { number: "১৬১২২", enNumber: "16122", title: "ডিজিটাল ভূমিসেবা", titleEn: "Digital Land Services", desc: "ভূমি মন্ত্রণালয় হেল্পলাইন", descEn: "Ministry of Land Hotline" },
];

export const HomePage: React.FC = () => {
  const { websiteContent: content, lang, t, formatDigits, liveCounts, refreshLiveCounts, visitorStats } = useSiteSettings();
  const [activeNoticeCategory, setActiveNoticeCategory] = useState<string>("সকল");
  const [noticeSearch, setNoticeSearch] = useState<string>("");
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [previewImage, setPreviewImage] = useState<SchoolGalleryItem | null>(null);
  const [dbNotices, setDbNotices] = useState<SchoolNotice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const fetchLiveNotices = async () => {
      try {
        setLoadingNotices(true);
        const res = await api.getAll("announcements", { page: 1, limit: 100 });
        if (active && res.success && Array.isArray(res.data?.announcements)) {
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
      } catch { }
      finally {
        if (active) setLoadingNotices(false);
      }
    };
    void fetchLiveNotices();

    const handleUpdated = () => {
      void fetchLiveNotices();
    };
    window.addEventListener("school-announcements-updated", handleUpdated);
    return () => {
      active = false;
      window.removeEventListener("school-announcements-updated", handleUpdated);
    };
  }, []);

  const effectiveNotices = useMemo(() => {
    return dbNotices;
  }, [dbNotices]);

  useEffect(() => {
    if (!liveCounts) {
      void refreshLiveCounts();
    }
  }, [liveCounts, refreshLiveCounts]);

  const noticeCategories = useMemo(() => {
    return lang === "bn"
      ? ["সকল", "ভর্তি", "পরীক্ষা", "একাডেমিক", "সাধারণ"]
      : ["All", "Admission", "Examination", "Academic", "General"];
  }, [lang]);

  const filteredNotices = useMemo(() => {
    const list = effectiveNotices;
    return list.filter((item) => {
      const isAll = activeNoticeCategory === "সকল" || activeNoticeCategory === "All";
      const cat = (item.category || "").toLowerCase();
      const catEn = (item.categoryEn || "").toLowerCase();
      const activeLower = activeNoticeCategory.toLowerCase();

      const matchesCategory =
        isAll ||
        cat === activeLower ||
        catEn === activeLower ||
        (activeLower.includes("ভর্তি") || activeLower.includes("admission")) && (cat.includes("ভর্তি") || catEn.includes("admission")) ||
        (activeLower.includes("পরীক্ষা") || activeLower.includes("exam")) && (cat.includes("পরীক্ষা") || catEn.includes("exam")) ||
        (activeLower.includes("একাডেমিক") || activeLower.includes("academic")) && (cat.includes("একাডেমিক") || catEn.includes("academic")) ||
        (activeLower.includes("সাধারণ") || activeLower.includes("general")) && (cat.includes("সাধারণ") || catEn.includes("general"));

      const titleMatch = (item.title || "").toLowerCase().includes(noticeSearch.toLowerCase()) ||
        (item.titleEn || "").toLowerCase().includes(noticeSearch.toLowerCase());
      const contentMatch = (item.content || "").toLowerCase().includes(noticeSearch.toLowerCase()) ||
        (item.contentEn || "").toLowerCase().includes(noticeSearch.toLowerCase());

      return matchesCategory && (!noticeSearch.trim() || titleMatch || contentMatch);
    });
  }, [effectiveNotices, activeNoticeCategory, noticeSearch]);

  // Banner Carousel State
  const bannerImages = useMemo(() => {
    if (Array.isArray(content.heroImages) && content.heroImages.length > 0) {
      const valid = content.heroImages.filter((img) => typeof img === "string" && img.trim().length > 0);
      if (valid.length > 0) return valid;
    }
    return [content.heroImage || "/images/bgimage.jpg"];
  }, [content.heroImages, content.heroImage]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    if (currentSlide >= bannerImages.length) {
      setCurrentSlide(0);
    }
  }, [bannerImages.length, currentSlide]);

  useEffect(() => {
    if (bannerImages.length <= 1 || isCarouselPaused) return;
    const intervalTime = content.heroCarouselSpeed && content.heroCarouselSpeed >= 2000 ? content.heroCarouselSpeed : 5000;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [bannerImages.length, isCarouselPaused, content.heroCarouselSpeed]);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const overlayGradientClass = useMemo(() => {
    switch (content.heroOverlayOpacity) {
      case "dark":
        return "bg-gradient-to-r from-[#002217]/90 via-[#00281b]/70 to-[#001f14]/35";
      case "medium":
        return "bg-gradient-to-r from-[#002217]/80 via-[#00281b]/50 to-transparent";
      case "light":
      default:
        // Decreased overlay: clean, bright, showing true colors of the photo
        return "bg-gradient-to-r from-[#002217]/70 via-[#00281b]/35 to-transparent";
    }
  }, [content.heroOverlayOpacity]);

  return (
    <div className="space-y-8 font-sans">
      {/* ─── HERO BANNER CAROUSEL ─── */}
      <section
        className="group relative overflow-hidden rounded-xl border border-[#cbe0d3] bg-[#004d38] text-white shadow-xl transition-all"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
        aria-label="Home Banner Carousel"
      >
        {/* Background Images Carousel with Decreased Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {bannerImages.map((imgUrl, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={`${imgUrl}-${idx}`}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-1" : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                <img
                  src={imgUrl}
                  alt={`School Campus Banner ${idx + 1}`}
                  className="h-full w-full object-cover object-center transform transition-transform duration-7000 ease-out"
                  style={{
                    transform: isActive ? "scale(1.04)" : "scale(1.0)",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/images/bgimage.jpg";
                  }}
                />
              </div>
            );
          })}

          {/* Decreased Background Gradient Overlay */}
          <div className={`absolute inset-0 z-2 ${overlayGradientClass} transition-colors duration-500`} />

          {/* Bottom subtle dark shade for control clarity */}
          <div className="absolute inset-x-0 bottom-0 h-24 z-2 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Carousel Previous / Next Arrow Controls */}
        {bannerImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous Slide"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/25 shadow-lg transition-all hover:bg-black/70 hover:scale-110 active:scale-95 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next Slide"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/25 shadow-lg transition-all hover:bg-black/70 hover:scale-110 active:scale-95 opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Hero Content */}
        <div className="relative z-10 px-5 py-12 sm:px-10 sm:py-16 md:max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-sm shadow-sm">
            <span>
              {lang === "bn"
                ? "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত সরকারি মডেল বিদ্যাপীঠ"
                : "Government Approved Model Institution · Govt of Bangladesh"}
            </span>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {t(content.heroTitle, content.heroTitleEn) || (lang === "bn" ? "ঐতিহ্যবাহী এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ে স্বাগতম" : "Welcome to MK Government Model High School")}
          </h2>

          <p className="mt-3 text-sm font-bold text-amber-300 sm:text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            {t(content.heroSubtitle, content.heroSubtitleEn)}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-white/95 sm:text-sm md:leading-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {t(content.heroDescription, content.heroDescriptionEn)}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/admission"
              className="inline-flex items-center gap-2 rounded-md bg-[#eab308] px-5 py-2.5 text-xs font-bold text-gray-950 shadow-md transition hover:bg-[#fde047] sm:text-sm active:scale-95"
            >
              <BookOpen size={16} />
              <span>{t(content.admissionBtnText, content.admissionBtnTextEn) || (lang === "bn" ? "ভর্তি তথ্য ও আবেদন" : "Admission & Apply")}</span>
            </Link>

            <Link
              to="/notices"
              className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-black/30 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/50 sm:text-sm active:scale-95"
            >
              <Bell size={16} />
              <span>{lang === "bn" ? "নোটিশ বোর্ড দেখুন" : "View Notice Board"}</span>
            </Link>

            <Link
              to="/academics"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-[#004d38]/80 px-4 py-2.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm transition hover:bg-[#004d38] sm:text-sm active:scale-95"
            >
              <Download size={15} />
              <span>{lang === "bn" ? "ক্লাস রুটিন ও সিলেবাস" : "Routine & Syllabus"}</span>
            </Link>
          </div>
        </div>

        {/* Slide Counter & Dots Indicators (Bottom Right) */}
        {bannerImages.length > 1 && (
          <div className="absolute bottom-4 right-4 sm:right-6 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md border border-white/20 shadow-md">
            <span className="text-[11px] font-bold tracking-wider text-emerald-200">
              {formatDigits(currentSlide + 1)} / {formatDigits(bannerImages.length)}
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              {bannerImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 transition-all duration-300 rounded-full ${idx === currentSlide
                    ? "w-5 bg-amber-400 shadow-sm"
                    : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsCarouselPaused((p) => !p)}
              title={isCarouselPaused ? (lang === "bn" ? "ক্যারোসেল চালু করুন" : "Play Carousel") : (lang === "bn" ? "ক্যারোসেল থামান" : "Pause Carousel")}
              className="ml-1 text-white/80 hover:text-white transition p-0.5 rounded hover:bg-white/10"
            >
              {isCarouselPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          </div>
        )}

        {/* Tricolor Bottom Accent Strip */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#006a4e] via-[#da291c] to-[#006a4e] z-20" />
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
                  {t(content.aboutTitle, content.aboutTitleEn) || (lang === "bn" ? "বিদ্যালয় পরিচিতি ও গৌরবময় ইতিহাস" : "About Our School & Heritage")}
                </h3>
              </div>
              <Link to="/about" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>{lang === "bn" ? "বিস্তারিত পরিচিতি" : "Read Full Story"}</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
              <p>{t(content.aboutText, content.aboutTextEn)}</p>
            </div>

            {/* Mission & Vision Cards */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-emerald-100 bg-[#f4f9f6] p-3.5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                  <span>{lang === "bn" ? "আমাদের লক্ষ্য (Mission)" : "Our Mission"}</span>
                </p>
                <p className="mt-1.5 text-xs leading-5 text-gray-700">{t(content.missionText, content.missionTextEn)}</p>
              </div>

              <div className="rounded-md border border-amber-100 bg-[#fefce8] p-3.5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  <span>{lang === "bn" ? "আমাদের দৃষ্টিভঙ্গি (Vision)" : "Our Vision"}</span>
                </p>
                <p className="mt-1.5 text-xs leading-5 text-gray-700">{t(content.visionText, content.visionTextEn)}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-6 border-t border-[#eaf1ec] pt-5">
              <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                {lang === "bn" ? "এক নজরে বিদ্যালয়ের পরিসংখ্যান" : "School Statistics at a Glance"}
              </h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-6">
                {[
                  {
                    label: lang === "bn" ? "মোট শিক্ষার্থী" : "Students",
                    value:
                      liveCounts && typeof liveCounts.students === "number"
                        ? formatDigits(liveCounts.students.toLocaleString())
                        : lang === "bn"
                          ? (content.studentCount || "১,৫০০+")
                          : (content.studentCountEn || "1,500+"),
                    icon: Users,
                    color: "text-[#006a4e] bg-emerald-50",
                  },
                  {
                    label: lang === "bn" ? "শিক্ষকমণ্ডলী" : "Faculty",
                    value:
                      liveCounts && typeof liveCounts.teachers === "number"
                        ? formatDigits(liveCounts.teachers.toLocaleString())
                        : lang === "bn"
                          ? (content.teacherCount || "৫২")
                          : (content.teacherCountEn || "52"),
                    icon: GraduationCap,
                    color: "text-blue-700 bg-blue-50",
                  },
                  {
                    label: lang === "bn" ? "কর্মচারীবৃন্দ" : "Staff",
                    value:
                      liveCounts && typeof liveCounts.staff === "number"
                        ? formatDigits(liveCounts.staff.toLocaleString())
                        : lang === "bn"
                          ? (content.staffCount || "১৬")
                          : (content.staffCountEn || "16"),
                    icon: HeartHandshake,
                    color: "text-teal-700 bg-teal-50",
                  },
                  {
                    label: lang === "bn" ? "শ্রেণি কক্ষ" : "Classrooms",
                    value:
                      liveCounts && typeof liveCounts.classes === "number" && liveCounts.classes > 0
                        ? formatDigits(liveCounts.classes.toLocaleString())
                        : lang === "bn"
                          ? (content.classCount || "২৪")
                          : (content.classCountEn || "24"),
                    icon: BookOpen,
                    color: "text-amber-700 bg-amber-50",
                  },
                  {
                    label: lang === "bn" ? "পাসের হার" : "Pass Rate",
                    value: lang === "bn" ? (content.passRate || "১০০%") : (content.passRateEn || "100%"),
                    icon: Award,
                    color: "text-emerald-700 bg-emerald-50",
                  },
                  {
                    label: lang === "bn" ? "জিপিএ-৫" : "GPA-5",
                    value: lang === "bn" ? (content.gpa5Count || "১২৫+") : (content.gpa5CountEn || "125+"),
                    icon: CheckCircle2,
                    color: "text-purple-700 bg-purple-50",
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-[#e2ece5] bg-white p-2 text-center shadow-2xs transition hover:border-[#006a4e] hover:shadow-xs sm:p-2.5"
                    >
                      <span className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7 ${stat.color}`}>
                        {Icon && <Icon size={13} className="sm:h-3.5 sm:w-3.5" />}
                      </span>
                      <p className="text-xs font-bold text-gray-900 sm:text-sm md:text-base">{stat.value}</p>
                      <p className="text-[10px] font-medium text-gray-600 sm:text-[11px] truncate">{stat.label}</p>
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
                <h3 className="text-xl font-bold text-[#005a40]">
                  {t(content.principalTitle, content.principalTitleEn) || (lang === "bn" ? "প্রধান শিক্ষক মহোদয়ের বাণী" : "Headmaster's Message")}
                </h3>
              </div>
              <Link to="/administration" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>{lang === "bn" ? "সম্পূর্ণ বাণী পড়ুন" : "Read Full Message"}</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row">
              <div className="shrink-0 text-center sm:w-44">
                <div className="relative mx-auto h-40 w-32 overflow-hidden rounded-md border-2 border-[#006a4e] bg-gray-100 shadow-md">
                  <img
                    src={content.principalPhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
                    alt={t(content.principalName, content.principalNameEn) || "Headmaster"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/avatar.png";
                    }}
                  />
                </div>
                <h4 className="mt-2 text-sm font-bold text-gray-900">{t(content.principalName, content.principalNameEn) || "Md. Abdur Rahman"}</h4>
                <p className="text-xs font-semibold text-[#006a4e]">{t(content.principalTitle, content.principalTitleEn) || (lang === "bn" ? "প্রধান শিক্ষক" : "Headmaster")}</p>
                <p className="text-[10px] text-gray-500">{t(content.principalQualification, content.principalQualificationEn)}</p>
              </div>

              <div className="flex-1">
                <div className="rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-4 text-sm leading-relaxed text-gray-800">
                  <p className="italic line-clamp-5">“{t(content.principalMessage, content.principalMessageEn)}”</p>
                </div>
                <div className="mt-3 text-right">
                  <Link to="/administration" className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline">
                    <span>{lang === "bn" ? "প্রশাসন ও সহকারী প্রধান শিক্ষকের বাণী" : "Administration & Asst. Headmaster Message"}</span>
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
                  <h3 className="text-xl font-bold text-[#005a40]">
                    {lang === "bn" ? "বিদ্যালয় নোটিশ বোর্ড" : "School Notice Board"}
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {lang === "bn" ? "সকল প্রকার ভর্তি, পরীক্ষা, ফলাফল ও প্রাতিষ্ঠানিক নোটিশ" : "All official admission, examination, results & administrative notices"}
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  value={noticeSearch}
                  onChange={(e) => setNoticeSearch(e.target.value)}
                  placeholder={lang === "bn" ? "নোটিশ খুঁজুন..." : "Search notices..."}
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
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${activeNoticeCategory === cat
                    ? "bg-[#006a4e] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-[#006a4e]"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {loadingNotices && (
                <div className="flex items-center justify-center py-10 text-xs text-gray-500">
                  <Loader2 size={16} className="mr-2 animate-spin text-[#006a4e]" />
                  <span>{lang === "bn" ? "নোটিশ লোড হচ্ছে..." : "Loading notices..."}</span>
                </div>
              )}

              {!loadingNotices && filteredNotices.slice(0, 4).map((notice, index) => {
                const noticeDate = notice.date ? new Date(notice.date) : new Date();
                const day = formatDigits(noticeDate.getDate());
                const month = noticeDate.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { month: "short" });
                const year = formatDigits(noticeDate.getFullYear());

                return (
                  <article
                    key={notice.id || index}
                    onClick={() => setSelectedNotice(notice)}
                    className="group flex flex-col gap-3 rounded-lg border border-[#e5eee8] bg-white p-3.5 transition hover:border-[#006a4e] hover:bg-[#fafffb] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border border-emerald-800 bg-[#006a4e] text-white shadow-2xs">
                        <span className="text-base font-bold leading-none">{day}</span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase">{month}</span>
                        <span className="text-[9px] text-emerald-200">{year}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${notice.categoryEn === "Admission"
                            ? "bg-purple-100 text-purple-800"
                            : notice.categoryEn === "Examination"
                              ? "bg-amber-100 text-amber-900"
                              : notice.categoryEn === "Academic"
                                ? "bg-blue-100 text-blue-900"
                                : "bg-emerald-100 text-emerald-900"
                            }`}>
                            {t(notice.category, notice.categoryEn) || (lang === "bn" ? "সাধারণ" : "General")}
                          </span>
                          {notice.className && (
                            <span className="rounded bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[10px] font-medium text-teal-800">
                              {t(`শ্রেণি: ${notice.className}`, `Class: ${notice.className}`)}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-500">{formatDigits(notice.date)}</span>

                          {notice.fileUrl && notice.fileUrl !== "#" && notice.fileUrl.trim() !== "" && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-[#006a4e] border border-emerald-200">
                              <FileText size={10} className="text-emerald-600" />
                              <span>{lang === "bn" ? "সংযুক্ত ফাইল" : "Attachment"}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 font-bold text-gray-900 transition group-hover:text-[#006a4e]">
                          {t(notice.title, notice.titleEn)}
                        </h4>
                        {(notice.content || notice.contentEn) && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">
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

              {!loadingNotices && filteredNotices.length === 0 && (
                <div className="rounded-md border border-dashed border-gray-300 py-8 text-center text-xs text-gray-500">
                  {lang === "bn" ? "কোনো নোটিশ পাওয়া যায়নি।" : "No notices found."}
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3 text-center">
              <Link
                to="/notices"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#006a4e] px-4 py-2 text-xs font-bold text-[#006a4e] hover:bg-emerald-50"
              >
                <span>{lang === "bn" ? `সকল নোটিশ আর্কাইভ দেখুন (${formatDigits(effectiveNotices.length)})` : `View All Notices Archive (${formatDigits(effectiveNotices.length)})`}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {/* ACADEMICS & DOWNLOADS PREVIEW */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#005a40]">
                  {lang === "bn" ? "একাডেমিক রুটিন ও সিলেবাস" : "Academic Routine & Syllabus"}
                </h3>
              </div>
              <Link to="/academics" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>{lang === "bn" ? "সকল ডাউনলোড" : "All Downloads"}</span>
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
                        {t(item.category, item.categoryEn)}
                      </span>
                      <p className="mt-1 text-xs font-bold text-gray-900">{t(item.title, item.titleEn)}</p>
                      <p className="text-[10px] text-gray-500">{lang === "bn" ? "প্রকাশ:" : "Published:"} {formatDigits(item.publishDate)}</p>
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#006a4e]" />
                <span className="font-bold text-[#005a40]">
                  {lang === "bn" ? "দৈনন্দিন ক্লাসের সময়সূচী (Daily Class Schedule)" : "Daily Class Schedule (Live)"}
                </span>
              </div>
              <Link
                to="/academics#schedule"
                className="inline-flex items-center gap-1 rounded bg-[#006a4e] px-3 py-1 font-bold text-white shadow-2xs hover:bg-[#00503a]"
              >
                <span>{lang === "bn" ? "রুটিন দেখুন" : "View Routine"}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </section>

          {/* STUDY CORNER PREVIEW */}
          <section className="relative overflow-hidden rounded-lg border-2 border-[#006a4e]/30 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-[#006a4e]/20 pb-3">
              <div>
                <span className="rounded bg-[#006a4e] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  {lang === "bn" ? "পাঠ ও গবেষণা কেন্দ্র" : "Study & Research Pavilion"}
                </span>
                <h3 className="mt-2 text-xl font-bold text-blue-950">
                  {t(content.studyCornerTitle, content.studyCornerTitleEn)}
                </h3>
              </div>
              <Link to="/study-corner" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>{lang === "bn" ? "সম্পূর্ণ কর্নার দেখুন" : "Explore Corner"}</span>
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
                  {t(content.studyCornerQuote, content.studyCornerQuoteEn)}
                </p>
                {(content.studyCornerQuoteAuthor || content.studyCornerQuoteAuthorEn) && (
                  <p className="text-[11px] font-semibold text-[#006a4e]">
                    — {t(content.studyCornerQuoteAuthor, content.studyCornerQuoteAuthorEn)}
                  </p>
                )}
                <p className="text-xs leading-5 text-gray-700 line-clamp-3">
                  {t(content.studyCornerText, content.studyCornerTextEn)}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#006a4e]">
                    {t(content.studyCornerDays, content.studyCornerDaysEn) || (lang === "bn" ? "সোমবার - শনিবার" : "Monday - Saturday")}
                  </span>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    {t(content.studyCornerHours, content.studyCornerHoursEn) || (lang === "bn" ? "সকাল ৮:০০ - বিকাল ৪:০০" : "8:00 AM - 4:00 PM")}
                  </span>
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {t(content.studyCornerFee, content.studyCornerFeeEn) || (lang === "bn" ? "বিনামূল্যে প্রবেশ" : "Free Admission")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* GALLERY PREVIEW */}
          <section className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-[#e2ece5] pb-3.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#005a40]">
                  {lang === "bn" ? "বিদ্যালয় ফটো গ্যালারি" : "School Photo Gallery"}
                </h3>
              </div>
              <Link to="/gallery" className="text-xs font-bold text-[#006a4e] hover:underline flex items-center gap-1">
                <span>{lang === "bn" ? "সকল ছবি দেখুন" : "View All Photos"}</span>
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
                      alt={t(photo.title, photo.titleEn)}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/images/bgimage.jpg";
                      }}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                    <span className="rounded bg-[#006a4e] px-1.5 py-0.5 text-[9px] font-bold">
                      {t(photo.category, photo.categoryEn)}
                    </span>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold">{t(photo.title, photo.titleEn)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Managing Committee Card */}
          <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
            <div className="bg-[#005a40] px-4 py-2.5 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {lang === "bn" ? "সভাপতির বাণী" : "President's Message"}
              </h4>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto h-32 w-28 overflow-hidden rounded border border-emerald-700 bg-gray-100 shadow-xs">
                <img
                  src={content.smcPresidentPhoto || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"}
                  alt={t(content.smcPresidentName, content.smcPresidentNameEn) || "President"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/avatar.png";
                  }}
                />
              </div>
              <h5 className="mt-2 text-sm font-bold text-gray-900">
                {t(content.smcPresidentName, content.smcPresidentNameEn) || (lang === "bn" ? "প্রফেসর ড. মুহাম্মদ আশরাফুল আলম" : "Prof. Dr. Muhammad Ashraful Alam")}
              </h5>
              <p className="text-[11px] font-semibold text-[#006a4e]">
                {t(content.smcPresidentTitle, content.smcPresidentTitleEn) || (lang === "bn" ? "সভাপতি, ম্যানেজিং কমিটি" : "President, Managing Committee")}
              </p>
              {content.smcMembersCount && (
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {lang === "bn" ? `কমিটি সদস্য সংখ্যা: ${formatDigits(content.smcMembersCount)}` : `Committee Members: ${content.smcMembersCountEn || content.smcMembersCount}`}
                </p>
              )}
              {content.smcPresidentMessage && (
                <div className="mt-2.5 rounded bg-[#f4f8f5] p-2.5 text-left text-[11px] italic leading-relaxed text-gray-700 border-l-2 border-[#006a4e]">
                  <p className="line-clamp-3">“{t(content.smcPresidentMessage, content.smcPresidentMessageEn)}”</p>
                </div>
              )}
              <div className="mt-3 border-t border-gray-100 pt-2">
                <Link
                  to="/administration"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline"
                >
                  <span>{lang === "bn" ? "সম্পূর্ণ পরিচিতি ও বাণী" : "Profile & Message"}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
          {/* Head Teacher Card */}
          <div className="hidden lg:block overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
            <div className="bg-[#006a4e] px-4 py-2.5 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {lang === "bn" ? "প্রধান শিক্ষকের বাণী" : "Headmaster's Message"}
              </h4>
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded text-white">
                {t(content.principalTitle, content.principalTitleEn) || (lang === "bn" ? "প্রধান শিক্ষক" : "Headmaster")}
              </span>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto h-32 w-28 overflow-hidden rounded border border-emerald-700 bg-gray-100 shadow-xs">
                <img
                  src={content.principalPhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400"}
                  alt={t(content.principalName, content.principalNameEn) || "Headmaster"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/avatar.png";
                  }}
                />
              </div>
              <h5 className="mt-2 text-sm font-bold text-gray-900">{t(content.principalName, content.principalNameEn) || "Md. Abdur Rahman"}</h5>
              <p className="text-[11px] font-semibold text-[#006a4e]">{t(content.principalTitle, content.principalTitleEn) || (lang === "bn" ? "প্রধান শিক্ষক" : "Headmaster")}</p>
              {content.principalQualification && (
                <p className="mt-0.5 text-[10px] text-gray-500">{t(content.principalQualification, content.principalQualificationEn)}</p>
              )}
              {content.principalMessage && (
                <div className="mt-2.5 rounded bg-[#f4f8f5] p-2.5 text-left text-[11px] italic leading-relaxed text-gray-700 border-l-2 border-[#006a4e]">
                  <p className="line-clamp-3">“{t(content.principalMessage, content.principalMessageEn)}”</p>
                </div>
              )}
              <div className="mt-3 border-t border-gray-100 pt-2">
                <Link
                  to="/administration"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline"
                >
                  <span>{lang === "bn" ? "সম্পূর্ণ পরিচিতি ও বাণী" : "Profile & Message"}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Assistant Headmaster Card */}
          <div className="hidden lg:block overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
            <div className="bg-[#006a4e] px-4 py-2.5 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {lang === "bn" ? "সহকারী প্রধান শিক্ষকের বাণী" : "Assistant Headmaster's Message"}
              </h4>
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded text-white">
                {t(content.asstPrincipalTitle, content.asstPrincipalTitleEn) || (lang === "bn" ? "সহকারী প্রধান শিক্ষক" : "Assistant Headmaster")}
              </span>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto h-32 w-28 overflow-hidden rounded border border-emerald-700 bg-gray-100 shadow-xs">
                <img
                  src={content.asstPrincipalPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"}
                  alt={t(content.asstPrincipalName, content.asstPrincipalNameEn) || "Assistant Headmaster"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/images/avatar.png";
                  }}
                />
              </div>
              <h5 className="mt-2 text-sm font-bold text-gray-900">
                {t(content.asstPrincipalName, content.asstPrincipalNameEn) || (lang === "bn" ? "মুহাম্মদ কামরুল হাসান" : "Muhammad Kamrul Hasan")}
              </h5>
              <p className="text-[11px] font-semibold text-[#006a4e]">
                {t(content.asstPrincipalTitle, content.asstPrincipalTitleEn) || (lang === "bn" ? "সহকারী প্রধান শিক্ষক" : "Assistant Headmaster")}
              </p>
              {content.asstPrincipalMessage && (
                <div className="mt-2.5 rounded bg-[#f4f8f5] p-2.5 text-left text-[11px] italic leading-relaxed text-gray-700 border-l-2 border-[#006a4e]">
                  <p className="line-clamp-3">“{t(content.asstPrincipalMessage, content.asstPrincipalMessageEn)}”</p>
                </div>
              )}
              <div className="mt-3 border-t border-gray-100 pt-2">
                <Link
                  to="/administration"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline"
                >
                  <span>{lang === "bn" ? "সম্পূর্ণ পরিচিতি ও বাণী" : "Profile & Message"}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>



          {/* Emergency Hotlines */}
          <div className="overflow-hidden rounded-lg border border-red-200 bg-white shadow-xs">
            <div className="bg-[#da291c] px-4 py-2.5 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">
                {lang === "bn" ? "জাতীয় জরুরি সেবা হটলাইন" : "National Emergency Hotlines"}
              </h4>
            </div>
            <div className="divide-y divide-gray-100 p-2">
              {EMERGENCY_HOTLINES.map((hl) => (
                <div key={hl.number} className="flex items-center justify-between p-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{lang === "bn" ? hl.title : hl.titleEn}</p>
                    <p className="text-[10px] text-gray-500">{lang === "bn" ? hl.desc : hl.descEn}</p>
                  </div>
                  <a
                    href={`tel:${hl.enNumber}`}
                    className="rounded px-2.5 py-1 text-xs font-extrabold text-white shadow-2xs"
                    style={{ background: hl.number === "৯৯৯" ? "#da291c" : "#006a4e" }}
                  >
                    {lang === "bn" ? hl.number : hl.enNumber}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Important Govt Links */}
          <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
            <div className="bg-[#006a4e] px-4 py-2.5 text-white">
              <h4 className="text-sm font-bold">
                {lang === "bn" ? "গুরুত্বপূর্ণ সরকারি বাতায়ন" : "Government Portals & Portals"}
              </h4>
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
                  <span className="line-clamp-1">{t(link.label, link.labelEn)}</span>
                  <ExternalLink size={12} className="shrink-0 text-emerald-700" />
                </a>
              ))}
            </div>
          </div>

          {/* Visitors */}
          <div className="rounded-lg border border-[#dde5df] bg-white p-4 shadow-xs text-center text-xs text-gray-600">
            <div className="flex items-center justify-between border-b border-[#e5ece8] pb-1.5 mb-2">
              <p className="font-bold text-[#006a4e]">
                {lang === "bn" ? "ওয়েবসাইট পরিদর্শক পরিসংখ্যান" : "Visitor Statistics"}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                </span>
                <span>{lang === "bn" ? "লাইভ" : "LIVE"}</span>
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded bg-gray-50 p-2">
                <p className="text-sm font-bold text-gray-900">{formatDigits(visitorStats.today.toLocaleString())}</p>
                <p className="text-[10px] text-gray-500">{lang === "bn" ? "আজকের পরিদর্শক" : "Today's Visitors"}</p>
              </div>
              <div className="rounded bg-gray-50 p-2">
                <p className="text-sm font-bold text-gray-900">{formatDigits(visitorStats.total.toLocaleString())}</p>
                <p className="text-[10px] text-gray-500">{lang === "bn" ? "সর্বমোট পরিদর্শক" : "Total Visitors"}</p>
              </div>
            </div>
            {visitorStats.online !== undefined && visitorStats.online > 0 && (
              <p className="mt-2 text-[10px] text-gray-500 flex items-center justify-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {lang === "bn"
                  ? `বর্তমানে সক্রিয়: ${formatDigits(visitorStats.online)} জন`
                  : `Currently Online: ${formatDigits(visitorStats.online)}`}
              </p>
            )}
            {content.facebookUrl && (
              <a
                href={content.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Share2 size={13} />
                <span>{lang === "bn" ? "অফিসিয়াল ফেসবুক পেজ" : "Official Facebook Page"}</span>
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
            <img src={previewImage.imageUrl} alt={t(previewImage.title, previewImage.titleEn)} className="max-h-[80vh] w-auto object-contain" />
            <div className="p-3 text-white">
              <span className="rounded bg-[#006a4e] px-2 py-0.5 text-xs font-bold">{t(previewImage.category, previewImage.categoryEn)}</span>
              <p className="mt-1 text-sm font-semibold">{t(previewImage.title, previewImage.titleEn)}</p>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center gap-2">
                <div>
                  <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-gray-950">
                    {t(selectedNotice.category, selectedNotice.categoryEn) || (lang === "bn" ? "নোটিশ" : "Notice")}
                  </span>
                  <h3 className="mt-0.5 text-sm font-bold sm:text-base">
                    {lang === "bn" ? "সরকারি নোটিশ পত্র" : "Official Notice Paper"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="rounded p-1 text-white hover:bg-white/20"
                aria-label={lang === "bn" ? "বন্ধ করুন" : "Close"}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500">{lang === "bn" ? "তারিখ:" : "Date:"} {formatDigits(selectedNotice.date || "2026-10-15")}</p>
                <h4 className="mt-1 text-lg font-bold text-gray-900">{t(selectedNotice.title, selectedNotice.titleEn)}</h4>
              </div>

              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-800">
                {t(selectedNotice.content, selectedNotice.contentEn) ||
                  (lang === "bn"
                    ? "উক্ত বিষয়ের প্রেক্ষিতে সকল শিক্ষক, শিক্ষার্থী ও অভিভাবকদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, নোটিশটি যথাযথভাবে অনুসরণ করার নির্দেশ প্রদান করা হলো।"
                    : "All students, teachers, and guardians are hereby notified to adhere to the aforementioned notice. Please contact school administration for further details.")}
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
                          {t(selectedNotice.category, selectedNotice.categoryEn) || (lang === "bn" ? "নোটিশ সংযুক্তি" : "Notice Attachment")}
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-gray-900">
                          {t(selectedNotice.title, selectedNotice.titleEn)}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {lang === "bn" ? "প্রকাশের তারিখ:" : "Published:"} {formatDigits(selectedNotice.date || "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={selectedNotice.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
                        title={lang === "bn" ? "নতুন ট্যাবে বড় করে দেখুন" : "Open Full in New Tab"}
                      >
                        <ExternalLink size={13} />
                        <span>{lang === "bn" ? "পূর্ণাঙ্গ ভিউ" : "Full View"}</span>
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
                            ? (lang === "bn" ? "ফাইল / ছবি ডাউনলোড" : "Download File / Image")
                            : (lang === "bn" ? "পিডিএফ ডাউনলোড" : "Download PDF")}
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
                              {lang === "bn" ? "পিডিএফ ডকুমেন্ট" : "PDF Document"}
                            </p>
                            <p className="text-[11px] text-gray-500 mb-3">
                              {lang === "bn"
                                ? "সরাসরি দেখতে নিচের বাটনে ক্লিক করুন"
                                : "Click below to view the PDF file"}
                            </p>
                            <a
                              href={selectedNotice.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00503a]"
                            >
                              <ExternalLink size={13} />
                              <span>{lang === "bn" ? "পিডিএফ ফাইলটি দেখুন" : "View PDF File"}</span>
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
                  <p className="font-semibold text-gray-800">{lang === "bn" ? "আদেশক্রমে," : "By Order,"}</p>
                  <p className="font-bold text-[#006a4e]">{t(content.principalName, content.principalNameEn) || "Headmaster"}</p>
                  <p className="text-[11px] text-gray-500">{lang === "bn" ? (content.schoolNameBn || content.schoolName) : (content.schoolName || content.schoolNameBn)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(null)}
                    className="rounded bg-[#006a4e] px-5 py-1.5 font-bold text-white hover:bg-[#00503a] transition shadow-xs"
                  >
                    {lang === "bn" ? "ঠিক আছে" : "Close"}
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

export default HomePage;
