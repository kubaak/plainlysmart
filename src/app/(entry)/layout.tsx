import SiteDocument from "@/components/SiteDocument";
import { routing } from "@/i18n/routing";
import "../globals.css";
export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale={routing.defaultLocale}>{children}</SiteDocument>;
}
