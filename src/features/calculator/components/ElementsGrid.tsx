// src/features/calculator/components/ElementsGrid.tsx
import React, { useMemo } from 'react';
import { FlatList, Pressable, Text, View, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import type { DisplayItem } from '../types';

type Props = {
  elements: DisplayItem[];
  onSelect: (item: DisplayItem) => void;
  titleFontSize: number;
  header?: React.ReactElement | null;
  forceLTR?: boolean; // סימבולים = true
};

export default function ElementsGrid({ elements, onSelect, titleFontSize, header, forceLTR }: Props) {
  const { colors } = useAppTheme();
  const numColumns = 3;

  const size = useMemo(() => {
    const w = Dimensions.get('window').width;
    const pad = 12 * 2;
    const gap = 10 * (numColumns - 1);
    const cell = (w - pad - gap) / numColumns;
    return Math.max(96, Math.floor(cell));
  }, []);

  const font = Math.max(10, Math.min(titleFontSize, 22));
  const line = Math.round(font * 1.15);
  const max = line * 3;

  return (
    <FlatList
      data={elements}
      keyExtractor={(item, index) => `${item.id}_${index}`}
      numColumns={numColumns}
      ListHeaderComponent={header ?? null}
      contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          style={[
            styles.card,
            {
              width: size,
              height: size,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.center}>
            <Text
              numberOfLines={3}
              ellipsizeMode="clip"
              allowFontScaling={false}
              lineBreakStrategyIOS="standard"
              // @ts-ignore Android only
              textBreakStrategy="simple"
              style={{
                fontWeight: '900',
                color: colors.text,
                textAlign: 'center',
                paddingHorizontal: 8,
                fontSize: font,
                lineHeight: line,
                maxHeight: max,
                writingDirection: forceLTR ? 'ltr' : undefined,
              }}
            >
              {item.label}
            </Text>

            <Text style={[styles.value, { color: '#FFC107' }]}>
              {item.value.toFixed(1)}
            </Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>—</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, width: '100%', height: '100%', position: 'relative' },
  value: { position: 'absolute', bottom: 8, fontSize: 13, fontWeight: '800' },
});
