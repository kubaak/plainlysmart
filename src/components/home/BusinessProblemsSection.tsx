import { Reveal } from "@/components/motion/Reveal";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Eyebrow } from "./Eyebrow";

/**
 * Expandable examples of business problems and their software solutions.
 * Copy: messages/{locale}.json → problems.
 */
export async function BusinessProblemsSection() {
  const t = await getTranslations();

  return (
    <section className="section container problems-section">
      <Reveal>
        <Eyebrow>{t("problems.eyebrow")}</Eyebrow>
        <h2 className="preserve-lines">{t("problems.title")}</h2>
        <p className="section-description">{t("problems.description")}</p>
      </Reveal>
      <Reveal distance={8} className="questions">
        {(t.raw("problems.items") as { question: string; answer: string }[]).map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <Plus size={19} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
