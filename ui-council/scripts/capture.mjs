#!/usr/bin/env node
// capture.mjs — log in once per viewport and take full-page screenshots of
// every configured route. Read-only against the target app.
//
//   node capture.mjs --config ui-council.config.json --out /tmp/ui-r1
//   node capture.mjs --config cfg.json --out /tmp/ui-r1 --only phone
//
// Credentials come from env (names set in the config's login block), never
// from the config file or the command line. Requires `playwright` installed
// in the consuming project (`npm i -D playwright && npx playwright install chromium`).

import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const cfgPath = arg("config", "ui-council.config.json");
const outDir = resolve(arg("out", "/tmp/ui-capture"));
const only = arg("only", null); // optional viewport name filter
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));

const email = process.env[cfg.login.emailEnv || "UI_EMAIL"];
const password = process.env[cfg.login.passwordEnv || "UI_PASSWORD"];
if (!email || !password) {
  console.error(
    `Missing credentials: set ${cfg.login.emailEnv || "UI_EMAIL"} and ` +
      `${cfg.login.passwordEnv || "UI_PASSWORD"} in the environment.`
  );
  process.exit(2);
}

const viewports = (cfg.viewports || [{ name: "desktop", width: 1440, height: 900 }])
  .filter((v) => !only || v.name === only);

mkdirSync(outDir, { recursive: true });

async function login(page) {
  const l = cfg.login;
  await page.goto(cfg.base + l.path, { waitUntil: l.waitFor || "networkidle" });
  await page.fill(l.emailSelector, email);
  await page.fill(l.passwordSelector, password);
  await Promise.all([
    page.waitForLoadState(l.waitAfterSubmit || "networkidle"),
    page.click(l.submitSelector),
  ]);
  if (l.postLoginWaitFor) await page.waitForSelector(l.postLoginWaitFor, { timeout: 15000 });
}

const browser = await chromium.launch();
let shots = 0;
try {
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    await login(page);
    for (const route of cfg.routes) {
      const url = cfg.base + route.path;
      try {
        await page.goto(url, { waitUntil: cfg.routeWaitFor || "networkidle", timeout: 30000 });
        if (route.waitFor) await page.waitForSelector(route.waitFor, { timeout: 15000 });
        if (cfg.settleMs) await page.waitForTimeout(cfg.settleMs);
        const file = `${outDir}/${vp.name}-${route.name}.png`;
        await page.screenshot({ path: file, fullPage: true });
        shots++;
        console.log(`  ${vp.name.padEnd(8)} ${route.name.padEnd(24)} -> ${file}`);
      } catch (err) {
        console.error(`  ! ${vp.name} ${route.name}: ${err.message}`);
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`\nCaptured ${shots} screenshots into ${outDir}`);
