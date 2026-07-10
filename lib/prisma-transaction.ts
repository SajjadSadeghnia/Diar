import type { PrismaClient } from "@prisma/client";

/** Prisma interactive transaction client (pass as `tx` to helpers). */
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
