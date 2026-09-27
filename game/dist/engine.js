// Pure game rules. Used unchanged by the browser, tests and balance simulations.
export const WEIGHTS = {
  GK: [0, .12, 1.1], RB: [.35, .45, .85], LB: [.35, .45, .85], CB: [.1, .25, 1],
  DM: [.2, .85, .85], CM: [.55, 1, .5], AM: [.85, .9, .15],
  RW: [1, .5, .15], LW: [1, .5, .15], RM: [.7, .8, .35], LM: [.7, .8, .35], ST: [1.2, .3, .1],
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function canPlay(card, slot) { return !!card?.positions.includes(({ LM: 'LW', RM: 'RW' })[slot] || slot); }
export function validateSquad(data, squad, challengeId, owned) {
  const errors = [], slots = data.formations[squad?.formation];
  if (!slots || squad?.lineup?.length !== 11) return { valid: false, italy: 0, errors: ['Holdet skal have 11 spillere i en gyldig formation.'] };
  const index = new Map(data.cards.map(c => [c.id, c])), seen = new Set();
  let italy = 0;
  squad.lineup.forEach((id, i) => {
    const c = index.get(id);
    if (!c) { errors.push(`Vælg en spiller til ${slots[i]}.`); return; }
    if (owned && !owned.includes(id)) errors.push(`${c.name} er ikke i din samling.`);
    if (!canPlay(c, slots[i])) errors.push(`${c.name} kan ikke spille ${slots[i]}.`);
    if (seen.has(c.playerId)) errors.push(`Kun én version af ${c.name} må starte.`);
    seen.add(c.playerId);
    if (c.clubCountry === 'ITA') italy++;
  });
  if (challengeId === 'italy-six' && italy < 6) errors.push(`Italy kræver 6 kort fra italienske klubber. Du har ${italy}.`);
  return { valid: errors.length === 0, italy, errors: [...new Set(errors)] };
}
export function teamRatings(data, squad) {
  const index = new Map(data.cards.map(c => [c.id, c]));
  const totals = [0, 0, 0], denominators = [0, 0, 0];
  let ovr = 0;
  data.formations[squad.formation].forEach((slot, i) => {
    const card = index.get(squad.lineup[i]), w = WEIGHTS[slot];
    w.forEach((n, k) => { denominators[k] += n; totals[k] += n * (card ? [card.atk, card.mid, card.def][k] : 0); });
    ovr += card?.ovr || 0;
  });
  // Normalized per-stat averages: a formation cannot gain strength just by adding weights.
  return { atk: totals[0] / denominators[0], mid: totals[1] / denominators[1], def: totals[2] / denominators[2], ovr: ovr / 11 };
}
export function expectedGoals(a, b, home = true) {
  // Midfield controls chance volume; attack versus defence controls conversion.
  return clamp(1.32 * Math.exp((a.atk - b.def) / 22 + (a.mid - b.mid) / 40 + (home ? .08 : -.08)), .12, 5.5);
}
function poisson(lambda, random) {
  // Inverse CDF consumes ONE draw regardless of lambda, keeping paired seeds paired.
  const u = random(); let p = Math.exp(-lambda), cumulative = p, k = 0;
  while (u > cumulative && k < 20) { k++; p *= lambda / k; cumulative += p; }
  return k;
}
export function match(a, b, seed) {
  const random = rng(seed), xgHome = expectedGoals(a, b, true), xgAway = expectedGoals(b, a, false);
  return { homeGoals: poisson(xgHome, random), awayGoals: poisson(xgAway, random), xgHome, xgAway };
}
export function chooseSquad(data, cards, formation, options = {}) {
  const { preferred = [], target = 80, minItaly = 0, seed = 1, style = 'balanced' } = options;
  const random = rng(seed), slots = data.formations[formation];
  const styles = { attack: [1.5, .8, .5], control: [.7, 1.5, .7], defence: [.5, .8, 1.5], balanced: [1, 1, 1] };
  const importance = styles[style] || styles.balanced;
  const candidates = slots.map(slot => cards.filter(c => canPlay(c, slot)).map(c => ({
    card: c, score: (preferred.includes(c.id) ? 1000 : 0) - Math.abs(c.ovr - target) * 3 +
      WEIGHTS[slot].reduce((sum, w, i) => sum + w * [c.atk, c.mid, c.def][i] * importance[i], 0) / 12 + random() * 3,
  })).sort((a, b) => b.score - a.score));
  const order = slots.map((_, i) => i).sort((a, b) => candidates[a].length - candidates[b].length);
  let beam = [{ lineup: Array(11).fill(null), used: new Set(), score: 0, italy: 0 }];
  for (let depth = 0; depth < order.length; depth++) {
    const slotIndex = order[depth], next = [];
    for (const state of beam) for (const { card, score } of candidates[slotIndex]) {
      if (state.used.has(card.playerId)) continue;
      const italy = state.italy + (card.clubCountry === 'ITA' ? 1 : 0);
      if (italy + 10 - depth < minItaly) continue;
      const lineup = [...state.lineup]; lineup[slotIndex] = card.id;
      next.push({ lineup, used: new Set([...state.used, card.playerId]), italy, score: state.score + score });
    }
    next.sort((a, b) => (b.score + Math.min(b.italy, minItaly) * 50) - (a.score + Math.min(a.italy, minItaly) * 50));
    beam = next.slice(0, 48);
    if (!beam.length) return null;
  }
  const best = beam.filter(s => s.italy >= minItaly).sort((a, b) => b.score - a.score)[0];
  return best ? { formation, lineup: best.lineup } : null;
}
export function schedule(count = 20) {
  const rotation = Array.from({ length: count }, (_, i) => i), rounds = [];
  for (let r = 0; r < count - 1; r++) {
    const pairs = [];
    for (let i = 0; i < count / 2; i++) {
      const a = rotation[i], b = rotation[count - 1 - i];
      pairs.push((r + i) % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs); rotation.splice(1, 0, rotation.pop());
  }
  return [...rounds, ...rounds.map(p => p.map(([h, a]) => [a, h]))];
}
const NAMES = ['Nordhavn FC', 'Riverside', 'Union 04', 'Sporting Atlas', 'Aurora FC', 'Old Town', 'Marina Athletic', 'Westbridge', 'Borgo United', 'Olympic 19', 'Alpine FC', 'East End', 'Porto Verde', 'Royal North', 'Inter Aurora', 'Monte Athletic', 'Victoria FC', 'Academy XI', 'Capital Club'];
const opponentCache = new Map();
export function opponents(data, challengeId) {
  if (opponentCache.has(challengeId)) return opponentCache.get(challengeId);
  const italy = challengeId === 'italy-six';
  const result = NAMES.map((name, i) => {
    const formation = Object.keys(data.formations)[i % 3];
    const target = (italy ? 78 : 73) + i * (italy ? 7 : 7) / 18;
    const style = ['balanced', 'attack', 'defence', 'control'][i % 4];
    const squad = chooseSquad(data, data.cards, formation, { target, minItaly: italy ? 6 : 0, seed: 500 + i, style });
    if (!squad) throw new Error('Kunne ikke opbygge modstanderhold.');
    return { id: `ai-${i}`, name, style, squad, ratings: teamRatings(data, squad) };
  });
  opponentCache.set(challengeId, result); return result;
}
export function newSeason(data, squad, challengeId, seed, clubName = 'Din klub') {
  const validation = validateSquad(data, squad, challengeId);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  const teams = [{ id: 'player', name: clubName, squad: structuredClone(squad), ratings: teamRatings(data, squad) }, ...opponents(data, challengeId)];
  return { id: `${challengeId}-${seed}`, challengeId, seed, round: 0, teams, fixtures: schedule(), results: [], table: teams.map(t => ({ id: t.id, name: t.name, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, points: 0 })) };
}
export function standings(season) { return [...season.table].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.id.localeCompare(b.id)); }
export function advanceSeason(season) {
  if (season.round >= 38) return season;
  const results = season.fixtures[season.round].map(([h, a], i) => {
    const score = match(season.teams[h].ratings, season.teams[a].ratings, (season.seed + season.round * 1013 + i * 7919) >>> 0);
    const ht = season.table[h], at = season.table[a];
    ht.played++; at.played++; ht.gf += score.homeGoals; ht.ga += score.awayGoals; at.gf += score.awayGoals; at.ga += score.homeGoals;
    if (score.homeGoals > score.awayGoals) { ht.w++; ht.points += 3; at.l++; }
    else if (score.homeGoals < score.awayGoals) { at.w++; at.points += 3; ht.l++; }
    else { ht.d++; at.d++; ht.points++; at.points++; }
    return { home: h, away: a, ...score };
  });
  season.results.push(results); season.round++; return season;
}
export function finishSeason(season) { while (season.round < 38) advanceSeason(season); return season; }
export function seasonSummary(season) {
  const table = standings(season), player = table.find(t => t.id === 'player');
  return { id: season.id, challengeId: season.challengeId, seed: season.seed, rank: table.indexOf(player) + 1, ...player, id: season.id, squad: structuredClone(season.teams[0].squad), ratings: season.teams[0].ratings, results: season.results.map(r => r.find(m => m.home === 0 || m.away === 0)), date: new Date().toISOString() };
}
