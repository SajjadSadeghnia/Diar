import type { NotificationType, Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import type { PrismaTransaction } from "@/lib/prisma-transaction";
import { prisma } from "@/lib/prisma";

export type CreateUserNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  bookingId?: string;
  actionUrl?: string;
  dedupeKey?: string;
  metadata?: Prisma.InputJsonValue;
  /** When provided, the notification is created inside the caller's transaction. */
  tx?: PrismaTransaction;
};

function isDedupeViolation(error: unknown): boolean {
  return (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Persist an in-app notification.
 * - With `tx`: participates in the caller transaction (errors propagate; rollback removes the row).
 * - Without `tx`: best-effort after commit (errors are logged, never thrown).
 */
export async function createUserNotification(input: CreateUserNotificationInput): Promise<void> {
  const client = input.tx ?? prisma;
  const data = {
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    bookingId: input.bookingId,
    actionUrl: input.actionUrl,
    dedupeKey: input.dedupeKey,
    metadata: input.metadata,
  };

  if (input.tx) {
    await client.notification.create({ data });
    return;
  }

  try {
    await client.notification.create({ data });
  } catch (error) {
    if (isDedupeViolation(error)) return;
    console.error("[notification-service] failed to create notification:", error);
  }
}
