import { useLocale } from "@/contexts/LocaleContext";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${className}`}>
      <button
        onClick={() => setLocale("ar")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "ar"
            ? "text-[#C9A84C] font-bold"
            : "text-foreground/50 hover:text-foreground"
        }`}
      >
        عربي
      </button>
      <span className="text-foreground/30 select-none">|</span>
      <button
        onClick={() => setLocale("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en"
            ? "text-[#C9A84C] font-bold"
            : "text-foreground/50 hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
