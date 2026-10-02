import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type PortalRole = 'client' | 'admin';
export type RequestStatus =
  | 'Submitted'
  | 'In Progress'
  | 'Waiting for Client'
  | 'Completed';
export type RequestPriority = 'Low' | 'Normal' | 'High';
export type RequestType =
  | 'Website Change'
  | 'Content Update'
  | 'Bug'
  | 'New Feature'
  | 'Domain'
  | 'Hosting'
  | 'Other';

export interface PortalComment {
  id: string;
  sender: PortalRole;
  name: string;
  body: string;
  time: string;
  internal: boolean;
}

export interface PortalRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  comments: PortalComment[];
}

export interface PortalMessage {
  id: string;
  clientId: string;
  sender: PortalRole;
  name: string;
  body: string;
  time: string;
  read: boolean;
}

export interface PortalMilestone {
  id: string;
  title: string;
  complete: boolean;
}

export interface PortalProject {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: string;
  stage: string;
  progress: number;
  updatedAt: string;
  milestones: PortalMilestone[];
}

export interface PortalClient {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  websiteName: string;
  websiteUrl: string;
  previewUrl: string;
  websiteStatus: 'Building' | 'Review' | 'Live' | 'Offline';
  subscriptionName: string;
  subscriptionPrice: number | null;
  subscriptionStatus: string;
  nextBilling: string;
  status: string;
  lastActivity: string;
  projectId: string;
}

export interface PortalProfile {
  id: string;
  email: string;
  fullName: string;
  role: PortalRole;
  clientId: string | null;
}

interface PortalData {
  clients: PortalClient[];
  projects: PortalProject[];
  requests: PortalRequest[];
  messages: PortalMessage[];
}

interface PortalContextValue {
  role: PortalRole | null;
  profile: PortalProfile | null;
  user: User | null;
  currentClientId: string | null;
  data: PortalData;
  initialized: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<PortalRole>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  addRequest: (
    title: string,
    description: string,
    type: RequestType,
    priority: RequestPriority,
    clientId?: string,
  ) => Promise<void>;
  updateRequest: (id: string, patch: Partial<PortalRequest>) => Promise<void>;
  addComment: (
    requestId: string,
    body: string,
    sender?: PortalRole,
    internal?: boolean,
  ) => Promise<void>;
  sendMessage: (
    body: string,
    sender?: PortalRole,
    clientId?: string,
  ) => Promise<void>;
  markMessagesRead: (clientId?: string) => Promise<void>;
  updateProject: (id: string, patch: Partial<PortalProject>) => Promise<void>;
  addProject: (
    name: string,
    clientId: string,
    description: string,
  ) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  addMilestone: (projectId: string, title: string) => Promise<void>;
  addClient: (
    name: string,
    business: string,
    email: string,
    phone: string,
  ) => Promise<void>;
  updateClient: (id: string, patch: Partial<PortalClient>) => Promise<void>;
}

const emptyData: PortalData = {
  clients: [],
  projects: [],
  requests: [],
  messages: [],
};

