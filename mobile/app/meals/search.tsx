import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, type } from '@luminary/design-system';

import { MealCard } from '@/components/meals/MealCard';
import { MealScreen } from '@/components/meals/MealScreen';
import { Icon } from '@/components/ui/Icon';
import { searchFoods } from '@/lib/meals/search';
import type { FoodSearchResult } from '@/lib/meals/types';

export default function FoodSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const found = await searchFoods(query);
    setResults(found);
    setSearched(true);
    setLoading(false);
  };

  const choose = (result: FoodSearchResult) => {
    const nutrition = result.servings[0]?.nutrition ?? result.nutrition;
    router.push({
      pathname: '/meals/manual',
      params: {
        name: result.name,
        calories: nutrition?.calories?.toString() ?? '',
        protein: nutrition?.proteinG?.toString() ?? '',
        carbs: nutrition?.carbsG?.toString() ?? '',
        fat: nutrition?.fatG?.toString() ?? '',
        imageUri: result.imageUri,
        providerId: result.providerId,
        source: result.source,
      },
    });
  };

  return (
    <MealScreen title="Search food" subtitle="Brands, staples, meals, and community records">
      <View style={styles.searchRow}>
        <Icon name="search" size={19} color={palette.onSurfaceVariant} />
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={runSearch} returnKeyType="search" autoFocus placeholder="Try oats, Bokomo, or burger patty" placeholderTextColor={palette.onSurfaceVariant} style={styles.input} />
        {loading ? <ActivityIndicator color={palette.primary} /> : <Pressable onPress={runSearch} style={styles.go}><Icon name="back" size={18} color={palette.onPrimary} /></Pressable>}
      </View>
      {!searched ? (
        <View style={styles.intro}><Text style={[type.titleMd, { color: palette.onSurface }]}>Search what you actually ate</Text><Text style={[type.bodyMd, { color: palette.onSurfaceVariant, marginTop: spacing.xs }]}>Direct provider matches come first. When wording is unclear, AI may expand the search, but nutrition always comes from a traceable food record.</Text></View>
      ) : null}
      <View style={styles.list}>
        {results.map((result) => <MealCard key={`${result.source}-${result.id}`} title={result.name} imageUri={result.imageUri} nutrition={result.servings[0]?.nutrition ?? result.nutrition} detail={result.brand ?? sourceLabel(result.source)} onPress={() => choose(result)} />)}
      </View>
      {searched && !results.length && !loading ? (
        <View style={styles.noResults}>
          <Text style={[type.titleMd, { color: palette.onSurface }]}>No verified match yet</Text>
          <Text style={[type.bodySm, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>Add what you know now. Unknown macros will stay blank instead of being invented.</Text>
          <Pressable onPress={() => router.push({ pathname: '/meals/manual', params: { name: query } })} style={styles.manual}><Text style={[type.labelMd, { color: palette.onPrimary }]}>Open manual entry</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/meals/submit-food', params: { name: query } })} style={styles.submit}><Text style={[type.labelSm, { color: palette.primary }]}>Submit a food record</Text></Pressable>
        </View>
      ) : null}
    </MealScreen>
  );
}

function sourceLabel(source: FoodSearchResult['source']) {
  if (source === 'usda') return 'USDA FoodData Central';
  if (source === 'open_food_facts') return 'Open Food Facts';
  if (source === 'community') return 'Verified Luminary community';
  return 'Luminary recipe library';
}

const styles = StyleSheet.create({
  searchRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainer, borderRadius: radii.sm, paddingHorizontal: spacing.md },
  input: { flex: 1, minWidth: 0, color: palette.onSurface, fontSize: 15, paddingVertical: spacing.sm },
  go: { width: 34, height: 34, borderRadius: radii.sm, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '180deg' }] },
  intro: { backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.md },
  list: { gap: spacing.sm },
  noResults: { alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceContainerLow, borderRadius: radii.sm, padding: spacing.lg },
  manual: { minHeight: 46, justifyContent: 'center', backgroundColor: palette.primary, borderRadius: radii.sm, paddingHorizontal: spacing.lg },
  submit: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.md },
});
