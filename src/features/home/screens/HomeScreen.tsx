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