const PortalContext = createContext<PortalContextValue | null>(null);

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function shortDate(value: unknown) {
  if (typeof value !== 'string' || !value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeDate(value: unknown) {
  if (typeof value !== 'string' || !value) return 'No recent activity';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent activity';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return shortDate(value);
}

function clockTime(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function mapMilestones(value: unknown): PortalMilestone[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const milestone = item as Record<string, unknown>;
    return [{
      id: asString(milestone.id, `milestone-${index + 1}`),
      title: asString(milestone.title, 'Milestone'),
      complete: milestone.complete === true,
    }];
  });
}

function mapClient(row: DbRow, projects: PortalProject[]): PortalClient {
  const project = projects.find((item) => item.clientId === asString(row.id));
  return {
    id: asString(row.id),
    name: asString(row.name, 'Client'),
    business: asString(row.business, 'Business'),
    email: asString(row.email),
    phone: asString(row.phone),
    websiteName: asString(row.website_name, asString(row.business)),
    websiteUrl: asString(row.website_url),
    previewUrl: asString(row.preview_url),
    websiteStatus: asString(row.website_status, 'Building') as PortalClient['websiteStatus'],
    subscriptionName: asString(row.subscription_name, 'Not configured'),
    subscriptionPrice: asNumber(row.subscription_price),
    subscriptionStatus: asString(row.subscription_status, 'Not configured'),
    nextBilling: shortDate(row.next_billing_date),
    status: asString(row.status, 'Onboarding'),
    lastActivity: relativeDate(row.last_activity_at),
    projectId: project?.id ?? '',
  };
}

async function readPortalData(role: PortalRole): Promise<PortalData> {
  const [clientsResult, projectsResult, requestsResult, commentsResult, messagesResult] =
    await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      supabase.from('request_comments').select('*').order('created_at', { ascending: true }),
      supabase.from('messages').select('*').order('created_at', { ascending: true }),
    ]);

  for (const result of [
    clientsResult,
    projectsResult,
    requestsResult,
    commentsResult,
    messagesResult,
  ]) {
    if (result.error) throw result.error;
  }

  const projects = (projectsResult.data ?? []).map((row) => {
    const milestones = mapMilestones(row.milestones);
    const complete = milestones.filter((item) => item.complete).length;
    return {
      id: asString(row.id),
      clientId: asString(row.client_id),
      name: asString(row.name, 'Project'),
      description: asString(row.description),
      status: asString(row.status, 'Planning'),
      stage: asString(row.stage, 'Planning'),
      progress: milestones.length
        ? Math.round((complete / milestones.length) * 100)
        : 0,
      updatedAt: relativeDate(row.updated_at),
      milestones,
    };
  });

  const clients = (clientsResult.data ?? []).map((row) => mapClient(row, projects));
  const commentsByRequest = new Map<string, PortalComment[]>();
  for (const row of commentsResult.data ?? []) {
    const requestId = asString(row.request_id);
    const items = commentsByRequest.get(requestId) ?? [];
    const internal = row.internal === true;
    items.push({
      id: asString(row.id),
      sender: asString(row.author_role, 'client') as PortalRole,
      name: internal ? 'Internal note' : asString(row.author_name, 'Account user'),
      body: asString(row.body),
      time: clockTime(row.created_at),
      internal,
    });
    commentsByRequest.set(requestId, items);
  }

  const requests = (requestsResult.data ?? []).map((row) => ({
    id: asString(row.id),
    clientId: asString(row.client_id),
    title: asString(row.title),
    description: asString(row.description),
    type: asString(row.type, 'Other') as RequestType,
    priority: asString(row.priority, 'Normal') as RequestPriority,
    status: asString(row.status, 'Submitted') as RequestStatus,
    createdAt: relativeDate(row.created_at),
    comments: commentsByRequest.get(asString(row.id)) ?? [],
  }));

  const messages = (messagesResult.data ?? []).map((row) => {
    const sender = asString(row.author_role, 'client') as PortalRole;
    return {
      id: asString(row.id),
      clientId: asString(row.client_id),
      sender,
      name: asString(row.author_name, 'Account user'),
      body: asString(row.body),
      time: clockTime(row.created_at),
      read: role === 'admin'
        ? row.read_by_client === true
        : row.read_by_admin === true,
    };
  });

  return { clients, projects, requests, messages };
}

function profileFromRow(row: DbRow): PortalProfile {
  return {
    id: asString(row.id),
    email: asString(row.email),
    fullName: asString(row.full_name, 'Bradyn user'),
    role: asString(row.role, 'client') as PortalRole,
    clientId: typeof row.client_id === 'string' ? row.client_id : null,
  };
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Please try again. If the issue continues, contact a Bradyn administrator.';
}

