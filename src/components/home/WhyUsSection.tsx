import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ShieldCheck, MessageCircle, Layers3 } from "lucide-react";
import { Eyebrow } from "./Eyebrow";
import type { ContentItem as Item } from "./types";

/**
 * Direct communication, senior engineering and end-to-end delivery.
 * Copy: messages/{locale}.json → why.
 */
export async function WhyUsSection() {
  const t = await getTranslations();
  // Matches the order of why.items in each locale.
  const whyIcons = [MessageCircle, ShieldCheck, Layers3];
  return (
    <section className="why-section section" id="why-plainlysmart">
      <div className="container">
        <Reveal className="section-heading centered">
          <Eyebrow>{t("why.eyebrow")}</Eyebrow>
          <h2 className="preserve-lines">{t("why.title")}</h2>
          <p>{t("why.description")}</p>
        </Reveal>
        <Stagger className="why-grid">
          {(t.raw("why.items") as Item[]).map((item, i) => {
            const Icon = whyIcons[i];
            return (
              <StaggerItem key={item.title}>
                <Icon size={26} strokeWidth={1.5} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
