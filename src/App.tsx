import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/theme';
import { LangProvider } from '@/shared/state/lang';
import Tabs from '@/app/navigation/Tabs';
import './src/App';

function WithNav() {
  const { colors } = useAppTheme();
  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.tint, text: colors.text, card: colors.card, border: 'transparent', notification: colors.tint }
  };
  return (
    <NavigationContainer theme={navTheme}>
      <Tabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider defaultMode="light">
        <LangProvider defaultLang="he">
          <WithNav />
        </LangProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
