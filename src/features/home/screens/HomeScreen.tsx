<<<<<<< HEAD
import { View, StyleSheet } from 'react-native';
import TopBar from '@/shared/ui/TopBar';
import { useAppTheme } from '@/shared/theme/theme';
import { useAuth } from '@/shared/state/auth';
import GuestHome from '../components/GuestHome';
import UserHome from '../components/UserHome';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { user } = useAuth();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <TopBar titleKey="screens.home" />
      {user ? <UserHome /> : <GuestHome />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

=======
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
>>>>>>> 778d6946b9e5d7a2d69bf58398a50d5de31618dd
