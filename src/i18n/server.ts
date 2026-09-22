import { notFound } from "next/navigation";
import { isLocale } from "./routing";

export type LocalePageProps = { params: Promise<{ locale: string }> };

export async function pageLocale(params: LocalePageProps["params"]) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
