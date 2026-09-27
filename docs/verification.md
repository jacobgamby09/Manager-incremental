# Verifikation — prototype 0.1

Dato: 27. september 2026.

## Forløbet

Holdbygger → historiske kort fra lokal JSON → kampmotor i browseren → ligatabel → sæsonbelønning → samling → localStorage → genoptagelse efter reload. Der er ingen database, konto, API-nøgle eller ekstern kamptjeneste i denne prototype.

## Automatiske kontroller

12 Node-tests består:

- Klubland frem for nationalitet, og højst én version pr. person.
- Ejerskab og lovlige målmands-/udespillerpositioner.
- Alle tre formationer samt muligheden for begge mastery-krav.
- OVR giver ingen skjult kampbonus; samme 11 spillere kan få en anden holdprofil.
- Hver modstander mødes hjemme og ude, og ingen spiller to kampe i samme runde.
- Alle AI-trupper består af de rigtige kort og opfylder deres challenge-regler.
- Genoptagelse efter serialisering giver samme sæsonresultat.
- Mål, point og antal kampe stemmer på tværs af alle 20 hold.
- Stærkere hold har højere vinderchance, men kan stadig tabe.
- Fire gennemførte sæsoner sikrer Italy-adgang; gentagen afslutning giver ikke dobbeltbelønning.
- En udtømt pulje giver ingen dubletter; elitevalget kan kun afhentes én gang.
- Testbane og karriere har adskilte tilstande, og testbanen giver ingen packs.

Balancekørslen består af 3.500 sæsoner fordelt på syv holdprofiler. Se `balance-report.json` og `match-engine-v0.1.md`.

## Browserkontrol

Kontrolleret med agent-browser i en separat testsession:

- Lokal server svarer HTTP 200 og leverer kortdata og JavaScript.
- Holdbyggeren viser de 11 spillere og de tre formationer.
- Clyne kan skiftes til Florenzi med synlig ændring i holdets stats.
- En sæson kan starte, afvikle en enkelt runde, køre automatisk, pauses og springes til slutresultatet.
- Reload efter første runde genoptager på samme runde.
- Første World Pack viser Szczęsny og to yderligere nye kort; efter afhentning og reload er der 19 kort og ingen uafhentet pack.
- Fire Open League-sæsoner kan gennemføres gennem brugerfladens handlinger, hvorefter et lovligt Italy-hold kan foreslås og spille sin første runde.
- Skift til testbane viser 48 kort og tom, separat historik. Skift tilbage bevarer karrierens kort og igangværende Italy-sæson.
- Mobilvisning ved 390 × 844 er visuelt kontrolleret. Intet utilsigtet vandret sideoverløb; reservestrippen kan rulles vandret med vilje.
- Browseren rapporterer ingen appfejl i det gennemførte forløb.

Valgfrie WebMCP-værktøjer registreres med skemaer. `read_club` returnerer den aktuelle tilstand. `play_next_matchday` opdaterer samme sæson og tabel som brugerfladen. Et forsøg på `start_season` under en aktiv sæson afvises, så den eksisterende sæson bevares.

Efter afslutning og afhentning af belønningen blev `play_next_matchday` korrekt afvist uden en aktiv sæson, mens `start_season` derefter oprettede en ny sæson på runde 0. Samlingens søgning og filter viste alle tre Salah-versioner med korrekt ejerskabsstatus.

## Afgrænsning

Dette dokument bekræfter funktion og de målte simulationer. Spillets sjov, progressionstempo og langsigtede balance kræver spillerfeedback. Browserkontrollen er udført i Chromium, ikke på fysiske iOS-/Android-enheder. Ratings er fortsat foreløbige.
