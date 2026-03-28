import { buildCloudTalkHref, formatPhoneDisplay } from "@/lib/phone";

export function PhoneLink({ phone }: { phone: string | null | undefined }) {
  if (!phone) return <span className="text-muted">—</span>;

  return (
    <a
      href={buildCloudTalkHref(phone)}
      className="inline-flex items-center rounded-lg border border-brand/20 bg-brand/5 px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/10"
      title="Click to call with CloudTalk placeholder integration"
    >
      {formatPhoneDisplay(phone) || phone}
    </a>
  );
}
