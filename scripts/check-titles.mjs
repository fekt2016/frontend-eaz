#!/usr/bin/env node
/*
 * T104 — fail the build if any page renders the brand twice in its <title>.
 *
 * The root layout sets `title.template = "%s | EazWorld"`, so a page whose own
 * title already contains the brand produces
 * "Social Media Management Pricing | EazWorld | EazWorld". Seven pages did. It
 * wastes SERP width (Google truncates around 60 characters) and on /reviews the
 * repetition pushed out real keywords.
 *
 * THIS CHECKS BUILT OUTPUT, not source, and that is deliberate. A source-level
 * regex cannot tell `metadata.title` (which the template decorates) from
 * `openGraph.title` (which it does not) without parsing the module — a first
 * attempt at that flagged 49 files while the actual build had zero defects.
 * The rendered HTML is the only place the question has a definite answer.
 *
 * Usage:  npm run build && npm run check:titles
 */
import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd(), ".next", "server", "app");
const BRAND = "EazWorld";

function htmlFiles(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (e.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = htmlFiles(ROOT);
if (files.length === 0) {
  console.error("check:titles — no built HTML found. Run `npm run build` first.");
  process.exit(2);
}

const seen = new Map();
for (const file of files) {
  const m = readFileSync(file, "utf8").match(/<title>([^<]*)<\/title>/);
  if (!m) continue;
  const title = m[1];
  // Count occurrences of the brand; more than one means the template doubled it.
  const count = title.split(BRAND).length - 1;
  if (count > 1) seen.set(title, file.replace(ROOT, ""));
}

if (seen.size > 0) {
  console.error(`check:titles — ${seen.size} page(s) repeat "${BRAND}" in the title:\n`);
  for (const [title, file] of seen) console.error(`  ${file}\n    ${title}\n`);
  console.error("Drop the brand from the page's own title — the root layout appends it.");
  console.error(`Or use \`title: { absolute: "…" }\` when the full string is intended.`);
  process.exit(1);
}

console.log(`check:titles — OK, ${files.length} pages, no repeated brand.`);
