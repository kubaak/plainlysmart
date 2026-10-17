import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageLocale, type LocalePageProps } from "@/i18n/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HomeFooter } from "@/components/home/HomeFooter";
import { BusinessIdentity } from "@/components/BusinessIdentity";
import { business } from "@/lib/business";

export async function generateMetadata({params}: LocalePageProps): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({locale, namespace: "legal"});
  return {title: t("title") + " | PlainlySmart", description: t("description"),
    alternates: {canonical: `/${locale}/privacy`, languages: {en: "/en/privacy", cs: "/cs/privacy", "x-default": "/en/privacy"}},
    openGraph: {title: t("title"), description: t("description"), url: `/${locale}/privacy`}};
}

export default async function Privacy({params}: LocalePageProps) {
  const locale = await pageLocale(params);
  const t = await getTranslations("legal");
  const sections = t.raw("sections") as {title: string; body: string}[];
  return <>
    <header id="top" className="container legal-header"><Link className="text-link" href="/">{t("home")}</Link><div className="header-actions"><LanguageSwitcher /><ThemeToggle /></div></header>
    <main id="main" className="container legal-page">
      <h1>{t("title")}</h1><p>{t("draft")}</p>
      <p>{t("effective")}: <time dateTime={business.effectiveDate}>{business.effectiveDate}</time><br />{t("updated")}: <time dateTime={business.updatedDate}>{business.updatedDate}</time></p>
      <BusinessIdentity /><p>{t("privacyContact")}: <a className="text-link" href={`mailto:${business.privacyEmail}`}>{business.privacyEmail}</a></p>
      {sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
      <p><a className="text-link" href="https://uoou.gov.cz/">{t("authority")}</a></p>
      <p><a className="text-link" href="https://www.cloudflare.com/turnstile-privacy-policy/">{t("turnstile")}</a></p>
    </main><HomeFooter locale={locale} />
  </>;
}
