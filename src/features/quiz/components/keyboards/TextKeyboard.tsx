import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/shared/theme/theme';

type Props = {
  isRTL: boolean;
  lang: 'he' | 'en';
  colors: Colors;
  onKey: (k: string) => void;
  onBackspace: () => void;
};

export default function TextKeyboard({ isRTL, lang, colors, onKey, onBackspace }: Props) {
  const rowDir: ViewStyle['flexDirection'] = 'row';

  const Key = ({
    label,
    flex = 1,
    onPress,
    testID,
  }: {
    label: string;
    flex?: number;
    onPress: () => void;
    testID?: string;
  }) => (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.key,
        {
          flex,
          backgroundColor: pressed ? '#00000018' : colors.card,
          borderColor: colors.border,
        },
      ]}
      android_ripple={{ color: '#00000014' }}
    >
      <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  const BackspaceKey = () => <Key label="⌫" onPress={onBackspace} testID="key-backspace" flex={1.4} />;

  const heRows = [
    ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ', 'ף'],
    ['ש', 'ד', 'ג', 'כ', 'ך', 'ע', 'י', 'ח', 'ל'],
    ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'],
  ];
  const enRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const rows = lang === 'he' ? heRows : enRows;

  return (
    <View style={styles.wrap}>
      {rows.map((r, idx) => (
        <View key={`row-${idx}`} style={[styles.row, { flexDirection: rowDir }]}>
          {r.map((ch, i) => (
            <Key key={`k-${idx}-${i}-${ch}`} label={ch} onPress={() => onKey(ch)} />
          ))}
          {idx === 0 && <BackspaceKey />}
        </View>
      ))}

      <View style={[styles.row, { flexDirection: rowDir, justifyContent: 'center' }]}>
        <Key label={lang === 'he' ? 'רווח' : 'Space'} onPress={() => onKey(' ')} flex={3} testID="key-space" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 8 },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  key: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  keyText: { fontSize: 17, fontWeight: '700' },
});
