// GTA 6 trophy guide — entrypoint (Node 22+, standard library only).
//
// What it does, in order:
//   1. Reads app/data/trophies.json and validates the whole list:
//      55 trophies, 1 platinum / 2 gold / 6 silver / 46 bronze,
//      28 hidden, 14 missable, every trophy with a non-empty name,
//      official description and guide of its own, no duplicate names.
//   2. Copies app/ and screenshots/ beside this file into the output
//      directory (/output, or MAKEFUN_OUTPUT_DIR outside the grader).
//   3. Writes /output/dossier.json with the vendored make.fun library,
//      so the dossier is byte for byte what the scorer rebuilds.
//      vendor/makefun-frontend.ts is the kit's copy, unchanged.
//
// Run it:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with any static server pointed at app/.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const dataPath = join(here, "app", "data", "trophies.json");

type Trophy = {
  name?: unknown;
  description?: unknown;
  grade?: unknown;
  guide?: unknown;
  hidden?: unknown;
  missable?: unknown;
  kind?: unknown;
  stage?: unknown;
  steps?: unknown;
  sources?: unknown;
  counter?: unknown;
};

function fail(message: string): never {
  console.error("main.ts: validation failed: " + message);
  process.exit(1);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateTrophies(): Trophy[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(dataPath, "utf8"));
  } catch (err) {
    fail("app/data/trophies.json is not valid JSON: " + (err as Error).message);
  }
  const list = (parsed as { trophies?: unknown }).trophies;
  if (!Array.isArray(list)) fail('trophies.json must hold an object with a "trophies" array');
  if (list.length !== 55) fail("expected 55 trophies, found " + list.length);

  const grades: Record<string, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  let missable = 0;
  const seen = new Set<string>();
  for (const item of list as Trophy[]) {
    if (!isNonEmptyText(item.name)) fail("a trophy is missing its name");
    if (seen.has(item.name)) fail("duplicate trophy name: " + item.name);
    seen.add(item.name);
    if (!isNonEmptyText(item.description)) fail(item.name + ": missing official description");
    if (!isNonEmptyText(item.guide)) fail(item.name + ": missing guide text");
    if (typeof item.grade !== "string" || !(item.grade in grades)) {
      fail(item.name + ": grade must be platinum, gold, silver or bronze");
    }
    grades[item.grade as string] += 1;
    if (item.hidden === true) hidden += 1;
    if (item.missable === true) missable += 1;
    if (typeof item.stage !== "number" || item.stage < 1 || item.stage > 5) {
      fail(item.name + ": roadmap stage must be 1-5");
    }
    if (!Array.isArray(item.steps) || item.steps.length === 0) {
      fail(item.name + ": guide needs at least one step");
    }
    if (!Array.isArray(item.sources) || item.sources.length === 0) {
      fail(item.name + ": guide needs at least one cited source");
    }
  }
  if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
    fail(
      "grade split must be 1 platinum / 2 gold / 6 silver / 46 bronze, found " +
        grades.platinum + "/" + grades.gold + "/" + grades.silver + "/" + grades.bronze,
    );
  }
  if (hidden !== 28) fail("expected 28 hidden trophies, found " + hidden);
  if (missable !== 14) fail("expected 14 missable trophies, found " + missable);

  console.log(
    "trophies: 55 (platinum " + grades.platinum + ", gold " + grades.gold +
      ", silver " + grades.silver + ", bronze " + grades.bronze +
      ", hidden " + hidden + ", missable " + missable + ")",
  );
  return list as Trophy[];
}

function copyTree(source: string, target: string): void {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function countScreenshots(): number {
  const dir = join(here, "screenshots");
  if (!existsSync(dir)) return 0;
  return (readdirSync(dir) as string[]).filter((name) => /\.(png|jpe?g)$/i.test(name)).length;
}

const trophies = validateTrophies();

const shotCount = countScreenshots();
if (shotCount === 0) {
  console.error("main.ts: screenshots/ holds no image yet — take 3 or 4 screenshots of the app first (see shots.json), then run again.");
  process.exit(1);
}
if (shotCount > 4) {
  console.error("main.ts: screenshots/ holds " + shotCount + " images, at most 4 are allowed.");
  process.exit(1);
}
console.log("screenshots: " + shotCount);

mkdirSync(outDir, { recursive: true });
copyTree(join(here, "app"), join(outDir, "app"));
copyTree(join(here, "screenshots"), join(outDir, "screenshots"));

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/, or 48 MiB).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, "dossier.json"), dossier);

const dossierBytes = statSync(join(outDir, "dossier.json")).size;
console.log("trophies validated: " + trophies.length);
console.log("dossier.json written: " + dossierBytes + " bytes -> " + join(outDir, "dossier.json"));
console.log("done.");
