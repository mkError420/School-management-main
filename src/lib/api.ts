// API Client for PHP Backend & MySQL Database

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
    return this.request<{ site_name: string }>('settings', { method: 'GET' });
  }

  async updateSiteName(siteName: string) {
    return this.request<{ site_name: string }>('settings', {
      method: 'PUT',
      body: JSON.stringify({ site_name: siteName }),
    });
  }

  // Dashboard Metrics
  async getDashboard() {
    return this.request('dashboard', { method: 'GET' });
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
    return this.request(`${resource}?id=${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async updateMultipart(resource: string, id: string | number, data: FormData) {
    return this.request(`${resource}?action=update&id=${encodeURIComponent(String(id))}`, {
      method: 'POST',
      body: data,
    });
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
    return this.request(`fees?action=update-category&id=${encodeURIComponent(String(id))}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFeeCategory(id: number | string) {
    return this.request(`fees?action=delete-category&id=${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
