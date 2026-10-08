// Global app state, ported from the prototype's `S` object (route lives in Expo Router instead).
import { create } from 'zustand';
import type { CatId } from '@/theme/tokens';
import type { Goal, Loan, Source, Stmt, Tx } from '@/data/types';
import { LOANS, SEED_BUDGETS, SEED_GOALS, SEED_TX, STMTS, TODAY, bumpTxId, instNo } from '@/data/seed';
import { iso } from '@/lib/format';

export type PlanTab = 'budgets' | 'goals';
export type ActTab = 'manual' | 'statements' | 'recurring';
export type InsPeriod = 'this' | 'last' | '3m';
export type TrendMode = 'weekly' | 'monthly';
export type StmtSrc = 'bank' | 'card';

interface AppState {
  // data (mutable copies of the seed)
  tx: Tx[];
  loans: Loan[];
  stmts: Stmt[];
  goals: Goal[];
  budgets: Partial<Record<CatId, number>>;
  dismissed: Record<string, boolean>;

  // ui / navigation-adjacent state
  scope: Source;
  month: { y: number; m: number };
  insPeriod: InsPeriod;
  trend: TrendMode;
  selCat: CatId | null;
  planTab: PlanTab;
  actTab: ActTab;
  stmtSrc: StmtSrc;
  perDay: boolean;
  fcCat: CatId;
  openWhy: string | null;
  openStmt: string | null;
  muted: boolean;
  offline: boolean;
  listening: boolean;
  theme: 'light' | 'dark' | null; // null = follow system
  focusQuickAddSignal: number; // bumped to tell the Home screen to focus its quick-add input

  // actions
  setScope: (s: Source) => void;
  setMonth: (d: -1 | 1) => void;
  setInsPeriod: (p: InsPeriod) => void;
  setTrend: (t: TrendMode) => void;
  setSelCat: (c: CatId | null) => void;
  setPlanTab: (t: PlanTab) => void;
  setActTab: (t: ActTab) => void;
  setStmtSrc: (s: StmtSrc) => void;
  togglePerDay: () => void;
  setFcCat: (c: CatId) => void;
  setOpenWhy: (id: string | null) => void;
  setOpenStmt: (id: string | null) => void;
  toggleMuted: () => void;
  toggleOffline: () => void;
  setListening: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark' | null) => void;

  addExpense: (amount: number, merchant: string, cat: CatId, date: string) => Tx;
  undoTx: (id: number) => void;
  setTxCat: (id: number, cat: CatId) => void;
  setBudget: (cat: CatId, value: number) => void;
  removeBudget: (cat: CatId) => void;
  addGoal: (g: Omit<Goal, 'id' | 'contrib'>) => void;
  addContribution: (goalId: number, amount: number, date: string) => void;
  dismissAdvice: (id: string) => void;
  undismissAdvice: (id: string) => void;
  resetDismissed: () => void;
  addEmi: (loan: Omit<Loan, 'id'>) => void;
  importBankOct: () => void;
  requestQuickAddFocus: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  tx: [...SEED_TX],
  loans: [...LOANS],
  stmts: [...STMTS],
  goals: [...SEED_GOALS],
  budgets: { ...SEED_BUDGETS },
  dismissed: {},

  scope: 'manual',
  month: { y: 2026, m: 9 },
  insPeriod: 'this',
  trend: 'weekly',
  selCat: null,
  planTab: 'budgets',
  actTab: 'manual',
  stmtSrc: 'bank',
  perDay: true,
  fcCat: 'DINING_DELIVERY',
  openWhy: null,
  openStmt: null,
  muted: false,
  offline: false,
  listening: false,
  theme: null,
  focusQuickAddSignal: 0,

