// Natural-language question engine, ported from the "ask" section of finprofile.html.
// Deterministic, runs entirely on-device against the current store snapshot (passed in as `ctx`).
import { cap, daysIn, fd, fmt, iso, minD, MON, MONL, ord, pd, WD } from './format';
import { CAT, CatId } from '@/theme/tokens';
import type { Goal, Loan, Source, Stmt, Tx } from '@/data/types';
import { SHORT } from '@/data/types';
import { TODAY, instNo } from '@/data/seed';
import { budgetStatus, coverageEnd, curMonth, expenses, monthBounds, sum } from './calc';
import { activeLoans, detectRecurring, loanInfo, SUBCATS, type LoanInfo } from './recurring';
import { findCats, type CatMatch } from './parse';

export interface AskCtx {
  tx: Tx[];
  stmts: Stmt[];
  scope: Source;
  budgets: Partial<Record<CatId, number>>;
  loans: Loan[];
}

export interface Bar {
  label: string; // display label, may include an emoji prefix
  name: string; // plain name, no emoji — for use in sentences
  value: number;
  color: string;
}

export interface LoanRow {
  loan: Loan;
  info: LoanInfo;
}

export type AskKind = 'total' | 'count' | 'biggest' | 'day' | 'rank' | 'avg' | 'list' | 'compare' | '';

export interface AskAnswer {
  kind: 'num' | 'info' | 'hyp';
  k?: AskKind;
  head: string;
  headSuffix?: string; // small trailing text, e.g. "/month"
  txt: string;
  bars?: Bar[];
  items?: Tx[];
  loanRows?: LoanRow[];
  rows?: [string, string][];
  ev?: Tx[] | null;
  evTitle?: string;
  act?: { label: string; action: 'editBudget' | 'goRecurring'; cat?: CatId };
  follow?: string[];
  switchTo?: Source;
}

interface Filt {
  mer: { label: string; names: string[] } | null;
  fc: CatMatch | null;
  label: string;
}

interface Period {
  start: Date;
  end: Date;
  label: string;
  month?: number;
  phrase: string;
  q: string;
}

const MSTOP = new Set(['the', 'dr.', 'sms', 'hp', 'gift', 'rent', 'salary', 'credit', 'dairy', 'vegetable', 'mumbai', 'card', 'looks', 'expense', 'expenses', 'other', 'food', 'auto']);
const MRX: (RegExp | null)[] = MONL.map((n, i) =>
  i === 4 ? null : new RegExp('\\b(' + n.toLowerCase() + '|' + MON[i].toLowerCase() + (i === 8 ? '|sept' : '') + ')\\b'),
);

function monthsIn(t: string): number[] {
  const o: { i: number; pos: number }[] = [];
  MRX.forEach((r, i) => {
    if (r) {
      const m = t.match(r);
      if (m) o.push({ i, pos: m.index! });
    }
  });
  return o.sort((a, b) => a.pos - b.pos).map((x) => x.i);
}

function monthPeriod(i: number): Period {
  const y = i <= 9 ? 2026 : 2025;
  return { start: new Date(y, i, 1), end: new Date(y, i, daysIn(y, i)), label: MONL[i], month: i, phrase: 'in ' + MONL[i], q: 'in ' + MONL[i].toLowerCase() };
}

function thisMonthPartial(): Period {
  return { start: new Date(2026, 9, 1), end: TODAY, label: `1–${TODAY.getDate()} Oct`, month: 9, phrase: 'this month so far', q: 'this month' };
}

