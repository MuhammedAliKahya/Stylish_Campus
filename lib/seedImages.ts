// Small SVG placeholder images encoded as base64 data URLs.
// Used for seed products so the feed is not empty on first run.
// These are tiny (a few hundred bytes each) to keep localStorage well under quota.

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

const palette = [
  ['#c7b299', '#7d6b54'],
  ['#9bb5c7', '#5a7d8f'],
  ['#c7a9a0', '#8f6b62'],
  ['#b0c7a9', '#6b8f5a'],
  ['#c7b9a9', '#8f7d5a'],
  ['#a9c7b5', '#5a8f7d'],
  ['#b9a9c7', '#7d5a8f'],
  ['#c7c7a9', '#8f8f5a'],
  ['#a9b9c7', '#5a6b8f'],
  ['#c7a9b9', '#8f5a6b'],
  ['#b9c7a9', '#6b8f5a'],
  ['#a9c7c7', '#5a8f8f'],
  ['#c7b9a9', '#8f7d5a'],
  ['#b0a9c7', '#6b5a8f'],
  ['#c7b0a9', '#8f6b5a'],
  ['#a9c7a9', '#5a8f5a'],
  ['#c7a9c7', '#8f5a8f'],
  ['#b9b9c7', '#6b6b8f'],
  ['#a9b0c7', '#5a6b8f'],
  ['#c7c7b9', '#8f8f6b'],
];

function placeholder(label: string, i: number): string {
  const [bg, fg] = palette[i % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${bg}"/>
  <circle cx="300" cy="230" r="80" fill="${fg}" opacity="0.85"/>
  <rect x="220" y="330" width="160" height="120" rx="20" fill="${fg}" opacity="0.85"/>
  <text x="300" y="540" font-family="Georgia,serif" font-size="28" fill="${fg}" text-anchor="middle">${label}</text>
</svg>`;
  return svgDataUrl(svg);
}

export const SEED_IMAGES = {
  etek1: placeholder('Etek', 0),
  etek2: placeholder('Etek', 1),
  elbise1: placeholder('Elbise', 2),
  elbise2: placeholder('Elbise', 3),
  pantolon1: placeholder('Pantolon', 4),
  pantolon2: placeholder('Pantolon', 5),
  gomlek1: placeholder('Gömlek', 6),
  gomlek2: placeholder('Gömlek', 7),
  kaban1: placeholder('Kaban', 8),
  kaban2: placeholder('Kaban', 9),
  mont1: placeholder('Mont', 10),
  mont2: placeholder('Mont', 11),
  kazak1: placeholder('Kazak', 12),
  kazak2: placeholder('Kazak', 13),
  tisort1: placeholder('Tişört', 14),
  tisort2: placeholder('Tişört', 15),
  bluz1: placeholder('Bluz', 16),
  bluz2: placeholder('Bluz', 17),
  esofman1: placeholder('Eşofman', 18),
  esofman2: placeholder('Eşofman', 19),
};
