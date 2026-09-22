import { Reveal } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { ConsultationButton } from "@/components/booking";
import { Eyebrow } from "./Eyebrow";

/**
 * The closing consultation invitation and email alternative.
 * Copy: messages/{locale}.json → contact.
 */
export async function ContactSection() {
  const t = await getTranslations();

  return (
    <section id="contact" className="contact-section container">
      <Reveal distance={20} className="contact-card">
        <div className="contact-orbit orbit-one" />
        <div className="contact-orbit orbit-two" />
        <Eyebrow>{t("contact.eyebrow")}</Eyebrow>
        <h2 className="preserve-lines">{t("contact.title")}</h2>
        <p>{t("contact.description")}</p>
        <ConsultationButton className="button button-cream" />
        <span className="contact-note">{t("contact.note")}</span>
        <div className="email-alternative">
          {t("contact.alternative")}{" "}
          <a href={`mailto:${t("contact.email")}`}>
            {t("contact.email")}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
