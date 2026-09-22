import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Eyebrow } from "./Eyebrow";
import type { ContentItem as Item } from "./types";

/**
 * Why custom software is now within reach: speed, investment and quality.
 * Copy: messages/{locale}.json → now.
 */
export async function BenefitsSection() {
  const t = await getTranslations();

  return (
    <section className="section container now-section">
      <Reveal className="section-heading split-heading">
        <div>
          <Eyebrow>{t("now.eyebrow")}</Eyebrow>
          <h2 className="preserve-lines">{t("now.title")}</h2>
        </div>
        <p>{t("now.description")}</p>
      </Reveal>
      <Stagger className="benefits-grid">
        {(t.raw("now.items") as Item[]).map((item, i) => (
          <StaggerItem className="benefit" key={item.title}>
            <div className="benefit-visual" aria-hidden="true">
              {i === 0 ? (
                <div className="speed-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <ArrowUpRight />
                </div>
              ) : i === 1 ? (
                <div className="investment">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <div className="quality">
                  <ShieldCheck size={45} strokeWidth={1.2} />
                  <span>
                    <Check size={14} />
                  </span>
                </div>
              )}
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
