import { EmailProvider } from "@prisma/client";
import type { EmailProviderClient } from "@/lib/integrations/email/types";

export class PlaceholderGmailClient implements EmailProviderClient {
  provider = EmailProvider.GMAIL;

  async connect(_: string, emailAddress: string) {
    return { emailAddress };
  }

  async sync() {
    return {
      status: "synced" as const,
      syncedAt: new Date(),
    };
  }

  async sendMessage() {
    const now = new Date();
    return {
      providerMessageId: `gmail-placeholder-${now.getTime()}`,
      providerThreadId: `gmail-thread-${now.getTime()}`,
      sentAt: now,
      providerStatus: "SIMULATED_PENDING_CREDENTIALS",
    };
  }
}
