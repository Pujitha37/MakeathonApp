// Deterministic seed data, ported 1:1 from finprofile.html (same seeded RNG, same call order)
// so the generated numbers match the HTML prototype exactly.
//
// IMPORTANT: the RNG is a stateful mutable closure consumed in a specific sequence (gen() ->
// per-spec count roll -> per-item date/amount/merchant rolls). The call order below mirrors the
// original <script> top-to-bottom execution order exactly — do not reorder without re-checking
// parity against the prototype.

import { daysIn, iso } from '@/lib/format';
import type { CatId } from '@/theme/tokens';
import type { Goal, Loan, Source, Stmt, Tx } from './types';

export const TODAY = new Date(2026, 9, 8); // 8 Oct 2026

// ---- seeded RNG (mulberry32-style, identical to the prototype) ----
function rng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(21);
const pick = <T,>(a: T[]): T => a[Math.floor(R() * a.length)];
const between = (a: number, b: number): number => (a === b ? a : Math.round((a + R() * (b - a)) / 10) * 10);

// ---- transaction store ----
let TX: Tx[] = [];
let nid = 1;
function add(
  date: string,
  amount: number,
  merchant: string,
  cat: CatId,
  source: Source,
  type: Tx['type'] = 'expense',
  stmt: string | null = null,
): Tx {
  const t: Tx = { id: nid++, date, amount, merchant, cat, source, type, stmt };
  TX.push(t);
  return t;
}

type Spec = [CatId, string[], number, number, number]; // cat, merchants, n-per-month, lo, hi

function gen(source: Source, specs: Spec[], y: number, m: number, from: number, to: number, stmt: string | null) {
  const span = to - from + 1;
  const dim = daysIn(y, m);
  for (const [cat, merchants, n, lo, hi] of specs) {
    const count = n < 1 ? (R() < n ? 1 : 0) : Math.max(0, Math.round((n * span) / dim * (0.8 + R() * 0.4)));
    for (let i = 0; i < count; i++) {
      const d = from + Math.floor(R() * span);
      add(iso(new Date(y, m, d)), between(lo, hi), pick(merchants), cat, source, 'expense', stmt);
    }
  }
}

const manualSpecs: Spec[] = [
  ['DINING_DELIVERY', ['Swiggy', 'Zomato', 'Chai Point', 'Café Madras'], 12, 150, 450],
  ['TRANSPORT', ['Ola', 'Uber', 'Mumbai Metro', 'Rapido'], 10, 60, 320],
  ['FOOD_GROCERIES', ['Zepto', 'Blinkit', 'Vegetable market'], 5, 120, 700],
  ['ENTERTAINMENT', ['PVR Cinemas', 'BookMyShow'], 0.7, 300, 700],
  ['PERSONAL_CARE', ['Looks Salon'], 0.5, 350, 600],
];
const bankSpecs: Spec[] = [
  ['UTILITIES', ['Adani Electricity', 'Jio recharge', 'Mahanagar Gas'], 3, 300, 1600],
  ['FOOD_GROCERIES', ['DMart', 'Vegetable market UPI', 'Dairy (milk)'], 5, 200, 1400],
  ['TRANSPORT', ['HP Fuel', 'Uber'], 3, 200, 900],
  ['HEALTH', ['Apollo Pharmacy', 'Dr. Mehta Clinic'], 1, 250, 900],
  ['GIFTS_FAMILY', ['Gift for Amma', 'Archies'], 0.5, 500, 2000],
];
const cardSpecs: Spec[] = [
  ['DINING_DELIVERY', ['Swiggy', 'Zomato', 'The Bombay Canteen'], 6, 250, 1400],
  ['SHOPPING', ['Myntra', 'Amazon', 'Decathlon'], 3, 400, 2800],
  ['ENTERTAINMENT', ['BookMyShow', 'Steam'], 1, 300, 900],
  ['TRAVEL', ['IndiGo', 'MakeMyTrip hotel'], 0.45, 3000, 8000],
  ['EDUCATION', ['Udemy', 'Kindle store'], 0.5, 400, 900],
];

for (const m of [6, 7, 8]) gen('manual', manualSpecs, 2026, m, 1, daysIn(2026, m), null);

(
  [
    ['2026-10-01', 180, 'Ola', 'TRANSPORT'],
    ['2026-10-02', 420, 'Swiggy', 'DINING_DELIVERY'],
    ['2026-10-02', 640, 'Zepto', 'FOOD_GROCERIES'],
    ['2026-10-03', 560, 'Zomato', 'DINING_DELIVERY'],
    ['2026-10-04', 240, 'Uber', 'TRANSPORT'],
    ['2026-10-04', 890, 'PVR Cinemas', 'ENTERTAINMENT'],
    ['2026-10-05', 380, 'Swiggy', 'DINING_DELIVERY'],
    ['2026-10-06', 120, 'Mumbai Metro', 'TRANSPORT'],
    ['2026-10-06', 450, 'Blinkit', 'FOOD_GROCERIES'],
    ['2026-10-07', 160, 'Rapido', 'TRANSPORT'],
    ['2026-10-08', 290, 'Swiggy', 'DINING_DELIVERY'],
  ] as [string, number, string, CatId][]
).forEach((r) => add(r[0], r[1], r[2], r[3], 'manual'));

