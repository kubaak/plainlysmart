import { Stagger, StaggerItem, MotionHeading, MotionParagraph } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Clock3 } from "lucide-react";
import { ConsultationButton } from "@/components/booking";
import { Eyebrow } from "./Eyebrow";
import { WorkflowVisual } from "./WorkflowVisual";

/**
 * Business introduction, consultation links and a connected workflow illustration.
 * Copy: messages/{locale}.json → hero.
 */
export async function HeroSection() {
  const t = await getTranslations();

  return (
    <section className="hero container">
      <Stagger interval={0.065} className="hero-copy">
        <StaggerItem><Eyebrow>{t("hero.eyebrow")}</Eyebrow></StaggerItem>
        <MotionHeading>
          {t("hero.title")}
          <br />
          {t("hero.title2")}
          <br />
          <span>{t("hero.title3")}</span>
        </MotionHeading>
        <MotionParagraph className="hero-description">{t("hero.description")}</MotionParagraph>
        <StaggerItem className="hero-buttons">
          <ConsultationButton>{t("hero.cta")}</ConsultationButton>
          <a className="text-link" href="#what-we-build">
            {t("hero.secondary")}
            <ArrowRight size={17} />
          </a>
        </StaggerItem>
        <StaggerItem className="hero-proof">
          <span className="proof-icon">
            <Clock3 size={18} />
          </span>
          <div>
            <strong>{t("hero.proof")}</strong>
            <p>{t("hero.note")}</p>
          </div>
        </StaggerItem>
      </Stagger>
      <WorkflowVisual />
    </section>
  );
}
