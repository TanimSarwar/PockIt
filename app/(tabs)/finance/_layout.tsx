import { Stack } from 'expo-router';
import { useTheme } from '../../../store/theme';

export default function FinanceLayout() {
  const { theme } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, animation: 'slide_from_right' }} />
  );
}
