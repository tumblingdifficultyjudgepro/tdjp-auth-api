import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  showTime?: string;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function TimerCircle({ size, stroke, progress, color, showTime }: Props) {
  const radius = useMemo(() => (size - stroke) / 2, [size, stroke]);
  const clamped = Math.max(0, Math.min(1, progress));
  const sweep = 360 * clamped;
  const cx = size / 2;
  const cy = size / 2;

  const pathD = useMemo(() => {
    if (clamped <= 0) return '';
    if (clamped >= 1) return '';
    const startDeg = -90;
    const endDeg = startDeg + sweep;
    const start = polar(cx, cy, radius, startDeg);
    const end = polar(cx, cy, radius, endDeg);
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }, [clamped, sweep, radius, cx, cy]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={radius} fill="transparent" stroke={color} strokeWidth={stroke} strokeOpacity={0.15} />
        {clamped > 0 && clamped < 1 && <Path d={pathD} fill={color} />}
        {clamped >= 1 && <Circle cx={cx} cy={cy} r={radius} fill={color} />}
      </Svg>
      {!!showTime && (
        <View style={styles.center}>
          <Text style={styles.time}>{showTime}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 16, fontWeight: '600' },
});
