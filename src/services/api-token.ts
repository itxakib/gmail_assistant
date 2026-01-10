import AsyncStorage from '@react-native-async-storage/async-storage';

const API_TOKEN_KEY = '@nebubots_api_token';

export const saveApiToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(API_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving API token:', error);
    throw error;
  }
};

export const getApiToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(API_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting API token:', error);
    return null;
  }
};

export const removeApiToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(API_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing API token:', error);
    throw error;
  }
};
