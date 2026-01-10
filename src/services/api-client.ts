import { getApiToken, removeApiToken } from './api-token';

const API_BASE_URL = 'https://nebubot-production.up.railway.app/api';

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await getApiToken();
  if (!token) {
    throw new Error('No API token found. Please login again.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await removeApiToken();
        throw new Error('Session expired. Please login again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};
