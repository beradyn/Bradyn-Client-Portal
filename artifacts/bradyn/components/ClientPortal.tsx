import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import {
  ActionButton,
  Avatar,
  BrandHeader,
  DataRow,
  EmptyState,
  IconButton,
  Page,
  PageHeading,
  Panel,
  Pill,
  ProgressBar,
  SectionHeading,
  StatusTag,
  TextField,
} from '@/components/PortalPrimitives';
import {
  PortalMessage,
  PortalRequest,
  RequestPriority,
  RequestType,
  usePortal,
} from '@/components/PortalProvider';
import { useColors } from '@/hooks/useColors';
import { useThemeMode } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView as ControllerKeyboardAvoidingView } from 'react-native-keyboard-controller';

const REQUEST_TYPES: RequestType[] = [
  'Website Change',
  'Content Update',
  'Bug',
  'New Feature',
  'Domain',
  'Hosting',
  'Other',
];
const PRIORITIES: RequestPriority[] = ['Low', 'Normal', 'High'];
const FILTERS = ['All', 'Open', 'In Progress', 'Waiting', 'Completed'];

function clientRoute(path: string) {
  router.push(path as Href);
}

function initial(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function openWebsite(url: string) {
  if (!url.trim()) {
    Alert.alert('Website link not set', 'A website address has not been added to this client record.');
    return;
  }
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  void Linking.openURL(normalized).catch(() => {
    Alert.alert('Could not open website', 'Check that the website address is valid.');
  });
}

function ClientBrand({ unread = false }: { unread?: boolean }) {
  const colors = useColors();
  return (
    <BrandHeader
      role="CLIENT PORTAL"
      unread={unread}
      onNotification={() =>
        Alert.alert(
          'You’re all caught up',
          'New project updates and replies will show up here.',
        )
      }
    />
  );
}

function ActivityItem({
  icon,
  title,
  detail,
  time,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  detail: string;
  time: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={[styles.activityTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.activityDetail, { color: colors.mutedForeground }]}>
          {detail}
        </Text>
      </View>
      <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
        {time}
      </Text>
    </View>
  );
}

export function ClientHomeScreen() {
  const { data, currentClientId, addRequest } = usePortal();
  const colors = useColors();
  const client = data.clients.find((item) => item.id === currentClientId);
  const project = data.projects.find((item) => item.id === client?.projectId);
  const requests = data.requests.filter((item) => item.clientId === client?.id);
  const latestMessage = [...data.messages]
    .filter((item) => item.clientId === client?.id)
    .reverse()
    .find((item) => item.sender === 'admin');

  if (!client) return null;

  return (
    <Page>
      <ClientBrand />
      <View style={styles.greetingBlock}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          Good morning, {client.name.split(' ')[0]}.
        </Text>
        <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
          Here’s what’s happening with {client.business}.
        </Text>
      </View>

      <Panel style={styles.websiteHero} delay={40}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: colors.accent }]}>
            <Feather name="globe" size={19} color={colors.primary} />
          </View>
          <StatusTag label={client.websiteStatus} />
        </View>
        <View style={styles.heroMain}>
          <Text style={[styles.overline, { color: colors.mutedForeground }]}>
            YOUR WEBSITE
          </Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {client.websiteName}
          </Text>
          <Text style={[styles.heroUrl, { color: colors.accentForeground }]}>
            {client.websiteUrl}
          </Text>
        </View>
        <View style={styles.heroButtons}>
          <ActionButton
            label="View website"
            icon="arrow-up-right"
            small
            onPress={() => openWebsite(client.websiteUrl)}
          />
          <ActionButton
            label="Details"
            icon="arrow-right"
            small
            variant="secondary"
            onPress={() => clientRoute('/(client)/website')}
          />
        </View>
      </Panel>

      <SectionHeading
        title="Current project"
        action="Details"
        onAction={() =>
          Alert.alert(
            project?.name ?? 'Project',
            `${project?.description ?? ''}\n\nCurrent stage: ${project?.stage ?? 'Planning'}`,
          )
        }
      />
      <Panel style={styles.projectPanel} delay={110}>
        <View style={styles.projectTop}>
          <View style={styles.projectCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {project?.name ?? 'Website project'}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {project?.stage ?? 'Planning'} · Updated today
            </Text>
          </View>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {project?.progress ?? 0}%
          </Text>
        </View>
        <ProgressBar value={project?.progress ?? 0} />
        <View style={styles.stageRow}>
          {['Planning', 'Design', 'Build', 'Launch'].map((stage, index) => {
            const activeStage = project?.stage ?? 'Planning';
            const stages = ['Planning', 'Design', 'Development', 'Review', 'Launch'];
            const currentIndex = stages.indexOf(activeStage);
            const isDone =
              index < Math.max(0, Math.ceil(((project?.progress ?? 0) / 100) * 4) - 1);
            const isCurrent =
              stage === activeStage ||
              (stage === 'Build' && activeStage === 'Development');
            return (
              <View key={stage} style={styles.stageItem}>
                <View
                  style={[
                    styles.stageDot,
                    {
                      backgroundColor:
                        isCurrent || isDone ? colors.primary : colors.secondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.stageLabel,
                    {
                      color:
                        isCurrent || isDone
                          ? colors.foreground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {stage}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={[styles.softDivider, { backgroundColor: colors.border }]} />
        <View style={styles.projectNote}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {project?.description ?? 'Your project details will appear here.'}
          </Text>
        </View>
      </Panel>

      <SectionHeading title="Your plan" action="Manage" onAction={() => clientRoute('/(client)/account')} />
      <Panel style={styles.subscriptionPanel} delay={180}>
        <View style={styles.planLeft}>
          <View style={[styles.planIcon, { backgroundColor: colors.accent }]}>
            <Feather name="zap" size={17} color={colors.primary} />
          </View>
          <View style={styles.planCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {client.subscriptionName}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {client.subscriptionPrice === null
                ? client.subscriptionName
                : `$${client.subscriptionPrice.toFixed(2)} / month`}
              {' · Renews '}
              {client.nextBilling}
            </Text>
          </View>
        </View>
        <StatusTag label={client.subscriptionStatus} />
      </Panel>

      <SectionHeading
        title="Quick actions"
        action="All requests"
        onAction={() => clientRoute('/(client)/requests')}
      />
      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          testID="quick-request"
          onPress={() => {
            addRequest(
              'New website request',
              'Tell us what you’d like to change and the team will follow up.',
              'Website Change',
              'Normal',
              client.id,
            );
            clientRoute('/(client)/requests');
          }}
          style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
            <Feather name="edit-3" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.quickLabel, { color: colors.foreground }]}>
            Request a change
          </Text>
          <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="quick-message"
          onPress={() => clientRoute('/(client)/messages')}
          style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accent }]}>
            <Feather name="message-circle" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.quickLabel, { color: colors.foreground }]}>
            Message Bradyn
          </Text>
          <Feather name="arrow-up-right" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <SectionHeading
        title="Recent activity"
        action="See requests"
        onAction={() => clientRoute('/(client)/requests')}
      />
      <Panel style={styles.activityPanel} delay={240}>
        <ActivityItem
          icon="message-circle"
          title={latestMessage ? 'Bradyn replied to your message' : 'Project is moving forward'}
          detail={latestMessage?.body ?? 'No messages yet.'}
          time={latestMessage?.time ?? ''}
        />
        <View style={[styles.softDivider, { backgroundColor: colors.border }]} />
        <ActivityItem
          icon="check-circle"
          title={requests[0]?.title ?? 'No requests yet'}
          detail={requests[0] ? `${requests[0].status} · ${requests[0].type}` : 'Submit a request when you need help.'}
          time={requests[0]?.createdAt ?? ''}
        />
      </Panel>
    </Page>
  );
}

export function ClientWebsiteScreen() {
  const { data, currentClientId } = usePortal();
  const colors = useColors();
  const client = data.clients.find((item) => item.id === currentClientId);
  const project = data.projects.find((item) => item.id === client?.projectId);
  if (!client) return null;

  return (
    <Page>
      <ClientBrand />
      <PageHeading
        eyebrow="YOUR WEBSITE"
        title="The details."
        subtitle="Your site, preview link, and current project status."
      />
      <Panel style={styles.websiteDetails}>
        <View style={styles.websiteTitleRow}>
          <View style={[styles.bigIcon, { backgroundColor: colors.accent }]}>
            <Feather name="globe" size={21} color={colors.primary} />
          </View>
          <View style={styles.projectCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {client.websiteName}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {client.business}
            </Text>
          </View>
          <StatusTag label={client.websiteStatus} />
        </View>
        <View style={[styles.softDivider, { backgroundColor: colors.border }]} />
        <DataRow label="Live website" value={client.websiteUrl} icon="external-link" />
        <DataRow label="Preview link" value={client.previewUrl} icon="eye" />
        <DataRow
          label="Last updated"
          value={project?.updatedAt ?? client.lastActivity}
          icon="clock"
          last
        />
      </Panel>
      <Panel style={styles.projectPanel}>
        <View style={styles.inlineHeading}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {project?.name ?? 'Website project'}
          </Text>
          <StatusTag label={project?.stage ?? 'Planning'} />
        </View>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
          {project?.description ?? 'Your project details will appear here.'}
        </Text>
        <View style={styles.projectTop}>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            Project progress
          </Text>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {project?.progress ?? 0}%
          </Text>
        </View>
        <ProgressBar value={project?.progress ?? 0} height={8} />
        <ActionButton
          label="View project milestones"
          icon="arrow-right"
          variant="secondary"
          onPress={() =>
            Alert.alert(
              project?.name ?? 'Project milestones',
              (project?.milestones ?? [])
                .map((milestone) => `${milestone.complete ? '✓' : '○'} ${milestone.title}`)
                .join('\n'),
            )
          }
        />
      </Panel>
      <View style={styles.twoButtons}>
        <ActionButton
          label="Visit website"
          icon="arrow-up-right"
          small
          onPress={() => openWebsite(client.websiteUrl)}
        />
        <ActionButton
          label="Request a change"
          icon="edit-3"
          variant="secondary"
          small
          onPress={() => clientRoute('/(client)/requests')}
        />
      </View>
    </Page>
  );
}

function RequestComposer({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (
    title: string,
    description: string,
    type: RequestType,
    priority: RequestPriority,
  ) => void;
}) {
  const colors = useColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<RequestType>('Website Change');
  const [priority, setPriority] = useState<RequestPriority>('Normal');

  const close = () => {
    setTitle('');
    setDescription('');
    setType('Website Change');
    setPriority('Normal');
    onClose();
  };

  const submit = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Add a little more detail', 'A title and description are both required.');
      return;
    }
    onCreate(title.trim(), description.trim(), type, priority);
    close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.modalShade}>
        <View style={[styles.composerSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                New request
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Tell us what you need. We’ll take it from here.
              </Text>
            </View>
            <IconButton icon="x" onPress={close} accessibilityLabel="Close request form" />
          </View>
          <KeyboardAwareScrollViewCompat
            style={styles.flex}
            contentContainerStyle={styles.composerContent}
            keyboardShouldPersistTaps="handled"
            bottomOffset={32}
          >
            <TextField
              label="Request title"
              placeholder="What would you like changed?"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <Text style={[styles.fieldTitle, { color: colors.mutedForeground }]}>
              Request type
            </Text>
            <View style={styles.chipWrap}>
              {REQUEST_TYPES.map((item) => (
                <Pill
                  key={item}
                  label={item}
                  active={item === type}
                  onPress={() => setType(item)}
                />
              ))}
            </View>
            <TextField
              label="Description"
              placeholder="Include the details that will help us get started."
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />
            <Text style={[styles.fieldTitle, { color: colors.mutedForeground }]}>
              Priority
            </Text>
            <View style={styles.chipWrap}>
              {PRIORITIES.map((item) => (
                <Pill
                  key={item}
                  label={item}
                  active={item === priority}
                  onPress={() => setPriority(item)}
                />
              ))}
            </View>
            <ActionButton label="Submit request" icon="arrow-right" onPress={submit} />
          </KeyboardAwareScrollViewCompat>
        </View>
      </View>
    </Modal>
  );
}

function RequestRow({
  request,
  expanded,
  onPress,
  onComment,
}: {
  request: PortalRequest;
  expanded: boolean;
  onPress: () => void;
  onComment: (body: string) => void;
}) {
  const colors = useColors();
  const [reply, setReply] = useState('');
  const latestVisibleReply = [...request.comments]
    .reverse()
    .find((comment) => !comment.internal);
  return (
    <Panel style={styles.requestCard}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.requestPress}
      >
        <View style={styles.requestHead}>
          <StatusTag label={request.status} />
          <Text style={[styles.requestTime, { color: colors.mutedForeground }]}>
            {request.createdAt}
          </Text>
        </View>
        <Text style={[styles.requestTitle, { color: colors.foreground }]}>
          {request.title}
        </Text>
        <Text style={[styles.requestDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
          {request.description}
        </Text>
        <View style={styles.requestMeta}>
          <View style={[styles.metaChip, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>
              {request.type}
            </Text>
          </View>
          <View style={[styles.priorityDot, { backgroundColor: request.priority === 'High' ? colors.destructive : colors.primary }]} />
          <Text style={[styles.priorityText, { color: colors.mutedForeground }]}>
            {request.priority} priority
          </Text>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.mutedForeground}
            style={styles.expandIcon}
          />
        </View>
      </Pressable>
      {expanded ? (
        <View style={[styles.expandedRequest, { borderTopColor: colors.border }]}>
          {request.comments
            .filter((comment) => !comment.internal)
            .map((comment) => (
              <View key={comment.id} style={styles.commentLine}>
                <View style={styles.commentHeading}>
                  <Text style={[styles.commentName, { color: colors.foreground }]}>
                    {comment.name}
                  </Text>
                  <Text style={[styles.requestTime, { color: colors.mutedForeground }]}>
                    {comment.time}
                  </Text>
                </View>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {comment.body}
                </Text>
              </View>
            ))}
          {latestVisibleReply ? null : (
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              No replies yet. Add a note for the Bradyn team below.
            </Text>
          )}
          <View style={styles.replyRow}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Add a comment…"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.replyInput,
                { backgroundColor: colors.secondary, color: colors.foreground },
              ]}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (reply.trim()) {
                  onComment(reply.trim());
                  setReply('');
                  Keyboard.dismiss();
                }
              }}
            />
            <IconButton
              icon="arrow-up"
              accessibilityLabel="Send request comment"
              onPress={() => {
                if (reply.trim()) {
                  onComment(reply.trim());
                  setReply('');
                }
              }}
            />
          </View>
        </View>
      ) : null}
    </Panel>
  );
}

