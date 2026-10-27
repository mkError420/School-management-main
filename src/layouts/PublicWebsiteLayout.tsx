import React, { useState, useEffect, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  Languages,
  Mail,
  MapPin,
  Menu,
  Music,
  Pause,
  Phone,
  PhoneCall,
  Play,
  Printer,
  Shield,
  Users,
  X,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useSiteSettings, resolveLogoUrl } from "@/context/SiteSettingsContext";
import { api } from "@/lib/api";
import type { SchoolNotice } from "@/types/site";
import { SmartBdBadge } from "@/components/government/GovtEmblem";

export const PublicWebsiteLayout: React.FC = () => {
  const { websiteContent: content, siteLogo, lang, toggleLang, t, formatDigits } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [showCharterModal, setShowCharterModal] = useState<boolean>(false);
  const [showAnthemModal, setShowAnthemModal] = useState<boolean>(false);
  const [isPlayingAnthem, setIsPlayingAnthem] = useState<boolean>(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [liveNotices, setLiveNotices] = useState<SchoolNotice[]>([]);
  const location = useLocation();

  // Helper to normalize announcement category
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

  // Fetch live announcements for notice ticker
  useEffect(() => {
    let active = true;
    const fetchLiveNotices = async () => {
      try {
        const res = await api.getAll("announcements", { page: 1, limit: 10 });
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
          setLiveNotices(mapped);
        }
      } catch {}
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

  // Ensure public website is always in light mode and immune to dashboard dark mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, [location.pathname]);

  // Close mobile drawer on route change & scroll to top
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Real-time live date & time
  const [currentTime, setCurrentTime] = useState({
    timeStr: "",
    dateStrBn: "",
    dateStrEn: "",
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStrBn = now.toLocaleDateString("bn-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const dateStrEn = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setCurrentTime({ timeStr, dateStrBn, dateStrEn });
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // National Anthem Audio setup
  useEffect(() => {
    const audio = new Audio("https://upload.wikimedia.org/wikipedia/commons/7/77/Amar_Shonar_Bangla_instrumental.ogg");
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

  const navLinks = [
    { label: "প্রচ্ছদ", enLabel: "Home", path: "/" },
    { label: "আমাদের কথা", enLabel: "About", path: "/about" },
    { label: "প্রশাসন ও বাণী", enLabel: "Administration", path: "/administration" },
    { label: "শিক্ষকমণ্ডলী", enLabel: "Teachers", path: "/teachers-list" },
    { label: "নোটিশ বোর্ড", enLabel: "Notices", path: "/notices" },
    { label: "একাডেমিক ও রুটিন", enLabel: "Academics", path: "/academics" },
    { label: "ভর্তি তথ্য", enLabel: "Admission", path: "/admission" },
    { label: "স্টাডি কর্নার", enLabel: "Study Corner", path: "/study-corner" },
    { label: "ফটো গ্যালারি", enLabel: "Gallery", path: "/gallery" },
    { label: "সহশিক্ষা", enLabel: "Co-curricular", path: "/co-curricular" },
    { label: "যোগাযোগ", enLabel: "Contact", path: "/contact" },
  ];

  const primarySchoolName = lang === "bn" ? content.schoolNameBn || content.schoolName : content.schoolName || content.schoolNameBn;
  const secondarySchoolName = lang === "bn" ? content.schoolName : content.schoolNameBn;
  const activeMotto = lang === "bn" ? content.mottoBn || content.motto : content.motto || content.mottoBn;

  // Build the ticker items list once (memoized) for the seamless circular scroll
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
      notice?: SchoolNotice;
    }> = [];

    // 1. Dynamic custom ticker items (if configured)
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

    // 2. Breaking News text (if configured)
    if (content.breakingNews && content.breakingNews.trim() !== "") {
      items.push({
        id: "__breaking__",
        type: "breaking",
        text: content.breakingNews,
        textEn: content.breakingNewsEn,
      });
    }

    // 3. Notices (if tickerIncludeNotices is enabled, default true)
    if (content.tickerIncludeNotices !== false) {
      liveNotices.slice(0, 5).forEach((n, i) => {
        items.push({
          id: `notice_${n.id ?? i}`,
          type: "notice",
          notice: n,
        });
      });
    }

    // 4. Default fallback
    if (items.length === 0) {
      items.push({ id: "__default__", type: "default" });
    }

    return items;
  }, [content.tickerItems, content.breakingNews, liveNotices, content.tickerIncludeNotices]);

  // Duration scales with speed setting and number of items
  const tickerDuration = useMemo(() => {
    const basePerItem = content.tickerSpeed === "fast" ? 5 : content.tickerSpeed === "slow" ? 11 : 8;
    const minDuration = content.tickerSpeed === "fast" ? 20 : content.tickerSpeed === "slow" ? 48 : 32;
    return `${Math.max(minDuration, tickerItems.length * basePerItem)}s`;
  }, [content.tickerSpeed, tickerItems.length]);

  return (
    <div className="public-website-root min-h-screen bg-[#f3f6f4] font-sans text-[#1c2c24] antialiased selection:bg-[#006a4e] selection:text-white flex flex-col justify-between">
      <div>
        {/* ─── 1. TOP GOVERNMENT STRIP ─── */}
        <div className="border-b border-[#0a4634] bg-[#004d38] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[11px] sm:px-6 sm:text-xs">
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-emerald-200">
                  {lang === "bn" ? "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" : "Government of the People's Republic of Bangladesh"}
                </span>
                <span className="hidden text-white/40 md:inline">|</span>
                <span className="hidden text-white/90 md:inline">
                  {lang === "bn"
                    ? "মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর · শিক্ষা মন্ত্রণালয়"
                    : "Directorate of Secondary & Higher Education · Ministry of Education"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden items-center gap-1.5 text-white/80 lg:flex">
                <Calendar size={13} className="text-amber-400" />
                {lang === "bn" ? (currentTime.dateStrBn || "আজকের তারিখ") : (currentTime.dateStrEn || "Today's Date")}
              </span>

              <button
                type="button"
                onClick={() => setShowAnthemModal(true)}
                className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium transition hover:bg-white/20"
                title={lang === "bn" ? "জাতীয় সংগীত শুনুন ও লিরিক্স দেখুন" : "Play National Anthem & View Lyrics"}
              >
                <Music size={12} className="text-amber-300" />
                <span className="hidden sm:inline">{lang === "bn" ? "জাতীয় সংগীত" : "Anthem"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCharterModal(true)}
                className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium transition hover:bg-white/20"
              >
                <Shield size={12} className="text-amber-300" />
                <span className="hidden sm:inline">{lang === "bn" ? "সিটিজেন চার্টার" : "Citizen Charter"}</span>
              </button>

              <button
                type="button"
                onClick={toggleLang}
                className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/10 px-2.5 py-0.5 font-bold transition hover:bg-white/20 text-[#fef08a]"
                title="ভাষা পরিবর্তন / Switch Language"
              >
                <Languages size={13} />
                <span>{lang === "bn" ? "English" : "বাংলা"}</span>
              </button>

              <Link
                to="/sign-in"
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#eab308] px-3 py-1 font-bold text-gray-950 shadow-xs transition hover:bg-[#fde047] hover:shadow-md"
              >
                <Users size={13} />
                <span>{lang === "bn" ? "ইউজার লগইন" : "User Login"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── 2. MAIN SCHOOL BRANDING & HEADER ─── */}
        <header className="border-b border-[#dde5df] bg-gradient-to-r from-white via-[#fafdff] to-[#f4f8f5] shadow-xs">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3.5 text-center sm:text-left group">
              <div className="relative shrink-0">
                <img
                  src={resolveLogoUrl(siteLogo) || "/images/logo.png"}
                  alt={primarySchoolName || "School Monogram"}
                  className="h-16 w-16 rounded-full border-2 border-[#006a4e] bg-white p-1 shadow-md object-contain transition group-hover:scale-105 sm:h-20 sm:w-20"
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo.png";
                  }}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#005a40] sm:text-3xl lg:text-4xl transition group-hover:text-[#00422f]">
                  {primarySchoolName}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#3d5a4c] sm:text-sm">
                  {secondarySchoolName}
                </p>
                <p className="mt-0.5 hidden text-xs font-medium text-[#006a4e] sm:block">
                  {t(content.boardName, content.boardNameEn) || "মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড"} · {lang === "bn" ? "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" : "Government of Bangladesh"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-gray-700 sm:justify-start">
                  <span className="rounded bg-emerald-100/90 px-2 py-0.5 text-[#005a40]">
                    {lang === "bn" ? "স্থাপিত:" : "Est:"} {formatDigits(content.establishedYear || "1985")}
                  </span>
                  <span className="rounded bg-emerald-100/90 px-2 py-0.5 text-[#005a40]">
                    EIIN: {content.eiin || "123456"}
                  </span>
                  <span className="rounded bg-emerald-100/90 px-2 py-0.5 text-[#005a40]">
                    {lang === "bn" ? "কোড:" : "Code:"} {content.schoolCode || "1001"}
                  </span>
                </div>
              </div>
            </Link>

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

        {/* ─── 3. GOVERNMENT TEMPLATE NAVIGATION BAR ─── */}
        <nav className="sticky top-0 z-30 border-t-2 border-[#eab308] bg-[#006a4e] text-white shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
            <div className="hidden flex-wrap items-center sm:flex">
              {navLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `relative px-3 py-3 text-xs md:text-sm font-semibold transition ${isActive
                      ? "bg-[#004e39] text-[#fef08a] border-b-2 border-[#fef08a]"
                      : "hover:bg-[#00523d] hover:text-[#fef08a]"
                    }`
                  }
                >
                  {lang === "bn" ? item.label : item.enLabel}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="border-t border-emerald-800 bg-[#005a40] px-4 py-3 sm:hidden">
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-md px-3 py-2 text-xs font-semibold transition ${isActive ? "bg-[#eab308] text-gray-950 font-bold" : "border border-white/10 bg-white/5 text-white hover:bg-white/15"
                      }`
                    }
                  >
                    {lang === "bn" ? item.label : item.enLabel}
                  </NavLink>
                ))}
              </div>
              <div className="mt-3 border-t border-emerald-800/80 pt-2 text-center">
                <Link
                  to="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#eab308] py-2 text-xs font-bold text-gray-950"
                >
                  <span>{lang === "bn" ? "সুপার অ্যাডমিন ও শিক্ষক লগইন" : "Admin & Teacher Login"}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* ─── 4. BREAKING TICKER ─── */}
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
                        <span className="text-amber-500 font-bold">▪️</span>
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

            <Link
              to="/notices"
              className="hidden shrink-0 text-xs font-bold text-[#006a4e] hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              <span>{lang === "bn" ? "সকল নোটিশ" : "All Notices"}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ─── 5. PAGE OUTLET ─── */}
        <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* ─── 6. BANGLADESH GOVT STANDARD FOOTER ─── */}
      <footer className="mt-12 border-t-4 border-[#006a4e] bg-[#0c2a21] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src={resolveLogoUrl(siteLogo) || "/images/logo.png"}
                  alt={primarySchoolName || "School Logo"}
                  className="h-10 w-10 rounded-full border border-emerald-700 bg-white p-0.5 object-contain shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo.png";
                  }}
                />
                <div>
                  <h4 className="text-sm font-bold">{primarySchoolName}</h4>
                  <p className="text-[10px] text-emerald-300">
                    {lang === "bn" ? "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার" : "Government of Bangladesh"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/80">
                {activeMotto}. {lang === "bn" ? "সুশৃঙ্খল পাঠদান ও মেধা বিকাশের নির্ভরযোগ্য সরকারি বিদ্যাপীঠ।" : "A reliable government institution committed to disciplined learning and excellence."}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-200">
                <span>EIIN: {content.eiin}</span>
                <span>·</span>
                <span>{lang === "bn" ? "কোড:" : "Code:"} {content.schoolCode}</span>
              </div>
            </div>

            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                {lang === "bn" ? "ওয়েবসাইট পেজসমূহ" : "Website Pages"}
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-white/85">
                <li><Link to="/about" className="hover:text-amber-300">{lang === "bn" ? "আমাদের পরিচিতি" : "About Us"}</Link></li>
                <li><Link to="/administration" className="hover:text-amber-300">{lang === "bn" ? "প্রশাসন ও বাণী" : "Administration"}</Link></li>
                <li><Link to="/teachers-list" className="hover:text-amber-300">{lang === "bn" ? "শিক্ষকমণ্ডলী তালিকা" : "Teachers List"}</Link></li>
                <li><Link to="/notices" className="hover:text-amber-300">{lang === "bn" ? "নোটিশ বোর্ড" : "Notice Board"}</Link></li>
                <li><Link to="/academics" className="hover:text-amber-300">{lang === "bn" ? "ক্লাস রুটিন ও সিলেবাস" : "Routine & Syllabus"}</Link></li>
                <li><Link to="/admission" className="hover:text-amber-300">{lang === "bn" ? "ভর্তি নীতিমালা" : "Admission Info"}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                {lang === "bn" ? "সরকারি বাতায়ন" : "Govt Portals"}
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-white/85">
                <li><a href="https://moedu.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">{lang === "bn" ? "শিক্ষা মন্ত্রণালয়" : "Ministry of Education"}</a></li>
                <li><a href="https://dshe.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">{lang === "bn" ? "মাউশি অধিদপ্তর" : "DSHE Directorate"}</a></li>
                <li><a href="https://bangladesh.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">{lang === "bn" ? "বাংলাদেশ জাতীয় পোর্টাল" : "Bangladesh National Portal"}</a></li>
                <li><a href="https://teachers.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">{lang === "bn" ? "শিক্ষক বাতায়ন" : "Teachers Portal"}</a></li>
                <li><a href="https://nctb.gov.bd" target="_blank" rel="noreferrer" className="hover:text-amber-300">NCTB</a></li>
              </ul>
            </div>

            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                {lang === "bn" ? "ম্যানেজমেন্ট ও হটলাইন" : "Management & Helpline"}
              </h4>
              <p className="mt-3 text-xs text-white/80">{lang === "bn" ? "জরুরি সেবা: ৯৯৯, ৩৩৩, ১০৯" : "Emergency Services: 999, 333, 109"}</p>
              <div className="mt-4">
                <Link
                  to="/sign-in"
                  className="inline-flex items-center gap-2 rounded bg-[#eab308] px-4 py-2 text-xs font-bold text-gray-950 transition hover:bg-[#fde047]"
                >
                  <Users size={14} />
                  <span>{lang === "bn" ? "সুপার অ্যাডমিন লগইন" : "Admin Login"}</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-emerald-900/80 pt-5 text-center text-xs text-white/70">
            <p>
              {lang === "bn" ? "পরিকল্পনা ও বাস্তবায়নে:" : "Planned & Managed by:"} <span className="font-semibold text-white">{primarySchoolName}</span> · {lang === "bn" ? "কারিগরি তত্ত্বাবধানে: মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর (মাউশি)" : "Technical Supervision: Directorate of Secondary & Higher Education (DSHE)"}
            </p>
            <p className="mt-1.5 text-[11px] text-white/50">
              © {new Date().getFullYear()} {content.schoolName}. {lang === "bn" ? "সর্বস্বত্ব সংরক্ষিত · গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত বাতায়ন" : "All rights reserved · Government of Bangladesh Approved Portal"}
            </p>
          </div>
        </div>
      </footer>

      {/* ─── 7. SHARED MODALS ─── */}
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
                {lang === "en"
                  ? (selectedNotice.contentEn || selectedNotice.content || "For details, please contact the school office.")
                  : (selectedNotice.content || "উক্ত বিষয়ের প্রেক্ষিতে সকল শিক্ষক, শিক্ষার্থী ও অভিভাবকদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, নোটিশটি যথাযথভাবে অনুসরণ করার নির্দেশ প্রদান করা হলো। বিস্তারিত তথ্যের জন্য বিদ্যালয় কার্যালয়ে যোগাযোগ করুন।")}
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
                          <span>{lang === "bn" ? "সংযুক্ত নোটিশ পত্র (ছবি):" : "Attached Notice (Image):"}</span>
                        </span>
                        <a
                          href={selectedNotice.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006a4e] hover:underline"
                        >
                          <Download size={12} />
                          <span>{lang === "bn" ? "ডাউনলোড করুন" : "Download"}</span>
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
                              {lang === "bn" ? "অফিসিয়াল নোটিশ পত্র (PDF ডকুমেন্ট)" : "Official Notice (PDF Document)"}
                            </p>
                            <p className="text-[11px] text-gray-600">
                              {lang === "bn" ? "মূল নোটিশের অফিসিয়াল পিডিএফ ফাইলটি দেখতে বা ডাউনলোড করতে নিচের বাটনে চাপ দিন" : "Click the button below to view or download the official PDF notice."}
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
                          <span>{lang === "bn" ? "পিডিএফ দেখুন ও ডাউনলোড" : "View & Download PDF"}</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-800">
                        <ExternalLink size={14} className="text-blue-600 shrink-0" />
                        <span>{lang === "bn" ? "সংযুক্ত ফাইল বা ওয়েব লিঙ্ক" : "Attached File or Web Link"}</span>
                      </div>
                      <a
                        href={selectedNotice.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Download size={13} />
                        <span>{lang === "bn" ? "ফাইল খুলুন" : "Open File"}</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs">
                <div>
                  <p className="font-semibold text-gray-800">{lang === "bn" ? "আদেশক্রমে," : "By Order,"}</p>
                  <p className="font-bold text-[#006a4e]">{lang === "bn" ? (content.principalName || "প্রধান শিক্ষক") : (content.principalNameEn || content.principalName || "Headmaster")}</p>
                  <p className="text-[11px] text-gray-500">{lang === "bn" ? (content.schoolNameBn || content.schoolName) : (content.schoolName || content.schoolNameBn)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <span>{lang === "bn" ? "প্রিন্ট করুন" : "Print"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(null)}
                    className="rounded bg-[#006a4e] px-4 py-1.5 font-bold text-white hover:bg-[#00503a]"
                  >
                    {lang === "bn" ? "ঠিক আছে" : "OK"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h3 className="text-lg font-bold text-[#006a4e]">{lang === "bn" ? "নাগরিক সেবা সনদ (সিটিজেন চার্টার)" : "Citizen Service Charter"}</h3>
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
                <p className="font-bold text-[#006a4e]">{lang === "bn" ? "সেবা প্রদানের অঙ্গীকার:" : "Service Delivery Commitment:"}</p>
                <p className="mt-1">
                  {lang === "bn"
                    ? "বিদ্যালয় সকল শিক্ষার্থী, অভিভাবক ও সেবাগ্রহীতাকে তথ্য অধিকার আইন ও সরকারি নীতিমালা অনুযায়ী সর্বোচ্চ নিষ্ঠা ও দ্রুততার সাথে সেবা দিতে প্রতিশ্রুতিবদ্ধ।"
                    : "The school is committed to providing all students, guardians, and service recipients with the highest level of dedication and promptness as per the Right to Information Act and government guidelines."}
                </p>
              </div>

              <table className="w-full border-collapse border border-gray-200 text-left">
                <thead>
                  <tr className="bg-gray-100 font-bold text-gray-900">
                    <th className="border p-2">{lang === "bn" ? "সেবার নাম" : "Service Name"}</th>
                    <th className="border p-2">{lang === "bn" ? "প্রয়োজনীয় সময়" : "Duration"}</th>
                    <th className="border p-2">{lang === "bn" ? "দায়িত্বপ্রাপ্ত কর্মকর্তা" : "Responsible Officer"}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">{lang === "bn" ? "প্রশংসাপত্র ও প্রত্যয়নপত্র প্রদান" : "Testimonial & Character Certificate"}</td>
                    <td className="border p-2">{lang === "bn" ? "১-২ কর্মদিবস" : "1-2 Working Days"}</td>
                    <td className="border p-2">{lang === "bn" ? "প্রধান শিক্ষক / প্রধান সহকারী" : "Headmaster / Head Assistant"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2">{lang === "bn" ? "স্থানান্তর সনদ (টিসি) প্রদান" : "Transfer Certificate (TC) Issuance"}</td>
                    <td className="border p-2">{lang === "bn" ? "৩ কর্মদিবস" : "3 Working Days"}</td>
                    <td className="border p-2">{lang === "bn" ? "প্রধান শিক্ষক" : "Headmaster"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2">{lang === "bn" ? "ভর্তি সংক্রান্ত সেবা" : "Admission-Related Services"}</td>
                    <td className="border p-2">{lang === "bn" ? "সরকারি সময়সূচী অনুযায়ী" : "As per Govt. Schedule"}</td>
                    <td className="border p-2">{lang === "bn" ? "ভর্তি কমিটি" : "Admission Committee"}</td>
                  </tr>
                  <tr>
                    <td className="border p-2">{lang === "bn" ? "নম্বরপত্র / ফলাফল সংক্রান্ত অনুসন্ধান" : "Marksheet / Result Inquiry"}</td>
                    <td className="border p-2">{lang === "bn" ? "১ কর্মদিবস" : "1 Working Day"}</td>
                    <td className="border p-2">{lang === "bn" ? "পরীক্ষা নিয়ন্ত্রক শিক্ষক" : "Examination Controller Teacher"}</td>
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
                {lang === "bn" ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h3 className="mt-2 text-lg font-bold text-[#006a4e]">{lang === "bn" ? "আমাদের জাতীয় সংগীত" : "Our National Anthem"}</h3>
            <p className="text-xs text-gray-500">{lang === "bn" ? "রচিয়তা: বিশ্বকবি রবীন্দ্রনাথ ঠাকুর" : "Composed by: Rabindranath Tagore"}</p>

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
                <span>{isPlayingAnthem ? (lang === "bn" ? "সংগীত বন্ধ করুন" : "Stop Anthem") : (lang === "bn" ? "সংগীত বাজান" : "Play Anthem")}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAnthemModal(false)}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {lang === "bn" ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicWebsiteLayout;
