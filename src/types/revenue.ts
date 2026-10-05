export type RevenueStatus = 'surplus' | 'deficit' | 'balanced';

export interface RevenueMonthData {
  name: string;
  month: number;
  income: number;
  expense: number;
  net: number;
  margin: number;
}

export interface RevenueCategoryBreakdown {
  id?: number | string;
  category?: string;
  name: string;
  code?: string;
  amount: number;
  billed?: number;
  count: number;
  percentage: number;
  color?: string;
}

export interface RevenueSummaryMetrics {
  total_income: number;
  total_billed: number;
  total_pending_fees: number;
  collection_rate: number;
  total_expenses: number;
  paid_expenses: number;
  pending_expenses: number;
  approved_expenses: number;
  net_revenue: number;
  profit_margin: number;
  status: RevenueStatus;
  payments_count: number;
  expenses_count: number;
}

export interface RevenueTransactionItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  title: string;
  ref_no: string;
  category: string;
  amount: number;
  date: string;
  payment_method: string;
  party: string;
  status: string;
  notes?: string;
}

export interface RevenueAnalyticsData {
  year: number;
  start_date?: string | null;
  end_date?: string | null;
  available_years: number[];
  summary: RevenueSummaryMetrics;
  chart: RevenueMonthData[];
  fee_categories: RevenueCategoryBreakdown[];
  expense_categories: RevenueCategoryBreakdown[];
  recent_transactions: RevenueTransactionItem[];
}
