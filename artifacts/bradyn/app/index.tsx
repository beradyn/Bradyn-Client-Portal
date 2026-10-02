import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { usePortal } from '@/components/PortalProvider';
import { useColors } from '@/hooks/useColors';

export default function IndexRoute() {
  const { role, initialized } = usePortal();
  const colors = useColors();
  if (!initialized) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (role === 'admin') return <Redirect href="/(admin)" />;
  if (role === 'client') return <Redirect href="/(client)" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});