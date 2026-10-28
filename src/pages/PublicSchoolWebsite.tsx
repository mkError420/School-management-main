import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
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
  HelpCircle,
  Image as ImageIcon,
  Languages,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Music,
  Phone,
  PhoneCall,
  Play,
  Pause,
  School,
  Search,
  Share2,
  Shield,
  Sparkles,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BdGovEmblem, SmartBdBadge } from "@/components/government/GovtEmblem";
import type { SchoolNotice, SchoolDownloadItem, SchoolGalleryItem } from "@/types/site";

const EMERGENCY_HOTLINES = [
  { number: "৯৯৯", enNumber: "999", title: "জাতীয় জরুরি সেবা", desc: "পুলিশ, অ্যাম্বুলেন্স, ফায়ার সার্ভিস", color: "from-red-600 to-rose-700" },
  { number: "৩৩৩", enNumber: "333", title: "সরকারি তথ্য ও সেবা", desc: "জাতীয় হেল্পলাইন ও নাগরিক সেবা", color: "from-emerald-600 to-teal-700" },
  { number: "১০৯", enNumber: "109", title: "নারী ও শিশু হেল্পলাইন", desc: "সহিংসতা প্রতিরোধ সহায়তা", color: "from-amber-600 to-orange-700" },
  { number: "১০৬", enNumber: "106", title: "দুদক হটলাইন", desc: "দুর্নীতি দমন কমিশন", color: "from-blue-600 to-indigo-700" },
  { number: "১৬৪৩০", enNumber: "16430", title: "সরকারি আইনি সেবা", desc: "বিনামূল্যে আইনি পরামর্শ", color: "from-purple-600 to-indigo-800" },
  { number: "১৬১২২", enNumber: "16122", title: "ডিজিটাল ভূমিসেবা", desc: "ভূমি মন্ত্রণালয় হেল্পলাইন", color: "from-green-700 to-emerald-900" },
];

const GOVT_OFFICIAL_LINKS = [
  { label: "শিক্ষা মন্ত্রণালয় (মাধ্যমিক ও উচ্চ শিক্ষা বিভাগ)", url: "https://moedu.gov.bd" },
  { label: "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি)", url: "https://dshe.gov.bd" },
  { label: "ঢাকা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড", url: "https://dhakaeducationboard.gov.bd" },
  { label: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)", url: "https://nctb.gov.bd" },
  { label: "শিক্ষক বাতায়ন (Teachers Portal)", url: "https://teachers.gov.bd" },
  { label: "বাংলাদেশ জাতীয় তথ্য বাতায়ন (Bangladesh Portal)", url: "https://bangladesh.gov.bd" },
  { label: "মুক্তপাঠ ই-লার্নিং প্লাটফর্ম", url: "https://muktopaath.gov.bd" },
  { label: "প্রধানমন্ত্রীর শিক্ষা সহায়তা ট্রাস্ট", url: "https://pmeat.gov.bd" },
];

