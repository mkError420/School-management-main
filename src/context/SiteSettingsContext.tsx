import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DEFAULT_WEBSITE_CONTENT } from "@/types/site";
import type { SchoolWebsiteContent } from "@/types/site";

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
export const DEFAULT_SITE_LOGO = "/images/logo.png";

interface SiteSettingsContextValue {
  siteName: string;
  siteLogo: string;
  siteLogoUrl: string;
  websiteContent: SchoolWebsiteContent;
  currencySymbol: string;
  isLoading: boolean;
  saveSiteName: (siteName: string) => Promise<{ success: boolean; message?: string }>;
  saveWebsiteContent: (content: SchoolWebsiteContent) => Promise<{ success: boolean; message?: string }>;
  saveCurrencySymbol: (symbol: string) => void;
  saveSiteLogo: (fileOrUrl: File | string) => Promise<{ success: boolean; message?: string; logoUrl?: string }>;
  resetSiteLogo: () => Promise<{ success: boolean; message?: string }>;
  refreshSettings: () => Promise<void>;
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
  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `/images${trimmed}`;
  }
  return `/images/${trimmed}`;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  siteName: "ACADEMIA",
  siteLogo: DEFAULT_SITE_LOGO,
  siteLogoUrl: DEFAULT_SITE_LOGO,
  websiteContent: DEFAULT_WEBSITE_CONTENT,
  currencySymbol: "৳",
  isLoading: false,
  saveSiteName: async () => ({ success: false, message: "Site settings are unavailable." }),
  saveWebsiteContent: async () => ({ success: false, message: "Site settings are unavailable." }),
  saveCurrencySymbol: () => {},
  saveSiteLogo: async () => ({ success: false, message: "Site settings are unavailable." }),
  resetSiteLogo: async () => ({ success: false, message: "Site settings are unavailable." }),
  refreshSettings: async () => {},
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
  const qMatches = str.match(/\?/g);
  if (!qMatches) return false;
  const qCount = qMatches.length;
  if (qCount < 2) return false;
  const letters = str.replace(/[\s\d.,\-·–/\\:;!@#$%^&*()_+={}\[\]|`~'"]/g, "");
  if (letters.length === 0) return true;
  return qCount / letters.length >= 0.35;
};

const cleanStr = (incomingVal: any, defaultVal: string): string => {
  if (typeof incomingVal !== "string") return defaultVal;
  if (!incomingVal.trim() || isCorruptedText(incomingVal)) {
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

  // Sanitize every scalar string field from DEFAULT_WEBSITE_CONTENT
  const sanitizedStrings: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_WEBSITE_CONTENT) as (keyof SchoolWebsiteContent)[]) {
    const defVal = DEFAULT_WEBSITE_CONTENT[key];
    const incVal = incoming[key];
    if (typeof defVal === "string") {
      sanitizedStrings[key] = cleanStr(incVal, defVal);
    }
  }

  // Handle legacy studyCorner / mujibCorner migrations
  const studyCornerTitle = cleanStr(
    incoming.studyCornerTitle || anyInc.mujibCornerTitle,
    DEFAULT_WEBSITE_CONTENT.studyCornerTitle
  );
  const studyCornerQuote = cleanStr(
    incoming.studyCornerQuote || anyInc.mujibCornerQuote,
    DEFAULT_WEBSITE_CONTENT.studyCornerQuote
  );
  const studyCornerText = cleanStr(
    incoming.studyCornerText || anyInc.mujibCornerText,
    DEFAULT_WEBSITE_CONTENT.studyCornerText
  );
  const studyCornerImage = cleanStr(
    incoming.studyCornerImage || anyInc.mujibCornerImage,
    DEFAULT_WEBSITE_CONTENT.studyCornerImage
  );

  const cleanList = <T,>(
    list: T[] | undefined,
    defaultList: T[],
    checkFns: ((item: T) => string)[]
  ): T[] => {
    if (!Array.isArray(list) || list.length === 0) return defaultList;
    const isCorrupted = list.some((item) =>
      checkFns.some((fn) => isCorruptedText(fn(item)))
    );
    if (isCorrupted) return defaultList;
    return list;
  };

  return {
    ...DEFAULT_WEBSITE_CONTENT,
    ...incoming,
    ...(sanitizedStrings as any),
    studyCornerTitle,
    studyCornerQuote,
    studyCornerText,
    studyCornerImage,
    studyCornerDays: cleanStr(incoming.studyCornerDays, DEFAULT_WEBSITE_CONTENT.studyCornerDays || "সোমবার - শনিবার"),
    studyCornerHours: cleanStr(incoming.studyCornerHours, DEFAULT_WEBSITE_CONTENT.studyCornerHours || "সকাল ৮:০০ - বিকাল ৪:০০"),
    studyCornerFee: cleanStr(incoming.studyCornerFee, DEFAULT_WEBSITE_CONTENT.studyCornerFee || "বিনামূল্যে প্রবেশ"),
    notices: cleanList(incoming.notices, DEFAULT_WEBSITE_CONTENT.notices, [(n) => n.title, (n) => n.content]),
    quickLinks: cleanList(incoming.quickLinks, DEFAULT_WEBSITE_CONTENT.quickLinks, [(l) => l.label]),
    downloads: cleanList(incoming.downloads, DEFAULT_WEBSITE_CONTENT.downloads, [(d) => d.title]),
    gallery: cleanList(incoming.gallery, DEFAULT_WEBSITE_CONTENT.gallery, [(g) => g.title]),
    coCurricular: cleanList(incoming.coCurricular, DEFAULT_WEBSITE_CONTENT.coCurricular, [(c) => c.title]),
    teachers: cleanList(incoming.teachers, DEFAULT_WEBSITE_CONTENT.teachers, [(t) => t.name, (t) => t.designation]),
    studyCornerBooks: cleanList(incoming.studyCornerBooks, DEFAULT_WEBSITE_CONTENT.studyCornerBooks, [(b) => b.title, (b) => b.author]),
    studyCornerResources: cleanList(incoming.studyCornerResources, DEFAULT_WEBSITE_CONTENT.studyCornerResources, [(r) => r.title, (r) => r.description]),
    studyCornerLinks: cleanList(incoming.studyCornerLinks, DEFAULT_WEBSITE_CONTENT.studyCornerLinks || [], [(l) => l.name, (l) => l.desc]),
    studyCornerTips: cleanList(incoming.studyCornerTips, DEFAULT_WEBSITE_CONTENT.studyCornerTips || [], [(t) => t.tip]),
    studyCornerStats:
      Array.isArray(incoming.studyCornerStats) &&
      incoming.studyCornerStats.length > 0 &&
      !incoming.studyCornerStats.some((s) => isCorruptedText(s.label) || isCorruptedText(s.value))
        ? incoming.studyCornerStats
        : DEFAULT_WEBSITE_CONTENT.studyCornerStats || [],
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
  const [isLoading, setIsLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState<string>(() => {
    try {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || "৳";
    } catch {
      return "৳";
    }
  });

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

    const handleSync = () => {
      try {
        const cachedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
        if (cachedLogo) {
          setSiteLogo(resolveLogoUrl(cachedLogo));
        }
      } catch {}
    };

    window.addEventListener("school-site-settings-updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      active = false;
      window.removeEventListener("school-site-settings-updated", handleSync);
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

  const saveWebsiteContent = async (content: SchoolWebsiteContent) => {
    try {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    } catch {}
    setWebsiteContent(content);
    broadcastUpdate();

    try {
      const response = await api.updateWebsiteContent(content);
      if (response.success && response.data?.website_content) {
        const normalized = normalizeContent(response.data.website_content);
        setWebsiteContent(normalized);
        try {
          localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(normalized));
        } catch {}
        return { success: true };
      } else if (!response.success) {
        return { success: false, message: response.message || "Failed to update on server." };
      }
    } catch (err: any) {
      // Saved locally
      return { success: true, message: "Website updated and saved locally." };
    }
    return { success: true };
  };

  const saveSiteLogo = async (fileOrUrl: File | string): Promise<{ success: boolean; message?: string; logoUrl?: string }> => {
    try {
      if (fileOrUrl instanceof File) {
        // Try uploading to backend
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

        // If backend returns an error or is unavailable, fallback to base64 DataURL
        const dataUrl = await fileToDataUrl(fileOrUrl);
        setSiteLogo(dataUrl);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
        } catch {}
        // Also try saving base64 to settings API
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
      // Offline / network fallback
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

  const saveCurrencySymbol = (symbol: string) => {
    setCurrencySymbol(symbol);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, symbol);
    } catch {
      // ignore storage errors
    }
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
        saveSiteName,
        saveWebsiteContent,
        saveCurrencySymbol,
        saveSiteLogo,
        resetSiteLogo,
        refreshSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
