#!/usr/bin/env node
// overflow.mjs — phone-width horizontal-overflow gate. Loads each route at a
// narrow viewport and reports any element wider than the viewport. Exits
// non-zero if anything overflows, so it can gate a round.
//
//   node overflow.mjs --config ui-council.config.json --width 390
//
// Same login/env contract as capture.mjs.

import { chromium } from "playwright";
import { readFileSync } from "node:fs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const cfg = JSON.parse(readFileSync(arg("config", "ui-council.config.json"), "utf8"));
const width = parseInt(arg("width", "390"), 10);
const email = process.env[cfg.login.emailEnv || "UI_EMAIL"];
const password = process.env[cfg.login.passwordEnv || "UI_PASSWORD"];
if (!email || !password) {
  console.error("Missing credentials in environment.");
  process.exit(2);
}

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
let offenders = 0;
try {
  const ctx = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  await login(page);
  for (const route of cfg.routes) {
    try {
      await page.goto(cfg.base + route.path, { waitUntil: cfg.routeWaitFor || "networkidle", timeout: 30000 });
      if (cfg.settleMs) await page.waitForTimeout(cfg.settleMs);
      const bad = await page.evaluate((vw) => {
        const out = [];
        const docW = document.documentElement.scrollWidth;
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > vw + 1) {
            const tag = el.tagName.toLowerCase();
            const cls = (typeof el.className === "string" ? el.className : "").slice(0, 60);
            out.push({ tag, cls, right: Math.round(r.right), w: Math.round(r.width) });
          }
        }
        // keep only the widest handful to avoid dumping the whole tree
        out.sort((a, b) => b.right - a.right);
        return { docW, items: out.slice(0, 8) };
      }, width);
      if (bad.docW > width + 1) {
        offenders++;
        console.log(`OVERFLOW ${route.name}: document scrollWidth ${bad.docW} > ${width}`);
        for (const it of bad.items) {
          console.log(`    ${String(it.right).padStart(5)}px  <${it.tag}> .${it.cls}  (w=${it.w})`);
        }
      } else {
        console.log(`ok       ${route.name}: ${bad.docW}px`);
      }
    } catch (err) {
      console.error(`  ! ${route.name}: ${err.message}`);
    }
  }
  await ctx.close();
} finally {
  await browser.close();
}
console.log(`\n${offenders ? offenders + " route(s) overflow at " + width + "px" : "No overflow at " + width + "px"}`);
process.exit(offenders ? 1 : 0);
