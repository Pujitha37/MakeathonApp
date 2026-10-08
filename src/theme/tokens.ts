// Design tokens ported 1:1 from the finprofile.html prototype CSS.
// Light + dark palettes, category colors, radii, spacing. See DESIGN.md for the reference tables.

export type Palette = {
  paper: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  indigo: string;
  indigoSoft: string;
  marigold: string;
  marigoldSoft: string;
  sage: string;
  sageSoft: string;
  coral: string;
  coralSoft: string;
  frame: string;
  heroBg: string; // indigo in light, custom in dark
  // on-indigo text color (white in light, near-paper in dark) used by .btn.primary / hero
  onIndigo: string;
};

export const light: Palette = {
  paper: '#EEEDF7',
  surface: '#FFFFFF',
  surface2: '#F6F5FC',
  ink: '#1F2547',
  ink2: '#5B6080',
  ink3: '#8A8EAA',
  line: '#E3E2EE',
  indigo: '#3B4CCA',
  indigoSoft: '#E7E9FB',
  marigold: '#F2A93B',
  marigoldSoft: '#FDF0DA',
  sage: '#23926A',
  sageSoft: '#DDF3EA',
  coral: '#D9483A',
  coralSoft: '#FBE3E0',
  frame: '#D9D7EA',
  heroBg: '#3B4CCA',
  onIndigo: '#FFFFFF',
};

export const dark: Palette = {
  paper: '#0F1124',
  surface: '#1A1D38',
  surface2: '#222647',
  ink: '#EEF0FF',
  ink2: '#A6AACB',
  ink3: '#7579A0',
  line: '#2D3156',
  indigo: '#8C98FF',
  indigoSoft: '#272C5A',
  marigold: '#F5B95A',
  marigoldSoft: '#3A3020',
  sage: '#4FCB98',
  sageSoft: '#173A30',
  coral: '#FF7B6E',
  coralSoft: '#42221F',
  frame: '#070814',
  heroBg: '#2B3398',
  onIndigo: '#0F1124',
};

// Card shadow — approximated from: 0 1px 2px rgba(31,37,71,.06), 0 8px 24px rgba(31,37,71,.06)
export const shadow = {
  shadowColor: '#1F2547',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 3,
};

export const radius = {
  card: 22,
  hero: 28,
  sheet: 28,
  button: 14,
  buttonSm: 11,
  icoTile: 14,
  pill: 999,
  segmented: 14,
  input: 16,
  phone: 38,
} as const;

export const space = {
  screenX: 16,
  cardPad: 16,
  cardGap: 12,
  sectionTop: 18,
} as const;

// ---- Category palette (16) ----
export type CatId =
  | 'FOOD_GROCERIES' | 'DINING_DELIVERY' | 'TRANSPORT' | 'HOUSING'
  | 'UTILITIES' | 'SHOPPING' | 'HEALTH' | 'FITNESS' | 'ENTERTAINMENT'
  | 'EDUCATION' | 'TRAVEL' | 'SUBSCRIPTIONS' | 'PERSONAL_CARE'
  | 'GIFTS_FAMILY' | 'FEES_CHARGES' | 'OTHER';

export type Category = { id: CatId; label: string; emoji: string; color: string };

export const CATS: Category[] = [
  { id: 'FOOD_GROCERIES', label: 'Food & Groceries', emoji: '🥬', color: '#3FA66B' },
  { id: 'DINING_DELIVERY', label: 'Dining & Delivery', emoji: '🍜', color: '#F2A93B' },
  { id: 'TRANSPORT', label: 'Transport', emoji: '🛺', color: '#4C6FFF' },
  { id: 'HOUSING', label: 'Housing', emoji: '🏠', color: '#8B6CEF' },
  { id: 'UTILITIES', label: 'Utilities & Bills', emoji: '💡', color: '#22A6B3' },
  { id: 'SHOPPING', label: 'Shopping', emoji: '🛍️', color: '#E8578D' },
  { id: 'HEALTH', label: 'Health', emoji: '💊', color: '#E0503F' },
  { id: 'FITNESS', label: 'Fitness', emoji: '🏋️', color: '#7CB342' },
  { id: 'ENTERTAINMENT', label: 'Entertainment', emoji: '🎬', color: '#AB47BC' },
  { id: 'EDUCATION', label: 'Education', emoji: '📚', color: '#5C6BC0' },
  { id: 'TRAVEL', label: 'Travel', emoji: '✈️', color: '#0097A7' },
  { id: 'SUBSCRIPTIONS', label: 'Subscriptions', emoji: '🔁', color: '#FF7043' },
  { id: 'PERSONAL_CARE', label: 'Personal Care', emoji: '💇', color: '#EC407A' },
  { id: 'GIFTS_FAMILY', label: 'Gifts & Family', emoji: '🎁', color: '#C9A227' },
  { id: 'FEES_CHARGES', label: 'Fees & Charges', emoji: '🧾', color: '#78909C' },
  { id: 'OTHER', label: 'Other', emoji: '❔', color: '#9E9E9E' },
];

export const CAT: Record<string, Category> = Object.fromEntries(CATS.map((c) => [c.id, c]));

// Icon tile background = category color at ~13% alpha ("22" suffix in the prototype).
export const icoBg = (color: string) => color + '22';
