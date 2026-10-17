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
  const sections = t.raw("sections") as {id: string; title: string; paragraphs: string[]}[];
  const table = (headers: string[], rows: string[][], label: string) =>
    <div className="legal-table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table><thead><tr>{headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row[0]}>{row.map((cell, i) => i === 0
          ? <th scope="row" key={i}>{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>;
  return <>
    <header id="top" className="container legal-header"><Link className="text-link" href="/">{t("home")}</Link><div className="header-actions"><LanguageSwitcher /><ThemeToggle /></div></header>
    <main id="main" className="container legal-page">
      <h1>{t("title")}</h1><p>{t("intro")}</p>
      <p>{t.rich("controller", {name: business.legalName, ico: business.ico, brand: business.brand,
        legal: chunks => <Link prefetch={false} className="text-link" href="/legal">{chunks}</Link>})}</p>
      <p>{t("effective")}: <time dateTime={business.effectiveDate}>{business.effectiveDate}</time><br />{t("updated")}: <time dateTime={business.updatedDate}>{business.updatedDate}</time></p>
      <BusinessIdentity /><p>{t("privacyContact")}: <a className="text-link" href={`mailto:${business.privacyEmail}`}>{business.privacyEmail}</a></p>
      {sections.map(section => <section key={section.id} aria-labelledby={section.id}>
        <h2 id={section.id}>{section.title}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        {section.id === "purposes" && table(t.raw("purposeHeaders"), t.raw("purposes"), section.title)}
        {section.id === "storage" && table(t.raw("storageHeaders"), t.raw("storage"), section.title)}
        {section.id === "rights" && <ul>{(t.raw("rights") as string[]).map(right => <li key={right}>{right}</li>)}</ul>}
        {section.id === "transfers" && <ul>
          <li><a href="https://www.cloudflare.com/policies/privacy/">Cloudflare</a></li>
          <li><a href="https://help.brevo.com/hc/en-us/articles/360001005510-Data-storage-location">Brevo</a></li>
          <li><a href="https://aws.amazon.com/compliance/gdpr-center/">AWS</a></li>
        </ul>}
      </section>)}
      <p><a className="text-link" href="https://uoou.gov.cz/">{t("authority")}</a></p>
      <p><a className="text-link" href="https://www.cloudflare.com/turnstile-privacy-policy/">{t("turnstile")}</a></p>
    </main><HomeFooter locale={locale} />
  </>;
}
