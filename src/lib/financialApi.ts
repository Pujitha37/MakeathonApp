// Financial Service API client — matches financial_api.md v1.
// All amounts are integer paise. INR only.
export const FIN_BASE = 'http://10.94.221.88:8002';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PiCategoryId =
  | 'food_dining' | 'groceries' | 'transport' | 'rent_utilities'
  | 'shopping' | 'health_fitness' | 'education' | 'entertainment'
  | 'subscriptions' | 'travel' | 'fees_charges' | 'other';

export type TxType = 'expense' | 'refund' | 'income' | 'transfer';
export type AccountType = 'bank' | 'credit_card' | 'cash';
export type TxSource = 'typed' | 'voice' | 'import';
export type CategoryOrigin = 'user' | 'rule' | 'llm' | 'fallback';
export type LoanKind = 'no_cost_emi' | 'loan_emi' | 'card_emi';
export type LoanSource = 'bank' | 'card';
export type ImportState =
  | 'queued' | 'extracting' | 'categorizing' | 'review_ready'
  | 'committing' | 'committed' | 'failed' | 'cancelled';
export type RowDecision = 'unresolved' | 'include' | 'exclude' | 'link_existing';
export type AdviceTone = 'good' | 'warn' | 'bad';
export type QuestionStatus = 'completed' | 'needs_clarification';

export interface HealthResponse {
  status: string;
  data_revision: number;
}

export interface Category {
  id: PiCategoryId;
  display_name: string;
  sort_order: number;
  seed_version: number;
}

