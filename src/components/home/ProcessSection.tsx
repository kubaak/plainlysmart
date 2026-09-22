import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Eyebrow } from "./Eyebrow";
import type { ContentItem as Item } from "./types";

/**
 * The four steps from a first conversation to a growing product.
 * Copy: messages/{locale}.json → process.
 */
export async function ProcessSection() {
  const t = await getTranslations();

  return (
    <section className="process-section section" id="how-it-works">
      <div className="container">
        <Reveal className="section-heading centered">
          <Eyebrow>{t("process.eyebrow")}</Eyebrow>
          <h2>{t("process.title")}</h2>
          <p>{t("process.description")}</p>
        </Reveal>
        <Stagger interval={0.12} className="process-grid">
          {(t.raw("process.items") as Item[]).map((item, i) => (
            <StaggerItem className="process-step" key={item.title}>
              <div className="step-line">
                <span>{String(i + 1).padStart(2, "0")}</span>
                {i < 3 && <ArrowRight size={17} />}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="step-tag">{item.tag}</span>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="process-note">
          <Check size={16} />
          {t("process.note")}
        </p>
        <p className="timing-note">{t("process.timing")}</p>
        <p className="money-back-guarantee process-guarantee">
          <ShieldCheck size={20} aria-hidden="true" />
          {t("process.guarantee")}
        </p>
      </div>
    </section>
  );
}
