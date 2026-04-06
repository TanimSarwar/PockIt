import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  Animated,
  Easing,
  Image,
  Alert,
} from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../store/theme';
import { useAuthStore } from '../../store/auth';
import { lightImpact, mediumImpact } from '../../lib/haptics';
import { ThemeName } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client ID — replace with your own as needed
const GOOGLE_CLIENT_ID = '53251966571-a1gbke0fdtcvbt7401fo3vb54bolbktt.apps.googleusercontent.com';

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS = [
  { name: 'index', title: 'Daily', icon: 'calendar-blank' },
  { name: 'tools', title: 'Tools', icon: 'tools' },
  { name: 'finance', title: 'Finance', icon: 'cash-multiple' },
  { name: 'wellness', title: 'Wellness', icon: 'leaf' },
  { name: 'utilities', title: 'More', icon: 'dots-horizontal' },
] as const;

// ─── Animated Theme Button ──────────────────────────────────────────────────

function AnimatedThemeButton({ onPress, themeColors }: { onPress: () => void; themeColors: readonly [string, string] }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous spin
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // Pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable onPress={onPress} style={styles.themeBtn}>
      <Animated.View
        style={[
          styles.themeRingOuter,
          { transform: [{ rotate: spin }, { scale: pulseAnim }] },
        ]}
      >
        <LinearGradient
          colors={[themeColors[0], themeColors[1], themeColors[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.themeRingGradient}
        />
      </Animated.View>
      <View style={styles.themeInner}>
        <MaterialCommunityIcons name="palette" size={17} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

// ─── Google Auth Component ────────────────────────────────────

function GoogleAuthSection({ visible, onHide }: { visible: boolean, onHide: () => void }) {
  const { theme } = useTheme();
  const { user, isLoggedIn, setUser, logout } = useAuthStore();
  const isSecure = Platform.OS !== 'web' || (typeof window !== 'undefined' && window.isSecureContext);

  // We only call the hook if we are in a potentially secure context to avoid crashes
  // Hooks must be called in the same order, so we always call it but handle the result
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'pockit' }),
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
    }
  );

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      fetchGoogleUser(response.authentication.accessToken);
    }
  }, [response]);

  const fetchGoogleUser = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.email) {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          givenName: data.given_name || '',
          familyName: data.family_name || '',
          picture: data.picture || null,
        });
        mediumImpact();
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const handleLogin = () => {
    if (!isSecure) {
      Alert.alert('Insecure Context', 'Google Sign-In requires HTTPS or Localhost on Web. Please use http://localhost:8081 or https.');
      return;
    }
    lightImpact();
    promptAsync();
  };

  const userInitial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onHide}>
      <Pressable style={styles.modalOverlay} onPress={onHide}>
        <View style={[styles.profileContent, { backgroundColor: theme.colors.surface }]}>
          {isLoggedIn ? (
            /* ── Logged In View ── */
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarContainer}>
                {user?.picture ? (
                  <Image source={{ uri: user.picture }} style={styles.profileAvatarLarge} />
                ) : (
                  <LinearGradient colors={theme.palette.gradient as any} style={styles.profileAvatarLarge}>
                    <Text style={styles.profileAvatarText}>{userInitial}</Text>
                  </LinearGradient>
                )}
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]} />
              </View>
              
              <Text style={[styles.profileTitle, { color: theme.colors.text }]}>{user?.name}</Text>
              <Text style={[styles.profileSubtitle, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
              
              <View style={[styles.profileDivider, { backgroundColor: theme.colors.borderLight }]} />
              
              <Pressable 
                onPress={() => { logout(); onHide(); mediumImpact(); }} 
                style={[styles.profileActionBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
              >
                <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} />
                <Text style={[styles.profileActionText, { color: theme.colors.error }]}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            /* ── Not Logged In View ── */
            <View style={styles.profileHeader}>
              <View style={[styles.loginIconWrap, { backgroundColor: theme.colors.accentMuted }]}>
                <MaterialCommunityIcons name="shield-account-outline" size={42} color={theme.colors.accent} />
              </View>
              
              <Text style={[styles.profileTitle, { color: theme.colors.text }]}>Welcome back!</Text>
              <Text style={[styles.profileSubtitle, { color: theme.colors.textSecondary }]}>
                Sign in to sync your tools and keep your data safe across devices.
              </Text>
              
              {!isSecure ? (
                <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <MaterialCommunityIcons name="lock-alert-outline" size={20} color={theme.colors.textTertiary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    Google Sign-In requires a secure connection (localhost or HTTPS).
                  </Text>
                </View>
              ) : (
                <Pressable onPress={handleLogin} disabled={!request} style={styles.googleBtn}>
                  <View style={styles.googleIconCircle}>
                    <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                  </View>
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Global Header ──────────────────────────────────────────────────────────

function GlobalHeader() {
  const { theme, themeName, setThemeName } = useTheme();
  const { user, isLoggedIn } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const themes: { name: ThemeName; label: string; icon: any; color: string }[] = [
    { name: 'violet', label: 'Violet', icon: 'palette', color: '#7C3AED' },
    { name: 'ocean', label: 'Blue Ocean', icon: 'waves', color: '#0284C7' },
    { name: 'sunset', label: 'Evening Dusk', icon: 'weather-sunset', color: '#EC4899' },
    { name: 'forest', label: 'Nature Green', icon: 'leaf', color: '#059669' },
    { name: 'midnight', label: 'Midnight Sun', icon: 'moon-waning-crescent', color: '#4C1D95' },
  ];

  const userInitial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <>
      <View style={[styles.headerOuter, { paddingTop: insets.top + 8, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.headerIcon}><MaterialCommunityIcons name="menu" size={24} color={theme.colors.text} /></Pressable>
          <Text style={[styles.headerLogo, { color: '#FF4C9F' }]}>PockIt</Text>
        </View>

        <View style={styles.headerRight}>
          <AnimatedThemeButton onPress={() => setShowPicker(true)} themeColors={theme.palette.gradient} />
          <Pressable style={styles.avatarWrap} onPress={() => setShowProfile(true)}>
            {isLoggedIn && user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={theme.palette.gradient as any} style={styles.avatarGradient}>
                <Text style={styles.avatarInitial}>{isLoggedIn ? userInitial : ''}</Text>
                {!isLoggedIn && <MaterialCommunityIcons name="account" size={22} color="white" />}
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>

      {/* Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={[styles.pickerContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Select Appearance</Text>
            {themes.map((t) => (
              <Pressable key={t.name} onPress={() => { setThemeName(t.name); setShowPicker(false); lightImpact(); }}
                style={[styles.pickerItem, themeName === t.name && { backgroundColor: theme.colors.accentMuted }]}>
                <View style={[styles.pickerIcon, { backgroundColor: t.color + '20' }]}><MaterialCommunityIcons name={t.icon} size={20} color={t.color} /></View>
                <Text style={[styles.pickerLabel, { color: theme.colors.text }, themeName === t.name && { color: theme.colors.accent, fontWeight: '700' }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <GoogleAuthSection visible={showProfile} onHide={() => setShowProfile(false)} />
    </>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const ACTIVE_COLOR = theme.colors.accent;
  const PASSIVE_COLOR = theme.colors.textSecondary;
  const ACTIVE_BG = theme.colors.accentMuted;

  return (
    <View
      style={[
        styles.barOuter,
        {
          backgroundColor: theme.colors.surface,
          paddingBottom: insets.bottom || 12,
          borderTopColor: theme.colors.borderLight,
        },
      ]}
    >
      {TABS.map((tab, i) => {
        const focused = state.index === i;
        const color = focused ? ACTIVE_COLOR : PASSIVE_COLOR;

        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              lightImpact();
              const event = navigation.emit({ type: 'tabPress', target: state.routes[i]?.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(state.routes[i]?.name);
              }
            }}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.title}
          >
            <View style={[styles.navIconBg, focused && { backgroundColor: ACTIVE_BG }]}>
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={24}
                color={color}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color,
                  fontWeight: focused ? '700' : '500',
                },
              ]}
            >
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main Tabs Layout ───────────────────────────────────────────────────────

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <GlobalHeader />,
        headerShown: true,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerOuter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerLogo: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatarWrap: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', marginLeft: 8 },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 17 },
  avatarInitial: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  pickerContent: { width: '100%', maxWidth: 320, borderRadius: 32, padding: 24 },
  pickerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 6 },
  pickerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  pickerLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  barOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconBg: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  themeBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  themeRingOuter: { position: 'absolute', width: 34, height: 34, borderRadius: 17, overflow: 'hidden' },
  themeRingGradient: { flex: 1, borderRadius: 17 },
  themeInner: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  profileContent: { width: '90%', maxWidth: 340, borderRadius: 36, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 15 },
  profileHeader: { alignItems: 'center' },
  profileAvatarContainer: { position: 'relative', marginBottom: 16 },
  profileAvatarLarge: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  statusBadge: { position: 'absolute', right: 4, bottom: 4, width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: '#FFF' },
  profileTitle: { fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  profileSubtitle: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10, marginBottom: 24 },
  profileDivider: { width: '100%', height: 1, marginBottom: 20 },
  profileActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', paddingVertical: 14, borderRadius: 18 },
  profileActionText: { fontSize: 15, fontWeight: '700' },
  loginIconWrap: { width: 90, height: 90, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, width: '100%' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFFFFF', width: '100%', paddingVertical: 15, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  googleIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F3F4', alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: '#3C4043' },
});
