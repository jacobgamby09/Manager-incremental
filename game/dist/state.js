import { chooseSquad, seasonSummary, validateSquad, rng } from './engine.js';
export const SAVE_VERSION = 1;
export function freshState(data, sandbox = false) {
  const lineup = data.squadExamples[0].lineup.map(x => x.cardId);
  const owned = sandbox ? data.cards.map(c => c.id) : [...data.initialCollection];
  const italy = chooseSquad(data, data.cards.filter(c => owned.includes(c.id)), '4-3-3', { preferred: lineup, minItaly: sandbox ? 6 : 2 });
  return { version: SAVE_VERSION, sandbox, clubName: 'Historie FC', owned, challengeId: 'open-league', squads: { 'open-league': { formation: '4-3-3', lineup }, 'italy-six': italy }, season: null, history: [], completed: { 'open-league': 0, 'italy-six': 0 }, trophies: { 'open-league': false, 'italy-six': false }, mastery: { 'open-league': false, 'italy-six': false }, pendingPack: null, eliteChoices: [], counter: 0 };
}
export function validSave(data, state, sandbox) {
  if (!state || state.version !== SAVE_VERSION || state.sandbox !== sandbox || !Array.isArray(state.owned) || !Array.isArray(state.history) || !state.completed || !state.trophies || !state.mastery || !Array.isArray(state.eliteChoices) || !Number.isInteger(state.counter)) return false;
  if (!['open-league', 'italy-six'].includes(state.challengeId)) return false;
  if (state.owned.some(id => !data.cards.some(c => c.id === id)) || new Set(state.owned).size !== state.owned.length) return false;
  for (const id of ['open-league', 'italy-six']) {
    // Saved Italy squads may be below the entry requirement while still being built.
    if (!validateSquad(data, state.squads?.[id], 'open-league', state.owned).valid) return false;
    if (!Number.isInteger(state.completed[id]) || state.completed[id] < 0) return false;
  }
  if (state.pendingPack && (!Array.isArray(state.pendingPack.cards) || state.pendingPack.cards.some(id => !data.cards.some(c => c.id === id)))) return false;
  if (state.eliteChoices.some(id => !data.cards.some(c => c.id === id))) return false;
  if (state.season && (!Number.isInteger(state.season.round) || state.season.round < 0 || state.season.round > 38 || state.season.teams?.length !== 20 || state.season.table?.length !== 20 || state.season.fixtures?.length !== 38 || state.season.results?.length !== state.season.round)) return false;
  return true;
}
export function completeSeason(data, state) {
  if (!state.season || state.season.round !== 38) throw new Error('Sæsonen er ikke færdig.');
  if (state.history.some(h => h.id === state.season.id)) return state.history.find(h => h.id === state.season.id);
  const result = seasonSummary(state.season), id = result.challengeId;
  state.history.unshift(result); state.completed[id]++;
  const firstWin = result.rank === 1 && !state.trophies[id];
  if (result.rank === 1) {
    state.trophies[id] = true;
    const italy = validateSquad(data, result.squad, id).italy;
    if ((id === 'open-league' && result.ratings.ovr <= 80) || (id === 'italy-six' && italy >= 8)) state.mastery[id] = true;
  }
  if (state.sandbox) return result;
  const random = rng(state.season.seed ^ 0x8F371), awarded = [];
  const milestone = id === 'open-league' ? data.onboardingMilestones.find(m => m.completedOpenSeasons === state.completed[id]) : null;
  if (milestone && !state.owned.includes(milestone.cardId)) awarded.push(milestone.cardId);
  let pool = data.cards.filter(c => !state.owned.includes(c.id) && !awarded.includes(c.id) && (id !== 'italy-six' || c.clubCountry === 'ITA') && (state.trophies[id] || c.ovr <= 84));
  while (awarded.length < 3 && pool.length) { const i = Math.floor(random() * pool.length); awarded.push(pool.splice(i, 1)[0].id); }
  state.pendingPack = { cards: awarded, challengeId: id, milestone: milestone?.cardId || null };
  if (firstWin) state.eliteChoices = data.cards.filter(c => c.ovr >= 85 && !state.owned.includes(c.id) && !awarded.includes(c.id) && (id !== 'italy-six' || c.clubCountry === 'ITA')).map(c => c.id);
  return result;
}
export function claimPack(state) {
  if (!state.pendingPack) return [];
  const cards = state.pendingPack.cards;
  state.owned = [...new Set([...state.owned, ...cards])]; state.pendingPack = null; return cards;
}
export function claimElite(state, cardId) {
  if (!state.eliteChoices.includes(cardId)) throw new Error('Vælg et kort fra trofæbelønningen.');
  state.owned = [...new Set([...state.owned, cardId])]; state.eliteChoices = [];
}
