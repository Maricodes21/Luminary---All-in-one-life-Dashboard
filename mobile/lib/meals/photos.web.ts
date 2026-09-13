export async function retainMealPhoto(_userId: string, temporaryUri: string) {
  return temporaryUri;
}

export async function clearMealPhotoCache() {
  // Browser-managed site storage is cleared through the user's browser controls.
}

export async function discardTemporaryMealPhoto(temporaryUri: string) {
  if (temporaryUri.startsWith('blob:')) URL.revokeObjectURL(temporaryUri);
}
