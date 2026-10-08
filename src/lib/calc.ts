// Core calculations ported from finprofile.html, parameterized (no reliance on a global `S`/`TX`)
// so they work cleanly against React state. Pass in the current tx list / stmts / scope / budgets.

import { daysIn, fd as fdShort, iso, minD, pd } from './format';
import type { CatId } from '@/theme/tokens';
import type { Source, Stmt, Tx, Goal } from '@/data/types';
import { TODAY } from '@/data/seed';

export const sum = (arr: Tx[]): number => arr.reduce((s, t) => s + t.amount, 0);

export function coverageEnd(stmts: Stmt[], src: Source): Date {
  if (src === 'manual') return TODAY;
  const st = stmts.filter((s) => s.source === src);
  return st.length ? pd(st.map((s) => s.to).sort().pop()!) : new Date(2000, 0, 1);
}

export function scopeFresh(stmts: Stmt[], src: Source): string {
  if (src === 'manual') return 'up to date';
  return 'through ' + fdShort(coverageEnd(stmts, src));
}

export function expenses(
  tx: Tx[],
  src: Source,
  from: Date,
  to: Date,
  cats?: CatId[] | null,
): Tx[] {
  const a = iso(from);
  const b = iso(to);
  return tx
    .filter((t) => t.type === 'expense' && t.source === src && t.date >= a && t.date <= b && (!cats || cats.includes(t.cat)))
    .sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);
}

export interface MonthBounds {
  start: Date;
  end: Date;
  cov: Date;
  has: boolean;
  complete: boolean;
}

export function monthBounds(stmts: Stmt[], scope: Source, y: number, m: number): MonthBounds {
  const start = new Date(y, m, 1);
  const end = new Date(y, m, daysIn(y, m));
  const cov = minD(end, coverageEnd(stmts, scope), TODAY);
  return { start, end, cov, has: cov >= start, complete: cov >= end };
}

export function curMonth(stmts: Stmt[], scope: Source): MonthBounds {
  return monthBounds(stmts, scope, 2026, 9);
}

export function byCat(list: Tx[]): [CatId, number][] {
  const o: Partial<Record<CatId, number>> = {};
  list.forEach((t) => (o[t.cat] = (o[t.cat] || 0) + t.amount));
  return (Object.entries(o) as [CatId, number][]).sort((a, b) => b[1] - a[1]);
}

export interface BudgetStatus {
  b: number;
  spent: number;
  left: number;
  pct: number;
  daysLeft: number;
  perDay: number;
  has: boolean;
}

export function budgetStatus(
  tx: Tx[],
  stmts: Stmt[],
  scope: Source,
  budgets: Partial<Record<CatId, number>>,
  cat: CatId,
): BudgetStatus {
  const b = budgets[cat] ?? 0;
  const mb = curMonth(stmts, scope);
  const spent = mb.has ? sum(expenses(tx, scope, mb.start, mb.cov, [cat])) : 0;
  const left = b - spent;
  const daysLeft = daysIn(2026, 9) - TODAY.getDate() + 1;
  return { b, spent, left, pct: b ? spent / b : 0, daysLeft, perDay: Math.max(0, left) / daysLeft, has: mb.has };
}

export interface GoalStatus {
  saved: number;
  expected: number;
  pct: number;
  on: boolean;
  need: number;
  monthsLeft: number;
}

export function goalStatus(g: Goal): GoalStatus {
  const saved = g.contrib.reduce((s, c) => s + c[1], 0);
  const st = pd(g.start);
  const du = pd(g.due);
  const total = +du - +st;
  const el = Math.max(0, +TODAY - +st);
  const expected = g.target * Math.min(1, total ? el / total : 0);
  const monthsLeft = Math.max(1, (du.getFullYear() - TODAY.getFullYear()) * 12 + du.getMonth() - TODAY.getMonth());
  const need = Math.max(0, g.target - saved) / monthsLeft;
  return { saved, expected, pct: g.target ? saved / g.target : 0, on: saved >= expected * 0.95, need, monthsLeft };
}

export interface SuggestResult {
  avg: number;
  months: string[];
  totals: number[];
}

export interface InsightsRange {
  start: Date;
  end: Date;
  cov: Date;
  has: boolean;
  label: string;
}

export function insightsRange(stmts: Stmt[], scope: Source, period: 'this' | 'last' | '3m'): InsightsRange {
  if (period === 'this') return { ...monthBounds(stmts, scope, 2026, 9), label: 'This month' };
  if (period === 'last') return { ...monthBounds(stmts, scope, 2026, 8), label: 'September' };
  const a = monthBounds(stmts, scope, 2026, 6);
  const c = monthBounds(stmts, scope, 2026, 8);
  return {
    start: a.start,
    end: c.end,
    cov: minD(c.end, coverageEnd(stmts, scope), TODAY),
    has: +coverageEnd(stmts, scope) >= +a.start,
    label: 'Jul–Sep',
  };
}

export function suggestFor(tx: Tx[], stmts: Stmt[], scope: Source, cat: CatId): SuggestResult | null {
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = [6, 7, 8].map((m) => ({ m, b: monthBounds(stmts, scope, 2026, m) })).filter((x) => x.b.complete);
  if (months.length < 2) return null;
  const totals = months.map((x) => sum(expenses(tx, scope, x.b.start, x.b.end, [cat])));
  if (totals.every((v) => v === 0)) return null;
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  return { avg: Math.round(avg / 100) * 100, months: months.map((x) => MON[x.m]), totals };
}