function parsePeriod(t: string): Period {
  let m: RegExpMatchArray | null;
  const T = TODAY;
  if (/\btoday\b/.test(t)) return { start: T, end: T, label: 'today', phrase: 'today', q: 'today' };
  if (/\byesterday\b/.test(t)) {
    const d = new Date(2026, 9, 7);
    return { start: d, end: d, label: 'yesterday', phrase: 'yesterday', q: 'yesterday' };
  }
  if ((m = t.match(/(?:last|past)\s+(\d+)\s+days?/))) {
    const n = +m[1];
    const s = new Date(T);
    s.setDate(s.getDate() - n + 1);
    return { start: s, end: T, label: `the last ${n} days`, phrase: `in the last ${n} days`, q: `last ${n} days` };
  }
  if (/this week/.test(t)) {
    const s = new Date(T);
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    return { start: s, end: T, label: 'this week', phrase: 'this week', q: 'this week' };
  }
  if (/(last|past|previous) week/.test(t)) {
    const e = new Date(T);
    e.setDate(e.getDate() - ((e.getDay() + 6) % 7) - 1);
    const s = new Date(e);
    s.setDate(s.getDate() - 6);
    return { start: s, end: e, label: 'last week', phrase: 'last week', q: 'last week' };
  }
  if ((m = t.match(/(?:last|past)\s+(\d+|two|three|four|five|six)\s+months/))) {
    const map: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 };
    const n = Math.min(9, map[m[1]] || +m[1]);
    return { start: new Date(2026, 9 - n, 1), end: new Date(2026, 9, 0), label: `${MON[9 - n]}–Sep`, phrase: `over the last ${n} full months`, q: `last ${n} months` };
  }
  if (/this year|since january/.test(t)) return { start: new Date(2026, 0, 1), end: T, label: '2026 so far', phrase: 'this year', q: 'this year' };
  if (/(last|previous) month/.test(t)) return { ...monthPeriod(8), phrase: 'last month', q: 'last month' };
  const ms = monthsIn(t);
  if (ms.length) return monthPeriod(ms[0]);
  return { start: new Date(2026, 9, 1), end: T, label: 'October so far', month: 9, phrase: 'this month so far', q: 'this month' };
}

function shiftBack(p: Period): Period {
  if (p.month != null && p.start.getDate() === 1) {
    const m = p.month - 1;
    const full = p.end.getDate() === daysIn(2026, p.month);
    const e = full ? new Date(2026, m, daysIn(2026, m)) : new Date(2026, m, Math.min(p.end.getDate(), daysIn(2026, m)));
    return { start: new Date(2026, m, 1), end: e, label: full ? MONL[m] : `1–${e.getDate()} ${MON[m]}`, month: m, phrase: '', q: '' };
  }
  const span = Math.round((+p.end - +p.start) / 864e5) + 1;
  const e = new Date(p.start);
  e.setDate(e.getDate() - 1);
  const s = new Date(e);
  s.setDate(s.getDate() - span + 1);
  return { start: s, end: e, label: `the ${span} days before`, phrase: '', q: '' };
}

function knownMerchants(tx: Tx[]): string[] {
  return [...new Set(tx.filter((t) => t.type === 'expense').map((t) => t.merchant))];
}

