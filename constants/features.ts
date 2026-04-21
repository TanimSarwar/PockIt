export type FeatureCategory = 'daily' | 'tools' | 'finance' | 'wellness' | 'utilities';

export interface Feature {
  id: string;
  name: string;
  icon: string;
  route: string;
  category: FeatureCategory;
  description?: string;
  layout?: 'regular' | 'wide' | 'narrow';
}

export const features: Feature[] = [
  // ─── Home ────────────────────────────────────────────────────────────────
  { id: 'weather', name: 'Weather', icon: 'weather-partly-cloudy', route: '/(tabs)/tools/weather', category: 'daily', description: 'Current weather and 14-day forecast' },
  { id: 'quote', name: 'Daily Quote', icon: 'format-quote-open', route: '/(tabs)', category: 'daily', description: 'Inspirational quote of the day' },
  { id: 'horoscope', name: 'Horoscope', icon: 'zodiac-gemini', route: '/(tabs)', category: 'daily', description: 'Your daily horoscope' },

  // ─── Tools ────────────────────────────────────────────────────────────────
  { id: 'unit-converter', name: 'Unit Converter', icon: 'swap-horizontal', route: '/(tabs)/tools/unit-converter', category: 'tools', description: 'Convert length, weight, temperature & more', layout: 'regular' },
  { id: 'barcode-scanner', name: 'Universal Scanner', icon: 'barcode-scan', route: '/(tabs)/tools/barcode-scanner', category: 'tools', description: 'Barcode & QR code scanner', layout: 'regular' },
  { id: 'password-generator', name: 'Password Gen', icon: 'lock-outline', route: '/(tabs)/tools/password-generator', category: 'tools', description: 'Generate strong random passwords', layout: 'regular' },
  { id: 'currency-converter', name: 'Currency', icon: 'currency-usd', route: '/(tabs)/tools/currency-converter', category: 'tools', description: 'Live currency exchange rates', layout: 'regular' },
  { id: 'color-picker', name: 'Color Picker', icon: 'palette-outline', route: '/(tabs)/tools/color-picker', category: 'tools', description: 'HEX, RGB, HSL color converter', layout: 'regular' },
  { id: 'qr-generator', name: 'QR Generator', icon: 'qrcode', route: '/(tabs)/tools/qr-generator', category: 'tools', description: 'Generate QR codes from text or URLs', layout: 'regular' },
  { id: 'number-base', name: 'Number Base', icon: 'numeric', route: '/(tabs)/tools/number-base', category: 'tools', description: 'Binary, hex, octal, decimal converter', layout: 'regular' },
  { id: 'tip-calculator', name: 'Tip Calculator', icon: 'cash-register', route: '/(tabs)/tools/tip-calculator', category: 'tools', description: 'Calculate tips and split bills', layout: 'regular' },
  { id: 'loan-calculator', name: 'Loan Calculator', icon: 'bank-outline', route: '/(tabs)/tools/loan-calculator', category: 'tools', description: 'Calculate loan EMI and interest', layout: 'regular' },
  { id: 'tax-estimator', name: 'Tax Estimator', icon: 'file-percent-outline', route: '/(tabs)/tools/tax-estimator', category: 'tools', description: 'Estimate your federal tax', layout: 'regular' },
  { id: 'age-calculator', name: 'Age Calculator', icon: 'calendar-account', route: '/(tabs)/tools/age-calculator', category: 'tools', description: 'Calculate precise age and next birthday', layout: 'regular' },

  // ─── Finance ──────────────────────────────────────────────────────────────
  { id: 'budget', name: 'Budget Tracker', icon: 'wallet-outline', route: '/(tabs)/finance/budget', category: 'finance', description: 'Track income and expenses', layout: 'regular' },
  { id: 'stocks', name: 'Stock Prices', icon: 'chart-line', route: '/(tabs)/finance/stocks', category: 'finance', description: 'Track stock prices and changes', layout: 'regular' },
  { id: 'calculator', name: 'Calculator', icon: 'calculator-variant-outline', route: '/(tabs)/finance/calculator', category: 'finance', description: 'Standard and scientific calculator', layout: 'regular' },

  // ─── Wellness ─────────────────────────────────────────────────────────────
  { id: 'meditation', name: 'Meditation', icon: 'meditation', route: '/(tabs)/wellness/meditation', category: 'wellness', description: 'Timed meditation sessions', layout: 'regular' },
  { id: 'breathing', name: 'Breathing', icon: 'weather-windy', route: '/(tabs)/wellness/breathing', category: 'wellness', description: 'Box breathing & 4-7-8 exercises', layout: 'regular' },
  { id: 'step-counter', name: 'Step Counter', icon: 'shoe-print', route: '/(tabs)/wellness/step-counter', category: 'wellness', description: 'Count your daily steps', layout: 'regular' },
  { id: 'water-tracker', name: 'Water Tracker', icon: 'cup-water', route: '/(tabs)/wellness/water-tracker', category: 'wellness', description: 'Track daily water intake', layout: 'regular' },
  { id: 'sleep-tracker', name: 'Sleep Tracker', icon: 'power-sleep', route: '/(tabs)/wellness/sleep-tracker', category: 'wellness', description: 'Log and analyze your sleep', layout: 'regular' },
  { id: 'bmi-calculator', name: 'BMI Calculator', icon: 'human-male-height', route: '/(tabs)/wellness/bmi-calculator', category: 'wellness', description: 'Calculate body mass index', layout: 'regular' },
  { id: 'sounds', name: 'Soothing Sounds', icon: 'music-note', route: '/(tabs)/wellness/sounds', category: 'wellness', description: 'Rain, ocean, forest & white noise', layout: 'regular' },
  { id: 'mood-tracker', name: 'Mood Tracker', icon: 'emoticon-outline', route: '/(tabs)/wellness/mood-tracker', category: 'wellness', description: 'Log and track your daily emotions', layout: 'regular' },

  // ─── Utilities ────────────────────────────────────────────────────────────
  { id: 'habit-tracker', name: 'Habit Tracker', icon: 'chart-timeline-variant-shimmer', route: '/(tabs)/utilities/habit-tracker', category: 'utilities', description: 'Build streaks and track habits', layout: 'regular' },
  { id: 'todo-list', name: 'To-Do List', icon: 'checkbox-marked-outline', route: '/(tabs)/utilities/todo-list', category: 'utilities', description: 'Tasks with priorities and due dates', layout: 'regular' },
  { id: 'pomodoro', name: 'Pomodoro', icon: 'clock-check-outline', route: '/(tabs)/utilities/pomodoro', category: 'utilities', description: 'Focus with Pomodoro technique', layout: 'regular' },
  { id: 'stopwatch', name: 'Stopwatch', icon: 'timer-outline', route: '/(tabs)/utilities/stopwatch', category: 'utilities', description: 'Stopwatch with lap tracking', layout: 'regular' },
  { id: 'countdown-timer', name: 'Countdown Timer', icon: 'timer-sand', route: '/(tabs)/utilities/countdown-timer', category: 'utilities', description: 'Multiple simultaneous timers', layout: 'regular' },
  { id: 'world-clock', name: 'World Clock', icon: 'earth', route: '/(tabs)/utilities/world-clock', category: 'utilities', description: 'Time in cities worldwide', layout: 'regular' },
  { id: 'notes', name: 'Quick Notes', icon: 'note-text-outline', route: '/(tabs)/utilities/notes', category: 'utilities', description: 'Jot down thoughts quickly', layout: 'regular' },
  { id: 'dictionary', name: 'Dictionary', icon: 'book-alphabet', route: '/(tabs)/utilities/dictionary', category: 'utilities', description: 'Word definitions and synonyms', layout: 'regular' },
  { id: 'translator', name: 'Translator', icon: 'translate', route: '/(tabs)/utilities/translator', category: 'utilities', description: 'Translate text between languages', layout: 'regular' },
  { id: 'country-info', name: 'Country Info', icon: 'flag-outline', route: '/(tabs)/utilities/country-info', category: 'utilities', description: 'Country flags, capitals & facts', layout: 'regular' },
  { id: 'timezone-converter', name: 'Time Zones', icon: 'clock-outline', route: '/(tabs)/utilities/timezone-converter', category: 'utilities', description: 'Convert between time zones', layout: 'regular' },
  { id: 'random-generator', name: 'Random & Dice', icon: 'dice-multiple-outline', route: '/(tabs)/utilities/random-generator', category: 'utilities', description: 'Random numbers and dice roller', layout: 'regular' },
  { id: 'flashcards', name: 'Flashcards', icon: 'cards-outline', route: '/(tabs)/utilities/flashcards', category: 'utilities', description: 'Create and study flashcard decks', layout: 'regular' },
  { id: 'drawing-pad', name: 'Drawing Pad', icon: 'draw', route: '/(tabs)/utilities/drawing-pad', category: 'utilities', description: 'Doodle and sketch freely', layout: 'regular' },
  { id: 'coin-flip', name: 'Coin Flip', icon: 'circle-half-full', route: '/(tabs)/utilities/coin-flip', category: 'utilities', description: 'Flip a coin with animation', layout: 'regular' },
  { id: 'compass', name: 'Compass', icon: 'compass-outline', route: '/(tabs)/utilities/compass', category: 'utilities', description: 'Digital direction compass', layout: 'regular' },
  { id: 'prayer-times', name: 'Prayer Times', icon: 'mosque', route: '/(tabs)/utilities/prayer-times', category: 'utilities', description: 'Daily Salah, sunrise & sunset times', layout: 'regular' },
  { id: 'event-planner', name: 'Event Planner', icon: 'calendar-heart', route: '/(tabs)/utilities/event-planner', category: 'utilities', description: 'Plan events and get heart-warming reminders', layout: 'regular' },
  
];

