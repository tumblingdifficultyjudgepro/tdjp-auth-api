import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Tabs from '@/app/navigation/Tabs';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import AdminUsersScreen from '@/features/admin/screens/AdminUsersScreen';
import EditUserScreen from '@/features/admin/screens/EditUserScreen';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="EditUser" component={EditUserScreen} />
    </Stack.Navigator>
  );
}