  setScope: (s) => set({ scope: s, selCat: null }),
  setMonth: (d) => set((st) => ({ month: { y: st.month.y, m: st.month.m + d } })),
  setInsPeriod: (p) => set({ insPeriod: p, selCat: null }),
  setTrend: (t) => set({ trend: t }),
  setSelCat: (c) => set((st) => ({ selCat: st.selCat === c ? null : c })),
  setPlanTab: (t) => set({ planTab: t }),
  setActTab: (t) => set({ actTab: t, openStmt: null }),
  setStmtSrc: (s) => set({ stmtSrc: s, openStmt: null }),
  togglePerDay: () => set((st) => ({ perDay: !st.perDay })),
  setFcCat: (c) => set({ fcCat: c }),
  setOpenWhy: (id) => set((st) => ({ openWhy: st.openWhy === id ? null : id })),
  setOpenStmt: (id) => set((st) => ({ openStmt: st.openStmt === id ? null : id })),
  toggleMuted: () => set((st) => ({ muted: !st.muted })),
  toggleOffline: () => set((st) => ({ offline: !st.offline })),
  setListening: (v) => set({ listening: v }),
  setTheme: (t) => set({ theme: t }),

  addExpense: (amount, merchant, cat, date) => {
    const t: Tx = { id: bumpTxId(), date, amount, merchant, cat, source: 'manual', type: 'expense', stmt: null };
    set((st) => ({ tx: [...st.tx, t] }));
    return t;
  },
  undoTx: (id) => set((st) => ({ tx: st.tx.filter((t) => t.id !== id) })),
  setTxCat: (id, cat) => set((st) => ({ tx: st.tx.map((t) => (t.id === id ? { ...t, cat } : t)) })),

  setBudget: (cat, value) => set((st) => ({ budgets: { ...st.budgets, [cat]: value } })),
  removeBudget: (cat) =>
    set((st) => {
      const b = { ...st.budgets };
      delete b[cat];
      return { budgets: b };
    }),

  addGoal: (g) =>
    set((st) => ({ goals: [...st.goals, { ...g, id: Date.now(), contrib: [] }] })),
  addContribution: (goalId, amount, date) =>
    set((st) => ({
      goals: st.goals.map((g) => (g.id === goalId ? { ...g, contrib: [...g.contrib, [date, amount]] } : g)),
    })),

  dismissAdvice: (id) => set((st) => ({ dismissed: { ...st.dismissed, [id]: true } })),
  undismissAdvice: (id) =>
    set((st) => {
      const d = { ...st.dismissed };
      delete d[id];
      return { dismissed: d };
    }),
  resetDismissed: () => set({ dismissed: {} }),

  addEmi: (loan) => set((st) => ({ loans: [...st.loans, { ...loan, id: 'L' + Date.now() }] })),

  requestQuickAddFocus: () => set((st) => ({ focusQuickAddSignal: st.focusQuickAddSignal + 1 })),

  importBankOct: () => {
    const st = get();
    if (st.stmts.some((s) => s.id === 'b-oct')) return;
    // Mirrors the prototype's sample "1–5 Oct" bank import: salary/rent, a couple of bills,
    // and EMI rows for any bank loan whose due day falls in 1–5 and matches its installment #.
    const y = 2026, m = 9;
    const rows: Tx[] = [];
    let id = Math.max(0, ...st.tx.map((t) => t.id)) + 1;
    const push = (date: string, amount: number, merchant: string, cat: CatId, type: Tx['type'] = 'expense') => {
      rows.push({ id: id++, date, amount, merchant, cat, source: 'bank', type, stmt: 'b-oct' });
    };
    push(iso(new Date(y, m, 1)), 85000, 'Salary credit', 'OTHER', 'income');
    push(iso(new Date(y, m, 1)), 18000, 'Rent to landlord', 'HOUSING');
    st.loans
      .filter((L) => L.source === 'bank')
      .forEach((L) => {
        const n = instNo(L, y, m);
        if (n >= 1 && n <= L.months && L.dueDay >= 1 && L.dueDay <= 5) {
          const t: Tx = { id: id++, date: iso(new Date(y, m, L.dueDay)), amount: L.emi, merchant: `${L.lender} EMI`, cat: 'OTHER', source: 'bank', type: 'emi', stmt: 'b-oct', loan: L.id, inst: n };
          rows.push(t);
        }
      });
    set({
      tx: [...st.tx, ...rows],
      stmts: [...st.stmts, { id: 'b-oct', source: 'bank', name: 'Savings ••4821', from: '2026-10-01', to: '2026-10-05', imported: iso(TODAY) }],
    });
  },
}));
