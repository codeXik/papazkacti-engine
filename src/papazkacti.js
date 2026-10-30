// Papaz Kaçtı (Turkish Old Maid) rules without any DOM. 2 to 4 players. A card is 'S13' = suit + rank
// (J 11, Q 12, K 13, A 14); seats are 0..n-1 in the order of play.
//
// Rules (README.md): one 52-card deck, three kings taken out, so 49 cards are dealt and one king (the papaz, 'S13')
// has no partner. Everybody lays down the pairs of equal rank they were dealt. Then, in turn, a player draws one hidden
// card from the next player who still has cards; if it pairs with a card in hand, the pair is laid down. A player
// whose hand empties is safe. The one left holding the papaz loses.

export const SUITS = ['S', 'H', 'D', 'C'];
export const suitOf = (c) => c[0];
export const rankOf = (c) => Number(c.slice(1));
export const PAPAZ = 'S13';
export const isPapaz = (c) => c === PAPAZ;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

// 52 cards minus three kings: the spade king stays.
export const newDeck = () =>
  SUITS.flatMap((s) => Array.from({ length: 13 }, (_, i) => `${s}${i + 2}`)).filter((c) => rankOf(c) !== 13 || c === PAPAZ);

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Splits a hand into the pairs of equal rank and the cards left over.
export function pairOff(cards) {
  const byRank = new Map();
  for (const c of cards) {
    const r = rankOf(c);
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r).push(c);
  }
  const pairs = [];
  const rest = [];
  for (const group of byRank.values()) {
    while (group.length >= 2) pairs.push([group.shift(), group.shift()]);
    rest.push(...group);
  }
  return { pairs, rest };
}

export class PapazKactiHand {
  // `dealer` deals and the next seat draws first. `state` restores a saved hand.
  constructor({ players = 4, dealer, rng = Math.random, state } = {}) {
    if (state) {
      Object.assign(this, structuredClone(state));
      this.rng = rng;
      return;
    }
    this.rng = rng;
    this.n = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, players));
    this.seats = Array.from({ length: this.n }, (_, i) => i);
    this.dealer = dealer ?? this.n - 1;
    this.hands = Array.from({ length: this.n }, () => []);
    this.pairs = Array.from({ length: this.n }, () => []); // laid-down pairs per seat, face up
    this.finished = []; // safe seats in the order their hands emptied
    this.phase = 'play';
    this.seq = 0; // draws so far
    this.lastAction = null; // { seq, seat, from, index, card, matched, pair }
    this.loser = null;
    this.deal();
  }

  deal() {
    const deck = shuffle(newDeck(), this.rng);
    const order = this.order(this.dealer);
    deck.forEach((c, i) => this.hands[order[i % this.n]].push(c));
    for (const s of order) {
      const { pairs, rest } = pairOff(this.hands[s]);
      this.pairs[s] = pairs;
      this.hands[s] = shuffle(rest, this.rng);
      if (!rest.length) this.finished.push(s);
    }
    this.turn = this.nextActive(this.dealer);
    this.checkEnd();
  }

  // All seats starting with the one after `seat`.
  order(seat) { return Array.from({ length: this.n }, (_, i) => (seat + 1 + i) % this.n); }

  // The next seat after `seat` that still holds cards (never `seat` itself unless it is the only one).
  nextActive(seat) {
    for (const s of this.order(seat)) if (this.hands[s].length && s !== seat) return s;
    return this.hands[seat].length ? seat : null;
  }

  // The seat `seat` draws from.
  target(seat = this.turn) {
    const t = this.nextActive(seat);
    return t === seat ? null : t;
  }

  get active() { return this.seats.filter((s) => this.hands[s].length); }

  // Draws the card at `index` of the next player's (hidden, shuffled) hand.
  // Returns { ok, card, matched, pair } or { ok: false, error }.
  draw(seat, index) {
    if (this.phase !== 'play') return { ok: false, error: 'done' };
    if (seat !== this.turn) return { ok: false, error: 'notYourTurn' };
    const from = this.target(seat);
    const src = this.hands[from];
    if (!Number.isInteger(index) || index < 0 || index >= src.length) return { ok: false, error: 'badIndex' };

    const [card] = src.splice(index, 1);
    const mine = this.hands[seat];
    const at = mine.findIndex((c) => rankOf(c) === rankOf(card));
    let pair = null;
    if (at >= 0) {
      pair = [mine.splice(at, 1)[0], card];
      this.pairs[seat].push(pair);
    } else {
      mine.push(card);
    }
    this.hands[seat] = shuffle(mine, this.rng);
    this.hands[from] = shuffle(src, this.rng);

    this.lastAction = { seq: ++this.seq, seat, from, index, card, matched: !!pair, pair };
    if (!this.hands[from].length) this.finished.push(from);
    if (!this.hands[seat].length) this.finished.push(seat);
    if (!this.checkEnd()) this.turn = this.nextActive(seat);
    return { ok: true, card, matched: !!pair, pair };
  }

  // The hand ends when a single player is left, and that player holds the papaz.
  checkEnd() {
    const left = this.active;
    if (left.length > 1) return false;
    this.phase = 'done';
    this.loser = left.length ? left[0] : null;
    this.turn = null;
    return true;
  }

  // Seats from the first one safe to the loser.
  get places() { return this.phase === 'done' ? [...this.finished, this.loser] : null; }

  // What `seat` may see: its own cards (sorted), everybody's laid-down pairs and the sizes of the other hands.
  // The drawn card of the last action is shown only to the two players involved, unless it made a pair.
  view(seat) {
    const done = this.phase === 'done';
    const la = this.lastAction;
    const sees = la && (la.matched || la.seat === seat || la.from === seat || done);
    return {
      n: this.n,
      seats: this.seats.slice(),
      phase: this.phase,
      turn: this.turn,
      target: this.turn === null ? null : this.target(this.turn),
      dealer: this.dealer,
      seq: this.seq,
      hand: this.hands[seat].slice().sort((a, b) => rankOf(a) - rankOf(b) || a.localeCompare(b)),
      handSizes: this.hands.map((h) => h.length),
      pairs: this.pairs.map((p) => p.map((x) => x.slice())),
      finished: this.finished.slice(),
      lastAction: la && { ...la, card: sees ? la.card : null, pair: la.pair && la.pair.slice() },
      loser: this.loser,
      places: this.places,
      hands: done ? this.hands.map((h) => h.slice()) : null,
    };
  }

  toJSON() {
    const { rng, ...rest } = this;
    return structuredClone(rest);
  }
  static fromJSON(state, rng) { return new PapazKactiHand({ state, rng }); }
}