export function ClientRequestsScreen() {
  const { data, addRequest, addComment, currentClientId } = usePortal();
  const colors = useColors();
  const [filter, setFilter] = useState('All');
  const [showComposer, setShowComposer] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const requests = useMemo(
    () =>
      data.requests
        .filter((request) => request.clientId === currentClientId)
        .filter((request) => {
          if (filter === 'All') return true;
          if (filter === 'Open')
            return request.status === 'Submitted' || request.status === 'In Progress';
          if (filter === 'Waiting') return request.status === 'Waiting for Client';
          return request.status === filter;
        }),
    [currentClientId, data.requests, filter],
  );

  return (
    <>
      <Page>
        <ClientBrand />
        <PageHeading
          eyebrow="YOUR SUPPORT"
          title="Requests"
          subtitle="Changes, fixes, and questions for your website."
          right={
            <IconButton
              icon="plus"
              accessibilityLabel="Create a request"
              testID="new-request"
              onPress={() => setShowComposer(true)}
            />
          }
        />
        <View style={styles.filterScroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((item) => (
              <Pill
                key={item}
                label={item}
                active={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </ScrollView>
        </View>
        <View style={styles.requestSummary}>
          <Text style={[styles.summaryNumber, { color: colors.foreground }]}>
            {requests.length}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {filter === 'All' ? 'requests across your website' : `${filter.toLowerCase()} requests`}
          </Text>
        </View>
        {requests.length ? (
          requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              expanded={expandedId === request.id}
              onPress={() =>
                setExpandedId((current) =>
                  current === request.id ? null : request.id,
                )
              }
              onComment={(body) =>
                addComment(request.id, body, 'client', false)
              }
            />
          ))
        ) : (
          <Panel>
            <EmptyState
              icon="check-circle"
              title="Nothing in this filter"
              description="Try another filter or create a new request."
            />
          </Panel>
        )}
        <ActionButton
          label="Create a request"
          icon="plus"
          variant="secondary"
          onPress={() => setShowComposer(true)}
        />
      </Page>
      <RequestComposer
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onCreate={(title, description, type, priority) =>
          addRequest(title, description, type, priority)
        }
      />
    </>
  );
}

function ChatBubble({
  message,
  mine,
}: {
  message: PortalMessage;
  mine: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.bubbleRow,
        mine ? styles.bubbleMineRow : styles.bubbleTheirsRow,
      ]}
    >
      <View
        style={[
          styles.chatBubble,
          {
            backgroundColor: mine ? colors.primary : colors.card,
            borderColor: mine ? colors.primary : colors.border,
          },
        ]}
      >
        {!mine ? (
          <Text style={[styles.bubbleSender, { color: colors.accentForeground }]}>
            {message.name}
          </Text>
        ) : null}
        <Text
          style={[
            styles.bubbleText,
            { color: mine ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.body}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            { color: mine ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          {message.time}
        </Text>
      </View>
    </View>
  );
}

export function ClientMessagesScreen() {
  const { data, sendMessage, markMessagesRead, currentClientId } = usePortal();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const client = data.clients.find((item) => item.id === currentClientId);
  const messages = data.messages.filter((item) => item.clientId === currentClientId);
  const displayedMessages = [...messages].reverse();

  useEffect(() => {
    if (currentClientId) markMessagesRead(currentClientId);
  }, [currentClientId, markMessagesRead]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    sendMessage(body, 'client');
    setDraft('');
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.chatHeader,
          { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 14, borderBottomColor: colors.border },
        ]}
      >
        <ClientBrand />
        <View style={styles.chatContact}>
          <View style={styles.contactInfo}>
            <Avatar initials="B" size={38} />
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Bradyn support
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Usually replies within a few hours
              </Text>
            </View>
          </View>
          <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} />
        </View>
      </View>
      <ControllerKeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={displayedMessages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} mine={item.sender === 'client'} />
          )}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon="message-circle"
              title="Start a conversation"
              description="Send the Bradyn team a message about your website."
            />
          }
        />
        <View
          style={[
            styles.chatComposer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Bradyn…"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.chatInput,
              { backgroundColor: colors.secondary, color: colors.foreground },
            ]}
            multiline
            maxLength={1000}
            testID="message-input"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            testID="send-message"
            onPress={send}
            style={[
              styles.sendButton,
              { backgroundColor: draft.trim() ? colors.primary : colors.secondary },
            ]}
          >
            <Feather
              name="arrow-up"
              size={19}
              color={draft.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </ControllerKeyboardAvoidingView>
    </View>
  );
}

