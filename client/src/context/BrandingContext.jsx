import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const defaultBranding = {
  marketplaceName: "EliteMart",
  supportEmail: "support@elitemart.local",
};

const BrandingContext = createContext({
  branding: defaultBranding,
  refreshBranding: () => {},
});

export const splitBrandName = (name = defaultBranding.marketplaceName) => {
  const safeName = String(name || defaultBranding.marketplaceName).trim();
  if (safeName.length <= 4) return { primary: safeName, accent: "" };

  const firstSpace = safeName.indexOf(" ");
  if (firstSpace > 0) {
    return {
      primary: safeName.slice(0, firstSpace),
      accent: safeName.slice(firstSpace),
    };
  }

  return {
    primary: safeName.slice(0, Math.max(1, safeName.length - 4)),
    accent: safeName.slice(Math.max(1, safeName.length - 4)),
  };
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding);

  const refreshBranding = async () => {
    try {
      const response = await api.get("/settings");
      const settings = response.data?.settings || {};
      setBranding((current) => ({
        ...current,
        ...settings,
      }));

      if (settings.marketplaceName) {
        document.title = settings.marketplaceName;
      }
    } catch {
      setBranding(defaultBranding);
    }
  };

  useEffect(() => {
    refreshBranding();
  }, []);

  const value = useMemo(() => ({ branding, refreshBranding }), [branding]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => useContext(BrandingContext);
