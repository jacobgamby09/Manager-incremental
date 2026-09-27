# Kampmotor v0.1

Implementeret i `game/dist/engine.js`. Tallene er et første kalibreret udgangspunkt, ikke en påstand om en realistisk fodboldsimulation.

## Fra kort til hold

Hver position vægter spillerens ATK, MID og DEF. Holdets rating er summen af vægtede bidrag divideret med summen af vægtene for den pågældende stat. Det betyder, at formationerne kan sammenlignes uden en gratis bonus alene fra flere vægte.

| Plads | ATK-vægt | MID-vægt | DEF-vægt |
| --- | --- | --- | --- |
| GK | 0 | 0,12 | 1,10 |
| RB / LB | 0,35 | 0,45 | 0,85 |
| CB | 0,10 | 0,25 | 1,00 |
| DM | 0,20 | 0,85 | 0,85 |
| CM | 0,55 | 1,00 | 0,50 |
| AM | 0,85 | 0,90 | 0,15 |
| RW / LW | 1,00 | 0,50 | 0,15 |
| RM / LM | 0,70 | 0,80 | 0,35 |
| ST | 1,20 | 0,30 | 0,10 |

GK's DEF beskriver målmandskvalitet. OVR er gennemsnittet af kortenes OVR og indgår ikke i kampberegningen. RM/LM accepterer RW/LW-kort, men bruger de angivne midtbanevægte. Andre positioner kræver et eksplicit match på kortet.

## Kampresultater

For hvert hold beregnes forventede mål:

```text
xG = clamp(
  1.32 × exp((eget ATK − modstanders DEF) / 22
           + (eget MID − modstanders MID) / 40
           + hjemmebanetillæg),
  0.12,
  5.5
)

hjemmebanetillæg = +0.08 hjemme, −0.08 ude
```

MID-leddet repræsenterer chancemængden. ATK/DEF-leddet repræsenterer chancernes kvalitet. Der simuleres ikke individuelle afleveringer, skud eller målscorere. Begge holds mål trækkes fra hver sin Poisson-fordeling med xG som middelværdi.

Den inverse fordelingsfunktion bruger præcis ét tilfældigt tal pr. hold pr. kamp. Dermed kan to hold sammenlignes med de samme seeds, uden at forskellige Poisson-parametre forskyder alle efterfølgende tilfældige tal. Seeds bestemmes pr. runde og kamp, så resten af ligaens resultater holdes faste i parrede sammenligninger.

Modellen tillader uafgjorte, overraskelser og store sejre. OVR og klubnavn giver ingen skjulte bonusser. Der er ingen ekstra formationsbonus, mentality eller kemi i v0.1.

## Sæsoner og modstandere

Et cirkelprogram giver 19 runder, hvorefter alle kampe gentages med ombyttet hjemmebane. Alle hold spiller 38 kampe, 19 hjemme og 19 ude. Der simuleres 380 kampe i hele ligaen.

Tabellen sorteres efter point, målforskel og scorede mål. Fuld lighed afgøres af en stabil hold-ID-rækkefølge, beskrevet i spillet som et fast lodnummer.

Hver challenge har 19 faste AI-hold med rigtige kort, lovlige positioner og varierede formationer. De har fiktive klubnavne og egne, deterministisk valgte trupper. Italy-holdene opfylder også sekskortskravet. Målet for udvælgelsen stiger fra cirka OVR 73 til 80 i Open League og 78 til 85 i Italy; den faktiske gennemsnits-OVR afhænger af, hvilke lovlige kort der findes.

Ved start gemmes både spillerens hold, modstanderne, styrkerne og seed i sæsonen. En gemt sæson kan derfor genoptages uden at skifte udfald, og senere kortbelønninger ændrer ikke et historisk resultat.

## Balancekørsel

500 sæsoner pr. profil, 3.500 i alt. Samme seeds og modstandere bruges inden for hver challenge. Resultaterne kan reproduceres med `npm --prefix game run balance`.

| Hold | Point i snit | Placering i snit | Mål for | Mål imod | Mesterskaber |
| --- | --- | --- | --- | --- | --- |
| Starthold 4-3-3 | 49,0 | 12,0 | 45,5 | 49,9 | 1,4 % |
| Samme 11 i 4-4-2 | 41,8 | 15,8 | 40,7 | 56,1 | 0,2 % |
| Startsamling 4-2-3-1 | 47,9 | 12,7 | 41,9 | 47,6 | 0,6 % |
| Foreslået hold fra samme startsamling | 53,0 | 9,7 | 46,7 | 45,4 | 3,2 % |
| Alle kort, 4-3-3, Open League | 96,9 | 1,0 | 103,6 | 22,5 | 100,0 % |
| Garanteret Italy-hold | 43,4 | 14,3 | 41,0 | 54,1 | 0,0 % |
| Alle kort, Italy | 78,5 | 1,6 | 73,2 | 32,4 | 69,2 % |

**Det vi har belæg for:** ændringer inden for samme startsamling kan forbedre resultaterne. Mere defensiv opstilling kan reducere indkasserede mål på bekostning af mål for. De garanterede Italy-kort giver adgang, men ikke en let titel. Elitekort gør første challenge let, hvilket giver en grund til at gå videre.

**Det vi endnu ikke har belæg for:** at alle formationer er lige attraktive på tværs af alle samlinger, eller at den langsigtede balance er god. De samme 11 spillere er dårligere i 4-4-2 i dette udsnit; det betyder ikke, at alle 4-4-2-hold er dårligere. 100 % i den målte Open League-prøve er ikke en matematisk garanti for sejr.

En lokal følsomhedsprøve omkring ATK/MID/DEF = 75 viser, at fem ekstra point i hver af de tre stats forbedrer forventet målforskel. Forskellene ligger i samme størrelsesorden. Det udelukker ikke dominerende strategier ved andre holdprofiler; mere balancearbejde skal følge faktisk spiltest.
