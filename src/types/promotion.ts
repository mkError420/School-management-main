export type PromotionStatus = 'PROMOTED' | 'RETAINED' | 'PASSED_OUT' | 'TRANSFERRED';

export interface StudentSessionHistory {
  id: number;
  student_id: string;
  session_year: string;
  class_id: number;
  class_name: string;
  grade_id?: number | null;
  grade_level?: number | null;
  section?: string | null;
  roll?: string | null;
  version?: string | null;
  shift?: string | null;
  promotion_status: PromotionStatus;
  gpa?: number | null;
  total_marks?: number | null;
  grade_letter?: string | null;
  merit_position?: number | null;
  attendance_total_days: number;
  attendance_present_days: number;
  attendance_rate: number;
  fee_billed: number;
  fee_paid: number;
  fee_due: number;
  fee_clearance_status: 'CLEARED' | 'DUE';
  next_session_year?: string | null;
  next_class_id?: number | null;
  next_class_name?: string | null;
  next_roll?: string | null;
  remarks?: string | null;
  promoted_by?: string | null;
  promoted_at: string;
}

export interface PromotionCandidate {
  student_id: string;
  name: string;
  surname?: string;
  current_session: string;
  current_class_id: number;
  current_class_name?: string;
  current_roll?: string;
  version?: string;
  gpa?: number | null;
  total_marks?: number | null;
  grade_letter?: string | null;
  merit_position?: number | null;
  fee_due?: number;
  attendance_rate?: number;
  target_session: string;
  target_class_id: number;
  target_roll?: string;
  promotion_status: PromotionStatus;
  remarks?: string;
}

export interface PromotionPayload {
  students?: Array<{
    student_id: string;
    completed_session?: string;
    target_session?: string;
    target_class_id?: number;
    target_roll?: string;
    promotion_status?: PromotionStatus;
    gpa?: number | null;
    total_marks?: number | null;
    grade_letter?: string | null;
    merit_position?: number | null;
    remarks?: string;
    section?: string;
  }>;
  student_id?: string;
  completed_session?: string;
  target_session: string;
  target_class_id?: number;
  target_roll?: string;
  promotion_status?: PromotionStatus;
  gpa?: number | null;
  total_marks?: number | null;
  grade_letter?: string | null;
  merit_position?: number | null;
  remarks?: string;
  create_session_fee?: boolean;
  session_fee_amount?: number;
  session_fee_title?: string;
}

export interface PromotionsSummary {
  active_session: string;
  total_students: number;
  total_records: number;
  total_promoted: number;
  total_retained: number;
  total_graduated: number;
  total_transferred: number;
  available_sessions: string[];
}

