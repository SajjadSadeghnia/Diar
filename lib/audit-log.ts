import type { AuditAction, AuditEntityType, Prisma } from "@prisma/client";
import type { PrismaTransaction } from "@/lib/prisma-transaction";
import { prisma } from "@/lib/prisma";

export type WriteAuditLogInput = {
  adminId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
  /** When provided, the audit row is created inside the caller's transaction. */
  tx?: PrismaTransaction;
};

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  return req.headers.get("x-real-ip") ?? undefined;
}

/**
 * Append an admin audit log entry.
 * - With `tx`: participates in the caller transaction (errors propagate).
 * - Without `tx`: best-effort after commit (errors are logged, never thrown).
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const data = {
    adminId: input.adminId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    metadata: input.metadata,
    ipAddress: input.req ? getClientIp(input.req) : undefined,
    userAgent: input.req?.headers.get("user-agent") ?? undefined,
  };

  if (input.tx) {
    await input.tx.auditLog.create({ data });
    return;
  }

  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    console.error("[audit-log] failed to write audit log:", error);
  }
}
