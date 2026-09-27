import { readFile, writeFile } from 'node:fs/promises';
import { teamRatings, chooseSquad, newSeason, finishSeason, seasonSummary, expectedGoals } from '../dist/engine.js';
const data=JSON.parse(await readFile(new URL('../../data/prototype-content.json',import.meta.url),'utf8'));
const example=i=>({formation:data.squadExamples[i].formation,lineup:data.squadExamples[i].lineup.map(x=>x.cardId)});
const profiles=[
 ['Start 4-3-3',example(0),'open-league'],['Samme 11 i 4-4-2',example(1),'open-league'],['Start 4-2-3-1',example(2),'open-league'],
 ['Foreslået startkollektion',chooseSquad(data,data.cards.filter(c=>data.initialCollection.includes(c.id)),'4-3-3',{target:99}),'open-league'],
 ['Alle kort 4-3-3',chooseSquad(data,data.cards,'4-3-3',{target:99}),'open-league'],
 ['Garanteret Italy-hold',example(3),'italy-six'],['Alle kort Italy',chooseSquad(data,data.cards,'4-3-3',{target:99,minItaly:6}),'italy-six'],
];
const runs=500,rows=[];
for(const[name,squad,challenge]of profiles){
 const sums={points:0,rank:0,gf:0,ga:0,titles:0};
 for(let i=0;i<runs;i++){
  const result=seasonSummary(finishSeason(newSeason(data,squad,challenge,10000+i*127)));
  for(const k of ['points','rank','gf','ga'])sums[k]+=result[k];if(result.rank===1)sums.titles++;
 }
 const ratings=teamRatings(data,squad);
 rows.push({name,challenge,ratings,...Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v/runs]))});
}
const baseline={atk:75,mid:75,def:75};
const sensitivity=['atk','mid','def'].map(stat=>{
 const improved={...baseline,[stat]:80};
 return {stat,expectedGoalDifference:expectedGoals(improved,baseline,true)-expectedGoals(baseline,improved,false)};
});
const report={engineVersion:'0.1',runsPerProfile:runs,seedMethod:'Samme 500 seeds og faste modstandere pr. challenge; inverse Poisson-CDF bruger én tilfældig værdi pr. hold pr. kamp.',profiles:rows,sensitivity};
await writeFile(new URL('../../docs/balance-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.table(rows.map(r=>({Hold:r.name,Point:r.points.toFixed(1),Plads:r.rank.toFixed(1),GF:r.gf.toFixed(1),GA:r.ga.toFixed(1),'Titler %':(r.titles*100).toFixed(1),ATK:r.ratings.atk.toFixed(1),MID:r.ratings.mid.toFixed(1),DEF:r.ratings.def.toFixed(1)})));
console.table(sensitivity);
