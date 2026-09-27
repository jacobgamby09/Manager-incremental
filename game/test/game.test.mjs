import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSquad, teamRatings, chooseSquad, newSeason, advanceSeason, finishSeason, standings, schedule, match, expectedGoals, opponents } from '../dist/engine.js';
import { freshState, validSave, completeSeason, claimPack, claimElite } from '../dist/state.js';
const data=JSON.parse(await readFile(new URL('../../data/prototype-content.json',import.meta.url),'utf8'));
const example=i=>({formation:data.squadExamples[i].formation,lineup:data.squadExamples[i].lineup.map(x=>x.cardId)});

test('historical versions share a person, Italy is based on club not nationality',()=>{
 const s=example(4);assert.equal(validateSquad(data,s,'italy-six').valid,true);
 s.lineup[s.lineup.indexOf('salah-roma-2015')]='salah-liverpool-2018';assert.equal(validateSquad(data,s,'italy-six').italy,5);
 assert.equal(validateSquad(data,s,'italy-six').valid,false);
 s.lineup[s.lineup.indexOf('fischer-ajax-2012')]='salah-roma-2015';assert.match(validateSquad(data,s,'open-league').errors.join(),/én version/);
});
test('ownership and goalkeeper position are enforced',()=>{
 const s=example(0);s.lineup[0]='buffon-juventus-2016';assert.equal(validateSquad(data,s,'open-league',data.initialCollection).valid,false);
 [s.lineup[0],s.lineup[9]]=[s.lineup[9],s.lineup[0]];assert.match(validateSquad(data,s,'open-league').errors.join(),/kan ikke spille/);
});
test('all three formations and both challenge mastery squads can be built',()=>{
 for(const f of Object.keys(data.formations)){
  const s=chooseSquad(data,data.cards.filter(c=>data.initialCollection.includes(c.id)),f);
  assert(s);assert.equal(validateSquad(data,s,'open-league',data.initialCollection).valid,true);
  const italy=chooseSquad(data,data.cards,f,{minItaly:8});assert(italy);assert.equal(validateSquad(data,italy,'italy-six').valid,true);
 }
 assert(teamRatings(data,example(0)).ovr<=80);
 assert.equal(chooseSquad(data,data.cards.filter(c=>data.initialCollection.includes(c.id)),'4-3-3',{minItaly:6}),null);
});
test('OVR is display-only and formations change the same eleven players',()=>{
 const modified=structuredClone(data);modified.cards.forEach(c=>c.ovr=99);
 const a=teamRatings(data,example(0)),b=teamRatings(modified,example(0));
 for(const k of ['atk','mid','def'])assert.equal(a[k],b[k]);
 assert.notEqual(a.def,teamRatings(data,example(1)).def);
});
test('schedule covers every ordered pair once, 19 home and 19 away per team',()=>{
 const rounds=schedule();assert.equal(rounds.length,38);const pairs=new Set();const homes=Array(20).fill(0),aways=Array(20).fill(0);
 for(const round of rounds){assert.equal(new Set(round.flat()).size,20);for(const[h,a]of round){assert(!pairs.has(`${h}-${a}`));pairs.add(`${h}-${a}`);homes[h]++;aways[a]++;}}
 assert.equal(pairs.size,380);assert(homes.every(n=>n===19)&&aways.every(n=>n===19));
});
test('all AI teams have real cards, valid positions and meet Italy rules',()=>{
 for(const id of ['open-league','italy-six']){const teams=opponents(data,id);assert.equal(teams.length,19);for(const t of teams)assert.equal(validateSquad(data,t.squad,id).valid,true);}
});
test('seeded matches and resumed seasons are deterministic',()=>{
 const s=newSeason(data,example(0),'open-league',1234);for(let i=0;i<11;i++)advanceSeason(s);
 const resumed=JSON.parse(JSON.stringify(s));finishSeason(s);finishSeason(resumed);assert.deepEqual(resumed,s);
 const fresh=finishSeason(newSeason(data,example(0),'open-league',1234));assert.deepEqual(fresh,s);
});
test('full season conserves goals, points and played matches',()=>{
 const s=finishSeason(newSeason(data,example(0),'open-league',200));assert(s.table.every(t=>t.played===38&&t.w+t.d+t.l===38));
 assert.equal(s.table.reduce((n,t)=>n+t.gf,0),s.table.reduce((n,t)=>n+t.ga,0));
 const draws=s.results.flat().filter(m=>m.homeGoals===m.awayGoals).length;
 assert.equal(s.table.reduce((n,t)=>n+t.points,0),380*3-draws);
 assert.equal(standings(s).length,20);
});
test('better stats improve expectation; upsets remain possible',()=>{
 const low={atk:70,mid:70,def:70},high={atk:80,mid:80,def:80};assert(expectedGoals(high,low)>expectedGoals(low,high));
 let wins=0,losses=0;for(let i=1;i<=2000;i++){const m=match(high,low,i);if(m.homeGoals>m.awayGoals)wins++;if(m.homeGoals<m.awayGoals)losses++;}
 assert(wins>1000);assert(losses>10);
 for(const k of ['atk','mid'])assert(expectedGoals({...low,[k]:80},low)>expectedGoals(low,low));
 assert(expectedGoals(low,{...low,def:80})<expectedGoals(low,low));
});
test('four completed losing seasons guarantee a legal Italy squad, rewards exactly once',()=>{
 const state=freshState(data);
 for(let i=1;i<=4;i++){
  state.season=finishSeason(newSeason(data,state.squads['open-league'],'open-league',300+i));
  const player=state.season.table[0];player.points=0;
  completeSeason(data,state);const pending=structuredClone(state.pendingPack);completeSeason(data,state);assert.deepEqual(state.pendingPack,pending);assert.equal(state.completed['open-league'],i);
  const serialized=JSON.parse(JSON.stringify(state));assert(validSave(data,serialized,false));
  claimPack(state);assert(state.owned.includes(data.onboardingMilestones[i-1].cardId));
  const owned=state.owned.length;claimPack(state);assert.equal(state.owned.length,owned);
 }
 const s=chooseSquad(data,state.owned.map(id=>data.cards.find(c=>c.id===id)),'4-3-3',{minItaly:6});assert(s);assert(validateSquad(data,s,'italy-six',state.owned).valid);
});
test('pack pool depletion gives no duplicates and first trophy grants one valid elite',()=>{
 const state=freshState(data);state.season=finishSeason(newSeason(data,state.squads['open-league'],'open-league',500));state.season.table[0].points=999;
 completeSeason(data,state);assert(state.eliteChoices.length>0);const id=state.eliteChoices[0];claimPack(state);claimElite(state,id);assert(state.owned.includes(id));assert.equal(state.eliteChoices.length,0);assert.throws(()=>claimElite(state,id));
 state.owned=data.cards.map(c=>c.id);state.season=finishSeason(newSeason(data,state.squads['open-league'],'open-league',501));completeSeason(data,state);assert.equal(state.pendingPack.cards.length,0);
});
test('sandbox never grants packs and saved careers validate independently',()=>{
 const state=freshState(data,true);assert.equal(state.owned.length,48);state.season=finishSeason(newSeason(data,state.squads['open-league'],'open-league',42));completeSeason(data,state);assert.equal(state.pendingPack,null);
 assert(validSave(data,state,true));assert(!validSave(data,state,false));assert(!validSave(data,{version:1},false));
});