export interface CategoryInfo {
  id: FeatureCategory;
  label: string;
  icon: string;
  description: string;
}

export const categories: CategoryInfo[] = [
  { id: 'daily', label: 'Home', icon: 'home-variant', description: 'Weather, quotes & horoscope' },
  { id: 'tools', label: 'Tools', icon: 'toolbox', description: 'Converters, generators & calculators' },
  { id: 'finance', label: 'Finance', icon: 'chart-line', description: 'Stocks, budget & calculator' },
  { id: 'wellness', label: 'Wellness', icon: 'heart-pulse', description: 'Sounds, breathing & trackers' },
  { id: 'utilities', label: 'Utilities', icon: 'apps', description: 'Timers, notes, dictionary & more' },

];

export type GroupedFeatures = Record<FeatureCategory, Feature[]>;

export const featuresByCategory: GroupedFeatures = features.reduce((acc, feature) => {
  if (!acc[feature.category]) acc[feature.category] = [];
  acc[feature.category].push(feature);
  return acc;
}, {} as GroupedFeatures);

export function getFeatureById(id: string): Feature | undefined {
  return features.find((f) => f.id === id);
}

export function searchFeatures(query: string): Feature[] {
  const q = query.toLowerCase().trim();
  if (!q) return features;
  return features.filter(
    (f) => f.name.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
  );
}
