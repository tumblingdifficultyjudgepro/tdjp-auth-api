import React from 'react';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Lang } from '@/shared/i18n';
import { t } from '@/shared/i18n';
import { useAppTheme } from '@/shared/theme/theme';
import HomeScreen from '@/features/home';
import CalculatorScreen from '@/features/calculator';
import QuizScreen from '@/features/quiz';
import FlashcardsScreen from '@/features/flashcards';
import TariffScreen from '@/features/tariff';

const Tab = createBottomTabNavigator();

function CenterTabBarButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole={props.accessibilityRole}
      accessibilityState={props.accessibilityState}
      testID={props.testID}
      style={({ pressed }) => [styles.centerBtnWrapper, pressed && styles.pressedUp]}
    >
      {({ pressed }) => (
        <View style={[styles.centerBtn, pressed && styles.centerBtnPressed]}>
          {props.children}
        </View>
      )}
    </Pressable>
  );
}

function RegularTabBarButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole={props.accessibilityRole}
      accessibilityState={props.accessibilityState}
      testID={props.testID}
      style={({ pressed }) => [props.style, styles.regularBtn, pressed && styles.regularBtnPressed]}
    >
      {props.children}
    </Pressable>
  );
}

export default function Tabs() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const lang: Lang = 'he';
  const isRTL = lang === 'he';

  const screensRTL = [
    { name: 'Tariff', component: TariffScreen, icon: 'document-text-outline' as const, label: t(lang, 'tabs.tariff') },
    { name: 'Calculator', component: CalculatorScreen, icon: 'calculator-outline' as const, label: t(lang, 'tabs.calc') },
    { name: 'Home', component: HomeScreen, icon: 'home-outline' as const, label: '' },
    { name: 'Quiz', component: QuizScreen, icon: 'help-circle-outline' as const, label: t(lang, 'tabs.quiz') },
    { name: 'Flashcards', component: FlashcardsScreen, icon: 'albums-outline' as const, label: t(lang, 'tabs.flash') }
  ];

  const screensLTR = [
    { name: 'Flashcards', component: FlashcardsScreen, icon: 'albums-outline' as const, label: t(lang, 'tabs.flash') },
    { name: 'Quiz', component: QuizScreen, icon: 'help-circle-outline' as const, label: t(lang, 'tabs.quiz') },
    { name: 'Home', component: HomeScreen, icon: 'home-outline' as const, label: '' },
    { name: 'Calculator', component: CalculatorScreen, icon: 'calculator-outline' as const, label: t(lang, 'tabs.calc') },
    { name: 'Tariff', component: TariffScreen, icon: 'document-text-outline' as const, label: t(lang, 'tabs.tariff') }
  ];

  const screens = isRTL ? screensRTL : screensLTR;
  const insetBottom = Math.max(10, insets.bottom);
  const barHeight = 62 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: '#8e8e93',
        tabBarItemStyle: { top: -2 },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: 'transparent', height: barHeight, paddingBottom: insetBottom, paddingTop: 8 },
        tabBarIcon: ({ size, color }) => {
          const s = screens.find(x => x.name === route.name);
          const icon = s?.icon ?? 'ellipse-outline';
          const wrapStyle = route.name === 'Home' ? styles.homeIconWrap : undefined;
          const iconColor = route.name === 'Home' ? colors.bg : color;
          const iconSize = route.name === 'Home' ? size + 4 : size;
          return (
            <View style={wrapStyle}>
              <Ionicons name={icon as any} size={iconSize} color={iconColor as string} />
            </View>
          );
        },
        tabBarLabel: screens.find(x => x.name === route.name)?.label,
        tabBarButton: props => (route.name === 'Home' ? <CenterTabBarButton {...props} /> : <RegularTabBarButton {...props} />)
      })}
    >
      {screens.map(s => (
        <Tab.Screen key={s.name} name={s.name as any} component={s.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerBtnWrapper: { alignItems: 'center', justifyContent: 'center', top: -18 },
  centerBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#007aff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  centerBtnPressed: { opacity: 0.7 },
  pressedUp: { transform: [{ translateY: -1 }] },
  homeIconWrap: { transform: [{ translateY: 2 }] },
  regularBtn: { justifyContent: 'center', alignItems: 'center' },
  regularBtnPressed: { opacity: 0.6 }
});
