import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { pickPdf, parseMealPlanPdf } from '../services/llm';
import { getApiKey } from '../services/storage';

export default function MealSetupScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onPick();
  }, []);

  async function onPick() {
    setError(null);
    const apiKey = await getApiKey();
    if (!apiKey) {
      router.replace('/welcome');
      return;
    }
    const doc = await pickPdf();
    if (!doc) return;
    try {
      setLoading(true);
      const plan = await parseMealPlanPdf(apiKey, doc.uri, doc.name);
      router.push({ pathname: '/meal-confirm', params: { plan: JSON.stringify(plan) } });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to parse meal plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Upload Meal Plan PDF</ThemedText>
      {loading ? (
        <ThemedText>Processing your PDF…</ThemedText>
      ) : (
        <ThemedText>Select a PDF to extract your plan details.</ThemedText>
      )}
      {error ? <ThemedText style={{ color: 'red' }}>{error}</ThemedText> : null}
      <ThemedText type="link" onPress={onPick} style={styles.cta}>Pick PDF</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16 },
  cta: { marginTop: 16 },
});

