// Split sung parentheticals into messages from the opposite chat participant.
// This is a view of the existing line, not a change to the shared lyric timeline:
// other visualizations, singer metadata, timestamps and seeking retain the source.
const STAGE_DIRECTION = /^(?:intro|outro|verse|pre[- ]?chorus|chorus|bridge|interlude|instrumental|hook|solo|repeat|x\d+|\d+x)(?:\s+\d+)?$/i;
const hasLetters = text => /\p{L}/u.test(text);

export function splitChatAsides(line, singerNames = []) {
  let tokens = line?.tokens || [];
  let text = tokens.map(token => token.text).join(' '); // exactly what wordsHTML displays
  // In some word-timed TTML, parentheses are untimed text nodes around the
  // spans, so they occur in line.text but not in any token. Restore them on a
  // temporary token view only when the words align one-to-one.
  if ((!text.includes('(') || !text.includes(')')) && /\([^()]+\)/.test(line?.text || '')) {
    const words = line.text.trim().split(/\s+/);
    const letters = word => word.replace(/[()[\],.!?;:'"…]/g, '').toLowerCase();
    if (words.length === tokens.length && words.every((word, i) => letters(word) === letters(tokens[i].text))) {
      tokens = tokens.map((token, i) => ({ ...token, text: words[i] }));
      text = tokens.map(token => token.text).join(' ');
    }
  }
  if (!text.includes('(') || !text.includes(')')) return null;

  const matches = [...text.matchAll(/\(([^()]{1,100})\)/g)].filter(match => {
    const spoken = match[1].trim();
    const end = match.index + match[0].length;
    return hasLetters(spoken) && !STAGE_DIRECTION.test(spoken) && !/^feat(?:uring)?\.?\s/i.test(spoken)
      && !singerNames.some(name => String(name).trim().toLowerCase() === spoken.toLowerCase())
      && text[match.index - 1] !== '(' && text[end] !== ')';
  });
  if (!matches.length) return null;

  const offsets = [];
  let at = 0;
  for (const token of tokens) {
    offsets.push(at);
    at += token.text.length + 1;
  }
  const pieces = [];
  function add(from, to, aside) {
    const kept = [];
    tokens.forEach((token, i) => {
      const start = offsets[i], end = start + token.text.length;
      let a = Math.max(start, from), b = Math.min(end, to);
      if (a >= b) return;
      const raw = text.slice(a, b), trimmed = raw.trim();
      if (!trimmed) return;
      a += raw.indexOf(trimmed);
      b = a + trimmed.length;
      // A whole timed word like "(Ah)" keeps its original time. If a single
      // timed token contains BOTH voices, apportion only that token's time.
      const otherWords = hasLetters(token.text.slice(0, a - start) + token.text.slice(b - start));
      const part = { ...token, text: trimmed };
      if (otherWords && Number.isFinite(token.t0) && Number.isFinite(token.t1)) {
        const span = token.t1 - token.t0;
        part.t0 = token.t0 + span * (a - start) / token.text.length;
        part.t1 = token.t0 + span * (b - start) / token.text.length;
        part.estimated = true;
      }
      kept.push(part);
    });
    if (kept.length) pieces.push({ aside, text: kept.map(t => t.text).join(' '), tokens: kept });
  }
  let cursor = 0;
  for (const match of matches) {
    add(cursor, match.index, false);
    add(match.index + 1, match.index + match[0].length - 1, true);
    const end = match.index + match[0].length;
    // Punctuation immediately after the closing bracket belongs to the ad-lib,
    // not a stray comma at the start of the remaining lyric.
    const punctuation = text.slice(end).match(/^[,;:!?…]+(?=\s|$)/u)?.[0] || '';
    if (punctuation) {
      const aside = pieces.at(-1);
      aside.tokens.at(-1).text += punctuation;
      aside.text += punctuation;
    }
    cursor = end + punctuation.length;
  }
  add(cursor, text.length, false);
  return pieces.some(part => part.aside) ? pieces : null;
}