function findMerchant(t: string, tx: Tx[]): { label: string; names: string[] } | null {
  const ms = knownMerchants(tx);
  let best: { name: string; n: string; first: string; full: boolean } | null = null;
  for (const name of ms) {
    const n = name.toLowerCase();
    const first = n.split(/\s+/)[0];
    if (n.length > 3 && t.includes(n)) {
      if (!best || !best.full || n.length > best.n.length) best = { name, n, first, full: true };
    } else if (!best && first.length >= 3 && !MSTOP.has(first) && new RegExp('(^|[^a-z])' + first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(t)) {
      best = { name, n, first, full: false };
    }
  }
  if (!best) return null;
  const names = best.full ? [best.name] : ms.filter((x) => x.toLowerCase().split(/\s+/)[0] === best!.first);
  return { label: best.full ? best.name : cap(best.first), names };
}

function filt(t: string, tx: Tx[]): Filt {
  const mer = findMerchant(t, tx);
  const fc = mer ? null : findCats(t);
  return { mer, fc, label: mer ? mer.label : fc ? fc.group || CAT[fc.cats[0]].label : 'everything' };
}

function clip(p: Period, src: Source, stmts: Stmt[]) {
  const end = minD(p.end, coverageEnd(stmts, src), TODAY);
  return { ...p, end, has: end >= p.start, partial: end < p.end };
}

function run(f: Filt, p: Period, src: Source, ctx: AskCtx) {
  const c = clip(p, src, ctx.stmts);
  if (!c.has) return { has: false as const, list: [] as Tx[], c };
  let list = expenses(ctx.tx, src, c.start, c.end, f.fc ? f.fc.cats : null);
  if (f.mer) list = list.filter((x) => f.mer!.names.includes(x.merchant));
  return { has: true as const, list, c };
}

const pl = (c: { start: Date; end: Date }) => (+c.start === +c.end ? `${fd(c.start)} ${c.start.getFullYear()}` : `${fd(c.start)} – ${fd(c.end)} ${c.end.getFullYear()}`);

function baseRows(c: { start: Date; end: Date; partial: boolean }, f: Filt, ctx: AskCtx, calc?: string): [string, string][] {
  const r: [string, string][] = [
    ['Period', pl(c) + (c.partial ? ' (data so far)' : '')],
    ['Source', sourceLabel(ctx.scope)],
  ];
  if (f.fc && f.fc.group) r.push(['Includes', 'Food & Groceries + Dining & Delivery']);
  if (f.mer && f.mer.names.length > 1) r.push(['Merchants', f.mer.names.join(', ')]);
  if (calc) r.push(['Calculation', calc]);
  r.push(['Left out', 'Income, transfers, EMIs, refunds']);
  return r;
}

function sourceLabel(scope: Source) {
  return scope === 'manual' ? 'Quick Add' : scope === 'bank' ? 'Bank statement' : 'Credit card statement';
}

function otherSrc(f: Filt, p: Period, ctx: AskCtx): Source | null {
  for (const s of ['manual', 'bank', 'card'] as Source[]) {
    if (s === ctx.scope) continue;
    const r = run(f, p, s, ctx);
    if (r.has && r.list.length) return s;
  }
  return null;
}
function otherSrcN(f: Filt, p: Period, ctx: AskCtx): number {
  const s = otherSrc(f, p, ctx);
  return s ? run(f, p, s, ctx).list.length : 0;
}

function noData(f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const o = otherSrc(f, p, ctx);
  return {
    kind: 'info',
    head: 'Not enough data',
    txt: `${sourceLabel(ctx.scope)} has no records covering ${p.label}.${o ? ` ${sourceLabel(o)} does.` : ''}`,
    switchTo: o ?? undefined,
  };
}

function emptyOr(
  r: { has: boolean; list: Tx[]; c: any },
  f: Filt,
  p: Period,
  ctx: AskCtx,
  build: () => AskAnswer,
): AskAnswer {
  if (!r.has) return noData(f, p, ctx);
  if (!r.list.length) {
    const o = otherSrc(f, p, ctx);
    const n = o ? otherSrcN(f, p, ctx) : 0;
    return {
      kind: 'info',
      head: `No ${f.label === 'everything' ? 'spending' : f.label} found`,
      txt: `Nothing recorded in ${sourceLabel(ctx.scope)} for ${pl(r.c)}.${o ? ` ${sourceLabel(o)} has ${n} matching transaction${n > 1 ? 's' : ''}.` : ''}`,
      switchTo: o ?? undefined,
    };
  }
  return build();
}

const what = (f: Filt) => (f.mer ? 'at ' + f.mer.label : f.label === 'everything' ? 'in total' : 'on ' + f.label);
const catBars = (list: Tx[]): Bar[] => {
  const o: Partial<Record<CatId, number>> = {};
  list.forEach((t) => (o[t.cat] = (o[t.cat] || 0) + t.amount));
  return (Object.entries(o) as [CatId, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([c, v]) => ({ label: `${CAT[c].emoji} ${CAT[c].label}`, name: CAT[c].label, value: v, color: CAT[c].color }));
};

function follows(f: Filt, p: Period, k: string): string[] {
  const l = f.label === 'everything' ? '' : f.label + ' ';
  const q = p.q || 'this month';
  const o: [string, string | null][] = [
    ['total', l ? `How much did I spend on ${l}${q}` : `How much did I spend ${q}`],
    ['biggest', `Biggest ${l}expenses ${q}`],
    ['compare', `Compare ${l || 'spending '}with last month`],
    ['rank', f.mer ? null : f.fc && !f.fc.group ? `Top ${l}merchants ${q}` : `Where did I spend the most ${q}`],
    ['count', `How many ${l}transactions ${q}`],
    ['avg', `Average daily ${l}spend ${q}`],
  ];
  return o
    .filter((x) => x[0] !== k && x[1])
    .slice(0, 3)
    .map((x) => x[1]!);
}

function totalAnswer(f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => {
    const tot = sum(r.list);
    const n = r.list.length;
    const a: AskAnswer = {
      k: 'total',
      kind: 'num',
      head: fmt(tot),
      txt: `spent ${what(f)} ${p.phrase}.`,
      rows: baseRows(r.c, f, ctx, `Sum of ${n} expense${n > 1 ? 's' : ''}`),
      ev: r.list,
      evTitle: `${cap(f.label)}, ${pl(r.c)}`,
    };
    if (f.mer) a.txt = `spent at ${f.mer.label} ${p.phrase}, across ${n} payment${n > 1 ? 's' : ''} (about ${fmt(tot / n)} each).`;
    if (!f.mer && (!f.fc || f.fc.group)) a.bars = catBars(r.list).slice(0, 5);
    return a;
  });
}

function countAnswer(f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => {
    const tot = sum(r.list);
    const n = r.list.length;
    return {
      k: 'count',
      kind: 'num',
      head: `${n} time${n > 1 ? 's' : ''}`,
      txt: `${f.label === 'everything' ? 'you spent' : 'you spent ' + what(f)} ${p.phrase}: ${fmt(tot)} in total, about ${fmt(tot / n)} each time.`,
      rows: baseRows(r.c, f, ctx, 'Count of matching expenses'),
      ev: r.list,
      evTitle: `${cap(f.label)}, ${pl(r.c)}`,
    };
  });
}

