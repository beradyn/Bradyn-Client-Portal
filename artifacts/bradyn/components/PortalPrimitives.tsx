import React, { PropsWithChildren, useEffect } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof Feather>['name'];

export function Page({
  children,
  contentStyle,
}: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.pageContent,
          {
            paddingTop: top + 16,
            paddingBottom: bottom + 112,
          },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function BrandHeader({
  role = 'CLIENT PORTAL',
  onNotification,
  unread = false,
}: {
  role?: string;
  onNotification?: () => void;
  unread?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandLeft}>
        <Image
          source={require('../assets/images/bradyn-mark.png')}
          style={styles.brandIcon}
          resizeMode="cover"
        />
        <View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>
            BRADYN
          </Text>
          <Text style={[styles.brandRole, { color: colors.mutedForeground }]}>
            {role}
          </Text>
        </View>
      </View>
      {onNotification ? (
        <IconButton
          icon="bell"
          onPress={onNotification}
          dot={unread}
          accessibilityLabel="Notifications"
          testID="notifications"
        />
      ) : null}
    </View>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.pageHeading}>
      <View style={styles.headingCopy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Panel({
  children,
  style,
  delay = 0,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; delay?: number }>) {
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420)}
      style={[
        styles.panel,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.sectionAction, { color: colors.primary }]}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  small = false,
  disabled = false,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'destructive'
        ? colors.destructive
        : variant === 'secondary'
          ? colors.secondary
          : 'transparent';
  const foreground =
    variant === 'primary' || variant === 'destructive'
      ? colors.primaryForeground
      : variant === 'outline'
        ? colors.foreground
        : colors.secondaryForeground;

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 260 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={style}
    >
      <Animated.View
        style={[
          styles.actionButton,
          small ? styles.actionButtonSmall : null,
          {
            backgroundColor,
            borderColor:
              variant === 'outline' ? colors.border : 'transparent',
            opacity: disabled ? 0.48 : 1,
          },
          animatedStyle,
        ]}
      >
        {icon ? <Feather name={icon} size={small ? 15 : 17} color={foreground} /> : null}
        <Text
          style={[
            styles.actionButtonText,
            small ? styles.actionButtonSmallText : null,
            { color: foreground },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  dot = false,
  accessibilityLabel,
  testID,
}: {
  icon: IconName;
  onPress: () => void;
  dot?: boolean;
  accessibilityLabel: string;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={8}
      style={styles.iconButton}
    >
      <Feather name={icon} size={19} color={colors.foreground} />
      {dot ? (
        <View
          style={[styles.notificationDot, { backgroundColor: colors.primary }]}
        />
      ) : null}
    </Pressable>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const content = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: active ? colors.accent : colors.secondary,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: active ? colors.accentForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export function StatusTag({ label }: { label: string }) {
  const colors = useColors();
  const lower = label.toLowerCase();
  const tone =
    lower.includes('live') || lower.includes('active') || lower.includes('complete')
      ? { bg: '#12241B', text: '#8DDBAA', dot: '#51C878' }
      : lower.includes('review') || lower.includes('waiting')
        ? { bg: '#271F12', text: '#E9C37A', dot: '#E9B857' }
        : lower.includes('offline') || lower.includes('high')
          ? { bg: '#2A171A', text: '#FF969D', dot: '#FF6773' }
          : { bg: colors.accent, text: colors.accentForeground, dot: colors.primary };
  return (
    <View style={[styles.statusTag, { backgroundColor: tone.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.statusText, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  height = 6,
}: {
  value: number;
  height?: number;
}) {
  const colors = useColors();
  const progress = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  useEffect(() => {
    progress.value = withTiming(Math.min(100, Math.max(0, value)) / 100, {
      duration: 850,
    });
  }, [progress, value]);

  return (
    <View
      style={[
        styles.progressTrack,
        { height, backgroundColor: colors.secondary },
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          { backgroundColor: colors.primary },
          style,
        ]}
      />
    </View>
  );
}

export function TextField({
  label,
  containerStyle,
  multiline,
  leftIcon,
  style,
  ...props
}: TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: IconName;
}) {
  const colors = useColors();
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      ) : null}
      <View>
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              color: colors.foreground,
            },
            leftIcon ? styles.inputWithIcon : null,
            multiline ? styles.textArea : null,
            style,
          ]}
        />
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={16}
            color={colors.mutedForeground}
            style={styles.inputIcon}
          />
        ) : null}
      </View>
    </View>
  );
}

export function Avatar({
  initials,
  size = 42,
}: {
  initials: string;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accent,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.accentForeground }]}>
        {initials}
      </Text>
    </View>
  );
}

export function DataRow({
  label,
  value,
  icon,
  last = false,
}: {
  label: string;
  value: string;
  icon?: IconName;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.dataRow,
        !last
          ? { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }
          : null,
      ]}
    >
      <View style={styles.dataRowLabel}>
        {icon ? <Feather name={icon} size={15} color={colors.mutedForeground} /> : null}
        <Text style={[styles.dataLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.dataValue, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
}: {
  icon?: IconName;
  title: string;
  description: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={22} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pageContent: { paddingHorizontal: 20, gap: 22 },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 3,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: { width: 38, height: 38, borderRadius: 12 },
  brandName: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 3.2 },
  brandRole: { fontSize: 8, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.9, marginTop: 3 },
  pageHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingCopy: { flex: 1, gap: 5 },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
  },
  pageTitle: { fontSize: 30, lineHeight: 36, fontFamily: 'Inter_700Bold', letterSpacing: -1.1 },
  pageSubtitle: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular', maxWidth: 300 },
  panel: {
    borderWidth: 1,
    borderRadius: 23,
    padding: 17,
    gap: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -7,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
  sectionAction: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  actionButton: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  actionButtonSmall: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 13,
  },
  actionButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: -0.1 },
  actionButtonSmallText: { fontSize: 12 },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  progressTrack: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  inputWithIcon: { paddingLeft: 42 },
  inputIcon: { position: 'absolute', left: 14, top: 16 },
  textArea: { minHeight: 98, textAlignVertical: 'top' },
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.1 },
  dataRow: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dataRowLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dataLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dataValue: { flexShrink: 1, textAlign: 'right', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24, gap: 9 },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyDescription: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },
});