import React, { ReactNode } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme/theme';

export default function GlobalSafeTop({
  children,
  extra = 8,
  min = 12,
  max = -5
}: {
  children: ReactNode;
  extra?: number;
  min?: number;
  max?: number;
}) {
  const { colors } = useAppTheme();
  const { top } = useSafeAreaInsets();
  let pad = top + extra;
  if (pad < min) pad = min;
  if (typeof max === 'number' && pad > max) pad = max;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg, paddingTop: pad }}>
      {children}
    </SafeAreaView>
  );
}