function biggestAnswer(t: string, f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => {
    const m = t.match(/top (\d+)/);
    const n = Math.min(10, m ? +m[1] : 3);
    const top = r.list.slice().sort((a, b) => b.amount - a.amount).slice(0, n);
    return {
      k: 'biggest',
      kind: 'num',
      head: fmt(top[0].amount),
      txt: `at ${top[0].merchant} on ${fd(top[0].date)} was your biggest ${f.label === 'everything' ? '' : f.label + ' '}expense ${p.phrase}.`,
      items: top,
      rows: baseRows(r.c, f, ctx, `Largest of ${r.list.length} expenses`),
      ev: top,
      evTitle: `Top ${top.length} ${f.label === 'everything' ? '' : f.label + ' '}expenses`,
    };
  });
}

function dayAnswer(f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => {
    const g: Record<string, Tx[]> = {};
    r.list.forEach((x) => (g[x.date] = g[x.date] || []).push(x));
    const [d, l] = (Object.entries(g).sort((a, b) => sum(b[1]) - sum(a[1]))[0]) as [string, Tx[]];
    return {
      k: 'day',
      kind: 'num',
      head: `${WD[pd(d).getDay()]}, ${fd(d)}`,
      txt: `was your biggest day ${p.phrase}: ${fmt(sum(l))} across ${l.length} expense${l.length > 1 ? 's' : ''}.`,
      items: l,
      rows: baseRows(r.c, f, ctx, 'Daily totals compared'),
      ev: l,
      evTitle: `${WD[pd(d).getDay()]}, ${fd(d)}`,
    };
  });
}

