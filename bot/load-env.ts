import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Must be the very first import in index.ts: `import` statements are
// hoisted and run before any other top-level code in the importing file,
// so a loadEnvFile() call placed "above" the other imports in index.ts
// would still run *after* their module bodies (e.g. supabase.ts reading
// process.env at import time) — only isolating the side effect in its own
// first-imported module guarantees it runs before anything that needs it.
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
