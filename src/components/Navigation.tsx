"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { ConsultationButton } from "./booking";
import { BrandMark } from "./BrandMark";
import { BrandName } from "./BrandName";

const links = [
  ["build", "what-we-build"],
  ["process", "how-it-works"],
  ["why", "why-plainlysmart"],
  ["contact", "contact"],
] as const;

export function Navigation() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <>
      <header className="header" id="top">
        <div className="container header-inner">
          <a href={`/${locale}`} className="logo" aria-label={t("brand")}>
            <BrandMark />
            <BrandName name={t("brand")} />
            <span className="logo-dot">.</span>
          </a>
          <nav id="primary-navigation" aria-label={t("nav.label")} className={open ? "nav-links is-open" : "nav-links"} onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              document.getElementById("menu-toggle")?.focus();
            }
          }}>
            {links.map(([key, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
                {t(`nav.${key}`)}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <ThemeToggle />
            <ConsultationButton className="button button-primary nav-cta">{t("nav.cta")}</ConsultationButton>
            <button
              className="menu-button"
              id="menu-toggle"
              aria-controls="primary-navigation"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={t(open ? "nav.close" : "nav.open")}
            >
              <motion.span style={{ display: "flex" }} initial={false} animate={{ rotate: open && !reduced ? 90 : 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
                {open ? <X /> : <Menu />}
              </motion.span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