function rankAnswer(f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  if (f.mer) return totalAnswer(f, p, ctx);
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => {
    const tot = sum(r.list);
    let bars: Bar[];
    if (f.fc && !f.fc.group) {
      const g: Record<string, number> = {};
      r.list.forEach((x) => (g[x.merchant] = (g[x.merchant] || 0) + x.amount));
      bars = Object.entries(g)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([n, v]) => ({ label: n, name: n, value: v, color: CAT[f.fc!.cats[0]].color }));
    } else {
      bars = catBars(r.list).slice(0, 6);
    }
    return {
      k: 'rank',
      kind: 'num',
      head: bars[0].name,
      txt: `took the most ${p.phrase}: ${fmt(bars[0].value)}, ${Math.round((bars[0].value / tot) * 100)}% of the ${fmt(tot)} spent${f.label === 'everything' ? '' : ' on ' + f.label}.`,
      bars,
      rows: baseRows(r.c, f, ctx, `Grouped by ${f.fc && !f.fc.group ? 'merchant' : 'category'}`),
      ev: r.list,
      evTitle: `${cap(f.label)}, ${pl(r.c)}`,
    };
  });
}

function avgAnswer(t: string, f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => {
    const tot = sum(r.list);
    const days = Math.round((+r.c.end - +r.c.start) / 864e5) + 1;
    const months = new Set(r.list.map((x) => x.date.slice(0, 7))).size;
    if (/per month|a month|monthly/.test(t) && months > 1) {
      return {
        k: 'avg',
        kind: 'num',
        head: fmt(tot / months),
        txt: `a month ${what(f)}, on average ${p.phrase}.`,
        rows: baseRows(r.c, f, ctx, `${fmt(tot)} ÷ ${months} months`),
        ev: r.list,
        evTitle: `${cap(f.label)}, ${pl(r.c)}`,
      };
    }
    return {
      k: 'avg',
      kind: 'num',
      head: fmt(tot / days),
      txt: `a day ${what(f)}, on average ${p.phrase}.`,
      rows: baseRows(r.c, f, ctx, `${fmt(tot)} ÷ ${days} day${days > 1 ? 's' : ''}`),
      ev: r.list,
      evTitle: `${cap(f.label)}, ${pl(r.c)}`,
    };
  });
}

function listAnswer(f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const r = run(f, p, ctx.scope, ctx);
  return emptyOr(r, f, p, ctx, () => ({
    k: 'list',
    kind: 'num',
    head: `${r.list.length} transaction${r.list.length > 1 ? 's' : ''}`,
    txt: `${f.label === 'everything' ? 'Everything you spent' : 'Spent ' + what(f)} ${p.phrase}, ${fmt(sum(r.list))} altogether.${r.list.length > 5 ? ' Here are the latest 5.' : ''}`,
    items: r.list.slice(0, 5),
    rows: baseRows(r.c, f, ctx),
    ev: r.list,
    evTitle: `${cap(f.label)}, ${pl(r.c)}`,
  }));
}

function compareAnswer(t: string, f: Filt, p: Period, ctx: AskCtx): AskAnswer {
  const ms = monthsIn(t);
  let A: Period;
  let B: Period;
  if (ms.length >= 2) {
    A = monthPeriod(ms[0]);
    B = monthPeriod(ms[1]);
  } else if (/(with|than|to|vs|versus|and) (last|previous) month/.test(t) || (/this month/.test(t) && !ms.length)) {
    A = thisMonthPartial();
    B = shiftBack(A);
  } else {
    A = p.month === 9 ? thisMonthPartial() : p;
    B = shiftBack(A);
  }
  const rA = run(f, A, ctx.scope, ctx);
  const rB = run(f, B, ctx.scope, ctx);
  if (!rA.has) return noData(f, A, ctx);
  if (!rB.has) return noData(f, B, ctx);
  const a = sum(rA.list);
  const b = sum(rB.list);
  const d = a - b;
  const pct = b ? Math.round((d / b) * 100) : null;
  return {
    k: 'compare',
    kind: 'num',
    head: d === 0 ? 'No change' : `${fmt(Math.abs(d))} ${d > 0 ? 'more' : 'less'}`,
    txt: `${what(f)} in ${A.label} than in ${B.label}${pct !== null ? ` (${d > 0 ? '+' : ''}${pct}%)` : ''}.`,
    bars: [
      { label: A.label, name: A.label, value: a, color: '#3B4CCA' },
      { label: B.label, name: B.label, value: b, color: '#8A8EAA' },
    ],
    rows: [
      ['Periods', `${pl(rA.c)} vs ${pl(rB.c)}`],
      ['Source', sourceLabel(ctx.scope)],
      ...(f.fc && f.fc.group ? ([['Includes', 'Food & Groceries + Dining & Delivery']] as [string, string][]) : []),
      ['Calculation', `${fmt(a)} − ${fmt(b)}`],
      ...(A.month === 9 ? ([['Note', "Same days of each month, so it's a fair comparison"]] as [string, string][]) : []),
    ],
    ev: rA.list.concat(rB.list),
    evTitle: `${cap(f.label)}: ${A.label} and ${B.label}`,
  };
}

