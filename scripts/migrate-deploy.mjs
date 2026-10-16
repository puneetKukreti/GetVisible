/**
 * Applies committed Prisma migrations against the DIRECT (non-pooled) database
 * connection.
 *
 * Neon's pooled endpoint (PgBouncer, transaction mode) cannot run `prisma migrate`
 * because it relies on a session-level advisory lock, so we prefer
 * DATABASE_URL_UNPOOLED (injected by the Vercel/Neon integration) when present.
 *
 * This runs during the Vercel build via `npm run vercel-build`. If no database
 * URL is configured at all the step is skipped so non-database builds keep working.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!directUrl) {
  console.warn('[migrate] No DATABASE_URL(_UNPOOLED) configured — skipping prisma migrate deploy.');
  process.exit(0);
}

const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
const env = { ...process.env, DATABASE_URL: directUrl };

// Recovery step: a previous deploy recorded the initial migration `0000_init` as
// failed (P3018) because the file had been written with a corrupted encoding,
// which blocks every later migration. Mark that failed attempt as rolled back so
// the corrected migration can be applied. This is a harmless no-op once the
// migration has been applied successfully (or was never recorded).
spawnSync(process.execPath, [prismaCli, 'migrate', 'resolve', '--rolled-back', '0000_init'], {
  stdio: 'inherit',
  env,
});

const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
  stdio: 'inherit',
  env,
});

if (result.error) {
  console.error('[migrate] Failed to spawn prisma:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
