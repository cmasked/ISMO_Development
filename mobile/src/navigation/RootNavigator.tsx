import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { Geometry, ThemeToggle, Type } from '../components/ui';
import type { RootStackParams } from '../types';
import { AuthScreen, type AuthStackParams } from '../screens/AuthScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { ProjectDetailsScreen } from '../screens/ProjectDetailsScreen';
import { ProjectFormScreen } from '../screens/ProjectFormScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { AccountScreen } from '../screens/AccountScreen';
const Stack = createNativeStackNavigator<RootStackParams>();
const AuthStack = createNativeStackNavigator<AuthStackParams>();
const Tab = createBottomTabNavigator();
function Brand() { return <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Geometry /><Type variant="label">Workframe</Type></View>; }
function Tabs() {
  const { colors } = useTheme();
  return <Tab.Navigator screenOptions={({ route }) => ({
    headerTitle: () => <Brand />, headerRight: () => <ThemeToggle />,
    headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false,
    tabBarStyle: { backgroundColor: colors.soft, borderTopWidth: 2, borderTopColor: colors.border },
    tabBarActiveTintColor: colors.link, tabBarInactiveTintColor: colors.muted,
    tabBarButtonTestID: 'tab-' + route.name.toLowerCase(),
    tabBarLabelStyle: { fontFamily: 'SpaceGrotesk', fontSize: 11 },
    tabBarIcon: ({ color, size }) => <Ionicons name={route.name === 'Dashboard' ? 'grid-outline' : route.name === 'Projects' ? 'folder-outline' : route.name === 'Tasks' ? 'checkbox-outline' : 'person-outline'} size={size} color={color} />
  })}><Tab.Screen name="Dashboard" component={DashboardScreen} /><Tab.Screen name="Projects" component={ProjectsScreen} /><Tab.Screen name="Tasks" component={TasksScreen} /><Tab.Screen name="Account" component={AccountScreen} /></Tab.Navigator>;
}
export function RootNavigator() {
  const auth = useAuth(); const { colors, isDark } = useTheme(); const base = isDark ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: colors.link, background: colors.bg, card: colors.bg, text: colors.text, border: colors.border, notification: colors.red } };
  const options = { headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, headerTitleStyle: { fontFamily: 'SpaceGrotesk' }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.bg }, headerRight: () => <ThemeToggle /> };
  return <NavigationContainer theme={theme} key={auth.session?.user.id || 'guest'}>{auth.status === 'signedIn' ? <Stack.Navigator screenOptions={options}><Stack.Screen name="Home" component={Tabs} options={{ headerShown: false }} /><Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Project' }} /><Stack.Screen name="ProjectForm" component={ProjectFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit project' : 'Create a project' })} /><Stack.Screen name="TaskForm" component={TaskFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Edit task' : 'Create a task' })} /></Stack.Navigator> : <AuthStack.Navigator screenOptions={{ ...options, headerTitle: () => <Brand /> }}><AuthStack.Screen name="Login" component={AuthScreen} /><AuthStack.Screen name="Register" component={AuthScreen} /></AuthStack.Navigator>}</NavigationContainer>;
}
