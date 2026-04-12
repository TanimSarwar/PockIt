import React from 'react';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../../store/favorites';
import { TabScreen } from '../../../components/ui/TabScreen';
import { featuresByCategory } from '../../../constants/features';

const SECTIONS_IDS = [
  { title: '✨ Comfort',     ids: ['sounds'] },
  { title: '🧘 Mindfulness', ids: ['meditation', 'breathing'] },
  { title: '📈 Daily Progress', ids: ['step-counter', 'water-tracker', 'sleep-tracker', 'bmi-calculator'] },
];

export default function WellnessScreen() {
  const router = useRouter();
  const { addRecent } = useFavoritesStore();
  const allFeatures = featuresByCategory.wellness ?? [];

  const sections = SECTIONS_IDS.map((s) => ({
    title: s.title,
    features: s.ids.map((id) => {
      const f = allFeatures.find((feat) => feat.id === id);
      return f ? { ...f, description: undefined } : null;
    }).filter(Boolean) as typeof allFeatures,
  })).filter((s) => s.features.length > 0);

  return (
    <TabScreen
      title="Wellness"
      subtitle="Health, mindfulness & care"
      icon="heart-pulse"
      category="wellness"
      sections={sections}
      onNavigate={(route, id) => { addRecent(id); router.push(route as any); }}
    />
  );
}
