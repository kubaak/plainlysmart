import { getTranslations } from "next-intl/server";
import { ArrowUpRight, ArrowUp } from "lucide-react";
import { BrandName } from "@/components/BrandName";
import { BrandMark } from "@/components/BrandMark";

/**
 * Brand, copyright, email and back-to-top navigation.
 * Copy: messages/{locale}.json → footer, brand, contact.
 */
export async function HomeFooter({ locale }: { locale: string }) {
  const t = await getTranslations();

  return (
    <footer className="container footer">
      <div className="footer-top">
        <a href={`/${locale}`} className="logo">
          <BrandMark />
          <BrandName name={t("brand")} />
          <span className="logo-dot">.</span>
        </a>
        <p>{t("footer.tagline")}</p>
        <a className="back-top" href="#top">
          {t("footer.back")}
          <ArrowUp size={16} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        <a href={`mailto:${t("contact.email")}`}>
          {t("contact.email")}
          <ArrowUpRight size={13} />
        </a>
      </div>
    </footer>
  );
}
