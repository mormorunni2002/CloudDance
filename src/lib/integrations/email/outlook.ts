import { EmailProvider } from "@prisma/client";
import type { EmailProviderClient } from "@/lib/integrations/email/types";

export class PlaceholderMicrosoftClient implements EmailProviderClient {
  provider = EmailProvider.MICROSOFT;

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
      providerMessageId: `microsoft-placeholder-${now.getTime()}`,
      providerThreadId: `microsoft-thread-${now.getTime()}`,
      sentAt: now,
      providerStatus: "SIMULATED_PENDING_CREDENTIALS",
    };
  }
}
