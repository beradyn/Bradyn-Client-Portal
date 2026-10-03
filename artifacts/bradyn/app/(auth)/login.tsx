import React, { useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ActionButton, TextField } from '@/components/PortalPrimitives';
import { usePortal } from '@/components/PortalProvider';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, authError, user, signOut } = usePortal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const role = await signIn(email, password);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace((role === 'admin' ? '/(admin)' : '/(client)') as Href);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Sign-in failed. Check your details and try again.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.flex}
        contentContainerStyle={[
          styles.loginContent,
          { paddingTop: top + 24, paddingBottom: bottom + 28 },
        ]}
        bottomOffset={30}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandLockup}>
          <Image
            source={require('../../assets/images/beradyn-logo.png')}
            style={styles.brandImage}
            resizeMode="contain"
          />
          <Text style={[styles.brandWordmark, { color: colors.foreground }]}>
            BRADYN
          </Text>
          <Text style={[styles.brandTagline, { color: colors.mutedForeground }]}>
            DIGITAL EXPERIENCES BUILT FOR GROWTH
          </Text>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            CLIENT + ADMIN ACCESS
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Welcome to Bradyn.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to open your client or admin workspace.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email address"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            leftIcon="mail"
            testID="login-email"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            secureTextEntry
            autoComplete="password"
            leftIcon="lock"
            testID="login-password"
          />
          {error || authError ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error || authError}
            </Text>
          ) : null}
          <ActionButton
            label={submitting ? 'Signing in…' : 'Sign in'}
            icon="arrow-right"
            onPress={() => void submit()}
            disabled={submitting}
            testID="login-submit"
          />
          {authError && user ? (
            <ActionButton
              label="Sign out"
              icon="log-out"
              variant="outline"
              onPress={() => void signOut()}
            />
          ) : null}
        </View>

        <View style={[styles.accessNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.accessNoteText, { color: colors.mutedForeground }]}>
            Bradyn administrators create account access. Contact your administrator if you need credentials.
          </Text>
        </View>
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          Secure account access · Client and admin workspaces
        </Text>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  loginContent: { paddingHorizontal: 23, flexGrow: 1, justifyContent: 'center', gap: 21 },
  brandLockup: { alignItems: 'center', gap: 7, marginBottom: 2 },
  brandImage: { width: 83, height: 83, borderRadius: 25, marginBottom: 3 },
  brandWordmark: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 7 },
  brandTagline: { fontSize: 8, fontFamily: 'Inter_500Medium', letterSpacing: 2.05, textAlign: 'center' },
  intro: { gap: 7, marginTop: 2 },
  eyebrow: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  title: { fontSize: 27, lineHeight: 33, letterSpacing: -1, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular', maxWidth: 330 },
  form: { gap: 14 },
  errorText: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: -5 },
  accessNote: { borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  accessNoteText: { flex: 1, fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  footerNote: { textAlign: 'center', fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: -5 },
});