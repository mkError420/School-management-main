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

const normalizeContent = (incoming?: Partial<SchoolWebsiteContent> | null): SchoolWebsiteContent => {
  if (!incoming) return DEFAULT_WEBSITE_CONTENT;
  return {
    ...DEFAULT_WEBSITE_CONTENT,
    ...incoming,
    notices: Array.isArray(incoming.notices) && incoming.notices.length > 0 ? incoming.notices : DEFAULT_WEBSITE_CONTENT.notices,
    quickLinks: Array.isArray(incoming.quickLinks) && incoming.quickLinks.length > 0 ? incoming.quickLinks : DEFAULT_WEBSITE_CONTENT.quickLinks,
    downloads: Array.isArray(incoming.downloads) && incoming.downloads.length > 0 ? incoming.downloads : DEFAULT_WEBSITE_CONTENT.downloads,
    gallery: Array.isArray(incoming.gallery) && incoming.gallery.length > 0 ? incoming.gallery : DEFAULT_WEBSITE_CONTENT.gallery,
    coCurricular: Array.isArray(incoming.coCurricular) && incoming.coCurricular.length > 0 ? incoming.coCurricular : DEFAULT_WEBSITE_CONTENT.coCurricular,
  };
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteName, setSiteName] = useState("ACADEMIA");
  const [websiteContent, setWebsiteContent] = useState<SchoolWebsiteContent>(() => {
    try {
      const cached = localStorage.getItem(CONTENT_STORAGE_KEY);
      if (cached) {
        return normalizeContent(JSON.parse(cached));
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
          const merged = normalizeContent(response.data.website_content);
          setWebsiteContent(merged);
          try {
            localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
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
        const merged = normalizeContent(response.data.website_content);
        setWebsiteContent(merged);
        try {
          localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
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
