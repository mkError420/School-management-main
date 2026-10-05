export type StaffType = 'TEACHING' | 'NON_TEACHING' | 'ADMINISTRATIVE' | 'SUPPORT';
export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
export type StaffGender = 'MALE' | 'FEMALE';

export interface StaffMember {
  id: string;
  staff_no: string;
  teacher_id?: string | null;
  admin_id?: string | null;
  name: string;
  surname: string;
  email?: string;
  phone?: string;
  type: StaffType;
  designation: string;
  department: string;
  gender: StaffGender;
  blood_type?: string;
  address?: string;
  salary: number;
  joining_date?: string;
  status: StaffStatus;
  qualification?: string;
  img?: string;
  notes?: string;
  subjects?: Array<{ id: number; name: string }>;
  classes?: Array<{ id: number; name: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface StaffStats {
  total_staff: number;
  teaching_count: number;
  non_teaching_count: number;
  administrative_count: number;
  support_count: number;
  active_count: number;
  on_leave_count: number;
  total_monthly_payroll: number;
}
