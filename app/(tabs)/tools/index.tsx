import React from 'react';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../../../store/favorites';
import { TabScreen } from '../../../components/ui/TabScreen';
import { featuresByCategory } from '../../../constants/features';

const SECTIONS_IDS = [
  { title: '🔄 Converters', ids: ['unit-converter', 'currency-converter', 'number-base'] },
  { title: '🛡️ Generators', ids: ['password-generator', 'qr-generator'] },
  { title: '🛠 Handy', ids: ['barcode-scanner', 'color-picker', 'tip-calculator', 'age-calculator'] },
];

export default function ToolsScreen() {
  const router = useRouter();
  const { addRecent } = useFavoritesStore();
  const allFeatures = featuresByCategory.tools ?? [];

  const sections = SECTIONS_IDS.map((s) => ({
    title: s.title,
    features: s.ids.map((id) => {
      const f = allFeatures.find((feat) => feat.id === id);
      return f ? { ...f, description: undefined } : null;
    }).filter(Boolean) as typeof allFeatures,
  })).filter((s) => s.features.length > 0);

  return (
    <TabScreen
      title="Tools"
      subtitle="Converters & generators"
      icon="toolbox"
      category="tools"
      sections={sections}
      onNavigate={(route, id) => { addRecent(id); router.push(route as any); }}
    />
  );
}
