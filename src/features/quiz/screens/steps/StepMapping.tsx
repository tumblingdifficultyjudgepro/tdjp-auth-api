import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Mapping } from '@/features/quiz/types';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@/shared/i18n';

type Props = { value: Mapping | null; onChange: (v: Mapping) => void };

export default function StepMapping({ value, onChange }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();

  const effective: Mapping = value ?? 'elementToValue';
  const isDown = effective === 'elementToValue';
  const next: Mapping = isDown ? 'valueToElement' : 'elementToValue';

  const onPress = () => onChange(next);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <View style={styles.center}>
        <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.boxTitle, { color: colors.text }]}>{t(lang, 'quiz.settings.mappingElementName')}</Text>
        </View>

        <Pressable onPress={onPress} style={[styles.arrowWrap, { borderColor: colors.border }]} hitSlop={12}>
          <Ionicons name={isDown ? 'arrow-down' : 'arrow-up'} size={34} color={colors.tint} />
        </Pressable>

        <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.boxTitle, { color: colors.text }]}>{t(lang, 'quiz.settings.mappingElementValue')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  box: { width: 260, height: 110, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  boxTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  arrowWrap: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginVertical: 14 },
});
