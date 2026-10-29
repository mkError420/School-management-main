import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DEFAULT_WEBSITE_CONTENT } from "@/types/site";
import type { SchoolWebsiteContent, ContactSubmission } from "@/types/site";
import { toEnglishDigits, toBengaliDigits, translateBnToEn, translateEnToBn } from "@/lib/translation";

export const CURRENCY_OPTIONS = [
  { symbol: "৳", label: "Bangladeshi Taka (৳)" },
  { symbol: "$", label: "US Dollar ($)" },
  { symbol: "€", label: "Euro (€)" },
  { symbol: "£", label: "British Pound (£)" },
  { symbol: "₹", label: "Indian Rupee (₹)" },
  { symbol: "¥", label: "Japanese Yen (¥)" },
  { symbol: "₩", label: "South Korean Won (₩)" },
  { symbol: "﷼", label: "Saudi Riyal (﷼)" },
  { symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { symbol: "Rp", label: "Indonesian Rupiah (Rp)" },
  { symbol: "RM", label: "Malaysian Ringgit (RM)" },
  { symbol: "₺", label: "Turkish Lira (₺)" },
  { symbol: "Fr", label: "Swiss Franc (Fr)" },
  { symbol: "R", label: "South African Rand (R)" },
];

const CURRENCY_STORAGE_KEY = "school_currency_symbol";
const LOGO_STORAGE_KEY = "school_site_logo";
const LANG_STORAGE_KEY = "school_site_lang";
const COUNTS_STORAGE_KEY = "school_site_live_counts";
const VISITOR_STORAGE_KEY = "school_site_visitor_stats";
const VISITOR_ID_STORAGE_KEY = "school_visitor_id";
const VISITOR_SESSION_RECORDED_KEY = "school_visitor_recorded_today";
export const DEFAULT_SITE_LOGO = "/images/logo.png";

export interface LiveDashboardCounts {
  students: number;
  teachers: number;
  staff: number;
  classes?: number;
}

export interface LiveVisitorStats {
  today: number;
  total: number;
  online?: number;
}

const DEFAULT_VISITOR_STATS: LiveVisitorStats = {
  today: 1,
  total: 1,
  online: 1,
};

interface SiteSettingsContextValue {
  siteName: string;
  siteLogo: string;
  siteLogoUrl: string;
  websiteContent: SchoolWebsiteContent;
  currencySymbol: string;
  isLoading: boolean;
  lang: "bn" | "en";
  liveCounts: LiveDashboardCounts | null;
  visitorStats: LiveVisitorStats;
  setLang: (lang: "bn" | "en") => void;
  toggleLang: () => void;
  t: (bnText?: string, enText?: string) => string;
  formatDigits: (val: string | number) => string;
  saveSiteName: (siteName: string) => Promise<{ success: boolean; message?: string }>;
  saveWebsiteContent: (content: SchoolWebsiteContent) => Promise<{ success: boolean; message?: string }>;
  submitContactInquiry: (data: { name: string; phone: string; email?: string; subject: string; message: string }) => Promise<{ success: boolean; message?: string }>;
  saveCurrencySymbol: (symbol: string) => void;
  saveSiteLogo: (fileOrUrl: File | string) => Promise<{ success: boolean; message?: string; logoUrl?: string }>;
  resetSiteLogo: () => Promise<{ success: boolean; message?: string }>;
  refreshSettings: () => Promise<void>;
  refreshLiveCounts: () => Promise<void>;
  refreshVisitorStats: () => Promise<void>;
}

export const resolveLogoUrl = (logo?: string | null): string => {
  if (!logo || !logo.trim()) return DEFAULT_SITE_LOGO;
  const trimmed = logo.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  siteName: "ACADEMIA",
  siteLogo: DEFAULT_SITE_LOGO,
  siteLogoUrl: DEFAULT_SITE_LOGO,
  websiteContent: DEFAULT_WEBSITE_CONTENT,
  currencySymbol: "৳",
  isLoading: false,
  lang: "bn",
  liveCounts: null,
  visitorStats: DEFAULT_VISITOR_STATS,
  setLang: () => {},
  toggleLang: () => {},
  t: (bnText?: string, enText?: string) => bnText || enText || "",
  formatDigits: (val: string | number) => String(val ?? ""),
  saveSiteName: async () => ({ success: false, message: "Site settings are unavailable." }),
  saveWebsiteContent: async () => ({ success: false, message: "Site settings are unavailable." }),
  submitContactInquiry: async () => ({ success: false, message: "Site settings are unavailable." }),
  saveCurrencySymbol: () => {},
  saveSiteLogo: async () => ({ success: false, message: "Site settings are unavailable." }),
  resetSiteLogo: async () => ({ success: false, message: "Site settings are unavailable." }),
  refreshSettings: async () => {},
  refreshLiveCounts: async () => {},
  refreshVisitorStats: async () => {},
});

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
};

