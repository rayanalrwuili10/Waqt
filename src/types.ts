export type Section = 'dashboard' | 'health' | 'food' | 'money' | 'sleep' | 'productivity' | 'habits' | 'faith' | 'emergency' | 'travel' | 'home' | 'goals' | 'analytics' | 'features' | 'focus' | 'personality' | 'store' | 'medical';

export interface HealthData {
  steps: number;
  weight: number;
  exercises: { id: string; type: string; duration: number; intensity: 'low' | 'medium' | 'high'; date: string }[];
  dailyWater: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  quality: number; // 1-10
  date: string;
}

export interface MoneyData {
  income: number;
  transactions: Transaction[];
  budget: number;
  savingsGoal: number;
  alerts: string[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface FaithData {
  lastQuranPage: number;
  khatmaCount: number;
  prayers: Record<string, boolean>;
  sadakah: number;
  ramadanMode: boolean;
  azkarCount: number;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  tasks: { id: string; title: string; completed: boolean }[];
  deadline?: string;
}

export interface TravelTrip {
  id: string;
  destination: string;
  budget: number;
  expenses: number;
  currency: string;
  checkList: { id: string; item: string; checked: boolean }[];
  date: string;
}

export interface HomeData {
  bills: { id: string; title: string; amount: number; dueDate: string; paid: boolean }[];
  shoppingList: { id: string; item: string; bought: boolean }[];
  maintenance: { id: string; device: string; lastService: string; nextService: string }[];
}

export interface MedicalProfile {
  bloodType: string;
  allergies: string[];
  medications: string[];
  contacts: { name: string; phone: string }[];
}

export interface SleepEntry {
  id: string;
  date: string;
  duration: number;
  quality: number;
}

export interface Habit {
  id: string;
  title: string;
  targetCount: number;
  completedDates: string[];
}

export interface AppState {
  health: HealthData;
  food: FoodEntry[];
  money: MoneyData;
  sleep: SleepEntry[];
  habits: Habit[];
  faith: FaithData;
  goals: Goal[];
  travel: TravelTrip[];
  home: HomeData;
  medical: MedicalProfile;
  productivity: {
    focusTimeToday: number;
    appUsage: Record<string, number>;
    mood: number; // 1-5
    personalityTraits: string[];
  };
  dailyQuestion: string;
  badges: string[];
  lifeMode: 'student' | 'employee' | 'athlete' | 'traveler' | 'standard';
}
