import React, { PropsWithChildren } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme/theme';

export default function Screen({ title, children }: PropsWithChildren<{ title?: string }>) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 8;
  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: topPad }]}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  body: { paddingHorizontal: 16, paddingBottom: 32 }
});
