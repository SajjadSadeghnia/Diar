# Diar / دیار — Development Workflow

This document defines how work is done on the Diar project. It governs the relationship between the project owner, Claude Desktop (technical lead), and Claude Code (executor).

---

## 1. The Team Structure

```
┌──────────────────────┐
│   Project Owner      │  (Sajjad — decision maker, production access holder)
│   (you)              │
└──────────┬───────────┘
           │ instructs / reviews
           ▼
┌──────────────────────┐
│   Claude Desktop     │  (Technical Lead — architect, planner, reviewer)
│   (AI advisor)       │  Reads docs/ai/, understands full context,
│                      │  generates precise prompts for Claude Code,
│                      │  reviews Claude Code output, provides rollback plans
└──────────┬───────────┘
           │ generates prompts for
           ▼
┌──────────────────────┐
│   Claude Code        │  (Executor — reads files, writes code, runs safe commands)
│   (in terminal/IDE)  │  NEVER deploys. NEVER touches DB. Implements only.
└──────────────────────┘
```

### Owner's Responsibilities
- Define what to build or change
- Provide final approval before any deploy
- Run deploy commands (or explicitly authorize Claude Code to run them)
- Access production server via SSH
- Confirm production changes are working

### Claude Desktop's Responsibilities
- Maintain full context from `docs/ai/`
- Ask clarifying questions before planning
- Generate precise, safe prompts for Claude Code
- Review Claude Code outputs for correctness and safety
- Flag any deviation from business rules
- Provide rollback instructions for every risky change
- Communicate with owner in Persian
- Generate Claude Code prompts in English (for technical precision)

### Claude Code's Responsibilities
- Execute only what is in the prompt
- Read files before modifying
- Not run destructive commands
- Not deploy
- Not touch production database
- Confirm actions before proceeding on ambiguous instructions

---

## 2. The Standard Workflow

### Step 1: Owner describes the request (in Persian)
Example: "می‌خواهم ایمیل کارمند را به پروفایلش اضافه کنم"

### Step 2: Claude Desktop audits first
Before writing any code, Claude Desktop:
1. Reads the relevant source files
2. Understands what already exists
3. Identifies dependencies and risks
4. Checks BUSINESS_RULES.md and DO_NOT_TOUCH.md for conflicts
5. Asks clarifying questions if needed

### Step 3: Claude Desktop plans and explains (in Persian)
Claude Desktop presents:
- What will change
- What files will be modified
- What database changes are needed (migration?)
- What risks exist
- What the rollback plan is
- Estimated scope (small / medium / large)

Owner approves or refines the plan.

### Step 4: Claude Desktop writes the Claude Code prompt (in English)
The prompt must include:
- Exact file paths
- Exact function names to modify
- What NOT to change
- What the expected output looks like
- Any constraints from BUSINESS_RULES.md or DO_NOT_TOUCH.md

### Step 5: Claude Code implements
Claude Code reads the relevant files, makes changes, and reports back. It does not deploy, does not run migrations, does not restart PM2.

### Step 6: Claude Desktop reviews the output
Claude Desktop:
1. Asks to see the diff or changed files
2. Verifies the implementation matches the plan
3. Checks for regressions in business rules
4. Verifies no DO_NOT_TOUCH rules were violated
5. Approves or requests corrections

### Step 7: Owner tests locally (if applicable)
```bash
npm run dev
```
Tests the change in the browser before deploying.

### Step 8: Deploy (owner-initiated)
Only after review and local test:
```bash
git add -p       # Stage only relevant changes
git commit -m "..."
git push origin main
# GitHub Actions deploys automatically, or:
# ssh deploy@165.245.245.149
# cd /var/www/diar/app && bash scripts/deploy.sh
```

### Step 9: Verify on production
Owner confirms the feature works on `http://165.245.245.149` (or the domain once connected).

---

## 3. Rules for Modifying Files

### Always Read Before Editing
Claude Code must read the file before modifying it. Blind edits based on assumed structure cause bugs.

