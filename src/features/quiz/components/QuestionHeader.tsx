import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAppTheme } from '@/shared/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  index: number;
  total: number;
  remainingSec: number;
  timeLimitSec: number;
};

export default function QuestionHeader({ index, total, remainingSec, timeLimitSec }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const size = 48;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const timed = timeLimitSec > 0;
  const ratio = timed ? Math.max(0, Math.min(1, remainingSec / timeLimitSec)) : 1;
  const offset = c * (1 - ratio);

  const cx = size / 2;
  const cy = size / 2;
  const sweep = 360 * ratio;
  const startDeg = -90;
  const endDeg = startDeg + sweep;
  const rad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(rad(startDeg));
  const sy = cy + r * Math.sin(rad(startDeg));
  const ex = cx + r * Math.cos(rad(endDeg));
  const ey = cy + r * Math.sin(rad(endDeg));
  const largeArc = sweep > 180 ? 1 : 0;
  const pieD =
    ratio <= 0
      ? ''
      : ratio >= 1
      ? ''
      : `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} Z`;

  return (
    <View>
      <View style={{ height: insets.top, backgroundColor: colors.card }} />
      <View style={[styles.wrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.counter, { color: colors.text }]}>{index + 1}/{total}</Text>
        <View style={styles.timerBox}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={cx} cy={cy} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
            {timed && ratio > 0 && ratio < 1 && <Path d={pieD} fill={colors.tint} />}
            {timed && ratio >= 1 && <Circle cx={cx} cy={cy} r={r} fill={colors.tint} />}
            {timed && (
              <Circle
                cx={cx} cy={cy} r={r}
                stroke={colors.tint}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${c} ${c}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            )}
          </Svg>
          <View style={styles.timerCenter}>
            <Text style={[styles.timerText, { color: colors.text }]}>{timed ? remainingSec : '∞'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  counter: { fontSize: 16, fontWeight: '700' },
  timerBox: { marginLeft: 'auto', width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  timerCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 14, fontWeight: '800' },
});
