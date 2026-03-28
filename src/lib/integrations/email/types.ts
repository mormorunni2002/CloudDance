import type { EmailProvider } from "@prisma/client";

export type PlaceholderEmailThread = {
  threadId: string;
  subject: string;
  snippet: string;
  lastMessageAt: Date;
};

export interface EmailProviderClient {
  provider: EmailProvider;
  connect(userId: string, emailAddress: string, displayName?: string | null): Promise<{ emailAddress: string }>;
  sync(accountId: string): Promise<{ status: "synced"; syncedAt: Date }>;
  sendMessage(input: {
    accountId: string;
    leadId: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyText: string;
    threadId?: string | null;
  }): Promise<{
    providerMessageId: string;
    providerThreadId: string;
    sentAt: Date;
    providerStatus: string;
  }>;
}
