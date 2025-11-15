import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import ActionsBar from '@/features/calculator/components/ActionsBar';
import SortingBar from '@/features/calculator/components/SortingBar';
import ElementsGrid from '@/features/calculator/components/ElementsGrid';
import useTariffPassKeyboard from '@/features/tariff/state/useTariffPassKeyboard';
import TariffPassBar from '@/features/tariff/components/TariffPassBar';

type Track = 'league' | 'national' | 'international' | null;

type Props = {
  track: Track;
};

export default function TariffPassesKeyboard({ track }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const {
    elements,
    sortKey,
    sortOrder,
    cycleSortKey,
    toggleOrder,
    addElement,
    deleteLast,
    clearAll,
    activePass,
    setActivePass,
    maxSlots,
    pass1Display,
    pass2Display,
  } = useTariffPassKeyboard(track);

  if (!track) return null;

  const barDirection: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';

  const header = (
    <View
      style={[
        styles.header,
        { alignItems: isRTL ? 'flex-end' : 'flex-start' },
      ]}
    >
      <ActionsBar
        onDelete={deleteLast}
        onClear={clearAll}
        alignSide={isRTL ? 'end' : 'start'}
      />
      <SortingBar
        sortKey={sortKey}
        sortOrder={sortOrder}
        onChangeKey={cycleSortKey}
        onToggleOrder={toggleOrder}
        isRTL={isRTL}
      />
    </View>
  );

  const pass1Title = isRTL ? 'פס 1' : 'Pass 1';
  const pass2Title = isRTL ? 'פס 2' : 'Pass 2';

  return (
    <View style={styles.container}>
      <View style={styles.passesSection}>
        <View style={styles.passBlock}>
          <Text
            style={[
              styles.passTitle,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {pass1Title}
          </Text>
          <Pressable
            onPress={() =>
              setActivePass(activePass === 1 ? null : 1)
            }
            style={[
              styles.passBox,
              {
                borderColor:
                  activePass === 1 ? colors.text : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <TariffPassBar
              items={pass1Display}
              direction={barDirection}
              maxSlots={maxSlots}
            />
          </Pressable>
        </View>

        <View style={styles.passBlock}>
          <Text
            style={[
              styles.passTitle,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {pass2Title}
          </Text>
          <Pressable
            onPress={() =>
              setActivePass(activePass === 2 ? null : 2)
            }
            style={[
              styles.passBox,
              {
                borderColor:
                  activePass === 2 ? colors.text : colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <TariffPassBar
              items={pass2Display}
              direction={barDirection}
              maxSlots={maxSlots}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.keyboardSection}>
        <ElementsGrid
          elements={elements}
          onSelect={(it) => addElement(it.id, it.value)}
          titleFontSize={14}
          header={header}
          forceLTR={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  passesSection: { gap: 12 },
  passBlock: { width: '100%' },
  passTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  passBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  header: { paddingTop: 8, width: '100%' },
  keyboardSection: { marginTop: 8, flexShrink: 1 },
});
