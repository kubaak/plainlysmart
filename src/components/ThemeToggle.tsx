"use client";
import { useTranslations } from "next-intl";

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const t = useTranslations("nav");
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  const label = theme === null ? t("toggleTheme") : isDark ? t("lightTheme") : t("darkTheme");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="theme-toggle"
    >
      <FiMoon aria-hidden="true" className="theme-moon size-4" />
      <FiSun aria-hidden="true" className="theme-sun size-4" />
    </button>
  );
}
