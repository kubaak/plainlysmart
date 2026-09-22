import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

export default function config(phase: string) {
  const nextConfig: NextConfig = {
    // Let locale validation handle unknown paths in dev without export errors.
    output: phase === PHASE_DEVELOPMENT_SERVER ? undefined : "export",
    images: {
      unoptimized: true,
    },
  };

  return withNextIntl(nextConfig);
}
