import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, Button, Input, Modal } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Flashcard { id: string; front: string; back: string; }
interface Deck { id: string; name: string; cards: Flashcard[]; }

export default function FlashcardsScreen() {
  const { theme } = useTheme();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const flipAnim = useRef(new Animated.Value(0)).current;

  const addDeck = () => {
    if (!deckName.trim()) return;
    setDecks((d) => [...d, { id: Date.now().toString(), name: deckName.trim(), cards: [] }]);
    setDeckName('');
    setShowDeckModal(false);
  };

  const addCard = () => {
    if (!cardFront.trim() || !cardBack.trim() || !activeDeck) return;
    const card: Flashcard = { id: Date.now().toString(), front: cardFront.trim(), back: cardBack.trim() };
    setDecks((ds) => ds.map((d) => d.id === activeDeck.id ? { ...d, cards: [...d.cards, card] } : d));
    setActiveDeck((d) => d ? { ...d, cards: [...d.cards, card] } : null);
    setCardFront('');
    setCardBack('');
    setShowCardModal(false);
  };

  const deleteDeck = (id: string) => {
    Alert.alert('Delete Deck', 'Remove this deck and all its cards?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setDecks((d) => d.filter((dk) => dk.id !== id)); if (activeDeck?.id === id) setActiveDeck(null); } },
    ]);
  };

  const flipCard = () => {
    lightImpact();
    Animated.timing(flipAnim, { toValue: isFlipped ? 0 : 1, duration: 300, useNativeDriver: true }).start();
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    flipAnim.setValue(0);
    setCurrentIndex((i) => (i + 1) % activeDeck.cards.length);
  };

  const frontInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  // Study mode
  if (studyMode && activeDeck && activeDeck.cards.length > 0) {
    const card = activeDeck.cards[currentIndex];
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title={activeDeck.name} rightAction={
          <Pressable onPress={() => { setStudyMode(false); setCurrentIndex(0); setIsFlipped(false); flipAnim.setValue(0); }}>
            <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Done</Text>
          </Pressable>
        } />
        <View style={styles.studyCenter}>
          <Text style={{ color: theme.colors.textTertiary, marginBottom: 8 }}>
            Card {currentIndex + 1} of {activeDeck.cards.length}
          </Text>
          <Pressable onPress={flipCard} style={{ width: '100%' }}>
            <Animated.View style={[styles.flashcard, { backgroundColor: theme.colors.surface, transform: [{ rotateY: frontInterpolate }] }]}>
              <Text style={[styles.flashcardText, { color: theme.colors.text }]}>{card.front}</Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>Tap to flip</Text>
            </Animated.View>
            <Animated.View style={[styles.flashcard, styles.flashcardBack, { backgroundColor: theme.colors.accentMuted, transform: [{ rotateY: backInterpolate }] }]}>
              <Text style={[styles.flashcardText, { color: theme.colors.accent }]}>{card.back}</Text>
            </Animated.View>
          </Pressable>
          <Button title="Next Card →" onPress={nextCard} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  // Deck detail
  if (activeDeck) {
    const deck = decks.find((d) => d.id === activeDeck.id) || activeDeck;
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title={deck.name} rightAction={
          <Pressable onPress={() => setShowCardModal(true)} accessibilityLabel="Add card">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        } />
        <ScrollView contentContainerStyle={styles.content}>
          {deck.cards.length > 0 && (
            <Button title={`Study (${deck.cards.length} cards)`} onPress={() => { setStudyMode(true); setCurrentIndex(0); }} style={{ marginBottom: 16 }} />
          )}
          {deck.cards.length === 0 && <Text style={{ color: theme.colors.textTertiary, textAlign: 'center', marginTop: 32 }}>No cards yet. Tap + to add one.</Text>}
          {deck.cards.map((card) => (
            <Card key={card.id} style={{ marginBottom: 8 }}>
              <Text style={[styles.cardFrontText, { color: theme.colors.text }]}>{card.front}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{card.back}</Text>
            </Card>
          ))}
          <Button title="← Back to Decks" variant="ghost" onPress={() => setActiveDeck(null)} style={{ marginTop: 16 }} />
        </ScrollView>
        <Modal visible={showCardModal} onClose={() => setShowCardModal(false)} title="Add Card">
          <Input label="Front (Question)" value={cardFront} onChangeText={setCardFront} placeholder="What is...?" />
          <Input label="Back (Answer)" value={cardBack} onChangeText={setCardBack} placeholder="The answer is..." style={{ marginTop: 8 }} />
          <Button title="Add Card" onPress={addCard} style={{ marginTop: 16 }} />
        </Modal>
      </View>
    );
  }

  // Deck list
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Flashcards" rightAction={
        <Pressable onPress={() => setShowDeckModal(true)} accessibilityLabel="New deck">
          <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
        </Pressable>
      } />
      <ScrollView contentContainerStyle={styles.content}>
        {decks.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="cards-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>No decks yet. Tap + to create one.</Text>
          </View>
        )}
        {decks.map((deck) => (
          <Pressable key={deck.id} onPress={() => setActiveDeck(deck)} onLongPress={() => deleteDeck(deck.id)}>
            <Card style={{ marginBottom: 8 }}>
              <View style={styles.deckRow}>
                <MaterialCommunityIcons name="cards-outline" size={24} color={theme.colors.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.deckName, { color: theme.colors.text }]}>{deck.name}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{deck.cards.length} cards</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textTertiary} />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
      <Modal visible={showDeckModal} onClose={() => setShowDeckModal(false)} title="New Deck">
        <Input label="Deck Name" value={deckName} onChangeText={setDeckName} placeholder="e.g. Spanish Vocab, Biology 101..." autoFocus />
        <Button title="Create Deck" onPress={addDeck} style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  deckRow: { flexDirection: 'row', alignItems: 'center' },
  deckName: { fontSize: 16, fontWeight: '600' },
  studyCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  flashcard: { width: '100%', minHeight: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 24, backfaceVisibility: 'hidden' },
  flashcardBack: { position: 'absolute', top: 0, left: 0, right: 0 },
  flashcardText: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  cardFrontText: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
});
