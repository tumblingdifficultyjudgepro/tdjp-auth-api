import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import StepperField from '@/features/quiz/components/StepperField';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

type Props = {
  count: number;
  timer: number | 'unlimited';
  onChangeCount: (n: number) => void;
  onChangeTimer: (v: number | 'unlimited') => void;
};

export default function StepCountTimer({ count, timer, onChangeCount, onChangeTimer }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const countItems = useMemo(() => [5, 10, 15, 20].map(n => ({ key: n, label: String(n) })), []);
  const timerItems = useMemo(
    () => [
      { key: '10', label: t(lang, 'quiz.settings.timer10') },
      { key: '20', label: t(lang, 'quiz.settings.timer20') },
      { key: '30', label: t(lang, 'quiz.settings.timer30') },
      { key: '60', label: t(lang, 'quiz.settings.timer60') },
      { key: 'unlimited', label: t(lang, 'quiz.settings.timerUnlimited') }
    ],
    [lang]
  );

  const onCount = (v: string | number) => {
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    if (!Number.isNaN(n)) onChangeCount(n as number);
  };

  const onTimer = (v: string | number) => {
    if (v === 'unlimited') onChangeTimer('unlimited');
    else onChangeTimer(parseInt(String(v), 10));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'quiz.settings.countTitle')}</Text>
          <StepperField title="" items={countItems} value={count} onChange={onCount} colors={colors} isRTL={isRTL} width={160} />
        </View>
        <View style={{ width: 24 }} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'quiz.settings.timerTitle')}</Text>
          <StepperField title="" items={timerItems} value={String(timer)} onChange={onTimer} colors={colors} isRTL={isRTL} width={160} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  card: { width: 160, paddingVertical: 18, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' }
});