export function PortalProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<PortalRole | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<PortalData>(emptyData);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const operationId = useRef(0);

  const loadSignedInUser = useCallback(async (authUser: User) => {
    const currentOperation = ++operationId.current;
    setUser(authUser);
    setInitialized(false);
    setAuthError(null);
    try {
      const { data: profileRow, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,role,client_id')
        .eq('id', authUser.id)
        .maybeSingle();
      if (error) throw error;
      if (!profileRow) {
        throw new Error(
          'Your account does not have a Bradyn profile yet. Ask a Bradyn administrator to provision it.',
        );
      }
      const nextProfile = profileFromRow(profileRow);
      if (nextProfile.role !== 'client' && nextProfile.role !== 'admin') {
        throw new Error('Your Bradyn account has an invalid access role.');
      }
      const nextData = await readPortalData(nextProfile.role);
      if (currentOperation !== operationId.current) return;
      setProfile(nextProfile);
      setRole(nextProfile.role);
      setData(nextData);
    } catch (error) {
      if (currentOperation !== operationId.current) return;
      setProfile(null);
      setRole(null);
      setData(emptyData);
      setAuthError(errorMessage(error));
    } finally {
      if (currentOperation === operationId.current) setInitialized(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        operationId.current += 1;
        setUser(null);
        setProfile(null);
        setRole(null);
        setData(emptyData);
        setAuthError(null);
        setInitialized(true);
        return;
      }
      setUser(session.user);
      setTimeout(() => {
        if (active) void loadSignedInUser(session.user);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!active) return;
      if (error) {
        setAuthError(error.message);
        setInitialized(true);
      } else if (sessionData.session?.user) {
        void loadSignedInUser(sessionData.session.user);
      } else {
        setInitialized(true);
      }
    });

    return () => {
      active = false;
      operationId.current += 1;
      authListener.subscription.unsubscribe();
    };
  }, [loadSignedInUser]);

  const refreshData = useCallback(async () => {
    if (!user || !role) return;
    try {
      setData(await readPortalData(role));
    } catch (error) {
      const message = errorMessage(error);
      setAuthError(message);
      Alert.alert('Could not refresh Bradyn data', message);
    }
  }, [role, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (!authData.user) throw new Error('Supabase did not return a signed-in user.');
    await loadSignedInUser(authData.user);
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,full_name,role,client_id')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profileRow) {
      await supabase.auth.signOut();
      throw new Error(
        'This account is not provisioned for Bradyn yet. Ask a Bradyn administrator to set it up.',
      );
    }
    const nextProfile = profileFromRow(profileRow);
    if (nextProfile.role !== 'client' && nextProfile.role !== 'admin') {
      throw new Error('This account has an invalid Bradyn access role.');
    }
    return nextProfile.role;
  }, [loadSignedInUser]);

  const signOut = useCallback(async () => {
    setUser(null);
    setProfile(null);
    setRole(null);
    setData(emptyData);
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  }, []);

  const runMutation = useCallback(async (
    operation: () => Promise<{ error: { message: string } | null }>,
  ) => {
    try {
      const result = await operation();
      if (result.error) throw result.error;
      await refreshData();
    } catch (error) {
      Alert.alert('Could not save changes', errorMessage(error));
    }
  }, [refreshData]);

  const addRequest = useCallback((
    title: string,
    description: string,
    type: RequestType,
    priority: RequestPriority,
    requestedClientId?: string,
  ) => runMutation(async () => {
    const clientId = role === 'client'
      ? profile?.clientId
      : requestedClientId ?? profile?.clientId;
    if (!clientId) throw new Error('This account is not linked to a client record.');
    return supabase.from('requests').insert({
      client_id: clientId,
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
    });
  }), [profile?.clientId, role, runMutation]);

  const updateRequest = useCallback((
    id: string,
    patch: Partial<PortalRequest>,
  ) => runMutation(async () => {
    const allowed: DbRow = {};
    if (patch.title !== undefined) allowed.title = patch.title;
    if (patch.description !== undefined) allowed.description = patch.description;
    if (patch.type !== undefined) allowed.type = patch.type;
    if (patch.priority !== undefined) allowed.priority = patch.priority;
    if (patch.status !== undefined) allowed.status = patch.status;
    return supabase.from('requests').update(allowed).eq('id', id);
  }), [runMutation]);

  const addComment = useCallback((
    requestId: string,
    body: string,
    _requestedSender?: PortalRole,
    internal = false,
  ) => runMutation(async () => {
    if (!user || !role) throw new Error('Sign in before replying.');
    return supabase.from('request_comments').insert({
      request_id: requestId,
      author_id: user.id,
      body: body.trim(),
      internal: role === 'admin' && internal,
    });
  }), [role, runMutation, user]);

  const sendMessage = useCallback((
    body: string,
    _requestedSender?: PortalRole,
    requestedClientId?: string,
  ) => runMutation(async () => {
    if (!user || !role) throw new Error('Sign in before sending a message.');
    const clientId = role === 'client'
      ? profile?.clientId
      : requestedClientId ?? profile?.clientId;
    if (!clientId) throw new Error('This account is not linked to a client record.');
    return supabase.from('messages').insert({
      client_id: clientId,
      author_id: user.id,
      body: body.trim(),
    });
  }), [profile?.clientId, role, runMutation, user]);

  const markMessagesRead = useCallback((requestedClientId?: string) => (
    runMutation(async () => {
      if (!role || !profile?.clientId && role === 'client') {
        throw new Error('This account is not linked to a client record.');
      }
      const clientId = role === 'client'
        ? profile.clientId
        : requestedClientId;
      if (!clientId) return { error: null };
      const readField = role === 'client' ? 'read_by_client' : 'read_by_admin';
      return supabase
        .from('messages')
        .update({ [readField]: true })
        .eq('client_id', clientId)
        .eq(readField, false);
    })
  ), [profile, role, runMutation]);

  const updateProject = useCallback((
    id: string,
    patch: Partial<PortalProject>,
  ) => runMutation(async () => {
    const allowed: DbRow = {};
    if (patch.name !== undefined) allowed.name = patch.name;
    if (patch.description !== undefined) allowed.description = patch.description;
    if (patch.status !== undefined) allowed.status = patch.status;
    if (patch.stage !== undefined) allowed.stage = patch.stage;
    if (patch.milestones !== undefined) allowed.milestones = patch.milestones;
    return supabase.from('projects').update(allowed).eq('id', id);
  }), [runMutation]);

  const addProject = useCallback((
    name: string,
    clientId: string,
    description: string,
  ) => runMutation(async () => {
    const id = Date.now().toString(36);
    return supabase.from('projects').insert({
      client_id: clientId,
      name: name.trim(),
      description: description.trim(),
      status: 'Planning',
      stage: 'Planning',
      milestones: [
        { id: `${id}-1`, title: 'Planning', complete: false },
        { id: `${id}-2`, title: 'Design', complete: false },
        { id: `${id}-3`, title: 'Development', complete: false },
        { id: `${id}-4`, title: 'Review', complete: false },
        { id: `${id}-5`, title: 'Launch', complete: false },
      ],
    });
  }), [runMutation]);

  const deleteProject = useCallback((
    id: string,
  ) => runMutation(async () => supabase.from('projects').delete().eq('id', id)), [runMutation]);

  const toggleMilestone = useCallback(async (
    projectId: string,
    milestoneId: string,
  ) => {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return;
    await updateProject(projectId, {
      milestones: project.milestones.map((item) =>
        item.id === milestoneId ? { ...item, complete: !item.complete } : item,
      ),
    });
  }, [data.projects, updateProject]);

  const addMilestone = useCallback(async (
    projectId: string,
    title: string,
  ) => {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return;
    await updateProject(projectId, {
      milestones: [
        ...project.milestones,
        { id: Date.now().toString(36), title: title.trim(), complete: false },
      ],
    });
  }, [data.projects, updateProject]);

  const addClient = useCallback((
    name: string,
    business: string,
    email: string,
    phone: string,
  ) => runMutation(async () => {
    const { error } = await supabase.rpc('create_client_with_project', {
      client_name: name.trim(),
      client_business: business.trim(),
      client_email: email.trim().toLowerCase(),
      client_phone: phone.trim(),
    });
    return { error };
  }), [runMutation]);

  const updateClient = useCallback((
    id: string,
    patch: Partial<PortalClient>,
  ) => runMutation(async () => {
    const fields: Array<[keyof PortalClient, string]> = [
      ['name', 'name'],
      ['business', 'business'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['websiteName', 'website_name'],
      ['websiteUrl', 'website_url'],
      ['previewUrl', 'preview_url'],
      ['websiteStatus', 'website_status'],
      ['subscriptionName', 'subscription_name'],
      ['subscriptionPrice', 'subscription_price'],
      ['subscriptionStatus', 'subscription_status'],
      ['status', 'status'],
    ];
    const updates: DbRow = {};
    for (const [source, target] of fields) {
      if (patch[source] !== undefined) updates[target] = patch[source];
    }
    if (patch.nextBilling !== undefined) {
      updates.next_billing_date = patch.nextBilling === 'Not set'
        ? null
        : patch.nextBilling;
    }
    return supabase.from('clients').update(updates).eq('id', id);
  }), [runMutation]);

  const value = useMemo<PortalContextValue>(() => ({
    role,
    profile,
    user,
    currentClientId: profile?.clientId ?? null,
    data,
    initialized,
    authError,
    signIn,
    signOut,
    refreshData,
    addRequest,
    updateRequest,
    addComment,
    sendMessage,
    markMessagesRead,
    updateProject,
    addProject,
    deleteProject,
    toggleMilestone,
    addMilestone,
    addClient,
    updateClient,
  }), [
    role,
    profile,
    user,
    data,
    initialized,
    authError,
    signIn,
    signOut,
    refreshData,
    addRequest,
    updateRequest,
    addComment,
    sendMessage,
    markMessagesRead,
    updateProject,
    addProject,
    deleteProject,
    toggleMilestone,
    addMilestone,
    addClient,
    updateClient,
  ]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const value = useContext(PortalContext);
  if (!value) throw new Error('usePortal must be used within PortalProvider.');
  return value;
}