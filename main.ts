/**
 * Leonida Trophy Guide — entry program (make.fun program/v1).
 *
 * What it does, in plain terms: it takes the guide that lives in this
 * repository (app/ and screenshots/), copies both into the output
 * directory, checks the trophy data and the screenshots look sane, and
 * writes output/dossier.json with the kit's buildDossier library.
 *
 * It runs on Node 22 with the standard library only. Outside the grader,
 * MAKEFUN_OUTPUT_DIR stands in for /output. Run it twice and the bytes
 * in the output directory are the same both times.
 */

import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

/** The repository root: the folder this file lives in. */
const REPO_ROOT = dirname(fileURLToPath(import.meta.url));

/** Where the entry goes: the grader's /output, or MAKEFUN_OUTPUT_DIR locally. */
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

/** The caps this bounty holds the entry to (RULES.txt, "The gate"). */
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

/** Trophy names the gate checks for (official list, 55 trophies). */
const EXPECTED_TROPHY_COUNT = 55;

/** Small log helper so a run's progress is visible without touching output. */
function logLine(message: string): void {
  const stamp = new Date().toISOString();
  process.stdout.write(`[leonida-guide ${stamp}] ${message}\n`);
}

/**
 * Copy one directory tree into another, file by file, creating folders as
 * needed. Symbolic links are refused: the gate only accepts plain files.
 */
async function copyTree(sourceDir: string, targetDir: string): Promise<number> {
  await mkdir(targetDir, { recursive: true });
  let copied = 0;
  const entries = await readdir(sourceDir, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = join(sourceDir, entry.name);
    const to = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copied += await copyTree(from, to);
    } else if (entry.isFile()) {
      await copyFile(from, to);
      copied += 1;
    } else {
      throw new Error(`copyTree: refusing non-regular entry ${from}`);
    }
  }
  return copied;
}

/**
 * Read app/data/trophies.json and check it holds the full official list:
 * 55 trophies, each with a name and a non-blank guide. This is the same
 * shape the gate checks, so a mistake here fails loudly before submitting.
 */
async function checkTrophyData(appDir: string): Promise<void> {
  const raw = await readFile(join(appDir, "data", "trophies.json"), "utf8");
  const data = JSON.parse(raw) as {
    trophies?: Array<{ name?: unknown; guide?: unknown }>;
  };
  const trophies = data.trophies ?? [];
  if (trophies.length !== EXPECTED_TROPHY_COUNT) {
    throw new Error(
      `checkTrophyData: expected ${EXPECTED_TROPHY_COUNT} trophies, found ${trophies.length}`,
    );
  }
  const broken = trophies.filter(
    (t) => typeof t.name !== "string" || !t.name.trim() || typeof t.guide !== "string" || !t.guide.trim(),
  );
  if (broken.length > 0) {
    throw new Error(`checkTrophyData: ${broken.length} trophies lack a name or a guide`);
  }
  logLine(`trophy data OK: ${trophies.length} trophies, every one with a guide`);
}

/** Check the copied app tree has an entry page before buildDossier runs. */
async function checkAppShell(appDir: string): Promise<void> {
  const info = await stat(join(appDir, "index.html"));
  if (!info.isFile()) {
    throw new Error("checkAppShell: app/index.html is not a regular file");
  }
  logLine("app shell OK: app/index.html present");
}

/** Check screenshots/ holds 3 or 4 PNG/JPEG files within the size cap. */
async function checkScreenshots(shotsDir: string): Promise<string[]> {
  const entries = (await readdir(shotsDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
  if (entries.length < 3 || entries.length > 4) {
    throw new Error(`checkScreenshots: expected 3 or 4 screenshots, found ${entries.length}`);
  }
  for (const name of entries) {
    const info = await stat(join(shotsDir, name));
    if (info.size > DOSSIER_CAPS.screenshots.max_bytes) {
      throw new Error(`checkScreenshots: ${name} is ${info.size} bytes, over the 256 KiB cap`);
    }
  }
  logLine(`screenshots OK: ${entries.join(", ")}`);
  return entries;
}

/** Empty the output directory so a stale file can never leak into an entry. */
async function cleanOutput(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function main(): Promise<void> {
  logLine(`building from ${REPO_ROOT} into ${OUTPUT_DIR}`);
  await cleanOutput(OUTPUT_DIR);

  const appCopied = await copyTree(join(REPO_ROOT, "app"), join(OUTPUT_DIR, "app"));
  const shotsCopied = await copyTree(join(REPO_ROOT, "screenshots"), join(OUTPUT_DIR, "screenshots"));
  logLine(`copied ${appCopied} app files and ${shotsCopied} screenshots`);

  await checkTrophyData(join(OUTPUT_DIR, "app"));
  await checkAppShell(join(OUTPUT_DIR, "app"));
  await checkScreenshots(join(OUTPUT_DIR, "screenshots"));

  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  await writeFile(join(OUTPUT_DIR, "dossier.json"), dossier);
  logLine(`dossier.json written (${dossier.byteLength} bytes)`);
  logLine("build complete");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[leonida-guide] build failed: ${message}\n`);
  process.exit(1);
});
