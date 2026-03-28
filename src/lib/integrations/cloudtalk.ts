import { normalizePhoneNumber, buildCloudTalkHref } from "@/lib/phone";

export type CloudTalkDialPayload = {
  phone: string;
  leadId?: string;
  contactId?: string;
};

export function buildCloudTalkDialRequest(payload: CloudTalkDialPayload) {
  const normalizedPhone = normalizePhoneNumber(payload.phone);
  return {
    provider: "cloudtalk-placeholder",
    normalizedPhone,
    href: normalizedPhone ? buildCloudTalkHref(normalizedPhone) : "#",
    apiBaseUrl: process.env.CLOUDTALK_API_BASE_URL || "https://api.cloudtalk.io",
    hasApiKey: Boolean(process.env.CLOUDTALK_API_KEY),
    leadId: payload.leadId ?? null,
    contactId: payload.contactId ?? null,
  };
}

export function buildPlaceholderRecordingUrl(callId: string) {
  const base = process.env.CLOUDTALK_RECORDING_PLACEHOLDER_BASE_URL || "https://cloudtalk-placeholder.local/recordings";
  return `${base}/${callId}`;
}
