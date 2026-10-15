import React, { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Languages,
  Mail,
  MapPin,
  Menu,
  Music,
  Pause,
  Phone,
  PhoneCall,
  Play,
  Shield,
  Users,
  X,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { BdGovEmblem, SmartBdBadge } from "@/components/government/GovtEmblem";
import type { SchoolNotice } from "@/types/site";

export const PublicWebsiteLayout: React.FC = () => {
  const { websiteContent: content, siteLogo } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);
  const [showCharterModal, setShowCharterModal] = useState<boolean>(false);
  const [showAnthemModal, setShowAnthemModal] = useState<boolean>(false);
  const [isPlayingAnthem, setIsPlayingAnthem] = useState<boolean>(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const location = useLocation();

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
      audioRef.play().catch(() => {});
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
    { label: "মুজিব কর্নার", enLabel: "Mujib Corner", path: "/mujib-corner" },
    { label: "ফটো গ্যালারি", enLabel: "Gallery", path: "/gallery" },
    { label: "সহশিক্ষা", enLabel: "Co-curricular", path: "/co-curricular" },
    { label: "যোগাযোগ", enLabel: "Contact", path: "/contact" },
  ];

  const primarySchoolName = lang === "bn" ? content.schoolNameBn || content.schoolName : content.schoolName || content.schoolNameBn;
  const secondarySchoolName = lang === "bn" ? content.schoolName : content.schoolNameBn;
  const activeMotto = lang === "bn" ? content.mottoBn || content.motto : content.motto || content.mottoBn;

  return (
    <div className="min-h-screen bg-[#f3f6f4] font-['Hind_Siliguri','Inter',sans-serif] text-[#1c2c24] antialiased selection:bg-[#006a4e] selection:text-white flex flex-col justify-between">
      <div>
        {/* ─── 1. TOP GOVERNMENT STRIP ─── */}
        <div className="border-b border-[#0a4634] bg-[#004d38] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[11px] sm:px-6 sm:text-xs">
            <div className="flex items-center gap-2">
              <BdGovEmblem size={22} className="h-5 w-5 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-emerald-200">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</span>
                <span className="hidden text-white/40 md:inline">|</span>
                <span className="hidden text-white/90 md:inline">মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর · শিক্ষা মন্ত্রণালয়</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden items-center gap-1.5 text-white/80 lg:flex">
                <Calendar size={13} className="text-amber-400" />
                {currentTime.dateStrBn || "আজকের তারিখ"}
              </span>

              <button
                type="button"
                onClick={() => setShowAnthemModal(true)}
                className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium transition hover:bg-white/20"
                title="জাতীয় সংগীত শুনুন ও লিরিক্স দেখুন"
              >
                <Music size={12} className="text-amber-300" />
                <span className="hidden sm:inline">জাতীয় সংগীত</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCharterModal(true)}
                className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium transition hover:bg-white/20"
              >
                <Shield size={12} className="text-amber-300" />
                <span className="hidden sm:inline">সিটিজেন চার্টার</span>
              </button>

              <button
                type="button"
                onClick={() => setLang(lang === "bn" ? "en" : "bn")}
                className="inline-flex items-center gap-1 rounded border border-white/20 px-2 py-0.5 font-semibold transition hover:bg-white/15"
                title="ভাষা পরিবর্তন"
              >
                <Languages size={12} />
                {lang === "bn" ? "English" : "বাংলা"}
              </button>

              <Link
                to="/sign-in"
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#eab308] px-3 py-1 font-bold text-gray-950 shadow-xs transition hover:bg-[#fde047] hover:shadow-md"
              >
                <Users size={13} />
                <span>পোর্টাল লগইন</span>
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
                  src={siteLogo || "/images/logo.png"}
                  alt="School Monogram"
                  className="h-16 w-16 rounded-full border-2 border-[#006a4e] bg-white p-1 shadow-md object-contain transition group-hover:scale-105 sm:h-20 sm:w-20"
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo.png";
                  }}
                />
                <div className="absolute -bottom-1 -right-1 rounded-full border border-white bg-[#006a4e] p-0.5 shadow-xs">
                  <BdGovEmblem size={16} />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#005a40] sm:text-3xl lg:text-4xl transition group-hover:text-[#00422f]">
                  {primarySchoolName}
                </h1>
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
                    কোড: {content.schoolCode || "1001"}
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
                    `relative px-3 py-3 text-xs md:text-sm font-semibold transition ${
                      isActive
                        ? "bg-[#004e39] text-[#fef08a] border-b-2 border-[#fef08a]"
                        : "hover:bg-[#00523d] hover:text-[#fef08a]"
                    }`
                  }
                >
                  {lang === "bn" ? item.label : item.enLabel}
                </NavLink>
              ))}
            </div>

            <div className="flex w-full items-center justify-between py-2 sm:w-auto sm:py-0">
              <span className="text-xs font-semibold text-emerald-200 sm:hidden">এম. কে. সরকারি স্কুল বাতায়ন</span>
              <Link
                to="/sign-in"
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#eab308] px-3.5 py-1.5 text-xs font-bold text-gray-950 shadow-xs transition hover:bg-[#fde047]"
              >
                <GraduationCap size={15} />
                <span>পোর্টাল</span>
                <ArrowUpRight size={13} />
              </Link>
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
                      `rounded-md px-3 py-2 text-xs font-semibold transition ${
                        isActive ? "bg-[#eab308] text-gray-950 font-bold" : "border border-white/10 bg-white/5 text-white hover:bg-white/15"
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
                  <span>সুপার অ্যাডমিন ও শিক্ষক লগইন</span>
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
              <span>জরুরি নোটিশ:</span>
            </div>

            <div className="relative mx-3 flex-1 overflow-hidden whitespace-nowrap text-xs font-semibold text-gray-800 sm:text-sm">
              <div className="inline-block animate-marquee hover:[animation-play-state:paused]">
                <span className="mx-4 text-[#006a4e]">
                  ★ {content.breakingNews || "২০২৬ শিক্ষাবর্ষে ৬ষ্ঠ থেকে ৯ম শ্রেণিতে ভর্তি আবেদন চলমান রয়েছে · সকল শিক্ষক ও শিক্ষার্থীদের সময়মতো উপস্থিতির নির্দেশ দেওয়া হলো।"}
                </span>
                {content.notices?.[0] && (
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(content.notices[0])}
                    className="mx-4 underline decoration-[#006a4e] underline-offset-2 hover:text-[#006a4e]"
                  >
                    ★ {content.notices[0].title}
                  </button>
                )}
              </div>
            </div>

            <Link
              to="/notices"
              className="hidden shrink-0 text-xs font-bold text-[#006a4e] hover:underline sm:inline-flex sm:items-center sm:gap-1"
            >
              <span>সকল নোটিশ</span>
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
                <BdGovEmblem size={28} />
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

            <div>
              <h4 className="border-b border-emerald-800 pb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                ওয়েবসাইট পেজসমূহ
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-white/85">
                <li><Link to="/about" className="hover:text-amber-300">আমাদের পরিচিতি</Link></li>
                <li><Link to="/administration" className="hover:text-amber-300">প্রশাসন ও বাণী</Link></li>
                <li><Link to="/teachers-list" className="hover:text-amber-300">শিক্ষকমণ্ডলী তালিকা</Link></li>
                <li><Link to="/notices" className="hover:text-amber-300">নোটিশ বোর্ড</Link></li>
                <li><Link to="/academics" className="hover:text-amber-300">ক্লাস রুটিন ও সিলেবাস</Link></li>
                <li><Link to="/admission" className="hover:text-amber-300">ভর্তি নীতিমালা</Link></li>
              </ul>
            </div>

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

            <div className="p-6">
              <div className="border-b border-gray-100 pb-3">
                <p className="text-xs text-gray-500">তারিখ: {selectedNotice.date || "২০২৬-১০-১৫"}</p>
                <h4 className="mt-1 text-lg font-bold text-gray-900">{selectedNotice.title}</h4>
              </div>

              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-800">
                {selectedNotice.content ||
                  "উক্ত বিষয়ের প্রেক্ষিতে সকল শিক্ষক, শিক্ষার্থী ও অভিভাবকদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, নোটিশটি যথাযথভাবে অনুসরণ করার নির্দেশ প্রদান করা হলো। বিস্তারিত তথ্যের জন্য বিদ্যালয় কার্যালয়ে যোগাযোগ করুন।"}
              </div>

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

export default PublicWebsiteLayout;
