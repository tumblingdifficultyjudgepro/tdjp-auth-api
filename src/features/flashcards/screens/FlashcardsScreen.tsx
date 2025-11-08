import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useAppTheme } from '@/shared/theme/theme';
import { ELEMENTS, keyboardElementsFor } from '@/shared/data/elements';
import { useLang } from '@/shared/state/lang';
import TopBar from '@/shared/ui/TopBar';

const { width } = Dimensions.get('window');

type CardData = { id: string; title: string; symbol: string; value: number };

function CardItem({
  item,
  colors,
  onSuccess,
  onFail,
  mode
}: {
  item: CardData;
  colors: { bg: string; text: string; card: string; tint: string; border: string };
  onSuccess: () => void;
  onFail: () => void;
  mode: 'text' | 'symbol';
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const [highlight, setHighlight] = useState<'none' | 'green' | 'red'>('none');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const frontRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const borderColor = highlight === 'green' ? '#2ecc71' : highlight === 'red' ? '#e74c3c' : colors.border;
  const flip = (toBack: boolean) => {
    setFlipped(toBack);
    Animated.timing(progress, { toValue: toBack ? 1 : 0, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  };
  const mark = (ok: boolean) => {
    if (ok) onSuccess(); else onFail();
    setHighlight(ok ? 'green' : 'red');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHighlight('none'), 2000);
    flip(false);
  };
  useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  const frontText = mode === 'symbol' ? item.symbol : item.title;
  const frontSize = mode === 'symbol' ? 38 : 24;
  const frontWeight = mode === 'symbol' ? '800' : '700';

  return (
    <View style={[styles.itemContainer, { backgroundColor: colors.card, borderColor }]}>
      <Pressable onPress={() => flip(!flipped)} style={styles.cardPress}>
        <View style={styles.card3d}>
          <Animated.View style={[styles.face, { opacity: frontOpacity, transform: [{ perspective: 800 }, { rotateY: frontRotate }] }]} pointerEvents={flipped ? 'none' : 'auto'}>
            <Text style={{ color: colors.text, fontSize: frontSize, fontWeight: frontWeight as any, textAlign: 'center' }} numberOfLines={2}>{frontText}</Text>
          </Animated.View>
          <Animated.View style={[styles.face, styles.backFace, { opacity: backOpacity, transform: [{ perspective: 800 }, { rotateY: backRotate }] }]} pointerEvents={flipped ? 'auto' : 'none'}>
            <Text style={[styles.value, { color: colors.text }]}>{item.value}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => mark(true)} style={[styles.cta, styles.ok]}><Ionicons name="checkmark" size={22} color="#fff" /></Pressable>
              <Pressable onPress={() => mark(false)} style={[styles.cta, styles.no]}><Ionicons name="close" size={22} color="#fff" /></Pressable>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

export default function FlashcardsScreen() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  const forward = useMemo(() => keyboardElementsFor(lang, 'forward'), [lang]);
  const backward = useMemo(() => keyboardElementsFor(lang, 'backward'), [lang]);
  const baseData: CardData[] = useMemo(
    () => [...forward, ...backward].map(e => ({ id: e.id, title: e.name[lang], symbol: e.symbol, value: e.value })),
    [forward, backward, lang]
  );

  const [list, setList] = useState<CardData[]>(baseData);
  const [isShuffled, setIsShuffled] = useState(false);
  const [elementMode, setElementMode] = useState<'text' | 'symbol'>('text');

  useEffect(() => {
    setList(baseData);
    setIsShuffled(false);
  }, [baseData]);

  const successPlayer = useAudioPlayer(require('../../../../assets/success.mp3'));
  const failPlayer = useAudioPlayer(require('../../../../assets/fail.mp3'));

  const onSuccess = () => {
    successPlayer.seekTo(0);
    successPlayer.play();
  };

  const onFail = () => {
    failPlayer.seekTo(0);
    failPlayer.play();
  };

  const listOpacity = useRef(new Animated.Value(1)).current;

  const animateFadeSwap = (apply: () => void) => {
    Animated.timing(listOpacity, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() => {
      apply();
      Animated.timing(listOpacity, { toValue: 1, duration: 640, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  const shuffle = () => {
    const arr = [...baseData];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.every((a, i) => a.id === baseData[i]?.id)) return shuffle();
    animateFadeSwap(() => { setList(arr); setIsShuffled(true); });
  };

  const restore = () => {
    animateFadeSwap(() => { setList(baseData); setIsShuffled(false); });
  };

  const spinVal = useRef(new Animated.Value(0)).current;
  const spin = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinOnce = (cb: () => void) => {
    spinVal.setValue(0);
    Animated.timing(spinVal, { toValue: 1, duration: 480, easing: Easing.out(Easing.ease), useNativeDriver: true }).start(() => cb());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TopBar
        titleKey=""
        showElementToggle
        elementMode={elementMode}
        onToggleElementMode={() => setElementMode(prev => (prev === 'text' ? 'symbol' : 'text'))}
      />
      <Animated.View style={{ flex: 1, opacity: listOpacity }}>
        <FlatList
          data={list}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <CardItem item={item} colors={colors as any} onSuccess={onSuccess} onFail={onFail} mode={elementMode} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 72, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
        />
      </Animated.View>

      <Pressable
        onPress={() => spinOnce(isShuffled ? restore : shuffle)}
        style={[
          styles.fab,
          { backgroundColor: colors.tint },
          isRTL ? { right: 20 } : { left: 20 }
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          {isShuffled ? (
            <Feather name="rotate-ccw" size={26} color={colors.bg} />
          ) : (
            <Ionicons name="cube" size={26} color={colors.bg} />
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  itemContainer: { borderWidth: 1.5, borderRadius: 16, marginBottom: 16, paddingVertical: 8, paddingHorizontal: 8 },
  cardPress: { width: Math.min(520, width - 32), alignSelf: 'center' },
  card3d: { width: '100%', height: 190, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  face: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 16 },
  backFace: {},
  value: { fontSize: 40, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  cta: { width: 56, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  ok: { backgroundColor: '#2ecc71' },
  no: { backgroundColor: '#e74c3c' },
  fab: { position: 'absolute', bottom: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } }
});
