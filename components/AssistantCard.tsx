import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../store/theme';
import { AssistantAction } from '../lib/assistant';
import { useRouter } from 'expo-router';
import { lightImpact } from '../lib/haptics';

interface AssistantCardProps {
  action: AssistantAction;
  onClose: () => void;
}

export const AssistantCard: React.FC<AssistantCardProps> = ({ action, onClose }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handleAction = () => {
    lightImpact();
    router.push({
      pathname: action.targetRoute as any,
      params: action.params,
    });
  };

  const getIcon = () => {
    switch (action.intent) {
      case 'UNIT_CONVERT': return 'swap-horizontal';
      case 'CURRENCY_CONVERT': return 'currency-usd';
      case 'TIP_CALC': return 'cash-register';
      case 'PASSWORD_GEN': return 'lock-outline';
      case 'BMI_CALC': return 'human-male-height';
      case 'CALC': return 'calculator-variant-outline';
      case 'PRAYER_TIMES': return 'mosque';
      default: return 'lightning-bolt';
    }
  };

  const getLabel = () => {
    switch (action.intent) {
      case 'UNIT_CONVERT': return 'Unit Conversion';
      case 'CURRENCY_CONVERT': return 'Currency Conversion';
      case 'TIP_CALC': return 'Bill Splitter';
      case 'PASSWORD_GEN': return 'Password Generator';
      case 'BMI_CALC': return 'BMI Calculator';
      case 'CALC': return 'Calculator';
      case 'PRAYER_TIMES': return 'Prayer Times';
      default: return 'Assistant Suggestion';
    }
  };

  const getDescription = () => {
    const { params } = action;
    if (action.intent === 'UNIT_CONVERT' && params.value) {
      return `Convert ${params.value} ${params.from} to ${params.to}`;
    }
    if (action.intent === 'CURRENCY_CONVERT' && params.amount) {
      return `Convert ${params.amount} ${params.from} to ${params.to}`;
    }
    if (action.intent === 'TIP_CALC') {
      return `Split ${params.billAmount} between ${params.splitCount} people`;
    }
    if (action.intent === 'CALC') {
      return `Calculate ${params.expression}`;
    }
    return `Open ${getLabel()}`;
  };

  return (
    <Pressable 
      onPress={handleAction}
      style={({ pressed }) => [
        styles.container, 
        { 
          backgroundColor: theme.colors.accent,
          opacity: pressed ? 0.9 : 1,
          borderColor: theme.colors.accentDark,
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={getIcon() as any} size={20} color={theme.colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{getLabel()}</Text>
          <Text style={styles.description}>{getDescription()}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to perform action</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
