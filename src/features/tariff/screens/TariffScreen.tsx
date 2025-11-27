import React, { useState, useRef, useMemo, useEffect } from 'react'
import { StyleSheet, View, Platform, Linking, LayoutChangeEvent } from 'react-native'
import * as Sharing from 'expo-sharing'
import * as FileSystemLegacy from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAppTheme } from '@/shared/theme/theme'
import { useLang } from '@/shared/state/lang'
import TopBar from '@/shared/ui/TopBar'
import { t } from '@/shared/i18n'
import AthleteDetailsSection, { AthleteDetails } from '@/features/tariff/components/AthleteDetailsSection'
import ActionsBar from '@/features/elementKeyboard/components/ActionsBar'
import SortingBar from '@/features/elementKeyboard/components/SortingBar'
import ElementsGrid from '@/features/elementKeyboard/components/ElementsGrid'
import useTariffPassKeyboard from '@/features/tariff/state/useTariffPassKeyboard'
import TariffPassRow from '@/features/tariff/components/TariffPassRow'
import PassWarningOverlay from '@/features/tariff/components/PassWarningOverlay'
import type { DisplayItem } from '@/features/calculator/types'
import TariffStickyActions from '@/features/tariff/components/TariffStickyActions'
import TariffExportSuccessModal from '@/features/tariff/components/TariffExportSuccessModal'
import { exportTariffPdf } from '@/features/tariff/export/exportTariffPdf'
import { TariffExportData, TariffPassRowData } from '@/features/tariff/export/tariffOverlay'
import { TariffLang } from '@/features/tariff/background/tariffBackground'
import { getElementById } from '@/shared/data/elements'
import { computePassBonuses } from '@/features/tariff/logic/tariffBonus'
import { validatePasses } from '@/features/tariff/logic/tariffLegality'
import TariffIllegalToast from '@/features/tariff/components/TariffIllegalToast'
import TariffIllegalExportConfirm from '@/features/tariff/components/TariffIllegalExportConfirm'

type ElementsGridHandle = {
  scrollToTop: () => void
}

const TARIFF_DIR_KEY = 'tariffExportDirUri'
const ALLOW_ILLEGAL_TARIFF_KEY = 'tariffAllowIllegalExport'

function mapPassDisplayToExport(
  items: DisplayItem[],
  bonuses: (number | null)[]
): TariffPassRowData {
  const symbols: (string | null)[] = []
  const values: (number | string | null)[] = []
  const bonusesOut: (number | string | null)[] = []

  for (let i = 0; i < 8; i++) {
    const item = items[i] as any
    if (!item) {
      symbols.push(null)
      values.push(null)
      bonusesOut.push(null)
      continue
    }

    let symbol: string | null = null
    if (item.id) {
      const el = getElementById(String(item.id))
      symbol = el?.symbol ?? null
    }
    if (!symbol && typeof item.symbol === 'string') {
      symbol = item.symbol
    }
    if (!symbol && typeof item.label === 'string') {
      symbol = item.label
    }

    let value: number | string | null = null
    if (typeof item.value === 'number' || typeof item.value === 'string') {
      value = item.value
    } else if (typeof item.dd === 'number' || typeof item.dd === 'string') {
      value = item.dd
    }

    const bonus = i < bonuses.length ? bonuses[i] : null

    symbols.push(symbol)
    values.push(value)
    bonusesOut.push(bonus)
  }

  return { symbols, values, bonuses: bonusesOut }
}

async function savePdfToDownloads(tempUri: string): Promise<string> {
  if (Platform.OS !== 'android') {
    return tempUri
  }

  const fsAny = FileSystemLegacy as any
  const saf = fsAny.StorageAccessFramework

  if (!saf) {
    console.warn('StorageAccessFramework is not available on this device')
    return tempUri
  }

  try {
    let directoryUri: string | null = await AsyncStorage.getItem(TARIFF_DIR_KEY)

    if (!directoryUri) {
      const permissions = await saf.requestDirectoryPermissionsAsync()
      if (!permissions.granted || !permissions.directoryUri) {
        return tempUri
      }
      const pickedDir: string = permissions.directoryUri
      directoryUri = pickedDir
      await AsyncStorage.setItem(TARIFF_DIR_KEY, pickedDir)
    }

    const base64 = await fsAny.readAsStringAsync(tempUri, {
      encoding: 'base64',
    })

    const fileName = `TDJP TariffShits - ${Date.now()}.pdf`

    const newUri = await saf.createFileAsync(
      directoryUri,
      fileName,
      'application/pdf'
    )

    await fsAny.writeAsStringAsync(newUri, base64, {
      encoding: 'base64',
    })

    return newUri
  } catch (e) {
    console.warn('Failed to save PDF to Downloads-like folder', e)
    return tempUri
  }
}

