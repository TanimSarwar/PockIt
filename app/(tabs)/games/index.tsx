import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../../store/theme';
import { lightImpact } from '../../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GAMES = [
  {
    id: 'snake',
    name: 'Classic Snake',
    icon: 'snake',
    description: 'Grow your snake and avoid hitting walls or yourself.',
    color: '#10B981',
    route: '/(tabs)/games/snake',
  },
  {
    id: '2048',
    name: '2048 Puzzle',
    icon: 'numeric-2-box',
    description: 'Slide tiles to combine them and reach 2048.',
    color: '#F59E0B',
    route: '/(tabs)/games/2048',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    icon: 'cards-playing-outline',
    description: 'Test your memory by matching pairs of cards.',
    color: '#8B5CF6',
    route: '/(tabs)/games/memory',
  },
];

export default function GamesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Arcade Zone</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Quick, addictive games for your pocket.
          </Text>
        </View>

        <View style={styles.grid}>
          {GAMES.map((game, index) => (
            <Animated.View 
              key={game.id}
              entering={FadeInDown.delay(index * 100).duration(500)}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.gameCard,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => {
                  lightImpact();
                  router.push(game.route as any);
                }}
              >
                <LinearGradient
                  colors={[game.color + '20', game.color + '10']}
                  style={styles.gameIconWrap}
                >
                  <MaterialCommunityIcons name={game.icon as any} size={42} color={game.color} />
                </LinearGradient>
                
                <View style={styles.gameInfo}>
                  <Text style={[styles.gameTitle, { color: theme.colors.text }]}>{game.name}</Text>
                  <Text style={[styles.gameDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {game.description}
                  </Text>
                </View>

                <View style={[styles.playBadge, { backgroundColor: game.color }]}>
                  <Text style={styles.playText}>PLAY</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  grid: {
    gap: 16,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  gameIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  playBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
