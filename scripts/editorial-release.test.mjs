import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readdir, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const root = await mkdtemp(path.join(tmpdir(), "editorial-release-test-"));
const directory = path.join(root, "editorial/2026-nov-dez");
const script = path.resolve("scripts/editorial-release.mjs");
try {
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "articles.json"), JSON.stringify([
    { date: "2000-01-01", slug: "due", title: "Due" },
    { date: "2099-01-01", slug: "future", title: "Future" },
  ]));
  await writeFile(path.join(directory, "comparisons.json"), JSON.stringify([
    { date: "2000-01-01", slug: "comparison", title: "Comparison" },
  ]));
  execFileSync(process.execPath, [script], { cwd: root });
  const target = path.join(directory, "releases/2000-01-01.json");
  const original = await readFile(target, "utf8");
  assert.equal(JSON.parse(original).content.length, 2);
  assert.deepEqual(await readdir(path.dirname(target)), ["2000-01-01.json"]);
  execFileSync(process.execPath, [script], { cwd: root });
  assert.equal(await readFile(target, "utf8"), original);
  process.stdout.write("PASS: due content grouped; future content excluded; repeat is idempotent.\n");
} finally {
  await rm(root, { recursive: true, force: true });
}
