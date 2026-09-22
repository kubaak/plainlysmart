import { Reveal, Stagger } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ConsultationLink } from "@/components/booking";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  PanelsTopLeft,
  Smartphone,
  Workflow,
  Sparkles,
  Monitor,
} from "lucide-react";
import { Eyebrow } from "./Eyebrow";
import type { ContentItem as Item } from "./types";

/**
 * The six kinds of software we build.
 * Copy: messages/{locale}.json → build.
 */
export async function ServicesSection() {
  const t = await getTranslations();
  // Matches the order of build.items in each locale.
  const serviceIcons = [Globe2, PanelsTopLeft, Smartphone, Workflow, Sparkles, Monitor];
  return (
    <section id="what-we-build" className="section container">
      <Reveal className="section-heading split-heading">
        <div>
          <Eyebrow>{t("build.eyebrow")}</Eyebrow>
          <h2>
            {t("build.title")}
            <br />
            <span className="muted-heading">{t("build.accent")}</span>
          </h2>
        </div>
        <p>{t("build.description")}</p>
      </Reveal>
      <Stagger className="services-grid">
        {(t.raw("build.items") as Item[]).map((item, i) => {
          const Icon = serviceIcons[i];
          return (
            <ConsultationLink className="service-card" key={item.title}>
              <div className="service-top">
                <span className={`service-icon tone-${i}`}>
                  <Icon size={25} strokeWidth={1.6} />
                </span>
                <ArrowUpRight size={19} className="service-arrow" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="service-tag">{item.tag}</span>
            </ConsultationLink>
          );
        })}
      </Stagger>
      <p className="other-idea">
        {t("build.other")}{" "}
        <ConsultationLink>
          {t("build.otherLink")}
          <ArrowRight size={15} />
        </ConsultationLink>
      </p>
    </section>
  );
}