const CONTENT_STORAGE_KEY = "school_website_content";

export const isCorruptedText = (val: unknown): boolean => {
  if (typeof val !== "string") return false;
  const str = val.trim();
  if (!str) return false;
  // Classic MySQL latin1 encoding artifact is 3 or more consecutive question marks
  if (/\?{3,}/.test(str)) return true;
  const qMatches = str.match(/\?/g);
  if (!qMatches || qMatches.length < 4) return false;
  const letters = str.replace(/[\s\d.,\-·–/\\:;!@#$%^&*()_+={}\[\]|`~'"]/g, "");
  if (letters.length === 0) return true;
  return qMatches.length / letters.length >= 0.6;
};

const cleanStr = (incomingVal: any, defaultVal: string): string => {
  if (typeof incomingVal !== "string") return defaultVal;
  if (isCorruptedText(incomingVal)) {
    return defaultVal;
  }
  return incomingVal;
};

export const hasAnyCorruption = (incoming?: Partial<SchoolWebsiteContent> | null): boolean => {
  if (!incoming) return false;
  for (const val of Object.values(incoming)) {
    if (typeof val === "string" && isCorruptedText(val)) return true;
  }
  return false;
};

const normalizeContent = (incoming?: Partial<SchoolWebsiteContent> | null): SchoolWebsiteContent => {
  if (!incoming) return DEFAULT_WEBSITE_CONTENT;
  const anyInc = incoming as any;

  // Preserve user scalar string fields, only falling back to default if field is undefined or null
  const sanitizedStrings: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_WEBSITE_CONTENT) as (keyof SchoolWebsiteContent)[]) {
    const defVal = (DEFAULT_WEBSITE_CONTENT as any)[key];
    const incVal = (incoming as any)[key];
    if (typeof defVal === "string") {
      if (incVal !== undefined && incVal !== null) {
        if (typeof incVal === "string" && isCorruptedText(incVal)) {
          sanitizedStrings[key] = defVal;
        } else {
          sanitizedStrings[key] = String(incVal);
        }
      } else {
        sanitizedStrings[key] = defVal;
      }
    }
  }

  // Handle studyCorner / legacy migrations
  const studyCornerTitle =
    incoming.studyCornerTitle !== undefined
      ? incoming.studyCornerTitle
      : anyInc.mujibCornerTitle !== undefined
      ? anyInc.mujibCornerTitle
      : DEFAULT_WEBSITE_CONTENT.studyCornerTitle;

  const studyCornerQuote =
    incoming.studyCornerQuote !== undefined
      ? incoming.studyCornerQuote
      : anyInc.mujibCornerQuote !== undefined
      ? anyInc.mujibCornerQuote
      : DEFAULT_WEBSITE_CONTENT.studyCornerQuote;

  const studyCornerText =
    incoming.studyCornerText !== undefined
      ? incoming.studyCornerText
      : anyInc.mujibCornerText !== undefined
      ? anyInc.mujibCornerText
      : DEFAULT_WEBSITE_CONTENT.studyCornerText;

  const studyCornerImage =
    incoming.studyCornerImage !== undefined
      ? incoming.studyCornerImage
      : anyInc.mujibCornerImage !== undefined
      ? anyInc.mujibCornerImage
      : DEFAULT_WEBSITE_CONTENT.studyCornerImage;

  const cleanList = <T,>(list: T[] | undefined, defaultList: T[]): T[] => {
    if (list === undefined || list === null) return defaultList;
    return Array.isArray(list) ? list : defaultList;
  };

  return {
    ...DEFAULT_WEBSITE_CONTENT,
    ...incoming,
    ...(sanitizedStrings as any),
    studyCornerTitle,
    studyCornerQuote,
    studyCornerText,
    studyCornerImage,
    studyCornerDays: incoming.studyCornerDays !== undefined ? incoming.studyCornerDays : (DEFAULT_WEBSITE_CONTENT.studyCornerDays || "সোমবার - শনিবার"),
    studyCornerDaysEn: incoming.studyCornerDaysEn !== undefined ? incoming.studyCornerDaysEn : (DEFAULT_WEBSITE_CONTENT.studyCornerDaysEn || "Monday - Saturday"),
    studyCornerHours: incoming.studyCornerHours !== undefined ? incoming.studyCornerHours : (DEFAULT_WEBSITE_CONTENT.studyCornerHours || "সকাল ৮:০০ - বিকাল ৪:০০"),
    studyCornerHoursEn: incoming.studyCornerHoursEn !== undefined ? incoming.studyCornerHoursEn : (DEFAULT_WEBSITE_CONTENT.studyCornerHoursEn || "8:00 AM - 4:00 PM"),
    studyCornerFee: incoming.studyCornerFee !== undefined ? incoming.studyCornerFee : (DEFAULT_WEBSITE_CONTENT.studyCornerFee || "বিনামূল্যে প্রবেশ"),
    studyCornerFeeEn: incoming.studyCornerFeeEn !== undefined ? incoming.studyCornerFeeEn : (DEFAULT_WEBSITE_CONTENT.studyCornerFeeEn || "Free Admission"),
    notices: cleanList(incoming.notices, DEFAULT_WEBSITE_CONTENT.notices),
    quickLinks: cleanList(incoming.quickLinks, DEFAULT_WEBSITE_CONTENT.quickLinks),
    downloads: cleanList(incoming.downloads, DEFAULT_WEBSITE_CONTENT.downloads),
    gallery: cleanList(incoming.gallery, DEFAULT_WEBSITE_CONTENT.gallery),
    coCurricular: cleanList(incoming.coCurricular, DEFAULT_WEBSITE_CONTENT.coCurricular),
    teachers: cleanList(incoming.teachers, DEFAULT_WEBSITE_CONTENT.teachers),
    dynamicStaffDirectory: incoming.dynamicStaffDirectory !== undefined ? Boolean(incoming.dynamicStaffDirectory) : true,
    studyCornerBooks: cleanList(incoming.studyCornerBooks, DEFAULT_WEBSITE_CONTENT.studyCornerBooks),
    studyCornerResources: cleanList(incoming.studyCornerResources, DEFAULT_WEBSITE_CONTENT.studyCornerResources),
    studyCornerLinks: cleanList(incoming.studyCornerLinks, DEFAULT_WEBSITE_CONTENT.studyCornerLinks || []),
    studyCornerTips: cleanList(incoming.studyCornerTips, DEFAULT_WEBSITE_CONTENT.studyCornerTips || []),
    studyCornerStats: cleanList(incoming.studyCornerStats, DEFAULT_WEBSITE_CONTENT.studyCornerStats || []),
    tickerItems: cleanList(incoming.tickerItems, DEFAULT_WEBSITE_CONTENT.tickerItems || []),
    tickerSpeed: incoming.tickerSpeed || DEFAULT_WEBSITE_CONTENT.tickerSpeed || "normal",
    tickerIncludeNotices: incoming.tickerIncludeNotices !== undefined ? incoming.tickerIncludeNotices : true,
    tickerLabel: incoming.tickerLabel !== undefined ? incoming.tickerLabel : (DEFAULT_WEBSITE_CONTENT.tickerLabel || "জরুরি নোটিশ:"),
    tickerLabelEn: incoming.tickerLabelEn !== undefined ? incoming.tickerLabelEn : (DEFAULT_WEBSITE_CONTENT.tickerLabelEn || "Urgent Notice:"),
    codeOfConductTitle: cleanStr(incoming.codeOfConductTitle, DEFAULT_WEBSITE_CONTENT.codeOfConductTitle || "শিক্ষার্থীদের আচরণবিধি ও পোশাক নীতিমালা"),
    codeOfConductTitleEn: cleanStr(incoming.codeOfConductTitleEn, DEFAULT_WEBSITE_CONTENT.codeOfConductTitleEn || "Student Code of Conduct & Dress Code"),
    codeOfConductSubtitle: incoming.codeOfConductSubtitle !== undefined ? cleanStr(incoming.codeOfConductSubtitle, "") : (DEFAULT_WEBSITE_CONTENT.codeOfConductSubtitle || ""),
    codeOfConductSubtitleEn: incoming.codeOfConductSubtitleEn !== undefined ? cleanStr(incoming.codeOfConductSubtitleEn, "") : (DEFAULT_WEBSITE_CONTENT.codeOfConductSubtitleEn || ""),
    codeOfConductRules: cleanList(incoming.codeOfConductRules, DEFAULT_WEBSITE_CONTENT.codeOfConductRules || []),
    contactSubmissions: cleanList(incoming.contactSubmissions, DEFAULT_WEBSITE_CONTENT.contactSubmissions || []),
    admissionSeatMatrix: cleanList(incoming.admissionSeatMatrix, DEFAULT_WEBSITE_CONTENT.admissionSeatMatrix || []),
    admissionFormPdfUrl: incoming.admissionFormPdfUrl !== undefined ? cleanStr(incoming.admissionFormPdfUrl, DEFAULT_WEBSITE_CONTENT.admissionFormPdfUrl || "") : (DEFAULT_WEBSITE_CONTENT.admissionFormPdfUrl || ""),
    heroImages: cleanList(
      incoming.heroImages && incoming.heroImages.length > 0
        ? incoming.heroImages
        : incoming.heroImage
        ? [incoming.heroImage]
        : undefined,
      DEFAULT_WEBSITE_CONTENT.heroImages || ["/images/bgimage.jpg"]
    ),
    heroOverlayOpacity: (incoming.heroOverlayOpacity as any) || DEFAULT_WEBSITE_CONTENT.heroOverlayOpacity || "light",
    heroCarouselSpeed: typeof incoming.heroCarouselSpeed === "number" ? incoming.heroCarouselSpeed : (DEFAULT_WEBSITE_CONTENT.heroCarouselSpeed || 5000),
    headerBgImage: incoming.headerBgImage !== undefined ? cleanStr(incoming.headerBgImage, "") : (DEFAULT_WEBSITE_CONTENT.headerBgImage || ""),
    headerBgOverlay: (incoming.headerBgOverlay as any) || DEFAULT_WEBSITE_CONTENT.headerBgOverlay || "light",
    loginBgImage: incoming.loginBgImage !== undefined ? cleanStr(incoming.loginBgImage, "/images/bgimage2.jpg") : (DEFAULT_WEBSITE_CONTENT.loginBgImage || "/images/bgimage2.jpg"),
  };
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteName, setSiteName] = useState("ACADEMIA");
  const [websiteContent, setWebsiteContent] = useState<SchoolWebsiteContent>(() => {
    try {
      const cached = localStorage.getItem(CONTENT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = normalizeContent(parsed);
        if (hasAnyCorruption(parsed)) {
          try {
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
        }
        return merged;
      }
    } catch {}
    return DEFAULT_WEBSITE_CONTENT;
  });
  const [siteLogo, setSiteLogo] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(LOGO_STORAGE_KEY);
      return cached ? resolveLogoUrl(cached) : DEFAULT_SITE_LOGO;
    } catch {
      return DEFAULT_SITE_LOGO;
    }
  });
  const [lang, setLangState] = useState<"bn" | "en">(() => {
    try {
      const cached = localStorage.getItem(LANG_STORAGE_KEY);
      return cached === "en" ? "en" : "bn";
    } catch {
      return "bn";
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState<string>(() => {
    try {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || "৳";
    } catch {
      return "৳";
    }
  });
  const [liveCounts, setLiveCounts] = useState<LiveDashboardCounts | null>(() => {
    try {
      const cached = localStorage.getItem(COUNTS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.students === "number") {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [visitorStats, setVisitorStats] = useState<LiveVisitorStats>(() => {
    try {
      const cached = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed?.today === "number" && typeof parsed?.total === "number") {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_VISITOR_STATS;
  });

  const getOrGenerateVisitorId = (): string => {
    try {
      let id = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
      if (!id) {
        id = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
      }
      return id;
    } catch {
      return `v_${Date.now().toString(36)}`;
    }
  };

  const refreshVisitorStats = async () => {
    try {
      const res = await api.getVisitorStats();
      if (res.success && res.data) {
        const nextStats: LiveVisitorStats = {
          today: Number(res.data.today ?? 0),
          total: Number(res.data.total ?? 0),
          online: Number(res.data.online ?? 1),
        };
        setVisitorStats(nextStats);
        try {
          localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(nextStats));
        } catch {}
      }
    } catch {}
  };

  const setLang = (nextLang: "bn" | "en") => {
    setLangState(nextLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, nextLang);
      window.dispatchEvent(new CustomEvent("school-site-lang-changed", { detail: { lang: nextLang } }));
    } catch {}
  };

  const toggleLang = () => {
    setLang(lang === "bn" ? "en" : "bn");
  };

  const t = (bnText?: string, enText?: string): string => {
    if (lang === "en") {
      if (enText && enText.trim()) return enText;
      if (bnText && bnText.trim()) return translateBnToEn(bnText);
      return "";
    }
    if (bnText && bnText.trim()) return bnText;
    if (enText && enText.trim()) return translateEnToBn(enText);
    return "";
  };

  const formatDigits = (val: string | number): string => {
    const str = String(val ?? "");
    return lang === "en" ? toEnglishDigits(str) : toBengaliDigits(str);
  };

  const refreshLiveCounts = async () => {
    try {
      const res = await api.getPublicStats();
      if (res.success && res.data?.counts) {
        const c: LiveDashboardCounts = {
          students: Number(res.data.counts.students ?? 0),
          teachers: Number(res.data.counts.teachers ?? 0),
          staff: Number(res.data.counts.staff ?? 0),
          classes: Number(res.data.counts.classes ?? 0),
        };
        setLiveCounts(c);
        try {
          localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(c));
        } catch {}
      }
      if (res.success && res.data?.visitors) {
        const vs: LiveVisitorStats = {
          today: Number(res.data.visitors.today ?? 0),
          total: Number(res.data.visitors.total ?? 0),
          online: Number(res.data.visitors.online ?? 1),
        };
        setVisitorStats(vs);
        try {
          localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(vs));
        } catch {}
      }
    } catch {
      // transient network error
    }
  };

  const refreshSettings = async () => {
    try {
      const response = await api.getSiteSettings();
      if (response.success && response.data) {
        if (response.data.site_name) {
          setSiteName(response.data.site_name);
        }
        if (response.data.site_logo) {
          const resolved = resolveLogoUrl(response.data.site_logo);
          setSiteLogo(resolved);
          try {
            localStorage.setItem(LOGO_STORAGE_KEY, resolved);
          } catch {}
        }
        if (response.data.live_counts) {
          const c: LiveDashboardCounts = {
            students: Number(response.data.live_counts.students ?? 0),
            teachers: Number(response.data.live_counts.teachers ?? 0),
            staff: Number(response.data.live_counts.staff ?? 0),
            classes: Number(response.data.live_counts.classes ?? 0),
          };
          setLiveCounts(c);
          try {
            localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(c));
          } catch {}
        }
        if (response.data.visitor_counts) {
          const vs: LiveVisitorStats = {
            today: Number(response.data.visitor_counts.today ?? 0),
            total: Number(response.data.visitor_counts.total ?? 0),
            online: Number(response.data.visitor_counts.online ?? 1),
          };
          setVisitorStats(vs);
          try {
            localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(vs));
          } catch {}
        }
        if (response.data.website_content) {
          const wasCorrupted = hasAnyCorruption(response.data.website_content);
          const merged = normalizeContent(response.data.website_content);
          setWebsiteContent(merged);
          try {
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          if (wasCorrupted) {
            api.updateWebsiteContent(merged).catch(() => {});
          }
        }
      }
    } catch {
      // transient network error
    }
  };

  useEffect(() => {
    let active = true;
    api.getSiteSettings().then((response) => {
      if (!active || !response.success || !response.data) return;
      if (response.data.site_name) {
        setSiteName(response.data.site_name);
      }
      if (response.data.site_logo) {
        const resolved = resolveLogoUrl(response.data.site_logo);
        setSiteLogo(resolved);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, resolved);
        } catch {
          // ignore storage errors
        }
      }
      if (response.data.live_counts) {
        const c: LiveDashboardCounts = {
          students: Number(response.data.live_counts.students ?? 0),
          teachers: Number(response.data.live_counts.teachers ?? 0),
          staff: Number(response.data.live_counts.staff ?? 0),
          classes: Number(response.data.live_counts.classes ?? 0),
        };
        setLiveCounts(c);
        try {
          localStorage.setItem(COUNTS_STORAGE_KEY, JSON.stringify(c));
        } catch {}
      } else {
        refreshLiveCounts().catch(() => {});
      }
      if (response.data.visitor_counts) {
        const vs: LiveVisitorStats = {
          today: Number(response.data.visitor_counts.today ?? 0),
          total: Number(response.data.visitor_counts.total ?? 0),
          online: Number(response.data.visitor_counts.online ?? 1),
        };
        setVisitorStats(vs);
        try {
          localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(vs));
        } catch {}
      }
      if (response.data.website_content) {
        const wasCorrupted = hasAnyCorruption(response.data.website_content);
        const merged = normalizeContent(response.data.website_content);
        setWebsiteContent(merged);
        try {
          localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        if (wasCorrupted) {
          api.updateWebsiteContent(merged).catch(() => {});
        }
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    // Record visitor session & setup live auto-refresh
    const visitorId = getOrGenerateVisitorId();
    const todayDateKey = new Date().toISOString().slice(0, 10);
    const sessionRecorded = sessionStorage.getItem(`${VISITOR_SESSION_RECORDED_KEY}_${todayDateKey}`);

    const recordAndFetchVisitor = async () => {
      try {
        if (!sessionRecorded) {
          const res = await api.recordVisitor(visitorId);
          if (active && res.success && res.data) {
            const nextStats: LiveVisitorStats = {
              today: Number(res.data.today ?? 0),
              total: Number(res.data.total ?? 0),
              online: Number(res.data.online ?? 1),
            };
            setVisitorStats(nextStats);
            try {
              localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(nextStats));
              sessionStorage.setItem(`${VISITOR_SESSION_RECORDED_KEY}_${todayDateKey}`, "1");
            } catch {}
            return;
          }
        }
      } catch {}

      try {
        const statsRes = await api.getVisitorStats();
        if (active && statsRes.success && statsRes.data) {
          const nextStats: LiveVisitorStats = {
            today: Number(statsRes.data.today ?? 0),
            total: Number(statsRes.data.total ?? 0),
            online: Number(statsRes.data.online ?? 1),
          };
          setVisitorStats(nextStats);
          try {
            localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(nextStats));
          } catch {}
        } else if (!sessionRecorded) {
          // Offline / fallback optimistic increment for new session
          setVisitorStats((prev) => {
            const updated = { ...prev, today: prev.today + 1, total: prev.total + 1 };
            try {
              localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(updated));
              sessionStorage.setItem(`${VISITOR_SESSION_RECORDED_KEY}_${todayDateKey}`, "1");
            } catch {}
            return updated;
          });
        }
      } catch {}
    };

    recordAndFetchVisitor();

    // Live refresh every 45 seconds when window is active
    const visitorPollInterval = window.setInterval(() => {
      if (active && document.visibilityState === "visible") {
        refreshVisitorStats().catch(() => {});
      }
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshVisitorStats().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleSync = () => {
      try {
        const cachedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
        if (cachedLogo) {
          setSiteLogo(resolveLogoUrl(cachedLogo));
        }
        const cachedLang = localStorage.getItem(LANG_STORAGE_KEY);
        if (cachedLang === "bn" || cachedLang === "en") {
          setLangState(cachedLang);
        }
        const cachedCounts = localStorage.getItem(COUNTS_STORAGE_KEY);
        if (cachedCounts) {
          const parsed = JSON.parse(cachedCounts);
          if (parsed && typeof parsed.students === "number") {
            setLiveCounts(parsed);
          }
        }
      } catch {}
    };

    const handleLiveCounts = (e: Event) => {
      const custom = e as CustomEvent<LiveDashboardCounts>;
      if (custom.detail) {
        setLiveCounts(custom.detail);
      }
    };

    window.addEventListener("school-site-settings-updated", handleSync);
    window.addEventListener("school-site-lang-changed", handleSync);
    window.addEventListener("school-live-counts-updated", handleLiveCounts);
    window.addEventListener("storage", handleSync);

    return () => {
      active = false;
      clearInterval(visitorPollInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("school-site-settings-updated", handleSync);
      window.removeEventListener("school-site-lang-changed", handleSync);
      window.removeEventListener("school-live-counts-updated", handleLiveCounts);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const broadcastUpdate = (logoUrl?: string) => {
    try {
      window.dispatchEvent(new CustomEvent("school-site-settings-updated", { detail: { siteLogo: logoUrl } }));
    } catch {}
  };

  const saveSiteName = async (nextName: string) => {
    const response = await api.updateSiteName(nextName.trim());
    if (!response.success || !response.data?.site_name) {
      return { success: false, message: response.message || "Unable to update the site name." };
    }
    setSiteName(response.data.site_name);
    broadcastUpdate();
    return { success: true };
  };

  const saveWebsiteContent = async (content: SchoolWebsiteContent): Promise<{ success: boolean; message?: string }> => {
    // 1. Optimistic local update
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    } catch {}
    setWebsiteContent(content);
    broadcastUpdate();

    // 2. Persist to MySQL Backend API
    try {
      const response = await api.updateWebsiteContent(content);
      if (response.success) {
        if (response.data?.website_content) {
          const normalized = normalizeContent(response.data.website_content);
          setWebsiteContent(normalized);
          try {
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(normalized));
          } catch {}
        }
        if ((response.data as any)?.site_name) {
          setSiteName((response.data as any).site_name);
        }
        return { success: true, message: "ওয়েবসাইট কনটেন্ট ডাটাবেজে সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে।" };
      } else {
        return { success: false, message: response.message || "সার্ভার ডাটাবেজে সংরক্ষণ করা যায়নি।" };
      }
    } catch (err: any) {
      return {
        success: false,
        message: "সার্ভারে যোগাযোগ ব্যর্থ হয়েছে: " + (err?.message || "নেটওয়ার্ক সমস্যা") + "। অনুগ্রহ করে ব্যাকএন্ড সংযোগ চেক করুন।",
      };
    }
  };

  const saveSiteLogo = async (fileOrUrl: File | string): Promise<{ success: boolean; message?: string; logoUrl?: string }> => {
    try {
      if (fileOrUrl instanceof File) {
        const response = await api.uploadSiteLogo(fileOrUrl);
        if (response.success && response.data?.site_logo) {
          const newLogo = resolveLogoUrl(response.data.site_logo);
          setSiteLogo(newLogo);
          try {
            localStorage.setItem(LOGO_STORAGE_KEY, newLogo);
          } catch {}
          broadcastUpdate(newLogo);
          return { success: true, logoUrl: newLogo };
        }

        const dataUrl = await fileToDataUrl(fileOrUrl);
        setSiteLogo(dataUrl);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
        } catch {}
        api.updateSiteLogo(dataUrl).catch(() => {});
        broadcastUpdate(dataUrl);
        return {
          success: true,
          logoUrl: dataUrl,
          message: response.message ? `Logo saved locally (${response.message})` : undefined,
        };
      } else {
        const logoStr = resolveLogoUrl(fileOrUrl.trim() || DEFAULT_SITE_LOGO);
        setSiteLogo(logoStr);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, logoStr);
        } catch {}
        const response = await api.updateSiteLogo(logoStr);
        if (response.success && response.data?.site_logo) {
          const resolved = resolveLogoUrl(response.data.site_logo);
          setSiteLogo(resolved);
        }
        broadcastUpdate(logoStr);
        return { success: true, logoUrl: logoStr };
      }
    } catch (err: any) {
      if (fileOrUrl instanceof File) {
        try {
          const dataUrl = await fileToDataUrl(fileOrUrl);
          setSiteLogo(dataUrl);
          try {
            localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
          } catch {}
          broadcastUpdate(dataUrl);
          return { success: true, logoUrl: dataUrl };
        } catch {}
      }
      return { success: false, message: err?.message || "Failed to save logo." };
    }
  };

  const resetSiteLogo = async (): Promise<{ success: boolean; message?: string }> => {
    setSiteLogo(DEFAULT_SITE_LOGO);
    try {
      localStorage.setItem(LOGO_STORAGE_KEY, DEFAULT_SITE_LOGO);
    } catch {}
    try {
      await api.updateSiteLogo(DEFAULT_SITE_LOGO);
    } catch {}
    broadcastUpdate(DEFAULT_SITE_LOGO);
    return { success: true };
  };

  const submitContactInquiry = async (data: {
    name: string;
    phone: string;
    email?: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.submitContactForm(data);
      if (res.success) {
        if (res.data?.website_content) {
          const merged = normalizeContent(res.data.website_content);
          setWebsiteContent(merged);
          try {
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          broadcastUpdate();
        } else {
          const newSubmission: ContactSubmission = res.data?.submission || {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email?.trim() || undefined,
            subject: data.subject.trim(),
            message: data.message.trim(),
            createdAt: new Date().toISOString(),
            status: "unread",
          };
          const currentSubmissions = Array.isArray(websiteContent.contactSubmissions) ? websiteContent.contactSubmissions : [];
          const updatedSubmissions = [newSubmission, ...currentSubmissions.filter((s) => s.id !== newSubmission.id)];
          const updatedContent: SchoolWebsiteContent = {
            ...websiteContent,
            contactSubmissions: updatedSubmissions,
          };
          setWebsiteContent(updatedContent);
          try {
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(updatedContent));
          } catch {}
          broadcastUpdate();
        }

        return {
          success: true,
          message: res.message || "আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে এবং অ্যাডমিন ড্যাশবোর্ডে সংরক্ষিত হয়েছে।",
        };
      }

      return {
        success: false,
        message: res.message || "বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      };
    } catch (err: any) {
      console.error("submitContactInquiry error:", err);
      return {
        success: false,
        message: err?.message || "সার্ভার সংযোগ সমস্যা। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      };
    }
  };

  const saveCurrencySymbol = (symbol: string) => {
    setCurrencySymbol(symbol);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, symbol);
    } catch {}
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        siteName,
        siteLogo,
        siteLogoUrl: siteLogo,
        websiteContent,
        currencySymbol,
        isLoading,
        lang,
        liveCounts,
        visitorStats,
        setLang,
        toggleLang,
        t,
        formatDigits,
        saveSiteName,
        saveWebsiteContent,
        submitContactInquiry,
        saveCurrencySymbol,
        saveSiteLogo,
        resetSiteLogo,
        refreshSettings,
        refreshLiveCounts,
        refreshVisitorStats,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
