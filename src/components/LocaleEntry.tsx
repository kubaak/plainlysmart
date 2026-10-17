"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { readPreferredLocale, resolvePreferredLocale } from "@/i18n/preference";
import { captureUtm } from "@/lib/contact-tracking";

export function LocaleEntry() {
  const router = useRouter();
  useEffect(() => {
    captureUtm();
    const locale =
      readPreferredLocale() ??
      resolvePreferredLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
    router.replace(getPathname({ href: "/", locale }) + window.location.search + window.location.hash);
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="size-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600 motion-reduce:animate-none"
      />
    </main>
  );
}
