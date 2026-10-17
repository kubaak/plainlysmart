import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["en", "cs"].map(locale => ({ url: "https://plainlysmart.com/" + locale + "/legal", changeFrequency: "yearly" as const, priority: 0.3 })),
    ...["en", "cs"].map(locale => ({ url: "https://plainlysmart.com/" + locale + "/privacy", changeFrequency: "yearly" as const, priority: 0.3 })),
    {
      url: "https://plainlysmart.com/en",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://plainlysmart.com/cs",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
