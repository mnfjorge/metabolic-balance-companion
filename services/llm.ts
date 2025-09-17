import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import OpenAI from 'openai';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import type { MealPlanDetails, MealSuggestion, MealType } from './storage';

let openaiClient: OpenAI | null = null;

export function configureOpenAI(apiKey: string) {
  openaiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

export async function pickPdf(): Promise<{ uri: string; name: string } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled) return null;
  const asset = res.assets?.[0];
  if (!asset) return null;
  return { uri: asset.uri, name: asset.name ?? 'meal-plan.pdf' };
}

export interface ParsedMealPlan {
  title: string;
  caloriesPerDay?: number;
  restrictions: string[];
  dislikedIngredients?: string[];
  notes?: string;
}

export async function parseMealPlanPdf(apiKey: string, pdfUri: string, pdfName: string): Promise<MealPlanDetails> {
  if (!openaiClient) configureOpenAI(apiKey);
  if (!openaiClient) throw new Error('OpenAI client not configured');

  const base64Encoding: any = (FileSystem as any).EncodingType?.Base64 ?? 'base64';
  const fileBase64 = await FileSystem.readAsStringAsync(pdfUri, { encoding: base64Encoding });

  const systemPrompt = `You are a nutrition assistant. Extract structured details from the provided meal plan PDF. Return JSON with keys: title (string), caloriesPerDay (number, optional), restrictions (string[]), dislikedIngredients (string[], optional), notes (string, optional). If values not found, omit.`;

  const userPrompt = `Extract the required JSON from this meal plan PDF.`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-5.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          {
            type: 'input_file',
            input_file: {
              mime_type: 'application/pdf',
              data: fileBase64,
              name: pdfName,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  } as any);

  const content = response.choices?.[0]?.message?.content;
  let parsed: ParsedMealPlan = { title: 'Meal Plan', restrictions: [] };
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : parsed;
  } catch {}

  const details: MealPlanDetails = {
    id: uuidv4(),
    title: parsed.title || 'Meal Plan',
    caloriesPerDay: parsed.caloriesPerDay,
    restrictions: parsed.restrictions || [],
    dislikedIngredients: parsed.dislikedIngredients || [],
    notes: parsed.notes,
    createdAt: Date.now(),
  };
  return details;
}

export async function generateMealSuggestions(
  apiKey: string,
  mealPlan: MealPlanDetails,
  mealType: MealType,
  count: number = 5,
): Promise<MealSuggestion[]> {
  if (!openaiClient) configureOpenAI(apiKey);
  if (!openaiClient) throw new Error('OpenAI client not configured');

  const systemPrompt = `You are a nutrition assistant. Given a user's meal plan details and a requested meal type, produce ${count} concise meal suggestions suitable for the plan.
Return strict JSON with an array "meals" where each item has: title (string), description (string), ingredients (string[]), instructions (string), groceries (string[]). Groceries should be a deduplicated list of ingredients suitable for shopping.`;

  const userPrompt = `Meal plan details:\n${JSON.stringify(mealPlan, null, 2)}\n\nRequested meal type: ${mealType}.`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-5.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  } as any);

  const content = response.choices?.[0]?.message?.content ?? '{}';
  let meals: any[] = [];
  try {
    const parsed = JSON.parse(content);
    meals = Array.isArray(parsed.meals) ? parsed.meals : [];
  } catch {}

  const now = Date.now();
  return meals.slice(0, count).map(item => ({
    id: uuidv4(),
    mealPlanId: mealPlan.id,
    type: mealType,
    title: item.title,
    description: item.description,
    ingredients: item.ingredients ?? [],
    instructions: item.instructions,
    groceries: item.groceries ?? [],
    createdAt: now,
  }));
}

