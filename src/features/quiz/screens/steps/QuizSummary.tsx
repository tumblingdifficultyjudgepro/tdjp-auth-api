import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Animated, Easing, BackHandler } from 'react-native'; // הוספתי BackHandler
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'; // הוספתי useFocusEffect
import { useAppTheme } from '@/shared/theme/theme';
import { useLang } from '@/shared/state/lang';
import he from '@/shared/i18n/he';
import en from '@/shared/i18n/en';
import { ELEMENTS } from '@/shared/data/elements';
import type { ElementItem } from '../../types';
import { Svg, G, Circle } from 'react-native-svg';
import { useFonts, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';

type Result = { qid: string; selectedId: string | null; correct: boolean; selectedText?: string };

type RouteParams = {
  results: Result[];
  config: any;
  qids?: string[];
};

function getDict(lang: 'he'|'en') {
  return lang === 'he' ? he.quiz.summary : en.quiz.summary;
}
function getActions(lang: 'he'|'en') {
  return lang === 'he' ? he.quiz.actions : en.quiz.actions;
}
function getCommon(lang: 'he'|'en') {
  return lang === 'he' ? he.quiz : en.quiz;
}

function toVal(v: string | number) {
  const n = Number(v);
  if (!Number.isNaN(n) && Number.isFinite(n) && Number.isInteger(n)) return n.toFixed(1);
  return String(v);
}

export default function QuizSummary() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const dict = getDict(lang);
  const actions = getActions(lang);
  const common = getCommon(lang);

  // === לוגיקת חזרה לעמוד הראשון של המבחן (QuizWizard) ===
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        nav.navigate('QuizWizard');
        return true; // חוסם יציאה רגילה
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [nav])
  );
  // ========================================================

  const headerText = lang === 'he' ? 'המבחן הושלם בהצלחה !' : 'Test completed successfully!';
  const correctLabelText = lang === 'he' ? 'התשובה הנכונה:' : 'Correct answer:';
  const unansweredText = lang === 'he' ? 'לא נענתה תשובה' : 'No answer';
  const practiceAgainText = lang === 'he' ? 'תרגל שוב' : 'Practice again';
  const closeText = lang === 'he' ? 'סגור' : 'Close';

  const { results = [], config } = (route.params || {}) as RouteParams;
  const [fontsLoaded] = useFonts({ FrankRuhlLibre_700Bold });

  const total = results.length;
  const correctCount = results.filter(r => r.correct).length;

  const [showPercent, setShowPercent] = React.useState(false);
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const isRTL = lang === 'he';

  const items = React.useMemo(() => {
    const t = (lang === 'he' ? he.quiz.templates : en.quiz.templates);
    return results.map((r, idx) => {
      const isOpen = r.qid.startsWith('open:');
      const rest = isOpen ? r.qid.slice(5) : r.qid;
      const [template, itemId] = rest.split(':');
      const elem = (ELEMENTS as unknown as ElementItem[]).find(e => String(e.id) === String(itemId));

      const topLine =
        template === 'nameToValue'   ? t.nameToValue :
        template === 'symbolToValue' ? t.symbolToValue :
        template === 'valueToName'   ? t.valueToName :
                                       t.valueToSymbol;

      const secondLine =
        template === 'nameToValue'   ? (elem ? (lang === 'he' ? elem.name.he : elem.name.en) : '') :
        template === 'symbolToValue' ? (elem ? elem.symbol : '') :
        /* valueToName / valueToSymbol */ (elem ? toVal(elem.value) : '');

      const correctLabel =
        template === 'nameToValue' || template === 'symbolToValue'
          ? (elem ? toVal(elem.value) : '')
          : template === 'valueToName'
          ? (elem ? (lang === 'he' ? elem.name.he : elem.name.en) : '')
          : (elem ? elem.symbol : '');

      const unanswered = r.selectedId == null;

      return {
        key: `${idx}-${r.qid}`,
        correct: r.correct,
        unanswered,
        topLine,
        secondLine,
        correctLabel,
        userAnswer: r.selectedText ?? undefined,
        isSymbol: template === 'valueToSymbol' || template === 'symbolToValue',
        isValue: template === 'nameToValue' || template === 'symbolToValue',
      };
    });
  }, [results, lang]);

  const flip = React.useRef(new Animated.Value(0)).current;
  const onPressDonut = () => {
    const to = showPercent ? 0 : 1;
    Animated.timing(flip, {
      toValue: to,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setShowPercent(!showPercent);
  };

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate  = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity  = flip.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });

  const handlePracticeAgain = () => {
    const seedQids = results.map(r => r.qid);
    nav.replace('QuizRun', { config, seedQids });
  };

  const handleClose = () => {
    nav.navigate('QuizWizard');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={[styles.body, { alignItems: 'center' }]}>

        <View style={{ height: 22 }} />

        <Text style={[styles.title, { color: colors.text }]}>{headerText}</Text>

        <Pressable onPress={onPressDonut} hitSlop={8} style={styles.donutWrap}>
          <Donut
            size={180}
            strokeWidth={16}
            correct={correctCount}
            total={total}
            colors={colors}
            showPercent={showPercent}
          />

          <Animated.Text
            style={[
              styles.donutCenter,
              {
                color: colors.text,
                writingDirection: 'ltr',
                transform: [{ rotateY: frontRotate }, { perspective: 800 }],
                opacity: frontOpacity,
                fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
                fontWeight: 'normal',
              },
            ]}
          >
            {'\u2066'}{correctCount} / {total}{'\u2069'}
          </Animated.Text>

          <Animated.Text
            style={[
              styles.donutCenter,
              {
                color: colors.text,
                writingDirection: 'ltr',
                position: 'absolute',
                transform: [{ rotateY: backRotate }, { perspective: 800 }],
                opacity: backOpacity,
                fontFamily: fontsLoaded ? 'FrankRuhlLibre_700Bold' : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
                fontWeight: 'normal',
              },
            ]}
          >
            {'\u2066'}{percent}%{'\u2069'}
          </Animated.Text>
        </Pressable>

        <View style={styles.listWrap}>
          {items.map((it) => (
            <View
              key={it.key}
              style={[
                styles.card,
                { borderColor: it.correct ? '#22c55e' : '#ef4444', backgroundColor: colors.card },
              ]}
            >
              {/* שורה עליונה של השאלה */}
              <Text
                style={[
                  styles.prompt,
                  { color: colors.text, textAlign: 'center', writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
              >
                {it.topLine}
              </Text>

              {/* שורה שנייה – האלמנט/סימבול/ערך בפונט המיוחד */}
              {!!it.secondLine && (
                <Text
                  style={[
                    styles.promptBig,
                    {
                      color: colors.text,
                      fontFamily: fontsLoaded
                        ? 'FrankRuhlLibre_700Bold'
                        : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
                      fontWeight: 'normal',
                      writingDirection: it.isSymbol || it.isValue ? 'ltr' : (isRTL ? 'rtl' : 'ltr'),
                    },
                  ]}
                >
                  {'\u2066'}{it.secondLine}{'\u2069'}
                </Text>
              )}

              {it.correct && (
                <Text
                  style={[
                    styles.correctBadge,
                    { color: '#22c55e' }, // ללא פונט מיוחד – נשאר רגיל
                  ]}
                >
                  {actions.correct}
                </Text>
              )}

              {!it.correct && it.userAnswer != null && it.userAnswer !== '' && (
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <Text style={[styles.answerLabel, { color: '#ef4444', writingDirection: 'rtl' }]}>
                    {lang === 'he' ? 'תשובה שגויה:' : 'Wrong answer:'}
                  </Text>
                  <Text
                    style={[
                      styles.answerValue,
                      {
                        color: '#ef4444',
                        fontFamily: fontsLoaded
                          ? 'FrankRuhlLibre_700Bold'
                          : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
                        fontWeight: 'normal',
                        writingDirection: it.isSymbol || it.isValue ? 'ltr' : (isRTL ? 'rtl' : 'ltr'),
                      },
                    ]}
                  >
                    {'\u2066'}{String(it.userAnswer)}{'\u2069'}
                  </Text>

                  <Text style={[styles.correctLabel, { color: '#22c55e', marginTop: 8 }]}>{correctLabelText}</Text>
                  <Text
                    style={[
                      styles.correctValue,
                      {
                        color: '#22c55e',
                        fontFamily: fontsLoaded
                          ? 'FrankRuhlLibre_700Bold'
                          : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
                        fontWeight: 'normal',
                        writingDirection: it.isSymbol || it.isValue ? 'ltr' : (isRTL ? 'rtl' : 'ltr'),
                      },
                    ]}
                  >
                    {'\u2066'}{it.correctLabel}{'\u2069'}
                  </Text>
                </View>
              )}

              {!it.correct && (it.userAnswer == null || it.userAnswer === '') && (
                <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <Text style={[styles.answerLabel, { color: colors.text }]}>{unansweredText}</Text>
                  <Text style={[styles.correctLabel, { color: '#22c55e', marginTop: 8 }]}>{correctLabelText}</Text>
                  <Text
                    style={[
                      styles.correctValue,
                      {
                        color: '#22c55e',
                        fontFamily: fontsLoaded
                          ? 'FrankRuhlLibre_700Bold'
                          : Platform.select({ ios: 'Courier New', android: 'monospace', default: undefined }),
                        fontWeight: 'normal',
                        writingDirection: it.isSymbol || it.isValue ? 'ltr' : (isRTL ? 'rtl' : 'ltr'),
                      },
                    ]}
                  >
                    {'\u2066'}{it.correctLabel}{'\u2069'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: '#ffffff44' }]}>
        <Pressable onPress={handlePracticeAgain} style={[styles.barBtn, { backgroundColor: colors.tint }]}>
          <Text style={styles.barBtnText}>{practiceAgainText}</Text>
        </Pressable>
        <Pressable
          onPress={handleClose}
          style={[styles.barBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
        >
          <Text style={[styles.barBtnText, { color: colors.text }]}>{closeText}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Donut({
  size,
  strokeWidth,
  correct,
  total,
  colors,
  showPercent,
}: {
  size: number;
  strokeWidth: number;
  correct: number;
  total: number;
  colors: any;
  showPercent: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? correct / total : 0;
  const correctLen = pct * circumference;

  return (
    <Svg width={size} height={size}>
      <G rotation={-90} originX={cx} originY={cy}>
        <Circle cx={cx} cy={cy} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeDasharray={`${correctLen} ${circumference}`}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, width: '100%' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  donutWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  donutCenter: { position: 'absolute', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  listWrap: { width: '100%', gap: 10 },
  card: { borderWidth: 2, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  prompt: { fontSize: 16, fontWeight: '700' },
  promptBig: { fontSize: 24, fontWeight: 'normal', marginTop: 4, textAlign: 'center' },
  answerLabel: { fontSize: 14, fontWeight: '700' },
  answerValue: { fontSize: 20, fontWeight: 'normal', textAlign: 'center', marginTop: 2 },
  correctLabel: { fontSize: 14, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
  correctValue: { fontSize: 20, fontWeight: 'normal', textAlign: 'center' },
  correctBadge: { textAlign: 'center', fontSize: 16, fontWeight: '800', marginTop: 8 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, flexDirection: 'row', gap: 10 },
  barBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  barBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});