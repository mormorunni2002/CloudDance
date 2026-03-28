import { EmailProvider } from "@prisma/client";
import type { EmailProviderClient } from "@/lib/integrations/email/types";
import { PlaceholderGmailClient } from "@/lib/integrations/email/gmail";
import { PlaceholderMicrosoftClient } from "@/lib/integrations/email/outlook";

const gmail = new PlaceholderGmailClient();
const microsoft = new PlaceholderMicrosoftClient();

export function getEmailProviderClient(provider: EmailProvider): EmailProviderClient {
  switch (provider) {
    case EmailProvider.GMAIL:
      return gmail;
    case EmailProvider.MICROSOFT:
      return microsoft;
    default:
      return gmail;
  }
}
