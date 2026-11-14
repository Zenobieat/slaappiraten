# Slaappiraten teamsite

Gratis teamwebsite voor de Slaappiraten (Ghent Students League, minivoetbal Poule B).
Aanwezigheden, schema en stand uit Tournify, topscorers, profielen met e-mail-login, awards en voorspellingen.

**Kost niets:** GitHub Pages (hosting) + Supabase gratis plan (database en login) + GitHub Actions (Tournify elke paar uur bijwerken).

## Wat zit erin

| Bestand | Waarvoor |
|---|---|
| `index.html` | De volledige website (wordt gemaakt uit `src/app.html` met `python3 build.py`) |
| `logo.png`, `icon.png` | Clubschild |
| `data/tournify.json` | Schema + stand van Poule B, automatisch bijgewerkt |
| `scripts/sync-tournify.mjs` | Leest de publieke Tournify-pagina en schrijft `data/tournify.json` |
| `.github/workflows/tournify.yml` | Laat die sync elke 3 uur lopen (woensdagavond elk half uur) |
| `supabase.sql` | Database, login-koppeling en beveiliging in één keer |

## Online zetten (± 15 minuten)

### 1. GitHub: de site online
1. Maak op github.com een **nieuwe publieke repository** `slaappiraten` (leeg laten).
2. Upload alle bestanden uit deze map (of laat Claude ze pushen).
3. **Settings → Pages**: Source = *Deploy from a branch*, branch = `main`, map = `/ (root)`. Opslaan.
4. **Settings → Actions → General → Workflow permissions**: kies *Read and write permissions*. Opslaan.
5. Na een minuutje staat de site op `https://<jouw-gebruikersnaam>.github.io/slaappiraten/`.
   Zonder stap 2 hieronder draait ze in voorbeeldmodus (verzonnen spelers).

### 2. Supabase: accounts en aanwezigheden
1. Ga naar supabase.com → *Start your project* → log in met GitHub (gratis plan).
2. *New project*: naam `slaappiraten`, kies een databasewachtwoord, regio **Central EU (Frankfurt)**.
3. Open **SQL Editor → New query**, plak de inhoud van `supabase.sql`.
   Verander `PIRATEN2026` naar jullie eigen teamcode en klik **Run**.
4. **Authentication → Sign In / Providers → Email**: zet *Confirm email* **uit** (anders loop je tegen de mail-limiet van het gratis plan).
5. **Authentication → URL Configuration**: Site URL = je GitHub Pages-link.
6. **Project Settings → API** (of *Data API*): kopieer de **Project URL** en de **anon public**-sleutel.
   Zet ze bovenaan `src/app.html` in `CONFIG` en voer `python3 build.py` uit (of stuur ze naar Claude).
   De anon-sleutel mag publiek staan; de beveiliging zit in de database.

### 3. Aan boord
1. Maak als **eerste** een account op de site: de eerste speler wordt automatisch kapitein (admin).
2. Deel de link en de teamcode in de groepschat.

## Hoe het werkt
- **Iedereen met de link** ziet schema, stand, rankings en awards.
- **Ingelogd** geef je je aanwezigheid door, je goals/assists, stem je op awards en voorspel je de uitslag.
- **De kapitein** kan aanwezigheden en goals van anderen corrigeren (op de wedstrijdpagina).
- Niemand kan op zichzelf stemmen of zichzelf kapitein maken. E-mailadressen zijn voor niemand zichtbaar.
- Tournify verandert? Dan faalt de sync en blijft de laatste data staan. Je kan `data/tournify.json` ook gewoon op GitHub bewerken.

## Wedstrijdawards
🏆 Kapitein van de match · 🧤 De Muur (beste keeper) · 💥 Kanonskogel (mooiste goal) · 🪓 Zeebonk (gewelddadigste) · 🛟 Schipbreuk (grootste blunder) · 😴 Slaapkop (te laat of niet wakker)

## Badges (automatisch)
🎯 Eerste buit · 🎩 Hattrick-held · 💰 Schatzoeker (10 goals) · 👑 Topschutter · ⚓ IJzeren piraat (altijd aanwezig) · 🔮 Waarzegger (exacte voorspelling) · 🏅 Medaillekast (3 awards)

## 50 ideeën om het nog leuker te maken
Gemarkeerd met ✅ = zit er al in.

**Aanwezigheden en organisatie**
1. ✅ Aan boord / misschien / kan niet per wedstrijd
2. ✅ Bemanningsmeter: genoeg spelers (5) en hoeveel wissels
3. ✅ Kapitein kan aanwezigheden corrigeren
4. Herinnering op dinsdag naar wie nog niets liet weten (mail of push)
5. Carpool- en fietsplanner: wie rijdt, wie zit nog zonder lift
6. Wie brengt de truitjes of de bal deze week
7. Agenda-knop: wedstrijd in je Google/Apple-agenda zetten
8. Reservebank: vrienden die kunnen invallen als we te weinig zijn
9. Blessureboeg: wie is geblesseerd en tot wanneer
10. Wedstrijdopstelling slepen op een minivoetbalveld

**Stats en rankings**
11. ✅ Topscorers met podium
12. ✅ Assistkoningen
13. ✅ IJzeren piraat (aanwezigheid)
14. ✅ Zeekaart: doelsaldo als lijn boven of onder zeeniveau
15. ✅ Schatkist met doelsaldo en vorm van de laatste 5
16. Goals per minuut gespeeld (wie is het efficiëntst)
17. Duo van het seizoen: welke assist-goal-combinatie komt het meest voor
18. Clean sheets voor de keeper
19. Langste reeks zonder verlies
20. Seizoensrecap aan het einde (zoals Spotify Wrapped)
21. Vergelijking met vorig seizoen
22. Heatmap: in welke zaal scoren we het meest

**Awards en fun**
23. ✅ 6 wedstrijdawards met stemming
24. ✅ Medaillekast per speler
25. ✅ Automatische badges
26. Gouden Slaapmuts: speler van het seizoen (optelling van alle awards)
27. Gele "boete"-kaart: te laat = rondje trakteren, met teller
28. Boetepot: kleine boetes bijhouden voor de teamavond
29. Wekelijkse quote of de grappigste uitspraak in de kleedkamer
30. Excuus-generator voor wie afmeldt
31. Mascotte-avatar die evolueert met je aantal goals
32. Rivaliteitsmeter tegen het team dat we het meest haten
33. Fotomuur per wedstrijd
34. Liedje van de week (Spotify-link) voor in de kleedkamer
35. "Wie wordt er wakker?" meme na een slechte eerste helft

**Voorspellen en competitie**
36. ✅ Voorspel de uitslag (3 punten exact, 1 punt juiste winnaar)
37. Voorspel de topscorer van de avond
38. Weddenschappen met fictieve dubloenen
39. Mini-league tegen vrienden van buiten de ploeg (zonder login)
40. Penalty-shootout minigame in de browser

**Profielen**
41. ✅ Avatar, bijnaam, rugnummer, positie en strijdkreet
42. Spelerskaart in FIFA-stijl met ratings die teamgenoten geven
43. Profielfoto uploaden
44. Persoonlijke tijdlijn: jouw goals en awards per wedstrijd

**Technisch**
45. ✅ Gratis hosting, werkt op gsm, licht en donker thema
46. ✅ Schema en stand automatisch uit Tournify
47. Installeerbaar als app op je beginscherm (PWA)
48. Pushmelding als de uitslag binnen is
49. Live score tijdens de match bijhouden
50. Sponsorpagina voor Sportspace met hun aanbod
