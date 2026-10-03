export type FeeStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE';
export type FeeFrequency = 'ONE_TIME' | 'MONTHLY' | 'TERMLY' | 'ANNUALLY';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE_BANKING' | 'CHEQUE' | 'OTHER';

export interface FeeCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_amount: number;
  frequency: FeeFrequency;
  status: 'ACTIVE' | 'INACTIVE';
  total_invoices?: number;
  total_revenue?: number;
  created_at?: string;
}

export interface FeeInvoice {
  id: number;
  invoice_no: string;
  student_id: string;
  fee_category_id: number;
  title: string;
  due_date: string;
  amount: number;
  discount: number;
  paid_amount: number;
  net_amount?: number;
  due_amount?: number;
  status: FeeStatus;
  academic_year: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  student_name?: string;
  student_surname?: string;
  student_email?: string;
  student_phone?: string;
  student_img?: string;
  class_name?: string;
  grade_level?: number;
  category_name?: string;
  category_code?: string;
}

export interface FeePayment {
  id: number;
  receipt_no: string;
  invoice_id: number;
  student_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref?: string;
  payment_date: string;
  notes?: string;
  created_at?: string;

  // Joined fields
  invoice_no?: string;
  invoice_title?: string;
  category_name?: string;
  student_name?: string;
  student_surname?: string;
  student_img?: string;
  class_name?: string;
}

export interface FeeStats {
  total_billed: number;
  total_collected: number;
  total_due: number;
  total_overdue: number;
  total_invoices: number;
  paid_count: number;
  partial_count: number;
  unpaid_count: number;
  overdue_count: number;
  collection_rate: number;
}

export interface FeeReceiptData extends FeePayment {
  invoice_amount?: number;
  discount?: number;
  total_paid?: number;
  net_amount?: number;
  remaining_due?: number;
  due_date?: string;
  academic_year?: string;
  student_code?: string;
  student_email?: string;
  student_phone?: string;
  student_address?: string;
  grade_level?: number;
  parent_name?: string;
  parent_surname?: string;
  parent_phone?: string;
  site_name?: string;
}
