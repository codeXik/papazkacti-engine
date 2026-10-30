// The computer player. It only gets what a real player sees (PapazKactiHand.view(seat)). The cards of the next
// player are hidden and shuffled, so every card is equally likely to be the papaz: the choice is a random index.
export const LEVELS = { normal: 'Normal' };

// Returns { action: 'draw', index } where index points into the hidden hand of `view.target`.
export function botAction(view, { rng = Math.random } = {}) {
  const size = view.target === null ? 0 : view.handSizes[view.target];
  if (!size) return { action: 'none' };
  return { action: 'draw', index: Math.floor(rng() * size) };
}