export class PapazKactiMatch {
  // settings: { players: 2..4 }. Every hand has a loser (the papaz holder); the match keeps count of the losses.
  constructor({ settings = {}, rng = Math.random, state } = {}) {
    this.rng = rng;
    if (state) {
      Object.assign(this, structuredClone(state), { rng });
      this.hand = state.hand ? PapazKactiHand.fromJSON(state.hand, rng) : null;
      return;
    }
    const players = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, settings.players | 0 || 4));
    this.settings = { players };
    this.losses = new Array(players).fill(0);
    this.rounds = []; // { loser, places } per finished hand
    this.dealer = players - 1; // so seat 0, the human who made the room, draws first in the first hand
    this.hand = null;
  }

  get n() { return this.settings.players; }

  startRound() {
    this.hand = new PapazKactiHand({ players: this.n, dealer: this.dealer, rng: this.rng });
    return this.hand;
  }

  finishRound() {
    const h = this.hand;
    if (!h || h.phase !== 'done') return false;
    this.rounds.push({ loser: h.loser, places: h.places.slice() });
    this.losses[h.loser]++;
    this.dealer = (this.dealer + 1) % this.n;
    this.hand = null;
    return true;
  }

  get lastLoser() { return this.rounds.length ? this.rounds[this.rounds.length - 1].loser : null; }

  view(seat) {
    return {
      settings: { ...this.settings },
      losses: this.losses.slice(),
      rounds: this.rounds.map((r) => ({ loser: r.loser, places: r.places.slice() })),
      hand: this.hand ? this.hand.view(seat) : null,
    };
  }

  toJSON() {
    const { rng, hand, ...rest } = this;
    return structuredClone({ ...rest, hand: hand ? hand.toJSON() : null });
  }
  static fromJSON(state, rng) { return new PapazKactiMatch({ state, rng }); }
}