function remainAnswer(t: string, ctx: AskCtx): AskAnswer {
  const fc = findCats(t);
  if (!fc) {
    return {
      kind: 'info',
      head: 'Which category?',
      txt: "I can tell you what's left in any budget you've set.",
      follow: ['How much can I still spend on dining?', 'How much can I still spend on transport?'],
    };
  }
  const cat = fc.cats.find((c) => ctx.budgets[c]);
  if (!cat) {
    return {
      kind: 'info',
      head: 'No budget set',
      txt: `There's no ${fc.group || CAT[fc.cats[0]].label} budget yet, and I don't know your income or balance, so I can't say what's left.`,
      act: { label: 'Set a budget', action: 'editBudget', cat: fc.cats[0] },
    };
  }
  const s = budgetStatus(ctx.tx, ctx.stmts, ctx.scope, ctx.budgets, cat);
  const mb = curMonth(ctx.stmts, ctx.scope);
  return {
    kind: 'num',
    head: s.left >= 0 ? fmt(s.left) : `${fmt(-s.left)} over`,
    txt:
      s.left >= 0
        ? `left in your ${CAT[cat].label} budget for October, about ${fmt(s.perDay)} a day for the remaining ${s.daysLeft} days.`
        : `You're past your ${CAT[cat].label} limit for October.`,
    rows: [
      ['Period', '1–' + mb.cov.getDate() + ' Oct 2026'],
      ['Source', sourceLabel(ctx.scope)],
      ['Calculation', `${fmt(s.b)} budget − ${fmt(s.spent)} spent`],
    ],
    ev: mb.has ? expenses(ctx.tx, ctx.scope, mb.start, mb.cov, [cat]) : [],
    evTitle: `${CAT[cat].label}, October so far`,
    follow: [`Biggest ${CAT[cat].label} expenses this month`, `Compare ${CAT[cat].label} with last month`],
  };
}

