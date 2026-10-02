import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePortal } from '@/components/PortalProvider';
import { useColors } from '@/hooks/useColors';

function NativeClientTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="website">
        <NativeTabs.Trigger.Icon sf={{ default: 'globe', selected: 'globe' }} />
        <NativeTabs.Trigger.Label>Website</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="requests">
        <NativeTabs.Trigger.Icon sf={{ default: 'square.and.pencil', selected: 'square.and.pencil' }} />
        <NativeTabs.Trigger.Label>Requests</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} />
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicClientTabs() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const bottom = isWeb ? 34 : Math.max(8, insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 9, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
        tabBarStyle: {
          position: 'absolute',
          bottom,
          left: 16,
          right: 16,
          height: isWeb ? 72 : 68,
          paddingTop: 8,
          paddingBottom: 7,
          borderRadius: 25,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'transparent',
          elevation: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={70}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 25, overflow: 'hidden' }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(12,13,16,0.97)', borderRadius: 25 },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={19} color={color} />,
        }}
      />
      <Tabs.Screen
        name="website"
        options={{
          title: 'Website',
          tabBarIcon: ({ color }) => <Feather name="globe" size={19} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Feather name="edit-3" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={19} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Feather name="user" size={19} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function ClientTabsLayout() {
  const { role, initialized, currentClientId } = usePortal();
  const colors = useColors();
  if (!initialized) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (role !== 'client') return <Redirect href="/(auth)/login" />;
  if (!currentClientId) {
    return (
      <View style={[styles.accessPending, { backgroundColor: colors.background }]}>
        <Feather name="clock" size={26} color={colors.primary} />
        <Text style={[styles.pendingTitle, { color: colors.foreground }]}>
          Client access is being set up
        </Text>
        <Text style={[styles.pendingCopy, { color: colors.mutedForeground }]}>
          Your Bradyn administrator needs to link your sign-in to a client record.
        </Text>
      </View>
    );
  }
  return isLiquidGlassAvailable() ? <NativeClientTabs /> : <ClassicClientTabs />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  accessPending: { flex: 1, padding: 28, gap: 12, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  pendingCopy: { maxWidth: 300, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});