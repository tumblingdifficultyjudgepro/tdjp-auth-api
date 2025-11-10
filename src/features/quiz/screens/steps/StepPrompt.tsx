import React from 'react';
import { View, StyleSheet, Text, Pressable, Platform } from 'react-native';
import { PromptKind } from '@/features/quiz/types';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = { value: PromptKind | null; onChange: (v: PromptKind) => void };

export default function StepPrompt({ value, onChange }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isText = value === 'name';
  const isSymbol = value === 'symbol';

  const cardStyle = (selected: boolean) => [
    styles.card,
    {
      backgroundColor: selected ? colors.tint : colors.card,
      borderColor: selected ? colors.tint : colors.border,
      borderWidth: selected ? 0 : 2,
    },
  ];
  const letterStyle = (selected: boolean) => [
    styles.letter,
    {
      color: selected ? '#fff' : colors.text,
      fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
    },
  ];
  const labelStyle = (selected: boolean) => [
    styles.label,
    { color: selected ? '#fff' : colors.text },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{t(lang, 'quiz.settings.promptTitle')}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => onChange('name')} style={cardStyle(isText)}>
          <Text style={letterStyle(isText)}>T</Text>
          <Text style={labelStyle(isText)}>{t(lang, 'quiz.settings.promptElementName')}</Text>
        </Pressable>

        <View style={{ width: 18 }} />

        <Pressable onPress={() => onChange('symbol')} style={cardStyle(isSymbol)}>
          <Text style={letterStyle(isSymbol)}>S</Text>
          <Text style={labelStyle(isSymbol)}>{t(lang, 'quiz.settings.promptSymbol')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 0, paddingBottom: 60 },
  title: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  card: { width: 170, height: 140, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 64, fontWeight: '900', marginBottom: 8, lineHeight: 70 },
  label: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
});
