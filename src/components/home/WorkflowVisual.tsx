import { WorkflowScene, WorkflowStep, WorkflowConnections } from "@/components/motion/WorkflowMotion";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Sparkles,
  FileSpreadsheet,
  Files,
  Network,
  Zap,
  MousePointer2,
} from "lucide-react";
import { BrandName } from "@/components/BrandName";
import { BrandMark } from "@/components/BrandMark";

/**
 * Scattered inputs become connected orders, invoices and customers.
 * Copy: messages/{locale}.json → hero and brand.
 */
export async function WorkflowVisual() {
  const t = await getTranslations();

  return (
    <WorkflowScene className="workflow-visual" role="img" aria-label={t("hero.visualLabel")}>
      <div className="visual-grain" />
      <div className="visual-heading">
        <span className="tiny-cross">+</span>
        {t("hero.visualTop")}
        <span className="tiny-cross">+</span>
      </div>
      <WorkflowStep stage="inputs" group className="input-cards">
        {[FileSpreadsheet, Files, Network].map((Icon, i) => (
          <WorkflowStep stage="input" className={`input-card input-${i}`} key={i}>
            <Icon size={19} />
            <span>{t(`hero.input${i + 1}`)}</span>
          </WorkflowStep>
        ))}
      </WorkflowStep>
      <div className="connector-lines">
        <WorkflowConnections />
      </div>
      <WorkflowStep stage="engine" className="engine-card">
        <div className="engine-logo">
          <BrandMark />
          <BrandName name={t("brand")} />
          <span>.</span>
        </div>
        <div className="engine-sub">
          <span />
          {t("hero.engine")}
        </div>
        <WorkflowStep stage="spark" className="engine-spark">
          <Sparkles size={15} />
        </WorkflowStep>
      </WorkflowStep>
      <WorkflowStep stage="connector" className="output-connector">
        <span />
        <ArrowRight size={14} />
      </WorkflowStep>
      <WorkflowStep stage="output" className="output-card">
        <div className="output-header">
          <span>{t("hero.output")}</span>
          <span className="live-dot" />
        </div>
        <WorkflowStep stage="rows" group className="output-content">
          {["order", "invoice", "customer"].map((key, i) => (
            <WorkflowStep stage="row" className="output-row" key={key}>
              <span className="check-round">
                <Check size={12} />
              </span>
              <span>{t(`hero.${key}`)}</span>
              <span className="output-meta">
                {i === 0 ? (
                  <span className="mini-bars">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  t("hero.done")
                )}
              </span>
            </WorkflowStep>
          ))}
        </WorkflowStep>
        <div className="output-footer">
          <span />
          <span>{t("hero.live")}</span>
          <CheckCheck size={14} />
        </div>
      </WorkflowStep>
      <WorkflowStep stage="saved" className="saved-pill">
        <Zap size={15} fill="currentColor" />
        {t("hero.saved")}
      </WorkflowStep>
      <div className="visual-bottom">
        <span>↳</span>
        {t("hero.visualBottom")}
        <span>↲</span>
      </div>
      <MousePointer2 className="visual-cursor" size={27} fill="#eb5a2b" />
    </WorkflowScene>
  );
}
