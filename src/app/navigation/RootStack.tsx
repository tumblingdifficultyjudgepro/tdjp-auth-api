import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { t } from '@/shared/i18n';
import type { Lang } from '@/shared/i18n';
import HomeScreen from '@/features/home';
import CalculatorScreen from '@/features/calculator';
import QuizScreen from '@/features/quiz';
import FlashcardsScreen from '@/features/flashcards';
import TariffScreen from '@/features/tariff';
import ProgressScreen from '@/features/progress';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const lang: Lang = 'he';
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: t(lang, 'screens.home') }} />
      <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ title: t(lang, 'screens.calculator') }} />
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: t(lang, 'screens.quiz') }} />
      <Stack.Screen name="Flashcards" component={FlashcardsScreen} options={{ title: t(lang, 'screens.flashcards') }} />
      <Stack.Screen name="Tariff" component={TariffScreen} options={{ title: t(lang, 'screens.tariff') }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: t(lang, 'screens.progress') }} />
    </Stack.Navigator>
  );
}
