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

export default function ValueKeyboard({ isRTL, lang, colors, onKey, onBackspace }: Props) {
  const Key = ({
    label,
    flex = 1,
    onPress,
  }: {
    label: string;
    flex?: number;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          flex,
          backgroundColor: pressed ? '#0000001A' : colors.card,
          borderColor: colors.border,
        },
      ]}
      android_ripple={{ color: '#00000014' }}
    >
      <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );

  const BackspaceKey = () => (
    <Key label={lang === 'he' ? 'מחק' : 'Back'} onPress={onBackspace} />
  );

  const Row = ({ items }: { items: string[] }) => (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {items.map((n) => (
        <Key key={n} label={n} onPress={() => onKey(n)} />
      ))}
    </View>
  );

  const row1 = isRTL ? ['1', '2', '3'] : ['3', '2', '1'];
  const row2 = isRTL ? ['4', '5', '6'] : ['6', '5', '4'];
  const row3 = isRTL ? ['7', '8', '9'] : ['9', '8', '7'];

  const BottomRow = () => (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <BackspaceKey />
      <Key label="0" onPress={() => onKey('0')} />
      <Key label="." onPress={() => onKey('.')} />
    </View>
  );

  return (
    <View style={styles.wrap}>
      <Row items={row1} />
      <Row items={row2} />
      <Row items={row3} />
      <BottomRow />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: k(KB.BASE.PADDING_H), paddingBottom: k(4) },
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
  },
  keyText: { fontSize: k(KB.BASE.KEY_FONT), fontWeight: '700' },
});