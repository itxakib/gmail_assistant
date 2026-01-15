import { saveApiToken, getApiToken, removeApiToken } from './api-token';
import { apiRequest } from './api-client';
import { API_BASE_URL } from '../config/constants';

export { saveApiToken, getApiToken, removeApiToken };

// ==================== AUTH TYPES & FUNCTIONS ====================
export interface GoogleAuthResponse {
  api_token: string;
  user: { id: number; email: string; name: string; image_url?: string };
}

export const authenticateWithGoogle = async (accessToken: string): Promise<GoogleAuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export interface OutlookAuthResponse {
  api_token: string;
  user: { id: number; email: string; name: string; image_url?: string };
}

export const authenticateWithOutlook = async (accessToken: string): Promise<OutlookAuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/microsoft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export interface VerifyTokenResponse {
  valid: boolean;
  user: { id: number; email: string; name: string };
}

export const verifyApiToken = async (token: string): Promise<VerifyTokenResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: 'POST',
    headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const regenerateToken = async (): Promise<{ api_token: string; message: string }> => {
  return apiRequest('/auth/regenerate', { method: 'POST' });
};

// ==================== EMAIL TYPES & FUNCTIONS ====================
export interface Email {
  id: number;
  subject: string;
  from_email: string;
  to_email: string;
  body: string;
  received_at: string;
  read: boolean;
  replied_at: string | null;
  provider: 'gmail' | 'outlook';
  created_at: string;
  updated_at: string;
}

export interface EmailsResponse {
  emails: Email[];
  pagination: { current_page: number; per_page: number; total_pages: number; total_count: number };
}

export const fetchEmails = async (page: number = 1, perPage: number = 20): Promise<EmailsResponse> => {
  return apiRequest(`/emails?page=${page}&per_page=${perPage}`);
};

export const getEmailDetails = async (id: number): Promise<{ email: Email }> => {
  return apiRequest(`/emails/${id}`);
};

export const syncEmails = async (): Promise<{ success: boolean; data: { synced: boolean }; message: string }> => {
  return apiRequest('/emails/sync', { method: 'POST' });
};

export interface CheckNewEmailsResponse {
  new_count: number;
  unread_count: number;
  has_new: boolean;
  last_checked: string;
}

export const checkNewEmails = async (lastChecked?: string): Promise<CheckNewEmailsResponse> => {
  const url = lastChecked ? `/emails/check_new?last_checked=${encodeURIComponent(lastChecked)}` : '/emails/check_new';
  return apiRequest(url);
};

export const generateReply = async (emailId: number): Promise<{ reply: string }> => {
  return apiRequest(`/emails/${emailId}/generate_reply`, { method: 'POST' });
};

export const sendReply = async (emailId: number, replyText: string): Promise<{ success: boolean; data: { replied: boolean }; message: string }> => {
  return apiRequest(`/emails/${emailId}/reply`, { method: 'POST', body: JSON.stringify({ reply_text: replyText }) });
};

// ==================== DASHBOARD TYPES & FUNCTIONS ====================
export interface DashboardStats {
  total_emails: number;
  unread_emails: number;
  replied_emails: number;
  recent_emails_count: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  accounts: {
    gmail?: { id: number; email: string };
    outlook?: Array<{ id: number; email: string }>;
  };
  recent_emails: Array<{
    id: number;
    subject: string;
    from_email: string;
    received_at: string;
    read: boolean;
    provider: 'gmail' | 'outlook';
  }>;
}

export const getDashboardData = async (): Promise<DashboardResponse> => {
  return apiRequest('/dashboard');
};

// ==================== SETTINGS TYPES & FUNCTIONS ====================
export interface Settings {
  auto_sync_enabled: boolean;
  auto_sync_frequency: number;
  theme: string;
  language: string;
  signature: string;
  auto_reply_enabled: boolean;
}

export interface SettingsResponse {
  settings: Settings;
  user: { id: number; email: string; name: string; image_url?: string };
}

export const getSettings = async (): Promise<SettingsResponse> => {
  return apiRequest('/settings');
};

export const updateSettings = async (settings: Partial<Settings>): Promise<{ success: boolean; message: string; settings: Settings }> => {
  return apiRequest('/settings', { method: 'PATCH', body: JSON.stringify({ settings }) });
};

// ==================== ASSISTANT TYPES & FUNCTIONS ====================
export interface AssistantMessage {
  id: number;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface AssistantHistoryResponse {
  messages: AssistantMessage[];
}

export const getAssistantHistory = async (): Promise<AssistantHistoryResponse> => {
  return apiRequest('/assistant');
};

export interface SendMessageResponse {
  user_message: AssistantMessage;
  assistant_message: AssistantMessage;
}

export const sendAssistantMessage = async (message: string): Promise<SendMessageResponse> => {
  return apiRequest('/assistant/message', { method: 'POST', body: JSON.stringify({ message }) });
};
