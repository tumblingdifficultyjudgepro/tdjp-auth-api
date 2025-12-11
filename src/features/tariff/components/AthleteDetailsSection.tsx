import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native'
import { useAppTheme } from '@/shared/theme/theme'
import { useLang } from '@/shared/state/lang'
import { t } from '@/shared/i18n'
import { CLUBS } from '@/shared/data/clubs'

export type CountryCode = 'ISR' | 'GBR' | 'USA' | 'RUS' | 'UKR' | 'CHN'
export type Gender = 'F' | 'M' | null
export type Track = 'league' | 'national' | 'international' | null
export type TrackLevel = string | null

export type AthleteDetails = {
  country: CountryCode
  autoBonus: boolean
  name: string
  club: string
  athleteNumber: string
  round: string
  gender: Gender
  track: Track
  level: TrackLevel
}

type Props = {
  value: AthleteDetails
  onChange: (next: AthleteDetails) => void
}

type CountryOption = {
  code: CountryCode
  labelKey: string
  flag: string
}

const COUNTRIES: CountryOption[] = [
  { code: 'ISR', labelKey: 'tariff.athlete.countryIsrael', flag: '🇮🇱' },
  { code: 'GBR', labelKey: 'tariff.athlete.countryBritain', flag: '🇬🇧' },
  { code: 'USA', labelKey: 'tariff.athlete.countryUSA', flag: '🇺🇸' },
  { code: 'RUS', labelKey: 'tariff.athlete.countryRussia', flag: '🇷🇺' },
  { code: 'UKR', labelKey: 'tariff.athlete.countryUkraine', flag: '🇺🇦' },
  { code: 'CHN', labelKey: 'tariff.athlete.countryChina', flag: '🇨🇳' },
]

const LEVELS_BY_TRACK: { [K in Exclude<Track, null>]: string[] } = {
  league: ['א', 'ב', 'ג', 'ד'],
  national: ['1', '2', '3', '4', '5'],
  international: ['Age 1', 'Age 2', 'Junior', 'Age 3', 'Senior'],
}

