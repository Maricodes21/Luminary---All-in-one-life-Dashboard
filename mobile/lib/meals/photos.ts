import { Directory, File, Paths } from 'expo-file-system';

const ROOT = new Directory(Paths.document, 'meal-photos');

export async function retainMealPhoto(userId: string, temporaryUri: string) {
  const directory = new Directory(ROOT, encodeURIComponent(userId));
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(directory, `${Date.now()}.jpg`);
  new File(temporaryUri).copy(destination);
  return destination.uri;
}

export async function clearMealPhotoCache() {
  if (ROOT.exists) ROOT.delete();
}
