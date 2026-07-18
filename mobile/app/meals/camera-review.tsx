import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealCard } from '@/components/meals/MealCard';
import { MealScreen } from '@/components/meals/MealScreen';
import { useCameraReviewStore } from '@/stores/useCameraReviewStore';

export default function CameraReviewScreen() {
  const router = useRouter();
  const results = useCameraReviewStore((state) => state.results);
  const clear = useCameraReviewStore((state) => state.clear);

  const choose = (index: number) => {
    const result = results[index];
    if (!result) return;
    const nutrition = result.servings[0]?.nutrition ?? result.nutrition;
    clear();
    router.replace({ pathname: '/meals/manual', params: { name: result.name, calories: nutrition?.calories?.toString() ?? '', protein: nutrition?.proteinG?.toString() ?? '', carbs: nutrition?.carbsG?.toString() ?? '', fat: nutrition?.fatG?.toString() ?? '', providerId: result.providerId, source: result.source } });
  };

  return (
    <MealScreen title="Review meal" subtitle="Choose the closest verified match">
      <View style={styles.notice}><Text style={[type.bodyMd, { color: palette.onSurfaceVariant }]}>The analyzed photo has been deleted. Check the serving and nutrition before logging.</Text></View>
      <View style={styles.list}>{results.map((result, index) => <MealCard key={`${result.id}-${index}`} title={result.name} imageUri={result.imageUri} nutrition={result.servings[0]?.nutrition ?? result.nutrition} detail={result.brand ?? 'Verified food match'} onPress={() => choose(index)} />)}</View>
      {!results.length ? <View style={styles.empty}><Text style={[type.titleMd, { color: palette.onSurface }]}>No verified match</Text><Text style={[type.bodySm, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>We will not guess the nutrition. Add the details you know instead.</Text></View> : null}
      <Pressable onPress={() => { clear(); router.replace('/meals/manual'); }} style={styles.manual}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Manual entry</Text></Pressable>
    </MealScreen>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  list: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  manual: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm },
});
