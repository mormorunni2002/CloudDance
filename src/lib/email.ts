import {
  ActivityType,
  EmailProvider,
  OAuthProvider,
  OAuthStatus,
  SyncStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createLeadActivity } from "@/lib/activity";
import { getEmailProviderClient } from "@/lib/integrations/email";

function providerToOAuthProvider(provider: EmailProvider): OAuthProvider {
  return provider === EmailProvider.GMAIL ? OAuthProvider.GOOGLE : OAuthProvider.MICROSOFT;
}

export async function connectPlaceholderEmailAccount({
  userId,
  provider,
  emailAddress,
  displayName,
}: {
  userId: string;
  provider: EmailProvider;
  emailAddress: string;
  displayName?: string | null;
}) {
  const client = getEmailProviderClient(provider);
  const connectionEmail = emailAddress.toLowerCase();

  const oauthConnection = await prisma.oAuthConnection.upsert({
    where: {
      userId_provider: {
        userId,
        provider: providerToOAuthProvider(provider),
      },
    },
    update: {
      status: OAuthStatus.CONNECTED,
      emailAddress: connectionEmail,
      accessToken: "placeholder-access-token",
      refreshToken: "placeholder-refresh-token",
      scope:
        provider === EmailProvider.GMAIL
          ? "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
          : "Mail.ReadWrite Mail.Send Contacts.ReadWrite Calendars.ReadWrite",
      meta: {
        mode: "placeholder",
      },
    },
    create: {
      userId,
      provider: providerToOAuthProvider(provider),
      status: OAuthStatus.CONNECTED,
      emailAddress: connectionEmail,
      accessToken: "placeholder-access-token",
      refreshToken: "placeholder-refresh-token",
      scope:
        provider === EmailProvider.GMAIL
          ? "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
          : "Mail.ReadWrite Mail.Send Contacts.ReadWrite Calendars.ReadWrite",
      meta: {
        mode: "placeholder",
      },
    },
  });

  const result = await client.connect(userId, connectionEmail, displayName ?? null);

  return prisma.emailAccount.upsert({
    where: {
      provider_emailAddress: {
        provider,
        emailAddress: result.emailAddress.toLowerCase(),
      },
    },
    update: {
      userId,
      displayName: displayName ?? null,
      oauthConnectionId: oauthConnection.id,
      syncStatus: SyncStatus.IDLE,
    },
    create: {
      userId,
      provider,
      emailAddress: result.emailAddress.toLowerCase(),
      displayName: displayName ?? null,
      oauthConnectionId: oauthConnection.id,
      syncStatus: SyncStatus.IDLE,
    },
  });
}

export async function syncPlaceholderEmailAccount({
  accountId,
  actingUserId,
}: {
  accountId: string;
  actingUserId: string;
}) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Email account not found.");
  }

  const client = getEmailProviderClient(account.provider);
  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      syncStatus: SyncStatus.SYNCING,
    },
  });

  const result = await client.sync(accountId);

  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      syncStatus: SyncStatus.IDLE,
      lastSyncedAt: result.syncedAt,
    },
  });

  return result;
}

export async function sendPlaceholderLeadEmail({
  leadId,
  accountId,
  to,
  cc,
  bcc,
  subject,
  bodyText,
  threadId,
  actingUserId,
}: {
  leadId: string;
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText: string;
  threadId?: string | null;
  actingUserId: string;
}) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error("Email account not found.");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  const client = getEmailProviderClient(account.provider);
  const sendResult = await client.sendMessage({
    accountId,
    leadId,
    to,
    cc,
    bcc,
    subject,
    bodyText,
    threadId,
  });

  const emailThread =
    threadId &&
    (await prisma.emailThread.findUnique({
      where: { id: threadId },
    }));

  const thread =
    emailThread ||
    (await prisma.emailThread.create({
      data: {
        emailAccountId: account.id,
        leadId,
        provider: account.provider,
        providerThreadId: sendResult.providerThreadId,
        subject,
        snippet: bodyText.slice(0, 180),
        lastMessageAt: sendResult.sentAt,
      },
    }));

  const message = await prisma.emailMessage.create({
    data: {
      threadId: thread.id,
      leadId,
      emailAccountId: account.id,
      providerMessageId: sendResult.providerMessageId,
      direction: "OUTBOUND",
      fromAddress: account.emailAddress,
      toAddresses: to,
      ccAddresses: cc ?? [],
      bccAddresses: bcc ?? [],
      subject,
      bodyText,
      sentAt: sendResult.sentAt,
      providerStatus: sendResult.providerStatus,
    },
  });

  await prisma.emailThread.update({
    where: { id: thread.id },
    data: {
      snippet: bodyText.slice(0, 180),
      lastMessageAt: sendResult.sentAt,
      providerThreadId: thread.providerThreadId || sendResult.providerThreadId,
    },
  });

  await createLeadActivity({
    leadId,
    userId: actingUserId,
    type: ActivityType.EMAIL_SENT,
    summary: `Sent placeholder ${account.provider.toLowerCase()} email to ${to.join(", ")}.`,
    detail: {
      accountId: account.id,
      emailThreadId: thread.id,
      emailMessageId: message.id,
    },
  });

  return { threadId: thread.id, messageId: message.id };
}

export async function getUserEmailAccounts(userId: string) {
  return prisma.emailAccount.findMany({
    where: { userId },
    include: { oauthConnection: true },
    orderBy: [{ provider: "asc" }, { emailAddress: "asc" }],
  });
}

export async function getAllEmailAccounts() {
  return prisma.emailAccount.findMany({
    include: { user: true, oauthConnection: true },
    orderBy: [{ provider: "asc" }, { emailAddress: "asc" }],
  });
}