export default function TariffScreen() {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const isRTL = lang === 'he'

  const [elementMode, setElementMode] = useState<'text' | 'symbol'>('text')
  const [showPassWarning, setShowPassWarning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedUri, setExportedUri] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showIllegalToast, setShowIllegalToast] = useState(false)
  const [allowIllegalExport, setAllowIllegalExport] = useState(false)
  const [showIllegalExportConfirm, setShowIllegalExportConfirm] = useState(false)

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
  })

  const [topBarHeight, setTopBarHeight] = useState(0)
  const [gridOffsetY, setGridOffsetY] = useState(0)

  const [headerOffsetY, setHeaderOffsetY] = useState(0)
  const [passesOffsetY, setPassesOffsetY] = useState(0)
  const [pass1OffsetY, setPass1OffsetY] = useState(0)
  const [pass2OffsetY, setPass2OffsetY] = useState(0)

  const [pass1SlotWidths, setPass1SlotWidths] = useState<number[]>([])
  const [pass2SlotWidths, setPass2SlotWidths] = useState<number[]>([])

  const gridRef = useRef<ElementsGridHandle | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(ALLOW_ILLEGAL_TARIFF_KEY)
      .then(value => {
        setAllowIllegalExport(value === '1')
      })
      .catch(() => {})
  }, [])

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
  } = useTariffPassKeyboard(athlete.track ?? null, elementMode)

  const barDirection: 'ltr' | 'rtl' =
    elementMode === 'symbol' ? 'ltr' : isRTL ? 'rtl' : 'ltr'

  const slotSymbolFontSize = 10
  const keyboardSymbolFontSize = 25

  const handleSelectFromKeyboard = (item: DisplayItem) => {
    if (!activePass) {
      if (!showPassWarning) setShowPassWarning(true)
      return
    }
    addElement(item.id, item.value)
  }

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
    })
    clearAll()
    setActivePass(null)
    setTimeout(() => {
      gridRef.current?.scrollToTop?.()
    }, 0)
  }

  const bonusMeta = useMemo(
    () => ({
      track: athlete.track ?? null,
      level: athlete.level ?? null,
      gender: athlete.gender ?? null,
    }),
    [athlete.track, athlete.level, athlete.gender]
  )

  const pass1Bonuses = useMemo<(number | null)[]>(() => {
    if (!athlete.autoBonus) return Array(8).fill(null)
    const values = pass1Display.map(x => x.value)
    const res = computePassBonuses(values, bonusMeta)
    return res.perElement
  }, [athlete.autoBonus, pass1Display, bonusMeta])

  const pass2Bonuses = useMemo<(number | null)[]>(() => {
    if (!athlete.autoBonus) return Array(8).fill(null)
    const values = pass2Display.map(x => x.value)
    const res = computePassBonuses(values, bonusMeta)
    return res.perElement
  }, [athlete.autoBonus, pass2Display, bonusMeta])

  const pass1Ids = useMemo(
    () => pass1Display.map((x: any) => (x && x.id ? String(x.id) : null)),
    [pass1Display]
  )

  const pass2Ids = useMemo(
    () => pass2Display.map((x: any) => (x && x.id ? String(x.id) : null)),
    [pass2Display]
  )

  const legality = useMemo(
    () => validatePasses(pass1Ids, pass2Ids, lang === 'he' ? 'he' : 'en'),
    [pass1Ids, pass2Ids, lang]
  )

  const pass1IllegalIndices = legality?.p1?.badIdx ?? []
  const pass2IllegalIndices = legality?.p2?.badIdx ?? []

  const pass1Warnings = useMemo(() => {
    if (!legality) return []
    return Array.from(new Set(legality.p1?.messages ?? []))
  }, [legality])

  const pass2Warnings = useMemo(() => {
    if (!legality) return []
    const msgs = [...(legality.p2?.messages ?? [])]
    if (legality.both) msgs.push(...legality.both)
    return Array.from(new Set(msgs))
  }, [legality])

  const isLegal = legality?.isLegal ?? true

  const handleExport = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)

      const tariffLang: TariffLang = lang === 'he' ? 'he' : 'en'

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
        pass1: mapPassDisplayToExport(pass1Display, pass1Bonuses),
        pass2: mapPassDisplayToExport(pass2Display, pass2Bonuses),
      }

      const result = await exportTariffPdf(data)

      let finalUri = result.uri
      try {
        finalUri = await savePdfToDownloads(result.uri)
      } catch (e) {
        console.warn('Tariff save to downloads failed', e)
      }

      setExportedUri(finalUri)
      setShowExportModal(true)
    } catch (e) {
      console.warn('Tariff export failed', e)
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenPdf = async () => {
    if (!exportedUri) return

    if (Platform.OS === 'android') {
      try {
        if (exportedUri.startsWith('content://')) {
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: exportedUri,
            flags: 1,
            type: 'application/pdf',
          })
        } else {
          const contentUri = await FileSystemLegacy.getContentUriAsync(exportedUri)
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/pdf',
          })
        }
        return
      } catch (e) {
        console.warn('Open PDF with intent failed, falling back to share', e)
        try {
          await Sharing.shareAsync(exportedUri)
        } catch (err) {
          console.warn('Failed to share exported PDF', err)
        }
        return
      }
    }

    try {
      await Linking.openURL(exportedUri)
    } catch (e) {
      console.warn('Open PDF failed, falling back to share', e)
      try {
        await Sharing.shareAsync(exportedUri)
      } catch (err) {
        console.warn('Failed to share exported PDF', err)
      }
    }
  }

  const handleSharePdf = async () => {
    if (!exportedUri) return
    try {
      await Sharing.shareAsync(exportedUri)
    } catch (e) {
      console.warn('Failed to share exported PDF', e)
    }
  }

  const handleTopBarLayout = (e: LayoutChangeEvent) => {
    setTopBarHeight(e.nativeEvent.layout.height)
  }

  const handleHeaderLayout = (e: LayoutChangeEvent) => {
    setHeaderOffsetY(e.nativeEvent.layout.y)
  }

  const handlePassesLayout = (e: LayoutChangeEvent) => {
    setPassesOffsetY(e.nativeEvent.layout.y)
  }

  const handlePass1Layout = (e: LayoutChangeEvent) => {
    setPass1OffsetY(e.nativeEvent.layout.y)
  }

  const handlePass2Layout = (e: LayoutChangeEvent) => {
    setPass2OffsetY(e.nativeEvent.layout.y)
  }

  const handlePass1SlotWidthMeasured = (idx: number, width: number) => {
    setPass1SlotWidths(prev => {
      if (prev[idx] === width) return prev
      const next = [...prev]
      next[idx] = width
      return next
    })
  }

  const handlePass2SlotWidthMeasured = (idx: number, width: number) => {
    setPass2SlotWidths(prev => {
      if (prev[idx] === width) return prev
      const next = [...prev]
      next[idx] = width
      return next
    })
  }

  const pass1GlobalOffset = headerOffsetY + passesOffsetY + pass1OffsetY
  const pass2GlobalOffset = headerOffsetY + passesOffsetY + pass2OffsetY

  const activePassOffset =
    activePass === 1 ? pass1GlobalOffset : activePass === 2 ? pass2GlobalOffset : 0

  const showStickyPassHeader = useMemo(() => {
    if (!activePass) return false
    return gridOffsetY >= activePassOffset
  }, [activePass, activePassOffset, gridOffsetY])

  const activePassLabel =
    activePass === 1
      ? t(lang, 'tariff.passes.pass1')
      : activePass === 2
      ? t(lang, 'tariff.passes.pass2')
      : ''

  const activePassItems =
    activePass === 1 ? (pass1Display as any) : activePass === 2 ? (pass2Display as any) : []

  const activePassBonuses = activePass === 1 ? pass1Bonuses : activePass === 2 ? pass2Bonuses : []

  const activePassIllegalIndices =
    activePass === 1 ? pass1IllegalIndices : activePass === 2 ? pass2IllegalIndices : []

  const activePassWarnings =
    activePass === 1 ? pass1Warnings : activePass === 2 ? pass2Warnings : []

  const stickySlotWidths =
    activePass === 1 ? pass1SlotWidths : activePass === 2 ? pass2SlotWidths : []

  const header = (
    <View style={styles.headerWrapper} onLayout={handleHeaderLayout}>
      <View style={styles.formWrapper}>
        <AthleteDetailsSection value={athlete} onChange={setAthlete} />
      </View>

      <View style={styles.passesSection} onLayout={handlePassesLayout}>
        <View onLayout={handlePass1Layout}>
          <TariffPassRow
            label={t(lang, 'tariff.passes.pass1')}
            items={pass1Display as any}
            maxSlots={maxSlots}
            direction={barDirection}
            isActive={activePass === 1}
            onPress={() => setActivePass(activePass === 1 ? null : 1)}
            isSymbolMode={elementMode === 'symbol'}
            symbolFontSize={slotSymbolFontSize}
            showBonusRow={athlete.autoBonus}
            bonusValues={pass1Bonuses}
            illegalIndices={pass1IllegalIndices}
            warningMessages={pass1Warnings}
            onSlotWidthMeasured={handlePass1SlotWidthMeasured}
          />
        </View>

        <View onLayout={handlePass2Layout}>
          <TariffPassRow
            label={t(lang, 'tariff.passes.pass2')}
            items={pass2Display as any}
            maxSlots={maxSlots}
            direction={barDirection}
            isActive={activePass === 2}
            onPress={() => setActivePass(activePass === 2 ? null : 2)}
            isSymbolMode={elementMode === 'symbol'}
            symbolFontSize={slotSymbolFontSize}
            showBonusRow={athlete.autoBonus}
            bonusValues={pass2Bonuses}
            illegalIndices={pass2IllegalIndices}
            warningMessages={pass2Warnings}
            onSlotWidthMeasured={handlePass2SlotWidthMeasured}
          />
        </View>
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
  )

  const handleExportPress = async () => {
    let allow = allowIllegalExport
    try {
      const raw = await AsyncStorage.getItem(ALLOW_ILLEGAL_TARIFF_KEY)
      allow = raw === '1'
      setAllowIllegalExport(allow)
    } catch {
    }

    if (!isLegal && allow) {
      setShowIllegalExportConfirm(true)
      return
    }

    if (!isLegal && !allow) {
      setShowIllegalToast(true)
      return
    }

    handleExport()
  }

  const handleConfirmIllegalExport = () => {
    setShowIllegalExportConfirm(false)
    handleExport()
  }

  const handleCancelIllegalExport = () => {
    setShowIllegalExportConfirm(false)
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[styles.topBarWrapper, { borderBottomColor: colors.border }]}
        onLayout={handleTopBarLayout}
      >
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
          symbolFontSize={keyboardSymbolFontSize}
          extraBottomPadding={80}
          onScrollOffsetChange={setGridOffsetY}
        />
      </View>

      {showStickyPassHeader && activePass && (
        <View style={[styles.stickyPassWrapper, { top: topBarHeight }]}>
          <TariffPassRow
            label={activePassLabel}
            items={activePassItems}
            maxSlots={maxSlots}
            direction={barDirection}
            isActive={true}
            onPress={() => setActivePass(null)}
            isSymbolMode={elementMode === 'symbol'}
            symbolFontSize={slotSymbolFontSize}
            showBonusRow={false}
            bonusValues={activePassBonuses}
            illegalIndices={activePassIllegalIndices}
            slotWidthOverrides={stickySlotWidths}
          />
        </View>
      )}

      <TariffStickyActions
        onReset={handleResetPage}
        onExport={handleExportPress}
        onExportBlocked={() => setShowIllegalToast(true)}
        isExporting={isExporting}
        disableExport={!isLegal && !allowIllegalExport}
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

      <TariffIllegalToast
        visible={showIllegalToast}
        onHide={() => setShowIllegalToast(false)}
      />

      <TariffIllegalExportConfirm
        visible={showIllegalExportConfirm}
        onConfirm={handleConfirmIllegalExport}
        onCancel={handleCancelIllegalExport}
      />
    </View>
  )
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
  stickyPassWrapper: {
    position: 'absolute',
    left: 8,
    right: 8,
    paddingTop: 4,
    zIndex: 5,
  },
})
