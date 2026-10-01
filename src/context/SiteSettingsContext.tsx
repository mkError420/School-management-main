import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SiteSettingsContextValue {
  siteName: string;
  isLoading: boolean;
  saveSiteName: (siteName: string) => Promise<{ success: boolean; message?: string }>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  siteName: "ACADEMIA",
  isLoading: false,
  saveSiteName: async () => ({ success: false, message: "Site settings are unavailable." }),
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteName, setSiteName] = useState("ACADEMIA");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getSiteSettings().then((response) => {
      if (active && response.success && response.data?.site_name) {
        setSiteName(response.data.site_name);
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

  return (
    <SiteSettingsContext.Provider value={{ siteName, isLoading, saveSiteName }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
