import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../store/theme';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, rightAction, onBack }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.background }]}>
      <Pressable onPress={handleBack} accessibilityLabel="Go back" hitSlop={8}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
      </Pressable>
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>{title}</Text>
      {rightAction || <View style={{ width: 24 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 12 },
});
