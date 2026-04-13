import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../store/theme';
import { lightImpact, notificationSuccess, mediumImpact } from '../../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = 4;
const BOARD_SIZE = SCREEN_WIDTH - 40;
const CARD_MARGIN = 6;
const CARD_SIZE = (BOARD_SIZE - (CARD_MARGIN * (GRID_SIZE * 2))) / GRID_SIZE;

const ICONS = [
  'ghost', 'alien', 'robot', 'rocket', 'star', 'heart', 'cloud', 'lightning-bolt',
  'fire', 'water', 'leaf', 'white-balance-sunny', 'moon-waning-crescent', 'earth',
  'controller-classic', 'music'
];

type Card = {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function MemoryGame() {
  const { theme } = useTheme();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const initGame = useCallback(() => {
    const totalPairs = (GRID_SIZE * GRID_SIZE) / 2;
    const selectedIcons = ICONS.slice(0, totalPairs);
    const pairs = [...selectedIcons, ...selectedIcons];
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffled.map((icon, index) => ({
      id: index,
      icon,
      isFlipped: false,
      isMatched: false,
    })));
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardPress = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length === 2) return;

    lightImpact();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].icon === cards[second].icon) {
        // Match
        setTimeout(() => {
          notificationSuccess();
          const matchedCards = [...newCards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches(m => {
            const newMatches = m + 1;
            if (newMatches === (GRID_SIZE * GRID_SIZE) / 2) setIsGameOver(true);
            return newMatches;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          mediumImpact();
          const unFlippedCards = [...newCards];
          unFlippedCards[first].isFlipped = false;
          unFlippedCards[second].isFlipped = false;
          setCards(unFlippedCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>MOVES</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{moves}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>MATCHES</Text>
          <Text style={[styles.statValue, { color: theme.colors.accent }]}>{matches}/8</Text>
        </View>
      </View>

      <View style={styles.board}>
        {cards.map((card, index) => (
          <MemoryCard 
            key={card.id} 
            card={card} 
            onPress={() => handleCardPress(index)} 
          />
        ))}
      </View>

      {isGameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={[styles.gameOverContent, { backgroundColor: theme.colors.surface }]}>
            <MaterialCommunityIcons name="trophy" size={64} color={theme.colors.accent} />
            <Text style={[styles.gameOverTitle, { color: theme.colors.text }]}>Well Done!</Text>
            <Text style={[styles.gameOverSubtitle, { color: theme.colors.textSecondary }]}>
              You finished in {moves} moves.
            </Text>
            <Pressable 
              style={[styles.resetBtn, { backgroundColor: theme.colors.accent }]} 
              onPress={initGame}
            >
              <Text style={styles.resetBtnText}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable 
        style={[styles.footerReset, { borderColor: theme.colors.borderLight }]} 
        onPress={initGame}
      >
        <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.textSecondary} />
        <Text style={[styles.footerResetText, { color: theme.colors.textSecondary }]}>Reset Board</Text>
      </Pressable>
    </View>
  );
}

function MemoryCard({ card, onPress }: { card: Card; onPress: () => void }) {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(card.isFlipped || card.isMatched ? 180 : 0);
  }, [card.isFlipped, card.isMatched]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden',
    zIndex: rotation.value <= 90 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value - 180}deg` }],
    backfaceVisibility: 'hidden',
  }));

  return (
    <Pressable style={styles.cardContainer} onPress={onPress}>
      <Animated.View 
        style={[
          styles.card, 
          styles.cardFront, 
          frontStyle, 
          { backgroundColor: theme.colors.accent }
        ]}
      >
        <MaterialCommunityIcons name="help" size={32} color="white" />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.card, 
          styles.cardBack, 
          backStyle, 
          { backgroundColor: theme.colors.surfaceSecondary }
        ]}
      >
        <MaterialCommunityIcons 
          name={card.icon as any} 
          size={32} 
          color={card.isMatched ? theme.colors.accent : theme.colors.text} 
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: BOARD_SIZE,
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_MARGIN,
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardFront: {
    zIndex: 1,
  },
  cardBack: {},
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gameOverContent: {
    width: '80%',
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 16,
  },
  gameOverSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 24,
  },
  resetBtn: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  resetBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  footerReset: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  footerResetText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
