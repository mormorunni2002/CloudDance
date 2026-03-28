import { cleanString } from "@/lib/utils";

export function normalizePhoneNumber(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;

  const hasPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/[^\d]/g, "");

  if (!digits) return null;

  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export function formatPhoneDisplay(value: unknown) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return null;

  if (normalized.startsWith("+1") && normalized.length === 12) {
    const local = normalized.slice(2);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return normalized;
}

export function buildCloudTalkHref(phone: string) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "#";

  const template = process.env.CLOUDTALK_CLICK_TO_CALL_URL_TEMPLATE?.trim() || "tel:{phone}";
  return template.replace("{phone}", normalized);
}
