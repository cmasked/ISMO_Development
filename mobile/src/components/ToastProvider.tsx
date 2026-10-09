import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';
const Context = createContext<(message: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const { colors } = useTheme(); const insets = useSafeAreaInsets();
  useEffect(() => { if (!text) return; const timer = setTimeout(() => setText(''), 4000); return () => clearTimeout(timer); }, [text]);
  return <Context.Provider value={setText}>{children}{!!text && <View pointerEvents="box-none" style={{ position: 'absolute', bottom: insets.bottom + 80, left: 20, right: 20, padding: 16, backgroundColor: colors.solid, borderWidth: 2, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}><View pointerEvents="none" style={{ flex: 1 }}><Text accessibilityLiveRegion="polite" style={{ color: colors.onSolid, fontFamily: 'Inter', fontSize: 13 }}>{text}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => setText('')} style={{ padding: 10 }}><Text style={{ color: colors.onSolid, fontSize: 18 }}>×</Text></Pressable></View>}</Context.Provider>;
}
export const useToast = () => useContext(Context);
