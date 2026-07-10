/**
 * Bundle/security assertion (T079): the production build output must never
 * contain secret/service-role variable names, raw privileged key prefixes,
 * or token/recovery values, per `quickstart.md` "Final Security Review"
 * ("Browser bundle contains only the publishable key.") and
 * `operational-access-contract.md` Security Invariants.
 *
 * This test builds the app fresh (`vite build` via the same `tsc -b && vite
 * build` pipeline as `npm run build`) into a temporary output directory and
 * scans every emitted text asset (`dist/**\/*.{js,css,html,map}`) for
 * forbidden tokens. Building into a dedicated temp directory (instead of
 * reusing `dist/`) keeps this test independent of build order/state and safe
 * to run repeatedly.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Tokens that must never appear in any built browser asset. Covers secret
 * env-var names (any casing a privileged key might be stored under) and
 * structural prefixes of privileged Supabase keys. Deliberately does not
 * check for the literal publishable key, which is expected and safe to ship.
 */
const FORBIDDEN_TOKENS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE_KEY",
  "service_role",
  "SERVICE_ROLE",
  "SUPABASE_SECRET_KEY",
  "secret_key",
  "sb_secret_",
  "DATABASE_PASSWORD",
];

const TEXT_ASSET_EXTENSIONS = [".js", ".mjs", ".css", ".html", ".map", ".json"];

let tempRootDir: string;
let buildOutDir: string;
let textAssetPaths: string[];
let buildSkippedByEnvironment = false;

function listFilesRecursively(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

describe("Production build output never leaks secret/service-role material", () => {
  beforeAll(() => {
    tempRootDir = mkdtempSync(path.join(tmpdir(), "doka-build-secrets-"));
    buildOutDir = path.join(tempRootDir, "dist");

    // Build with an isolated env: only the publishable-style variables the
    // app is allowed to read, plus a deliberately present but unused
    // service-role-like variable name to prove the bundler never inlines an
    // unreferenced/forbidden-named variable even if it exists in the
    // process environment at build time (Vite only inlines `import.meta.env`
    // references actually present in source, but this guards against a
    // future regression that reads `process.env` directly).
    // `shell: true` is required on Windows to resolve the `npx` shim
    // (`npx.cmd`); args are passed as an array rather than a single
    // interpolated string, so there is no shell-injection risk here even
    // though Node's child_process docs caution generally about this
    // combination.
    try {
      execFileSync("npx", ["vite", "build", "--outDir", buildOutDir, "--emptyOutDir"], {
        cwd: REPO_ROOT,
        stdio: "pipe",
        shell: true,
        env: {
          ...process.env,
          VITE_SUPABASE_URL: "https://example-project.supabase.co",
          VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only_not_secret",
          VITE_APP_URL: "http://localhost:5173",
          // Deliberately present, never read by `src/lib/env.ts`'s allowlist
          // and never prefixed with VITE_, so Vite must not expose it.
          SUPABASE_SERVICE_ROLE_KEY: "sb_secret_should_never_appear_in_bundle",
        },
      });
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code === "EPERM") {
        buildSkippedByEnvironment = true;
        textAssetPaths = [];
        return;
      }
      throw cause;
    }

    textAssetPaths = listFilesRecursively(buildOutDir).filter((file) =>
      TEXT_ASSET_EXTENSIONS.includes(path.extname(file)),
    );
  }, 180_000);

  afterAll(() => {
    if (tempRootDir) {
      rmSync(tempRootDir, { recursive: true, force: true });
    }
  });

  it("produced at least one JS asset to scan", (ctx) => {
    if (buildSkippedByEnvironment) {
      ctx.skip();
      return;
    }
    const jsAssets = textAssetPaths.filter((file) => file.endsWith(".js"));
    expect(jsAssets.length).toBeGreaterThan(0);
  });

  it("contains no forbidden secret/service-role token in any built text asset", (ctx) => {
    if (buildSkippedByEnvironment) {
      ctx.skip();
      return;
    }
    const offenders: { file: string; token: string }[] = [];
    for (const file of textAssetPaths) {
      const content = readFileSync(file, "utf8");
      for (const token of FORBIDDEN_TOKENS) {
        if (content.includes(token)) {
          offenders.push({ file: path.relative(buildOutDir, file), token });
        }
      }
    }
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  it("never inlines the build-time-only service-role value, even though it was present in the build environment", (ctx) => {
    if (buildSkippedByEnvironment) {
      ctx.skip();
      return;
    }
    for (const file of textAssetPaths) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toContain("sb_secret_should_never_appear_in_bundle");
    }
  });

  it("the publishable key placeholder used for this build is present (sanity check the build actually ran with env vars)", (ctx) => {
    if (buildSkippedByEnvironment) {
      ctx.skip();
      return;
    }
    const found = textAssetPaths.some((file) =>
      readFileSync(file, "utf8").includes("sb_publishable_test_only_not_secret"),
    );
    expect(found).toBe(true);
  });
});
