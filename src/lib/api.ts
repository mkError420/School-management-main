// API Client for PHP Backend & MySQL Database
import type { SchoolWebsiteContent } from "@/types/site";

const API_BASE_URL = import.meta.env.VITE_API_URL || '/backend/api';

export interface UserSession {
  id: string;
  username: string;
  name?: string;
  role: 'admin' | 'super_admin' | 'teacher' | 'student' | 'parent';
  token: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('school_jwt_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('school_jwt_token', token);
    } else {
      localStorage.removeItem('school_jwt_token');
    }
  }

  public getToken(): string | null {
    return this.token || localStorage.getItem('school_jwt_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
    const url = `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
    
    const headers: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const responseText = await response.text();
      let json: { success: boolean; data?: T; message?: string };
      try {
        json = JSON.parse(responseText);
      } catch {
        const message = responseText.trim();
        return {
          success: false,
          message: message && !message.startsWith('<')
            ? message.slice(0, 240)
            : `The server returned an invalid response (HTTP ${response.status}). Check the PHP error log.`,
        };
      }

      if (!response.ok && json.success !== false) {
        return { success: false, message: json.message || `Request failed (HTTP ${response.status}).` };
      }
      return json;
    } catch (err: any) {
      console.warn(`API fetch error for ${url}:`, err.message);
      return { success: false, message: err.message };
    }
  }

  // Authentication
  async login(credentials: { username: string; password: string; role?: string }) {
    return this.request('auth?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request('auth?action=me', { method: 'GET' });
  }

  async changePassword(credentials: { current_password: string; new_password: string }) {
    return this.request('auth?action=change-password', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getSiteSettings() {
    return this.request<{
      site_name: string;
      site_logo?: string;
      website_content?: SchoolWebsiteContent | null;
      live_counts?: {
        students: number;
        teachers: number;
        staff: number;
        classes?: number;
      };
    }>('settings', { method: 'GET' });
  }

  // Public School Statistics
  async getPublicStats() {
    return this.request<{
      counts: {
        students: number;
        teachers: number;
        staff: number;
        classes?: number;
        parents?: number;
      };
    }>('dashboard?action=public-stats', { method: 'GET' });
  }

  // Public Staff & Faculty Directory
  async getPublicStaffDirectory() {
    return this.request<{
      staff: Array<{
        id: string;
        staff_no: string;
        teacher_id?: string | null;
        name: string;
        surname?: string;
        email?: string;
        phone?: string;
        type: 'TEACHING' | 'NON_TEACHING' | 'ADMINISTRATIVE' | 'SUPPORT';
        designation: string;
        department: string;
        gender?: string;
        qualification?: string;
        img?: string;
        subjects_list?: string;
      }>;
      total: number;
    }>('staff?action=public-directory', { method: 'GET' });
  }

  async updateSiteName(siteName: string) {
    return this.request<{ site_name: string; site_logo?: string; website_content?: SchoolWebsiteContent | null }>('settings', {
      method: 'PUT',
      body: JSON.stringify({ site_name: siteName }),
    });
  }

  async updateWebsiteContent(websiteContent: SchoolWebsiteContent) {
    return this.request<{ website_content: SchoolWebsiteContent }>('settings', {
      method: 'PUT',
      body: JSON.stringify({ website_content: websiteContent }),
    });
  }

  async updateSiteLogo(siteLogo: string) {
    return this.request<{ site_name?: string; site_logo: string }>('settings', {
      method: 'PUT',
      body: JSON.stringify({ site_logo: siteLogo }),
    });
  }

  async uploadSiteLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);
    return this.request<{ site_logo: string }>('settings?action=upload-logo', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadNoticeFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ file_url: string; original_name?: string }>('settings?action=upload-notice-file', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadDownloadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ file_url: string; original_name?: string }>('settings?action=upload-download-file', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ file_url: string; original_name?: string }>('settings?action=upload-file', {
      method: 'POST',
      body: formData,
    });
  }

  // Dashboard Metrics
  async getDashboard(params?: { finance_year?: number | string }) {
    const qs = params?.finance_year ? `?finance_year=${params.finance_year}` : '';
    return this.request(`dashboard${qs}`, { method: 'GET' });
  }

  // Attendance Weekly Metrics
  async getAttendanceChartData() {
    return this.request('dashboard?action=attendance', { method: 'GET' });
  }

  // Finance Metrics (Fees as Income, Expenses as Expense)
  async getFinanceChartData(year?: number | string) {
    const qs = year ? `&year=${encodeURIComponent(String(year))}` : '';
    return this.request(`dashboard?action=finance${qs}`, { method: 'GET' });
  }

  // Generic CRUD
  async getAll(resource: string, params: Record<string, string | number> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString();
    const endpoint = qs ? `${resource}?${qs}` : resource;
    return this.request(endpoint, { method: 'GET' });
  }

  async getById<T = any>(resource: string, id: string | number): Promise<{ success: boolean; data?: T; message?: string }> {
    return this.request<T>(`${resource}?id=${id}`, { method: 'GET' });
  }

  async create(resource: string, data: any) {
    return this.request(resource, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async update(resource: string, id: string | number, data: any) {
    // PHP only populates $_POST and $_FILES for POST requests, not PUT.
    // When sending FormData (which includes file uploads), we use POST with
    // a _method=PUT field so the backend can read the uploaded file.
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      return this.request(`${resource}?id=${id}`, {
        method: 'POST',
        body: data,
      });
    }
    return this.request(`${resource}?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateMultipart(resource: string, id: string | number, data: FormData) {
    return this.update(resource, id, data);
  }

  async delete(resource: string, id: string | number) {
    return this.request(`${resource}?id=${id}`, {
      method: 'DELETE',
    });
  }

  async markAllMessagesRead() {
    return this.request('messages?action=read-all', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async uploadMessage(formData: FormData) {
    return this.request('messages', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteConversation(conversationId: string) {
    return this.request(`messages?conversation_id=${encodeURIComponent(conversationId)}`, {
      method: 'DELETE',
    });
  }

  async getMessageRecipients(role: string = 'all') {
    return this.request(`messages?action=recipients&role=${encodeURIComponent(role)}`, {
      method: 'GET',
    });
  }

  async downloadMessageAttachment(id: number | string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/messages?action=attachment&id=${encodeURIComponent(String(id))}`, {
      headers: { Authorization: `Bearer ${this.getToken() || ''}` },
    });
    if (!response.ok) {
      const responseText = await response.text();
      let message = 'Attachment download failed.';
      try {
        const result = JSON.parse(responseText);
        message = result.message || message;
      } catch {
        // Keep the attachment request error independent of non-JSON server output.
      }
      throw new Error(message);
    }
    return response.blob();
  }

  async downloadExamAttachment(examId: number | string): Promise<{ blob: Blob; filename: string; mime: string }> {
    const response = await fetch(
      `${API_BASE_URL}/exams?action=attachment&id=${encodeURIComponent(String(examId))}`,
      { headers: { Authorization: `Bearer ${this.getToken() || ''}` } }
    );
    if (!response.ok) {
      let message = 'Attachment download failed.';
      try {
        const result = JSON.parse(await response.text());
        message = result.message || message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'exam_routine';
    const mime = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, filename, mime };
  }

  async downloadAssignmentAttachment(assignmentId: number | string): Promise<{ blob: Blob; filename: string; mime: string }> {
    const response = await fetch(
      `${API_BASE_URL}/assignments?action=attachment&id=${encodeURIComponent(String(assignmentId))}`,
      { headers: { Authorization: `Bearer ${this.getToken() || ''}` } }
    );
    if (!response.ok) {
      let message = 'Assignment attachment download failed.';
      try {
        const result = JSON.parse(await response.text());
        message = result.message || message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'assignment_document';
    const mime = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, filename, mime };
  }

  async downloadEventAttachment(eventId: number | string): Promise<{ blob: Blob; filename: string; mime: string }> {
    const response = await fetch(
      `${API_BASE_URL}/events?action=attachment&id=${encodeURIComponent(String(eventId))}`,
      { headers: { Authorization: `Bearer ${this.getToken() || ''}` } }
    );
    if (!response.ok) {
      let message = 'Event document download failed.';
      try {
        const result = JSON.parse(await response.text());
        message = result.message || message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'event_document';
    const mime = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, filename, mime };
  }

  async downloadAnnouncementAttachment(announcementId: number | string): Promise<{ blob: Blob; filename: string; mime: string }> {
    const response = await fetch(
      `${API_BASE_URL}/announcements?action=attachment&id=${encodeURIComponent(String(announcementId))}`,
      { headers: { Authorization: `Bearer ${this.getToken() || ''}` } }
    );
    if (!response.ok) {
      let message = 'Announcement document download failed.';
      try {
        const result = JSON.parse(await response.text());
        message = result.message || message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'announcement_document';
    const mime = response.headers.get('Content-Type') || 'application/octet-stream';
    const blob = await response.blob();
    return { blob, filename, mime };
  }

  // Fee Management
  async getFeeStats() {
    return this.request('fees?action=stats', { method: 'GET' });
  }

  async getFeeCategories() {
    return this.request('fees?action=categories', { method: 'GET' });
  }

  async getFeePayments(params: Record<string, string | number> = {}) {
    return this.getAll('fees', { action: 'payments', ...params });
  }

  async getFeeReceipt(id: string | number) {
    return this.request(`fees?action=receipt&id=${encodeURIComponent(String(id))}`, { method: 'GET' });
  }

  async recordFeePayment(data: {
    invoice_id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    transaction_ref?: string;
    notes?: string;
  }) {
    return this.request('fees?action=record-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkGenerateFeeInvoices(data: {
    class_id?: number | null;
    grade_id?: number | null;
    fee_category_id: number;
    amount: number;
    due_date: string;
    title?: string;
    academic_year?: string;
    notes?: string;
  }) {
    return this.request('fees?action=bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createFeeCategory(data: {
    name: string;
    code?: string;
    description?: string;
    default_amount: number;
    frequency: string;
    status: string;
  }) {
    return this.request('fees?action=create-category', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFeeCategory(id: number | string, data: any) {
    // Use POST instead of PUT: some PHP hosting environments strip the body from PUT requests,
    // causing php://input to return empty and the update to silently write back old values.
    return this.request(`fees?action=update-category&id=${encodeURIComponent(String(id))}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFeeCategory(id: number | string) {
    return this.request(`fees?action=delete-category&id=${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
    });
  }

  // Revenue Analytics (Consolidates Fees & Expenses)
  async getRevenueSummary(params: Record<string, string | number> = {}) {
    return this.getAll('revenue', { action: 'summary', ...params });
  }

  async getRevenueTransactions(params: Record<string, string | number> = {}) {
    return this.getAll('revenue', { action: 'transactions', ...params });
  }

  // Bangladesh Result System & Result Sheet APIs
  async getResultSheet(studentId: string | number, examId?: string | number) {
    const qs = examId ? `&exam_id=${encodeURIComponent(String(examId))}` : '';
    return this.request(`results?action=sheet&student_id=${encodeURIComponent(String(studentId))}${qs}`, { method: 'GET' });
  }

  async getTabulationSheet(classId: string | number, examId?: string | number) {
    const qs = examId ? `&exam_id=${encodeURIComponent(String(examId))}` : '';
    return this.request(`results?action=tabulation&class_id=${encodeURIComponent(String(classId))}${qs}`, { method: 'GET' });
  }

  async getGradingScale() {
    return this.request('results?action=scale', { method: 'GET' });
  }

  async bulkSaveResults(data: {
    exam_id?: number | null;
    assignment_id?: number | null;
    total_marks?: number;
    results: Array<{
      student_id: string;
      score: number;
      cq_marks?: number;
      mcq_marks?: number;
      practical_marks?: number;
      total_marks?: number;
    }>;
  }) {
    return this.request('results?action=bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Attendance Spreadsheet & Marking APIs
  async getAttendanceSpreadsheet(params: {
    class_id?: string | number;
    month?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  } = {}) {
    return this.getAll('attendance', { action: 'spreadsheet', ...params });
  }

  async markAttendanceRecord(data: {
    student_id: string;
    date: string;
    present: boolean | number;
    lesson_id?: number | string;
    class_id?: number | string;
    notes?: string;
  }) {
    return this.request('attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
export default api;
