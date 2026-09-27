# Prototypeindhold v0.1 — historiske spillere og to challenges

**Implementeringsnote:** Dette dokument er det oprindelige designgrundlag. Den første spilbare version er nu implementeret; se [startvejledningen](../README.md), [kampmotoren](match-engine-v0.1.md) og [verifikationen](verification.md) for aktuel status. Formuleringer nedenfor om endnu ikke bygget kode beskriver tidspunktet for dette oplæg.

27. september 2026. Status: konkret designforslag, klar som indhold til implementering. Kampmotor og brugerflade er endnu ikke bygget eller balanceret.

**48 kort / 45 forskellige spillere / 6 klubtrupper / 17 kort fra italienske klubber / 16 startkort.**

## Formålet

Genkendelige spillere skal gøre det spændende at åbne et kort. Historiske klubversioner skal samtidig ændre, hvilke hold man kan bygge. Den vigtigste prøve er, om spilleren værdsætter Salah i Roma, selv efter at have fundet hans stærkere Liverpool-version.

Puljen er koncentreret omkring seks klubtrupper, så vi får brugbare overlap og dækning af alle positioner med kun 48 kort. Dette første udsnit dækker 2012/13–2018/19. 1990'er-kort, Serie B, U21 og den øvrige verden kommer senere.

## Dataprincipper

- Ét kort = én spiller i én klub i én konkret sæson. Lejespillere tilhører den klub, de faktisk spillede for.
- Nationalitet og klubbens land er separate felter. Italy bruger klubbens land.
- OVR, ATK, MID og DEF er egne foreløbige spilværdier på 1–99-skalaen, ikke officielle ratings eller statistiske estimater.
- OVR er en læsehjælp og giver ikke en ekstra kampbonus oven i ATK/MID/DEF.
- Positioner er en forenklet spilmapping inspireret af spillerens daværende rolle. Sekundærpositionerne er designvalg; kilderne dokumenterer ikke alle disse positioner.
- En målmands DEF repræsenterer målmandskvalitet og MID distribution. Målmænd kan kun spille GK, og udespillere kan ikke stå på mål. Motoren skal fastlægge, hvordan målmandens stats vægtes.
- Kun én version af samme person må starte. Alle versioner kan ejes samtidig. Et kort kan bruges på flere gemte hold og forbruges ikke ved deltagelse.
- Stabilt kort-ID pr. version; fælles spiller-ID på tværs af versioner.
- Landekoder følger fodboldkonventioner, fx DEN, ENG, SCO, NED og ITA.
- Alder og akademitilhørsforhold er ikke med. De skal dokumenteres særskilt, før der tilføjes challenges med sådanne krav.

## De 48 kort

### Ajax · 2012/13

