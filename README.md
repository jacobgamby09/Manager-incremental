# Career Cards — prototype 0.1

En lokal, mobilvenlig football collection manager med 48 historiske kort og to challenges.

## Start spillet

Kræver Node.js (bygget og testet med den installerede Node-runtime). Åbn en terminal i projektmappen og kør:

```powershell
npm --prefix game run dev
```

Åbn [spillet på din computer](http://127.0.0.1:4173). Serveren skal blive kørende, mens du spiller. Stop den med Ctrl+C. Der er ingen npm-afhængigheder at installere.

## Spilforløb

1. Begynd med 16 kort og et færdigt 4-3-3-hold.
2. Vælg en spiller på banen for at se lovlige erstatninger og ændringen i holdets styrker.
3. Start Open League. Afvikl kampe enkeltvis, automatisk eller spring til resultatet.
4. Åbn belønningspacken, og tilføj kortene til samlingen.
5. De første fire gennemførte Open League-sæsoner sikrer Szczęsny, Manolas, De Rossi og Pjanić fra Roma, uanset placering.
6. Vælg Italy Challenge. Brug mindst seks kort fra italienske klubber i startelleveren. “Foreslå hold” kan udfylde et lovligt hold, når du har kortene.

Formationerne er 4-3-3, 4-4-2 og 4-2-3-1. Startelleveren låses under sæsonen. Holdene for hver challenge gemmes separat. Samlingen, belønningerne, igangværende sæson og historikken gemmes automatisk i browserens localStorage.

**Testbane** åbner en separat gemning med alle 48 kort og uden pack-belønninger. Skift tilbage for at fortsætte karrieren. En genindlæsning åbner karrieren som standard. Gemningen følger browseren og adressen: brug samme adresse næste gang. Der er ingen konto eller cloud-synkronisering.

## Indhold og motor

- [Kortpulje og challenge-design](docs/prototype-content-v0.1.md)
- [Historiske kortdata og kildehenvisninger](data/prototype-content.json)
- [Kampmotor, regler og balancefund](docs/match-engine-v0.1.md)
- [Målte balanceværdier](docs/balance-report.json)
- [Verifikation af spilforløbet](docs/verification.md)

Spillerne, klubberne og sæsonerne er historiske. Ratings og tilladte spilpositioner er vores egne foreløbige designværdier. AI-klubnavnene er fiktive; deres hold bruger de samme rigtige spillerkort. Kort kan forekomme på flere modstanderhold, men én person må kun optræde én gang i hver startellever.

Dette er en første spilbar prototype. Langsigtet økonomi, reputation, faciliteter, startdraft, spillerportrætter og flere ligaer er ikke med i denne version.

## Udvikling og kontrol

```powershell
npm --prefix game test
npm --prefix game run balance
npm --prefix game run build
```

`test` kontrollerer kampregler, sæsonprogram, genoptagelse, versioner og belønninger. `balance` kører 500 sæsoner for hver af syv holdprofiler og skriver rapporten. `build` synkroniserer kortdata fra hovedfilen til spillets statiske mappe; serveren gør også dette ved start.

Spillets kode ligger i `game/dist/`: `engine.js` er den fælles kampmotor, `state.js` håndterer progression, `app.js` håndterer brugerfladen, og `style.css` er det responsive design. Ingen backend eller ekstern spiltjeneste er nødvendig. Skrifttyper hentes fra Google Fonts med lokale font-fallbacks.

Valgfrie WebMCP-værktøjer registreres i browsere med støtte: `read_club`, `start_season` og `play_next_matchday`. De bruger samme spiltilstand og handlinger som brugerfladen.
