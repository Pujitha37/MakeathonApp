// Month-end forecast, ported from finprofile.html's `forecast()`.

import { daysIn, pd } from './format';
import type { CatId } from '@/theme/tokens';
import type { Source, Stmt, Tx } from '@/data/types';
import { curMonth, expenses, sum } from './calc';

export type ForecastResult =
  | { ok: false; reason: string }
  | {
      ok: true;
      actual: number;
      projected: number;
      covDay: number;
      dim: number;
      series: number[];
      budget: number | null;
      list: Tx[];
    };

export function forecast(
  tx: Tx[],
  stmts: Stmt[],
  scope: Source,
  budgets: Partial<Record<CatId, number>>,
  cat: CatId | null,
): ForecastResult {
  const mb = curMonth(stmts, scope);
  const dim = daysIn(2026, 9);
  if (!mb.has) return { ok: false, reason: 'This source has no data for October yet.' };
  const covDay = mb.cov.getDate();
  if (covDay < 7) {
    return {
      ok: false,
      reason: `Only ${covDay} day${covDay > 1 ? 's' : ''} of October are covered. A forecast needs at least 7.`,
    };
  }
  const list = expenses(tx, scope, mb.start, mb.cov, cat ? [cat] : null);
  const actual = sum(list);
  const series: number[] = [];
  let running = 0;
  for (let d = 1; d <= covDay; d++) {
    running += sum(list.filter((t) => pd(t.date).getDate() === d));
    series.push(running);
  }
  const projected = (actual / covDay) * dim;
  const budget = cat ? budgets[cat] ?? null : null;
  return { ok: true, actual, projected, covDay, dim, series, budget, list };
}
