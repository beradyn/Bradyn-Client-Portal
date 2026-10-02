import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
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
  DemoClient,
  DemoMessage,
  DemoProject,
  DemoRequest,
  RequestStatus,
  useDemo,
} from '@/components/DemoProvider';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView as ControllerKeyboardAvoidingView } from 'react-native-keyboard-controller';

const REQUEST_FILTERS = ['All', 'New', 'In Progress', 'Waiting', 'Completed'];
const PROJECT_STAGES = ['Planning', 'Design', 'Development', 'Review', 'Launch', 'Completed'];
const REQUEST_STATUSES: RequestStatus[] = [
  'Submitted',
  'In Progress',
  'Waiting for Client',
  'Completed',
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function AdminBrand() {
  return <BrandHeader role="STUDIO ADMIN" />;
}

function MetricCard({
  icon,
  value,
  label,
  note,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  value: number | string;
  label: string;
  note: string;
}) {
  const colors = useColors();
  return (
    <Panel style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIcon, { backgroundColor: colors.accent }]}>
          <Feather name={icon} size={16} color={colors.primary} />
        </View>
        <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.metricNote, { color: colors.mutedForeground }]}>{note}</Text>
    </Panel>
  );
}

function ConversationModal({
  client,
  visible,
  onClose,
}: {
  client: DemoClient | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { data, sendMessage, markMessagesRead } = useDemo();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const messages = useMemo(
    () =>
      client
        ? data.messages.filter((item) => item.clientId === client.id)
        : [],
    [client, data.messages],
  );

  React.useEffect(() => {
    if (visible && client) markMessagesRead(client.id);
  }, [visible, client, markMessagesRead]);

  if (!client) return null;

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    sendMessage(body, 'admin', client.id);
    setDraft('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.conversationScreen,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.conversationHeader,
            {
              paddingTop: Platform.OS === 'web' ? 67 : insets.top + 12,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.conversationHeaderTop}>
            <IconButton
              icon="arrow-left"
              onPress={onClose}
              accessibilityLabel="Back to admin inbox"
            />
            <Text style={[styles.conversationTitle, { color: colors.foreground }]}>
              Conversation
            </Text>
            <View style={{ width: 42 }} />
          </View>
          <View style={styles.contactInfo}>
            <Avatar initials={initials(client.name)} size={38} />
            <View style={styles.profileCopy}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {client.name}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                {client.business}
              </Text>
            </View>
            <StatusTag label="Active" />
          </View>
        </View>
        <ControllerKeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <FlatList
            inverted
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.conversationList}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ConversationBubble message={item} mine={item.sender === 'admin'} />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="message-circle"
                title="No messages yet"
                description="Send a note to start this support conversation."
              />
            }
          />
          <View
            style={[
              styles.adminChatInputRow,
              {
                borderTopColor: colors.border,
                paddingBottom: Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 8),
              },
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${client.name.split(' ')[0]}…`}
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.adminChatInput,
                { backgroundColor: colors.secondary, color: colors.foreground },
              ]}
              multiline
              maxLength={1000}
              testID="admin-message-input"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send reply"
              testID="admin-send-message"
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
    </Modal>
  );
}

function ConversationBubble({
  message,
  mine,
}: {
  message: DemoMessage;
  mine: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.messageRow, mine ? styles.messageMine : styles.messageTheirs]}>
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: mine ? colors.primary : colors.card,
            borderColor: mine ? colors.primary : colors.border,
          },
        ]}
      >
        {!mine ? (
          <Text style={[styles.messageSender, { color: colors.accentForeground }]}>
            {message.name}
          </Text>
        ) : null}
        <Text
          style={[
            styles.messageBody,
            { color: mine ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.body}
        </Text>
        <Text
          style={[
            styles.messageTime,
            { color: mine ? colors.accentForeground : colors.mutedForeground },
          ]}
        >
          {message.time}
        </Text>
      </View>
    </View>
  );
}

export function AdminDashboardScreen() {
  const { data } = useDemo();
  const colors = useColors();
  const [conversationClient, setConversationClient] = useState<DemoClient | null>(null);
  const activeProjects = data.projects.filter(
    (project) => project.status !== 'Completed',
  ).length;
  const openRequests = data.requests.filter(
    (request) => request.status !== 'Completed',
  ).length;
  const activeWebsites = data.clients.filter(
    (client) => client.websiteStatus === 'Live',
  ).length;
  const attentionProjects = data.projects.filter(
    (project) =>
      project.status === 'Review' ||
      project.status === 'Planning' ||
      project.progress < 40,
  );
  const latestRequests = data.requests.slice(0, 3);
  const latestByClient = data.clients
    .map((client) => {
      const messages = data.messages.filter((message) => message.clientId === client.id);
      const latest = messages[messages.length - 1];
      const unread = messages.filter(
        (message) => message.sender === 'client' && !message.read,
      ).length;
      return { client, latest, unread };
    })
    .filter((item) => item.latest)
    .sort((a, b) =>
      a.latest?.time === 'Yesterday'
        ? 1
        : b.latest?.time === 'Yesterday'
          ? -1
          : 0,
    );

  return (
    <>
      <Page>
        <AdminBrand />
        <PageHeading
          eyebrow="STUDIO OVERVIEW"
          title="The studio."
          subtitle="A clear view of your clients and what needs attention."
          right={
            <IconButton
              icon="message-circle"
              accessibilityLabel="Open client inbox"
              onPress={() =>
                setConversationClient(
                  data.clients.find((client) =>
                    data.messages.some((message) => message.clientId === client.id),
                  ) ?? null,
                )
              }
              dot={data.messages.some((message) => !message.read && message.sender === 'client')}
            />
          }
        />
        <View style={styles.metricGrid}>
          <MetricCard
            icon="users"
            value={data.clients.length}
            label="Total clients"
            note="Across the studio"
          />
          <MetricCard
            icon="layers"
            value={activeProjects}
            label="Active projects"
            note={`${attentionProjects.length} need attention`}
          />
          <MetricCard
            icon="inbox"
            value={openRequests}
            label="Open requests"
            note="Across all clients"
          />
          <MetricCard
            icon="globe"
            value={activeWebsites}
            label="Live websites"
            note="Client websites"
          />
        </View>

        <SectionHeading
          title="Requests to review"
          action="View all"
          onAction={() => router.push('/(admin)/requests' as Href)}
        />
        <Panel style={styles.dashboardList}>
          {latestRequests.length ? (
            latestRequests.map((request, index) => {
              const client = data.clients.find((item) => item.id === request.clientId);
              return (
                <React.Fragment key={request.id}>
                  {index > 0 ? (
                    <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
                  ) : null}
                  <Pressable
                    onPress={() => router.push('/(admin)/requests' as Href)}
                    style={styles.dashListRow}
                  >
                    <View style={styles.dashListCopy}>
                      <Text style={[styles.dashTitle, { color: colors.foreground }]}>
                        {request.title}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                        {client?.business ?? 'New client'} · {request.createdAt}
                      </Text>
                    </View>
                    <StatusTag label={request.status} />
                  </Pressable>
                </React.Fragment>
              );
            })
          ) : (
            <EmptyState icon="check-circle" title="All clear" description="There are no open requests." />
          )}
        </Panel>

        <SectionHeading title="Recent conversations" action="Open inbox" onAction={() => setConversationClient(latestByClient[0]?.client ?? null)} />
        <Panel style={styles.dashboardList}>
          {latestByClient.slice(0, 3).map(({ client, latest, unread }, index) => (
            <React.Fragment key={client.id}>
              {index > 0 ? (
                <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
              ) : null}
              <Pressable
                onPress={() => setConversationClient(client)}
                style={styles.inboxRow}
              >
                <Avatar initials={initials(client.name)} size={39} />
                <View style={styles.inboxCopy}>
                  <Text style={[styles.dashTitle, { color: colors.foreground }]}>
                    {client.name}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {latest?.body}
                  </Text>
                </View>
                <View style={styles.inboxRight}>
                  {unread ? (
                    <View style={[styles.unreadCount, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.unreadNumber, { color: colors.primaryForeground }]}>
                        {unread}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                    {latest?.time}
                  </Text>
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </Panel>

        <SectionHeading
          title="Needs your attention"
          action="Projects"
          onAction={() => router.push('/(admin)/projects' as Href)}
        />
        {attentionProjects.length ? (
          attentionProjects.slice(0, 2).map((project) => {
            const client = data.clients.find((item) => item.id === project.clientId);
            return (
              <Panel key={project.id} style={styles.attentionPanel}>
                <View style={styles.projectCardTop}>
                  <View style={styles.metricIcon}>
                    <Feather name="layers" size={16} color={colors.primary} />
                  </View>
                  <StatusTag label={project.status} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {project.name}
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {client?.business ?? 'Client'} · {project.progress}% complete
                </Text>
                <ProgressBar value={project.progress} />
              </Panel>
            );
          })
        ) : (
          <Panel>
            <EmptyState icon="check-circle" title="All projects on track" description="No projects need attention right now." />
          </Panel>
        )}
        <Text style={[styles.demoCaption, { color: colors.mutedForeground }]}>
          Admin demo · Fictional clients and project activity
        </Text>
      </Page>
      <ConversationModal
        client={conversationClient}
        visible={!!conversationClient}
        onClose={() => setConversationClient(null)}
      />
    </>
  );
}

function ClientRow({
  client,
  onPress,
}: {
  client: DemoClient;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.clientRowPress}>
      <Panel style={styles.clientRowPanel}>
        <Avatar initials={initials(client.name)} size={43} />
        <View style={styles.clientRowCopy}>
          <Text style={[styles.dashTitle, { color: colors.foreground }]}>
            {client.business}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {client.name} · {client.email}
          </Text>
        </View>
        <View style={styles.clientRowEnd}>
          <StatusTag label={client.websiteStatus} />
          <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
        </View>
      </Panel>
    </Pressable>
  );
}

function AddClientModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, business: string, email: string, phone: string) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const close = () => {
    setName('');
    setBusiness('');
    setEmail('');
    setPhone('');
    onClose();
  };
  const submit = () => {
    if (!name.trim() || !business.trim() || !email.trim()) {
      Alert.alert('Add the client details', 'Name, business, and email are required.');
      return;
    }
    onAdd(name.trim(), business.trim(), email.trim(), phone.trim());
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add a client</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Create a sample client workspace.</Text>
            </View>
            <IconButton icon="x" onPress={close} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <TextField label="Contact name" placeholder="Jamie Parker" value={name} onChangeText={setName} />
            <TextField label="Business" placeholder="Business name" value={business} onChangeText={setBusiness} />
            <TextField label="Email" placeholder="name@business.demo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="Phone (optional)" placeholder="(555) 555-0100" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <ActionButton label="Create client" icon="user-plus" onPress={submit} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ClientDetailsModal({
  client,
  visible,
  onClose,
}: {
  client: DemoClient | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { data, updateClient } = useDemo();
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client?.name ?? '');
  const [business, setBusiness] = useState(client?.business ?? '');
  const [websiteName, setWebsiteName] = useState(client?.websiteName ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [site, setSite] = useState(client?.websiteUrl ?? '');
  const [preview, setPreview] = useState(client?.previewUrl ?? '');

  if (!client) return null;
  const project = data.projects.find((item) => item.id === client.projectId);
  const requests = data.requests.filter((item) => item.clientId === client.id);

  const toggleStatus = () => {
    const statuses: DemoClient['websiteStatus'][] = ['Building', 'Review', 'Live', 'Offline'];
    const index = statuses.indexOf(client.websiteStatus);
    updateClient(client.id, { websiteStatus: statuses[(index + 1) % statuses.length] });
  };
  const save = () => {
    updateClient(client.id, {
      name: name.trim() || client.name,
      business: business.trim() || client.business,
      websiteName: websiteName.trim() || client.websiteName,
      email: email.trim() || client.email,
      phone: phone.trim(),
      websiteUrl: site.trim() || client.websiteUrl,
      previewUrl: preview.trim() || client.previewUrl,
    });
    setEditing(false);
    Alert.alert('Client updated', 'The demo client details have been saved.');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalFull, { backgroundColor: colors.background }]}>
        <View style={[styles.modalNav, { paddingTop: Platform.OS === 'web' ? 67 : 18, borderBottomColor: colors.border }]}>
          <IconButton icon="arrow-left" onPress={onClose} accessibilityLabel="Back to clients" />
          <Text style={[styles.conversationTitle, { color: colors.foreground }]}>Client details</Text>
          <IconButton
            icon={editing ? 'x' : 'edit-2'}
            onPress={() => setEditing((current) => !current)}
            accessibilityLabel={editing ? 'Cancel edit' : 'Edit client'}
          />
        </View>
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileHero}>
            <Avatar initials={initials(client.name)} size={59} />
            <View style={styles.profileCopy}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{client.business}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{client.name} · {client.status}</Text>
            </View>
            <StatusTag label={client.websiteStatus} />
          </View>

          <Panel style={styles.detailPanel}>
            <View style={styles.inlineHeading}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Contact information</Text>
              {editing ? <Text style={[styles.cardSub, { color: colors.primary }]}>EDITING</Text> : null}
            </View>
            {editing ? (
              <>
                <TextField label="Contact name" value={name} onChangeText={setName} />
                <TextField label="Business" value={business} onChangeText={setBusiness} />
                <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
                <TextField label="Phone" value={phone} onChangeText={setPhone} />
              </>
            ) : (
              <>
                <DataRow label="Contact" value={client.name} icon="user" />
                <DataRow label="Email" value={client.email} icon="mail" />
                <DataRow label="Phone" value={client.phone || 'Not provided'} icon="phone" last />
              </>
            )}
          </Panel>

          <Panel style={styles.detailPanel}>
            <View style={styles.inlineHeading}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Website</Text>
              <Pressable onPress={toggleStatus} accessibilityRole="button">
                <StatusTag label={client.websiteStatus} />
              </Pressable>
            </View>
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Tap the status to cycle Building, Review, Live, and Offline.</Text>
            {editing ? (
              <>
                <TextField label="Website name" value={websiteName} onChangeText={setWebsiteName} />
                <TextField label="Website URL" value={site} onChangeText={setSite} autoCapitalize="none" />
                <TextField label="Preview URL" value={preview} onChangeText={setPreview} autoCapitalize="none" />
              </>
            ) : (
              <>
                <DataRow label="Website" value={client.websiteName} icon="globe" />
                <DataRow label="URL" value={client.websiteUrl} icon="external-link" />
                <DataRow label="Preview" value={client.previewUrl} icon="eye" last />
              </>
            )}
          </Panel>

          <Panel style={styles.detailPanel}>
            <View style={styles.inlineHeading}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Project</Text>
              <StatusTag label={project?.status ?? 'Unassigned'} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{project?.name ?? 'No project assigned'}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{project?.description ?? 'Create a project from the Projects tab.'}</Text>
            {project ? <ProgressBar value={project.progress} /> : null}
            <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {requests.length} support {requests.length === 1 ? 'request' : 'requests'} · {client.subscriptionName} · ${client.subscriptionPrice}/mo
            </Text>
          </Panel>
          {editing ? <ActionButton label="Save client details" icon="check" onPress={save} /> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function AdminClientsScreen() {
  const { data, addClient } = useDemo();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const clients = useMemo(
    () =>
      data.clients.filter((client) =>
        `${client.name} ${client.business} ${client.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data.clients, query],
  );
  const selectedClient = data.clients.find((item) => item.id === selectedClientId) ?? null;

  return (
    <>
      <Page>
        <AdminBrand />
        <PageHeading
          eyebrow="RELATIONSHIPS"
          title="Clients"
          subtitle={`${data.clients.length} client workspaces across the studio.`}
          right={
            <IconButton
              icon="plus"
              accessibilityLabel="Add client"
              testID="add-client"
              onPress={() => setShowAdd(true)}
            />
          }
        />
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search clients, businesses, email…"
          autoCapitalize="none"
          clearButtonMode="while-editing"
          leftIcon="search"
        />
        <SectionHeading title="All clients" />
        {clients.length ? (
          clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onPress={() => setSelectedClientId(client.id)}
            />
          ))
        ) : (
          <Panel>
            <EmptyState icon="users" title="No matches" description="Try a different name or business." />
          </Panel>
        )}
        <Text style={[styles.demoCaption, { color: colors.mutedForeground }]}>
          Added clients and edits are stored only on this device.
        </Text>
      </Page>
      <AddClientModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addClient}
      />
      <ClientDetailsModal
        key={selectedClient?.id ?? 'client-details'}
        client={selectedClient}
        visible={!!selectedClient}
        onClose={() => setSelectedClientId(null)}
      />
    </>
  );
}