export default function AthleteDetailsSection({ value, onChange }: Props) {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const isRTL = lang === 'he'
  const [countryPickerVisible, setCountryPickerVisible] = useState(false)
  const [clubPickerVisible, setClubPickerVisible] = useState(false)

  const accent = colors.text

  const selectedCountry = useMemo(
    () => COUNTRIES.find(c => c.code === value.country) ?? COUNTRIES[0],
    [value.country]
  )

  const isIsrael = value.country === 'ISR'

  const setField = <K extends keyof AthleteDetails>(key: K, v: AthleteDetails[K]) => {
    onChange({ ...value, [key]: v })
  }

  const genderLabel = (g: Gender) =>
    g === 'F'
      ? t(lang, 'tariff.athlete.genderF')
      : g === 'M'
        ? t(lang, 'tariff.athlete.genderM')
        : ''

  const autoBonusText = t(lang, 'tariff.athlete.autoBonus')

  const handleTrackPress = (track: Exclude<Track, null>) => {
    if (value.track === track) {
      onChange({ ...value, track: null, level: null })
    } else {
      onChange({ ...value, track, level: null })
    }
  }

  const currentLevels: string[] =
    value.track && value.track in LEVELS_BY_TRACK
      ? LEVELS_BY_TRACK[value.track as Exclude<Track, null>]
      : []

  const levelDirection =
    value.track === 'international'
      ? 'row'
      : isRTL
        ? 'row-reverse'
        : 'row'

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-end' },
        ]}
      >
        <View
          style={[
            styles.countryBlock,
            {
              marginStart: isRTL ? 12 : 0,
              marginEnd: isRTL ? 0 : 12,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'tariff.athlete.country')}
          </Text>

          <Pressable
            onPress={() => setCountryPickerVisible(true)}
            style={[
              styles.countrySelector,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text style={[styles.countryFlag, { fontSize: 18 }]}>
              {selectedCountry.flag}
            </Text>
            <Text
              style={[
                styles.countryName,
                {
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              numberOfLines={1}
            >
              {t(lang, selectedCountry.labelKey)}
            </Text>
          </Pressable>
        </View>
      </View>

      {!isIsrael ? (
        <View
          style={[
            styles.comingSoonBox,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.comingSoonText,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'tariff.athlete.countryComingSoon')}
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.row,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.fieldHalf,
                {
                  marginStart: isRTL ? 8 : 0,
                  marginEnd: isRTL ? 0 : 8,
                },
              ]}
            >
              <FieldLabel
                text={t(lang, 'tariff.athlete.name')}
                color={colors.text}
                isRTL={isRTL}
              />
              <TextInput
                value={value.name}
                onChangeText={text => setField('name', text)}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.card,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.fieldHalf,
                {
                  marginStart: isRTL ? 0 : 8,
                  marginEnd: isRTL ? 8 : 0,
                },
              ]}
            >
              <FieldLabel
                text={t(lang, 'tariff.athlete.club')}
                color={colors.text}
                isRTL={isRTL}
              />

              <Pressable
                onPress={() => setClubPickerVisible(true)}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 40, // Match typical input height
                  }
                ]}
              >
                <Text style={{
                  color: value.club ? colors.text : colors.border,
                  textAlign: isRTL ? 'right' : 'left',
                  flex: 1
                }} numberOfLines={1}>
                  {value.club || t(lang, 'tariff.athlete.selectClub') || ''}
                </Text>
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.row,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.fieldThird,
                {
                  marginStart: isRTL ? 8 : 0,
                  marginEnd: isRTL ? 0 : 8,
                },
              ]}
            >
              <FieldLabel
                text={t(lang, 'tariff.athlete.number')}
                color={colors.text}
                isRTL={isRTL}
              />
              <TextInput
                value={value.athleteNumber}
                onChangeText={text =>
                  setField(
                    'athleteNumber',
                    text.replace(/[^0-9]/g, '').slice(0, 4)
                  )
                }
                keyboardType="number-pad"
                style={[
                  styles.input,
                  styles.inputCentered,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.card,
                  },
                ]}
                maxLength={4}
              />
            </View>

            <View style={styles.fieldThirdMiddle}>
              <FieldLabel
                text={t(lang, 'tariff.athlete.round')}
                color={colors.text}
                isRTL={isRTL}
              />
              <TextInput
                value={value.round}
                onChangeText={text =>
                  setField('round', text.replace(/[^0-9]/g, '').slice(0, 3))
                }
                keyboardType="number-pad"
                style={[
                  styles.input,
                  styles.inputCentered,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.card,
                  },
                ]}
                maxLength={3}
              />
            </View>

            <View
              style={[
                styles.fieldThird,
                {
                  marginStart: isRTL ? 0 : 8,
                  marginEnd: isRTL ? 8 : 0,
                },
              ]}
            >
              <FieldLabel
                text={t(lang, 'tariff.athlete.gender')}
                color={colors.text}
                isRTL={isRTL}
              />
              <View
                style={[
                  styles.genderRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <GenderChip
                  label={genderLabel('F')}
                  selected={value.gender === 'F'}
                  onPress={() =>
                    setField('gender', value.gender === 'F' ? null : 'F')
                  }
                />
                <GenderChip
                  label={genderLabel('M')}
                  selected={value.gender === 'M'}
                  onPress={() =>
                    setField('gender', value.gender === 'M' ? null : 'M')
                  }
                />
              </View>
            </View>
          </View>

          <View
            style={[
              styles.row,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={styles.fieldFull}>
              <FieldLabel
                text={t(lang, 'tariff.athlete.track')}
                color={colors.text}
                isRTL={isRTL}
              />
              <View
                style={[
                  styles.trackRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <TrackChip
                  label={t(lang, 'tariff.athlete.trackLeague')}
                  selected={value.track === 'league'}
                  onPress={() => handleTrackPress('league')}
                />
                <TrackChip
                  label={t(lang, 'tariff.athlete.trackNational')}
                  selected={value.track === 'national'}
                  onPress={() => handleTrackPress('national')}
                />
                <TrackChip
                  label={t(lang, 'tariff.athlete.trackInternational')}
                  selected={value.track === 'international'}
                  onPress={() => handleTrackPress('international')}
                />
              </View>

              {value.track && currentLevels.length > 0 && (
                <View style={styles.levelSection}>
                  <FieldLabel
                    text={t(lang, 'tariff.athlete.level')}
                    color={colors.text}
                    isRTL={isRTL}
                  />
                  <View
                    style={[
                      styles.levelRow,
                      {
                        flexDirection: levelDirection,
                        flexWrap: value.track === 'national' ? 'nowrap' : 'wrap',
                        justifyContent:
                          value.track === 'national' ? 'space-between' : 'flex-start',
                      },
                    ]}
                  >
                    {currentLevels.map(level => (
                      <LevelChip
                        key={level}
                        label={level}
                        selected={value.level === level}
                        onPress={() =>
                          setField(
                            'level',
                            value.level === level ? null : (level as TrackLevel)
                          )
                        }
                      />
                    ))}
                  </View>
                </View>
              )}

              <Pressable
                onPress={() => setField('autoBonus', !value.autoBonus)}
                style={({ pressed }) => [
                  styles.autoBonusContainer,
                  {
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    opacity: pressed ? 0.7 : 1,
                    alignSelf: 'stretch',
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkboxOuter,
                    {
                      borderColor: colors.border,
                      backgroundColor: value.autoBonus ? accent + '33' : colors.card,
                    },
                  ]}
                >
                  {value.autoBonus ? (
                    <View
                      style={[
                        styles.checkboxInner,
                        {
                          backgroundColor: accent,
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <View style={styles.autoBonusTextWrapper}>
                  <Text
                    style={[
                      styles.autoBonusLabel,
                      {
                        color: colors.text,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {autoBonusText}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </>
      )}

      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        selected={selectedCountry.code}
        onSelect={code => {
          setField('country', code)
          setCountryPickerVisible(false)
        }}
      />

      <ClubPickerModal
        visible={clubPickerVisible}
        onClose={() => setClubPickerVisible(false)}
        selected={value.club}
        onSelect={club => {
          setField('club', club)
          setClubPickerVisible(false)
        }}
      />
    </View>
  )
}

function ClubPickerModal({ visible, selected, onClose, onSelect }: { visible: boolean, selected: string, onClose: () => void, onSelect: (c: string) => void }) {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const isRTL = lang === 'he'
  const accent = colors.text

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '70%' }]}>
          <Text style={[styles.modalTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t(lang, 'tariff.athlete.selectClub') || 'Select Club'}
          </Text>

          <FlatList
            data={CLUBS}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const isSelected = item === selected
              return (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [
                    styles.countryRow,
                    {
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      backgroundColor: isSelected ? accent + '22' : pressed ? colors.card + '33' : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.countryRowLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                    {item}
                  </Text>
                </Pressable>
              )
            }}
          />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalCloseButton,
              { backgroundColor: accent, opacity: pressed ? 0.8 : 1, marginTop: 16 },
            ]}
          >
            <Text style={styles.modalCloseText}>{t(lang, 'common.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

type FieldLabelProps = {
  text: string
  color: string
  isRTL: boolean
}

function FieldLabel({ text, color, isRTL }: FieldLabelProps) {
  return (
    <Text
      style={[
        styles.label,
        {
          color,
          textAlign: isRTL ? 'right' : 'left',
        },
      ]}
    >
      {text}
    </Text>
  )
}

type ChipProps = {
  label: string
  selected: boolean
  onPress: () => void
}

function GenderChip({ label, selected, onPress }: ChipProps) {
  const { colors } = useAppTheme()
  const accent = colors.text

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.genderChip,
        {
          borderColor: selected ? accent : colors.border,
          backgroundColor: selected ? accent + '22' : colors.card,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.genderChipText,
          {
            color: colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

function TrackChip({ label, selected, onPress }: ChipProps) {
  const { colors } = useAppTheme()
  const accent = colors.text

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trackChip,
        {
          borderColor: selected ? accent : colors.border,
          backgroundColor: selected ? accent + '22' : colors.card,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.trackChipText,
          {
            color: colors.text,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        ellipsizeMode="clip"
      >
        {label}
      </Text>
    </Pressable>
  )
}

function LevelChip({ label, selected, onPress }: ChipProps) {
  const { colors } = useAppTheme()
  const accent = colors.text

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.levelChip,
        {
          borderColor: selected ? accent : colors.border,
          backgroundColor: selected ? accent + '22' : colors.card,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.levelChipText,
          {
            color: colors.text,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        ellipsizeMode="clip"
      >
        {label}
      </Text>
    </Pressable>
  )
}

type CountryPickerProps = {
  visible: boolean
  selected: CountryCode
  onClose: () => void
  onSelect: (code: CountryCode) => void
}

function CountryPickerModal({ visible, selected, onClose, onSelect }: CountryPickerProps) {
  const { colors } = useAppTheme()
  const { lang } = useLang()
  const isRTL = lang === 'he'
  const accent = colors.text

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'tariff.athlete.selectCountry')}
          </Text>

          <FlatList
            data={COUNTRIES}
            keyExtractor={item => item.code}
            renderItem={({ item }) => {
              const isSelected = item.code === selected
              return (
                <Pressable
                  onPress={() => onSelect(item.code)}
                  style={({ pressed }) => [
                    styles.countryRow,
                    {
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      backgroundColor: isSelected
                        ? accent + '22'
                        : pressed
                          ? colors.card + '33'
                          : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.countryRowLabel,
                      {
                        color: colors.text,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t(lang, item.labelKey)}
                  </Text>
                </Pressable>
              )
            }}
          />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalCloseButton,
              {
                backgroundColor: accent,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={styles.modalCloseText}>
              {t(lang, 'common.close')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 12,
  },
  row: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  countryBlock: {
    flexBasis: '55%',
    maxWidth: 150,
  },
  countrySelector: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 8,
  },
  countryFlag: {
    width: 26,
    textAlign: 'center',
  },
  countryName: {
    flex: 1,
    fontSize: 14,
  },
  autoBonusContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  autoBonusTextWrapper: {
    flexShrink: 1,
    flexGrow: 1,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  autoBonusLabel: {
    fontSize: 13,
  },
  comingSoonBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  comingSoonText: {
    fontSize: 14,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldThird: {
    flex: 1,
  },
  fieldThirdMiddle: {
    flex: 1,
    paddingHorizontal: 4,
  },
  fieldFull: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputCentered: {
    textAlign: 'center',
  },
  genderRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  genderChip: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipText: {
    fontSize: 14,
    textAlign: 'center',
  },
  trackRow: {
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 8,
  },
  trackChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minWidth: 0,
    marginHorizontal: 2,
  },
  trackChipText: {
    fontSize: 14,
    textAlign: 'center',
  },
  levelSection: {
    marginTop: 10,
  },
  levelRow: {
    alignItems: 'center',
    columnGap: 8,
    rowGap: 8,
    alignSelf: 'stretch',
  },
  levelChip: {
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  levelChipText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  countryRow: {
    paddingVertical: 8,
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  countryRowLabel: {
    fontSize: 14,
    flex: 1,
  },
  modalCloseButton: {
    marginTop: 16,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
