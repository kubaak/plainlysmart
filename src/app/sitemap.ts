import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
