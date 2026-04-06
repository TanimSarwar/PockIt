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
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTheme } from '../../../store/theme';
import { fetchStockPrice, type StockPrice, ApiError } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { lightImpact, mediumImpact } from '../../../lib/haptics';

// ─── Constants ────────────────────────────────────────────────────────────────

const WATCHLIST_STORAGE_KEY = 'pockit-stock-watchlist';
const DEFAULT_WATCHLIST = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockData extends StockPrice {
  loading?: boolean;
  error?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StocksScreen() {
  const { theme, isDark } = useTheme();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [searchText, setSearchText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // ─── Load watchlist from AsyncStorage ───────────────────────────────────

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    if (watchlist.length > 0) {
      refreshAll();
    }
  }, [watchlist]);

  const loadWatchlist = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setWatchlist(parsed.length > 0 ? parsed : DEFAULT_WATCHLIST);
      } else {
        setWatchlist(DEFAULT_WATCHLIST);
        await AsyncStorage.setItem(
          WATCHLIST_STORAGE_KEY,
          JSON.stringify(DEFAULT_WATCHLIST),
        );
      }
    } catch {
      setWatchlist(DEFAULT_WATCHLIST);
    }
  }, []);

  const saveWatchlist = useCallback(async (list: string[]) => {
    try {
      await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Silent fail for storage
    }
  }, []);

  // ─── Fetch stock data ───────────────────────────────────────────────────

  const fetchSingleStock = useCallback(async (symbol: string) => {
    setStockData((prev) => ({
      ...prev,
      [symbol]: { ...(prev[symbol] ?? ({} as StockData)), loading: true, error: undefined },
    }));

    try {
      const data = await fetchStockPrice(symbol);
      setStockData((prev) => ({
        ...prev,
        [symbol]: { ...data, loading: false, error: undefined },
      }));
      setOfflineMessage(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to fetch stock data';
      setStockData((prev) => ({
        ...prev,
        [symbol]: {
          ...(prev[symbol] ?? ({} as StockData)),
          loading: false,
          error: message,
        },
      }));

      if (
        message.includes('timed out') ||
        message.includes('Network') ||
        message.includes('rate')
      ) {
        setOfflineMessage(
          'Unable to fetch stock data. You may be offline or the API rate limit has been reached. Free API keys allow 25 requests per day.',
        );
      }
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    setOfflineMessage(null);

    const promises = watchlist.map((symbol) => fetchSingleStock(symbol));
    await Promise.allSettled(promises);

    setIsRefreshing(false);
  }, [watchlist, fetchSingleStock]);

  // ─── Watchlist management ───────────────────────────────────────────────

  const addSymbol = useCallback(
    (symbolRaw: string) => {
      const symbol = symbolRaw.trim().toUpperCase();
      if (!symbol) return;
      if (watchlist.includes(symbol)) {
        Alert.alert('Duplicate', `${symbol} is already in your watchlist.`);
        return;
      }
      mediumImpact();
      const updated = [symbol, ...watchlist];
      setWatchlist(updated);
      saveWatchlist(updated);
      setSearchText('');
    },
    [watchlist, saveWatchlist],
  );

  const removeSymbol = useCallback(
    (symbol: string) => {
      Alert.alert(
        'Remove Stock',
        `Remove ${symbol} from your watchlist?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              mediumImpact();
              const updated = watchlist.filter((s) => s !== symbol);
              setWatchlist(updated);
              saveWatchlist(updated);
              setStockData((prev) => {
                const next = { ...prev };
                delete next[symbol];
                return next;
              });
            },
          },
        ],
      );
    },
    [watchlist, saveWatchlist],
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      addSymbol(searchText);
    }
  }, [searchText, addSymbol]);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (pct: string): string => {
    // Alpha Vantage returns strings like "1.23%"
    if (!pct) return '0.00%';
    const num = parseFloat(pct.replace('%', ''));
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return theme.colors.success;
    if (change < 0) return theme.colors.error;
    return theme.colors.textSecondary;
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  const renderStockItem = (symbol: string) => {
    const data = stockData[symbol];
    const isLoading = data?.loading;
    const hasError = data?.error && !data?.price;
    const hasData = data?.price !== undefined && data?.price !== null;

    return (
      <Pressable
        key={symbol}
        onLongPress={() => removeSymbol(symbol)}
        delayLongPress={500}
        accessibilityLabel={`${symbol} stock. Long press to remove.`}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.stockItem,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.borderLight,
            },
            theme.shadows.sm,
          ]}
        >
          <View style={styles.stockLeft}>
            <Text
              style={[
                theme.typography.h4,
                { color: theme.colors.text },
              ]}
              numberOfLines={1}
            >
              {symbol}
            </Text>
            {hasData && (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, marginTop: 2 },
                ]}
              >
                {data.latestTradingDay}
              </Text>
            )}
          </View>

          <View style={styles.stockRight}>
            {isLoading && (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            )}
            {hasError && !isLoading && (
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={20}
                color={theme.colors.error}
              />
            )}
            {hasData && !isLoading && (
              <>
                <Text
                  style={[
                    theme.typography.h4,
                    { color: theme.colors.text, textAlign: 'right' },
                  ]}
                >
                  ${formatPrice(data.price)}
                </Text>
                <View style={styles.changeRow}>
                  <MaterialCommunityIcons
                    name={data.change >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={14}
                    color={getChangeColor(data.change)}
                  />
                  <Text
                    style={[
                      theme.typography.bodySm,
                      {
                        color: getChangeColor(data.change),
                        marginLeft: 2,
                      },
                    ]}
                  >
                    {formatChange(data.change)}
                  </Text>
                  <View
                    style={[
                      styles.changeBadge,
                      {
                        backgroundColor:
                          data.change >= 0
                            ? theme.colors.successBg
                            : theme.colors.errorBg,
                        borderRadius: theme.borderRadius.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: getChangeColor(data.change),
                          fontFamily: theme.fontFamily.semiBold,
                        },
                      ]}
                    >
                      {formatChangePercent(data.changePercent)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            lightImpact();
            router.back();
          }}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
        <Text style={[theme.typography.h3, { color: theme.colors.text, flex: 1 }]}>
          Stocks
        </Text>
        <Pressable
          onPress={() => {
            lightImpact();
            refreshAll();
          }}
          style={styles.refreshButton}
          accessibilityLabel="Refresh stock prices"
          accessibilityRole="button"
          hitSlop={12}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <MaterialCommunityIcons
              name="refresh"
              size={24}
              color={theme.colors.accent}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Search / Add Symbol */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              theme.typography.body,
              { color: theme.colors.text },
            ]}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Add symbol (e.g. AAPL)"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSearchSubmit}
            underlineColorAndroid="transparent"
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={handleSearchSubmit}
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.colors.accent,
                  borderRadius: theme.borderRadius.sm,
                },
              ]}
              accessibilityLabel="Add symbol to watchlist"
              accessibilityRole="button"
              hitSlop={8}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Offline / Rate Limited Message */}
        {offlineMessage && (
          <View
            style={[
              styles.offlineBanner,
              {
                backgroundColor: theme.colors.warningBg,
                borderRadius: theme.borderRadius.md,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="wifi-off"
              size={20}
              color={theme.colors.warning}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.warning, flex: 1 },
              ]}
            >
              {offlineMessage}
            </Text>
          </View>
        )}

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chart-line"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' },
              ]}
            >
              Your watchlist is empty.{'\n'}Search for a stock symbol to get started.
            </Text>
          </View>
        ) : (
          <View style={styles.stockList}>
            <Text
              style={[
                theme.typography.label,
                {
                  color: theme.colors.textTertiary,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                },
              ]}
            >
              Watchlist
            </Text>
            {watchlist.map(renderStockItem)}
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.textTertiary,
                  textAlign: 'center',
                  marginTop: 16,
                },
              ]}
            >
              Long press a stock to remove it from your watchlist
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  refreshButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    borderWidth: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  addButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  stockList: {
    gap: 8,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  stockLeft: {
    flex: 1,
    marginRight: 16,
  },
  stockRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
});
