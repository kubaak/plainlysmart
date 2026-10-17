import { readFileSync } from "node:fs";
import * as path from "node:path";

export interface StageConfig {
  brevoLeadsListId: number;
  brevoNewsletterListId: number;
  contactSecretName: string;
  contactNotificationEmail: string;
  contactReplyToEmail: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
  bookingUrl: string;
  turnstileHostnames: string[];
}

export function validateStageConfig(value: unknown, source: string): StageConfig {
  const fail = (field: string, reason: string): never => { throw new Error(`${source}: ${field} ${reason}`); };
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("configuration", "must be a JSON object");
  const data = value as Record<string, unknown>;
  const text = (field: string, allowEmpty = false): string => {
    const v = data[field];
    if (typeof v !== "string" || (!allowEmpty && !v) || v.trim() !== v || /[\u0000-\u001f\u007f]/.test(v)) return fail(field, "must be a trimmed string" + (allowEmpty ? "" : " with a value"));
    return v;
  };
  const listId = (field: string): number => {
    const v = data[field];
    if (typeof v !== "number" || !Number.isSafeInteger(v) || v <= 0) return fail(field, "must be a positive safe integer");
    return v;
  };
  const email = (field: string): string => {
    const v = text(field);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail(field, "must be an email address");
    return v;
  };
  const config: StageConfig = {
    brevoLeadsListId: listId("brevoLeadsListId"),
    brevoNewsletterListId: listId("brevoNewsletterListId"),
    contactSecretName: text("contactSecretName"),
    contactNotificationEmail: email("contactNotificationEmail"),
    contactReplyToEmail: email("contactReplyToEmail"),
    brevoSenderEmail: email("brevoSenderEmail"),
    brevoSenderName: text("brevoSenderName"),
    bookingUrl: text("bookingUrl", true),
    turnstileHostnames: [],
  };
  if (config.brevoLeadsListId === config.brevoNewsletterListId) fail("brevoNewsletterListId", "must differ from brevoLeadsListId");
  if (!/^[A-Za-z0-9/_+=.@-]{1,512}$/.test(config.contactSecretName)) fail("contactSecretName", "must be a Secrets Manager name, not an ARN");
  if (config.bookingUrl) {
    try { if (new URL(config.bookingUrl).protocol !== "https:") throw new Error(); }
    catch { fail("bookingUrl", "must be empty or an absolute HTTPS URL"); }
  }
  const hostnames = data.turnstileHostnames;
  if (!Array.isArray(hostnames) || !hostnames.length || hostnames.some(v => typeof v !== "string" || v.length > 253 || !v.split(".").every((label: string) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)))) fail("turnstileHostnames", "must be a non-empty array of hostnames without schemes, paths or ports");
  config.turnstileHostnames = [...hostnames as string[]];
  for (const key of Object.keys(data)) if (!Object.hasOwn(config, key)) fail(key, "is not a supported configuration field");
  return config;
}

export function loadStageConfig(stage: unknown): { stage: string; config: StageConfig } {
  if (typeof stage !== "string" || stage.trim() !== stage || stage.length > 32 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(stage)) {
    throw new Error("stage must be 1-32 lowercase letters, digits or single separating hyphens, starting with a letter");
  }
  const file = path.join(__dirname, "../config", `${stage}.json`);
  let value: unknown;
  try { value = JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { throw new Error(`Cannot load stage '${stage}' configuration ${file}: ${error instanceof Error ? error.message : String(error)}`); }
  return { stage, config: validateStageConfig(value, file) };
}
