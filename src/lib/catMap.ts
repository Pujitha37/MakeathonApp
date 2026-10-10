// Translate between the Pi's category IDs and the app's local CatId.
// Pi has 12 locked categories; the app has 16 styled ones.
import type { PiCategoryId } from './financialApi';
import { CAT, type CatId } from '@/theme/tokens';

export const PI_LABEL: Record<PiCategoryId, string> = {
  food_dining:    'Food & Dining',
  groceries:      'Groceries',
  transport:      'Transport',
  rent_utilities: 'Rent & Utilities',
  shopping:       'Shopping',
  health_fitness: 'Health & Fitness',
  education:      'Education',
  entertainment:  'Entertainment',
  subscriptions:  'Digital Subscriptions',
  travel:         'Travel',
  fees_charges:   'Fees & Charges',
  other:          'Other',
};

export const PI_EMOJI: Record<PiCategoryId, string> = {
  food_dining:    '🍜',
  groceries:      '🥬',
  transport:      '🛺',
  rent_utilities: '🏠',
  shopping:       '🛍️',
  health_fitness: '💊',
  education:      '📚',
  entertainment:  '🎬',
  subscriptions:  '🔁',
  travel:         '✈️',
  fees_charges:   '🧾',
  other:          '❔',
};

// Pi → local CatId (so existing styled components can use category colors)
export const PI_TO_LOCAL: Record<PiCategoryId, CatId> = {
  food_dining:    'DINING_DELIVERY',
  groceries:      'FOOD_GROCERIES',
  transport:      'TRANSPORT',
  rent_utilities: 'UTILITIES',
  shopping:       'SHOPPING',
  health_fitness: 'HEALTH',
  education:      'EDUCATION',
  entertainment:  'ENTERTAINMENT',
  subscriptions:  'SUBSCRIPTIONS',
  travel:         'TRAVEL',
  fees_charges:   'FEES_CHARGES',
  other:          'OTHER',
};

// Local → Pi (lossy; several locals collapse into one Pi category)
export const LOCAL_TO_PI: Record<CatId, PiCategoryId> = {
  FOOD_GROCERIES:  'groceries',
  DINING_DELIVERY: 'food_dining',
  TRANSPORT:       'transport',
  HOUSING:         'rent_utilities',
  UTILITIES:       'rent_utilities',
  SHOPPING:        'shopping',
  HEALTH:          'health_fitness',
  FITNESS:         'health_fitness',
  ENTERTAINMENT:   'entertainment',
  EDUCATION:       'education',
  TRAVEL:          'travel',
  SUBSCRIPTIONS:   'subscriptions',
  PERSONAL_CARE:   'other',
  GIFTS_FAMILY:    'other',
  FEES_CHARGES:    'fees_charges',
  OTHER:           'other',
};

export const piCatColor = (pi: PiCategoryId | null | undefined): string => {
  const local = pi ? PI_TO_LOCAL[pi] : 'OTHER';
  return CAT[local]?.color ?? '#9E9E9E';
};

export const piCatLabel = (pi: PiCategoryId | null | undefined): string =>
  pi ? PI_LABEL[pi] : 'Uncategorized';

export const piCatEmoji = (pi: PiCategoryId | null | undefined): string =>
  pi ? PI_EMOJI[pi] : '•';

export const PI_CATEGORY_LIST: PiCategoryId[] = [
  'food_dining', 'groceries', 'transport', 'rent_utilities',
  'shopping', 'health_fitness', 'education', 'entertainment',
  'subscriptions', 'travel', 'fees_charges', 'other',
];
