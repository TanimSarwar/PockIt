import React from 'react';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../../store/favorites';
import { TabScreen } from '../../../components/ui/TabScreen';
import { featuresByCategory } from '../../../constants/features';

const SECTIONS_IDS = [
  { title: '📈 Tracking', ids: ['stocks', 'budget'] },
  { title: '🧮 Tools',    ids: ['calculator', 'loan-calculator', 'tax-estimator'] },
];

export default function FinanceScreen() {
  const router = useRouter();
  const { addRecent } = useFavoritesStore();
  const allFeatures = featuresByCategory.finance ?? [];
  const toolsFeatures = featuresByCategory.tools ?? [];
  const combined = [...allFeatures, ...toolsFeatures];

  const sections = SECTIONS_IDS.map((s) => ({
    title: s.title,
    features: s.ids.map((id) => {
      const f = combined.find((feat) => feat.id === id);
      return f ? { ...f, description: undefined } : null;
    }).filter(Boolean) as typeof allFeatures,
  })).filter((s) => s.features.length > 0);

  return (
    <TabScreen
      title="Finance"
      subtitle="Budgets, stocks & money"
      icon="chart-line"
      category="finance"
      sections={sections}
      onNavigate={(route, id) => { addRecent(id); router.push(route as any); }}
    />
  );
}
