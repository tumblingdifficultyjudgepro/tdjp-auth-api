import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import { t } from '@/shared/i18n';

export type CountryCode = 'ISR' | 'GBR' | 'USA' | 'RUS' | 'UKR' | 'CHN';
export type Gender = 'F' | 'M' | null;
export type Track = 'league' | 'national' | 'international' | null;

export type AthleteDetails = {
  country: CountryCode;
  autoBonus: boolean;
  name: string;
  club: string;
  athleteNumber: string;
  round: string;
  gender: Gender;
  track: Track;
};

type Props = {
  value: AthleteDetails;
  onChange: (next: AthleteDetails) => void;
};

type CountryOption = {
  code: CountryCode;
  labelKey: string;
  flag: string;
};

const COUNTRIES: CountryOption[] = [
  { code: 'ISR', labelKey: 'tariff.athlete.countryIsrael', flag: '🇮🇱' },
  { code: 'GBR', labelKey: 'tariff.athlete.countryBritain', flag: '🇬🇧' },
  { code: 'USA', labelKey: 'tariff.athlete.countryUSA', flag: '🇺🇸' },
  { code: 'RUS', labelKey: 'tariff.athlete.countryRussia', flag: '🇷🇺' },
  { code: 'UKR', labelKey: 'tariff.athlete.countryUkraine', flag: '🇺🇦' },
  { code: 'CHN', labelKey: 'tariff.athlete.countryChina', flag: '🇨🇳' },
];

export default function AthleteDetailsSection({ value, onChange }: Props) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const accent = colors.text;

  const selectedCountry = useMemo(
    () => COUNTRIES.find(c => c.code === value.country) ?? COUNTRIES[0],
    [value.country],
  );

  const isIsrael = value.country === 'ISR';

  const setField = <K extends keyof AthleteDetails>(key: K, v: AthleteDetails[K]) => {
    onChange({ ...value, [key]: v });
  };

  const genderLabel = (g: Gender) =>
    g === 'F'
      ? t(lang, 'tariff.athlete.genderF')
      : g === 'M'
      ? t(lang, 'tariff.athlete.genderM')
      : '';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
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
            >
              {t(lang, selectedCountry.labelKey)}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setField('autoBonus', !value.autoBonus)}
          style={({ pressed }) => [
            styles.autoBonusContainer,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              opacity: pressed ? 0.7 : 1,
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
          <Text
            style={[
              styles.autoBonusLabel,
              {
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'tariff.athlete.autoBonus')}
          </Text>
        </Pressable>
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
              <TextInput
                value={value.club}
                onChangeText={text => setField('club', text)}
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
                  setField('athleteNumber', text.replace(/[^0-9]/g, '').slice(0, 4))
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
                  onPress={() =>
                    setField('track', value.track === 'league' ? null : 'league')
                  }
                />
                <TrackChip
                  label={t(lang, 'tariff.athlete.trackNational')}
                  selected={value.track === 'national'}
                  onPress={() =>
                    setField('track', value.track === 'national' ? null : 'national')
                  }
                />
                <TrackChip
                  label={t(lang, 'tariff.athlete.trackInternational')}
                  selected={value.track === 'international'}
                  onPress={() =>
                    setField(
                      'track',
                      value.track === 'international' ? null : 'international',
                    )
                  }
                />
              </View>
            </View>
          </View>
        </>
      )}

      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        selected={selectedCountry.code}
        onSelect={code => {
          setField('country', code);
          setCountryPickerVisible(false);
        }}
      />
    </View>
  );
}

type FieldLabelProps = {
  text: string;
  color: string;
  isRTL: boolean;
};

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
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function GenderChip({ label, selected, onPress }: ChipProps) {
  const { colors } = useAppTheme();
  const accent = colors.text;

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
  );
}

function TrackChip({ label, selected, onPress }: ChipProps) {
  const { colors } = useAppTheme();
  const accent = colors.text;

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
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type CountryPickerProps = {
  visible: boolean;
  selected: CountryCode;
  onClose: () => void;
  onSelect: (code: CountryCode) => void;
};

function CountryPickerModal({ visible, selected, onClose, onSelect }: CountryPickerProps) {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';
  const accent = colors.text;

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
              const isSelected = item.code === selected;
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
              );
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
  );
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 16,
    maxWidth: 140,
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
    fontSize: 12,
    flexShrink: 1,
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
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  trackChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    minWidth: 90,
    maxWidth: '100%',
  },
  trackChipText: {
    fontSize: 13,
    textAlign: 'center',
    flexShrink: 1,
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
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 14,
  },
});