### One Thing at a Time
Do not combine unrelated changes in a single commit. Keep each change focused.

### Follow the Existing Patterns
- API routes use `getCurrentUser()` for auth checks.
- Business logic lives in `lib/`, not in route handlers.
- Database access goes through `prisma` client from `lib/prisma.ts`.
- Constants like `MAX_STAY_DAYS`, `COOLDOWN_DAYS`, etc. are in `lib/booking-utils.ts`. Change them there only.

### Do Not Modify These Files Without Explicit Plan Approval
(See DO_NOT_TOUCH.md for the full list)
- `lib/booking-lifecycle.ts`
- `lib/booking-utils.ts`
- `prisma/schema.prisma`
- `proxy.ts` (or any future middleware.ts)
- `scripts/deploy.sh`

### Migration Rules
- Any schema change requires a new migration file: `npx prisma migrate dev --name describe-the-change`
- Never use `prisma db push` — it bypasses migration history.
- Always test migrations locally with dev database before deploying.
- Production migration runs automatically via `deploy.sh` (`prisma migrate deploy`).

---

## 4. Rules for Database Changes

| Operation | Allowed | Who Runs It | When |
|-----------|---------|-------------|------|
| `prisma migrate dev` | Yes (dev only) | Owner on local machine | When adding/changing schema |
| `prisma migrate deploy` | Yes | deploy.sh (automatic) | Every deploy |
| `prisma generate` | Yes | deploy.sh (automatic) | Every deploy |
| `prisma db push` | **NEVER** | — | — |
| `prisma migrate reset` | **NEVER on prod** | — | — |
| `prisma db seed` | Dev only | Owner on local machine | Dev setup only |
| `bootstrap:production` | Production (once) | Owner via SSH | First-time setup only |

---

## 5. Local Development Setup

```bash
npm install
cp .env.example .env
# Edit .env: add DATABASE_URL pointing to local Postgres
docker compose up -d   # Starts local PostgreSQL
npm run prisma:migrate
npm run prisma:seed    # DEV ONLY — never on production
npm run dev
```

Dev login credentials (after seed):
- Admin: `09120000000` / `12345678`
- Employee: `09121111111` / `12345678`

The dev server runs at http://localhost:3000.

---

## 6. Common Development Tasks

### Adding a new field to the database
1. Edit `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name add-field-name`
3. Update relevant `lib/` files
4. Update relevant API routes
5. Update relevant UI components
6. Test locally
7. Deploy (migration runs automatically)

### Adding a new page
1. Create `app/[route]/page.tsx`
2. Add auth check at the top: `const user = await getCurrentUser(); if (!user) redirect("/login");`
3. Add role check if needed: `if (user.role !== "admin") redirect("/");`
4. Update proxy.ts middleware if needed (new protected route)

### Adding a new API route
1. Create `app/api/[route]/route.ts`
2. First thing in every handler: authenticate with `getCurrentUser()` or `getUserFromRequest()`
3. Return 401 for unauthenticated, 403 for unauthorized role
4. Use Zod for input validation

### Importing more employees
```bash
# On the server:
npx tsx scripts/import-employees.ts /path/to/employees.csv --dry-run  # Preview first
npx tsx scripts/import-employees.ts /path/to/employees.csv            # Apply
```
CSV format: `name,phone,password` with header row.

---

## 7. Git Conventions

- Branch: work on `main` (small project, no feature branches needed unless the change is large/risky)
- Commit messages: concise English, describe what changed and why if non-obvious
- Do not force-push to main
- Do not commit: `.env`, `node_modules/`, `*.dump`, `LOGIN_CREDENTIALS.md`

---

## 8. Testing

There is no automated test suite currently. Testing is manual:

1. **Dev server test:** Run `npm run dev`, test the feature in browser
2. **Edge cases:** Test the specific edge cases from BUSINESS_RULES.md
3. **Cross-role test:** Test as admin AND as employee
4. **Production smoke test:** After deploy, verify `curl -I http://165.245.245.149/login` returns 200

Future: Consider adding Playwright E2E tests for the booking flow.
