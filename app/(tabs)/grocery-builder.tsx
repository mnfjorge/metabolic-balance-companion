import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getActiveMealPlan,
  getGrocerySelections,
  getMealSuggestions,
  saveGrocerySelections,
  type GrocerySelectionState,
} from '../../services/storage';

export default function GroceryBuilderScreen() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const plan = await getActiveMealPlan();
      if (!plan) return;
      setMealPlanId(plan.id);
      const [existingSugs, sel] = await Promise.all([
        getMealSuggestions(plan.id),
        getGrocerySelections(plan.id),
      ]);
      setSuggestions(existingSugs);
      if (sel) {
        setSelectedIds(sel.selectedSuggestionIds);
        setChecked(sel.checkedGroceries);
      }
    })();
  }, []);

  const selectedGroceries = useMemo(() => {
    const set = new Set<string>();
    suggestions.filter(s => selectedIds.includes(s.id)).forEach(s => {
      s.groceries?.forEach((g: string) => set.add(g));
    });
    return Array.from(set);
  }, [suggestions, selectedIds]);

  async function persist() {
    if (!mealPlanId) return;
    const state: GrocerySelectionState = {
      mealPlanId,
      selectedSuggestionIds: selectedIds,
      checkedGroceries: checked,
      updatedAt: Date.now(),
    };
    await saveGrocerySelections(state);
  }

  function toggleSelected(id: string) {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setTimeout(persist, 0);
      return next;
    });
  }

  function toggleChecked(item: string) {
    setChecked(prev => {
      const next = { ...prev, [item]: !prev[item] };
      setTimeout(persist, 0);
      return next;
    });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Grocery List Builder</ThemedText>
      <ThemedText type="subtitle" style={{ marginTop: 8 }}>Select meals</ThemedText>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThemedText
            onPress={() => toggleSelected(item.id)}
            style={[styles.pill, selectedIds.includes(item.id) && styles.pillActive]}
          >
            {item.type} • {item.title}
          </ThemedText>
        )}
        horizontal
        contentContainerStyle={{ gap: 8 }}
        style={{ marginVertical: 8 }}
        ListEmptyComponent={<ThemedText>No suggestions yet. Generate some first.</ThemedText>}
      />

      <ThemedText type="subtitle" style={{ marginTop: 8 }}>Groceries</ThemedText>
      <FlatList
        data={selectedGroceries}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <ThemedText onPress={() => toggleChecked(item)} style={[styles.checkbox, checked[item] && styles.checkboxChecked]}>
            {checked[item] ? '☑' : '☐'} {item}
          </ThemedText>
        )}
        ListEmptyComponent={<ThemedText>Select meals to build a grocery list.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16, flex: 1 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#888', borderRadius: 20 },
  pillActive: { backgroundColor: '#eee' },
  checkbox: { paddingVertical: 8 },
  checkboxChecked: { textDecorationLine: 'line-through', color: '#888' },
});

