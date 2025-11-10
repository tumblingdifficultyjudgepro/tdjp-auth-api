import React, { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/theme';
import { LangProvider, useLang } from '@/shared/state/lang';
import Tabs from '@/app/navigation/Tabs';
import { getCachedNavState, setCachedNavState } from '@/app/navigation/navPersistence';

function WithNav() {
  const { colors } = useAppTheme();
  const { lang } = useLang();
  const isRTL = lang === 'he';

  // רימאונט של עץ הניווט כששפה/RTL משתנים (נשאר),
  // אבל עם initialState כדי להישאר באותו מסך
  const navKey = `nav-${lang}-${isRTL ? 'rtl' : 'ltr'}`;
  const initialState = useMemo(() => getCachedNavState(), [navKey]);

  const navTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      primary: colors.tint,
      text: colors.text,
      card: colors.card,
      border: 'transparent',
      notification: colors.tint,
    },
  };

  return (
    <NavigationContainer
      key={navKey}
      theme={navTheme}
      initialState={initialState}
      onStateChange={(state) => setCachedNavState(state)}
    >
      <Tabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider defaultMode="light">
          <LangProvider defaultLang="he">
            <WithNav />
          </LangProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
