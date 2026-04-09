import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Dimensions, Image, Modal as RNModal, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Button } from '../../../components/ui';
import { lightImpact, selectionFeedback } from '../../../lib/haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAllCountries, fetchCountryDetails, CountryData } from '../../../lib/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 44) / 2; // 16 padding * 2 + 12 gap

const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

function AnimatedStatIcon({ name, color }: { name: any; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name={name} size={18} color={color} />
    </Animated.View>
  );
}

export default function CountryInfoScreen() {
  const { theme } = useTheme();
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [selected, setSelected] = useState<CountryData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchAllCountries();
      setCountries(data.sort((a, b) => a.name.common.localeCompare(b.name.common)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (c: CountryData) => {
    selectionFeedback();
    setSelected(c); // Set basic data first for title
    setDetailsLoading(true);
    try {
      const full = await fetchCountryDetails(c.cca3);
      setSelected(full);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return countries.filter((c) => {
      const matchSearch = !search || 
        c.name.common.toLowerCase().includes(search.toLowerCase()) || 
        c.cca3.toLowerCase().includes(search.toLowerCase());
      const matchRegion = region === 'All' || c.region === region;
      return matchSearch && matchRegion;
    });
  }, [countries, search, region]);

  const renderItem = ({ item }: { item: CountryData }) => (
    <Pressable 
      onPress={() => openDetails(item)}
      style={({ pressed }) => [styles.gridItem, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.countryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceSecondary }]}>
        <View style={styles.flagContainer}>
          <Image source={{ uri: item.flags.png }} style={styles.gridFlag} resizeMode="cover" />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name.common}
        </Text>
        <Text style={[styles.capital, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {(item.capital?.[0] || 'Unknown').toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader category="UTILITIES / TOOLS" title="Country Info" />

      <View style={styles.topBar}>
        <SearchBar 
          value={search} 
          onChangeText={setSearch} 
          placeholder="Search 250+ countries..." 
          containerStyle={{ backgroundColor: theme.colors.surface, elevation: 2, borderRadius: 24 }}
        />
        
        <View style={styles.pickerWrapper}>
          <FlatList
            horizontal
            style={styles.regionPicker}
            data={REGIONS}
               keyExtractor={r => r}
               showsHorizontalScrollIndicator={false}
               renderItem={({ item: r }) => (
                 <Pressable
                   style={[
                     styles.regionPill, 
                     { backgroundColor: region === r ? theme.colors.accent : theme.colors.surfaceSecondary }
                   ]}
                onPress={() => { selectionFeedback(); setRegion(r); }}
              >
                <Text style={[styles.regionPillText, { color: region === r ? '#fff' : theme.colors.textSecondary }]}>
                  {r}
                </Text>
              </Pressable>
            )}
          />
          <View style={[styles.scrollIndicator, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <MaterialCommunityIcons name="chevron-right" size={14} color={theme.colors.textTertiary} />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>Syncing global data...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={c => c.cca3}
          numColumns={2}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="map-search-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                {countries.length === 0 ? "Failed to sync global data" : "No countries match your search"}
              </Text>
              {countries.length === 0 && (
                <Pressable onPress={loadData} style={[styles.retryBtn, { backgroundColor: theme.colors.accentMuted }]}>
                  <Text style={{ color: theme.colors.accent, fontWeight: '800', fontSize: 12 }}>RETRY SYNC</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

       {/* Details Modal (Centered Blur Style) */}
      <RNModal 
        visible={selected !== null} 
        transparent 
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          
          {selected && (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                 <Image source={{ uri: selected.flags.png }} style={styles.modalFlag} />
                 <View style={styles.headerInfo}>
                    <Text style={[styles.nameText, { color: theme.colors.text }]}>{selected.name.common}</Text>
                    <Text style={[styles.officialName, { color: theme.colors.textTertiary }]}>{selected.name.official}</Text>
                 </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                {detailsLoading ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                    <Text style={[styles.loadingText, { color: theme.colors.textTertiary }]}>FETCHING DEEP INTEL...</Text>
                  </View>
                ) : (
                  <View style={styles.detailsContainer}>
                    {/* STATS GRID (Small Info) */}
                    <View style={styles.statsGrid}>
                       {[
                         { label: 'POPULATION', value: selected.population.toLocaleString(), icon: 'account-group' },
                         { label: 'AREA', value: `${selected.area.toLocaleString()} km²`, icon: 'texture-box' },
                         { label: 'CONTINENT', value: selected.continents?.[0] || 'N/A', icon: 'earth' },
                         { label: 'CAR SIDE', value: (selected.car?.side || 'N/A').toUpperCase(), icon: 'car-outline' },
                       ].map((item, idx) => (
                         <View key={idx} style={[styles.statItem, { backgroundColor: theme.colors.surfaceSecondary }]}>
                           <AnimatedStatIcon name={item.icon} color={theme.colors.accent} />
                           <View style={{ flex: 1 }}>
                              <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>{item.label}</Text>
                              <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={1}>{item.value}</Text>
                           </View>
                         </View>
                       ))}
                    </View>

                    {/* FULL WIDTH DETAILS (Long Text Content) */}
                    <View style={styles.fullStats}>
                       {[
                         { label: 'CURRENCY', value: Object.values(selected.currencies || {}).map(c => `${c.name} (${c.symbol})`).join(', ') || 'N/A', icon: 'cash' },
                         { label: 'LANGUAGES', value: Object.values(selected.languages || {}).join(', ') || 'N/A', icon: 'translate' },
                         { label: 'TIMEZONES', value: selected.timezones?.join(', ') || 'N/A', icon: 'clock-outline' },
                         { label: 'NEIGHBORS', value: selected.borders?.join(', ') || 'NONE', icon: 'map-marker-path' },
                         { label: 'GINI INDEX (INEQUALITY)', value: selected.gini ? `${Object.values(selected.gini)[0]}%` : 'DATA NOT AVAILABLE', icon: 'chart-bell-curve' },
                       ].map((item, idx) => (
                         <View key={idx} style={[styles.fullStatRow, { backgroundColor: theme.colors.surfaceSecondary }]}>
                            <View style={styles.fullStatIcon}>
                               <AnimatedStatIcon name={item.icon} color={theme.colors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                               <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>{item.label}</Text>
                               <Text style={[styles.statValue, { color: theme.colors.text }]}>{item.value}</Text>
                            </View>
                         </View>
                       ))}
                    </View>

                    <Text style={styles.noteText}>Deep encyclopedic data (History/Military) sourced from global records.</Text>
                  </View>
                )}
              </ScrollView>

              <Button 
                title="BACK TO GRID" 
                onPress={() => setSelected(null)} 
                style={{ marginTop: 20, width: '100%', borderRadius: 16 }}
              />
            </Animated.View>
          )}
        </View>
      </RNModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  pickerWrapper: { flexDirection: 'row', alignItems: 'center' },
  regionPicker: { flex: 1 },
  regionPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
  regionPillText: { fontSize: 11, fontWeight: '800' },
  scrollIndicator: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 4, opacity: 0.5 },
  
  gridItem: { width: COLUMN_WIDTH, marginBottom: 12 },
  countryCard: { borderRadius: 24, padding: 12, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  flagContainer: { width: 50, height: 34, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  gridFlag: { width: '100%', height: '100%' },
  name: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  capital: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', borderRadius: 32, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 20 },
  modalScroll: { flexGrow: 0 },
  modalFlag: { width: 70, height: 46, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  headerInfo: { flex: 1, gap: 2 },
  nameText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  officialName: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
  
  modalLoading: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  
  detailsContainer: { gap: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  statItem: { width: '48.5%', padding: 12, borderRadius: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  
  fullStats: { gap: 10 },
  fullStatRow: { padding: 14, borderRadius: 20, flexDirection: 'row', gap: 14, alignItems: 'center' },
  fullStatIcon: { width: 24, alignItems: 'center' },
  
  statLabel: { fontSize: 7.5, fontWeight: '800', letterSpacing: 0.8 },
  statValue: { fontSize: 11.5, fontWeight: '800', marginTop: 1 },
  
  noteText: { fontSize: 9, opacity: 0.4, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  retryBtn: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  empty: { padding: 40, alignItems: 'center', opacity: 0.5 },
});
