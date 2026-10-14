import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

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
  currencySymbol: string;
  isLoading: boolean;
  saveSiteName: (siteName: string) => Promise<{ success: boolean; message?: string }>;
  saveCurrencySymbol: (symbol: string) => void;
  saveSiteLogo: (fileOrUrl: File | string) => Promise<{ success: boolean; message?: string; logoUrl?: string }>;
  resetSiteLogo: () => Promise<{ success: boolean; message?: string }>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  siteName: "ACADEMIA",
  siteLogo: DEFAULT_SITE_LOGO,
  siteLogoUrl: DEFAULT_SITE_LOGO,
  currencySymbol: "৳",
  isLoading: false,
  saveSiteName: async () => ({ success: false, message: "Site settings are unavailable." }),
  saveCurrencySymbol: () => {},
  saveSiteLogo: async () => ({ success: false, message: "Site settings are unavailable." }),
  resetSiteLogo: async () => ({ success: false, message: "Site settings are unavailable." }),
});

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
};

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteName, setSiteName] = useState("ACADEMIA");
  const [siteLogo, setSiteLogo] = useState<string>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY) || DEFAULT_SITE_LOGO;
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

  useEffect(() => {
    let active = true;
    api.getSiteSettings().then((response) => {
      if (!active || !response.success || !response.data) return;
      if (response.data.site_name) {
        setSiteName(response.data.site_name);
      }
      if (response.data.site_logo) {
        setSiteLogo(response.data.site_logo);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, response.data.site_logo);
        } catch {
          // ignore storage errors
        }
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const saveSiteName = async (nextName: string) => {
    const response = await api.updateSiteName(nextName.trim());
    if (!response.success || !response.data?.site_name) {
      return { success: false, message: response.message || "Unable to update the site name." };
    }
    setSiteName(response.data.site_name);
    return { success: true };
  };

  const saveSiteLogo = async (fileOrUrl: File | string): Promise<{ success: boolean; message?: string; logoUrl?: string }> => {
    try {
      if (fileOrUrl instanceof File) {
        // Try uploading to backend
        const response = await api.uploadSiteLogo(fileOrUrl);
        if (response.success && response.data?.site_logo) {
          const newLogo = response.data.site_logo;
          setSiteLogo(newLogo);
          try {
            localStorage.setItem(LOGO_STORAGE_KEY, newLogo);
          } catch {}
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
        return {
          success: true,
          logoUrl: dataUrl,
          message: response.message ? `Logo saved locally (${response.message})` : undefined,
        };
      } else {
        const logoStr = fileOrUrl.trim() || DEFAULT_SITE_LOGO;
        setSiteLogo(logoStr);
        try {
          localStorage.setItem(LOGO_STORAGE_KEY, logoStr);
        } catch {}
        const response = await api.updateSiteLogo(logoStr);
        if (response.success && response.data?.site_logo) {
          setSiteLogo(response.data.site_logo);
        }
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
        currencySymbol,
        isLoading,
        saveSiteName,
        saveCurrencySymbol,
        saveSiteLogo,
        resetSiteLogo,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);

