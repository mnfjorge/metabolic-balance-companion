import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { MealPlanDetails } from '../services/storage';
import { saveMealPlan } from '../services/storage';

export default function MealConfirmScreen() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const initial: MealPlanDetails | null = useMemo(() => {
    if (!plan) return null;
    try { return JSON.parse(plan); } catch { return null; }
  }, [plan]);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [caloriesPerDay, setCaloriesPerDay] = useState(String(initial?.caloriesPerDay ?? ''));
  const [restrictions, setRestrictions] = useState((initial?.restrictions ?? []).join(', '));
  const [disliked, setDisliked] = useState((initial?.dislikedIngredients ?? []).join(', '));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  async function onSave() {
    if (!initial) return;
    const planToSave: MealPlanDetails = {
      ...initial,
      title: title.trim() || initial.title,
      caloriesPerDay: caloriesPerDay ? Number(caloriesPerDay) : undefined,
      restrictions: restrictions.split(',').map(s => s.trim()).filter(Boolean),
      dislikedIngredients: disliked.split(',').map(s => s.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
    };
    await saveMealPlan(planToSave);
    router.replace('/(tabs)');
  }

  if (!initial) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Nothing to confirm.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Confirm Meal Plan</ThemedText>
      <ThemedText>Title</ThemedText>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <ThemedText>Calories/Day</ThemedText>
      <TextInput style={styles.input} value={caloriesPerDay} onChangeText={setCaloriesPerDay} keyboardType="numeric" />
      <ThemedText>Restrictions (comma-separated)</ThemedText>
      <TextInput style={styles.input} value={restrictions} onChangeText={setRestrictions} />
      <ThemedText>Disliked Ingredients (comma-separated)</ThemedText>
      <TextInput style={styles.input} value={disliked} onChangeText={setDisliked} />
      <ThemedText>Notes</ThemedText>
      <TextInput style={[styles.input, { height: 100 }]} value={notes} onChangeText={setNotes} multiline />

      <ThemedText type="link" onPress={onSave} style={styles.cta}>Save Plan</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 12 },
  cta: { marginTop: 16 },
});