export interface Account {
  id: string;
  display_name: string;
  type: AccountType;
  currency: 'INR';
  last4: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Transaction {
  id: string;
  account_id: string | null;
  merchant: string | null;
  merchant_key: string | null;
  description: string | null;
  amount_paise: number;
  currency: 'INR';
  posted_date: string;
  transaction_date: string | null;
  type: TxType;
  category_id: PiCategoryId | null;
  original_transaction_id: string | null;
  source: TxSource;
  source_import_id: string | null;
  category_origin: CategoryOrigin;
  needs_review: 0 | 1;
  revision: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TransactionsPage {
  items: Transaction[];
  next_cursor: string | null;
  data_revision: number;
}

export interface EntryDraft {
  draft_id: string;
  status: 'ready' | 'needs_input';
  source: 'typed' | 'voice';
  merchant: string | null;
  amount_paise: number | null;
  currency: 'INR';
  posted_date: string | null;
  type: TxType;
  category_id: PiCategoryId | null;
  category_origin: CategoryOrigin;
  account_id: string | null;
  needs_review: boolean;
  missing_fields: string[];
  warnings: string[];
}

export interface Budget {
  id: string;
  category_id: PiCategoryId;
  amount_paise: number;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetStatus {
  category_id: PiCategoryId;
  budget_paise: number;
  spent_paise: number;
  left_paise: number;
  usage_percent: string;
  per_day_paise: number;
}

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target_paise: number;
  start_date: string;
  due_date: string;
  archived: 0 | 1;
  revision: number;
  created_at: string;
  updated_at: string;
  saved_paise: number;
  progress_percent: string;
  on_track: boolean;
  need_per_month_paise: number;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount_paise: number;
  contributed_date: string;
  note: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  name: string;
  emoji: string;
  lender: string;
  kind: LoanKind;
  emi_paise: number;
  start_date: string;
  months: number;
  due_day: number;
  source: LoanSource;
  archived: 0 | 1;
  revision: number;
  created_at: string;
  updated_at: string;
  current_installment: number;
  paid_installments: number;
  done: boolean;
  remaining_paise: number;
  end_date: string;
}

export interface Recurring {
  merchant: string;
  merchant_key: string;
  category_id: PiCategoryId;
  amount_paise: number;
  typical_day: number;
  months_present: number;
}

export interface Advice {
  id: string;
  tone: AdviceTone;
  title: string;
  body: string;
  kind: string;
  category_id?: PiCategoryId;
  category_ids?: PiCategoryId[];
  goal_id?: string;
}

export interface Period {
  start_date: string;
  end_date_exclusive: string;
  as_of_date?: string;
  label?: string;
  gross_expense_paise?: number;
  refund_paise?: number;
  net_spending_paise?: number;
  income_paise?: number;
  expense_count?: number;
  matched_count?: number;
}

export interface CategoryBreakdown {
  category_id: PiCategoryId;
  gross_expense_paise: number;
  count: number;
}

export interface SummaryResponse {
  start_date: string;
  end_date_exclusive: string;
  gross_expense_paise: number;
  refund_paise: number;
  net_spending_paise: number;
  income_paise: number;
  expense_count: number;
  matched_count: number;
  category_breakdown: CategoryBreakdown[];
  review_count: number;
  data_revision: number;
}

export interface CategoryComparison {
  category_id: PiCategoryId;
  current_paise: number;
  previous_paise: number;
  delta_paise: number;
  change_percent: string | null;
}

export interface ComparisonsResponse {
  current_period: Period;
  previous_period: Period;
  delta_net_paise: number;
  change_percent: string | null;
  category_comparison?: CategoryComparison[];
}

export interface ForecastResponse {
  ok: boolean;
  reason?: string;
  category_id: PiCategoryId | null;
  actual_paise: number;
  projected_paise: number;
  elapsed_days: number;
  days_in_month: number;
  budget_paise: number | null;
  over_budget: boolean;
  expense_count: number;
  daily_spending: { posted_date: string; total_paise: number; count: number }[];
  calculation: string;
}

export interface AskAnswer {
  status: QuestionStatus;
  operation: string;
  answer?: string;
  clarification?: string;
  period?: Period;
  category_ids?: PiCategoryId[];
  merchant_text?: string;
  gross_expense_paise?: number;
  refund_paise?: number;
  net_spending_paise?: number;
  income_paise?: number;
  expense_count?: number;
  matched_count?: number;
  breakdown?: { category_id?: PiCategoryId; merchant?: string; gross_expense_paise: number; count: number }[];
  items?: Transaction[];
  day?: { posted_date: string; gross_expense_paise: number; count: number };
  count?: number;
  average_paise?: number;
  average_unit?: 'daily' | 'monthly';
  current_period?: Period;
  previous_period?: Period;
  delta_net_paise?: number;
  budget_paise?: number;
  spent_paise?: number;
  left_paise?: number;
  per_day_paise?: number;
  days_left?: number;
  loans?: { name: string; lender: string; kind: LoanKind; emi_paise: number; paid: number; total: number; remaining_paise: number }[];
  total_emi_paise?: number;
  total_remaining_paise?: number;
  recurring?: Recurring[];
  recurring_total_paise?: number;
  emi_total_paise?: number;
  grand_total_paise?: number;
  hypothetical_paise?: number;
  current_spent_paise?: number;
  after_paise?: number;
  over_budget?: boolean;
  over_by_paise?: number;
  total_count?: number;
}

export interface ImportObj {
  id: string;
  account_id: string;
  original_filename: string;
  sha256: string;
  size_bytes: number;
  state: ImportState;
  parser_id: string | null;
  parser_version: string | null;
  row_count: number;
  issue_count: number;
  error_code: string | null;
  created_at: string;
  committed_at: string | null;
}

export interface ImportRow {
  id: string;
  import_id: string;
  ordinal: number;
  raw_description: string;
  posted_date: string | null;
  amount_paise: number;
  currency: 'INR';
  type: TxType;
  reference: string | null;
  category_id: PiCategoryId | null;
  category_origin: CategoryOrigin | null;
  needs_review: 0 | 1;
  decision: RowDecision;
  duplicate_candidate_transaction_id: string | null;
  linked_transaction_id: string | null;
  source_locator: string;
  issue_codes: string[];
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

async function req<T>(path: string, opts?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 30000, ...rest } = opts ?? {};
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${FIN_BASE}${path}`, {
      ...rest,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(rest.headers ?? {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string | { code?: string } };
      const msg =
        typeof err.detail === 'string'
          ? err.detail
          : (err.detail && (err.detail as any).code) ?? `HTTP ${res.status}`;
      throw new Error(msg);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const financialApi = {
  // Health & categories
  health:      () => req<HealthResponse>('/health'),
  categories:  () => req<Category[]>('/categories'),

  // Accounts
  accounts:    (includeArchived = false) =>
                 req<Account[]>(`/accounts${includeArchived ? '?include_archived=true' : ''}`),
  account:     (id: string) => req<Account>(`/accounts/${id}`),
  createAccount: (body: { display_name: string; type: AccountType; last4?: string }) =>
                 req<Account>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
  patchAccount: (id: string, body: { expected_revision: number; display_name?: string; archived?: boolean }) =>
                 req<Account>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Transactions
  transactions: (q?: {
    start_date?: string;
    end_date_exclusive?: string;
    category_ids?: string;
    account_ids?: string;
    type?: TxType;
    needs_review?: boolean;
    limit?: number;
    cursor?: string;
  }) => {
    const p = new URLSearchParams();
    if (q) Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null) p.set(k, String(v)); });
    const qs = p.toString();
    return req<TransactionsPage>(`/transactions${qs ? '?' + qs : ''}`);
  },
  transaction: (id: string) => req<Transaction>(`/transactions/${id}`),
  createTransaction: (body: {
    merchant?: string;
    description?: string;
    amount_paise?: number;
    amount_text?: string;
    currency?: 'INR';
    posted_date: string;
    transaction_date?: string;
    type: TxType;
    category_id?: PiCategoryId | null;
    account_id?: string;
    original_transaction_id?: string;
    source?: 'typed' | 'voice';
    remember_category?: boolean;
  }) => req<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  patchTransaction: (id: string, body: Record<string, unknown> & { expected_revision: number }) =>
                 req<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTransaction: (id: string, expected_revision: number) =>
                 req<void>(`/transactions/${id}?expected_revision=${expected_revision}`, { method: 'DELETE' }),

  // Quick-add
  parseEntries: (text: string, source: 'typed' | 'voice' = 'typed', account_id?: string) =>
                 req<{ drafts: EntryDraft[] }>('/entries/parse', {
                   method: 'POST',
                   body: JSON.stringify({ text, source, account_id }),
                   timeoutMs: 60000,
                 }),

  // Ask engine
  ask: (text: string) => req<AskAnswer>('/questions', {
    method: 'POST',
    body: JSON.stringify({ text }),
    timeoutMs: 60000,
  }),

  // Analytics
  summary: (start_date: string, end_date_exclusive: string, account_ids?: string) => {
    const p = new URLSearchParams({ start_date, end_date_exclusive });
    if (account_ids) p.set('account_ids', account_ids);
    return req<SummaryResponse>(`/summary?${p.toString()}`);
  },
  comparisons: (q?: { category_ids?: string; account_ids?: string }) => {
    const p = new URLSearchParams();
    if (q?.category_ids) p.set('category_ids', q.category_ids);
    if (q?.account_ids) p.set('account_ids', q.account_ids);
    const qs = p.toString();
    return req<ComparisonsResponse>(`/comparisons${qs ? '?' + qs : ''}`);
  },
  forecast: (category_id?: PiCategoryId) =>
                 req<ForecastResponse>(`/forecast${category_id ? '?category_id=' + category_id : ''}`),

  // Budgets
  budgets:       () => req<Budget[]>('/budgets'),
  budgetsStatus: () => req<BudgetStatus[]>('/budgets/status'),
  putBudget:     (category_id: PiCategoryId, amount_paise: number) =>
                 req<Budget>(`/budgets/${category_id}`, { method: 'PUT', body: JSON.stringify({ amount_paise }) }),
  deleteBudget:  (category_id: PiCategoryId) =>
                 req<void>(`/budgets/${category_id}`, { method: 'DELETE' }),

  // Goals
  goals:         (includeArchived = false) =>
                 req<Goal[]>(`/goals${includeArchived ? '?include_archived=true' : ''}`),
  goal:          (id: string) => req<Goal>(`/goals/${id}`),
  createGoal:    (body: { name: string; emoji?: string; target_paise: number; start_date: string; due_date: string }) =>
                 req<Goal>('/goals', { method: 'POST', body: JSON.stringify(body) }),
  patchGoal:     (id: string, body: Record<string, unknown> & { expected_revision: number }) =>
                 req<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGoal:    (id: string) => req<void>(`/goals/${id}`, { method: 'DELETE' }),
  contributions: (goal_id: string) => req<GoalContribution[]>(`/goals/${goal_id}/contributions`),
  addContribution: (goal_id: string, body: { amount_paise: number; contributed_date: string; note?: string }) =>
                 req<GoalContribution>(`/goals/${goal_id}/contributions`, { method: 'POST', body: JSON.stringify(body) }),

  // Loans
  loans:         (includeArchived = false) =>
                 req<Loan[]>(`/loans${includeArchived ? '?include_archived=true' : ''}`),
  loan:          (id: string) => req<Loan>(`/loans/${id}`),
  createLoan:    (body: { name: string; emoji?: string; lender: string; kind: LoanKind; emi_paise: number; start_date: string; months: number; due_day: number; source: LoanSource }) =>
                 req<Loan>('/loans', { method: 'POST', body: JSON.stringify(body) }),
  patchLoan:     (id: string, body: Record<string, unknown> & { expected_revision: number }) =>
                 req<Loan>(`/loans/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteLoan:    (id: string) => req<void>(`/loans/${id}`, { method: 'DELETE' }),

  // Recurring
  recurring:     () => req<Recurring[]>('/recurring'),

  // Advice
  advice:        () => req<Advice[]>('/advice'),

  // Imports — multipart upload
  async uploadImport(account_id: string, file: { uri: string; name: string; type: string }) {
    const fd = new FormData();
    fd.append('account_id', account_id);
    // React Native FormData file shape
    fd.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    try {
      const res = await fetch(`${FIN_BASE}/imports`, { method: 'POST', body: fd as unknown as BodyInit, signal: ctrl.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: any };
        const detail = err.detail;
        throw new Error(typeof detail === 'string' ? detail : (detail?.code ?? `HTTP ${res.status}`));
      }
      return res.json() as Promise<ImportObj>;
    } finally {
      clearTimeout(timer);
    }
  },
  importObj:     (id: string) => req<ImportObj>(`/imports/${id}`),
  importRows:    (id: string) => req<ImportRow[]>(`/imports/${id}/rows`),
  patchImportRow: (import_id: string, row_id: string, body: Partial<Pick<ImportRow, 'decision' | 'linked_transaction_id' | 'category_id' | 'raw_description' | 'posted_date' | 'amount_paise' | 'type' | 'reference'>>) =>
                 req<ImportRow>(`/imports/${import_id}/rows/${row_id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  confirmImport: (id: string) => req<{ inserted: number; linked: number; excluded: number }>(`/imports/${id}/confirm`, { method: 'POST' }),
  cancelImport:  (id: string) => req<void>(`/imports/${id}`, { method: 'DELETE' }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const paiseToRupees = (p: number | null | undefined): number => Math.round((p ?? 0) / 100);
export const rupeesToPaise = (r: number): number => Math.round(r * 100);
export const fmtPaise = (p: number | null | undefined): string =>
  '₹' + Math.round((p ?? 0) / 100).toLocaleString('en-IN');
export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const monthStartISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
export const monthEndExclusiveISO = (): string => {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
};
export const addDaysISO = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
