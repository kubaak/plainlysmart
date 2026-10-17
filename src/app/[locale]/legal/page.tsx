import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageLocale, type LocalePageProps } from "@/i18n/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HomeFooter } from "@/components/home/HomeFooter";
import { BusinessIdentity } from "@/components/BusinessIdentity";
import { business } from "@/lib/business";

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = await pageLocale(params);
  const t = await getTranslations({ locale, namespace: "legalInfo" });
  return {
    title: `${t("title")} | PlainlySmart`,
    description: t("description"),
    alternates: {
      canonical: `/${locale}/legal`,
      languages: { en: "/en/legal", cs: "/cs/legal", "x-default": "/en/legal" },
    },
    openGraph: { title: t("title"), description: t("description"), url: `/${locale}/legal` },
  };
}

export default async function LegalInformation({ params }: LocalePageProps) {
  const locale = await pageLocale(params);
  const t = await getTranslations();
  return <>
    <header id="top" className="container legal-header">
      <Link className="text-link" href="/">{t("legal.home")}</Link>
      <div className="header-actions"><LanguageSwitcher /><ThemeToggle /></div>
    </header>
    <main id="main" className="container legal-page">
      <h1>{t("legalInfo.title")}</h1>
      <BusinessIdentity />
      <p>{t("legalInfo.email")}: <a className="text-link" href={`mailto:${business.email}`}>{business.email}</a></p>
    </main>
    <HomeFooter locale={locale} />
  </>;
}
