/**
 * Import employee users from CSV.
 *
 * Columns: name,phone,password
 * - Skips duplicate phone numbers (does not update existing users)
 * - Does NOT delete any users
 *
 * Usage:
 *   npx tsx scripts/import-employees.ts employees.csv
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { isValidPhone, normalizePhone } from "../lib/phone";

const prisma = new PrismaClient();

type Row = { name: string; phone: string; password: string };

function parseCsv(content: string): Row[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.indexOf("name");
  const phoneIdx = header.indexOf("phone");
  const passwordIdx = header.indexOf("password");

  if (phoneIdx === -1 || passwordIdx === -1 || nameIdx === -1) {
    throw new Error("CSV must have header: name,phone,password");
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 3) continue;

    const name = cols[nameIdx];
    const phone = normalizePhone(cols[phoneIdx]);
    const password = cols[passwordIdx];

    if (!name || !phone || !password) continue;
    if (!isValidPhone(phone)) {
      console.warn(`SKIP (invalid phone): ${cols[phoneIdx]}`);
      continue;
    }
    rows.push({ name, phone, password });
  }
  return rows;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--dry-run");
  const dryRun = process.argv.includes("--dry-run");
  const fileArg = args[0];

  if (!fileArg) {
    console.error("Usage: npx tsx scripts/import-employees.ts <path-to.csv> [--dry-run]");
    process.exit(1);
  }

  if (dryRun) {
    console.log("DRY RUN — no database writes.\n");
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(filePath, "utf-8"));
  if (rows.length === 0) {
    console.log("No data rows found.");
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const exists = await prisma.user.findUnique({ where: { phone: row.phone } });
      if (exists) {
        console.log(`SKIP (exists): ${row.phone}`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`WOULD CREATE: ${row.phone} (${row.name})`);
        created++;
        continue;
      }

      const hashed = await bcrypt.hash(row.password, 10);
      await prisma.user.create({
        data: {
          name: row.name,
          phone: row.phone,
          password: hashed,
          role: Role.employee,
        },
      });
      console.log(`CREATED: ${row.phone} (${row.name})`);
      created++;
    } catch (e) {
      console.error(`FAILED: ${row.phone}`, e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log(`\nImport summary${dryRun ? " (dry run)" : ""}:`);
  console.log(`  ${dryRun ? "would create" : "created"}: ${created}`);
  console.log(`  skipped: ${skipped}`);
  console.log(`  failed:  ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
