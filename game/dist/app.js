import { WEIGHTS, teamRatings, validateSquad, chooseSquad, canPlay, newSeason, advanceSeason, finishSeason, standings, opponents } from './engine.js';
import { freshState, validSave, completeSeason, claimPack, claimElite } from './state.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#player-dialog');
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let data, state, view = 'squad', timer = null, speed = 900, picker = null, query = '', collectionFilter = 'owned', packRevealed = false;
let memoryOnly = false, toastTimer;
const key = sandbox => `career-cards-v1-${sandbox ? 'sandbox' : 'career'}`;
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 4500); }
function load(sandbox = false) {
  try {
    const raw = localStorage.getItem(key(sandbox));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (validSave(data, parsed, sandbox)) return parsed;
      localStorage.setItem(key(sandbox) + '-backup-' + Date.now(), raw);
      toast('Den gamle lagring kunne ikke læses. En sikkerhedskopi er bevaret.');
    }
  } catch { memoryOnly = true; }
  return freshState(data, sandbox);
}
function save() { try { localStorage.setItem(key(state.sandbox), JSON.stringify(state)); } catch { memoryOnly = true; toast('Browseren kan ikke gemme. Hold siden åben for at beholde fremgangen.'); } }
const card = id => data.cards.find(c => c.id === id);
const squad = () => state.squads[state.challengeId];
const active = () => state.season && state.season.round < 38;
const challenge = () => data.challenges.find(c => c.id === state.challengeId);
const round = n => Math.round(n);
const shortName = c => c.name.replace(/^(Mohamed|Christian|Jasper|Toby|Daley|Lasse|Siem|Viktor|Joël|Nathaniel|Victor|Rickie|Alessandro|Wojciech|Gianluigi|Virgil|Trent|Andrew|Roberto|Gonzalo|Miralem|Daniele|Antonio|Radja|Lucas|Kostas|Leonardo|Giorgio|Paulo|Sadio|Morgan|Fabian|Valentin|Dejan|Luke|Adam|Jay|Artur|Yann|José|Edin) /, '');
const clubShort = c => ({ 'Southampton':'SOUTHAMPTON', 'Liverpool':'LIVERPOOL', 'Juventus':'JUVENTUS', 'AS Roma':'ROMA', 'Ajax':'AJAX', 'FC Basel':'BASEL' })[c.club];
const clubClass = c => c.club.toLowerCase().replace(/[^a-z]/g, '');
function stats(ratings, compared) {
  return `<div class="ratings">${['atk','mid','def'].map(k => { const delta = compared ? ratings[k] - compared[k] : 0; return `<div class="rating"><span>${k.toUpperCase()}</span><strong>${ratings[k].toFixed(1)}</strong><div class="meter"><i style="width:${ratings[k]}%"></i></div>${compared ? `<small class="${delta >= 0 ? 'positive' : 'negative'}">${delta >= 0 ? '+' : ''}${delta.toFixed(1)}</small>` : ''}</div>`; }).join('')}</div>`;
}
function miniCard(c, index, slot) {
  return `<button class="pitch-card ${clubClass(c)} ${c.ovr >= 85 ? 'elite' : ''}" data-action="pick" data-index="${index}" aria-label="Skift ${slot}: ${escape(c.name)}" ${active() ? 'disabled' : ''}><div class="card-top"><b>${c.ovr}</b><span>${slot}</span>${c.clubCountry === 'ITA' ? '<i class="italy-mark" title="Italiensk klub">IT</i>' : ''}</div><div class="card-name">${escape(shortName(c))}</div><div class="card-club">${clubShort(c)}</div><div class="card-year">${c.season}</div></button>`;
}
const layouts = {
  '4-3-3': [[10,9,8],[6,7],[5],[4,3,2,1],[0]],
  '4-4-2': [[9,10],[8,7,6,5],[4,3,2,1],[0]],
  '4-2-3-1': [[10],[9,8,7],[5,6],[4,3,2,1],[0]],
};
function pitch() {
  const s = squad(), slots = data.formations[s.formation];
  return `<div class="pitch" aria-label="Dit hold på banen"><div class="pitch-markings"><div class="centre-circle"></div><div class="halfway"></div><div class="penalty top"></div><div class="penalty bottom"></div></div><div class="pitch-rows ${s.formation === '4-4-2' ? 'four-rows' : ''}">${layouts[s.formation].map(row => `<div class="pitch-row">${row.map(i => miniCard(card(s.lineup[i]),i,slots[i])).join('')}</div>`).join('')}</div><span class="pitch-caption">${active() ? 'HOLDET ER LÅST UNDER SÆSONEN' : 'VÆLG EN SPILLER FOR AT SKIFTE'}</span></div>`;
}
function header() {
  const counts = state.history.length;
  return `<header class="topbar"><a class="brand" href="#" data-action="nav" data-view="squad"><span class="brand-symbol">CC<span>11</span></span><span>CAREER<span class="brand-light">CARDS</span><small>DIN KLUB. DERES HISTORIE.</small></span></a><div class="club-identity"><span class="club-avatar">H</span><div><strong>${escape(state.clubName)}</strong><small>${state.sandbox ? 'Testbane · alle kort' : 'Din historiske drømmeellever'}</small></div></div><div class="header-stats"><span><b>${state.owned.length}<small>/48</small></b>KORT</span><span><b>${counts}</b>SÆSONER</span></div></header><nav class="main-nav" aria-label="Spillets sider">${[['squad','Holdbygger','01'],['season','Sæson','02'],['collection','Samling','03'],['history','Klubhistorie','04']].map(([id,label,n])=>`<button data-action="nav" data-view="${id}" class="${view===id?'selected':''}"><span>${n}</span>${label}${id==='season'&&active()?'<i class="live-dot"></i>':''}</button>`).join('')}<button class="mode-button" data-action="mode">${state.sandbox ? 'Tilbage til karriere' : 'Testbane'}</button></nav>${memoryOnly?'<div class="notice">Lagring er utilgængelig. Fremgangen bevares kun, mens siden er åben.</div>':''}${state.sandbox?'<div class="sandbox-banner">TESTBANE <span>Alle 48 kort · ingen belønninger · din karriere er gemt separat</span></div>':''}`;
}
function squadView() {
  const s = squad(), r = teamRatings(data,s), validation=validateSquad(data,s,state.challengeId,state.owned);
  const previous=state.history.find(h=>h.challengeId===state.challengeId);
  const unused=state.owned.map(card).filter(c=>!s.lineup.includes(c.id)).sort((a,b)=>b.ovr-a.ovr);
  return `<div class="page-heading"><div><div class="eyebrow">MANAGERENS KONTOR</div><h1>Dit næste vinderhold.</h1><p>Byg med historien. Vind med balancen.</p></div><div class="overall"><span>HOLD OVR</span><strong>${round(r.ovr)}</strong></div></div><div class="squad-layout"><section class="pitch-panel"><div class="panel-toolbar"><span class="section-label">STARTELLEVER</span><div class="formation-control" role="group" aria-label="Formation">${Object.keys(data.formations).map(f=>`<button data-action="formation" data-formation="${f}" class="${s.formation===f?'selected':''}" ${active()?'disabled':''}>${f}</button>`).join('')}</div></div>${pitch()}<div class="pitch-footer"><span>11 spillere · ${validation.italy} fra italienske klubber</span><button class="text-button" data-action="autofill" ${active()?'disabled':''}>Foreslå hold ↗</button></div></section><aside class="squad-sidebar"><section class="panel strength-panel"><div class="section-heading"><h2>Holdets profil</h2><button class="help-button" data-action="rules" aria-label="Hvordan beregnes holdets styrke?">?</button></div>${stats(r)}<p class="muted">${r.atk>r.def+5?'Meget offensiv styrke. Hold øje med målene imod dig.':r.def>r.atk+5?'Et solidt fundament. Kan du skabe flere chancer?':'Et alsidigt hold. Find den næste lille forbedring.'}</p></section><section class="panel challenge-panel"><div class="section-heading"><h2>Næste udfordring</h2><span class="section-index">02</span></div>${data.challenges.map(c=>`<button class="challenge-choice ${c.id===state.challengeId?'chosen':''}" data-action="challenge" data-challenge="${c.id}" ${active()?'disabled':''}><span class="challenge-icon">${c.id==='open-league'?'◎':'IT'}</span><span><strong>${c.name}</strong><small>${c.id==='open-league'?'Hele verden. Dit bedste hold.':'Mindst 6 kort fra italienske klubber'}</small></span><span class="choice-indicator">${state.trophies[c.id]?'★':c.id===state.challengeId?'●':'○'}</span></button>`).join('')}<div class="challenge-meta"><span>20 hold</span><span>38 kampe</span><span>1 trofæ</span></div>${!validation.valid?`<p class="entry-error">${escape(validation.errors[0])}</p>`:`<p class="entry-ready">${state.challengeId==='italy-six'?validation.italy+'/6 italienske klubkort · Klar til start':'Dit hold er klar til sæsonen'}</p>`}<button class="primary full" data-action="start" ${!validation.valid?'disabled':''}>${active()?'Fortsæt sæsonen →':state.pendingPack||state.eliteChoices.length?'Se dine belønninger →':'Start sæson →'}</button><p class="tiny">${state.challengeId==='italy-six'?'Mastery: vind med mindst 8 italienske klubkort.':'Mastery: vind med højst 80 i gennemsnitlig OVR.'}</p></section>${previous?`<section class="previous"><span>SIDSTE ${challenge().name.toUpperCase()}</span><strong>#${previous.rank} <small>${previous.points} point · ${previous.gf}–${previous.ga} mål</small></strong></section>`:`<section class="next-reward"><span>NÆSTE MILEPÆL</span><strong>${state.completed['open-league']<4?'En sæson. Nye muligheder.':'Byg dit italienske hold.'}</strong><p>${state.completed['open-league']<4?'Næste Open League-milepæl: '+escape(card(data.onboardingMilestones[state.completed['open-league']].cardId).name)+' fra Roma.':'Du har gennemført introduktionen. Find balancen til Italy Challenge.'}</p></section>`}</aside></div><section class="bench-section"><div class="section-heading"><div><span class="eyebrow">FLERE MULIGHEDER</span><h2>På sidelinjen <small>${unused.length}</small></h2></div><button class="text-button" data-action="nav" data-view="collection">Se samlingen ↗</button></div><div class="bench-strip">${unused.map(c=>`<button class="bench-card" data-action="detail" data-card="${c.id}"><b>${c.ovr}</b><span><strong>${escape(c.name)}</strong><small>${c.club} · ${c.season}</small></span><em>${c.positions[0]}</em></button>`).join('')}</div></section>`;
}
function render() {
  const focused=document.activeElement?.closest('[data-action]');
  const focusData=focused?.dataset?{...focused.dataset}:null;
  const ready=validateSquad(data,squad(),state.challengeId,state.owned).valid;
  app.innerHTML = `${header()}<main>${view==='squad'?squadView():view==='season'?seasonView():view==='collection'?collectionView():historyView()}</main><footer><span>CAREER CARDS <b>PROTOTYPE 0.1</b></span><span>Historiske spillere · egne spilratings</span><button class="text-button" data-action="settings">Klubindstillinger</button></footer>${view==='squad'?`<div class="mobile-playbar"><div><strong>${challenge().name}</strong><small>${ready?'Holdet er klar':'Kræver 6 italienske klubkort'}</small></div><button class="primary" data-action="start" ${ready?'':'disabled'}>${active()?'Fortsæt →':state.pendingPack||state.eliteChoices.length?'Belønninger →':'Spil sæson →'}</button></div>`:''}`;
  if(focusData&&!dialog.open){const replacement=[...app.querySelectorAll('[data-action]')].find(el=>Object.entries(focusData).every(([k,v])=>el.dataset[k]===v)&&el.getClientRects().length);replacement?.focus({preventScroll:true});}
}
function openDialog(content) { dialog.innerHTML=content; if(!dialog.open) dialog.showModal(); }
function dialogShell(title,body) { return `<div class="dialog-header"><div><span class="eyebrow">CAREER CARDS</span><h2 id="dialog-title">${title}</h2></div><button class="close-button" data-action="close" aria-label="Luk">×</button></div>${body}`; }
function detailMarkup(c) { return `<div class="detail-card ${clubClass(c)}"><div class="detail-top"><strong>${c.ovr}</strong><span>${c.positions.join(' / ')}<br>${c.nationality}</span></div><h3>${escape(c.name)}</h3><p>${c.club} · ${c.season}</p><div class="card-stats"><span><b>${c.atk}</b>ATK</span><span><b>${c.mid}</b>MID</span><span><b>${c.def}</b>DEF</span></div></div>`; }
function showPicker(index) {
  if(active()) return;
  picker=index; const s=squad(),slot=data.formations[s.formation][index],current=card(s.lineup[index]),base=teamRatings(data,s);
  const used=s.lineup.filter((_,i)=>i!==index).map(id=>card(id).playerId);
  const candidates=state.owned.map(card).filter(c=>canPlay(c,slot)&&!used.includes(c.playerId)).sort((a,b)=>b.ovr-a.ovr);
  openDialog(dialogShell(`Vælg ${slot}`,`<p class="muted">Nu: ${escape(current.name)} · ${current.club} ${current.season}</p><div class="picker-list">${candidates.map(c=>{ const alternative={...s,lineup:s.lineup.map((id,i)=>i===index?c.id:id)},next=teamRatings(data,alternative); return `<button class="candidate ${current.id===c.id?'current':''}" data-action="replace" data-card="${c.id}"><div class="candidate-main"><b class="ovr-chip">${c.ovr}</b><span><strong>${escape(c.name)}</strong><small>${c.club} · ${c.season} ${c.clubCountry==='ITA'?'· IT':''}</small></span><span>${current.id===c.id?'VALGT':'VÆLG'}</span></div><div class="candidate-stats"><span>KORT ${c.atk} / ${c.mid} / ${c.def}</span>${['atk','mid','def'].map(k=>{const delta=next[k]-base[k];return `<span class="${delta>.04?'positive':delta<-.04?'negative':''}">${k.toUpperCase()} ${delta>=0?'+':''}${delta.toFixed(1)}</span>`}).join('')}</div></button>`;}).join('')}</div><p class="tiny">Ændringerne viser hele holdets ATK / MID / DEF. Kun ejede kort på lovlige positioner vises.</p>`));
}
function seasonView() {
  const season=state.season;
  if(!season) return `<section class="empty-state"><div class="eyebrow">SÆSONEN VENTER</div><h1>Fra holdkort til ligatabel.</h1><p>Vælg dit hold og din challenge. Så spiller vi om pointene.</p><button class="primary" data-action="nav" data-view="squad">Til holdbyggeren →</button></section>`;
  const table=standings(season), position=table.findIndex(t=>t.id==='player')+1, you=table[position-1],finished=season.round===38;
  const recent=season.results.at(-1)?.find(m=>m.home===0||m.away===0);
  const next=season.fixtures[season.round]?.find(([h,a])=>h===0||a===0);
  const home=recent?season.teams[recent.home]:next?season.teams[next[0]]:null,away=recent?season.teams[recent.away]:next?season.teams[next[1]]:null;
  const previous=state.history.find(h=>h.challengeId===season.challengeId&&h.id!==season.id);
  const name=data.challenges.find(c=>c.id===season.challengeId).name;
  const sequence=season.results.map(r=>r.find(m=>m.home===0||m.away===0));
  return `<div class="page-heading"><div><div class="eyebrow">${finished?'SÆSONEN ER AFSLUTTET':'KAMPDAG · '+season.round+' / 38'}</div><h1>${name}</h1><p>${finished?'Nye erfaringer. Nye kort. Det næste hold venter.':'Holdet er låst. Nu skal arbejdet på banen vise sig.'}</p></div><div class="overall"><span>${finished?'SLUTPLADS':'PLACERING'}</span><strong>${season.round?'#'+position:'—'}</strong></div></div><div class="season-layout"><section class="season-main"><div class="scoreboard"><div class="scoreboard-label">${finished?(position===1?'★ MESTRE ★':position<=4?'SØLV · TOP 4':position<=10?'BRONZE · TOP 10':'SÆSON AFSLUTTET'):recent?'KAMPDAG '+season.round:'FØRSTE KAMP'}</div><div class="scoreline"><div><span class="team-emblem">${home?.id==='player'?'H':'FC'}</span><strong>${escape(home?.name||'')}</strong></div><b>${recent?recent.homeGoals+' <span>:</span> '+recent.awayGoals:'<span>VS</span>'}</b><div><span class="team-emblem away">${away?.id==='player'?'H':'FC'}</span><strong>${escape(away?.name||'')}</strong></div></div>${recent?`<p class="xg-line">Forventede mål <b>${recent.xgHome.toFixed(2)} – ${recent.xgAway.toFixed(2)}</b></p>`:'<p class="xg-line">38 kampe. Alle point tæller.</p>'}<div class="season-progress"><i style="width:${season.round/38*100}%"></i></div><div class="season-controls">${!finished?`<button class="primary" data-action="play">${timer?'Pause':'Spil automatisk'}</button><button class="secondary" data-action="step">Næste kamp</button><button class="text-button" data-action="finish">Til slutresultatet ↗</button><label class="speed-label">Tempo <select id="season-speed" aria-label="Sæsonens tempo"><option value="1800" ${speed===1800?'selected':''}>Roligt</option><option value="900" ${speed===900?'selected':''}>Hurtigt</option><option value="200" ${speed===200?'selected':''}>Lynhurtigt</option></select></label>`:`<button class="primary" data-action="${state.pendingPack?'pack':state.eliteChoices.length?'elite':'nav'}" data-view="squad">${state.pendingPack?'Åbn belønningspack →':state.eliteChoices.length?'Vælg dit elitekort →':'Tilpas holdet →'}</button><span class="muted">${state.sandbox?'Testbane · ingen belønninger':position===1?'Trofæet er dit!':'Hver sæson bygger din samling.'}</span>`}</div></div><div class="season-metrics">${[['POINT',you.points],['V / U / T',you.w+' / '+you.d+' / '+you.l],['MÅL FOR',you.gf],['MÅL IMOD',you.ga]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>${finished&&previous?`<div class="comparison"><b>Siden sidste ${name}</b><span class="${you.points>=previous.points?'positive':'negative'}">${you.points>=previous.points?'+':''}${you.points-previous.points} point</span><span>Mål: ${previous.gf}–${previous.ga} → ${you.gf}–${you.ga}</span><span>Placering: #${previous.rank} → #${position}</span></div>`:''}<section class="panel"><div class="section-heading"><h2>Din sæson, kamp for kamp</h2><span class="muted">${season.round}/38</span></div><div class="form-grid">${Array.from({length:38},(_,i)=>{const m=sequence[i];if(!m)return `<div class="form-result waiting"><small>${i+1}</small><b>–</b></div>`;const gf=m.home===0?m.homeGoals:m.awayGoals,ga=m.home===0?m.awayGoals:m.homeGoals;return `<div class="form-result ${gf>ga?'win':gf<ga?'loss':'draw'}" title="${escape(season.teams[m.home===0?m.away:m.home].name)}"><small>${i+1}</small><b>${gf}–${ga}</b><span>${gf>ga?'V':gf<ga?'T':'U'}</span></div>`;}).join('')}</div></section>${next?`<section class="next-opponent"><span class="eyebrow">NÆSTE MODSTANDER</span><div><h2>${escape(season.teams[next[0]===0?next[1]:next[0]].name)}</h2><button class="text-button" data-action="opponent" data-team="${next[0]===0?next[1]:next[0]}">Se holdet ↗</button></div></section>`:''}</section><section class="panel table-panel"><div class="section-heading"><h2>Ligatabellen</h2><span class="section-index">${season.round} / 38</span></div><div class="table-scroll"><table><thead><tr><th>#</th><th>Klub</th><th>K</th><th>+/−</th><th>P</th></tr></thead><tbody>${table.map((t,i)=>`<tr class="${t.id==='player'?'your-row':''}"><td>${i+1}</td><td><button class="table-team" data-action="opponent" data-team="${season.teams.findIndex(x=>x.id===t.id)}">${escape(t.name)}</button></td><td>${t.played}</td><td>${t.gf-t.ga>0?'+':''}${t.gf-t.ga}</td><td><b>${t.points}</b></td></tr>`).join('')}</tbody></table></div><p class="tiny">Point → målforskel → scorede mål. Ved fuld lighed bruges et fast lodnummer.</p></section></div>`;
}
function collectionView() {
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const cards=data.cards.filter(c=>(collectionFilter!=='owned'||state.owned.includes(c.id))&&(collectionFilter!=='missing'||!state.owned.includes(c.id))&&(collectionFilter!=='italy'||c.clubCountry==='ITA')&&normalize(c.name+' '+c.club+' '+c.season+' '+c.positions.join(' ')).includes(normalize(query))).sort((a,b)=>b.ovr-a.ovr);
  return `<div class="page-heading"><div><div class="eyebrow">DIN FOOTBALL COLLECTION</div><h1>${state.owned.length} historier. Ét hold.</h1><p>Forskellige sæsoner. Nye muligheder.</p></div><div class="collection-count">${state.owned.length}<span>/ 48</span></div></div><div class="collection-progress"><i style="width:${state.owned.length/48*100}%"></i></div><div class="collection-toolbar"><label class="search-label"><span>Søg i samlingen</span><input id="collection-search" type="search" placeholder="Spiller, klub eller sæson…" value="${escape(query)}"></label><label><span>Vis kort</span><select id="collection-filter"><option value="owned" ${collectionFilter==='owned'?'selected':''}>Mine kort</option><option value="all" ${collectionFilter==='all'?'selected':''}>Alle 48 kort</option><option value="missing" ${collectionFilter==='missing'?'selected':''}>Mangler i samlingen</option><option value="italy" ${collectionFilter==='italy'?'selected':''}>Italienske klubber</option></select></label><span class="muted">${cards.length} kort</span></div>${cards.length?`<div class="collection-grid">${cards.map(c=>`<button class="collection-card ${state.owned.includes(c.id)?'':'unowned'}" data-action="detail" data-card="${c.id}" aria-label="${escape(c.name)}, ${c.club} ${c.season}, OVR ${c.ovr}, ${state.owned.includes(c.id)?'ejet':'ikke fundet'}">${detailMarkup(c)}<span class="ownership">${state.owned.includes(c.id)?'I SAMLINGEN':'IKKE FUNDET ENDNU'}</span></button>`).join('')}</div>`:'<div class="empty-state"><h2>Ingen kort matcher.</h2><p>Prøv et andet navn eller skift filter.</p></div>'}`;
}
function historyView() {
  if(!state.history.length)return `<section class="empty-state"><h1>Din klubhistorie starter her.</h1><p>Gennemfør en sæson for at sætte dit første resultat på tavlen.</p><button class="primary" data-action="nav" data-view="squad">Byg dit hold →</button></section>`;
  return `<div class="page-heading"><div><div class="eyebrow">${escape(state.clubName.toUpperCase())}</div><h1>Hver sæson tæller.</h1><p>Se dine hold og resultater. Find ud af, hvad der virkede.</p></div></div><div class="trophy-grid">${data.challenges.map(c=>{const results=state.history.filter(h=>h.challengeId===c.id);return `<section class="panel"><span class="trophy-symbol ${state.trophies[c.id]?'won':''}">★</span><div><h2>${c.name}</h2><p class="muted">${results.length?'Bedste placering: #'+Math.min(...results.map(h=>h.rank)):'Ingen sæsoner endnu'}</p><span class="tiny">${state.trophies[c.id]?'Trofæ vundet':'Trofæ mangler'} · ${state.mastery[c.id]?'Mastery klaret':'Mastery mangler'}</span></div></section>`;}).join('')}</div><section class="panel"><div class="section-heading"><h2>Sæsonarkiv</h2><span class="muted">${state.history.length} sæsoner</span></div><div class="history-list">${state.history.map((h,i)=>`<button class="history-row" data-action="history-detail" data-history="${i}"><strong class="rank">#${h.rank}</strong><span><b>${data.challenges.find(c=>c.id===h.challengeId).name}</b><small>${h.squad.formation} · OVR ${h.ratings.ovr.toFixed(1)} · ${new Date(h.date).toLocaleDateString('da-DK')}</small></span><span><b>${h.points} point</b><small>${h.w}V / ${h.d}U / ${h.l}T</small></span><span><b>${h.gf}–${h.ga}</b><small>Mål</small></span><span>↗</span></button>`).join('')}</div></section>`;
}
function handleAction(action,el) {
  if(action==='nav') { view=el.dataset.view; render(); return; }
  if(action==='close') { dialog.close(); return; }
  if(action==='pick') { showPicker(Number(el.dataset.index)); return; }
  if(action==='detail') { const c=card(el.dataset.card);openDialog(dialogShell('Spillerkort',`${detailMarkup(c)}<p>${escape(c.designPurpose)}</p><p class="muted">${c.clubCountry==='ITA'?'Tæller til Italy Challenge.':'Tæller ikke til Italy Challenge.'} ${state.owned.includes(c.id)?'I din samling.':'Ikke fundet endnu.'}</p>`));return; }
  if(action==='replace') { if(active()) return; squad().lineup[picker]=el.dataset.card; save();dialog.close();render();toast('Holdet er opdateret.');return; }
  if(action==='formation') {
    if(active()) return;
    const next=chooseSquad(data,state.owned.map(card),el.dataset.formation,{preferred:squad().lineup});
    if(!next) {toast('Samlingen kan endnu ikke udfylde denne formation.');return;}
    state.squads[state.challengeId]=next;save();render();toast('Formation ændret. Se den nye holdprofil.');return;
  }
  if(action==='challenge') { if(active())return;state.challengeId=el.dataset.challenge;save();render();return; }
  if(action==='autofill') { if(active())return; const next=chooseSquad(data,state.owned.map(card),squad().formation,{target:99,minItaly:state.challengeId==='italy-six'?6:0});if(!next){toast('Du mangler kort til et lovligt Italy-hold. Spil Open League for at finde flere.');return;}state.squads[state.challengeId]=next;save();render();toast('Et lovligt hold er foreslået. Justér det efter din spillestil.');return; }
  if(action==='mode') { stopTimer();save();state=load(!state.sandbox);view=active()?'season':'squad';save();render();return; }
  if(action==='rules') { openDialog(dialogShell('Sådan spiller styrkerne sammen',`<p><b>ATK</b> mod modstanderens <b>DEF</b> afgør kvaliteten af dine chancer. <b>MID</b> påvirker, hvor mange chancer holdet skaber.</p><p>Positionen vægter hvert korts bidrag. En angribers ATK tæller mest, og en midtbanespillers MID tæller mest. Alle tre holdratings er vægtede gennemsnit.</p><p>GK bruger DEF til målmandskvalitet og MID til distribution. OVR giver ingen ekstra bonus. Hjemmebane giver en lille fordel, og tilfældighed gør overraskelser mulige.</p><p class="muted">En enkelt sæson beviser ikke, at en ændring er bedre. Sammenlign flere sæsoner og se på både mål for og imod.</p>`));return; }
  if(action==='start') { startSeason();return; }
  if(action==='play') { if(timer)stopTimer();else if(active())timer=setInterval(tick,speed);render();return; }
  if(action==='step') {stopTimer();tick();return;}
  if(action==='finish') {stopTimer();if(active()){finishSeason(state.season);completeSeason(data,state);save();render();}return;}
  if(action==='pack') {showPack();return;}
  if(action==='reveal') {packRevealed=true;showPack();return;}
  if(action==='claim-pack') {const found=claimPack(state);save();dialog.close();packRevealed=false;render();toast(found.length?`${found.length} nye kort er tilføjet til din samling.`:'Denne kortpulje er fuldført.');if(state.eliteChoices.length)showElite();return;}
  if(action==='elite') {showElite();return;}
  if(action==='claim-elite') {claimElite(state,el.dataset.card);save();dialog.close();render();toast('Dit elitekort er tilføjet til samlingen.');return;}
  if(action==='opponent') {const t=state.season?.teams[Number(el.dataset.team)];if(t)showSquadDetail(t.name,t.squad,t.ratings);return;}
  if(action==='history-detail') {const h=state.history[Number(el.dataset.history)];showSquadDetail(`#${h.rank} · ${h.points} point`,h.squad,h.ratings);return;}
  if(action==='settings') { openDialog(dialogShell('Din klub',`<label class="field-label" for="club-name">Klubnavn</label><input id="club-name" maxlength="30" value="${escape(state.clubName)}"><button class="primary full" data-action="save-settings">Gem klubnavn</button><p class="muted">Fremgangen gemmes automatisk i denne browser. Testbanen og karrieren gemmes hver for sig.</p>`));return; }
  if(action==='save-settings'){if(active()){toast('Afslut sæsonen, før du ændrer klubnavn.');return;}state.clubName=document.querySelector('#club-name').value.trim().slice(0,30)||'Historie FC';save();dialog.close();render();return;}
}
function stopTimer(){if(timer)clearInterval(timer);timer=null;}
function startSeason(){
  if(active()){view='season';render();return;}
  if(state.pendingPack){view='season';render();showPack();return;}
  if(state.eliteChoices.length){view='season';render();showElite();return;}
  const check=validateSquad(data,squad(),state.challengeId,state.owned);
  if(!check.valid){toast(check.errors[0]);return;}
  state.counter++;
  const seed=(crypto.getRandomValues(new Uint32Array(1))[0]^state.counter)>>>0;
  state.season=newSeason(data,squad(),state.challengeId,seed,state.clubName);
  view='season';save();render();
}
function tick(){
  if(!active()){stopTimer();return;}
  advanceSeason(state.season);
  if(state.season.round===38){stopTimer();completeSeason(data,state);toast('Sæsonen er færdig. Se resultatet og dine belønninger.');}
  save();render();
}
function showSquadDetail(title,s,ratings){openDialog(dialogShell(escape(title),`${stats(ratings)}<p class="muted">${s.formation} · OVR ${ratings.ovr.toFixed(1)}</p><div class="lineup-list">${s.lineup.map((id,i)=>{const c=card(id);return `<div><span>${data.formations[s.formation][i]}</span><strong>${escape(c.name)}</strong><small>${c.club} ${c.season}</small><b>${c.ovr}</b></div>`;}).join('')}</div>`));}
function showPack(){
  const pack=state.pendingPack;if(!pack)return;
  const title=pack.challengeId==='italy-six'?'Italy Pack':'World Pack';
  openDialog(dialogShell(title,packRevealed||!pack.cards.length?`<div class="pack-cards">${pack.cards.map(id=>detailMarkup(card(id))).join('')}</div>${!pack.cards.length?'<p>Du har alle kort i denne belønningspulje. Vind trofæet for at åbne elitepuljen, hvis du mangler den.</p>':''}<button class="primary full" data-action="claim-pack">${pack.cards.length?'Tilføj '+pack.cards.length+' kort til samlingen':'Fortsæt'} →</button>`:`<div class="pack-wrapper"><div class="pack-sealed"><span>CAREER CARDS</span><strong>${pack.challengeId==='italy-six'?'ITALY':'WORLD'}</strong><div class="pack-number">${pack.cards.length}</div><span>NYE HISTORIER</span></div><p class="muted">${pack.cards.length} nye kort. Hvilket hold bygger du nu?</p><button class="primary full" data-action="reveal">Åbn din pack →</button></div>`));
}
function showElite(){openDialog(dialogShell('Dit første trofæ. Dit elitekort.',`<p class="muted">Vælg ét kort som ekstra belønning.</p><div class="elite-choice-grid">${state.eliteChoices.map(id=>`<button class="collection-card" data-action="claim-elite" data-card="${id}">${detailMarkup(card(id))}<span class="ownership">VÆLG KORT</span></button>`).join('')}</div>`));}
document.addEventListener('input',event=>{if(event.target.id==='collection-search'){const cursor=event.target.selectionStart;query=event.target.value;render();const input=document.querySelector('#collection-search');input.focus();try{input.setSelectionRange(cursor,cursor);}catch{}}});
document.addEventListener('change',event=>{if(event.target.id==='collection-filter'){collectionFilter=event.target.value;render();}if(event.target.id==='season-speed'){speed=Number(event.target.value);if(timer){stopTimer();timer=setInterval(tick,speed);}render();}});
window.addEventListener('pagehide',()=>{stopTimer();if(state)save();});
function registerAgentTools(){
  const context=document.modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const tool=(name,description,inputSchema,execute,readOnlyHint=false)=>{
    try {Promise.resolve(context.registerTool({name,description,inputSchema,annotations:{readOnlyHint,untrustedContentHint:false},execute},{signal:lifecycle.signal})).catch(error=>console.warn('Valgfrit agentværktøj:',error.message));}
    catch(error){console.warn('Valgfrit agentværktøj:',error.message);}
  };
  const empty={type:'object',properties:{},additionalProperties:false};
  const read=()=>({club:state.clubName,sandbox:state.sandbox,ownedCards:state.owned.length,challenge:state.challengeId,squad:squad(),ratings:teamRatings(data,squad()),eligibility:validateSquad(data,squad(),state.challengeId,state.owned),round:state.season?.round??null,pendingPack:!!state.pendingPack});
  tool('read_club','Læs klubbens hold, styrker, adgangskrav og sæsonstatus.',empty,read,true);
  tool('start_season','Start en ny sæson med det aktuelle hold. Afviser ulovlige hold, aktive sæsoner og uafhentede belønninger.',empty,()=>{
    if(active()||state.pendingPack||state.eliteChoices.length)throw new Error('Afslut sæsonen og hent belønninger først.');
    const validation=validateSquad(data,squad(),state.challengeId,state.owned);if(!validation.valid)throw new Error(validation.errors.join(' '));
    startSeason();return read();
  });
  tool('play_next_matchday','Afvikl én spillerunde i den aktive sæson og opdater tabellen. Sidste runde opretter sæsonens belønning.',empty,()=>{
    if(!active())throw new Error('Ingen aktiv sæson.');stopTimer();tick();return read();
  });
}
document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(!el||el.disabled)return;event.preventDefault();try{handleAction(el.dataset.action,el);}catch(error){console.error(error);toast('Der opstod en fejl. Prøv igen.');}});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
try {
  const response=await fetch('/data.json');if(!response.ok)throw new Error('Kortdata kunne ikke hentes.');data=await response.json();state=load(false);if(active())view='season';render();registerAgentTools();
} catch(error) { app.innerHTML=`<main class="empty-state"><h1>Klubben kunne ikke indlæses.</h1><p>${escape(error.message)}</p><button onclick="location.reload()">Prøv igen</button></main>`;console.error(error); }
