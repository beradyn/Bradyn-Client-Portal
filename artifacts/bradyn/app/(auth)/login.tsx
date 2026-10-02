import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
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
import { DEMO_CREDENTIALS, DemoRole, useDemo } from '@/components/DemoProvider';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useDemo();
  const [role, setRole] = useState<DemoRole>('client');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.client.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.client.password);
  const [error, setError] = useState('');

  const chooseRole = (nextRole: DemoRole) => {
    setRole(nextRole);
    setEmail(DEMO_CREDENTIALS[nextRole].email);
    setPassword(DEMO_CREDENTIALS[nextRole].password);
    setError('');
  };

  const submit = () => {
    const valid = signIn(role, email, password);
    if (!valid) {
      setError('Those demo details don’t match. Use one of the sample accounts below.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(
      (role === 'admin' ? '/(admin)' : '/(client)') as Href,
    );
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
            source={require('../../assets/images/bradyn-mark.png')}
            style={styles.brandImage}
            resizeMode="cover"
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
            CLIENT PORTAL
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Good to have you back.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to follow projects, share feedback, and stay close to the work.
          </Text>
        </View>

        <View style={[styles.roleSwitch, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          {(['client', 'admin'] as DemoRole[]).map((item) => {
            const active = role === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                testID={`role-${item}`}
                onPress={() => chooseRole(item)}
                style={[
                  styles.roleOption,
                  active
                    ? { backgroundColor: colors.card, borderColor: colors.border }
                    : null,
                ]}
              >
                <Feather
                  name={item === 'admin' ? 'briefcase' : 'user'}
                  size={15}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.roleLabel,
                    { color: active ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  {item === 'admin' ? 'Admin preview' : 'Client preview'}
                </Text>
              </Pressable>
            );
          })}
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
          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}
          <ActionButton
            label={role === 'admin' ? 'Enter admin dashboard' : 'Enter client portal'}
            icon="arrow-right"
            onPress={submit}
            testID="login-submit"
          />
        </View>

        <View style={[styles.demoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.demoHeading}>
            <View style={[styles.demoIcon, { backgroundColor: colors.accent }]}>
              <Feather name="zap" size={15} color={colors.primary} />
            </View>
            <View style={styles.demoCopy}>
              <Text style={[styles.demoTitle, { color: colors.foreground }]}>
                Temporary demo access
              </Text>
              <Text style={[styles.demoDescription, { color: colors.mutedForeground }]}>
                Choose a role above. These sample accounts work only in this preview.
              </Text>
            </View>
          </View>
          <View style={[styles.demoDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.credentialLine, { color: colors.mutedForeground }]}>
            Client · {DEMO_CREDENTIALS.client.email}
          </Text>
          <Text style={[styles.credentialLine, { color: colors.mutedForeground }]}>
            Admin · {DEMO_CREDENTIALS.admin.email}
          </Text>
          <Text style={[styles.credentialLine, { color: colors.mutedForeground }]}>
            Password · {DEMO_CREDENTIALS.client.password}
          </Text>
        </View>
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          Demo only · No real accounts or client data
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
  roleSwitch: { flexDirection: 'row', borderRadius: 17, borderWidth: 1, padding: 4, gap: 5 },
  roleOption: { minHeight: 43, flex: 1, borderWidth: 1, borderColor: 'transparent', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  roleLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  form: { gap: 14 },
  errorText: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: -5 },
  demoBox: { borderWidth: 1, borderRadius: 19, padding: 14, gap: 9 },
  demoHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  demoIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  demoCopy: { flex: 1, gap: 3 },
  demoTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  demoDescription: { fontSize: 9, lineHeight: 13, fontFamily: 'Inter_400Regular' },
  demoDivider: { height: StyleSheet.hairlineWidth, marginVertical: 1 },
  credentialLine: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  footerNote: { textAlign: 'center', fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: -5 },
});