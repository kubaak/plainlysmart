export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  company?: string;
  phone?: string;
  marketingConsent: boolean;
  turnstileToken: string;
  locale: "en" | "cs";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export function validateContactRequest(input: unknown): ContactRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_REQUEST");
  const data = input as Record<string, unknown>;
  function field(key: string, max: number, required = false, multiline = false): string {
    const value = data[key];
    if (value === undefined && !required) return "";
    if (typeof value !== "string") throw new Error("INVALID_REQUEST");
    const normalized = value.trim().normalize("NFC");
    if ((required && !normalized) || normalized.length > max ||
      (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(normalized)) {
      throw new Error("INVALID_REQUEST");
    }
    return normalized;
  }
  const email = field("email", 200, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_REQUEST");
  if (data.locale !== undefined && data.locale !== "en" && data.locale !== "cs") throw new Error("INVALID_REQUEST");
  if (data.marketingConsent !== undefined && typeof data.marketingConsent !== "boolean") throw new Error("INVALID_REQUEST");
  return {
    name: field("name", 120, true), email, message: field("message", 4000, true, true),
    company: field("company", 200), phone: field("phone", 50),
    turnstileToken: field("turnstileToken", 2048, true),
    marketingConsent: data.marketingConsent === true, locale: data.locale ?? "en",
    utmSource: field("utmSource", 200), utmMedium: field("utmMedium", 200),
    utmCampaign: field("utmCampaign", 200), utmContent: field("utmContent", 200), utmTerm: field("utmTerm", 200),
  };
}