function AddProjectModal({
  visible,
  clients,
  onClose,
  onAdd,
}: {
  visible: boolean;
  clients: DemoClient[];
  onClose: () => void;
  onAdd: (name: string, clientId: string, description: string) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id ?? 'northstar');
  const submit = () => {
    if (!name.trim() || !clientId) {
      Alert.alert('Add project details', 'A project name and client are required.');
      return;
    }
    onAdd(name.trim(), clientId, description.trim());
    setName('');
    setDescription('');
    onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>New project</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Assign a project to a client.</Text>
            </View>
            <IconButton icon="x" onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <TextField label="Project name" placeholder="Website refresh" value={name} onChangeText={setName} />
            <Text style={[styles.fieldTitle, { color: colors.mutedForeground }]}>Client</Text>
            <View style={styles.chipWrap}>
              {clients.map((client) => (
                <Pill
                  key={client.id}
                  label={client.business}
                  active={client.id === clientId}
                  onPress={() => setClientId(client.id)}
                />
              ))}
            </View>
            <TextField label="Description" placeholder="A short project brief…" value={description} onChangeText={setDescription} multiline />
            <ActionButton label="Create project" icon="plus" onPress={submit} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProjectAdminCard({ project }: { project: DemoProject }) {
  const { data, updateProject, toggleMilestone, addMilestone, deleteProject } = useDemo();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [newMilestone, setNewMilestone] = useState('');
  const client = data.clients.find((item) => item.id === project.clientId);
  const advanceStage = () => {
    const index = PROJECT_STAGES.indexOf(project.stage);
    const next = PROJECT_STAGES[(index + 1) % PROJECT_STAGES.length];
    const stageProgress: Record<string, number> = {
      Planning: 0,
      Design: 25,
      Development: 55,
      Review: 85,
      Launch: 95,
      Completed: 100,
    };
    updateProject(project.id, {
      stage: next,
      status: next,
      progress: stageProgress[next] ?? project.progress,
      updatedAt: 'Updated just now',
    });
  };
  return (
    <Panel style={styles.projectAdminPanel}>
      <Pressable onPress={() => setExpanded((current) => !current)} style={styles.projectAdminTap}>
        <View style={styles.projectCardTop}>
          <View style={styles.metricIcon}>
            <Feather name="layers" size={16} color={colors.primary} />
          </View>
          <StatusTag label={project.status} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{project.name}</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
          {client?.business ?? 'Unassigned client'} · {project.progress}% complete
        </Text>
        <ProgressBar value={project.progress} />
      </Pressable>
      {expanded ? (
        <View style={[styles.projectAdminDetails, { borderTopColor: colors.border }]}>
          <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
            Current stage: {project.stage} · {project.updatedAt}
          </Text>
          <ActionButton
            label="Advance stage"
            icon="arrow-right"
            small
            variant="secondary"
            onPress={advanceStage}
          />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Milestones</Text>
          {project.milestones.map((milestone) => (
            <Pressable
              key={milestone.id}
              onPress={() => toggleMilestone(project.id, milestone.id)}
              style={styles.milestoneRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: milestone.complete }}
            >
              <View
                style={[
                  styles.milestoneCheck,
                  {
                    backgroundColor: milestone.complete ? colors.primary : 'transparent',
                    borderColor: milestone.complete ? colors.primary : colors.border,
                  },
                ]}
              >
                {milestone.complete ? (
                  <Feather name="check" size={11} color={colors.primaryForeground} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.cardSub,
                  {
                    color: milestone.complete ? colors.mutedForeground : colors.foreground,
                    textDecorationLine: milestone.complete ? 'line-through' : 'none',
                  },
                ]}
              >
                {milestone.title}
              </Text>
            </Pressable>
          ))}
          <View style={styles.addMilestoneRow}>
            <TextInput
              value={newMilestone}
              onChangeText={setNewMilestone}
              placeholder="Add a milestone"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.milestoneInput, { color: colors.foreground, backgroundColor: colors.secondary }]}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (newMilestone.trim()) {
                  addMilestone(project.id, newMilestone.trim());
                  setNewMilestone('');
                }
              }}
            />
            <IconButton
              icon="plus"
              accessibilityLabel="Add milestone"
              onPress={() => {
                if (newMilestone.trim()) {
                  addMilestone(project.id, newMilestone.trim());
                  setNewMilestone('');
                }
              }}
            />
          </View>
          <ActionButton
            label="Delete project"
            icon="trash-2"
            small
            variant="outline"
            onPress={() =>
              Alert.alert('Delete this project?', 'This removes the demo project from this device.', [
                { text: 'Keep project', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteProject(project.id),
                },
              ])
            }
          />
        </View>
      ) : null}
    </Panel>
  );
}

