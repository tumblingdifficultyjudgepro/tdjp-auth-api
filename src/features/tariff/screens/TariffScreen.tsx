import React, { useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import TopBar from '@/shared/ui/TopBar';
import { t } from '@/shared/i18n';
import AthleteDetailsSection, { AthleteDetails } from '@/features/tariff/components/AthleteDetailsSection';
import ActionsBar from '@/features/elementKeyboard/components/ActionsBar';
import SortingBar from '@/features/elementKeyboard/components/SortingBar';
import ElementsGrid from '@/features/elementKeyboard/components/ElementsGrid';
import useTariffPassKeyboard from '@/features/tariff/state/useTariffPassKeyboard';
import TariffPassRow from '@/features/tariff/components/TariffPassRow';
import PassWarningOverlay from '@/features/tariff/components/PassWarningOverlay';
import type { DisplayItem } from '@/features/calculator/types';
import TariffStickyActions from '@/features/tariff/components/TariffStickyActions';
import TariffExportSuccessModal from '@/features/tariff/components/TariffExportSuccessModal';
import { exportTariffPdf } from '@/features/tariff/export/exportTariffPdf';
import { TariffExportData, TariffPassRowData } from '@/features/tariff/export/tariffOverlay';
import { TariffLang } from '@/features/tariff/background/tariffBackground';
import { getElementById } from '@/shared/data/elements';

type ElementsGridHandle = {
  scrollToTop: () => void;
};

function mapPassDisplayToExport(items: DisplayItem[]): TariffPassRowData {
  const symbols: (string | null)[] = [];
  const values: (number | string | null)[] = [];
  const bonuses: (number | string | null)[] = [];

  for (let i = 0; i < 8; i++) {
    const item = items[i] as any;
    if (!item) {
      symbols.push(null);
      values.push(null);
      bonuses.push(null);
      continue;
    }

    const base = item.id ? getElementById(item.id) : undefined;

    const symbolFromBase =
      typeof base?.symbol === 'string' && base.symbol.trim() !== ''
        ? base.symbol
        : null;

    const symbol =
      symbolFromBase ??
      (typeof item.symbol === 'string' && item.symbol.trim() !== ''
        ? item.symbol
        : typeof item.label === 'string'
        ? item.label
        : '');

    const value =
      typeof item.value === 'number' || typeof item.value === 'string'
        ? item.value
        : typeof item.dd === 'number' || typeof item.dd === 'string'
        ? item.dd
        : null;

    const bonus =
      typeof item.bonus === 'number' || typeof item.bonus === 'string'
        ? item.bonus
        : 0;

    symbols.push(symbol || null);
    values.push(value);
    bonuses.push(bonus);
  }

  return { symbols, values, bonuses };
}

export default function TariffScreen() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const [elementMode, setElementMode] = useState<'text' | 'symbol'>('text');
  const [showPassWarning, setShowPassWarning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUri, setExportedUri] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const [athlete, setAthlete] = useState<AthleteDetails>({
    country: 'ISR',
    autoBonus: true,
    name: '',
    club: '',
    athleteNumber: '',
    round: '',
    gender: null,
    track: null,
    level: null,
  });

  const gridRef = useRef<ElementsGridHandle | null>(null);

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
  } = useTariffPassKeyboard(athlete.track ?? null, elementMode);

  const barDirection: 'ltr' | 'rtl' =
    elementMode === 'symbol' ? 'ltr' : isRTL ? 'rtl' : 'ltr';

  const symbolFontSize = 25;

  const handleSelectFromKeyboard = (item: DisplayItem) => {
    if (!activePass) {
      if (!showPassWarning) setShowPassWarning(true);
      return;
    }
    addElement(item.id, item.value);
  };

  const handleResetPage = () => {
    setAthlete({
      country: 'ISR',
      autoBonus: true,
      name: '',
      club: '',
      athleteNumber: '',
      round: '',
      gender: null,
      track: null,
      level: null,
    });
    clearAll();
    setActivePass(null);
    setTimeout(() => {
      gridRef.current?.scrollToTop?.();
    }, 0);
  };

  const handleExport = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);

      const tariffLang: TariffLang = lang === 'he' ? 'he' : 'en';

      const data: TariffExportData = {
        lang: tariffLang,
        form: {
          athleteName: athlete.name,
          club: athlete.club,
          gender: athlete.gender ? String(athlete.gender) : '',
          track: athlete.track ? String(athlete.track) : '',
          level: athlete.level ? String(athlete.level) : '',
          athleteNo: athlete.athleteNumber,
          rotation: athlete.round,
        },
        pass1: mapPassDisplayToExport(pass1Display),
        pass2: mapPassDisplayToExport(pass2Display),
      };

      const result = await exportTariffPdf(data);
      setExportedUri(result.uri);
      setShowExportModal(true);
    } catch (e) {
      console.warn('Tariff export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPdf = async () => {
    if (!exportedUri) return;
    try {
      await Sharing.shareAsync(exportedUri);
    } catch (e) {
      console.warn('Failed to open exported PDF', e);
    }
  };

  const handleSharePdf = async () => {
    if (!exportedUri) return;
    try {
      await Sharing.shareAsync(exportedUri);
    } catch (e) {
      console.warn('Failed to share exported PDF', e);
    }
  };

  const header = (
    <View style={styles.headerWrapper}>
      <View style={styles.formWrapper}>
        <AthleteDetailsSection value={athlete} onChange={setAthlete} />
      </View>

      <View style={styles.passesSection}>
        <TariffPassRow
          label={t(lang, 'tariff.passes.pass1')}
          items={pass1Display}
          maxSlots={maxSlots}
          direction={barDirection}
          isActive={activePass === 1}
          onPress={() => setActivePass(activePass === 1 ? null : 1)}
          isSymbolMode={elementMode === 'symbol'}
          symbolFontSize={symbolFontSize}
          showBonusRow={athlete.autoBonus}
        />
        <TariffPassRow
          label={t(lang, 'tariff.passes.pass2')}
          items={pass2Display}
          maxSlots={maxSlots}
          direction={barDirection}
          isActive={activePass === 2}
          onPress={() => setActivePass(activePass === 2 ? null : 2)}
          isSymbolMode={elementMode === 'symbol'}
          symbolFontSize={symbolFontSize}
          showBonusRow={athlete.autoBonus}
        />
      </View>

      <View style={styles.keyboardHeader}>
        <View
          style={{
            paddingTop: 8,
            alignItems: isRTL ? 'flex-end' : 'flex-start',
          }}
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
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBarWrapper, { borderBottomColor: colors.border }]}>
        <TopBar
          titleKey="tabs.tariff"
          showBack={false}
          showElementToggle
          elementMode={elementMode}
          onToggleElementMode={() =>
            setElementMode(prev => (prev === 'text' ? 'symbol' : 'text'))
          }
        />
      </View>

      <View style={styles.body}>
        <ElementsGrid
          ref={gridRef as any}
          elements={elements}
          onSelect={handleSelectFromKeyboard}
          titleFontSize={14}
          header={header}
          forceLTR={false}
          isSymbolMode={elementMode === 'symbol'}
          symbolFontSize={symbolFontSize}
          extraBottomPadding={80}
        />
      </View>

      <TariffStickyActions
        onReset={handleResetPage}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <PassWarningOverlay
        visible={showPassWarning}
        onHide={() => setShowPassWarning(false)}
      />

      <TariffExportSuccessModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        onOpen={handleOpenPdf}
        onShare={handleSharePdf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBarWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  headerWrapper: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  formWrapper: {
    paddingHorizontal: 8,
  },
  passesSection: {
    marginTop: 12,
    gap: 10,
  },
  keyboardHeader: {
    marginTop: 12,
  },
});
