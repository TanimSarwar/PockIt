import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../../store/theme';
import { lightImpact, mediumImpact, notificationSuccess } from '../../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = 20;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40) / GRID_SIZE);
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_DIRECTION: Direction = 'UP';
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const { theme } = useTheme();
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scoreAnim = useSharedValue(1);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        notificationSuccess();
        scoreAnim.value = withSequence(
          withSpring(1.2),
          withSpring(1)
        );
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generateFood, highScore]);

  const handleGameOver = () => {
    setIsGameOver(true);
    mediumImpact();
  };

  useEffect(() => {
    if (!isPaused && !isGameOver) {
      timerRef.current = setInterval(moveSnake, INITIAL_SPEED);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isGameOver, moveSnake]);

  const handleDirectionPress = (newDir: Direction) => {
    lightImpact();
    // Prevent 180 degree turns
    const isOpposite = 
      (direction === 'UP' && newDir === 'DOWN') ||
      (direction === 'DOWN' && newDir === 'UP') ||
      (direction === 'LEFT' && newDir === 'RIGHT') ||
      (direction === 'RIGHT' && newDir === 'LEFT');
    
    if (!isOpposite) {
      setDirection(newDir);
    }
    if (isPaused) setIsPaused(false);
  };

  const animatedScoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreAnim.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>SCORE</Text>
          <Animated.Text style={[styles.scoreValue, { color: theme.colors.text }, animatedScoreStyle]}>
            {score}
          </Animated.Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>BEST</Text>
          <Text style={[styles.scoreValue, { color: theme.colors.accent }]}>
            {highScore}
          </Text>
        </View>
      </View>

      <View style={[styles.board, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.borderLight }]}>
        {/* Snake segments */}
        {snake.map((segment, index) => (
          <View
            key={`snake-${index}`}
            style={[
              styles.segment,
              {
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                backgroundColor: index === 0 ? theme.colors.accent : theme.colors.accentDark,
                borderRadius: index === 0 ? 6 : 4,
                zIndex: index === 0 ? 2 : 1,
              },
            ]}
          />
        ))}

        {/* Food */}
        <View
          style={[
            styles.food,
            {
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              backgroundColor: theme.colors.error,
            },
          ]}
        >
          <MaterialCommunityIcons name="fruit-grapes" size={CELL_SIZE - 2} color="white" />
        </View>

        {/* Overlay */}
        {(isPaused || isGameOver) && (
          <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Text style={styles.overlayTitle}>
              {isGameOver ? 'GAME OVER' : 'READY?'}
            </Text>
            {isGameOver && (
              <Text style={styles.overlayScore}>Final Score: {score}</Text>
            )}
            <Pressable
              style={[styles.playButton, { backgroundColor: theme.colors.accent }]}
              onPress={isGameOver ? resetGame : () => setIsPaused(false)}
            >
              <MaterialCommunityIcons 
                name={isGameOver ? "refresh" : "play"} 
                size={32} 
                color="white" 
              />
              <Text style={styles.playButtonText}>
                {isGameOver ? 'Try Again' : 'Start Game'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.row}>
          <ControlButton icon="chevron-up" onPress={() => handleDirectionPress('UP')} />
        </View>
        <View style={styles.row}>
          <ControlButton icon="chevron-left" onPress={() => handleDirectionPress('LEFT')} />
          <View style={{ width: 60 }} />
          <ControlButton icon="chevron-right" onPress={() => handleDirectionPress('RIGHT')} />
        </View>
        <View style={styles.row}>
          <ControlButton icon="chevron-down" onPress={() => handleDirectionPress('DOWN')} />
        </View>
      </View>

      <Pressable 
        style={[styles.pauseBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
        onPress={() => { lightImpact(); setIsPaused(!isPaused); }}
      >
        <MaterialCommunityIcons 
          name={isPaused ? "play" : "pause"} 
          size={24} 
          color={theme.colors.text} 
        />
      </Pressable>
    </View>
  );
}

function ControlButton({ icon, onPress }: { icon: any; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controlBtn,
        { backgroundColor: pressed ? theme.colors.accentMuted : theme.colors.surface },
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={32} color={theme.colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 100,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  segment: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  food: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  overlayScore: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 30,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  controls: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pauseBtn: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
