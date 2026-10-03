export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
export type ExpenseCategory = 'SALARY' | 'UTILITIES' | 'MAINTENANCE' | 'SUPPLIES' | 'TRANSPORT' | 'MARKETING' | 'EVENTS' | 'OTHER';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_BANKING' | 'CHEQUE' | 'OTHER';

export interface Expense {
  id: number;
  expense_no: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  status: ExpenseStatus;
  payment_method: PaymentMethod;
  vendor?: string;
  expense_date: string;
  due_date?: string;
  paid_date?: string;
  transaction_ref?: string;
  receipt_url?: string;
  notes?: string;
  created_by?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseStats {
  total_expenses: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  rejected_amount: number;
  total_count: number;
  pending_count: number;
  approved_count: number;
  paid_count: number;
  rejected_count: number;
  current_month_total: number;
  current_year_total: number;
}
