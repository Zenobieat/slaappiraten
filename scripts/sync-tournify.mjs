// Haalt het schema en de stand van de Slaappiraten op van de publieke Tournify-livepagina
// en schrijft ze naar data/tournify.json. Draait automatisch via GitHub Actions.
import { readFileSync, writeFileSync } from "node:fs";

const TEAM = "Slaappiraten";
const BASE = "https://tournifyapp.com/live/ghentstudentsleague26-27";
const VENUE_LABEL = "SPORTHAL HOGENT";      // locatie in het schema
const DIVISION_LABEL = "Minivoetbal";       // reeks in de standen
const OUT = new URL("../data/tournify.json", import.meta.url);

const MONTHS = { januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6, juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12 };
const DAY_RE = /^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i;
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isNum = (s) => /^-?\d+$/.test(s);

export function parseSchedule(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out = []; let date = null;
  for (let i = 0; i < lines.length; i++) {
    const d = lines[i].match(DAY_RE);
    if (d) { const m = MONTHS[d[3].toLowerCase()]; if (m) date = `${d[4]}-${String(m).padStart(2, "0")}-${d[2].padStart(2, "0")}`; continue; }
    if (!date || !/^Poule\s/i.test(lines[i]) || !lines[i].includes(" - ")) continue;
    const poule = lines[i].split(" - ")[0].trim();
    let j = i + 1;
    const venue = /^Zaal|^Veld|^Terrein/i.test(lines[j]) ? lines[j++].split(" - ")[0].trim() : "";
    const home = lines[j++]; let time = null, homeScore = null, awayScore = null;
    if (/^\d{1,2}:\d{2}$/.test(lines[j])) { time = lines[j++]; }
    else { const nums = []; while (j < lines.length && isNum(lines[j])) nums.push(Number(lines[j++])); if (nums.length) homeScore = nums[nums.length - 1]; }
    const away = lines[j++];
    if (homeScore != null) { const nums = []; while (j < lines.length && isNum(lines[j])) nums.push(Number(lines[j++])); if (nums.length) awayScore = nums[nums.length - 1]; else homeScore = null; }
    if (!home || !away) continue;
    out.push({ id: `${date}-${slug(home)}-${slug(away)}`, date, time, venue: venue ? `${venue} · Sporthal HoGent` : "Sporthal HoGent", poule, home, away, homeScore, awayScore });
    i = j - 1;
  }
  return out;
}

export function parseStandings(text, poule, teams) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const start = lines.findIndex((l) => l === poule); if (start < 0) return [];
  const rows = []; let i = start + 1;
  if (/^Team\b/.test(lines[i])) i++;
  const known = new Map(teams.map((t) => [norm(t), t]));
  while (i < lines.length && !/^Speelschema|^Poule\s/i.test(lines[i])) {
    if (!/^\d+$/.test(lines[i])) { i++; continue; }
    const rank = Number(lines[i++]); const parts = [];
    while (i < lines.length && !/^-?\d+(\s+-?\d+){7}$/.test(lines[i])) parts.push(lines[i++]);
    if (i >= lines.length) break;
    const [played, won, drawn, lost, points, goalsFor, goalsAgainst, fairPlay] = lines[i++].split(/\s+/).map(Number);
    const team = known.get(norm(parts.join(""))) || parts.join(" ");
    rows.push({ rank, team, played, won, drawn, lost, points, goalsFor, goalsAgainst, fairPlay });
  }
  return rows;
}

async function clickText(page, label) {
  const el = page.getByText(label, { exact: false }).first();
  await el.waitFor({ timeout: 30000 }); await el.click(); await page.waitForTimeout(2500);
}

async function main() {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: "nl-BE" });

  await page.goto(`${BASE}/schedule`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await clickText(page, VENUE_LABEL);
  await page.getByText(/^Poule [A-Z]/).first().waitFor({ timeout: 30000 }); await page.waitForTimeout(1500);
  // Ingeklapte speeldagen openklappen (dagen zonder wedstrijden eronder in de tekst)
  for (let round = 0; round < 3; round++) {
    const lines = (await page.innerText("body")).split("\n").map((l) => l.trim()).filter(Boolean);
    const collapsed = lines.filter((l, k) => DAY_RE.test(l) && (k + 1 >= lines.length || DAY_RE.test(lines[k + 1]) || /^TOURNIFY/i.test(lines[k + 1])));
    if (!collapsed.length) break;
    for (const day of collapsed) { await page.getByText(day, { exact: true }).first().click().catch(() => {}); await page.waitForTimeout(700); }
  }
  const all = parseSchedule(await page.innerText("body"));
  const mine = all.filter((m) => norm(m.home) === norm(TEAM) || norm(m.away) === norm(TEAM));
  if (!mine.length) throw new Error("Geen wedstrijden van " + TEAM + " gevonden; pagina is misschien veranderd.");
  const poule = mine[0].poule;
  const matches = all.filter((m) => m.poule === poule);

  await page.goto(`${BASE}/standings`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await clickText(page, DIVISION_LABEL);
  await page.getByText(/Team\s+G\s+W/).first().waitFor({ timeout: 30000 }); await page.waitForTimeout(1000);
  const teams = [...new Set(matches.flatMap((m) => [m.home, m.away]))];
  const standings = parseStandings(await page.innerText("body"), poule, teams);
  await browser.close();
  if (!standings.some((r) => norm(r.team) === norm(TEAM))) throw new Error("Stand zonder " + TEAM + "; pagina is misschien veranderd.");

  let old = {}; try { old = JSON.parse(readFileSync(OUT, "utf8")); } catch {}
  const same = JSON.stringify(old.matches) === JSON.stringify(matches) && JSON.stringify(old.standings) === JSON.stringify(standings);
  if (same) { console.log("Geen wijzigingen."); return; }
  writeFileSync(OUT, JSON.stringify({ source: `${BASE}/schedule`, updatedAt: new Date().toISOString(), team: TEAM, poule, matches, standings }, null, 1) + "\n");
  console.log(`Bijgewerkt: ${matches.length} wedstrijden, ${standings.length} teams in ${poule}.`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
