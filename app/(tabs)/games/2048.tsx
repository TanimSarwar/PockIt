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
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../../../store/theme';
import { lightImpact, notificationSuccess } from '../../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 10;
const CELL_MARGIN = 5;
const BOARD_SIZE = SCREEN_WIDTH - 40;
const CELL_SIZE = (BOARD_SIZE - (GRID_PADDING * 2) - (CELL_MARGIN * 6)) / 4;

type Grid = (number | null)[][];

const TILE_COLORS: Record<number, string> = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

const TEXT_COLORS: Record<number, string> = {
  2: '#776e65',
  4: '#776e65',
};

export default function Game2048() {
  const { theme } = useTheme();
  const [grid, setGrid] = useState<Grid>(Array(4).fill(null).map(() => Array(4).fill(null)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = useCallback(() => {
    let newGrid = Array(4).fill(null).map(() => Array(4).fill(null));
    newGrid = addRandomTile(addRandomTile(newGrid));
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const addRandomTile = (currentGrid: Grid): Grid => {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!currentGrid[r][c]) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return currentGrid;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = [...currentGrid.map(row => [...row])];
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  };

  const move = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;

    let newGrid = [...grid.map(row => [...row])];
    let moved = false;
    let addedScore = 0;

    const rotate = (g: Grid) => {
      const rotated: Grid = Array(4).fill(null).map(() => Array(4).fill(null));
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          rotated[c][3 - r] = g[r][c];
        }
      }
      return rotated;
    };

    const slide = (row: (number | null)[]) => {
      let filtered = row.filter(val => val !== null) as number[];
      let newRow: (number | null)[] = [];
      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i] === filtered[i + 1]) {
          const combined = filtered[i] * 2;
          newRow.push(combined);
          addedScore += combined;
          i++;
          moved = true;
        } else {
          newRow.push(filtered[i]);
        }
      }
      while (newRow.length < 4) newRow.push(null);
      if (newRow.some((val, idx) => val !== row[idx])) moved = true;
      return newRow;
    };

    // Normalize everything to LEFT slide
    let numRotations = 0;
    if (direction === 'UP') numRotations = 1;
    else if (direction === 'RIGHT') numRotations = 2;
    else if (direction === 'DOWN') numRotations = 3;

    for (let i = 0; i < numRotations; i++) newGrid = rotate(newGrid);
    newGrid = newGrid.map(row => slide(row));
    for (let i = 0; i < (4 - numRotations) % 4; i++) newGrid = rotate(newGrid);

    if (moved) {
      lightImpact();
      if (addedScore > 0) notificationSuccess();
      newGrid = addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(s => s + addedScore);
      checkGameOver(newGrid);
    }
  };

  const checkGameOver = (currentGrid: Grid) => {
    // Check for empty cells
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!currentGrid[r][c]) return;
      }
    }
    // Check for possible merges
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && currentGrid[r][c] === currentGrid[r][c + 1]) return;
        if (r < 3 && currentGrid[r][c] === currentGrid[r + 1][c]) return;
      }
    }
    setGameOver(true);
  };

  const gesture = Gesture.Pan()
    .onEnd((e) => {
      const { velocityX, velocityY } = e;
      if (Math.abs(velocityX) > Math.abs(velocityY)) {
        if (velocityX > 500) move('RIGHT');
        else if (velocityX < -500) move('LEFT');
      } else {
        if (velocityY > 500) move('DOWN');
        else if (velocityY < -500) move('UP');
      }
    })
    .runOnJS(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>2048</Text>
          <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Join the numbers!</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Text style={[styles.scoreBoxLabel, { color: theme.colors.textTertiary }]}>SCORE</Text>
          <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{score}</Text>
        </View>
      </View>

      <GestureDetector gesture={gesture}>
        <View style={[styles.board, { backgroundColor: '#bbada0' }]}>
          {grid.map((row, r) => (
            row.map((cell, c) => (
              <View key={`${r}-${c}`} style={[styles.cell, { backgroundColor: 'rgba(238, 228, 218, 0.35)' }]}>
                {cell && (
                  <Animated.View 
                    style={[
                      styles.tile, 
                      { backgroundColor: TILE_COLORS[cell] || '#3c3a32' }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.tileText, 
                        { color: TEXT_COLORS[cell] || 'white' },
                        cell >= 1024 && { fontSize: 20 }
                      ]}
                    >
                      {cell}
                    </Text>
                  </Animated.View>
                )}
              </View>
            ))
          ))}

          {gameOver && (
            <View style={styles.overlay}>
              <Text style={styles.gameOverText}>Game Over!</Text>
              <Pressable style={[styles.resetBtn, { backgroundColor: theme.colors.accent }]} onPress={initGame}>
                <Text style={styles.resetBtnText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </GestureDetector>

      <View style={styles.footer}>
        <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
          Swipe in any direction to move and merge tiles.
        </Text>
        <Pressable 
          style={[styles.footerReset, { borderColor: theme.colors.border }]} 
          onPress={initGame}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.footerResetText, { color: theme.colors.textSecondary }]}>Reset Game</Text>
        </Pressable>
      </View>
    </View>
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
    justifyContent: 'space-between',
    width: BOARD_SIZE,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  scoreBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: 8,
    padding: GRID_PADDING,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_MARGIN,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tile: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 24,
    fontWeight: '900',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 228, 218, 0.73)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#776e65',
    marginBottom: 20,
  },
  resetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    width: BOARD_SIZE,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  footerReset: {
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
