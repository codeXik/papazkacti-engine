import test from 'node:test';
import assert from 'node:assert/strict';
import { PapazKactiHand, PapazKactiMatch, newDeck, pairOff, rankOf, PAPAZ } from '../src/papazkacti.js';
import { botAction } from '../src/bot.js';

const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };

// A hand with the given cards, no shuffling surprises; seat 0 draws from seat 1.
function rigged(hands, pairs) {
  const h = new PapazKactiHand({ players: hands.length, rng: seeded(1) });
  h.hands = hands.map((x) => x.slice());
  h.pairs = hands.map((_, i) => (pairs?.[i] ?? []).slice());
  h.finished = [];
  h.phase = 'play';
  h.loser = null;
  h.turn = 0;
  h.lastAction = null;
  h.seq = 0;
  return h;
}

test('deck: 49 distinct cards, only the spade king is left', () => {
  const d = newDeck();
  assert.equal(d.length, 49);
  assert.equal(new Set(d).size, 49);
  assert.deepEqual(d.filter((c) => rankOf(c) === 13), [PAPAZ]);
});

test('pairOff: pairs by rank, three of a kind leaves one', () => {
  const { pairs, rest } = pairOff(['S2', 'H2', 'D2', 'C5', 'S9', 'H9']);
  assert.equal(pairs.length, 2);
  assert.equal(rest.length, 2);
  assert.ok(rest.some((c) => c === 'C5'));
});

test('a deal: all cards used, no pairs left in a hand, the papaz is in exactly one hand', () => {
  for (let players = 2; players <= 4; players++) {
    const h = new PapazKactiHand({ players, rng: seeded(players) });
    const inHands = h.hands.flat();
    const inPairs = h.pairs.flat(2);
    assert.equal(inHands.length + inPairs.length, 49);
    for (const hand of h.hands) assert.equal(new Set(hand.map(rankOf)).size, hand.length);
    assert.equal(inHands.filter((c) => c === PAPAZ).length, 1);
    assert.equal(h.turn, 0);
  }
});

test('drawing a card that pairs lays the pair down', () => {
  const h = rigged([['S2', 'H5', 'C9'], ['D2', 'D7'], ['H7']]);
  const r = h.draw(0, h.hands[1].indexOf('D2'));
  assert.ok(r.ok && r.matched);
  assert.deepEqual(h.hands[0].slice().sort(), ['C9', 'H5']);
  assert.equal(h.pairs[0].length, 1);
  assert.equal(h.turn, 1);
});

test('drawing a card that does not pair keeps it', () => {
  const h = rigged([['S2', 'H5'], ['D3', 'D7'], ['H7']]);
  const r = h.draw(0, h.hands[1].indexOf('D3'));
  assert.ok(r.ok && !r.matched);
  assert.equal(h.hands[0].length, 3);
  assert.equal(h.hands[1].length, 1);
});

test('only the player on turn may draw, and the index must exist', () => {
  const h = rigged([['S2'], ['D3', 'D7'], ['H7']]);
  assert.equal(h.draw(1, 0).error, 'notYourTurn');
  assert.equal(h.draw(0, 5).error, 'badIndex');
  assert.equal(h.draw(0, -1).error, 'badIndex');
  assert.equal(h.draw(0, 0.5).error, 'badIndex');
});

test('a player whose hand empties is safe and skipped', () => {
  // seat 1 has a single card that pairs with seat 0: seat 1 is out, seat 0 draws next from seat 2
  const h = rigged([['S2', 'H5'], ['D2'], ['H7', 'C7', PAPAZ]]);
  h.draw(0, 0);
  assert.deepEqual(h.finished, [1]);
  assert.equal(h.hands[0].length, 1);
  assert.equal(h.turn, 2);
  assert.equal(h.target(2), 0);
});

test('the hand ends with the papaz holder as the loser', () => {
  const h = rigged([['S2'], ['D2', PAPAZ]]);
  h.draw(0, 0); // takes D2 or the papaz from seat 1
  if (h.phase !== 'done') {
    // took the papaz: seat 0 has S2 + papaz, seat 1 has D2; seat 1 draws
    assert.equal(h.turn, 1);
    const r = h.draw(1, h.hands[0].indexOf('S2'));
    assert.ok(r.matched);
  }
  assert.equal(h.phase, 'done');
  assert.equal(h.hands[h.loser].includes(PAPAZ), true);
  assert.equal(h.places.length, 2);
  assert.equal(h.places[1], h.loser);
});

test('what others may see of the last draw', () => {
  const h = rigged([['S2', 'H5'], ['D3', 'D7'], ['H8']]);
  h.draw(0, h.hands[1].indexOf('D3'));
  assert.equal(h.view(0).lastAction.card, 'D3'); // the drawer
  assert.equal(h.view(1).lastAction.card, 'D3'); // the one drawn from
  assert.equal(h.view(2).lastAction.card, null); // the others do not see it
  assert.equal(h.view(2).hand.length, 1);
});

test('a pair is public', () => {
  const h = rigged([['S2', 'H5'], ['D2', 'D7'], ['H8']]);
  h.draw(0, h.hands[1].indexOf('D2'));
  assert.equal(h.view(2).lastAction.card, 'D2');
  assert.equal(h.view(2).lastAction.pair.length, 2);
});

test('save and restore', () => {
  const h = new PapazKactiHand({ players: 3, rng: seeded(7) });
  const copy = PapazKactiHand.fromJSON(JSON.parse(JSON.stringify(h)), seeded(7));
  assert.deepEqual(copy.view(0), h.view(0));
});

test('bots play whole hands to the end, always with one loser who holds the papaz', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const players = 2 + (seed % 3);
    const rng = seeded(seed);
    const h = new PapazKactiHand({ players, rng });
    let guard = 0;
    while (h.phase === 'play') {
      const a = botAction(h.view(h.turn), { rng });
      assert.equal(a.action, 'draw');
      assert.ok(h.draw(h.turn, a.index).ok);
      assert.ok(++guard < 500, 'hand did not end');
    }
    assert.equal(h.active.length, 1);
    assert.ok(h.hands[h.loser].includes(PAPAZ));
    assert.equal(h.hands.flat().length, 1);
    assert.equal(h.places.length, players);
    assert.equal(new Set(h.places).size, players);
  }
});

test('match: losses are counted and the dealer moves on', () => {
  const m = new PapazKactiMatch({ settings: { players: 3 }, rng: seeded(3) });
  for (let i = 0; i < 3; i++) {
    const h = m.startRound();
    while (h.phase === 'play') h.draw(h.turn, botAction(h.view(h.turn), { rng: seeded(i + 1) }).index);
    assert.ok(m.finishRound());
  }
  assert.equal(m.losses.reduce((a, b) => a + b, 0), 3);
  assert.equal(m.rounds.length, 3);
  const copy = PapazKactiMatch.fromJSON(JSON.parse(JSON.stringify(m)), seeded(1));
  assert.deepEqual(copy.losses, m.losses);
});
