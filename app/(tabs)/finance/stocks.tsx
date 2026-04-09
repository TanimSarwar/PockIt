import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { fetchStockPrice, searchStocks, type StockPrice, type StockSearchResult, ApiError } from '../../../lib/api';
import { lightImpact, mediumImpact, selectionFeedback } from '../../../lib/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 44) / 2;
const WATCHLIST_STORAGE_KEY = 'pockit-stock-watchlist';
const DEFAULT_WATCHLIST = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

interface StockData extends StockPrice {
  loading?: boolean;
  error?: string;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
    ), -1, false);
    return () => cancelAnimation(o);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, s]} />
  );
}

function StockCard({ symbol, data, onLongPress, theme }: { symbol: string; data: StockData; onLongPress: () => void; theme: any }) {
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);
  const isLoading = data?.loading;
  const hasData = data?.price !== undefined && data?.price !== null;
  const isUp = hasData && data.change >= 0;

  useEffect(() => {
    if (isLoading) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      bounce.value = withTiming(0);
    }
  }, [isLoading]);

  const pressIn = () => { scale.value = withTiming(0.95, { duration: 100 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 150 }); };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onLongPress={onLongPress} delayLongPress={500}>
      <Animated.View style={[sc.card, { backgroundColor: theme.colors.surface }, aStyle]}>
        <View style={[sc.playBtn, { backgroundColor: theme.colors.surfaceTertiary }]}>
          {isLoading ? (
            <PulseDot color={theme.colors.accent} />
          ) : (
            <MaterialCommunityIcons 
              name={isUp ? "trending-up" : "trending-down"} 
              size={14} 
              color={hasData ? (isUp ? theme.colors.success : theme.colors.error) : theme.colors.textTertiary} 
            />
          )}
        </View>
        <Animated.View style={[sc.iconWrap, bounceStyle]}>
          <Text style={sc.emoji}>{isUp ? '📈' : '📉'}</Text>
        </Animated.View>
        <View style={sc.info}>
          <Text style={[sc.name, { color: theme.colors.text }]} numberOfLines={1}>{symbol}</Text>
          {hasData ? (
            <>
              <Text style={[sc.price, { color: theme.colors.text }]}>${data?.price?.toFixed(2) || '0.00'}</Text>
              <Text style={[sc.tags, { color: isUp ? theme.colors.success : theme.colors.error }]} numberOfLines={1}>
                {isUp ? '+' : ''}{data?.change?.toFixed(2) || '0.00'} ({data?.changePercent || '0%'})
              </Text>
            </>
          ) : (
            <Text style={[sc.tags, { color: theme.colors.textTertiary }]}>{data?.error ? 'Error' : 'Pending...'}</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StocksScreen() {
  const { theme } = useTheme();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => { loadWatchlist(); }, []);
  useEffect(() => { if (watchlist.length > 0) refreshAll(); }, [watchlist]);

  const loadWatchlist = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setWatchlist(parsed.length > 0 ? parsed : DEFAULT_WATCHLIST);
      } else {
        setWatchlist(DEFAULT_WATCHLIST);
        await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(DEFAULT_WATCHLIST));
      }
    } catch { setWatchlist(DEFAULT_WATCHLIST); }
  }, []);

  const saveWatchlist = useCallback(async (list: string[]) => {
    try { await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(list)); } catch { }
  }, []);

  const fetchSingleStock = useCallback(async (symbol: string) => {
    setStockData((prev) => ({
      ...prev,
      [symbol]: { ...(prev[symbol] ?? ({} as StockData)), loading: true, error: undefined },
    }));
    try {
      const data = await fetchStockPrice(symbol);
      setStockData((prev) => ({ ...prev, [symbol]: { ...data, loading: false, error: undefined } }));
      setOfflineMessage(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch stock data';
      setStockData((prev) => ({
        ...prev,
        [symbol]: { ...(prev[symbol] ?? ({} as StockData)), loading: false, error: message },
      }));
      if (message.includes('timed out') || message.includes('Network') || message.includes('rate')) {
        setOfflineMessage('Unable to fetch stock data. Tiingo API limit may be reached.');
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setOfflineMessage(null);
    await Promise.allSettled(watchlist.map((symbol) => fetchSingleStock(symbol)));
    setIsRefreshing(false);
  }, [watchlist, fetchSingleStock]);

  const performSearch = useCallback(async (text: string) => {
    if (text.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const results = await searchStocks(text);
      setSearchResults(results || []);
    } catch { setSearchResults([]); } finally { setIsSearching(false); }
  }, []);

  const handleSearchChange = (text: string) => { setSearchText(text); performSearch(text); };

  const addSymbol = useCallback((symbolRaw: string) => {
    const symbol = symbolRaw.trim().toUpperCase();
    if (!symbol) return;
    if (watchlist.includes(symbol)) { Alert.alert('Duplicate', `${symbol} is already in your watchlist.`); return; }
    mediumImpact();
    const updated = [symbol, ...watchlist];
    setWatchlist(updated);
    saveWatchlist(updated);
    setSearchText('');
    setSearchResults([]);
  }, [watchlist, saveWatchlist]);

  const removeSymbol = useCallback((symbol: string) => {
    Alert.alert('Remove Stock', `Remove ${symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          mediumImpact();
          const updated = watchlist.filter((s) => s !== symbol);
          setWatchlist(updated);
          saveWatchlist(updated);
          setStockData((prev) => { const next = { ...prev }; delete next[symbol]; return next; });
        },
      },
    ]);
  }, [watchlist, saveWatchlist]);

  const watchlistWithGains = watchlist.map(s => ({ symbol: s, data: stockData[s] })).filter(i => i.data && i.data.price);
  const topStock = watchlistWithGains.length > 0 
    ? [...watchlistWithGains].sort((a, b) => parseFloat(b.data.changePercent) - parseFloat(a.data.changePercent))[0]
    : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader category="FINANCE / MARKET" title="Stock Tracker" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <LinearGradient colors={theme.palette.gradient as any} style={styles.featuredCard}>
          {topStock ? (
            <>
              <Pressable onPress={refreshAll} style={styles.featuredStopBtn}>
                <Text style={styles.featuredStopText}>REFRESH</Text>
                <MaterialCommunityIcons name="refresh" size={12} color={theme.colors.accent} />
              </Pressable>
              <Text style={styles.featuredLabel}>TOP GAINER</Text>
              <Text style={styles.featuredTitle}>{topStock.symbol} • ${topStock.data?.price?.toFixed(2) || '0.00'}</Text>
              <View style={styles.featuredPlay}>
                <MaterialCommunityIcons name="trending-up" size={18} color={theme.colors.success} />
                <Text style={[styles.featuredPlayText, { color: theme.colors.success }]}>+{topStock.data?.changePercent || '0%'}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.featuredLabel}>MARKET WATCH</Text>
              <Text style={styles.featuredTitle}>Track Your Wealth</Text>
              <Pressable onPress={refreshAll} style={styles.featuredPlay}>
                <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.accent} />
                <Text style={[styles.featuredPlayText, { color: theme.colors.accent }]}>Sync Prices</Text>
              </Pressable>
            </>
          )}
        </LinearGradient>

        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceTertiary }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.textTertiary} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: theme.colors.text }]}
              value={searchText}
              onChangeText={handleSearchChange}
              placeholder="Search symbol..."
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
            {isSearching && <ActivityIndicator size="small" color={theme.colors.accent} />}
          </View>

          {searchResults.length > 0 && (
            <View style={[styles.resultsDropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
              {searchResults.slice(0, 5).map((res) => (
                <Pressable
                  key={res.symbol}
                  onPress={() => { selectionFeedback(); addSymbol(res.symbol); }}
                  style={[styles.resultItem, { borderBottomColor: theme.colors.borderLight }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultSymbol, { color: theme.colors.text }]}>{res.symbol}</Text>
                    <Text style={[styles.resultName, { color: theme.colors.textTertiary }]} numberOfLines={1}>{res.name}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.accent} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {offlineMessage && (
          <View style={[styles.offlineBanner, { backgroundColor: theme.colors.warning + '15' }]}>
            <Text style={{ color: theme.colors.warning, fontSize: 11, textAlign: 'center', fontWeight: '600' }}>{offlineMessage}</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>MY WATCHLIST</Text>
        
        {watchlist.length === 0 && !searchText ? (
          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, alignItems: 'center', padding: 40 }]}>
            <MaterialCommunityIcons name="chart-line" size={48} color={theme.colors.textTertiary} style={{ opacity: 0.5 }} />
            <Text style={{ color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center', fontWeight: '600' }}>
              Your watchlist is empty
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {watchlist.map(symbol => (
              <StockCard key={symbol} symbol={symbol} data={stockData[symbol]} onLongPress={() => removeSymbol(symbol)} theme={theme} />
            ))}
          </View>
        )}

        <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface, marginTop: 12 }]}>
          <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>API Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.accent + '15', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="api" size={22} color={theme.colors.accent} />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>Tiingo Standard</Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: theme.colors.textSecondary }}>50 requests / hour remaining</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { width: CARD_W, borderRadius: 16, padding: 12, gap: 4, borderWidth: 1.5, borderColor: 'transparent', elevation: 2 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  info: { gap: 0 },
  name: { fontSize: 13, fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  tags: { fontSize: 10, fontWeight: '600' },
  playBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, right: 8, zIndex: 10 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  featuredCard: { borderRadius: 24, padding: 12, marginBottom: 20, minHeight: 110, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  featuredStopBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  featuredStopText: { color: '#6366F1', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' },
  featuredTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  featuredPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  featuredPlayText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginBottom: 16, marginTop: 8, letterSpacing: 1.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  searchSection: { marginBottom: 24, position: 'relative', zIndex: 100 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  resultsDropdown: { position: 'absolute', top: 58, left: 0, right: 0, borderRadius: 16, borderWidth: 1, elevation: 5, overflow: 'hidden' },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  resultSymbol: { fontSize: 15, fontWeight: '700' },
  resultName: { fontSize: 11, marginTop: 1 },
  settingsCard: { borderRadius: 24, padding: 20 },
  settingsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  offlineBanner: { padding: 12, borderRadius: 16, marginBottom: 20 },
});
