import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Colors } from '@/shared/theme/theme';
import { KB, k } from './keyboardTheme';

type Props = {
  isRTL: boolean;
  lang: 'he' | 'en';
  colors: Colors;
  onKey: (k: string) => void;
  onBackspace: () => void;
};

export default function SymbolKeyboard({ isRTL, lang, colors, onKey, onBackspace }: Props) {
  const Key = ({
    label,
    onPress,
    flex = 1,
    k: keyId,
    disabled = false,
  }: {
    label: string;
    onPress: () => void;
    flex?: number;
    k: string;
    disabled?: boolean;
  }) => (
    <Pressable
      key={keyId}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          flex,
          backgroundColor: pressed ? '#0000001A' : colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0 : 1,
        },
      ]}
      android_ripple={{ color: '#00000014' }}
    >
      <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  const BackspaceWide = () => (
    <Pressable
      onPress={onBackspace}
      style={({ pressed }) => [
        styles.wideBtn,
        { backgroundColor: pressed ? '#0000001A' : colors.card, borderColor: colors.border },
      ]}
      android_ripple={{ color: '#00000014' }}
    >
      <Text style={[styles.wideBtnText, { color: colors.text }]}>
        {lang === 'he' ? '⌫ מחק' : '⌫ Backspace'}
      </Text>
    </Pressable>
  );

  const ZeroWide = () => (
    <Pressable
      onPress={() => onKey('0')}
      style={({ pressed }) => [
        styles.wideBtn,
        { backgroundColor: pressed ? '#0000001A' : colors.card, borderColor: colors.border },
      ]}
      android_ripple={{ color: '#00000014' }}
    >
      <Text style={[styles.wideBtnText, { color: colors.text }]}>0</Text>
    </Pressable>
  );

  // אותו כיוון וזהה בעברית ובאנגלית
  const numsRows: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  const symRows: string[][] = [
    ['F', '(', 'O'],
    ['H', '^', '<'],
    ['-', '.', '/'],
  ];

  const NumberBlock = () => (
    <View style={styles.block}>
      {numsRows.map((row, r) => (
        <View key={`n-row-${r}`} style={[styles.row, { flexDirection: 'row' }]}>
          {row.map((ch, c) => (
            <Key k={`n-${r}-${c}-${ch}`} key={`n-${r}-${c}-${ch}`} label={ch} onPress={() => onKey(ch)} />
          ))}
        </View>
      ))}
      <ZeroWide />
    </View>
  );

  const SymbolBlock = () => (
    <View style={styles.block}>
      {symRows.map((row, r) => (
        <View key={`s-row-${r}`} style={[styles.row, { flexDirection: 'row' }]}>
          {row.map((cell, c) => (
            <Key k={`s-${r}-${c}-${cell}`} key={`s-${r}-${c}-${cell}`} label={cell} onPress={() => onKey(cell)} />
          ))}
        </View>
      ))}
      <BackspaceWide />
    </View>
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.split, { flexDirection: 'row' }]}>
        <NumberBlock />
        <View style={{ width: k(10) }} />
        <SymbolBlock />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: k(KB.BASE.PADDING_H), paddingBottom: k(6) },
  split: { flexDirection: 'row', alignItems: 'flex-start' },
  block: { flex: 1 },
  row: {
    flexDirection: 'row',
    marginHorizontal: k(4),
    marginBottom: k(KB.BASE.ROW_GAP + 2),
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  key: {
    height: k(KB.BASE.KEY_HEIGHT),
    borderRadius: k(KB.BASE.BORDER_RADIUS),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: k(KB.BASE.PADDING_X),
    marginHorizontal: k(4),
    flex: 1,
  },
  keyText: { fontSize: k(KB.BASE.KEY_FONT), fontWeight: '700' },
  wideBtn: {
    height: k(KB.BASE.WIDE_HEIGHT),
    borderRadius: k(KB.BASE.BORDER_RADIUS),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: k(8),
    marginTop: k(2),
  },
  wideBtnText: { fontSize: k(KB.BASE.KEY_FONT), fontWeight: '800' },
});
