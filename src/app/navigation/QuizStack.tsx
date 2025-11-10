import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuizSettingsWizard from '@/features/quiz/screens/QuizSettingsWizard';
import QuizRun from '@/features/quiz/screens/QuizRun';
import { useLang } from '@/shared/state/lang';

export type QuizStackParamList = {
  QuizWizard: undefined;
  QuizRun: { config: any };
};

const Stack = createNativeStackNavigator<QuizStackParamList>();

export default function QuizStack() {
  const { lang } = useLang();

  return (
    <Stack.Navigator
      key={`quiz-${lang}`}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="QuizWizard" component={QuizSettingsWizard} />
      <Stack.Screen name="QuizRun" component={QuizRun} />
    </Stack.Navigator>
  );
}
