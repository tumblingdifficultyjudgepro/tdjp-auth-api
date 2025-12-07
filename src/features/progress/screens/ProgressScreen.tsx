import React from 'react';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import { View, Text, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function ProgressScreen() {
  const { colors } = useAppTheme();
  const nav = useNavigation<any>();

  // === חזרה ל-Home בלחיצה על כפתור חזור ===
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        nav.navigate('Home');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [nav])
  );
  // ========================================

  return (
    <Screen title="Progress">
      <View>
        <Text style={{ color: colors.text }}>Progress content</Text>
      </View>
    </Screen>
  );
}