NED · Eredivisie. Historisk klub-/sæsontilhørsforhold: [DFB: Ajax-truppen 2012/13](https://datencenter.dfb.de/en/competitions/europa-league/seasons/2012-2013/teams/ajax-amsterdam?datacenter_name=data-center). Tal og spilpositioner er vores egne designforslag.

| Spiller | Land | Positioner | OVR | ATK | MID | DEF |
| --- | --- | --- | --- | --- | --- | --- |
| Jasper Cillessen | NED | GK | 71 | 8 | 48 | 73 |
| Toby Alderweireld | BEL | CB/RB | 78 | 39 | 64 | 81 |
| Daley Blind | NED | LB/DM | 75 | 49 | 76 | 73 |
| Christian Eriksen | DEN | AM/CM | 80 | 77 | 85 | 39 |
| Lasse Schøne | DEN | CM/RW | 76 | 73 | 79 | 56 |
| Siem de Jong | NED | AM/CM/ST | 78 | 80 | 77 | 48 |
| Viktor Fischer | DEN | LW | 73 | 77 | 66 | 27 |
| Joël Veltman | NED | CB | 69 | 29 | 54 | 72 |

### FC Basel · 2012/13

SUI · Swiss Super League. Historisk klub-/sæsontilhørsforhold: [UEFA: Tottenham–Basel, 4. april 2013](https://es.uefa.com/uefaeuropaleague/news/0208-0e8424f1c2d1-aa843e95c524-1000--el-basilea-muestra-sus-credenciales/). Tal og spilpositioner er vores egne designforslag.

| Spiller | Land | Positioner | OVR | ATK | MID | DEF |
| --- | --- | --- | --- | --- | --- | --- |
| Yann Sommer | SUI | GK | 77 | 8 | 54 | 79 |
| Mohamed Salah | EGY | RW | 74 | 80 | 65 | 28 |
| Mohamed Elneny | EGY | DM/CM | 69 | 42 | 70 | 70 |
| Fabian Frei | SUI | CM/DM | 74 | 59 | 76 | 68 |
| Valentin Stocker | SUI | LW/AM | 77 | 78 | 75 | 44 |
| Fabian Schär | SUI | CB | 73 | 40 | 64 | 76 |

### Southampton · 2013/14

ENG · Premier League. Historisk klub-/sæsontilhørsforhold: [Southampton 2013/14: sæsonens spilleroversigt](https://en.wikipedia.org/wiki/2013%E2%80%9314_Southampton_F.C._season#Squad_statistics). Tal og spilpositioner er vores egne designforslag.

| Spiller | Land | Positioner | OVR | ATK | MID | DEF |
| --- | --- | --- | --- | --- | --- | --- |
| Artur Boruc | POL | GK | 77 | 6 | 37 | 80 |
| José Fonte | POR | CB | 76 | 32 | 53 | 80 |
| Dejan Lovren | CRO | CB | 78 | 37 | 59 | 82 |
| Luke Shaw | ENG | LB | 75 | 58 | 64 | 77 |
| Nathaniel Clyne | ENG | RB | 75 | 55 | 62 | 78 |
| Morgan Schneiderlin | FRA | DM/CM | 79 | 52 | 80 | 82 |
| Victor Wanyama | KEN | DM/CM | 75 | 42 | 68 | 83 |
| Rickie Lambert | ENG | ST | 78 | 82 | 70 | 30 |
| Adam Lallana | ENG | AM/CM/LW | 80 | 78 | 83 | 51 |
| Jay Rodriguez | ENG | LW/ST | 79 | 84 | 65 | 36 |

### AS Roma · 2015/16

ITA · Serie A. Historisk klub-/sæsontilhørsforhold: [Lega Serie A: Roma-truppen, februar 2016](https://img.legaseriea.it/vimages/632c28cf/2015-16_A_UNICO_UNI_26_ROMPAL.pdf). Tal og spilpositioner er vores egne designforslag.

| Spiller | Land | Positioner | OVR | ATK | MID | DEF |
| --- | --- | --- | --- | --- | --- | --- |
| Wojciech Szczęsny | POL | GK | 81 | 8 | 47 | 83 |
| Alessandro Florenzi | ITA | RB/CM/RW | 80 | 72 | 77 | 75 |
| Kostas Manolas | GRE | CB | 82 | 32 | 51 | 87 |
| Antonio Rüdiger | GER | CB/RB | 78 | 35 | 56 | 82 |
| Lucas Digne | FRA | LB | 78 | 64 | 69 | 77 |
| Daniele De Rossi | ITA | DM/CM | 83 | 54 | 80 | 88 |
| Miralem Pjanić | BIH | CM/AM | 84 | 76 | 90 | 57 |
| Radja Nainggolan | BEL | CM/DM | 84 | 77 | 82 | 82 |
| Mohamed Salah | EGY | RW/LW | 84 | 89 | 75 | 33 |
| Edin Džeko | BIH | ST | 80 | 83 | 67 | 35 |

### Juventus · 2016/17

ITA · Serie A. Historisk klub-/sæsontilhørsforhold: [DFB: Juventus-truppen 2016/17](https://datencenter.dfb.de/competitions/champions-league/seasons/2016-2017/teams/juventus-turin). Tal og spilpositioner er vores egne designforslag.

| Spiller | Land | Positioner | OVR | ATK | MID | DEF |
| --- | --- | --- | --- | --- | --- | --- |
| Gianluigi Buffon | ITA | GK | 90 | 7 | 49 | 93 |
| Giorgio Chiellini | ITA | CB | 89 | 35 | 56 | 94 |
| Leonardo Bonucci | ITA | CB | 87 | 44 | 78 | 88 |
| Alex Sandro | BRA | LB | 85 | 73 | 76 | 84 |
| Miralem Pjanić | BIH | CM/DM | 86 | 74 | 92 | 66 |
| Paulo Dybala | ARG | AM/ST | 88 | 92 | 86 | 30 |
| Gonzalo Higuaín | ARG | ST | 89 | 94 | 67 | 29 |

### Liverpool · 2018/19

ENG · Premier League. Historisk klub-/sæsontilhørsforhold: [Liverpool FC: startopstilling, 22. september 2018](https://www.liverpoolfc.com/news/first-team/317732-team-news-liverpool-southampton). Tal og spilpositioner er vores egne designforslag.

| Spiller | Land | Positioner | OVR | ATK | MID | DEF |
| --- | --- | --- | --- | --- | --- | --- |
| Alisson | BRA | GK | 89 | 9 | 68 | 91 |
| Virgil van Dijk | NED | CB | 91 | 46 | 73 | 95 |
| Andrew Robertson | SCO | LB | 86 | 76 | 77 | 85 |
| Trent Alexander-Arnold | ENG | RB | 85 | 80 | 86 | 73 |
| Mohamed Salah | EGY | RW/ST | 92 | 97 | 82 | 35 |
| Sadio Mané | SEN | LW/ST | 90 | 94 | 78 | 43 |
| Roberto Firmino | BRA | ST/AM | 87 | 85 | 88 | 60 |

## Startsamlingsholdet

Start med et færdigt **4-3-3-hold**, så første sæson kan spilles med det samme. Det erstatter startdraften i denne testversion. Draften kan tilføjes, når holdbygningen virker.

| Plads | Kort | OVR |
| --- | --- | --- |
| GK | Jasper Cillessen · Ajax 2012/13 | 71 |
| RB | Nathaniel Clyne · Southampton 2013/14 | 75 |
| CB | Toby Alderweireld · Ajax 2012/13 | 78 |
| CB | José Fonte · Southampton 2013/14 | 76 |
| LB | Daley Blind · Ajax 2012/13 | 75 |
| DM | Victor Wanyama · Southampton 2013/14 | 75 |
| CM | Lasse Schøne · Ajax 2012/13 | 76 |
| CM | Siem de Jong · Ajax 2012/13 | 78 |
| RW | Mohamed Salah · FC Basel 2012/13 | 74 |
| ST | Rickie Lambert · Southampton 2013/14 | 78 |
| LW | Viktor Fischer · Ajax 2012/13 | 73 |

**Fem reserver i samlingen:** Boruc 77, Veltman 69, Elneny 69, Florenzi 80 og Digne 78, med klub/sæson som i tabellerne. De er tilgængelige til holdbygning; udskiftninger under kamp er ikke nødvendige i første version.

Det er et udviklingshold med både talenter og etablerede navne. Vi presser ikke etablerede spillere kunstigt ned på 60 OVR for at skabe en lav startværdi.

Alle tre formationer kan bygges med startsamlingen:

- **4-3-3:** holdet ovenfor; Wanyama som DM, Schøne og De Jong som CM.
- **4-4-2:** Salah/Fischer på kanterne, Wanyama/Schøne centralt, Lambert/De Jong i angrebet.
- **4-2-3-1:** Wanyama/Elneny som DM, De Jong som AM, Salah/Fischer på kanterne og Lambert som ST.

I 4-4-2 accepterer LM-pladsen LW-kort og RM-pladsen RW-kort. Andre pladser skal findes i kortets positionsliste. Forkert position er blokeret i første version. Alle tre formationer er åbne fra start.

Florenzi kan straks erstatte Clyne: mere ATK/MID og lidt mindre DEF. Boruc kan erstatte Cillessen: mere DEF og mindre MID. Startsamlingskortene giver dermed konkrete afvejninger.

## Challenge 1 — Open League

**Test:** lær holdbygning, og få lyst til at justere samme samling.

| Regel | Første version |
| --- | --- |
| Adgang | Åben fra start |
| Krav | 11 forskellige personer på lovlige positioner |
| Historiske begrænsninger | Ingen |
| Format | 20 hold i alt: spillerens klub og 19 AI-hold |
| Sæson | Hjemme/ude, 38 kampe pr. hold |
| Bronze | Top 10 |
| Sølv | Top 4 |
| Guld/trofæ og gennemført | 1. plads |
| Frivillig mastery | Vind med gennemsnitlig start-OVR højst 80,0 |
| Foreløbig AI-kvalitet | OVR cirka 73–80; skal balanceres i motoren |

Brug det urundede OVR-gennemsnit til mastery. Lås startelleveren for hele sæsonen i første prototype, og gem hold, formation, seed og resultat til sammenligning. Det gør testen forståelig og forhindrer, at mastery klares ved kun at stille svagt i sidste kamp.

Sigt efter et konkurrencedygtigt starthold med synlige svagheder. En bestemt startplacering eller sejrschance kan først fastlægges efter simulation.

## Challenge 2 — Italy Challenge

**Test:** historisk klubtilhørsforhold gør en anden del af samlingen værdifuld.

| Regel | Første version |
| --- | --- |
| Synlighed | Synlig fra start |
| Adgang | Mindst 6 af 11 startkort fra italienske klubber |
| Øvrige pladser | 5 frie pladser |
| Nationalitet | Ingen begrænsning |
| Reserver | Tæller ikke mod adgangskravet |
| Format | 20 hold i alt, 38 kampe pr. hold |
| Bronze / sølv / guld | Top 10 / top 4 / 1. plads |
| Challenge gennemført | Vind trofæet |
| Frivillig mastery | Vind med mindst 8 italienske klubkort |
| Foreløbig AI-kvalitet | OVR cirka 78–85; skal balanceres i motoren |

Intet ekstra krav om reputation eller et tidligere trofæ. Et lovligt hold er nok. Vis en tæller for de kvalificerende kort, der faktisk er i startelleveren.

Puljen har **17 kvalificerende kort fra 16 personer**; Pjanić har både en Roma- og Juventus-version. Denne challenge er en italiensk inspireret konkurrence og genskaber ikke én bestemt historisk Serie A-sæson. De 19 AI-trupper skal defineres i næste byggetrin.

| Eksempel | Tæller til Italy? |
| --- | --- |
| Salah · Roma 2015/16 | Ja |
| Salah · Liverpool 2018/19 | Nej |
| Salah · Basel 2012/13 | Nej |
| Digne · Roma 2015/16 | Ja, selv om han er fransk |
| Pjanić · Juventus 2016/17 | Ja |

Historiske klubversioner i eksemplerne er dokumenteret med kilder ved korttabellerne.

## En garanteret vej til Italy

Startsamlingskortene Florenzi og Digne tæller til Italy. De første fire gennemførte Open League-sæsoner giver desuden ét fast kort, uanset placering:

| Gennemførte sæsoner | Garanteret kort | Dækning |
| --- | --- | --- |
| 1 | Szczęsny · Roma 2015/16 | GK |
| 2 | Manolas · Roma 2015/16 | CB |
| 3 | De Rossi · Roma 2015/16 | DM/CM |
| 4 | Pjanić · Roma 2015/16 | CM/AM |

Senest efter fire sæsoner ejer spilleren dermed seks forskellige Italy-kort, der passer sammen på et hold. Det kan gå hurtigere med tilfældige belønninger. Hvis milepælskortet allerede ejes, beholder spilleren det og får et andet ikke-ejet kort i belønningspladsen.

**Garanteret lovlig 4-3-3 efter fire sæsoner:**

Szczęsny; Florenzi, Manolas, Fonte, Digne; De Rossi, Pjanić, Schøne; Salah (Basel), Lambert, Fischer.

Szczęsny, Florenzi, Manolas, Digne, De Rossi og Pjanić opfylder de seks Italy-pladser. Garantien gælder adgang, ikke sejr.

### Belønningspacks til spiltesten

Dette er en enkel testopsætning, ikke en balanceret langsigtet økonomi:

- Hver færdigspillet sæson giver op til tre nye kort.
- De første fire Open League-packs reserverer én af de tre pladser til milepælskortet. Resten trækkes blandt ikke-ejede kort med OVR højst 84.
- Senere Open League-packs bruger samme globale pulje. Italy-packs bruger italienske klubkort med OVR højst 84.
- Første trofæ i hver challenge giver desuden et frit valg af ét ikke-ejet elitekort, OVR 85+: globalt for Open League og ITA for Italy.
- Efter første trofæ i en challenge kan dens sæsonpacks også trække elitekort. Alle tilbageværende kort i dens pulje har samme trækchance i denne testversion.
- Ingen allerede ejede kort eller gentagelser inden for samme pack. Hvis puljen har færre end tre kort tilbage, gives resten; en tom pulje vises som fuldført.
- Ingen coins, køb eller duplicate-resource i denne indholdstest. Scout Points designes senere.

Så kan vi teste åbning og collection uden at gøre adgang afhængig af pack-held. Slå belønninger fra i den isolerede motor-test for at måle effekten af holdvalg.

## Valgene puljen skal skabe

| Valg | Hvad vi vil teste |
| --- | --- |
| Clyne vs. Florenzi på RB | Forsvar over for mere angreb/kontrol |
| Wanyama vs. Eriksen på CM | Defensiv styrke over for kreativitet |
| De Rossi vs. Pjanić på CM | To italienske klubkort med forskellige profiler |
| Chiellini vs. Bonucci på CB | Ren DEF over for mere MID |
| Higuaín vs. Firmino på ST | Afslutning over for holdets øvrige bidrag |
| Salah i Liverpool vs. Roma | Højere kvalitet over for challenge-adgang |

**Et konkret versionsvalg i 4-4-2:**

Szczęsny; Florenzi, Manolas, Fonte, Digne; Salah (Roma), Pjanić (Roma), Eriksen, Fischer; Lambert, De Jong.

Dette hold har præcis seks italienske klubkort. Skift alene Roma-Salah 84 til Liverpool-Salah 92, og holdet falder til fem og bliver ulovligt. Spilleren må enten beholde Roma-Salah eller finde en italiensk klubversion til en anden plads, eksempelvis De Rossi i stedet for Eriksen. Begge Salah-kort kan altså være interessante.

Ikke alle ældre versioner behøver være lige anvendelige. Pjanić i Roma kan blive overhalet af Juventus-versionen i denne challenge. Senere klub-/sæsonkrav og OVR-grænser kan give ældre kort nye anvendelser.

## Hvad der er klart, og hvad der skal bygges

[data/prototype-content.json](../data/prototype-content.json) indeholder kort, kildehenvisninger, formationer, eksempelhold, startkort, challenge-regler og onboarding-milepæle. Pack-reglerne ovenfor er foreløbig kun en designspecifikation.

Indholdet skal kontrolleres for:
- 48 unikke kort-ID'er og konsistente spiller-ID'er.
- Lovlige startopstillinger i alle tre formationer.
- Ingen dobbeltpersoner i en startellever.
- Et lovligt Italy-hold efter de fire milepæle.
- Korrekt afvisning, når Roma-Salah erstattes med Liverpool-Salah i eksempelholdet.

**Næste byggeopgave:** holdbygger og en første kampmotor med disse data. Holdratings, AI-trupper, sandsynligheder og faktisk sværhedsgrad skal implementeres og testes. Over mange parrede simulationer skal vi undersøge, om holdvalgene giver mærkbare, forståelige forskelle. Der er endnu ikke kørt kampsimulationer.
