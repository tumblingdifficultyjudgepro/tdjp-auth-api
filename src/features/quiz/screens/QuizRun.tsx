import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAppTheme } from '@/shared/theme/theme';

export default function QuizRun() {
  const { colors } = useAppTheme();
  const route = useRoute<any>();
  const config = route.params?.config;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>מבחן פעיל</Text>
      <Text style={{ color: colors.text }}>{JSON.stringify(config)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
});
