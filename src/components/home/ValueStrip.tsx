import { getTranslations } from "next-intl/server";
import { Code2, Sparkles, Fingerprint, TrendingUp } from "lucide-react";
import styles from "./ValueStrip.module.css";

const icons = [Code2, Sparkles, Fingerprint, TrendingUp];

/**
 * Senior engineering and the benefits of a small team.
 * Copy: messages/{locale}.json → strip.
 */
export async function ValueStrip() {
  const t = await getTranslations();

  return (
    <section className={styles.strip} aria-labelledby="value-strip-heading">
      <div className={`container ${styles.inner}`}>
        <h2 id="value-strip-heading" className={styles.heading}>
          {t("strip.intro")}
        </h2>
        <ul className={styles.items} role="list">
          {(t.raw("strip.items") as string[]).map((item, index) => {
            const Icon = icons[index] ?? Code2;

            return (
              <li className={styles.item} key={item}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <span>{item}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
