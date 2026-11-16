import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const entries = ["blog", "comparisons"].flatMap(collection =>
  readdirSync(`src/data/${collection}`)
    .filter(name => name.endsWith(".md"))
    .map(name => {
      const body = readFileSync(`src/data/${collection}/${name}`, "utf8");
      return {
        route: `/${collection === "blog" ? "posts" : "compare"}/${name.slice(0, -3)}/`,
        date: new Date(body.match(/pubDatetime: ([^\n]+)/)[1]),
        body,
      };
    })
);
const routes = new Map(entries.map(entry => [entry.route, entry]));
let checked = 0;
for (const entry of entries) {
  for (const [, url] of entry.body.matchAll(/\]\((\/[^)]+)\)/g)) {
    if (url.startsWith("/editorial/")) {
      assert.ok(existsSync(`public${url}`), `Missing illustration: ${url}`);
    } else if (url.startsWith("/posts/") || url.startsWith("/compare/")) {
      const target = routes.get(url.split("#")[0]);
      assert.ok(target, `Missing destination: ${url}`);
      assert.ok(target.date <= entry.date, `${entry.route} links to a future page: ${url}`);
      checked++;
    }
  }
}
process.stdout.write(`PASS: ${checked} internal links resolve without linking to future content.\n`);
