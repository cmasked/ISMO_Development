import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { ThemeProvider, useTheme } from './src/components/ThemeProvider';
import { ToastProvider } from './src/components/ToastProvider';
import { ErrorState, Geometry, Screen } from './src/components/ui';
import { RootNavigator } from './src/navigation/RootNavigator';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15000, networkMode: 'always' }, mutations: { retry: false, networkMode: 'always' } } });
function Content() {
  const [fontsLoaded, fontError] = useFonts({ Inter: Inter_400Regular, SpaceGrotesk: SpaceGrotesk_700Bold });
  const { colors, isDark, ready } = useTheme(); const auth = useAuth();
  useEffect(() => { let offline = false; return NetInfo.addEventListener(state => { const connected = state.isConnected !== false && state.isInternetReachable !== false; if (offline && connected) void queryClient.invalidateQueries(); offline = !connected; }); }, []);
  if (!ready || (!fontsLoaded && !fontError) || auth.status === 'loading') return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}><Geometry /><ActivityIndicator size="large" color={colors.link} accessibilityLabel="Opening your workspace" /></View></SafeAreaView>;
  return <><StatusBar style={isDark ? 'light' : 'dark'} />{auth.status === 'error' ? <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><Screen><ErrorState text={auth.notice} retry={auth.retry} /></Screen></SafeAreaView> : <RootNavigator />}</>;
}
export default function App() { return <SafeAreaProvider><ThemeProvider><QueryClientProvider client={queryClient}><AuthProvider><ToastProvider><Content /></ToastProvider></AuthProvider></QueryClientProvider></ThemeProvider></SafeAreaProvider>; }
