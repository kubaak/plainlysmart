import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { pageLocale, type LocalePageProps } from "@/i18n/server";
import SiteDocument from "@/components/SiteDocument";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL("https://plainlysmart.com"),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", cs: "/cs", "x-default": "/en" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}`,
      siteName: "Plainlysmart",
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "website",
    },
    robots: locale === "cs" ? { index: false, follow: true } : { index: true, follow: true },
  };
}
export default async function LocaleLayout({ children, params }: LocalePageProps & { children: React.ReactNode }) {
  const locale = await pageLocale(params);
  const messages = await getMessages();
  return (
    <SiteDocument locale={locale}>
      <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
    </SiteDocument>
  );
}
