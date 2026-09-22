import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ConsultationLink } from "@/components/booking";
import { ArrowRight, ArrowUpRight, Sparkles, CircleCheck } from "lucide-react";
import { Eyebrow } from "./Eyebrow";

/**
 * A before-and-after comparison of everyday business tasks.
 * Copy: messages/{locale}.json → automation.
 */
export async function AutomationSection() {
  const t = await getTranslations();

  return (
    <section className="automation-section">
      <div className="container automation-grid">
        <Reveal>
          <Eyebrow>{t("automation.eyebrow")}</Eyebrow>
          <h2>
            {t("automation.title")}
            <br />
            <span>{t("automation.accent")}</span>
          </h2>
          <p className="section-description">{t("automation.description")}</p>
          <ConsultationLink className="text-link">
            {t("automation.link")}
            <ArrowUpRight size={17} />
          </ConsultationLink>
          <div className="abstract-flower" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} style={{ transform: `rotate(${i * 45}deg)` }} />
            ))}
          </div>
        </Reveal>
        <Stagger className="before-after">
          <div className="comparison-head">
            <span>{t("automation.before")}</span>
            <span>{t("automation.after")}</span>
          </div>
          {(t.raw("automation.rows") as { before: string; after: string }[]).map((row) => (
            <StaggerItem className="comparison-row" key={row.before}>
              <span>{row.before}</span>
              <ArrowRight size={16} />
              <span>
                <CircleCheck size={17} />
                {row.after}
              </span>
            </StaggerItem>
          ))}
          <div className="comparison-foot">
            <Sparkles size={17} />
            {t("automation.foot")}
          </div>
        </Stagger>
      </div>
    </section>
  );
}
