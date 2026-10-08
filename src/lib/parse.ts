// Natural-language category matching + quick-add expense parsing, ported from finprofile.html.

import { iso } from './format';
import type { CatId } from '@/theme/tokens';
import { TODAY } from '@/data/seed';

export const KW: Partial<Record<CatId, string[]>> = {
  DINING_DELIVERY: ['swiggy','zomato','restaurant','cafe','café','coffee','chai','lunch','dinner','pizza','dominos','dining','eating out','delivery','biryani','breakfast'],
  FOOD_GROCERIES: ['bigbasket','zepto','blinkit','dmart','grocery','groceries','vegetables','veggies','milk','fruits','fruit','sabzi','kirana'],
  TRANSPORT: ['ola','uber','metro','auto','rapido','fuel','petrol','diesel','bus','train','cab','taxi','transport','parking','toll'],
  UTILITIES: ['electricity','recharge','jio','airtel','water bill','gas','wifi','broadband','bill','bills','utilities'],
  SHOPPING: ['amazon','myntra','flipkart','clothes','shoes','headphones','shirt','shopping','earphones','phone case','decathlon'],
  HEALTH: ['pharmacy','apollo','doctor','medicine','medicines','clinic','health','hospital'],
  FITNESS: ['gym','cult','yoga','fitness','badminton','swimming'],
  ENTERTAINMENT: ['movie','movies','cinema','pvr','bookmyshow','games','game','concert','entertainment','steam'],
  EDUCATION: ['course','book','books','udemy','exam','tuition','education','kindle'],
  TRAVEL: ['flight','hotel','irctc','indigo','travel','trip','makemytrip'],
  SUBSCRIPTIONS: ['netflix','spotify','prime','youtube','hotstar','subscription','subscriptions'],
  PERSONAL_CARE: ['salon','haircut','grooming','spa','personal care'],
  GIFTS_FAMILY: ['gift','gifts','family','birthday'],
  FEES_CHARGES: ['fee','fees','charge','charges','interest','penalty'],
  HOUSING: ['rent','maintenance','housing'],
};

export interface CatMatch {
  cats: CatId[];
  group: string | null;
}

export function findCats(text: string): CatMatch | null {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/\bfood\b/.test(t) && !/grocer/.test(t)) return { cats: ['FOOD_GROCERIES', 'DINING_DELIVERY'], group: 'Food' };
  for (const [c, words] of Object.entries(KW) as [CatId, string[]][]) {
    if (words.some((w) => new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(t))) {
      return { cats: [c], group: null };
    }
  }
  return null;
}

export interface ParsedExpense {
  amount: number;
  merchant: string;
  cat: CatId;
  date: string;
}

export interface ParseResult {
  ok: ParsedExpense[];
  bad: string[];
}

export function parseExpenses(text: string): ParseResult {
  const lower = text.toLowerCase();
  const dateOf = (s: string): Date | null => {
    if (/yesterday|kal\b/.test(s)) return new Date(2026, 9, 7);
    const m = s.match(/(\d+)\s*days?\s*ago/);
    if (m) {
      const d = new Date(TODAY);
      d.setDate(d.getDate() - +m[1]);
      return d;
    }
    return null;
  };
  const globalDate = dateOf(lower) || TODAY;
  const parts = text.split(/,|\band\b|&|\+|;/i).map((s) => s.trim()).filter(Boolean);
  const ok: ParsedExpense[] = [];
  const bad: string[] = [];
  parts.forEach((p) => {
    const am = p.match(/(?:₹|rs\.?\s*|inr\s*)?(\d[\d,]*(?:\.\d+)?)/i);
    const merchantRaw = p
      .replace(/(?:₹|rs\.?\s*|inr\s*)?\d[\d,]*(?:\.\d+)?\s*(?:rs|rupees|inr)?/gi, ' ')
      .replace(/\b(yesterday|today|days?|ago|spent|paid|for|on|at|to|rupees|kal)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!am) {
      if (merchantRaw) bad.push(`I couldn't find an amount in "${p}". Try something like "${merchantRaw || 'Auto'} 60".`);
      return;
    }
    const amount = +am[1].replace(/,/g, '');
    if (!amount) {
      bad.push(`"${p}" has an amount of zero, so it wasn't saved.`);
      return;
    }
    const fc = findCats(merchantRaw);
    const cat: CatId = fc ? (fc.group ? 'FOOD_GROCERIES' : fc.cats[0]) : 'OTHER';
    const name = merchantRaw ? merchantRaw.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Expense';
    ok.push({ amount, merchant: name, cat, date: iso(dateOf(p.toLowerCase()) || globalDate) });
  });
  return { ok, bad };
}
