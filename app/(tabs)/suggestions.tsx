import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { generateMealSuggestions } from '../../services/llm';
import {
  getActiveMealPlan,
  getApiKey,
  getMealSuggestions,
  appendMealSuggestions,
  type MealSuggestion,
  type MealType,
} from '../../services/storage';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

export default function SuggestionsScreen() {
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<MealSuggestion[]>([]);

  useEffect(() => {
    (async () => {
      const plan = await getActiveMealPlan();
      if (!plan) return;
      const current = await getMealSuggestions(plan.id);
      setExisting(current);
    })();
  }, []);

  const filtered = useMemo(() => existing.filter(s => s.type === mealType), [existing, mealType]);

  async function onGenerate() {
    setError(null);
    const [apiKey, plan] = await Promise.all([getApiKey(), getActiveMealPlan()]);
    if (!apiKey) { setError('Missing API key. Add it in Welcome screen.'); return; }
    if (!plan) { setError('No active meal plan. Upload one first.'); return; }
    try {
      setLoading(true);
      const newOnes = await generateMealSuggestions(apiKey, plan, mealType, 5);
      await appendMealSuggestions(newOnes);
      const current = await getMealSuggestions(plan.id);
      setExisting(current);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meal Suggestions</ThemedText>

      <ThemedText>Meal type:</ThemedText>
      <View style={styles.row}>
        {MEAL_TYPES.map(t => (
          <ThemedText key={t} onPress={() => setMealType(t)} style={[styles.pill, mealType === t && styles.pillActive]}>
            {t}
          </ThemedText>
        ))}
      </View>

      <ThemedText type="link" onPress={onGenerate} style={styles.cta}>
        {loading ? 'Generating…' : 'Generate 5 suggestions'}
      </ThemedText>
      {error ? <ThemedText style={{ color: 'red' }}>{error}</ThemedText> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">{item.title}</ThemedText>
            {item.description ? <ThemedText>{item.description}</ThemedText> : null}
            <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>Ingredients</ThemedText>
            <ThemedText>{item.ingredients.join(', ')}</ThemedText>
          </ThemedView>
        )}
        ListEmptyComponent={<ThemedText>No suggestions yet.</ThemedText>}
        style={{ marginTop: 12 }}
      />

      <Link href="/(tabs)/grocery-builder" style={styles.cta}>
        <ThemedText type="link">Build grocery list →</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16, flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#888', borderRadius: 20 },
  pillActive: { backgroundColor: '#eee' },
  cta: { marginTop: 8 },
  card: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginBottom: 8 },
});

