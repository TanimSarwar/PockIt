import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../store/theme';
import { useTasksStore, type Note } from '../../../store/tasks';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card, SearchBar, Button } from '../../../components/ui';
import { lightImpact } from '../../../lib/haptics';

export default function NotesScreen() {
  const { theme } = useTheme();
  const { notes, addNote, updateNote, deleteNote } = useTasksStore();
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const filtered = notes
    .filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const openNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const createNew = () => {
    lightImpact();
    addNote('Untitled', '');
    // The note was prepended to the array; open it
    setTimeout(() => {
      const latest = useTasksStore.getState().notes[0];
      if (latest) openNote(latest);
    }, 50);
  };

  const saveNote = () => {
    if (editingNote) {
      updateNote(editingNote.id, title, content);
    }
    setEditingNote(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteNote(id); if (editingNote?.id === id) setEditingNote(null); } },
    ]);
  };

  // Editor view
  if (editingNote) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader
          title="Edit Note"
          rightAction={
            <Pressable onPress={saveNote} accessibilityLabel="Save note">
              <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>Done</Text>
            </Pressable>
          }
        />
        <View style={styles.editor}>
          <TextInput
            style={[styles.titleInput, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.textTertiary}
            underlineColorAndroid="transparent"
          />
          <TextInput
            style={[styles.contentInput, { color: theme.colors.text }]}
            value={content}
            onChangeText={setContent}
            placeholder="Start writing..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            textAlignVertical="top"
            underlineColorAndroid="transparent"
          />
        </View>
      </View>
    );
  }

  // List view
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Notes"
        rightAction={
          <Pressable onPress={createNew} accessibilityLabel="New note">
            <MaterialCommunityIcons name="plus-circle" size={28} color={theme.colors.accent} />
          </Pressable>
        }
      />
      <View style={{ paddingHorizontal: 16 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search notes..." />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="note-text-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textTertiary, marginTop: 8 }}>No notes yet</Text>
          </View>
        )}
        {filtered.map((note) => (
          <Pressable key={note.id} onPress={() => openNote(note)} onLongPress={() => handleDelete(note.id)}>
            <Card style={{ marginBottom: 8 }}>
              <Text style={[styles.noteTitle, { color: theme.colors.text }]} numberOfLines={1}>{note.title || 'Untitled'}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }} numberOfLines={2}>{note.content || 'Empty note'}</Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 11, marginTop: 4 }}>
                {new Date(note.updatedAt).toLocaleDateString()}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  noteTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  editor: { flex: 1, paddingHorizontal: 16 },
  titleInput: { fontSize: 22, fontWeight: '700', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  contentInput: { flex: 1, fontSize: 16, lineHeight: 24, paddingTop: 12, borderWidth: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
});
