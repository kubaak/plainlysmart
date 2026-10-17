import { getTranslations } from "next-intl/server";
import { business } from "@/lib/business";

export async function BusinessIdentity() {
  const t = await getTranslations("legal");
  return <dl className="business-identity">{(["legalName", "ico", "address", "registry"] as const).map(key =>
    <div key={key}><dt>{t(key)}</dt><dd>{business[key]}</dd></div>
  )}</dl>;
}