export function AdminProjectsScreen() {
  const { data, addProject } = useDemo();
  const colors = useColors();
  const [showAdd, setShowAdd] = useState(false);
  const active = data.projects.filter((project) => project.status !== 'Completed').length;
  return (
    <>
      <Page>
        <AdminBrand />
        <PageHeading
          eyebrow="DELIVERY"
          title="Projects"
          subtitle={`${active} active projects · update stages and milestones.`}
          right={
            <IconButton
              icon="plus"
              accessibilityLabel="Create project"
              testID="add-project"
              onPress={() => setShowAdd(true)}
            />
          }
        />
        <View
          style={[
            styles.projectSummaryRow,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <View style={styles.projectSummary}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{data.projects.length}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Total projects</Text>
          </View>
          <View style={[styles.summarySeparator, { backgroundColor: colors.border }]} />
          <View style={styles.projectSummary}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{active}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>In progress</Text>
          </View>
        </View>
        <SectionHeading title="All projects" />
        {data.projects.length ? (
          data.projects.map((project) => (
            <ProjectAdminCard key={project.id} project={project} />
          ))
        ) : (
          <Panel>
            <EmptyState icon="layers" title="No projects yet" description="Add a project to begin tracking client work." />
          </Panel>
        )}
      </Page>
      <AddProjectModal
        visible={showAdd}
        clients={data.clients}
        onClose={() => setShowAdd(false)}
        onAdd={addProject}
      />
    </>
  );
}

export function AdminRequestsScreen() {
  const { data, updateRequest, addComment } = useDemo();
  const colors = useColors();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [internal, setInternal] = useState(false);

  const requests = useMemo(
    () =>
      data.requests.filter((request) => {
        const client = data.clients.find((item) => item.id === request.clientId);
        const matchesSearch =
          `${request.title} ${client?.business ?? ''} ${request.description}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesFilter =
          filter === 'All' ||
          (filter === 'New' && request.status === 'Submitted') ||
          (filter === 'Waiting' && request.status === 'Waiting for Client') ||
          request.status === filter;
        return matchesSearch && matchesFilter;
      }),
    [data.clients, data.requests, filter, query],
  );

  const addResponse = (request: DemoRequest) => {
    const body = draft.trim();
    if (!body) return;
    addComment(request.id, body, 'admin', internal);
    setDraft('');
    setInternal(false);
  };

  return (
    <Page>
      <AdminBrand />
      <PageHeading
        eyebrow="CLIENT SUPPORT"
        title="Requests"
        subtitle="Triage changes, questions, and client follow-ups."
      />
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search requests or clients…"
        autoCapitalize="none"
        leftIcon="search"
      />
      <View style={styles.requestFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {REQUEST_FILTERS.map((item) => (
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
        <Text style={[styles.summaryNumber, { color: colors.foreground }]}>{requests.length}</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
          {filter === 'All' ? 'requests in the studio' : `${filter.toLowerCase()} requests`}
        </Text>
      </View>
      {requests.map((request) => {
        const client = data.clients.find((item) => item.id === request.clientId);
        const expanded = expandedId === request.id;
        const nextStatus =
          REQUEST_STATUSES[
            (REQUEST_STATUSES.indexOf(request.status) + 1) % REQUEST_STATUSES.length
          ];
        return (
          <Panel key={request.id} style={styles.adminRequestPanel}>
            <Pressable
              onPress={() => {
                setExpandedId((current) =>
                  current === request.id ? null : request.id,
                );
                setDraft('');
              }}
              style={styles.requestTap}
            >
              <View style={styles.adminRequestTop}>
                <View style={styles.adminRequester}>
                  <Avatar initials={initials(client?.name ?? 'New client')} size={34} />
                  <View style={styles.profileCopy}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                      {client?.business ?? 'New client'}
                    </Text>
                    <Text style={[styles.requestTime, { color: colors.mutedForeground }]}>
                      {request.createdAt}
                    </Text>
                  </View>
                </View>
                <StatusTag label={request.status} />
              </View>
              <Text style={[styles.requestTitle, { color: colors.foreground }]}>{request.title}</Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                {request.description}
              </Text>
              <View style={styles.requestMeta}>
                <View style={[styles.metaChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>{request.type}</Text>
                </View>
                <Text style={[styles.priorityText, { color: request.priority === 'High' ? colors.destructive : colors.mutedForeground }]}>
                  {request.priority} priority
                </Text>
                <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={colors.mutedForeground} style={styles.expandIcon} />
              </View>
            </Pressable>
            {expanded ? (
              <View style={[styles.adminRequestDetail, { borderTopColor: colors.border }]}>
                <Text style={[styles.fieldTitle, { color: colors.mutedForeground }]}>Update status</Text>
                <View style={styles.chipWrap}>
                  {REQUEST_STATUSES.map((status) => (
                    <Pill
                      key={status}
                      label={status}
                      active={request.status === status}
                      onPress={() => updateRequest(request.id, { status })}
                    />
                  ))}
                </View>
                <View style={styles.inlineHeading}>
                  <Text style={[styles.fieldTitle, { color: colors.mutedForeground }]}>Assigned client</Text>
                  <Text style={[styles.cardSub, { color: colors.foreground }]}>{client?.name}</Text>
                </View>
                {request.comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={[
                      styles.adminComment,
                      {
                        backgroundColor: comment.internal ? colors.accent : colors.secondary,
                        borderColor: comment.internal ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.commentHeading}>
                      <Text style={[styles.commentName, { color: comment.internal ? colors.accentForeground : colors.foreground }]}>
                        {comment.name}
                      </Text>
                      <Text style={[styles.requestTime, { color: colors.mutedForeground }]}>{comment.time}</Text>
                    </View>
                    <Text style={[styles.cardSub, { color: colors.foreground }]}>{comment.body}</Text>
                  </View>
                ))}
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: internal }}
                  onPress={() => setInternal((current) => !current)}
                  style={styles.noteToggle}
                >
                  <View
                    style={[
                      styles.noteCheck,
                      {
                        borderColor: internal ? colors.primary : colors.border,
                        backgroundColor: internal ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {internal ? <Feather name="check" size={10} color={colors.primaryForeground} /> : null}
                  </View>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Internal note only</Text>
                </Pressable>
                <View style={styles.replyRow}>
                  <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={internal ? 'Add an internal note…' : 'Reply to client…'}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.replyInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
                    multiline
                    maxLength={500}
                  />
                  <IconButton
                    icon="arrow-up"
                    accessibilityLabel={internal ? 'Save internal note' : 'Send client reply'}
                    onPress={() => addResponse(request)}
                  />
                </View>
                <ActionButton
                  label={request.status === 'Completed' ? 'Reopen request' : `Mark ${nextStatus.toLowerCase()}`}
                  icon={request.status === 'Completed' ? 'rotate-ccw' : 'check'}
                  small
                  variant="secondary"
                  onPress={() =>
                    updateRequest(request.id, {
                      status: request.status === 'Completed' ? 'In Progress' : nextStatus,
                    })
                  }
                />
              </View>
            ) : null}
          </Panel>
        );
      })}
      {!requests.length ? (
        <Panel>
          <EmptyState icon="check-circle" title="No matching requests" description="Change the filter or search term." />
        </Panel>
      ) : null}
    </Page>
  );
}

export function AdminAccountScreen() {
  const { signOut, data } = useDemo();
  const colors = useColors();
  const [notifications, setNotifications] = useState(true);
  return (
    <Page>
      <AdminBrand />
      <PageHeading
        eyebrow="STUDIO SETTINGS"
        title="Account"
        subtitle="Your admin profile and studio preferences."
      />
      <Panel style={styles.profilePanel}>
        <View style={styles.profileTop}>
          <Avatar initials="TB" size={56} />
          <View style={styles.profileCopy}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>Taylor Brooks</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Studio administrator</Text>
          </View>
          <StatusTag label="Admin" />
        </View>
        <DataRow label="Email" value="taylor@bradyn.demo" icon="mail" />
        <DataRow label="Studio" value="Bradyn Digital" icon="briefcase" last />
      </Panel>
      <SectionHeading title="Studio" />
      <Panel>
        <DataRow label="Clients" value={`${data.clients.length} total`} icon="users" />
        <DataRow label="Open projects" value={`${data.projects.filter((item) => item.status !== 'Completed').length} in progress`} icon="layers" last />
      </Panel>
      <SectionHeading title="Preferences" />
      <Panel style={styles.preferencePanel}>
        <View style={styles.preferenceRow}>
          <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="bell" size={16} color={colors.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notifications</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Client replies and project updates</Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: notifications }}
            onPress={() => setNotifications((current) => !current)}
            style={[styles.switchTrack, { backgroundColor: notifications ? colors.primary : colors.secondary }]}
          >
            <View style={[styles.switchThumb, notifications ? styles.switchThumbOn : null]} />
          </Pressable>
        </View>
        <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
        <View style={styles.preferenceRow}>
          <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="moon" size={16} color={colors.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Appearance</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Dark · always on</Text>
          </View>
          <Feather name="check" size={17} color={colors.primary} />
        </View>
        <View style={[styles.thinDivider, { backgroundColor: colors.border }]} />
        <View style={styles.preferenceRow}>
          <View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={16} color={colors.primary} />
          </View>
          <View style={styles.preferenceCopy}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Demo access</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Local sample accounts only</Text>
          </View>
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
      <Text style={[styles.demoCaption, { color: colors.mutedForeground }]}>
        Sign out to return to demo role selection.
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', flexGrow: 1, padding: 14, gap: 5, borderRadius: 20 },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 25, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  metricLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  metricNote: { fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cardTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  cardSub: { fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  activityTime: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  inlineHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dashboardList: { gap: 12 },
  dashListRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dashListCopy: { flex: 1, gap: 4 },
  dashTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  thinDivider: { height: StyleSheet.hairlineWidth, width: '100%' },
  inboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inboxCopy: { flex: 1, gap: 3 },
  inboxRight: { alignItems: 'flex-end', gap: 5 },
  unreadCount: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadNumber: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  attentionPanel: { gap: 10 },
  projectCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  demoCaption: { textAlign: 'center', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: -7 },
  conversationScreen: { flex: 1 },
  conversationHeader: { paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  conversationHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  conversationTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  contactInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileCopy: { flex: 1, gap: 3 },
  conversationList: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 18, paddingVertical: 15 },
  messageRow: { width: '100%', marginVertical: 4 },
  messageMine: { alignItems: 'flex-end' },
  messageTheirs: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '84%', paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8, borderRadius: 17, borderWidth: 1, gap: 5 },
  messageSender: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  messageBody: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  messageTime: { textAlign: 'right', fontSize: 8, fontFamily: 'Inter_400Regular' },
  adminChatInputRow: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  adminChatInput: { flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 17, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 11, fontSize: 13, fontFamily: 'Inter_400Regular' },
  sendButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  clientRowPress: { marginBottom: -10 },
  clientRowPanel: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  clientRowCopy: { flex: 1, gap: 4 },
  clientRowEnd: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  sheet: { height: '92%', borderWidth: 1, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 10, overflow: 'hidden' },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#555A62', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  formContent: { paddingHorizontal: 20, paddingBottom: 38, gap: 15 },
  modalFull: { flex: 1 },
  modalNav: { minHeight: 63, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailContent: { padding: 20, paddingBottom: 55, gap: 16 },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  profileName: { fontSize: 17, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  detailPanel: { gap: 10 },
  helperText: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  projectSummaryRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 19, padding: 16 },
  projectSummary: { flex: 1, gap: 3 },
  summaryValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  summarySeparator: { height: 35, width: StyleSheet.hairlineWidth },
  projectAdminPanel: { padding: 15, gap: 0 },
  projectAdminTap: { gap: 10 },
  projectAdminDetails: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, gap: 11 },
  milestoneRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 9 },
  milestoneCheck: { width: 17, height: 17, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addMilestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneInput: { flex: 1, minHeight: 41, borderRadius: 13, paddingHorizontal: 12, fontSize: 12, fontFamily: 'Inter_400Regular' },
  requestFilters: { marginRight: -20 },
  filterRow: { paddingRight: 20, gap: 8 },
  requestSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  summaryNumber: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  adminRequestPanel: { padding: 15, gap: 0 },
  requestTap: { gap: 9 },
  adminRequestTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  adminRequester: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  requestTime: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  requestTitle: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  metaChipText: { fontSize: 9, fontFamily: 'Inter_500Medium' },
  priorityText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  expandIcon: { marginLeft: 'auto' },
  adminRequestDetail: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  fieldTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  adminComment: { borderWidth: 1, borderRadius: 13, padding: 10, gap: 5 },
  commentHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  commentName: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  noteToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  noteCheck: { width: 16, height: 16, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  replyInput: { flex: 1, minHeight: 41, maxHeight: 100, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, fontFamily: 'Inter_400Regular' },
  profilePanel: { gap: 5 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  preferencePanel: { gap: 11 },
  preferenceRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 11 },
  preferenceIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  preferenceCopy: { flex: 1, gap: 2 },
  switchTrack: { width: 42, height: 25, borderRadius: 14, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: '#FFFFFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
});