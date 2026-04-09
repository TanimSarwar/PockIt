import React from 'react';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../../store/favorites';
import { TabScreen } from '../../../components/ui/TabScreen';
import { featuresByCategory } from '../../../constants/features';

const SECTIONS_IDS = [
  { title: '⏱ Time', ids: ['stopwatch', 'countdown-timer', 'pomodoro', 'world-clock', 'timezone-converter'] },
  { title: '📋 Productivity', ids: ['todo-list', 'habit-tracker', 'notes', 'flashcards'] },
  { title: '📖 Reference', ids: ['dictionary', 'translator', 'country-info', 'compass', 'prayer-times'] },
  { title: '🎲 Fun', ids: ['random-generator', 'coin-flip', 'drawing-pad'] },
];

export default function UtilitiesScreen() {
  const router = useRouter();
  const { addRecent } = useFavoritesStore();
  const allFeatures = featuresByCategory.utilities ?? [];

  const sections = SECTIONS_IDS.map((s) => ({
    title: s.title,
    features: s.ids.map((id) => {
      const f = allFeatures.find((feat) => feat.id === id);
      return f ? { ...f, description: undefined } : null;
    }).filter(Boolean) as typeof allFeatures,
  })).filter((s) => s.features.length > 0);

  return (
    <TabScreen
      title="Utilities"
      subtitle="Timers, notes & reference"
      icon="apps"
      category="utilities"
      sections={sections}
      onNavigate={(route, id) => { addRecent(id); router.push(route as any); }}
    />
  );
}
