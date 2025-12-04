import React, { useState } from 'react';
import { View, Text, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '@/shared/ui/Screen';
import { useAppTheme } from '@/shared/theme/theme';
import ExitAppDialog from '@/shared/ui/ExitAppDialog';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        setShowExitDialog(true);
        return true;
      };

      // התיקון: שימוש באובייקט subscription
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  return (
    <Screen title="Home">
      <View>
        <Text style={{ color: colors.text }}>Home content</Text>
      </View>

      <ExitAppDialog
        visible={showExitDialog}
        onCancel={() => setShowExitDialog(false)}
      />
    </Screen>
  );
}