// ---- loans / EMIs ----
export const LOANS: Loan[] = [
  { id: 'L1', name: 'iPhone 16', kind: 'No-cost EMI', lender: 'Bajaj Finserv', emoji: '📱', emi: 4150, start: '2026-03-05', months: 12, dueDay: 5, source: 'bank' },
  { id: 'L2', name: 'Two-wheeler loan', kind: 'Loan EMI', lender: 'HDFC Bank', emoji: '🛵', emi: 3280, start: '2025-11-10', months: 24, dueDay: 10, source: 'bank' },
  { id: 'L3', name: 'Samsung TV', kind: 'Card EMI', lender: 'Credit card ••9034', emoji: '📺', emi: 2100, start: '2026-06-15', months: 9, dueDay: 15, source: 'card' },
];

export function instNo(L: Loan, y: number, m: number): number {
  const s = new Date(L.start.split('-').map(Number)[0], L.start.split('-').map(Number)[1] - 1, L.start.split('-').map(Number)[2]);
  return (y - s.getFullYear()) * 12 + (m - s.getMonth()) + 1;
}

function addEmis(src: Source, y: number, m: number, from: number, to: number, stmt: string | null) {
  LOANS.filter((L) => L.source === src).forEach((L) => {
    const n = instNo(L, y, m);
    if (n >= 1 && n <= L.months && L.dueDay >= from && L.dueDay <= to) {
      const t = add(iso(new Date(y, m, L.dueDay)), L.emi, `${L.lender} EMI`, 'OTHER', src, 'emi', stmt);
      t.loan = L.id;
      t.inst = n;
    }
  });
}

export let STMTS: Stmt[] = [];

function bankMonth(m: number, from: number, to: number, id: string) {
  const y = 2026;
  if (from === 1) {
    add(iso(new Date(y, m, 1)), 85000, 'Salary credit', 'OTHER', 'bank', 'income', id);
    add(iso(new Date(y, m, 1)), 18000, 'Rent to landlord', 'HOUSING', 'bank', 'expense', id);
  }
  if (to >= 12) add(iso(new Date(y, m, 12)), 14000, 'Credit card bill payment', 'OTHER', 'bank', 'transfer', id);
  if (to >= 6) add(iso(new Date(y, m, 6)), 1499, 'Cult.fit membership', 'FITNESS', 'bank', 'expense', id);
  if (to >= 28) add(iso(new Date(y, m, 28)), 12, 'SMS alert charges', 'FEES_CHARGES', 'bank', 'expense', id);
  addEmis('bank', y, m, from, to, id);
  gen('bank', bankSpecs, y, m, from, to, id);
}

function cardMonth(m: number, id: string) {
  const y = 2026;
  add(iso(new Date(y, m, 3)), 649, 'Netflix', 'SUBSCRIPTIONS', 'card', 'expense', id);
  add(iso(new Date(y, m, 9)), 119, 'Spotify', 'SUBSCRIPTIONS', 'card', 'expense', id);
  addEmis('card', y, m, 1, daysIn(y, m), id);
  gen('card', cardSpecs, y, m, 1, daysIn(y, m), id);
}

([
  [6, 'b-jul'],
  [7, 'b-aug'],
  [8, 'b-sep'],
] as [number, string][]).forEach(([m, id]) => {
  bankMonth(m, 1, daysIn(2026, m), id);
  STMTS.push({
    id,
    source: 'bank',
    name: 'Savings ••4821',
    from: iso(new Date(2026, m, 1)),
    to: iso(new Date(2026, m, daysIn(2026, m))),
    imported: iso(new Date(2026, m + 1, 2)),
  });
});

([
  [7, 'c-aug'],
  [8, 'c-sep'],
] as [number, string][]).forEach(([m, id]) => {
  cardMonth(m, id);
  STMTS.push({
    id,
    source: 'card',
    name: 'Credit card ••9034',
    from: iso(new Date(2026, m, 1)),
    to: iso(new Date(2026, m, daysIn(2026, m))),
    imported: iso(new Date(2026, m + 1, 3)),
  });
});

// ---- goals (seed) ----
export const SEED_GOALS: Goal[] = [
  {
    id: 1,
    name: 'Goa trip',
    emoji: '🏖️',
    target: 30000,
    start: '2026-08-01',
    due: '2026-12-20',
    contrib: [['2026-08-05', 5000], ['2026-09-05', 5000], ['2026-10-05', 3000]],
  },
  {
    id: 2,
    name: 'Emergency fund',
    emoji: '🛟',
    target: 100000,
    start: '2026-07-01',
    due: '2027-06-30',
    contrib: [
      ['2026-07-03', 10000],
      ['2026-08-03', 10000],
      ['2026-09-03', 10000],
      ['2026-10-03', 10000],
    ],
  },
];

// ---- seed budgets ----
export const SEED_BUDGETS: Partial<Record<CatId, number>> = {
  DINING_DELIVERY: 5000,
  TRANSPORT: 3000,
  FOOD_GROCERIES: 5000,
  SHOPPING: 3000,
};

// Expose the generated transactions as a frozen seed snapshot. The store copies this array into
// mutable state at init (new expenses/undo/category edits operate on the store's copy).
export const SEED_TX: Tx[] = TX;
export function nextTxId(): number {
  return nid;
}
export function bumpTxId(): number {
  return nid++;
}