function emiAnswer(t: string, ctx: AskCtx): AskAnswer {
  const act = activeLoans(ctx.tx, ctx.stmts, ctx.loans);
  const one = act.find(
    ({ L }) =>
      (L.name + ' ' + L.lender)
        .toLowerCase()
        .split(/[\s,()]+/)
        .some((w) => w.length > 2 && !['emi', 'loan', 'bank', 'card', 'credit'].includes(w) && t.includes(w)) ||
      (/bike|scooter|two.?wheeler/.test(t) && /wheeler/i.test(L.name)) ||
      (/phone|mobile/.test(t) && /iphone/i.test(L.name)) ||
      (/\btv\b|television/.test(t) && /tv/i.test(L.name)),
  );
  if (one) {
    const { L, s } = one;
    return {
      kind: 'num',
      head: fmt(s.remaining),
      txt: `left to pay on your ${L.name}: ${L.months - s.paid} installment${L.months - s.paid === 1 ? '' : 's'} of ${fmt(L.emi)}, the last one in ${MONL[s.end.getMonth()]} ${s.end.getFullYear()}.`,
      rows: [
        ['Lender', `${L.lender} (${L.kind})`],
        ['Progress', `${s.paid} of ${L.months} paid`],
        ['This month', s.st.l],
        ['Calculation', `${L.months - s.paid} × ${fmt(L.emi)}`],
      ],
      ev: s.list,
      evTitle: `${L.name} EMI payments`,
      act: { label: 'Open Recurring & EMIs', action: 'goRecurring' },
      follow: ['How much do I pay in EMIs?', 'What are my subscriptions?'],
    };
  }
  const tot = act.reduce((a, x) => a + x.L.emi, 0);
  const rem = act.reduce((a, x) => a + x.s.remaining, 0);
  return {
    kind: 'num',
    head: fmt(tot),
    headSuffix: '/month',
    txt: `across ${act.length} EMIs. About ${fmt(rem)} is still left to pay in total.`,
    loanRows: act.map(({ L, s }) => ({ loan: L, info: s })),
    rows: [
      ['From', 'EMI details you added, checked against bank and card statements'],
      ['Note', 'EMIs are kept out of category spending'],
    ],
    act: { label: 'Open Recurring & EMIs', action: 'goRecurring' },
    follow: ['How many installments are left on my iPhone?', 'What are my subscriptions?', 'What do I pay every month?'],
  };
}

function recurAnswer(t: string, ctx: AskCtx): AskAnswer {
  const act = activeLoans(ctx.tx, ctx.stmts, ctx.loans);
  const allRecur = detectRecurring(ctx.tx);
  const subsOnly = /subscription/.test(t);
  const rec = subsOnly ? allRecur.filter((r) => SUBCATS.includes(r.cat)) : allRecur;
  const rT = rec.reduce((a, r) => a + r.amount, 0);
  const eT = subsOnly ? 0 : act.reduce((a, x) => a + x.L.emi, 0);
  const bars: Bar[] = [
    ...rec.map((r) => ({ label: `${CAT[r.cat].emoji} ${r.merchant}`, name: r.merchant, value: r.amount, color: CAT[r.cat].color })),
    ...(subsOnly ? [] : act.map((x) => ({ label: `${x.L.emoji} ${x.L.name} (EMI)`, name: `${x.L.name} (EMI)`, value: x.L.emi, color: '#F2A93B' }))),
  ].sort((a, b) => b.value - a.value);
  return {
    kind: 'num',
    head: fmt(rT + eT),
    headSuffix: '/month',
    txt: subsOnly ? `for ${rec.length} subscriptions and memberships.` : `committed every month: ${fmt(rT)} in ${rec.length} recurring payments plus ${fmt(eT)} in EMIs.`,
    bars,
    rows: [
      ['Rule', 'Same merchant, similar amount, once a month in at least 2 of the last 3 months'],
      ['Sources', 'Quick Add, bank and card records, each listed with its source'],
    ],
    act: { label: 'Open Recurring & EMIs', action: 'goRecurring' },
    follow: subsOnly ? ['What do I pay every month?', 'How much do I pay in EMIs?'] : ['What are my subscriptions?', 'How much do I pay in EMIs?'],
  };
}

