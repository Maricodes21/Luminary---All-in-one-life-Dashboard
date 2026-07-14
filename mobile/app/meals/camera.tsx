import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { File } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { Icon } from '@/components/ui/Icon';
import { analyzeMealPhoto, lookupBarcode } from '@/lib/meals/search';
import { retainMealPhoto } from '@/lib/meals/photos';
import type { FoodSearchResult } from '@/lib/meals/types';
import { useCameraReviewStore } from '@/stores/useCameraReviewStore';
import { useAuthStore } from '@/stores/useAuthStore';

export default function MealCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; purpose?: string; returnId?: string; returnName?: string; returnCalories?: string; returnProtein?: string; returnCarbs?: string; returnFat?: string; returnQuantity?: string; returnUnit?: string; returnMealType?: string; returnNotes?: string; returnProviderId?: string; returnSource?: string }>();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);
  const setResults = useCameraReviewStore((state) => state.setResults);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const barcodeMode = params.mode === 'barcode';

  const onBarcode = async ({ data }: BarcodeScanningResult) => {
    if (!barcodeMode || scanned || busy) return;
    setScanned(true);
    setBusy(true);
    const result = await lookupBarcode(data);
    setBusy(false);
    if (result) openManual(router, result);
    else Alert.alert('Barcode not found', 'We could not verify this product yet. You can enter the label details manually.', [
      { text: 'Scan again', onPress: () => setScanned(false) },
      { text: 'Manual entry', onPress: () => router.replace({ pathname: '/meals/manual', params: { notes: `Barcode: ${data}` } }) },
    ]);
  };

  const takePhoto = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ base64: params.purpose === 'attachment' ? false : true, quality: 0.62, skipProcessing: false });
      if (!photo) return;
      if (params.purpose === 'attachment') {
        if (!userId) throw new Error('A signed-in user is required to attach a meal photo.');
        const imageUri = await retainMealPhoto(userId, photo.uri);
        router.replace({ pathname: '/meals/manual', params: { id: params.returnId, name: params.returnName ?? '', calories: params.returnCalories ?? '', protein: params.returnProtein ?? '', carbs: params.returnCarbs ?? '', fat: params.returnFat ?? '', quantity: params.returnQuantity ?? '1', unit: params.returnUnit ?? 'serving', mealType: params.returnMealType, notes: params.returnNotes, providerId: params.returnProviderId, source: params.returnSource, imageUri } });
        return;
      }
      if (!photo.base64) throw new Error('The camera did not return image data.');
      try {
        const results = await analyzeMealPhoto(photo.base64);
        setResults(results);
        router.replace('/meals/camera-review');
      } finally {
        const temporaryPhoto = new File(photo.uri);
        if (temporaryPhoto.exists) temporaryPhoto.delete();
      }
    } catch (error) {
      Alert.alert('Could not analyze this meal', 'The photo was not kept. You can retry or use Manual entry.');
      console.warn('[meals] Camera analysis failed', error instanceof Error ? error.message : error);
    } finally {
      setBusy(false);
    }
  };

  if (!permission) return <View style={styles.permission}><ActivityIndicator color={palette.primary} /></View>;
  if (!permission.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top + spacing.xl }]}>
        <Icon name="camera" size={30} color={palette.primary} />
        <Text style={[type.headlineMd, { color: palette.onSurface }]}>Camera access</Text>
        <Text style={[type.bodyMd, styles.permissionCopy]}>Luminary uses the camera only for the meal or barcode you choose to scan. Gallery import is not used.</Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Allow camera</Text></Pressable>
        <Pressable onPress={() => router.back()} style={styles.cancel}><Text style={[type.labelSm, { color: palette.onSurfaceVariant }]}>Not now</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={barcodeMode ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] } : undefined} onBarcodeScanned={barcodeMode ? onBarcode : undefined} />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.roundButton} accessibilityLabel="Close camera"><Icon name="close" size={20} /></Pressable>
        <View style={styles.modeLabel}><Text style={[type.labelMd, { color: palette.onSurface }]}>{barcodeMode ? 'Align the barcode' : params.purpose === 'attachment' ? 'Take a meal photo' : 'Frame the whole plate'}</Text></View>
        <View style={styles.roundButton} />
      </View>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        {busy ? <ActivityIndicator size="large" color={palette.onSurface} /> : barcodeMode ? <Text style={[type.bodyMd, { color: palette.onSurface }]}>Scanning automatically</Text> : <Pressable onPress={takePhoto} style={styles.shutter} accessibilityRole="button" accessibilityLabel="Take photo"><View style={styles.shutterInner} /></Pressable>}
        {!barcodeMode ? <Text style={[type.bodySm, styles.privacy]}>{params.purpose === 'attachment' ? 'This photo will be attached to your log.' : 'Analysis photos are deleted after processing.'}</Text> : null}
      </View>
    </View>
  );
}

function openManual(router: ReturnType<typeof useRouter>, result: FoodSearchResult) {
  const nutrition = result.servings[0]?.nutrition ?? result.nutrition;
  router.replace({ pathname: '/meals/manual', params: { name: result.name, calories: nutrition?.calories?.toString() ?? '', protein: nutrition?.proteinG?.toString() ?? '', carbs: nutrition?.carbsG?.toString() ?? '', fat: nutrition?.fatG?.toString() ?? '', imageUri: result.imageUri, providerId: result.providerId, source: result.source } });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, backgroundColor: palette.surface },
  permissionCopy: { color: palette.onSurfaceVariant, textAlign: 'center' },
  permissionButton: { minHeight: 48, justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.xl },
  cancel: { minHeight: 40, justifyContent: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.md, backgroundColor: 'rgba(12,14,16,0.72)' },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(23,26,28,0.84)' },
  modeLabel: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, backgroundColor: 'rgba(23,26,28,0.84)', borderRadius: radii.sm },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: 'rgba(12,14,16,0.72)' },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: palette.onSurface, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: palette.onSurface },
  privacy: { color: palette.onSurfaceVariant, textAlign: 'center' },
});
