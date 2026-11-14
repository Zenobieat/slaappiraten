// Maakt agenda-bestanden (.ics) uit data/tournify.json:
//  - data/slaappiraten.ics  -> abonneerbare kalender met alle matchen (werkt zichzelf bij)
//  - data/ics/<id>.ics      -> één match, met herinnering, om met 1 klik toe te voegen
// Afspraak: altijd een kwartier voor de aftrap aanwezig.
import fs from "node:fs";
const d = JSON.parse(fs.readFileSync("data/tournify.json", "utf8"));
const TEAM = (d.team || "Slaappiraten").toLowerCase();
const ours = d.matches.filter((m) => [m.home, m.away].some((t) => t.toLowerCase() === TEAM));
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
const SITE = "https://slaappiraten.github.io/";
const TZ = `BEGIN:VTIMEZONE\r\nTZID:Europe/Brussels\r\nBEGIN:DAYLIGHT\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nTZNAME:CEST\r\nDTSTART:19700329T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\nEND:DAYLIGHT\r\nBEGIN:STANDARD\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nTZNAME:CET\r\nDTSTART:19701025T030000\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\nEND:STANDARD\r\nEND:VTIMEZONE`;
const esc = (s) => String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
function local(date, mins) { const [y, mo, da] = date.split("-").map(Number); const t = new Date(Date.UTC(y, mo - 1, da, 0, mins)); return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`; }
function event(m) {
  const home = m.home.toLowerCase() === TEAM; const opp = home ? m.away : m.home;
  const [h, mi] = (m.time || "20:00").split(":").map(Number); const ko = h * 60 + mi;
  const score = m.homeScore != null ? ` (${home ? m.homeScore : m.awayScore}-${home ? m.awayScore : m.homeScore})` : "";
  const stamp = new Date(d.updatedAt || Date.now()).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VEVENT", `UID:${m.id}@slaappiraten`, `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Brussels:${local(m.date, ko - 15)}`, `DTEND;TZID=Europe/Brussels:${local(m.date, ko + 50)}`,
    `SUMMARY:${esc(`⚽ Slaappiraten - ${opp}${score} · aanwezig ${hhmm(ko - 15)}`)}`,
    `LOCATION:${esc(m.venue || "Sporthal HoGent")}`,
    `DESCRIPTION:${esc(`Slaappiraten tegen ${opp} (${home ? "thuis" : "uit"}), ${m.poule || "Poule B"} Ghent Students League.\n\n⏰ Aanwezig om ${hhmm(ko - 15)}\n⚽ Aftrap om ${m.time || "20:00"}${m.time ? "" : " (uur nog niet bevestigd)"}\n📍 ${m.venue || "Sporthal HoGent"}\n\n🍻 Te laat = trakteren!\n\nAanwezigheid doorgeven: ${SITE}#match-${m.id}`)}`,
    `URL:${SITE}#match-${m.id}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT1H", `DESCRIPTION:${esc(`Over een uur aanwezig zijn voor ${opp}. Te laat = trakteren!`)}`, "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT15M", "DESCRIPTION:Over een kwartier aanwezig zijn! Te laat = trakteren 🍻", "END:VALARM",
    "END:VEVENT"
  ].join("\r\n");
}
const cal = (events, name) => ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Slaappiraten//Matchen//NL", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${name}`, "X-WR-TIMEZONE:Europe/Brussels", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H", TZ, ...events, "END:VCALENDAR", ""].join("\r\n");
fs.mkdirSync("data/ics", { recursive: true });
fs.writeFileSync("data/slaappiraten.ics", cal(ours.map(event), "Slaappiraten ⚽"));
for (const m of ours) fs.writeFileSync(`data/ics/${m.id}.ics`, cal([event(m)], "Slaappiraten ⚽"));
console.log(`agenda: ${ours.length} matchen`);
