import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const directory = path.join(root, "editorial/2026-nov-dez");
const articles = JSON.parse(await readFile(path.join(directory, "articles.json"), "utf8"));
const comparisons = JSON.parse(await readFile(path.join(directory, "comparisons.json"), "utf8"));
const today = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const due = [...articles, ...comparisons].filter(item => item.date <= today);
await mkdir(path.join(directory, "releases"), {recursive:true});
for (const date of [...new Set(due.map(item => item.date))]) {
  const target = path.join(directory, "releases", date + ".json");
  try { await access(target); continue; } catch (error) { if (error.code !== "ENOENT") throw error; }
  await writeFile(target, JSON.stringify({date,content:due.filter(item => item.date === date).map(item => ({slug:item.slug,title:item.title}))}, null, 2) + "\n", {flag:"wx"});
  process.stdout.write("Release recorded: " + date + "\n");
}
