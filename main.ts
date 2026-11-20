// Leonida Trophy Guide — entrypoint (Node 22+, standard library only).
//
// Pipeline:
//   1. Load app/data/trophies.json and check it end to end: exactly 55
//      trophies, split 1 platinum / 2 gold / 6 silver / 46 bronze, 28
//      hidden, 14 missable, unique non-empty names, every trophy carrying
//      its official description, a guide of its own, a roadmap stage
//      (1-5), at least one step and at least one cited source.
//   2. Copy app/ and screenshots/ into the output directory
//      (/output by default, MAKEFUN_OUTPUT_DIR elsewhere).
//   3. Build /output/dossier.json with the vendored make.fun library
//      (vendor/makefun-frontend.ts, the kit's copy, untouched), so the
//      dossier is exactly what the scorer rebuilds.
//
// Usage:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide itself with any static server pointed at app/.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const trophiesPath = join(root, "app", "data", "trophies.json");

const EXPECTED = { total: 55, platinum: 1, gold: 2, silver: 6, bronze: 46, hidden: 28, missable: 14 };

type Trophy = {
  name?: unknown;
  description?: unknown;
  grade?: unknown;
  guide?: unknown;
  hidden?: unknown;
  missable?: unknown;
  stage?: unknown;
  steps?: unknown;
  sources?: unknown;
};

function abort(reason: string): never {
  console.error("main.ts: " + reason);
  process.exit(1);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function loadTrophies(): Trophy[] {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(trophiesPath, "utf8"));
  } catch (err) {
    abort("app/data/trophies.json is not valid JSON: " + (err as Error).message);
  }
  const trophies = (raw as { trophies?: unknown }).trophies;
  if (!Array.isArray(trophies)) abort('trophies.json must be an object with a "trophies" array');
  if (trophies.length !== EXPECTED.total) {
    abort("expected " + EXPECTED.total + " trophies, found " + trophies.length);
  }

  const grades: Record<string, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const stages: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let hidden = 0;
  let missable = 0;
  const names = new Set<string>();

  for (const trophy of trophies as Trophy[]) {
    if (!hasText(trophy.name)) abort("a trophy has no name");
    if (names.has(trophy.name)) abort("duplicate trophy name: " + trophy.name);
    names.add(trophy.name);
    if (!hasText(trophy.description)) abort(trophy.name + ": no official description");
    if (!hasText(trophy.guide)) abort(trophy.name + ": no guide text");
    if (typeof trophy.grade !== "string" || !(trophy.grade in grades)) {
      abort(trophy.name + ": grade must be platinum, gold, silver or bronze");
    }
    grades[trophy.grade] += 1;
    if (trophy.hidden === true) hidden += 1;
    if (trophy.missable === true) missable += 1;
    if (typeof trophy.stage !== "number" || !(trophy.stage in stages)) {
      abort(trophy.name + ": roadmap stage must be 1-5");
    }
    stages[trophy.stage] += 1;
    if (!Array.isArray(trophy.steps) || trophy.steps.length === 0) {
      abort(trophy.name + ": guide needs at least one step");
    }
    if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) {
      abort(trophy.name + ": guide needs at least one cited source");
    }
  }

  const split = grades.platinum + "/" + grades.gold + "/" + grades.silver + "/" + grades.bronze;
  if (grades.platinum !== EXPECTED.platinum || grades.gold !== EXPECTED.gold ||
      grades.silver !== EXPECTED.silver || grades.bronze !== EXPECTED.bronze) {
    abort("grade split must be 1/2/6/46 (platinum/gold/silver/bronze), found " + split);
  }
  if (hidden !== EXPECTED.hidden) abort("expected 28 hidden trophies, found " + hidden);
  if (missable !== EXPECTED.missable) abort("expected 14 missable trophies, found " + missable);

  console.log("trophies: 55 (" + split + " platinum/gold/silver/bronze, hidden " + hidden + ", missable " + missable + ")");
  console.log("roadmap stages: " + [1, 2, 3, 4, 5].map((s) => "stage " + s + ": " + stages[s]).join(", "));
  return trophies as Trophy[];
}

function copyIfPresent(source: string, target: string): void {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function screenshotCount(): number {
  const dir = join(root, "screenshots");
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((name) => /\.(png|jpe?g)$/i.test(name)).length;
}

function checkShotsFile(): void {
  // shots.json must describe exactly the screenshots on disk: every
  // listed file has to exist, and no screenshot may go undescribed.
  const shotsPath = join(root, "shots.json");
  if (!existsSync(shotsPath)) abort("shots.json is missing");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(shotsPath, "utf8"));
  } catch (err) {
    abort("shots.json is not valid JSON: " + (err as Error).message);
  }
  const shots = (parsed as { shots?: unknown }).shots;
  if (!Array.isArray(shots) || shots.length === 0) abort("shots.json must list at least one screenshot");
  const onDisk = new Set(readdirSync(join(root, "screenshots")));
  for (const shot of shots as { file?: unknown; view?: unknown; caption?: unknown }[]) {
    if (typeof shot.file !== "string" || !onDisk.has(shot.file)) {
      abort("shots.json lists " + String(shot.file) + ", which is not in screenshots/");
    }
    if (typeof shot.view !== "string" || !shot.view) abort("shots.json entry " + shot.file + " has no view");
    if (typeof shot.caption !== "string" || !shot.caption) abort("shots.json entry " + shot.file + " has no caption");
  }
  const listed = new Set((shots as { file: string }[]).map((s) => s.file));
  for (const file of onDisk) {
    if (/\.(png|jpe?g)$/i.test(file) && !listed.has(file)) {
      abort("screenshots/" + file + " is not described in shots.json");
    }
  }
  console.log("shots.json: " + shots.length + " screenshots described, all present on disk");
}

const trophies = loadTrophies();

const shots = screenshotCount();
if (shots === 0) {
  abort("screenshots/ is empty — capture 3 or 4 screenshots of the app first (see shots.json), then run again.");
}
if (shots > 4) abort("screenshots/ holds " + shots + " images; at most 4 are allowed.");
console.log("screenshots: " + shots);
checkShotsFile();

mkdirSync(outDir, { recursive: true });
copyIfPresent(join(root, "app"), join(outDir, "app"));
copyIfPresent(join(root, "screenshots"), join(outDir, "screenshots"));

// Scorer caps: text_max_bytes shapes the bytes; the rest mirror what the
// scorer refuses (a screenshot over 256 KiB or more than 4 of them; more
// than 993 files/dirs in app/, or 48 MiB of app bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log("trophies validated: " + trophies.length);
console.log("dossier.json written: " + statSync(join(outDir, "dossier.json")).size + " bytes -> " + join(outDir, "dossier.json"));
console.log("done.");
