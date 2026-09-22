import { defineRouting } from "next-intl/routing";
import { hasLocale } from "next-intl";

export const routing = defineRouting({
  locales: ["en", "cs"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && hasLocale(routing.locales, value);
}
