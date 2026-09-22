const utmParams = {
  source: "utmSource",
  medium: "utmMedium",
  campaign: "utmCampaign",
  content: "utmContent",
  term: "utmTerm",
} as const;

type UtmValues = Partial<Record<(typeof utmParams)[keyof typeof utmParams], string>>;

const storageKey = "plainlysmart.utm";
const maxValueLength = 200;

const sessionValues: UtmValues = {};

export function captureUtm(): UtmValues {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = sessionStorage.getItem(storageKey);

    if (raw) {
      const stored: unknown = JSON.parse(raw);

      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        for (const field of Object.values(utmParams)) {
          const value = (stored as Record<string, unknown>)[field];

          if (typeof value === "string") {
            sessionValues[field] = value.slice(0, maxValueLength);
          }
        }
      }
    }
  } catch {
    // sessionStorage may be unavailable or contain invalid JSON.
  }

  const params = new URLSearchParams(window.location.search);

  for (const [queryKey, field] of Object.entries(utmParams) as Array<
    [keyof typeof utmParams, (typeof utmParams)[keyof typeof utmParams]]
  >) {
    const value = params.get(`utm_${queryKey}`)?.trim();

    if (value) {
      sessionValues[field] = value.slice(0, maxValueLength);
    }
  }

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(sessionValues));
  } catch {
    // Keep using the in-memory fallback.
  }

  return { ...sessionValues };
}