export function answer(q: string, ctx: AskCtx): AskAnswer {
  const t = ' ' + q.toLowerCase().replace(/[?!]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';

  const hm = t.match(/if i (?:spend|buy|pay)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(?:on|for)?\s*(.*)/);
  if (hm) {
    const amt = +hm[1].replace(/,/g, '');
    const fc = findCats(hm[2] || t);
    const cat: CatId = fc && fc.cats.length === 1 ? fc.cats[0] : fc ? fc.cats.find((c) => ctx.budgets[c]) || fc.cats[0] : 'SHOPPING';
    if (!ctx.budgets[cat]) {
      return {
        kind: 'hyp',
        head: 'No budget to compare',
        txt: `You haven't set a ${CAT[cat].label} budget yet, so there's nothing to compare ${fmt(amt)} against.`,
        act: { label: `Set a ${CAT[cat].label} budget`, action: 'editBudget', cat },
      };
    }
    const s = budgetStatus(ctx.tx, ctx.stmts, ctx.scope, ctx.budgets, cat);
    const after = s.spent + amt;
    const over = after - s.b;
    const mb = curMonth(ctx.stmts, ctx.scope);
    return {
      kind: 'hyp',
      head: over > 0 ? `Yes, by ${fmt(over)}` : `No, ${fmt(-over)} would be left`,
      txt: `${CAT[cat].label}: ${fmt(s.spent)} spent of ${fmt(s.b)}. Adding ${fmt(amt)} brings it to ${fmt(after)}. This isn't saved as an expense.`,
      rows: [
        ['Period', '1–' + mb.cov.getDate() + ' Oct 2026'],
        ['Source', sourceLabel(ctx.scope)],
        ['Calculation', `${fmt(s.spent)} + ${fmt(amt)} − ${fmt(s.b)}`],
      ],
      ev: mb.has ? expenses(ctx.tx, ctx.scope, mb.start, mb.cov, [cat]) : [],
      evTitle: `${CAT[cat].label}, October so far`,
    };
  }

  if (/balance|\bincome\b|salary|how much money do i have|net worth|\bcash\b/.test(t)) {
    return {
      kind: 'info',
      head: 'I can only see what you spend',
      txt: "These records are expenses, so I can't tell you your balance or available cash. Your bank statement shows salary credits, but not a reliable current balance.",
      follow: ['How much did I spend this month?', 'What do I pay every month?'],
    };
  }
  if (/\bemis?\b|\bloans?\b|instal+ments?/.test(t)) return emiAnswer(t, ctx);
  if (/subscription|recurring|repeat|every month|monthly (payments|bills|costs)|fixed (costs|payments)|committed/.test(t)) return recurAnswer(t, ctx);
  if (/still spend|\bleft\b|remaining|can i (still )?spend|how much more/.test(t)) return remainAnswer(t, ctx);

  const f = filt(t, ctx.tx);
  const p = parsePeriod(t);
  let a: AskAnswer;
  if (/compare|\bvs\b|versus|than (last|previous)|difference|increase|decrease|went up|go up|gone up/.test(t)) a = compareAnswer(t, f, p, ctx);
  else if (/biggest|largest|most expensive|highest|costliest|top \d+ (expenses|purchases|transactions)|big purchases/.test(t)) a = biggestAnswer(t, f, p, ctx);
  else if (/which day|what day|busiest day/.test(t)) a = dayAnswer(f, p, ctx);
  else if (/where|which categor|categories|breakdown|split|most on|the most|top (categor|merchant|shop)|merchants|shops/.test(t)) a = rankAnswer(f, p, ctx);
  else if (/how many|how often|number of|\btimes\b/.test(t)) a = countAnswer(f, p, ctx);
  else if (/average|\bavg\b|per day|daily|a day|per week|per month/.test(t)) a = avgAnswer(t, f, p, ctx);
  else if (/^ (show|list)|what did i (buy|spend)|transactions|orders|purchases/.test(t)) a = listAnswer(f, p, ctx);
  else if (/spend|spent|cost|expense|how much|total|\bpaid?\b|\bpay\b/.test(t) || f.mer || f.fc) a = totalAnswer(f, p, ctx);
  else
    return {
      kind: 'info',
      head: "I'm not sure what to work out",
      txt: 'Ask about totals, merchants, comparisons, your biggest expenses, budgets, EMIs or a possible purchase.',
      follow: ['How much did I spend on Swiggy this month?', 'Compare food with last month', 'What are my EMIs?'],
    };
  if (!a.follow && a.kind !== 'info') a.follow = follows(f, p, a.k || '');
  if (a.kind === 'info' && !a.follow) a.follow = follows(f, p, '');
  return a;
}