export function ClientAccountScreen() {
  const { data, currentClientId, addRequest, signOut } = usePortal();
  const colors = useColors();
  const { mode, toggleMode } = useThemeMode();
  const client = data.clients.find((item) => item.id === currentClientId);
  const [notifications, setNotifications] = useState(true);
  if (!client) return null;

  const planRequest = (cancel: boolean) => {
    Alert.alert(
      cancel ? 'Request cancellation?' : 'Request a plan change?',
      cancel
        ? 'This sends a cancellation request to the Bradyn team. Your subscription will not change until they confirm with you.'
        : 'This sends a plan-change request to the Bradyn team. Your billing details will not change until you agree to a new plan.',
      [
        { text: 'Keep my plan', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            addRequest(
              cancel ? 'Cancel subscription' : 'Change subscription plan',
              cancel
                ? 'Please contact me about cancelling my current plan.'
                : 'I would like to talk with the Bradyn team about changing plans.',
              'Other',
              'Normal',
              client.id,
            );
          },
        },
      ],
    );
  };

  return (
    <Page>
      <ClientBrand />
      <PageHeading
        eyebrow="ACCOUNT"
        title="Your account"
        subtitle="Profile, preferences, and subscription details."
      />
      <Panel style={styles.profilePanel}>
        <View style={styles.profileTop}>
          <Avatar initials={initial(client.name)} size={56} />
          <View style={styles.profileCopy}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {client.name}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {client.business}
            </Text>
          </View>
          <StatusTag label={client.status} />
        </View>
        <DataRow label="Email" value={client.email} icon="mail" />
        <DataRow label="Phone" value={client.phone} icon="phone" last />
      </Panel>

      <SectionHeading title="Subscription" />
      <Panel>
        <View style={styles.inlineHeading}>
          <View style={styles.planLeft}>
            <View style={[styles.planIcon, { backgroundColor: colors.accent }]}>
              <Feather name="zap" size={17} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {client.subscriptionName}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {client.subscriptionPrice === null
                  ? 'No price configured'
                  : `$${client.subscriptionPrice.toFixed(2)} / month`}
              </Text>
            </View>
          </View>
          <StatusTag label={client.subscriptionStatus} />
        </View>
        <DataRow label="Next billing date" value={client.nextBilling} icon="calendar" last />
        <View style={styles.twoButtons}>
          <ActionButton
            label="Change plan"
            variant="secondary"
            small
            onPress={() => planRequest(false)}
          />
          <ActionButton
            label="Cancel plan"
            variant="outline"
            small
            onPress={() => planRequest(true)}
          />
        </View>
      </Panel>

      <SectionHeading title="Preferences" />
      <Panel>
        <View style={styles.preferenceRow}>
          <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="bell" size={16} color={colors.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Notifications
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Project updates and replies
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: notifications }}
            testID="notification-toggle"
            onPress={() => setNotifications((current) => !current)}
            style={[
              styles.switchTrack,
              { backgroundColor: notifications ? colors.primary : colors.secondary },
            ]}
          >
            <View style={[styles.switchThumb, notifications ? styles.switchThumbOn : null]} />
          </Pressable>
        </View>
        <View style={[styles.softDivider, { backgroundColor: colors.border }]} />
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: mode === 'light' }}
          testID="appearance-toggle"
          onPress={toggleMode}
          style={styles.preferenceRow}
        >
          <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={mode === 'light' ? 'sun' : 'moon'} size={16} color={colors.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Light mode
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {mode === 'light' ? 'On · dark mode is also available' : 'Off · dark mode is active'}
            </Text>
          </View>
          <View style={[styles.switchTrack, { backgroundColor: mode === 'light' ? colors.primary : colors.secondary }]}>
            <View style={[styles.switchThumb, mode === 'light' ? styles.switchThumbOn : null]} />
          </View>
        </Pressable>
        <View style={[styles.softDivider, { backgroundColor: colors.border }]} />
        <View style={styles.preferenceRow}>
          <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={16} color={colors.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Security
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Sign-in and profile managed by Bradyn
            </Text>
          </View>
          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
        </View>
      </Panel>
      <ActionButton
        label="Sign out"
        icon="log-out"
        variant="outline"
        onPress={() => {
          signOut();
          router.replace('/(auth)/login' as Href);
        }}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  greetingBlock: { gap: 7, marginTop: 1 },
  greeting: { fontSize: 27, lineHeight: 33, fontFamily: 'Inter_700Bold', letterSpacing: -1.1 },
  greetingSub: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  websiteHero: { padding: 18, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroMain: { gap: 3 },
  overline: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.7 },
  heroTitle: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', letterSpacing: -0.7 },
  heroUrl: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  heroButtons: { flexDirection: 'row', gap: 9 },
  projectPanel: { gap: 15 },
  projectTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  projectCopy: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  cardSub: { fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  progressPercent: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  stageItem: { alignItems: 'center', flex: 1, gap: 7 },
  stageDot: { width: 7, height: 7, borderRadius: 4 },
  stageLabel: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  softDivider: { height: StyleSheet.hairlineWidth, width: '100%' },
  projectNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  subscriptionPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  planIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  planCopy: { flex: 1, gap: 3 },
  quickActions: { gap: 9 },
  quickAction: { minHeight: 58, borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quickIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  activityPanel: { gap: 13 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  activityIcon: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1, gap: 3 },
  activityTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  activityDetail: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  activityTime: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  websiteDetails: { gap: 11 },
  websiteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bigIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inlineHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  twoButtons: { flexDirection: 'row', gap: 9 },
  filterScroll: { marginRight: -20 },
  filterRow: { paddingRight: 20, gap: 8 },
  requestSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  summaryNumber: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  requestCard: { padding: 15, gap: 0 },
  requestPress: { gap: 9 },
  requestHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestTime: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  requestTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
  requestDescription: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  metaChipText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  priorityDot: { width: 5, height: 5, borderRadius: 3 },
  priorityText: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  expandIcon: { marginLeft: 'auto' },
  expandedRequest: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, gap: 11 },
  commentLine: { gap: 5 },
  commentHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentName: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  replyInput: { flex: 1, minHeight: 41, borderRadius: 13, paddingHorizontal: 12, fontSize: 12, fontFamily: 'Inter_400Regular' },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  composerSheet: { height: '94%', borderWidth: 1, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 10, overflow: 'hidden' },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#555A62', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  composerContent: { paddingHorizontal: 20, paddingBottom: 35, gap: 16 },
  fieldTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: -9 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chatHeader: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  chatContact: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  chatList: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 18, paddingVertical: 15, gap: 9 },
  bubbleRow: { width: '100%', marginVertical: 4 },
  bubbleMineRow: { alignItems: 'flex-end' },
  bubbleTheirsRow: { alignItems: 'flex-start' },
  chatBubble: { maxWidth: '83%', paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8, borderRadius: 17, borderWidth: 1, gap: 5 },
  bubbleSender: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  bubbleText: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  bubbleTime: { textAlign: 'right', fontSize: 8, fontFamily: 'Inter_400Regular' },
  chatComposer: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  chatInput: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 17, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 11, fontSize: 13, fontFamily: 'Inter_400Regular' },
  sendButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  profilePanel: { gap: 5 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  profileCopy: { flex: 1, gap: 4 },
  profileName: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  preferenceRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 11 },
  preferenceIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  preferenceCopy: { flex: 1, gap: 2 },
  switchTrack: { width: 42, height: 25, borderRadius: 14, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#FFFFFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
});