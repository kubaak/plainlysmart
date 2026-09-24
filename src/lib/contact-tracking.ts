const utmFields = [
  { query: "utm_source", field: "utmSource" },
  { query: "utm_medium", field: "utmMedium" },
  { query: "utm_campaign", field: "utmCampaign" },
  { query: "utm_content", field: "utmContent" },
  { query: "utm_term", field: "utmTerm" },
] as const;

type UtmField = (typeof utmFields)[number]["field"];

type UtmValues = Partial<Record<UtmField, string>>;

const storageKey = "plainlysmart.utm";
const maxValueLength = 200;

const sessionValues: UtmValues = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function captureUtm(): UtmValues {
  if (typeof window === "undefined") {
    return {};
  }

  restoreStoredValues();
  captureUrlValues();
  persistValues();

  return { ...sessionValues };
}

function restoreStoredValues() {
  try {
    const raw = sessionStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    const stored: unknown = JSON.parse(raw);

    if (!isRecord(stored)) {
      return;
    }

    for (const { field } of utmFields) {
      const value = stored[field];

      if (typeof value === "string") {
        sessionValues[field] = value.slice(0, maxValueLength);
      }
    }
  } catch {
    // sessionStorage may be unavailable or contain invalid JSON.
  }
}

function captureUrlValues() {
  const params = new URLSearchParams(window.location.search);

  for (const { query, field } of utmFields) {
    const value = params.get(query)?.trim();

    if (value) {
      sessionValues[field] = value.slice(0, maxValueLength);
    }
  }
}

function persistValues() {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(sessionValues));
  } catch {
    // Keep using the in-memory fallback.
  }
}
