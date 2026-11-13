import React from 'react';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { useAuth } from '../auth/AuthContext';
import { Ionicons, Loading, type IconName } from '../components/ui';
import { TypographyProvider, useTypographyReady } from '../components/Typography';
import { colors } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import SchoolPickerScreen from '../screens/SchoolPickerScreen';
// teacher
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import ClassesScreen from '../screens/teacher/ClassesScreen';
import ClassStudentsScreen from '../screens/teacher/ClassStudentsScreen';
import StudentProfileScreen from '../screens/teacher/StudentProfileScreen';
import ActivitiesScreen from '../screens/teacher/ActivitiesScreen';
import ActivityFormScreen from '../screens/teacher/ActivityFormScreen';
import ActivityResultsScreen from '../screens/teacher/ActivityResultsScreen';
import InsightsScreen from '../screens/teacher/InsightsScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';
import ChangePasswordScreen from '../screens/teacher/ChangePasswordScreen';
// student
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import MyActivitiesScreen from '../screens/student/MyActivitiesScreen';
import LearnScreen from '../screens/student/LearnScreen';
import LearningItemScreen from '../screens/student/LearningItemScreen';
import GamesScreen from '../screens/student/GamesScreen';
import GamePlayScreen from '../screens/student/GamePlayScreen';
import NewsScreen from '../screens/student/NewsScreen';
import NewsArticleScreen from '../screens/student/NewsArticleScreen';
import ProgrammesScreen from '../screens/student/ProgrammesScreen';
import ProgrammeDetailScreen from '../screens/student/ProgrammeDetailScreen';
import CertificatesScreen from '../screens/student/CertificatesScreen';
import CertificateDetailScreen from '../screens/student/CertificateDetailScreen';
import ProgressScreen from '../screens/student/ProgressScreen';
import StudentSelfProfileScreen from '../screens/student/StudentProfileScreen';
import QuizPlayerScreen from '../quiz/QuizPlayerScreen';
import type { StudentStackParams, StudentTabParams, TeacherStackParams, TeacherTabParams } from './types';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.forestGreen, background: colors.warmIvory, card: colors.white, text: colors.text, border: colors.border },
};

const appFonts = {
  Inter_400Regular: require('../../assets/fonts/Inter-400.ttf'),
  Inter_500Medium: require('../../assets/fonts/Inter-500.ttf'),
  Inter_600SemiBold: require('../../assets/fonts/Inter-600.ttf'),
  Inter_700Bold: require('../../assets/fonts/Inter-700.ttf'),
  Nunito_700Bold: require('../../assets/fonts/Nunito-700.ttf'),
  Nunito_800ExtraBold: require('../../assets/fonts/Nunito-800.ttf'),
  Nunito_900Black: require('../../assets/fonts/Nunito-900.ttf'),
};

function stackOptions(fontsReady: boolean): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: colors.forestGreen },
    headerTintColor: colors.white,
    headerTitleStyle: fontsReady ? { fontFamily: 'Nunito_700Bold' } : { fontWeight: '700' },
    contentStyle: { backgroundColor: colors.warmIvory },
  };
}

function tabOptions(icons: Record<string, [IconName, IconName]>, fontsReady: boolean) {
  return ({ route }: { route: { name: string } }): BottomTabNavigationOptions => ({
    headerStyle: { backgroundColor: colors.forestGreen },
    headerTintColor: colors.white,
    headerTitleStyle: fontsReady ? { fontFamily: 'Nunito_700Bold' } : { fontWeight: '700' },
    tabBarActiveTintColor: colors.forestGreen,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarActiveBackgroundColor: '#FFF4CC',
    tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6, borderTopColor: colors.border },
    tabBarLabelStyle: fontsReady ? { fontFamily: 'Inter_700Bold', fontSize: 12 } : { fontSize: 12, fontWeight: '700' },
    tabBarItemStyle: { borderRadius: 12, marginHorizontal: 2 },
    tabBarIcon: ({ focused, color, size }) => {
      const [on, off] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
      return <Ionicons name={focused ? on : off} size={size} color={focused ? colors.forestGreen : color} />;
    },
  });
}

// ------------------------------------------------------------------ teacher
const TTabs = createBottomTabNavigator<TeacherTabParams>();
const TStack = createNativeStackNavigator<TeacherStackParams>();

function TeacherTabs() {
  const isReady = useTypographyReady();
  return (
    <TTabs.Navigator
      screenOptions={tabOptions({
        Home: ['home', 'home-outline'],
        Classes: ['people', 'people-outline'],
        Activities: ['clipboard', 'clipboard-outline'],
        Insights: ['analytics', 'analytics-outline'],
        Profile: ['person-circle', 'person-circle-outline'],
      }, isReady)}
    >
      <TTabs.Screen name="Home" component={TeacherHomeScreen} options={{ title: 'Mango Dude' }} />
      <TTabs.Screen name="Classes" component={ClassesScreen} options={{ title: 'My Classes', tabBarLabel: 'Classes' }} />
      <TTabs.Screen name="Activities" component={ActivitiesScreen} />
      <TTabs.Screen name="Insights" component={InsightsScreen} options={{ title: 'Performance & Insights', tabBarLabel: 'Insights' }} />
      <TTabs.Screen name="Profile" component={TeacherProfileScreen} />
    </TTabs.Navigator>
  );
}

