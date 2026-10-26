#!/usr/bin/env node
// check-skills.mjs — validate every skill in this repository: a skill is a
// top-level directory holding SKILL.md. Exit 1 lists every problem found.
//
//   node scripts/check-skills.mjs
//
// Checks: frontmatter `name` matches the directory and is a valid skill name;
// `description` is present and within the 1024-character limit; the name does
// not shadow a Claude Code bundled skill or alias (a personal skill replaces
// the bundled one, and a bundled alias never reaches it); every relative link
// in the skill's markdown resolves.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Bundled Claude Code skills and their aliases. A skill here with one of these
// names either hides the bundled one or is unreachable through the alias.
const reserved = new Set([
  "code-review", "review", "security-review", "simplify", "init", "loop",
  "schedule", "run", "update-config", "keybindings-help", "claude-api",
  "fewer-permission-prompts", "workflow-authoring", "plugin-authoring",
]);

const problems = [];
const skills = readdirSync(root).filter(
  (d) => !d.startsWith(".") && existsSync(join(root, d, "SKILL.md")),
);

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fields = {};
  let key = null;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      fields[key] = kv[2].replace(/^>-?\s*$|^\|-?\s*$/, "");
    } else if (key && /^\s+\S/.test(line)) {
      fields[key] = `${fields[key]} ${line.trim()}`.trim();
    }
  }
  return fields;
}

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "node_modules" ? [] : markdownFiles(path);
    return entry.endsWith(".md") ? [path] : [];
  });
}

for (const skill of skills) {
  const fm = frontmatter(readFileSync(join(root, skill, "SKILL.md"), "utf8"));
  if (!fm) {
    problems.push(`${skill}/SKILL.md: no frontmatter block`);
    continue;
  }
  if (fm.name !== skill) problems.push(`${skill}/SKILL.md: name "${fm.name}" does not match directory "${skill}"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.name ?? "") || fm.name.length > 64)
    problems.push(`${skill}/SKILL.md: name must be lowercase words joined by hyphens, at most 64 characters`);
  if (!fm.description) problems.push(`${skill}/SKILL.md: missing description`);
  else if (fm.description.length > 1024)
    problems.push(`${skill}/SKILL.md: description is ${fm.description.length} characters (limit 1024)`);
  if (reserved.has(fm.name)) problems.push(`${skill}/SKILL.md: "${fm.name}" collides with a Claude Code bundled skill or alias`);
}

// Links are checked in every markdown file, including the repository README.
for (const file of [join(root, "README.md"), ...skills.flatMap((s) => markdownFiles(join(root, s)))]) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = resolve(dirname(file), decodeURIComponent(target.split("#")[0]));
    if (!existsSync(path)) problems.push(`${file.slice(root.length + 1)}: broken link ${target}`);
  }
}

for (const p of problems) console.error(p);
console.log(`${skills.length} skills checked, ${problems.length} problem(s).`);
process.exit(problems.length ? 1 : 0);
