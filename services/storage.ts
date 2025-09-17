import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys
const STORAGE_KEYS = {
  mealPlans: 'mb.mealPlans',
  activeMealPlanId: 'mb.activeMealPlanId',
  mealSuggestions: 'mb.mealSuggestions',
  grocerySelections: 'mb.grocerySelections',
  apiKey: 'mb.apiKey',
} as const;

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlanDetails {
  id: string;
  title: string;
  caloriesPerDay?: number;
  restrictions: string[];
  dislikedIngredients?: string[];
  notes?: string;
  createdAt: number;
}

export interface MealSuggestion {
  id: string;
  mealPlanId: string;
  type: MealType;
  title: string;
  description?: string;
  ingredients: string[];
  instructions?: string;
  groceries: string[];
  createdAt: number;
}

export interface GrocerySelectionState {
  mealPlanId: string;
  selectedSuggestionIds: string[];
  checkedGroceries: Record<string, boolean>;
  updatedAt: number;
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// API Key
export async function getApiKey(): Promise<string | null> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.apiKey)) ?? null;
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.apiKey, key);
}

// Meal Plans
export async function getMealPlans(): Promise<MealPlanDetails[]> {
  return (await readJson<MealPlanDetails[]>(STORAGE_KEYS.mealPlans)) ?? [];
}

export async function saveMealPlan(plan: MealPlanDetails): Promise<void> {
  const plans = await getMealPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) plans[idx] = plan; else plans.unshift(plan);
  await writeJson(STORAGE_KEYS.mealPlans, plans);
  await setActiveMealPlanId(plan.id);
}

export async function setActiveMealPlanId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.activeMealPlanId, id);
}

export async function getActiveMealPlanId(): Promise<string | null> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.activeMealPlanId)) ?? null;
}

export async function getActiveMealPlan(): Promise<MealPlanDetails | null> {
  const [id, plans] = await Promise.all([
    getActiveMealPlanId(),
    getMealPlans(),
  ]);
  if (!id) return null;
  return plans.find(p => p.id === id) ?? null;
}

// Meal Suggestions
export async function getMealSuggestions(mealPlanId?: string): Promise<MealSuggestion[]> {
  const all = (await readJson<MealSuggestion[]>(STORAGE_KEYS.mealSuggestions)) ?? [];
  if (!mealPlanId) return all;
  return all.filter(s => s.mealPlanId === mealPlanId);
}

export async function appendMealSuggestions(newOnes: MealSuggestion[]): Promise<void> {
  const all = await getMealSuggestions();
  const merged = [...newOnes, ...all].reduce<MealSuggestion[]>((acc, cur) => {
    if (acc.find(s => s.id === cur.id)) return acc;
    acc.push(cur);
    return acc;
  }, []);
  await writeJson(STORAGE_KEYS.mealSuggestions, merged);
}

// Grocery selections
export async function getGrocerySelections(mealPlanId: string): Promise<GrocerySelectionState | null> {
  const map = (await readJson<Record<string, GrocerySelectionState>>(STORAGE_KEYS.grocerySelections)) ?? {};
  return map[mealPlanId] ?? null;
}

export async function saveGrocerySelections(state: GrocerySelectionState): Promise<void> {
  const map = (await readJson<Record<string, GrocerySelectionState>>(STORAGE_KEYS.grocerySelections)) ?? {};
  map[state.mealPlanId] = state;
  await writeJson(STORAGE_KEYS.grocerySelections, map);
}

export const StorageKeys = STORAGE_KEYS;

