import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  withDelay,
  FadeInDown
} from 'react-native-reanimated';

import { useTheme } from '../../store/theme';
import { CATEGORY_COLORS, type FeatureCategory } from '../../constants/theme';
import { lightImpact } from '../../lib/haptics';

interface FeatureCardProps {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  onLongPress?: () => void;
  isPinned?: boolean;
  size?: 'small' | 'medium';
  category?: FeatureCategory;
  /** Override icon background color */
  iconBg?: string;
  /** Override icon color */
  iconColor?: string;
  /** Layout mode */
  layout?: 'regular' | 'wide' | 'narrow';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  onPress,
  onLongPress,
  isPinned,
  size = 'medium',
  category,
  iconBg,
  iconColor,
  layout = 'regular',
}) => {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const iconDraw = useSharedValue(0);
  const iconRotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  React.useEffect(() => {
    const delay = Platform.OS === 'web' ? 100 : 300;
    iconDraw.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 150 }));
    iconRotate.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 120 }));
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconDraw.value,
    transform: [
      { scale: iconDraw.value },
      { rotate: `${(1 - iconRotate.value) * 15}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    lightImpact();
    onPress();
  };

  const isSmall = size === 'small';

  // Resolve icon colors: explicit > category > theme accent
  const catColors = category
    ? isDark
      ? CATEGORY_COLORS[category]?.dark
      : CATEGORY_COLORS[category]?.light
    : null;

  const resolvedIconColor = iconColor ?? catColors?.icon ?? theme.colors.accent;

  const iconSize      = isSmall ? 18 : 22;
  const iconBoxSize   = isSmall ? 40 : 48;

  const isNarrow = layout === 'narrow';
  const isWide = layout === 'wide';
  const isRegular = layout === 'regular';

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={title}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            paddingVertical: 16,
            paddingHorizontal: 12,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 110,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.03,
            shadowRadius: 10,
          },
        ]}
      >
        {/* Icon (No Background) */}
        <Animated.View
          style={[
            styles.iconBox,
            {
              width: iconBoxSize,
              height: iconBoxSize,
              marginBottom: 10,
            },
            iconAnimatedStyle
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={isNarrow ? 20 : iconSize + 2}
            color={resolvedIconColor}
          />
        </Animated.View>

        {/* Pick Toggle Button */}
        <Pressable 
          onPress={(e) => { 
            e.stopPropagation(); 
            lightImpact(); 
            onLongPress?.(); 
          }}
          style={[
            styles.pickBtn, 
            { 
              backgroundColor: isPinned ? theme.colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
              borderColor: isPinned ? theme.colors.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
            }
          ]}
        >
          <MaterialCommunityIcons 
            name={isPinned ? "star" : "star-outline"} 
            size={isNarrow ? 12 : 14} 
            color={isPinned ? "#FFFFFF" : theme.colors.textTertiary} 
          />
        </Pressable>

        {/* Text Container */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: 14,
                fontFamily: theme.fontFamily.bold,
                textAlign: 'center',
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        {isNarrow && (
           <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textTertiary} style={{ opacity: 0.4 }} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
  },
  title: {
    lineHeight: 20,
  },
  description: {
    fontSize: 11,
    opacity: 0.8,
  },
});