function TeacherApp() {
  const isReady = useTypographyReady();
  return (
    <TStack.Navigator screenOptions={stackOptions(isReady)}>
      <TStack.Screen name="TeacherTabs" component={TeacherTabs} options={{ headerShown: false }} />
      <TStack.Screen name="ClassStudents" component={ClassStudentsScreen} options={({ route }) => ({ title: route.params.label })} />
      <TStack.Screen name="StudentProfile" component={StudentProfileScreen} options={({ route }) => ({ title: route.params.name })} />
      <TStack.Screen name="ActivityForm" component={ActivityFormScreen} options={{ title: 'New activity' }} />
      <TStack.Screen name="ActivityResults" component={ActivityResultsScreen} options={{ title: 'Results' }} />
      <TStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change password' }} />
    </TStack.Navigator>
  );
}

// ------------------------------------------------------------------ student
const STabs = createBottomTabNavigator<StudentTabParams>();
const SStack = createNativeStackNavigator<StudentStackParams>();

function StudentTabs() {
  const fontsReady = useTypographyReady();
  return (
    <STabs.Navigator
      screenOptions={tabOptions({
        Home: ['home', 'home-outline'],
        Learn: ['book', 'book-outline'],
        Games: ['game-controller', 'game-controller-outline'],
        Programmes: ['rocket', 'rocket-outline'],
        Progress: ['stats-chart', 'stats-chart-outline'],
      }, fontsReady)}
    >
      <STabs.Screen name="Home" component={StudentHomeScreen} options={{ title: 'Mango Dude' }} />
      <STabs.Screen name="Learn" component={LearnScreen} />
      <STabs.Screen name="Games" component={GamesScreen} />
      <STabs.Screen name="Programmes" component={ProgrammesScreen} />
      <STabs.Screen name="Progress" component={ProgressScreen} options={{ title: 'My Progress', tabBarLabel: 'Progress' }} />
    </STabs.Navigator>
  );
}

function StudentApp() {
  const fontsReady = useTypographyReady();
  return (
    <SStack.Navigator screenOptions={stackOptions(fontsReady)}>
      <SStack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
      <SStack.Screen name="MyActivities" component={MyActivitiesScreen} options={{ title: 'My Activities' }} />
      <SStack.Screen name="LearningItem" component={LearningItemScreen} options={({ route }) => ({ title: route.params.title ?? 'Learning' })} />
      <SStack.Screen name="Quiz" component={QuizPlayerScreen} options={({ route }) => ({ title: route.params.title ?? 'Quiz' })} />
      <SStack.Screen name="GamePlay" component={GamePlayScreen} options={({ route }) => ({ title: route.params.name, gestureEnabled: false })} />
      <SStack.Screen name="News" component={NewsScreen} options={{ title: 'News & GK' }} />
      <SStack.Screen name="NewsArticle" component={NewsArticleScreen} options={{ title: 'News & GK' }} />
      <SStack.Screen name="ProgrammeDetail" component={ProgrammeDetailScreen} options={({ route }) => ({ title: route.params.name })} />
      <SStack.Screen name="Certificates" component={CertificatesScreen} />
      <SStack.Screen name="CertificateDetail" component={CertificateDetailScreen} options={{ title: 'Certificate' }} />
      <SStack.Screen name="Profile" component={StudentSelfProfileScreen} options={{ title: 'My Profile' }} />
    </SStack.Navigator>
  );
}

// ------------------------------------------------------------------ root
export default function RootNavigator() {
  const { status, isTeacher, isStudent, schoolId } = useAuth();
  const [fontsLoaded, fontError] = useFonts(appFonts);
  let content: React.ReactNode;
  if (!fontsLoaded && !fontError) content = <Loading label="Starting Mango Dude…" />;
  else if (status === 'loading') content = <Loading label="Starting Mango Dude…" />;
  else if (status === 'signedOut') content = <LoginScreen />;
  else if (status === 'needsSchool') content = <SchoolPickerScreen />;
  // key by school so switching schools resets all cached screens
  else if (isTeacher) content = <TeacherApp key={schoolId ?? 'none'} />;
  else if (isStudent) content = <StudentApp />;
  else content = <LoginScreen />;
  return (
    <TypographyProvider ready={fontsLoaded}>
      <NavigationContainer theme={navTheme}>{content}</NavigationContainer>
    </TypographyProvider>
  );
}
