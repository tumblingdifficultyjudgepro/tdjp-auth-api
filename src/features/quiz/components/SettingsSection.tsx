import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/shared/theme/theme';

type Props = {
  title: string;
  colors: Colors;
  isRTL: boolean;
  children: React.ReactNode;
};

export default function SettingsSection({ title, colors, isRTL, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 70, marginBottom: 26, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 100, letterSpacing: 0.2 },
  body: { alignItems: 'center', justifyContent: 'center' },
});
