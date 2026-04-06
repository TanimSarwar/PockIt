import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/theme';
import { useSettingsStore } from '../store/settings';
import { lightImpact, selectionFeedback } from '../lib/haptics';

const { width, height } = Dimensions.get('window');

const PAGES = [
  {
    gradient: ['#7C3AED', '#4F46E5'] as const,
    icon:     'lightning-bolt' as const,
    iconBg:   'rgba(255,255,255,0.2)',
    tag:      'WELCOME',
    title:    'Your Pocket\nCompanion',
    desc:     'Everything you need, right in your pocket. One app, endless possibilities.',
    features: ['40+ built-in tools', 'Works offline', 'No subscriptions'],
  },
  {
    gradient: ['#0284C7', '#06B6D4'] as const,
    icon:     'toolbox-outline' as const,
    iconBg:   'rgba(255,255,255,0.2)',
    tag:      'FEATURES',
    title:    'Tools for\nEvery Moment',
    desc:     'Weather, calculators, meditation, habit tracking, stocks and so much more.',
    features: ['Finance & budgeting', 'Health & wellness', 'Productivity tools'],
  },
  {
    gradient: ['#059669', '#0891B2'] as const,
    icon:     'palette-outline' as const,
    iconBg:   'rgba(255,255,255,0.2)',
    tag:      'CUSTOMIZE',
    title:    'Make It\nYours',
    desc:     'Choose from 5 beautiful themes. Pin your favorites for instant access.',
    features: ['5 stunning themes', 'Dark & light mode', 'Pin favorites'],
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const router    = useRouter();
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef  = useRef<ScrollView>(null);
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.6)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    iconScaleAnim.setValue(0.6);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8,   useNativeDriver: true }),
      Animated.spring(iconScaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { animateIn(); }, [currentPage]);

  const handleScroll = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== currentPage) setCurrentPage(page);
  };

  const goNext = () => {
    selectionFeedback();
    if (currentPage < PAGES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentPage + 1) * width, animated: true });
    }
  };

  const finish = () => {
    lightImpact();
    setOnboardingComplete();
    router.replace('/');
  };

  const page = PAGES[currentPage];
  const isLast = currentPage === PAGES.length - 1;

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {PAGES.map((p, i) => (
          <LinearGradient
            key={i}
            colors={[...p.gradient]}
            style={[styles.page, { width }]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
        ))}
      </ScrollView>

      {/* Content overlay */}
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
            pointerEvents="none">
        {/* Icon */}
        <Animated.View
          style={[
            styles.iconCircle,
            { backgroundColor: page.iconBg, transform: [{ scale: iconScaleAnim }] },
          ]}
        >
          <MaterialCommunityIcons name={page.icon} size={64} color="#FFFFFF" />
        </Animated.View>

        {/* Tag + Title */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.tag}>{page.tag}</Text>
          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.desc}>{page.desc}</Text>

          {/* Feature bullets */}
          <View style={styles.bullets}>
            {page.features.map((f, i) => (
              <View key={i} style={styles.bullet}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{f}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <Pressable key={i} onPress={() => {
              selectionFeedback();
              scrollRef.current?.scrollTo({ x: i * width, animated: true });
            }}>
              <Animated.View
                style={[
                  styles.dot,
                  i === currentPage ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* CTA Button */}
        <Pressable
          style={styles.ctaButton}
          onPress={isLast ? finish : goNext}
        >
          <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <MaterialCommunityIcons
            name={isLast ? 'rocket-launch-outline' : 'arrow-right'}
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        {/* Skip */}
        {!isLast && (
          <Pressable onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7C3AED',
  },
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  tag: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  desc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 28,
  },
  bullets: {
    gap: 10,
    alignSelf: 'stretch',
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  bulletText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    width: '100%',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 4,
  },
  skipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