export const PublicSchoolWebsite: React.FC = () => {
  const { websiteContent: content, siteLogo, liveCounts, submitContactInquiry, visitorStats } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeContactForm, setHomeContactForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [isHomeContactSending, setIsHomeContactSending] = useState(false);
  const [homeContactSuccess, setHomeContactSuccess] = useState(false);
  const [homeContactError, setHomeContactError] = useState("");
  const [activeNoticeCategory, setActiveNoticeCategory] = useState<string>("সকল");
  const [noticeSearch, setNoticeSearch] = useState<string>("");
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [previewImage, setPreviewImage] = useState<SchoolGalleryItem | null>(null);
  const [showCharterModal, setShowCharterModal] = useState<boolean>(false);
  const [showAnthemModal, setShowAnthemModal] = useState<boolean>(false);
  const [isPlayingAnthem, setIsPlayingAnthem] = useState<boolean>(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [lang, setLang] = useState<"bn" | "en">("bn");

  const t = (bnText?: string, enText?: string) => {
    if (lang === "en") return enText || bnText || "";
    return bnText || enText || "";
  };

  const formatDigits = (val: string | number) => {
    if (lang === "en") return String(val);
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(val).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  // Real-time live date & time display
  const [currentTime, setCurrentTime] = useState({
    timeStr: "",
    dateStrBn: "",
    dateStrEn: "",
  });

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
        return "bg-gradient-to-r from-[#002217]/70 via-[#00281b]/35 to-transparent";
    }
  }, [content.heroOverlayOpacity]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      const optionsBn: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      const dateStrBn = now.toLocaleDateString("bn-BD", optionsBn);
      const optionsEn: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      const dateStrEn = now.toLocaleDateString("en-US", optionsEn);
      setCurrentTime({ timeStr, dateStrBn, dateStrEn });
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // National Anthem Audio setup
  useEffect(() => {
    const audio = new Audio("/audio/national-anthem.mp3");
    audio.onended = () => setIsPlayingAnthem(false);
    audio.onpause = () => setIsPlayingAnthem(false);
    audio.onplay = () => setIsPlayingAnthem(true);
    setAudioRef(audio);
    return () => {
      audio.pause();
    };
  }, []);

  const toggleAnthem = () => {
    if (!audioRef) return;
    if (isPlayingAnthem) {
      audioRef.pause();
    } else {
      audioRef.play().catch(() => { });
    }
  };

  // Filter notices
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

  const navLinks = [
    { label: "প্রচ্ছদ", enLabel: "Home", href: "#home" },
    { label: "আমাদের কথা", enLabel: "About", href: "#about" },
    { label: "প্রধান শিক্ষকের বাণী", enLabel: "Principal", href: "#principal" },
    { label: "নোটিশ বোর্ড", enLabel: "Notices", href: "#notices" },
    { label: "ডাউনলোড ও রুটিন", enLabel: "Downloads", href: "#downloads" },
    { label: "ভর্তি তথ্য", enLabel: "Admission", href: "#admission" },
    { label: "স্টাডি কর্নার", enLabel: "Study Corner", href: "#study-corner" },
    { label: "ফটো গ্যালারি", enLabel: "Gallery", href: "#gallery" },
    { label: "সহশিক্ষা", enLabel: "Co-curricular", href: "#co-curricular" },
    { label: "যোগাযোগ", enLabel: "Contact", href: "#contact" },
  ];

  const primarySchoolName = lang === "bn" ? content.schoolNameBn || content.schoolName : content.schoolName || content.schoolNameBn;
  const secondarySchoolName = lang === "bn" ? content.schoolName : content.schoolNameBn;
  const activeMotto = lang === "bn" ? content.mottoBn || content.motto : content.motto || content.mottoBn;

  // Build the ticker items list for the seamless circular scroll
  const tickerItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: "breaking" | "dynamic" | "notice" | "default";
      text?: string;
      textEn?: string;
      badge?: string;
      badgeEn?: string;
      link?: string;
      priority?: "urgent" | "important" | "normal";
      notice?: (typeof content.notices)[number];
    }> = [];

    // 1. Dynamic custom ticker items
    const customItems = (content.tickerItems || []).filter(
      (item) => item.isActive !== false && item.text?.trim()
    );
    if (customItems.length > 0) {
      customItems.forEach((tk) => {
        items.push({
          id: tk.id || String(Math.random()),
          type: "dynamic",
          text: tk.text,
          textEn: tk.textEn,
          badge: tk.badge,
          badgeEn: tk.badgeEn,
          link: tk.link,
          priority: tk.priority || "normal",
        });
      });
    }

    // 2. Breaking News
    if (content.breakingNews && content.breakingNews.trim() !== "") {
      items.push({
        id: "__breaking__",
        type: "breaking",
        text: content.breakingNews,
        textEn: content.breakingNewsEn,
      });
    }

    // 3. Notices
    if (content.tickerIncludeNotices !== false) {
      (content.notices || []).slice(0, 5).forEach((n, i) => {
        items.push({ id: `notice_${n.id ?? i}`, type: "notice", notice: n });
      });
    }

    // 4. Default fallback
    if (items.length === 0) {
      items.push({ id: "__default__", type: "default" });
    }

    return items;
  }, [content.tickerItems, content.breakingNews, content.notices, content.tickerIncludeNotices]);

  const tickerDuration = useMemo(() => {
    const basePerItem = content.tickerSpeed === "fast" ? 5 : content.tickerSpeed === "slow" ? 11 : 8;
    const minDuration = content.tickerSpeed === "fast" ? 20 : content.tickerSpeed === "slow" ? 48 : 32;
    return `${Math.max(minDuration, tickerItems.length * basePerItem)}s`;
  }, [content.tickerSpeed, tickerItems.length]);

  return (
    <div className="min-h-screen bg-[#f3f6f4] font-sans text-[#1c2c24] antialiased selection:bg-[#006a4e] selection:text-white">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. TOP GOVERNMENT STRIP (বাংলাদেশ জাতীয় তথ্য বাতায়ন কাঠামো)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#0a4634] bg-[#004d38] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[11px] sm:px-6 sm:text-xs">
          {/* Govt & Ministry Branding */}
          <div className="flex items-center gap-2">
            <BdGovEmblem size={22} className="h-5 w-5 shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-emerald-200">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
              <span className="hidden text-white/40 md:inline">|</span>
              <span className="hidden text-white/90 md:inline">মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর · শিক্ষা মন্ত্রণালয়</span>
            </div>
          </div>

          {/* Quick Govt Tools & Direct Portal Login */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-1.5 text-white/80 lg:flex">
              <Calendar size={13} className="text-amber-400" />
              {currentTime.dateStrBn || "আজকের তারিখ"}
            </span>

            {/* National Anthem trigger */}
            <button
              type="button"
              onClick={() => setShowAnthemModal(true)}
              className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium transition hover:bg-white/20"
              title="জাতীয় সংগীত শুনুন ও লিরিক্স দেখুন"
            >
              <Music size={12} className="text-amber-300" />
              <span className="hidden sm:inline">জাতীয় সংগীত</span>
            </button>

            {/* Citizen Charter */}
            <button
              type="button"
              onClick={() => setShowCharterModal(true)}
              className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium transition hover:bg-white/20"
            >
              <Shield size={12} className="text-amber-300" />
              <span className="hidden sm:inline">সিটিজেন চার্টার</span>
            </button>

            {/* Language switch */}
            <button
              type="button"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-0.5 font-semibold transition hover:bg-white/15"
              title="Change Language"
            >
              <Languages size={12} />
              {lang === "bn" ? "English" : "বাংলা"}
            </button>

            {/* Super Admin & Staff Portal Login */}
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#eab308] px-3 py-1 font-bold text-gray-950 shadow-xs transition hover:bg-[#fde047] hover:shadow-md"
            >
              <Users size={13} />
              <span>ইউজার লগইন</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. MAIN SCHOOL BRANDING & GOVERNMENT HEADER
          ────────────────────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#dde5df] bg-gradient-to-r from-white via-[#fafdff] to-[#f4f8f5] shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="relative shrink-0">
              <img
                src={siteLogo || "/images/logo.png"}
                alt="School Monogram"
                className="h-16 w-16 rounded-full border-2 border-[#006a4e] bg-white p-1 shadow-md object-contain sm:h-20 sm:w-20"
                onError={(e) => {
                  e.currentTarget.src = "/images/logo.png";
                }}
              />
              <div className="absolute -bottom-1 -right-1 rounded-full border border-white bg-[#006a4e] p-0.5 shadow-xs">
                <BdGovEmblem size={16} />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#005a40] sm:text-3xl lg:text-4xl">
                  {primarySchoolName}
                </h1>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#3d5a4c] sm:text-sm">
                {secondarySchoolName}
              </p>
              <p className="mt-0.5 hidden text-xs font-medium text-[#006a4e] sm:block">
                {content.boardName || "মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড"} · গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
              </p>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-gray-700 sm:justify-start">
                <span className="rounded bg-emerald-100/90 px-2 py-0.5 text-[#005a40]">
                  স্থাপিত: {content.establishedYear || "১৯৮৫"}
                </span>
                <span className="rounded bg-emerald-100/90 px-2 py-0.5 text-[#005a40]">
                  EIIN: {content.eiin || "123456"}
                </span>
                <span className="rounded bg-emerald-100/90 px-2 py-0.5 text-[#005a40]">
                  বিদ্যালয় কোড: {content.schoolCode || "1001"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Badges: Mujib 100 / Smart BD + Quick Helpline */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right lg:block">
              <SmartBdBadge />
              <div className="mt-2 flex items-center justify-end gap-2 text-xs font-semibold text-[#005a40]">
                <PhoneCall size={14} className="text-[#006a4e]" />
                <a href={`tel:${content.phone?.replace(/[^\d+]/g, "")}`} className="hover:underline">
                  {content.phone || "+880 2 1234 5678"}
                </a>
              </div>
              <p className="text-[10px] text-gray-500">{content.officeHours || "রবিবার-বৃহস্পতিবার ৯:০০-৪:০০"}</p>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[#c4d4c8] bg-white text-[#006a4e] shadow-xs transition hover:bg-emerald-50 sm:hidden"
              aria-label="মেনু খুলুন"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. BANGLADESH GOVT TEMPLATE NAVIGATION BAR (সবুজ ও স্বর্ণালী মেনুবার)
          ────────────────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 border-t-2 border-[#eab308] bg-[#006a4e] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Desktop Navigation Links */}
          <div className="hidden flex-wrap items-center sm:flex">
            {navLinks.map((item, idx) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-3 text-sm font-semibold transition hover:bg-[#00523d] hover:text-[#fef08a] ${idx === 0 ? "bg-[#00523d] text-[#fef08a]" : ""
                  }`}
              >
                {lang === "bn" ? item.label : item.enLabel}
              </a>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-emerald-800 bg-[#005a40] px-4 py-3 sm:hidden">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  {lang === "bn" ? item.label : item.enLabel}
                </a>
              ))}
            </div>
            <div className="mt-3 border-t border-emerald-800/80 pt-2 text-center">
              <Link
                to="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#eab308] py-2 text-xs font-bold text-gray-950"
              >
                <span>সুপার অ্যাডমিন ও শিক্ষক লগইন</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. BREAKING TICKER (জরুরি নোটিশ / সংবাদ স্ক্রল)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#ffd700]/30 bg-[#fffbeb] text-gray-900 shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center px-3 py-2 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-1.5 rounded-sm bg-[#da291c] px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            <Bell size={13} className="animate-bounce" />
            <span>
              {t(
                content.tickerLabel || (lang === "bn" ? "জরুরি নোটিশ:" : "Urgent Notice:"),
                content.tickerLabelEn || (lang === "bn" ? "জরুরি নোটিশ:" : "Urgent Notice:")
              )}
            </span>
          </div>

          {/* Seamless infinite circular scroll — duplicated track translates 0 → -50% */}
          <div className="relative mx-3 flex-1 overflow-hidden text-xs font-semibold text-gray-800 sm:text-sm">
            <div
              className="animate-ticker-horizontal items-center gap-12"
              style={{ "--ticker-h-duration": tickerDuration } as React.CSSProperties}
            >
              {[...tickerItems, ...tickerItems].map((item, idx) => {
                if (item.type === "dynamic") {
                  const badgeText = t(item.badge, item.badgeEn);
                  const itemText = t(item.text, item.textEn);
                  const badgeClass =
                    item.priority === "urgent"
                      ? "bg-[#da291c] text-white"
                      : item.priority === "important"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-emerald-100 text-[#006a4e]";

                  const innerContent = (
                    <span className="shrink-0 inline-flex items-center gap-1.5 transition group cursor-pointer hover:text-[#006a4e]">
                      <span className="text-amber-500 font-bold">★</span>
                      {badgeText && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                          {badgeText}
                        </span>
                      )}
                      <span className="group-hover:underline underline-offset-2">{itemText}</span>
                    </span>
                  );

                  if (item.link) {
                    return item.link.startsWith("http") ? (
                      <a
                        key={`dyn-${item.id}-${idx}`}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0"
                      >
                        {innerContent}
                      </a>
                    ) : (
                      <Link key={`dyn-${item.id}-${idx}`} to={item.link} className="shrink-0">
                        {innerContent}
                      </Link>
                    );
                  }
                  return (
                    <span key={`dyn-${item.id}-${idx}`} className="shrink-0">
                      {innerContent}
                    </span>
                  );
                }

                if (item.type === "breaking") {
                  return (
                    <span key={`b-${idx}`} className="shrink-0 font-bold text-[#da291c]">
                      ★ {t(content.breakingNews, content.breakingNewsEn)}
                    </span>
                  );
                }

                if (item.type === "default") {
                  return (
                    <span key={`d-${idx}`} className="shrink-0 text-[#006a4e]">
                      ★ {lang === "bn"
                        ? "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি আবেদন চলমান · সকল শিক্ষকদের সময়মতো উপস্থিতির নির্দেশ দেওয়া হলো"
                        : "Admission applications for Academic Year 2026 are ongoing · Teachers are requested to be on time"}
                    </span>
                  );
                }

                const n = item.notice!;
                return (
                  <button
                    key={`n-${item.id}-${idx}`}
                    type="button"
                    onClick={() => setSelectedNotice(n)}
                    className="shrink-0 inline-flex items-center gap-1.5 hover:text-[#006a4e] transition group text-left cursor-pointer"
                  >
                    <span className="text-amber-500 font-bold">★</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-[#006a4e]">
                      {t(n.category, n.categoryEn) || (lang === "bn" ? "সাধারণ" : "General")}
                    </span>
                    <span className="group-hover:underline underline-offset-2">{t(n.title, n.titleEn)}</span>
                    {n.date && (
                      <span className="text-[11px] text-gray-500 font-normal">({formatDigits(n.date)})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>



          <a
            href="#notices"
            className="hidden shrink-0 text-xs font-bold text-[#006a4e] hover:underline sm:inline-flex sm:items-center sm:gap-1"
          >
            <span>সকল নোটিশ</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* ──────────────────────────────────────────────────────────────────────────
            5. HERO BANNER & SHOWCASE SECTION
            ────────────────────────────────────────────────────────────────────────── */}
        <section
          id="home"
          className="group relative mb-8 overflow-hidden rounded-xl border border-[#cbe0d3] bg-[#004d38] text-white shadow-xl transition-all"
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

          <div className="relative z-10 px-5 py-12 sm:px-10 sm:py-16 md:max-w-3xl">
            {/* Government Seal Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-sm shadow-sm">
              <BdGovEmblem size={16} />
              <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত সরকারি মডেল বিদ্যাপীঠ</span>
            </div>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {content.heroTitle || "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ে স্বাগতম"}
            </h2>

            <p className="mt-3 text-sm font-bold text-amber-300 sm:text-base drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              {content.heroSubtitle || "জ্ঞান, চরিত্র ও দেশপ্রেমের চেতনায় আলোকিত সমৃদ্ধ আগামী"}
            </p>

            <p className="mt-4 text-xs leading-relaxed text-white/95 sm:text-sm md:leading-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {content.heroDescription ||
                "সুশৃঙ্খল শিক্ষাদান, আদর্শ নৈতিক চরিত্র গঠন এবং যুগোপযোগী ডিজিটাল শিক্ষার সমন্বয়ে শিক্ষার্থীদের ভবিষ্যৎ বিনির্মাণে আমরা অঙ্গীকারাবদ্ধ।"}
            </p>

            {/* Quick Action Buttons */}
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#admission"
                className="inline-flex items-center gap-2 rounded-md bg-[#0aa0ab] px-5 py-2.5 text-xs font-bold text-gray-950 shadow-md transition hover:bg-[#0aa0ab] sm:text-sm active:scale-95"
              >
                <BookOpen size={16} />
                <span>{content.admissionBtnText || "ভর্তি তথ্য ও আবেদন"}</span>
              </a>

              <a
                href="#notices"
                className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-black/30 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/50 sm:text-sm active:scale-95"
              >
                <Bell size={16} />
                <span>নোটিশ বোর্ড দেখুন</span>
              </a>

              <a
                href="#downloads"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-[#004d38]/80 px-4 py-2.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm transition hover:bg-[#004d38] sm:text-sm active:scale-95"
              >
                <Download size={15} />
                <span>ক্লাস রুটিন ও সিলেবাস</span>
              </a>
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
                title={isCarouselPaused ? "Play Carousel" : "Pause Carousel"}
                className="ml-1 text-white/80 hover:text-white transition p-0.5 rounded hover:bg-white/10"
              >
                {isCarouselPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            </div>
          )}

          {/* National Flag Color accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#006a4e] via-[#da291c] to-[#006a4e] z-20" />
        </section>

        {/* ──────────────────────────────────────────────────────────────────────────
            6. BANGLADESH GOVT PORTAL 2-COLUMN LAYOUT (বাম পাশের মূল কলাম ও ডান সাইডবার)
            ────────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          {/* =========================================================================
              LEFT COLUMN (68% - 8 Columns): Main Content Area
              ========================================================================= */}
          <div className="space-y-8 lg:col-span-8">
            {/* 1. ABOUT & AT A GLANCE (পরিচিতি ও এক নজরে বিদ্যালয়) */}
            <section
              id="about"
              className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7"
            >
              <div className="border-b border-[#e2ece5] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                    <School size={16} />
                  </span>
                  <h3 className="text-xl font-bold text-[#005a40]">
                    {content.aboutTitle || "বিদ্যালয় পরিচিতি ও গৌরবময় ইতিহাস"}
                  </h3>
                </div>
                <div className="mt-2 h-1 w-20 rounded-full bg-[#eab308]" />
              </div>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
                <p>
                  {content.aboutText ||
                    "এম. কে. সরকারি মডেল উচ্চ বিদ্যালয় বাংলাদেশের অন্যতম সুপরিচিত সরকারি শিক্ষাপ্রতিষ্ঠান। ১৯৮৫ সালে প্রতিষ্ঠিত এই বিদ্যাপীঠ নিরবচ্ছিন্নভাবে উন্নত মানবিক মূল্যবোধ, আধুনিক বিজ্ঞান ও তথ্যপ্রযুক্তিভিত্তিক শিক্ষা নিশ্চিত করে আসছে। বিদ্যালয়ের মনোরম ক্যাম্পাস, অভিজ্ঞ শিক্ষকমণ্ডলী এবং সুশৃঙ্খল পরিবেশ শিক্ষার্থীদের মেধা বিকাশে অনন্য ভূমিকা পালন করে।"}
                </p>
                {content.historyText && <p className="italic text-gray-600">“{content.historyText}”</p>}
              </div>

              {/* Mission & Vision Cards */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-emerald-100 bg-[#f4f9f6] p-3.5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                    <Compass size={14} />
                    <span>আমাদের লক্ষ্য (Mission)</span>
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-gray-700">
                    {content.missionText || "দক্ষ, নীতিবান, বিজ্ঞানমনস্ক এবং মানবিক গুণসম্পন্ন আগামী প্রজন্মের সুনাগরিক গড়ে তোলা।"}
                  </p>
                </div>

                <div className="rounded-md border border-amber-100 bg-[#fefce8] p-3.5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                    <Sparkles size={14} />
                    <span>আমাদের দৃষ্টিভঙ্গি (Vision)</span>
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-gray-700">
                    {content.visionText || "স্মার্ট বাংলাদেশ ও বিশ্বমানের শিক্ষাব্যবস্থার উপযোগী শ্রেষ্ঠ আদর্শ শিক্ষাপ্রতিষ্ঠানে রূপান্তর।"}
                  </p>
                </div>
              </div>

              {/* At a Glance Stats Grid (এক নজরে বিদ্যালয়) */}
              <div className="mt-6 border-t border-[#eaf1ec] pt-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#006a4e]">
                  এক নজরে বিদ্যালয়ের পরিসংখ্যান
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                  {[
                    {
                      label: "মোট শিক্ষার্থী",
                      value:
                        liveCounts && typeof liveCounts.students === "number"
                          ? formatDigits(liveCounts.students.toLocaleString())
                          : content.studentCount || "১,৫০০+",
                      icon: Users,
                      color: "text-[#006a4e] bg-emerald-50",
                    },
                    {
                      label: "শিক্ষকমণ্ডলী",
                      value:
                        liveCounts && typeof liveCounts.teachers === "number"
                          ? formatDigits(liveCounts.teachers.toLocaleString())
                          : content.teacherCount || "৫২",
                      icon: GraduationCap,
                      color: "text-blue-700 bg-blue-50",
                    },
                    {
                      label: "কর্মচারীবৃন্দ",
                      value:
                        liveCounts && typeof liveCounts.staff === "number"
                          ? formatDigits(liveCounts.staff.toLocaleString())
                          : content.staffCount || "১৬",
                      icon: HeartHandshake,
                      color: "text-teal-700 bg-teal-50",
                    },
                    {
                      label: "শ্রেণি কক্ষ",
                      value:
                        liveCounts && typeof liveCounts.classes === "number" && liveCounts.classes > 0
                          ? formatDigits(liveCounts.classes.toLocaleString())
                          : content.classCount || "২৪",
                      icon: BookOpen,
                      color: "text-amber-700 bg-amber-50",
                    },
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

            {/* 2. PRINCIPAL'S MESSAGE (প্রধান শিক্ষকের বাণী) */}
            <section
              id="principal"
              className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7"
            >
              <div className="border-b border-[#e2ece5] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                    <GraduationCap size={16} />
                  </span>
                  <h3 className="text-xl font-bold text-[#005a40]">
                    {content.principalTitle || "প্রধান শিক্ষক মহোদয়ের বাণী"}
                  </h3>
                </div>
                <div className="mt-2 h-1 w-20 rounded-full bg-[#eab308]" />
              </div>

              <div className="mt-5 flex flex-col gap-6 sm:flex-row">
                {/* Principal Photo with Govt Frame */}
                <div className="shrink-0 text-center sm:w-44">
                  <div className="relative mx-auto h-44 w-36 overflow-hidden rounded-md border-2 border-[#006a4e] bg-gray-100 shadow-md">
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
                  <p className="text-[10px] text-gray-500">{content.principalQualification || "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড"}</p>
                </div>

                {/* Principal Message Text */}
                <div className="flex-1">
                  <div className="relative rounded-md border-l-4 border-[#006a4e] bg-[#f9fbf9] p-4 text-sm leading-relaxed text-gray-800">
                    <p className="italic">
                      “{content.principalMessage ||
                        "বিসমিল্লাহির রাহমানির রাহিম। প্রিয় শিক্ষার্থী, শ্রদ্ধেয় অভিভাবক ও শুভানুধ্যায়ীগণ—এম. কে. সরকারি মডেল উচ্চ বিদ্যালয়ের ডিজিটাল বাতায়নে আপনাদের আন্তরিক শুভেচ্ছা জানাই। শিক্ষার আসল উদ্দেশ্য কেবল পুঁথিগত বিদ্যা অর্জন নয়, বরং অন্তরের সুপ্ত প্রতিভাকে বিকশিত করে প্রকৃত দেশপ্রেমিক ও মানবিক মানুষ হয়ে ওঠা। আমাদের শিক্ষকমণ্ডলী প্রতিটি শিক্ষার্থীর যত্নশীল পরিচর্যায় নিবেদিতপ্রাণ। আসুন, সম্মিলিত প্রচেষ্টায় আমরা প্রিয় সন্তানদের জন্য এক সুন্দর ভবিষ্যৎ গড়ে তুলি।"}”
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
                    <span>{content.schoolNameBn || content.schoolName}</span>
                    <span className="font-semibold text-[#006a4e]">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. DYNAMIC INTERACTIVE NOTICE BOARD (নোটিশ বোর্ড) */}
            <section
              id="notices"
              className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7"
            >
              <div className="flex flex-col gap-3 border-b border-[#e2ece5] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#da291c] text-white">
                      <Bell size={16} />
                    </span>
                    <h3 className="text-xl font-bold text-[#005a40]">বিদ্যালয় নোটিশ বোর্ড</h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">সকল প্রকার ভর্তি, পরীক্ষা, ফলাফল ও প্রাতিষ্ঠানিক আদেশ</p>
                </div>

                {/* Notice Search Input */}
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

              {/* Category Filter Tabs */}
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

              {/* Notice List Cards */}
              <div className="mt-4 space-y-3">
                {filteredNotices.length > 0 ? (
                  filteredNotices.map((notice, index) => {
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
                          {/* BD Govt Date Badge */}
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border border-emerald-800 bg-[#006a4e] text-white shadow-2xs">
                            <span className="text-base font-bold leading-none">{day}</span>
                            <span className="mt-0.5 text-[10px] font-semibold uppercase">{month}</span>
                            <span className="text-[9px] text-emerald-200">{year}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                {notice.category || "সাধারণ"}
                              </span>
                              <span className="text-[11px] text-gray-500">{notice.date}</span>

                              {notice.fileUrl && notice.fileUrl !== "#" && notice.fileUrl.trim() !== "" && (
                                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${notice.fileUrl.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(notice.fileUrl)
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : notice.fileUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(notice.fileUrl)
                                    ? "bg-emerald-50 text-[#006a4e] border border-emerald-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}>
                                  {notice.fileUrl.startsWith("data:application/pdf") || /\.pdf(\?.*)?$/i.test(notice.fileUrl) ? (
                                    <>
                                      <FileText size={10} className="text-red-600" />
                                      <span>PDF</span>
                                    </>
                                  ) : notice.fileUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(notice.fileUrl) ? (
                                    <>
                                      <ImageIcon size={10} className="text-[#006a4e]" />
                                      <span>ছবি</span>
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink size={10} className="text-blue-600" />
                                      <span>ফাইল</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                            <h4 className="mt-1 font-bold text-gray-900 transition group-hover:text-[#006a4e]">
                              {notice.title}
                            </h4>
                            {notice.content && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">{notice.content}</p>
                            )}
                          </div>
                        </div>

                        {/* View & Download buttons */}
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
                  })
                ) : (
                  <div className="rounded-md border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
                    কোনো নোটিশ পাওয়া যায়নি।
                  </div>
                )}
              </div>
            </section>

            {/* 4. ACADEMICS & DOWNLOADS CORNER (ডাউনলোড কর্নার ও রুটিন) */}
            <section
              id="downloads"
              className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7"
            >
              <div className="border-b border-[#e2ece5] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                    <Download size={16} />
                  </span>
                  <h3 className="text-xl font-bold text-[#005a40]">একাডেমিক তথ্য ও ডাউনলোড কর্নার</h3>
                </div>
                <div className="mt-2 h-1 w-20 rounded-full bg-[#eab308]" />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(content.downloads && content.downloads.length > 0 ? content.downloads : [
                  { id: "d1", title: "২০২৬ শিক্ষাবর্ষের সকল শ্রেণির ক্লাস রুটিন", category: "ক্লাস রুটিন", publishDate: "2026-10-10", fileUrl: "#" },
                  { id: "d2", title: "বার্ষিক পরীক্ষা ২০২৬ সময়সূচী ও আসন বিন্যাস", category: "পরীক্ষার রুটিন", publishDate: "2026-10-12", fileUrl: "#" },
                  { id: "d3", title: "এনসিটিবি কর্তৃক নির্ধারিত পাঠ্যপুস্তক ও সিলেবাস", category: "সিলেবাস", publishDate: "2026-09-20", fileUrl: "#" },
                  { id: "d4", title: "বিদ্যালয়ের বার্ষিক ছুটির তালিকা ও শিক্ষাপঞ্জি", category: "শিক্ষাপঞ্জি", publishDate: "2026-01-05", fileUrl: "#" },
                ]).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[#e4ede7] bg-[#fbfdfc] p-3.5 transition hover:border-[#006a4e] hover:shadow-2xs"
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
                      onClick={(e) => {
                        if (item.fileUrl === "#") {
                          e.preventDefault();
                          alert(`“${item.title}” ডাউনলোড শীঘ্রই সক্রিয় হবে।`);
                        }
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#006a4e] text-white transition hover:bg-[#00503a]"
                      title="ডাউনলোড করুন"
                    >
                      <Download size={15} />
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. STUDY CORNER (স্টাডি কর্নার — জ্ঞান অন্বেষণের কেন্দ্র) */}
            <section
              id="study-corner"
              className="relative overflow-hidden rounded-lg border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:p-7"
            >
              <div className="border-b border-blue-200 pb-3">
                <span className="rounded bg-[#006a4e] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  পাঠ ও গবেষণা কেন্দ্র
                </span>
                <h3 className="mt-2 text-xl font-bold text-blue-950">
                  {content.studyCornerTitle || "Study Corner — জ্ঞান অন্বেষণের কেন্দ্র"}
                </h3>
              </div>

              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative mx-auto h-40 w-36 shrink-0 overflow-hidden rounded-md border-2 border-[#006a4e] bg-white shadow-md sm:mx-0">
                  <img
                    src={content.studyCornerImage || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600"}
                    alt="Study Corner"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-[#004d38]/90 py-1 text-center text-[10px] font-bold text-white">
                    জ্ঞানের আলোয় আলোকিত
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <p className="font-serif text-sm font-semibold italic text-blue-900">
                    {content.studyCornerQuote || "“জ্ঞানই শক্তি। পড়ো এবং নিজেকে আলোকিত করো।”"}
                  </p>
                  <p className="text-xs leading-5 text-gray-700">
                    {content.studyCornerText ||
                      "বিদ্যালয়ের Study Corner হলো শিক্ষার্থীদের জন্য একটি বিশেষ পাঠ ও গবেষণা কেন্দ্র যেখানে রয়েছে সমৃদ্ধ পাঠাগার, ডিজিটাল রিসোর্স, রেফারেন্স বই, এবং শান্ত পরিবেশে স্ব-অধ্যয়নের সুযোগ।"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "রেফারেন্স বই", value: "৫০০+", color: "text-blue-700 bg-blue-50" },
                      { label: "ডিজিটাল সংস্থান", value: "১০০+", color: "text-indigo-700 bg-indigo-50" },
                      { label: "ডেইলি পাঠক", value: "৮০+", color: "text-emerald-700 bg-emerald-50" },
                      { label: "আসন সংখ্যা", value: "৪০টি", color: "text-purple-700 bg-purple-50" },
                    ].map((stat, i) => (
                      <div key={i} className={`rounded-md border border-gray-100 p-2 text-center ${stat.color}`}>
                        <p className="text-base font-bold">{stat.value}</p>
                        <p className="text-[10px] font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <a
                    href="#study-corner"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline"
                  >
                    <BookOpen size={13} />
                    <span>বিস্তারিত জানতে স্টাডি কর্নার পেজ দেখুন</span>
                    <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </section>

            {/* 6. PHOTO GALLERY (ফটো গ্যালারি) */}
            <section
              id="gallery"
              className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7"
            >
              <div className="border-b border-[#e2ece5] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                    <ImageIcon size={16} />
                  </span>
                  <h3 className="text-xl font-bold text-[#005a40]">বিদ্যালয় ফটো গ্যালারি</h3>
                </div>
                <div className="mt-2 h-1 w-20 rounded-full bg-[#eab308]" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(content.gallery && content.gallery.length > 0 ? content.gallery : [
                  { id: "g1", title: "বিদ্যালয় ভবন ও প্রাঙ্গণ", category: "ক্যাম্পাস", imageUrl: "/images/bgimage.jpg" },
                  { id: "g2", title: "আধুনিক কম্পিউটার ল্যাব", category: "ল্যাব", imageUrl: "/images/bgimage2.jpg" },
                  { id: "g3", title: "প্রাত্যহিক সমাবেশ ও জাতীয় সংগীত", category: "সমাবেশ", imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800" },
                  { id: "g4", title: "বার্ষিক ক্রীড়া প্রতিযোগিতা", category: "ক্রীড়া", imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800" },
                  { id: "g5", title: "বিজ্ঞান মেলা ও উদ্ভাবন", category: "বিজ্ঞান", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800" },
                  { id: "g6", title: "শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস", category: "জাতীয় দিবস", imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" },
                ]).map((photo) => (
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

            {/* 7. CO-CURRICULAR ACTIVITIES (সহশিক্ষা কার্যক্রম) */}
            <section
              id="co-curricular"
              className="rounded-lg border border-[#dde5df] bg-white p-5 shadow-xs sm:p-7"
            >
              <div className="border-b border-[#e2ece5] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006a4e] text-white">
                    <Award size={16} />
                  </span>
                  <h3 className="text-xl font-bold text-[#005a40]">সহশিক্ষা ও ক্লাব কার্যক্রম</h3>
                </div>
                <div className="mt-2 h-1 w-20 rounded-full bg-[#eab308]" />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(content.coCurricular && content.coCurricular.length > 0 ? content.coCurricular : [
                  { title: "বাংলাদেশ স্কাউটস ও গার্ল গাইড", description: "শৃঙ্খলা, সেবা ও দেশপ্রেমের চেতনায় স্কাউট দল নিয়মিত জাতীয় ও স্থানীয় সমাবেশ ও সেবামূলক কাজে অংশগ্রহণ করে।", badge: "স্কাউট দল" },
                  { title: "রেড ক্রিসেন্ট যুব ইউনিট", description: "প্রাথমিক চিকিৎসা, রক্তদান সচেতনতা এবং দুর্যোগ মোকাবেলায় আমাদের যুব রেড ক্রিসেন্ট স্বেচ্ছাসেবকরা তৎপর।", badge: "মানবিক সেবা" },
                  { title: "বিজ্ঞান ও রোবোটিক্স ক্লাব", description: "নিয়মিত বিজ্ঞান অলিম্পিয়াড, গণিত ক্যাম্প এবং রোবোটিক্স ও কোডিং কর্মশালার মাধ্যমে আধুনিক চিন্তার বিকাশ।", badge: "আইসিটি ও বিজ্ঞান" },
                  { title: "বিতর্ক ও সাহিত্য সংসদ", description: "যুক্তিনির্ভর চিন্তাধারা ও বাগ্মীতা চর্চার লক্ষ্যে জাতীয় পর্যায়ের বিতর্ক প্রতিযোগিতায় আমাদের দল কৃতিত্ব প্রদর্শন করে আসছে।", badge: "সাহিত্য ও বিতর্ক" },
                ]).map((club, i) => (
                  <div key={i} className="rounded-md border border-[#e4ede7] bg-[#fcfdfc] p-4">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-[#006a4e]">
                      {club.badge}
                    </span>
                    <h4 className="mt-2 text-sm font-bold text-gray-900">{club.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">{club.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. ADMISSION & ENROLLMENT (ভর্তি তথ্য) */}
            <section
              id="admission"
              className="rounded-lg border-2 border-[#006a4e]/40 bg-gradient-to-br from-[#f2f9f5] to-white p-5 shadow-xs sm:p-7"
            >
              <div className="border-b border-emerald-200 pb-3">
                <span className="rounded bg-[#006a4e] px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  ভর্তি সংক্রান্ত তথ্য
                </span>
                <h3 className="mt-2 text-xl font-bold text-[#005a40]">
                  ২০২৬ শিক্ষাবর্ষে শিক্ষার্থী ভর্তি নীতিমালা ও আবেদন
                </h3>
              </div>

              <div className="mt-4 space-y-3 text-xs leading-relaxed text-gray-800 sm:text-sm">
                <p>
                  গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের শিক্ষা মন্ত্রণালয় ও মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি) কর্তৃক নির্ধারিত নীতিমালা অনুযায়ী সম্পূর্ণ ডিজিটাল অনলাইন প্রক্রিয়ার মাধ্যমে ভর্তি পরিচালিত হয়।
                </p>
                <div className="rounded-md bg-white p-4 border border-emerald-100 shadow-2xs">
                  <h4 className="font-bold text-[#006a4e]">ভর্তি সংক্রান্ত গুরুত্বপূর্ণ নির্দেশিকা:</h4>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-700">
                    <li>আবেদন করতে হবে শিক্ষা মন্ত্রণালয়ের নির্ধারিত কেন্দ্রীয় ওয়েবসাইটে (gsa.teletalk.com.bd)।</li>
                    <li>ডিজিটাল লটারির মাধ্যমে মেধা ও কোটা অনুযায়ী ফলাফল প্রকাশিত হবে।</li>
                    <li>আবেদনের সময় শিক্ষার্থীর ডিজিটাল জন্ম নিবন্ধন সনদপত্র (অনলাইন ভেরিফাইড) প্রয়োজন হবে।</li>
                    <li>যেকোনো প্রয়োজনে বিদ্যালয়ের হেল্পডেস্কে সরাসরি অথবা হটলাইনে যোগাযোগ করুন।</li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href="https://gsa.teletalk.com.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
                  >
                    <span>সরকারি ভর্তি পোর্টাল (GSA)</span>
                    <ExternalLink size={13} />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded border border-[#006a4e] bg-white px-4 py-2 text-xs font-semibold text-[#006a4e] transition hover:bg-emerald-50"
                  >
                    <span>বিদ্যালয় হেল্পডেস্কে যোগাযোগ</span>
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* =========================================================================
              RIGHT COLUMN (32% - 4 Columns): Classic BD Govt Portal Sidebar
              ========================================================================= */}
          <aside className="space-y-6 lg:col-span-4">
            {/* 1. PRINCIPAL PROFILE WIDGET (প্রধান শিক্ষক পরিচিতি) */}
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
                <p className="mt-0.5 text-[10px] text-gray-500">{content.principalQualification || "বি.এস.সি (অনার্স), এম.এস.সি, বি.এড"}</p>
                <div className="mt-3 border-t border-gray-100 pt-2">
                  <a
                    href="#principal"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#006a4e] hover:underline"
                  >
                    <span>সম্পূর্ণ বার্তা পড়ুন</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>

            {/* 2. ASSISTANT PRINCIPAL PROFILE WIDGET */}
            {content.asstPrincipalName && (
              <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
                <div className="bg-[#004d38] px-4 py-2 text-white">
                  <h4 className="text-xs font-bold">{content.asstPrincipalTitle || "সহকারী প্রধান শিক্ষক"}</h4>
                </div>
                <div className="p-3 text-center">
                  <div className="mx-auto h-24 w-20 overflow-hidden rounded border border-emerald-600 bg-gray-100 shadow-2xs">
                    <img
                      src={content.asstPrincipalPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"}
                      alt={content.asstPrincipalName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/avatar.png";
                      }}
                    />
                  </div>
                  <h5 className="mt-1.5 text-xs font-bold text-gray-900">{content.asstPrincipalName}</h5>
                  <p className="text-[10px] text-gray-500">{content.asstPrincipalTitle || "সহকারী প্রধান শিক্ষক"}</p>
                </div>
              </div>
            )}

            {/* 3. NATIONAL EMERGENCY HOTLINES (জাতীয় জরুরি হটলাইনসমূহ) */}
            <div className="overflow-hidden rounded-lg border border-red-200 bg-white shadow-xs">
              <div className="bg-[#da291c] px-4 py-2.5 text-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">জাতীয় জরুরি সেবা হটলাইন</h4>
                  <PhoneCall size={15} />
                </div>
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
                      className="rounded bg-gradient-to-r px-2.5 py-1 text-xs font-extrabold text-white shadow-2xs transition hover:opacity-90"
                      style={{ background: hl.number === "৯৯৯" ? "#da291c" : "#006a4e" }}
                      title={`কল করুন ${hl.number}`}
                    >
                      {hl.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. IMPORTANT BD GOVT LINKS (গুরুত্বপূর্ণ জাতীয় লিঙ্কসমূহ) */}
            <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-white shadow-xs">
              <div className="bg-[#006a4e] px-4 py-2.5 text-white">
                <h4 className="text-sm font-bold">গুরুত্বপূর্ণ সরকারি সেবা ও বাতায়ন</h4>
              </div>
              <div className="divide-y divide-gray-100 p-2 text-xs">
                {(content.quickLinks && content.quickLinks.length > 0 ? content.quickLinks : GOVT_OFFICIAL_LINKS).map((link, i) => (
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

            {/* 5. LIVE DIGITAL CLOCK & BD CALENDAR (ডিজিটাল ঘড়ি ও ক্যালেন্ডার) */}
            <div className="overflow-hidden rounded-lg border border-[#cbe0d3] bg-gradient-to-br from-[#f2f9f5] to-white p-4 shadow-xs text-center">
              <Clock size={22} className="mx-auto text-[#006a4e]" />
              <p className="mt-1 text-lg font-extrabold text-[#004d38] font-mono">{currentTime.timeStr}</p>
              <p className="mt-0.5 text-xs font-semibold text-gray-700">{currentTime.dateStrBn}</p>
              <p className="text-[10px] text-gray-500">{currentTime.dateStrEn}</p>
            </div>

            {/* 6. NATIONAL ANTHEM PLAYER (জাতীয় সংগীত শুনুন) */}
            <div className="overflow-hidden rounded-lg border border-emerald-300 bg-white p-4 shadow-xs text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#006a4e]">
                <Music size={15} />
                <span>আমাদের জাতীয় সংগীত</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-600">আমার সোনার বাংলা, আমি তোমায় ভালোবাসি</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={toggleAnthem}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#006a4e] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
                >
                  {isPlayingAnthem ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isPlayingAnthem ? "বিরতি" : "শুনুন"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnthemModal(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  লিরিক্স
                </button>
              </div>
            </div>

            {/* 7. QUOTE OF THE DAY (আজকের নীতিবাক্য) */}
            <div className="rounded-lg border-l-4 border-[#006a4e] bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#006a4e]">আজকের অনুপ্রেরণা</p>
              <p className="mt-1 font-serif text-xs italic text-gray-800">
                “জ্ঞানই শক্তি, শিক্ষাই আলো। সুশিক্ষিত মানুষই দেশের শ্রেষ্ঠ সম্পদ।”
              </p>
            </div>

            {/* 8. VISITOR COUNTER & FACEBOOK */}
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

        {/* ──────────────────────────────────────────────────────────────────────────
            7. CONTACT & LOCATION SECTION (যোগাযোগ ও অবস্থান)
            ────────────────────────────────────────────────────────────────────────── */}
        <section
          id="contact"
          className="mt-10 overflow-hidden rounded-lg border border-[#cbe0d3] bg-[#004d38] text-white shadow-md"
        >
          <div className="grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="rounded bg-[#eab308] px-2.5 py-1 text-xs font-bold text-gray-950">
                যোগাযোগের ঠিকানা
              </span>
              <h3 className="mt-3 text-2xl font-bold">{primarySchoolName}</h3>
              <p className="mt-1 text-xs text-emerald-200">{activeMotto}</p>

              <div className="mt-6 space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-[#fde047]" />
                  <p className="text-white/90">{content.address || "কলেজ রোড, ধানমন্ডি, ঢাকা-১২০৫, বাংলাদেশ"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={17} className="shrink-0 text-[#fde047]" />
                  <a href={`tel:${content.phone?.replace(/[^\d+]/g, "")}`} className="hover:underline">
                    {content.phone || "+880 2 1234 5678"}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={17} className="shrink-0 text-[#fde047]" />
                  <a href={`mailto:${content.email}`} className="hover:underline">
                    {content.email || "info@mkschool.edu.bd"}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={17} className="shrink-0 text-[#fde047]" />
                  <span>{content.officeHours || "রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৪:০০"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white/10 p-5 backdrop-blur-xs lg:col-span-7">
              <h4 className="text-sm font-bold text-white">জরুরি যোগাযোগ / মতামত ফরম</h4>
              <p className="mt-1 text-xs text-emerald-100">বিদ্যালয় কর্তৃপক্ষের নিকট আপনার মতামত বা প্রশ্ন পাঠান (সরাসরি সুপার অ্যাডমিন ড্যাশবোর্ডে জমা হবে)</p>

              {homeContactSuccess && (
                <div className="mt-3 rounded-md bg-emerald-500/30 border border-emerald-400 p-3 text-xs font-bold text-white flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                  <span>আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে এবং অ্যাডমিন ড্যাশবোর্ডে সংরক্ষিত হয়েছে। ধন্যবাদ!</span>
                </div>
              )}

              {homeContactError && (
                <div className="mt-3 rounded-md bg-red-500/30 border border-red-400 p-3 text-xs font-bold text-white flex items-center gap-2 animate-in fade-in">
                  <span>{homeContactError}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!homeContactForm.name.trim() || !homeContactForm.phone.trim() || !homeContactForm.message.trim()) return;
                  setIsHomeContactSending(true);
                  setHomeContactError("");
                  try {
                    const res = await submitContactInquiry({
                      name: homeContactForm.name,
                      phone: homeContactForm.phone,
                      email: homeContactForm.email,
                      subject: "ওয়েবসাইট হোমপেজ যোগাযোগ",
                      message: homeContactForm.message,
                    });
                    if (res.success) {
                      setHomeContactSuccess(true);
                      setHomeContactForm({ name: "", phone: "", email: "", message: "" });
                      setTimeout(() => setHomeContactSuccess(false), 7000);
                    } else {
                      setHomeContactError(res.message || "বার্তা পাঠাতে সমস্যা হয়েছে।");
                    }
                  } catch (err: any) {
                    setHomeContactError(err?.message || "সার্ভার সংযোগ সমস্যা।");
                  } finally {
                    setIsHomeContactSending(false);
                  }
                }}
                className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <input
                  type="text"
                  placeholder="আপনার নাম *"
                  required
                  value={homeContactForm.name}
                  onChange={(e) => setHomeContactForm((p) => ({ ...p, name: e.target.value }))}
                  className="rounded border border-white/20 bg-white/20 px-3 py-2 text-xs text-white placeholder:text-white/60 outline-none focus:bg-white/30"
                />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর *"
                  required
                  value={homeContactForm.phone}
                  onChange={(e) => setHomeContactForm((p) => ({ ...p, phone: e.target.value }))}
                  className="rounded border border-white/20 bg-white/20 px-3 py-2 text-xs text-white placeholder:text-white/60 outline-none focus:bg-white/30"
                />
                <input
                  type="email"
                  placeholder="ইমেইল (ঐচ্ছিক)"
                  value={homeContactForm.email}
                  onChange={(e) => setHomeContactForm((p) => ({ ...p, email: e.target.value }))}
                  className="rounded border border-white/20 bg-white/20 px-3 py-2 text-xs text-white placeholder:text-white/60 outline-none focus:bg-white/30 sm:col-span-2"
                />
                <textarea
                  rows={3}
                  placeholder="আপনার বার্তা বা প্রশ্ন..."
                  required
                  value={homeContactForm.message}
                  onChange={(e) => setHomeContactForm((p) => ({ ...p, message: e.target.value }))}
                  className="rounded border border-white/20 bg-white/20 px-3 py-2 text-xs text-white placeholder:text-white/60 outline-none focus:bg-white/30 sm:col-span-2"
                />
                <button
                  type="submit"
                  disabled={isHomeContactSending}
                  className="inline-flex items-center justify-center gap-2 rounded bg-[#eab308] px-5 py-2 text-xs font-bold text-gray-950 transition hover:bg-[#fde047] sm:col-span-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isHomeContactSending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>বার্তা পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>বার্তা পাঠান</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ──────────────────────────────────────────────────────────────────────────
          8. BANGLADESH GOVT PORTAL STANDARD FOOTER (জাতীয় পোর্টাল ফুটার)
          ────────────────────────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t-4 border-[#006a4e] bg-[#0c2a21] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Col 1: Identity */}
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src={siteLogo || "/images/logo.png"}
                  alt="School Logo"
                  className="h-10 w-10 rounded-full border border-emerald-700 bg-white p-0.5 object-contain shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo.png";
                  }}
                />
                <div>
                  <h4 className="text-sm font-bold">{primarySchoolName}</h4>
                  <p className="text-[10px] text-emerald-300">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                {activeMotto}. সুশৃঙ্খল পাঠদান ও মেধা বিকাশের নির্ভরযোগ্য সরকারি বিদ্যাপীঠ।
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-200">
                <span>EIIN: {content.eiin}</span>
                <span>·</span>
                <span>কোড: {content.schoolCode}</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                দ্রুত লিঙ্ক
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-white/85">
                <li><a href="#about" className="hover:text-amber-300">বিদ্যালয় পরিচিতি</a></li>
                <li><a href="#notices" className="hover:text-amber-300">নোটিশ বোর্ড</a></li>
                <li><a href="#downloads" className="hover:text-amber-300">ক্লাস রুটিন ও সিলেবাস</a></li>
                <li><a href="#admission" className="hover:text-amber-300">ভর্তি নীতিমালা</a></li>
                <li><button type="button" onClick={() => setShowCharterModal(true)} className="hover:text-amber-300">সিটিজেন চার্টার</button></li>
              </ul>
            </div>

            {/* Col 3: Govt Links */}
            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                সরকারি বাতায়ন
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-white/85">
                <li><a href="https://moedu.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">শিক্ষা মন্ত্রণালয়</a></li>
                <li><a href="https://dshe.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">মাউশি অধিদপ্তর</a></li>
                <li><a href="https://bangladesh.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">বাংলাদেশ জাতীয় পোর্টাল</a></li>
                <li><a href="https://teachers.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">শিক্ষক বাতায়ন</a></li>
                <li><a href="https://nctb.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">এনসিটিবি (NCTB)</a></li>
              </ul>
            </div>

            {/* Col 4: Management & Emergency */}
            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                ম্যানেজমেন্ট ও হটলাইন
              </h4>
              <p className="mt-3 text-xs text-white/80">জরুরি সেবা: ৯৯৯, ৩৩৩, ১০৯</p>
              <div className="mt-4">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 rounded bg-[#eab308] px-4 py-2 text-xs font-bold text-gray-950 transition hover:bg-[#fde047]"
                >
                  <Users size={14} />
                  <span>সুপার অ্যাডমিন লগইন</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright & Planning Credentials */}
          <div className="mt-10 border-t border-emerald-900/80 pt-5 text-center text-xs text-white/70">
            <p>
              পরিকল্পনা ও বাস্তবায়নে: <span className="font-semibold text-white">{primarySchoolName} কর্তৃপক্ষ</span> · কারিগরি তত্ত্বাবধানে: মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি)
            </p>
            <p className="mt-1.5 text-[11px] text-white/50">
              © {new Date().getFullYear()} {content.schoolName}. সর্বস্বত্ব সংরক্ষিত · গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত বাতায়ন
            </p>
          </div>
        </div>
      </footer>

      {/* ──────────────────────────────────────────────────────────────────────────
          9. MODALS & POPUPS
          ────────────────────────────────────────────────────────────────────────── */}

      {/* A. NOTICE VIEWER MODAL */}
      {selectedNotice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-2xl rounded-lg border border-emerald-700 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-[#006a4e] p-4 text-white">
              <div className="flex items-center gap-2">
                <BdGovEmblem size={24} />
                <div>
                  <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-gray-950">
                    {selectedNotice.category || "নোটিশ"}
                  </span>
                  <h3 className="mt-0.5 text-sm font-bold sm:text-base">সরকারি নোটিশ পত্র</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="rounded p-1 text-white hover:bg-white/20"
                aria-label="বন্ধ করুন"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500">তারিখ: {selectedNotice.date || "২০২৬-১০-১৫"}</p>
                <h4 className="mt-1 text-lg font-bold text-gray-900">{selectedNotice.title}</h4>
              </div>

              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-800">
                {selectedNotice.content ||
                  "উক্ত বিষয়ের প্রেক্ষিতে সকল শিক্ষক, শিক্ষার্থী ও অভিভাবকদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, নোটিশটি যথাযথভাবে অনুসরণ করার নির্দেশ প্রদান করা হলো। বিস্তারিত তথ্যের জন্য বিদ্যালয় কার্যালয়ে যোগাযোগ করুন।"}
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
                          <span>সংযুক্ত নোটিশ পত্র (ছবি):</span>
                        </span>
                        <a
                          href={selectedNotice.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006a4e] hover:underline"
                        >
                          <Download size={12} />
                          <span>ডাউনলোড করুন</span>
                        </a>
                      </div>
                      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                        <img
                          src={selectedNotice.fileUrl}
                          alt={selectedNotice.title}
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
                              অফিসিয়াল নোটিশ পত্র (PDF ডকুমেন্ট)
                            </p>
                            <p className="text-[11px] text-gray-600">
                              মূল নোটিশের অফিসিয়াল পিডিএফ ফাইলটি দেখতে বা ডাউনলোড করতে নিচের বাটনে চাপ দিন
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
                          <span>পিডিএফ দেখুন ও ডাউনলোড</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-800">
                        <ExternalLink size={14} className="text-blue-600 shrink-0" />
                        <span>সংযুক্ত ফাইল বা ওয়েব লিঙ্ক</span>
                      </div>
                      <a
                        href={selectedNotice.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Download size={13} />
                        <span>ফাইল খুলুন</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs">
                <div>
                  <p className="font-semibold text-gray-800">আদেশক্রমে,</p>
                  <p className="font-bold text-[#006a4e]">{content.principalName || "প্রধান শিক্ষক"}</p>
                  <p className="text-[11px] text-gray-500">{content.schoolNameBn || content.schoolName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <span>প্রিন্ট করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(null)}
                    className="rounded bg-[#006a4e] px-4 py-1.5 font-bold text-white hover:bg-[#00503a]"
                  >
                    ঠিক আছে
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. PHOTO GALLERY LIGHTBOX MODAL */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-lg bg-black"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black"
              aria-label="বন্ধ করুন"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage.imageUrl}
              alt={previewImage.title}
              className="max-h-[80vh] w-auto object-contain"
            />
            <div className="p-3 text-white">
              <span className="rounded bg-[#006a4e] px-2 py-0.5 text-xs font-bold">{previewImage.category}</span>
              <p className="mt-1 text-sm font-semibold">{previewImage.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* C. CITIZEN CHARTER MODAL (সিটিজেন চার্টার) */}
      {showCharterModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-emerald-700 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-[#006a4e]" />
                <h3 className="text-lg font-bold text-[#006a4e]">নাগরিক সেবা সনদ (সিটিজেন চার্টার)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCharterModal(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs leading-relaxed text-gray-800">
              <div className="rounded bg-emerald-50 p-3">
                <p className="font-bold text-[#006a4e]">সেবা প্রদানের অঙ্গীকার:</p>
                <p className="mt-1">
                  বিদ্যালয় সকল শিক্ষার্থী, অভিভাবক ও সেবাগ্রহীতাকে তথ্য অধিকার আইন ও সরকারি নীতিমালা অনুযায়ী সর্বোচ্চ নিষ্ঠা ও দ্রুততার সাথে সেবা দিতে প্রতিশ্রুতিবদ্ধ।
                </p>
              </div>

              <table className="w-full border-collapse border border-gray-200 text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold text-gray-900">
                    <th className="border p-2">সেবার নাম</th>
                    <th className="border p-2">প্রয়োজনীয় সময়</th>
                    <th className="border p-2">দায়িত্বপ্রাপ্ত কর্মকর্তা</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">প্রশংসাপত্র ও প্রত্যয়নপত্র প্রদান</td>
                    <td className="border p-2">১-২ কর্মদিবস</td>
                    <td className="border p-2">প্রধান শিক্ষক / প্রধান সহকারী</td>
                  </tr>
                  <tr>
                    <td className="border p-2">স্থানান্তর সনদ (টিসি) প্রদান</td>
                    <td className="border p-2">৩ কর্মদিবস</td>
                    <td className="border p-2">প্রধান শিক্ষক</td>
                  </tr>
                  <tr>
                    <td className="border p-2">ভর্তি সংক্রান্ত সেবা</td>
                    <td className="border p-2">সরকারি সময়সূচী অনুযায়ী</td>
                    <td className="border p-2">ভর্তি কমিটি</td>
                  </tr>
                  <tr>
                    <td className="border p-2">নম্বরপত্র / ফলাফল সংক্রান্ত অনুসন্ধান</td>
                    <td className="border p-2">১ কর্মদিবস</td>
                    <td className="border p-2">পরীক্ষা নিয়ন্ত্রক শিক্ষক</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowCharterModal(false)}
                className="rounded bg-[#006a4e] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#00503a]"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. NATIONAL ANTHEM LYRICS MODAL */}
      {showAnthemModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg rounded-lg border border-emerald-700 bg-white p-6 shadow-2xl text-center">
            <button
              type="button"
              onClick={() => setShowAnthemModal(false)}
              className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <BdGovEmblem size={48} className="mx-auto" />
            <h3 className="mt-2 text-lg font-bold text-[#006a4e]">আমাদের জাতীয় সংগীত</h3>
            <p className="text-xs text-gray-500">রচিয়তা: বিশ্বকবি রবীন্দ্রনাথ ঠাকুর</p>

            <div className="my-4 rounded-lg bg-emerald-50/70 p-4 font-serif text-sm leading-relaxed text-gray-800">
              <p>আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।</p>
              <p>চিরদিন তোমার আকাশ, তোমার বাতাস, আমার প্রাণে বাজায় বাঁশি॥</p>
              <p className="mt-2">ও মা, ফাগুনে তোর আমের বনে ঘ্রাণে পাগল করে,</p>
              <p>মরি হায়, হায় রে—</p>
              <p>ও মা, অঘ্রানে তোর ভরা ক্ষেতে আমি কী দেখেছি মধুর হাসি॥</p>
              <p className="mt-2">কী শোভা, কী ছায়া গো, কী স্নেহ, কী মায়া গো—</p>
              <p>কী আঁচল বিছায়েছ বটের মূলে, নদীর কূলে কূলে।</p>
              <p className="mt-2">মা, তোর মুখের বাণী আমার কানে লাগে সুধার মতো,</p>
              <p>মরি হায়, হায় রে—</p>
              <p>মা, তোর বদনখানি মলিন হলে, ও মা, আমি নয়নজলে ভাসি॥</p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleAnthem}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#006a4e] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#00503a]"
              >
                {isPlayingAnthem ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlayingAnthem ? "সংগীত বন্ধ করুন" : "সংগীত বাজান"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAnthemModal(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSchoolWebsite;
