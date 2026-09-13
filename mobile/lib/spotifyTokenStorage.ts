import * as SecureStore from 'expo-secure-store';

export function setSpotifyTokenValue(key: string, value: string) {
  return SecureStore.setItemAsync(key, value);
}

export function getSpotifyTokenValue(key: string) {
  return SecureStore.getItemAsync(key);
}

export function deleteSpotifyTokenValue(key: string) {
  return SecureStore.deleteItemAsync(key);
}
