"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { captureUtm, setAttributionConsent } from "@/lib/contact-tracking";

export function PrivacyPreferences() {
  const t = useTranslations("consent");
  const legal = useTranslations("legal");
  const [open, setOpen] = useState(false);
  function choose(accepted: boolean) {
    setAttributionConsent(accepted);
    if (accepted) captureUtm();
    setOpen(false);
  }
  return <div className="privacy-preferences">
    <button type="button" className="text-link" aria-expanded={open} aria-controls="attribution-preferences" onClick={() => setOpen(!open)}>{t("preferences")}</button>
    {open && <section id="attribution-preferences" className="consent-panel" aria-labelledby="attribution-title">
      <h2 id="attribution-title">{t("title")}</h2><p>{t("body")}</p>
      <Link prefetch={false} className="text-link" href="/privacy">{legal("title")}</Link>
      <div className="consent-actions">
        <button type="button" className="button button-secondary" onClick={() => choose(true)}>{t("accept")}</button>
        <button type="button" className="button button-secondary" onClick={() => choose(false)}>{t("reject")}</button>
      </div>
    </section>}
  </div>;
}
