import { isLocale, routing, type Locale } from "./routing";

const preferenceKey = "preferredLocale";

export function resolvePreferredLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return routing.defaultLocale;
}
export function readPreferredLocale(): Locale | undefined {
  try {
    const value = localStorage.getItem(preferenceKey);
    return isLocale(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
export function storePreferredLocale(locale: Locale): void {
  if (!isLocale(locale)) return;
  try {
    localStorage.setItem(preferenceKey, locale);
  } catch {
    /* Navigation still works when storage is blocked. */
  }
}
