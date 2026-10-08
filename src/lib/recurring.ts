// Recurring-payment detection + EMI schedule helpers, ported from finprofile.html.

import { fd, pd } from './format';
import { CAT, CatId } from '@/theme/tokens';
import type { Loan, Source, Stmt, Tx } from '@/data/types';
import { SHORT } from '@/data/types';
import { TODAY, instNo } from '@/data/seed';
import { coverageEnd } from './calc';

export type StatusTone = 'ok' | 'warn' | 'info' | 'bad';
export interface StatusBadge {
  s: StatusTone;
  l: string;
}

export function recStatus(stmts: Stmt[], src: Source, day: number, list: Tx[]): StatusBadge {
  const due = new Date(2026, 9, Math.min(day, 31));
  const oct = list.find((t) => t.date.startsWith('2026-10'));
  const cov = coverageEnd(stmts, src);
  if (oct) return { s: 'ok', l: 'Paid ' + fd(oct.date) };
  if (+due === +TODAY) return { s: 'warn', l: 'Due today' };
  if (due > TODAY) {
    const n = Math.round((+due - +TODAY) / 864e5);
    return { s: 'info', l: `Due in ${n} day${n > 1 ? 's' : ''}` };
  }
  if (+cov < +due) return { s: 'warn', l: 'Awaiting statement' };
  return { s: 'bad', l: 'Not found in statement' };
}

export interface LoanInfo {
  cur: number;
  paid: number;
  done: boolean;
  st: StatusBadge;
  remaining: number;
  end: Date;
  seen: number;
  list: Tx[];
}

export function loanInfo(tx: Tx[], stmts: Stmt[], L: Loan): LoanInfo {
  const cur = instNo(L, 2026, 9);
  const list = tx.filter((t) => t.loan === L.id).sort((a, b) => b.date.localeCompare(a.date));
  const done = cur > L.months;
  const st: StatusBadge = done
    ? { s: 'ok', l: 'Completed' }
    : cur < 1
      ? { s: 'info', l: 'Starts ' + fd(L.start) }
      : recStatus(stmts, L.source, L.dueDay, list);
  const paidOct = list.some((t) => t.date.startsWith('2026-10'));
  const paid = done ? L.months : Math.max(0, paidOct ? cur : cur - 1);
  const s0 = pd(L.start);
  const end = new Date(s0.getFullYear(), s0.getMonth() + L.months - 1, L.dueDay);
  return { cur, paid, done, st, remaining: (L.months - paid) * L.emi, end, seen: list.length, list };
}

export function activeLoans(tx: Tx[], stmts: Stmt[], loans: Loan[]) {
  return loans.map((L) => ({ L, s: loanInfo(tx, stmts, L) })).filter((x) => !x.s.done && x.s.cur >= 1);
}

export interface RecurEntry {
  key: string;
  merchant: string;
  cat: CatId;
  source: Source;
  amount: number;
  day: number;
  list: Tx[];
}

export function detectRecurring(tx: Tx[]): RecurEntry[] {
  const months = ['2026-07', '2026-08', '2026-09'];
  const g: Record<string, Tx[]> = {};
  tx.filter((t) => t.type === 'expense').forEach((t) => {
    const k = t.source + '|' + t.merchant;
    (g[k] = g[k] || []).push(t);
  });
  const recur: RecurEntry[] = [];
  for (const [k, list] of Object.entries(g)) {
    const per = months.map((mo) => list.filter((t) => t.date.startsWith(mo)));
    if (per.some((p) => p.length > 1)) continue;
    const hit = per.filter((p) => p.length === 1);
    if (hit.length < 2) continue;
    const amts = hit.map((p) => p[0].amount);
    const avg = amts.reduce((a, b) => a + b, 0) / amts.length;
    if ((Math.max(...amts) - Math.min(...amts)) / avg > 0.15) continue;
    const days = hit.map((p) => pd(p[0].date).getDate()).sort((a, b) => a - b);
    const sorted = list.slice().sort((a, b) => b.date.localeCompare(a.date));
    recur.push({
      key: k,
      merchant: sorted[0].merchant,
      cat: sorted[0].cat,
      source: sorted[0].source,
      amount: sorted[0].amount,
      day: days[Math.floor(days.length / 2)],
      list: sorted,
    });
  }
  recur.sort((a, b) => a.day - b.day);
  return recur;
}

export function isRec(recur: RecurEntry[], t: Tx): boolean {
  return t.type === 'expense' && recur.some((r) => r.key === t.source + '|' + t.merchant);
}

const SUBCATS: CatId[] = ['SUBSCRIPTIONS', 'FITNESS', 'ENTERTAINMENT'];
export { SUBCATS };

export interface ScheduleItem {
  day: number;
  name: string;
  sub: string;
  amt: number;
  emoji: string;
  st: StatusBadge;
  emi?: boolean;
}

export function scheduleItems(tx: Tx[], stmts: Stmt[], loans: Loan[], recur: RecurEntry[]): ScheduleItem[] {
  const fromLoans: ScheduleItem[] = activeLoans(tx, stmts, loans).map(({ L, s }) => ({
    day: L.dueDay,
    name: L.name,
    sub: `${L.kind}, ${L.lender}`,
    amt: L.emi,
    emoji: L.emoji,
    st: s.st,
    emi: true,
  }));
  const fromRecur: ScheduleItem[] = recur.map((r) => ({
    day: r.day,
    name: r.merchant,
    sub: `${CAT[r.cat].label}, ${SHORT[r.source]}`,
    amt: r.amount,
    emoji: CAT[r.cat].emoji,
    st: recStatus(stmts, r.source, r.day, r.list),
  }));
  return [...fromLoans, ...fromRecur].sort((a, b) => a.day - b.day);
}
