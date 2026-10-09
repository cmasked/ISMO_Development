import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { Button, Card, ErrorText, Geometry, Heading, Screen, Type } from '../components/ui';
import { useTheme } from '../components/ThemeProvider';
import { message } from '../lib/api';
export function AccountScreen() {
  const auth = useAuth(); const { isDark, toggle } = useTheme(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function logout() { if (busy) return; setBusy(true); setError(''); try { await auth.logout(); } catch (error) { setError(message(error)); } finally { setBusy(false); } }
  return <Screen><Heading title="Your account" description="Your workspace, just the way you like it." /><Card><Geometry /><Type variant="heading">{auth.session?.user.fullName}</Type><Type muted>{auth.session?.user.email}</Type></Card><Card><Type variant="heading">Appearance</Type><Type muted>{isDark ? 'Dark mode is on.' : 'Light mode is on.'}</Type><Button label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} onPress={toggle} /></Card><ErrorText text={error} /><Button label="Sign out" busy={busy} onPress={() => Alert.alert('Sign out?', 'You can sign in again whenever you’re ready.', [{ text: 'Stay signed in', style: 'cancel' }, { text: 'Sign out', onPress: () => { void logout(); } }])} /></Screen>;
}
