import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Button, Card, ErrorText, Field, Geometry, Screen, Type } from '../components/ui';
import { message } from '../lib/api';
import { passwordError } from '../lib/validation';
export type AuthStackParams = { Login: { email?: string; registered?: boolean } | undefined; Register: undefined };
export function AuthScreen({ route, navigation }: NativeStackScreenProps<AuthStackParams, keyof AuthStackParams>) {
  const auth = useAuth(); const register = route.name === 'Register';
  const [name, setName] = useState(''); const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (busy) return; Keyboard.dismiss(); setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    if (register && !name.trim()) { setError('Please enter your full name.'); return; }
    const validation = register ? passwordError(password, confirm) : '';
    if (validation) { setError(validation); return; }
    setBusy(true);
    try {
      if (register) { await auth.api.register(name, email, password); setPassword(''); setConfirm(''); navigation.replace('Login', { email: email.trim(), registered: true }); }
      else { await auth.login(email, password); setPassword(''); }
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <Screen><View style={{ gap: 12, marginTop: 12 }}><Geometry /><Type variant="title">{register ? 'Create your account' : 'Welcome back'}</Type><Type muted>{register ? 'Start organizing your projects in one place.' : 'Sign in to pick up where you left off.'}</Type></View>
    {route.params?.registered && <Card><Type>Your account is ready. Sign in to get started.</Type></Card>}
    {!!auth.notice && !register && <Card><Type>{auth.notice}</Type></Card>}
    <View pointerEvents={busy ? 'none' : 'auto'} style={{ gap: 20 }}>
      {register && <Field testID="full-name" label="Full name" value={name} onChangeText={setName} autoComplete="name" maxLength={150} editable={!busy} />}
      <Field testID="email" label="Email" value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={254} editable={!busy} />
      <Field testID="password" label="Password" value={password} onChangeText={setPassword} secureTextEntry={!show} autoComplete={register ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect={false} hint={register ? 'Use at least 8 characters.' : undefined} editable={!busy} />
      {register && <Field testID="confirm-password" label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} autoComplete="new-password" autoCapitalize="none" autoCorrect={false} editable={!busy} />}
      <Button label={show ? 'Hide password' : 'Show password'} onPress={() => setShow(!show)} />
    </View><ErrorText text={error} /><Button testID="auth-submit" label={register ? 'Create account' : 'Sign in'} variant="primary" busy={busy} onPress={() => { void submit(); }} /><Button label={register ? 'Already have an account? Sign in' : 'Create an account'} disabled={busy} onPress={() => { setPassword(''); setConfirm(''); if (register) navigation.replace('Login'); else navigation.navigate('Register'); }} /></Screen>;
}
