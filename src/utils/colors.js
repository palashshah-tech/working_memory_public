/* ============================================================
   Color Utilities — 12 highly discriminable colors
   (based on Luck & Vogel 1997 / Cambridge Color Test palette)
   ============================================================ */

// Full perceptually distinct color set
export const STIMULUS_COLORS = [
  '#e74c3c',  // Red
  '#27ae60',  // Green
  '#2980b9',  // Blue
  '#f39c12',  // Orange
  '#1abc9c',  // Teal
  '#e91e9a',  // Magenta
  '#f1c40f',  // Yellow
  '#9b59b6',  // Purple
  '#e67e22',  // Dark Orange
  '#16a085',  // Dark Teal
  '#8e44ad',  // Dark Purple
  '#2ecc71',  // Emerald
  '#3498db',  // Bright Blue
  '#95a5a6',  // Silver (still distinct from white)
  '#d35400',  // Pumpkin
  '#c0392b',  // Pomegranate
  '#833471',  // Hollyhock
  '#006266',  // Mediterranean Blue
];

// Groups of SIMILAR colors — used to make "different" trials harder
// Each entry is a pair [original, similar-alternative]
const SIMILAR_PAIRS = [
  ['#e74c3c', '#c0392b'],  // Red → Dark Red
  ['#e74c3c', '#e67e22'],  // Red → Orange
  ['#27ae60', '#16a085'],  // Green → Dark Teal
  ['#27ae60', '#1abc9c'],  // Green → Teal
  ['#2980b9', '#1a6fa8'],  // Blue → Dark Blue
  ['#2980b9', '#8e44ad'],  // Blue → Purple (medium)
  ['#f39c12', '#e67e22'],  // Orange → Dark Orange
  ['#f1c40f', '#f39c12'],  // Yellow → Orange (similar hue)
  ['#9b59b6', '#8e44ad'],  // Purple → Dark Purple
  ['#1abc9c', '#16a085'],  // Teal → Dark Teal
  ['#e91e9a', '#9b59b6'],  // Magenta → Purple
];

/**
 * Pick N unique random colors
 */
export function pickRandomColors(n) {
  const shuffled = [...STIMULUS_COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, STIMULUS_COLORS.length));
}

/**
 * Pick a replacement color.
 * difficulty: 'easy' → very different color
 *             'medium' → moderately different
 *             'hard' → similar color (perceptually close)
 */
export function pickDifferentColor(original, difficulty = 'medium') {
  if (difficulty === 'hard') {
    // Find a similar color pair
    const pairs = SIMILAR_PAIRS.filter(([from]) => from === original);
    if (pairs.length > 0) {
      const [, similar] = pairs[Math.floor(Math.random() * pairs.length)];
      return similar;
    }
  }

  if (difficulty === 'easy') {
    // Pick maximally different — opposite end of palette
    const idx = STIMULUS_COLORS.indexOf(original);
    const opposite = (idx + Math.floor(STIMULUS_COLORS.length / 2)) % STIMULUS_COLORS.length;
    return STIMULUS_COLORS[opposite];
  }

  // Medium: just any different color
  const pool = STIMULUS_COLORS.filter(c => c !== original);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * @deprecated use pickDifferentColor
 */
export function pickSimilarColor(original) {
  return pickDifferentColor(original, 'hard');
}
