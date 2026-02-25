import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'refresh_token';

export const saveRefreshToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const clearRefreshToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
