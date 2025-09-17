import { Link } from 'expo-router';
import { StyleSheet, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState } from 'react';
import { getApiKey, setApiKey } from '../services/storage';

export default function WelcomeScreen() {
  const [apiKey, setApiKeyState] = useState('');

  useEffect(() => {
    (async () => {
      const k = await getApiKey();
      if (k) setApiKeyState(k);
    })();
  }, []);

  async function onSaveKey(text: string) {
    setApiKeyState(text);
    await setApiKey(text);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Meal Planner</ThemedText>
      <ThemedText style={styles.paragraph}>
        Welcome! This app lets you:
      </ThemedText>
      <ThemedText>• Upload a meal plan PDF</ThemedText>
      <ThemedText>• Review and confirm plan details</ThemedText>
      <ThemedText>• Generate meal suggestions</ThemedText>
      <ThemedText>• Build grocery lists from selected meals</ThemedText>

      <ThemedText style={styles.sectionTitle}>Step 1: Enter OpenAI API Key</ThemedText>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="sk-..."
        value={apiKey}
        onChangeText={onSaveKey}
        autoCapitalize="none"
      />

      <Link href="/meal-setup" style={styles.cta}>
        <ThemedText type="link">Continue to upload your meal plan PDF →</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, padding: 16 },
  paragraph: { marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 8, padding: 12 },
  cta: { marginTop: 16 },
  sectionTitle: { marginTop: 16 },
});

