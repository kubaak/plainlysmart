"use client";
import { useEffect, useId, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { storePreferredLocale } from "@/i18n/preference";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownId = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <div
      ref={containerRef}
      aria-label={t("language")}
      className="languages"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={dropdownId}
        onClick={() => setOpen(!open)}
        className="language-trigger"
      >
        {locale.toUpperCase()}
        <FiChevronDown aria-hidden="true" className="size-3" />
      </button>
      <div id={dropdownId} hidden={!open} className="language-dropdown">
        {routing.locales
          .filter((target) => target !== locale)
          .map((target) => (
            <Link
              key={target}
              href={pathname}
              locale={target}
              aria-label={t(target)}
              onClick={(event) => {
                setOpen(false);
                storePreferredLocale(target);
                // Preserve optional query and fragment as well as the pathname.
                if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
                  event.preventDefault();
                  router.replace(pathname + window.location.search + window.location.hash, { locale: target, scroll: false });
                }
              }}
            >
              {target.toUpperCase()}
            </Link>
          ))}
      </div>
    </div>
  );
}
