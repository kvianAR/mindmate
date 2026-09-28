export function parseFlashcards(text, limit = 20) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let cards;
  try { cards = JSON.parse(trimmed); } catch { throw new Error('The AI response was not valid flashcard JSON'); }
  if (!Array.isArray(cards) || !cards.length || cards.length > 20 || cards.some(card => !card || typeof card.front !== 'string' || !card.front.trim() || card.front.length > 10000 || typeof card.back !== 'string' || !card.back.trim() || card.back.length > 10000)) {
    throw new Error('The AI response did not contain valid flashcards');
  }
  return cards.slice(0, limit).map(({ front, back }) => ({ front: front.trim(), back: back.trim() }));
}
