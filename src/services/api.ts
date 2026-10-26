import { Invoice, BusinessDetails } from '../types/invoice';

const TOKEN_KEY = 'invoice_generator_auth_token_v1';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  return data as T;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  businessProfile?: BusinessDetails | null;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  message?: string;
}

export const api = {
  auth: {
    async register(fullName: string, email: string, password: string, confirmPassword?: string): Promise<AuthResponse> {
      const data = await request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      });
      if (data.token) {
        setStoredToken(data.token);
      }
      return data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      const data = await request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        setStoredToken(data.token);
      }
      return data;
    },

    async getMe(): Promise<{ user: UserProfile }> {
      return request<{ user: UserProfile }>('/api/auth/me');
    },

    async logout(): Promise<void> {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        // ignore network error on logout
      } finally {
        removeStoredToken();
      }
    },
  },

  invoices: {
    async list(): Promise<Invoice[]> {
      return request<Invoice[]>('/api/invoices');
    },

    async get(id: string): Promise<Invoice> {
      return request<Invoice>(`/api/invoices/${encodeURIComponent(id)}`);
    },

    async create(invoice: Partial<Invoice>): Promise<Invoice> {
      return request<Invoice>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice),
      });
    },

    async update(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
      return request<Invoice>(`/api/invoices/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(invoice),
      });
    },

    async duplicate(id: string): Promise<Invoice> {
      return request<Invoice>(`/api/invoices/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
      });
    },

    async delete(id: string): Promise<{ success: boolean }> {
      return request<{ success: boolean }>(`/api/invoices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  },

  profile: {
    async getBusiness(): Promise<BusinessDetails | null> {
      return request<BusinessDetails | null>('/api/profile/business');
    },

    async saveBusiness(profile: BusinessDetails): Promise<{ success: boolean; profile: BusinessDetails }> {
      return request<{ success: boolean; profile: BusinessDetails }>('/api/profile/business', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
    },
  },
};
