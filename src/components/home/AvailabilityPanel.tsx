import { getTranslations } from "next-intl/server";
import { CLIENT_CAPACITY } from "@/lib/booking";

export async function AvailabilityPanel() {
  const t = await getTranslations();
  return <aside className="availability-panel">
    <p className="availability-indicator"><span aria-hidden="true" />{t("hero.availability", { count: CLIENT_CAPACITY })}</p>
  </aside>;
}
