import type { CatId } from '@/theme/tokens';

export type Source = 'manual' | 'bank' | 'card';
export type TxType = 'expense' | 'income' | 'transfer' | 'emi';

export interface Tx {
  id: number;
  date: string; // yyyy-mm-dd
  amount: number;
  merchant: string;
  cat: CatId;
  source: Source;
  type: TxType;
  stmt: string | null;
  loan?: string;
  inst?: number;
}

export interface Loan {
  id: string;
  name: string;
  kind: string; // 'No-cost EMI' | 'Loan EMI' | 'Card EMI'
  lender: string;
  emoji: string;
  emi: number;
  start: string; // yyyy-mm-dd
  months: number;
  dueDay: number;
  source: Source;
}

export interface Stmt {
  id: string;
  source: Source;
  name: string;
  from: string;
  to: string;
  imported: string;
}

export interface Goal {
  id: number;
  name: string;
  emoji: string;
  target: number;
  start: string;
  due: string;
  contrib: [string, number][];
}

export interface SourceMeta {
  label: string;
  ico: string;
  desc: string;
}

export const SOURCES: Record<Source, SourceMeta> = {
  manual: { label: 'Quick Add', ico: '✍️', desc: 'Expenses you said or typed' },
  bank: { label: 'Bank statement', ico: '🏦', desc: 'Savings account ••4821' },
  card: { label: 'Credit card statement', ico: '💳', desc: 'Credit card ••9034' },
};

export const SHORT: Record<Source, string> = { manual: 'Quick Add', bank: 'Bank', card: 'Card' };
