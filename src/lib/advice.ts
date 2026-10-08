// Advice rules, ported from finprofile.html's `adviceList()`.

import { fd, fmt } from './format';
import { CAT, CatId } from '@/theme/tokens';
import type { Goal, Source, Stmt, Tx } from '@/data/types';
import { SHORT } from '@/data/types';
import { budgetStatus, coverageEnd, curMonth, expenses, goalStatus, sum } from './calc';
import { forecast } from './forecast';

export type AdviceTone = 'warn' | 'bad' | 'good';
export type AdviceLink = 'forecast' | 'plan';

export interface AdviceItem {
  id: string;
  tone: AdviceTone;
  cat?: CatId;
  title: string;
  body: string;
  why: string;
  ev: Tx[] | null;
  link?: AdviceLink;
}

export function adviceList(
  tx: Tx[],
  stmts: Stmt[],
  scope: Source,
  budgets: Partial<Record<CatId, number>>,
  goals: Goal[],
  dismissed: Record<string, boolean>,
): AdviceItem[] {
  const out: AdviceItem[] = [];
  const mb = curMonth(stmts, scope);

  (Object.keys(budgets) as CatId[]).forEach((cat) => {
    const s = budgetStatus(tx, stmts, scope, budgets, cat);
    if (!s.has) return;
    const f = forecast(tx, stmts, scope, budgets, cat);
    if (s.pct >= 0.75) {
      out.push({
        id: 'use-' + cat,
        tone: s.pct >= 1 ? 'bad' : 'warn',
        cat,
        title: `${CAT[cat].label}: ${Math.round(s.pct * 100)}% of budget used`,
        body: `${fmt(s.spent)} of ${fmt(s.b)} spent, with ${s.daysLeft} days left in October.`,
        why: `Shown when spending in a budgeted category reaches 75% of its monthly limit. Source: ${SHORT[scope]}, 1–${mb.cov.getDate()} Oct.`,
        ev: expenses(tx, scope, mb.start, mb.cov, [cat]),
      });
    } else if (f.ok && f.budget && f.projected > f.budget) {
      out.push({
        id: 'fc-' + cat,
        tone: 'warn',
        cat,
        title: `${CAT[cat].label} may go over budget`,
        body: `At this pace you'd reach about ${fmt(f.projected)} by 31 Oct, around ${fmt(f.projected - f.budget)} above your ${fmt(f.budget)} limit.`,
        why: `Estimate: ${fmt(f.actual)} ÷ ${f.covDay} days × ${f.dim} days. It assumes the same daily pace continues. Source: ${SHORT[scope]}.`,
        ev: f.list,
        link: 'forecast',
      });
    }
  });

  // same point last month
  if (mb.has) {
    const d = mb.cov.getDate();
    const pS = new Date(2026, 8, 1);
    const pE = new Date(2026, 8, d);
    if (+coverageEnd(stmts, scope) >= +pE) {
      const groups: [string, CatId[]][] = [
        ['Food', ['FOOD_GROCERIES', 'DINING_DELIVERY']],
        ['Transport', ['TRANSPORT']],
        ['Entertainment', ['ENTERTAINMENT']],
      ];
      groups.forEach(([name, cats]) => {
        const now = sum(expenses(tx, scope, mb.start, mb.cov, cats));
        const then = sum(expenses(tx, scope, pS, pE, cats));
        if (then > 0 && now - then >= 500 && now / then >= 1.25) {
          out.push({
            id: 'cmp-' + name,
            tone: 'warn',
            title: `${name} spending is ${fmt(now - then)} higher than this time last month`,
            body: `${fmt(now)} so far (1–${d} Oct) versus ${fmt(then)} for 1–${d} Sep.`,
            why: `Compares the same days of each month from the same source (${SHORT[scope]}). Shown when the increase is at least ₹500 and 25%.${cats.length > 1 ? ' "Food" here means Food & Groceries plus Dining & Delivery.' : ''}`,
            ev: expenses(tx, scope, mb.start, mb.cov, cats),
          });
        }
      });
    }
  }

  goals.forEach((g) => {
    const s = goalStatus(g);
    if (!s.on) {
      out.push({
        id: 'goal-' + g.id,
        tone: 'warn',
        title: `${g.name} is a little behind`,
        body: `${fmt(s.saved)} saved so far. Setting aside about ${fmt(s.need)} a month would reach ${fmt(g.target)} by ${fd(g.due)}.`,
        why: `Based only on contributions you recorded, compared with an even pace from ${fd(g.start)} to ${fd(g.due)}.`,
        ev: null,
        link: 'plan',
      });
    } else if (s.pct > 0) {
      out.push({
        id: 'goalok-' + g.id,
        tone: 'good',
        title: `${g.name} is on track`,
        body: `${fmt(s.saved)} of ${fmt(g.target)} saved, ahead of the pace needed for ${fd(g.due)}.`,
        why: `Based on your recorded contributions compared with an even pace to the target date.`,
        ev: null,
        link: 'plan',
      });
    }
  });

  return out.filter((a) => !dismissed[a.id]);
}
