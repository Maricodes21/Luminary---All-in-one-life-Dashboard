export async function setSpotifyTokenValue(key: string, value: string) {
  window.sessionStorage.setItem(key, value);
}

export async function getSpotifyTokenValue(key: string) {
  return window.sessionStorage.getItem(key);
}

export async function deleteSpotifyTokenValue(key: string) {
  window.sessionStorage.removeItem(key);
}
