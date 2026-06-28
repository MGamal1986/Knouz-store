import { createContext, useContext, useState, useEffect, useCallback } from "react";
import i18n from "@/i18n";

type Locale = "ar" | "en";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ar",
  setLocale: () => {},
  isRTL: true,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem("knouz-locale") as Locale) ?? "ar"
  );

  const applyLocale = useCallback((l: Locale) => {
    const isRTL = l === "ar";
    document.documentElement.lang = l;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.style.fontFamily = isRTL
      ? "'Cairo', sans-serif"
      : "'Inter', sans-serif";
    localStorage.setItem("knouz-locale", l);
    i18n.changeLanguage(l);
  }, []);

  useEffect(() => {
    applyLocale(locale);
  }, [locale, applyLocale]);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      applyLocale(l);
    },
    [applyLocale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isRTL: locale === "ar" }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
