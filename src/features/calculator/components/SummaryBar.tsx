import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';

type Props = {
  label: string;
  value: number;
  alignSide?: 'start' | 'end';
  reverse?: boolean;
};

export default function SummaryBar({ label, value, alignSide = 'start', reverse = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.wrap, { alignSelf: alignSide === 'end' ? 'flex-end' : 'flex-start' }]}>
      {reverse ? (
        <>
          <Text style={styles.value}>{value.toFixed(1)}</Text>
          <Text style={[styles.label, { color: colors.text, marginStart: 8, marginEnd: 0 }]}>{label}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.value, { marginStart: 8 }]}>{value.toFixed(1)}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  label: { fontSize: 16, fontWeight: '700' },
  value: { fontSize: 18, fontWeight: '900', color: '#FFC107' },
});
