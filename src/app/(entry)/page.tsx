import type { Metadata } from "next";
import { LocaleEntry } from "@/components/LocaleEntry";

export const metadata: Metadata = { title: "Plainly Smart", robots: { index: false, follow: true } };

export default function EntryPage() {
  return <LocaleEntry />;
}
