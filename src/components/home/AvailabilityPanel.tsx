import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { CLIENT_CAPACITY } from "@/lib/booking";

/**
 * Client capacity and the money-back guarantee.
 * Copy: messages/{locale}.json → hero.availability, process.guarantee.
 */
export async function AvailabilityPanel() {
  const t = await getTranslations();

  return (
    <aside className="availability-panel">
      <p className="availability-indicator">
        <span aria-hidden="true" />
        {t("hero.availability", { count: CLIENT_CAPACITY })}
      </p>
      <p className="money-back-guarantee">
        <ShieldCheck size={18} aria-hidden="true" />
        {t("process.guarantee")}
      </p>
    </aside>
  );
}
