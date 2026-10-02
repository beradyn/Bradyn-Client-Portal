import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type DemoRole = 'client' | 'admin';
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

export interface DemoComment {
  id: string;
  sender: 'client' | 'admin';
  name: string;
  body: string;
  time: string;
  internal: boolean;
}

export interface DemoRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  comments: DemoComment[];
}

export interface DemoMessage {
  id: string;
  clientId: string;
  sender: 'client' | 'admin';
  name: string;
  body: string;
  time: string;
  read: boolean;
}

export interface DemoMilestone {
  id: string;
  title: string;
  complete: boolean;
}

export interface DemoProject {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: string;
  stage: string;
  progress: number;
  updatedAt: string;
  milestones: DemoMilestone[];
}

export interface DemoClient {
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
  subscriptionPrice: number;
  subscriptionStatus: string;
  nextBilling: string;
  status: string;
  lastActivity: string;
  projectId: string;
}

interface PortalData {
  clients: DemoClient[];
  projects: DemoProject[];
  requests: DemoRequest[];
  messages: DemoMessage[];
}

const DEMO_STORAGE_KEY = 'bradyn-demo-portal-v1';
export const DEMO_CREDENTIALS = {
  client: { email: 'client@bradyn.demo', password: 'bradyn2026' },
  admin: { email: 'admin@bradyn.demo', password: 'bradyn2026' },
};

const seededData: PortalData = {
  clients: [
    {
      id: 'northstar',
      name: 'Alex Rivera',
      business: 'Northstar Coffee Co.',
      email: 'alex@northstar.demo',
      phone: '(415) 555-0182',
      websiteName: 'Northstar Coffee',
      websiteUrl: 'northstarcoffee.co',
      previewUrl: 'preview.northstar.demo',
      websiteStatus: 'Live',
      subscriptionName: 'Growth Care',
      subscriptionPrice: 249,
      subscriptionStatus: 'Active',
      nextBilling: 'Oct 24, 2026',
      status: 'Active',
      lastActivity: '12 min ago',
      projectId: 'project-northstar',
    },
    {
      id: 'atelier',
      name: 'Jordan Blake',
      business: 'Atelier Form',
      email: 'jordan@atelier.demo',
      phone: '(212) 555-0146',
      websiteName: 'Atelier Form',
      websiteUrl: 'atelierform.demo',
      previewUrl: 'preview.atelier.demo',
      websiteStatus: 'Review',
      subscriptionName: 'Studio Plus',
      subscriptionPrice: 399,
      subscriptionStatus: 'Active',
      nextBilling: 'Oct 28, 2026',
      status: 'Active',
      lastActivity: '1 hour ago',
      projectId: 'project-atelier',
    },
    {
      id: 'fieldwork',
      name: 'Sam Okafor',
      business: 'Fieldwork Supply',
      email: 'sam@fieldwork.demo',
      phone: '(503) 555-0191',
      websiteName: 'Fieldwork Supply',
      websiteUrl: 'fieldworksupply.demo',
      previewUrl: 'preview.fieldwork.demo',
      websiteStatus: 'Building',
      subscriptionName: 'Launch',
      subscriptionPrice: 149,
      subscriptionStatus: 'Active',
      nextBilling: 'Nov 02, 2026',
      status: 'Onboarding',
      lastActivity: 'Yesterday',
      projectId: 'project-fieldwork',
    },
  ],
  projects: [
    {
      id: 'project-northstar',
      clientId: 'northstar',
      name: 'Northstar site refresh',
      description:
        'A sharper digital storefront for a neighborhood coffee favorite.',
      status: 'Development',
      stage: 'Development',
      progress: 68,
      updatedAt: 'Updated today',
      milestones: [
        { id: 'ns-1', title: 'Discovery & direction', complete: true },
        { id: 'ns-2', title: 'Visual design', complete: true },
        { id: 'ns-3', title: 'Website development', complete: false },
        { id: 'ns-4', title: 'Final review', complete: false },
        { id: 'ns-5', title: 'Launch', complete: false },
      ],
    },
    {
      id: 'project-atelier',
      clientId: 'atelier',
      name: 'Atelier Form digital studio',
      description:
        'A considered portfolio site for an independent interior studio.',
      status: 'Review',
      stage: 'Review',
      progress: 88,
      updatedAt: 'Updated yesterday',
      milestones: [
        { id: 'af-1', title: 'Planning', complete: true },
        { id: 'af-2', title: 'Design system', complete: true },
        { id: 'af-3', title: 'Build', complete: true },
        { id: 'af-4', title: 'Client review', complete: false },
        { id: 'af-5', title: 'Launch', complete: false },
      ],
    },
    {
      id: 'project-fieldwork',
      clientId: 'fieldwork',
      name: 'Fieldwork online shop',
      description:
        "A practical, product-first home for Fieldwork's everyday essentials.",
      status: 'Design',
      stage: 'Design',
      progress: 36,
      updatedAt: 'Updated Sep 30',
      milestones: [
        { id: 'fw-1', title: 'Kickoff & planning', complete: true },
        { id: 'fw-2', title: 'Art direction', complete: false },
        { id: 'fw-3', title: 'Development', complete: false },
        { id: 'fw-4', title: 'Review', complete: false },
        { id: 'fw-5', title: 'Launch', complete: false },
      ],
    },
  ],
  requests: [
    {
      id: 'req-1042',
      clientId: 'northstar',
      title: 'Update the autumn menu',
      description:
        'Swap the seasonal drinks section to the new autumn menu and add the spiced maple latte.',
      type: 'Content Update',
      priority: 'Normal',
      status: 'In Progress',
      createdAt: 'Today, 10:42 AM',
      comments: [
        {
          id: 'com-1',
          sender: 'admin',
          name: 'Taylor · Bradyn',
          body: 'Got it — the new menu is being added now.',
          time: 'Today, 11:16 AM',
          internal: false,
        },
        {
          id: 'com-2',
          sender: 'admin',
          name: 'Internal note',
          body: 'Client provided updated product photography.',
          time: 'Today, 11:18 AM',
          internal: true,
        },
      ],
    },
    {
      id: 'req-1037',
      clientId: 'northstar',
      title: 'Mobile navigation spacing',
      description:
        'The menu links feel a little tight on smaller screens.',
      type: 'Website Change',
      priority: 'High',
      status: 'Waiting for Client',
      createdAt: 'Yesterday',
      comments: [
        {
          id: 'com-3',
          sender: 'admin',
          name: 'Taylor · Bradyn',
          body: 'We can adjust this. Could you share which phone you noticed it on?',
          time: 'Yesterday, 3:20 PM',
          internal: false,
        },
      ],
    },
    {
      id: 'req-1028',
      clientId: 'northstar',
      title: 'Add cafe opening hours',
      description:
        'Add our weekend hours to the location details and footer.',
      type: 'Content Update',
      priority: 'Low',
      status: 'Completed',
      createdAt: 'Sep 26',
      comments: [],
    },
    {
      id: 'req-1045',
      clientId: 'atelier',
      title: 'Replace portfolio image',
      description: 'Use the latest studio photography for the featured work.',
      type: 'Website Change',
      priority: 'Normal',
      status: 'Submitted',
      createdAt: 'Today, 9:08 AM',
      comments: [],
    },
    {
      id: 'req-1041',
      clientId: 'fieldwork',
      title: 'Add a new collection page',
      description: 'A place to feature our new field-notes collection.',
      type: 'New Feature',
      priority: 'Normal',
      status: 'In Progress',
      createdAt: 'Today, 8:50 AM',
      comments: [],
    },
  ],
  messages: [
    {
      id: 'msg-1',
      clientId: 'northstar',
      sender: 'admin',
      name: 'Taylor · Bradyn',
      body: 'Hey Alex — the updated homepage is ready for a first look.',
      time: '10:12 AM',
      read: true,
    },
    {
      id: 'msg-2',
      clientId: 'northstar',
      sender: 'client',
      name: 'Alex Rivera',
      body: 'The new direction feels great. I left a couple of notes on the menu.',
      time: '10:34 AM',
      read: true,
    },
    {
      id: 'msg-3',
      clientId: 'northstar',
      sender: 'admin',
      name: 'Taylor · Bradyn',
      body: 'Perfect, thanks. We’re folding those into the next build.',
      time: '10:39 AM',
      read: true,
    },
    {
      id: 'msg-4',
      clientId: 'atelier',
      sender: 'client',
      name: 'Jordan Blake',
      body: 'Could we move the portfolio review to Thursday?',
      time: '9:42 AM',
      read: false,
    },
    {
      id: 'msg-5',
      clientId: 'fieldwork',
      sender: 'client',
      name: 'Sam Okafor',
      body: 'I uploaded the new product shots for the landing page.',
      time: 'Yesterday',
      read: false,
    },
  ],
};

interface DemoContextValue {
  role: DemoRole | null;
  data: PortalData;
  signIn: (role: DemoRole, email: string, password: string) => boolean;
  signOut: () => void;
  addRequest: (
    title: string,
    description: string,
    type: RequestType,
    priority: RequestPriority,
    clientId?: string,
  ) => void;
  updateRequest: (id: string, patch: Partial<DemoRequest>) => void;
  addComment: (
    requestId: string,
    body: string,
    role: DemoRole,
    internal?: boolean,
  ) => void;
  sendMessage: (body: string, role: DemoRole, clientId?: string) => void;
  markMessagesRead: (clientId: string) => void;
  updateProject: (id: string, patch: Partial<DemoProject>) => void;
  addProject: (name: string, clientId: string, description: string) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, title: string) => void;
  addClient: (
    name: string,
    business: string,
    email: string,
    phone: string,
  ) => void;
  updateClient: (id: string, patch: Partial<DemoClient>) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<DemoRole | null>(null);
  const [data, setData] = useState<PortalData>(seededData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(DEMO_STORAGE_KEY)
      .then((saved) => {
        if (!mounted) return;
        if (saved) {
          try {
            setData(JSON.parse(saved) as PortalData);
          } catch {
            setData(seededData);
          }
        }
        setHydrated(true);
      })
      .catch(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data)).catch(() => {
        // This prototype remains usable if device storage is unavailable.
      });
    }
  }, [data, hydrated]);

  const signIn = useCallback(
    (requestedRole: DemoRole, email: string, password: string) => {
      const credentials = DEMO_CREDENTIALS[requestedRole];
      const valid =
        email.trim().toLowerCase() === credentials.email &&
        password === credentials.password;
      if (valid) setRole(requestedRole);
      return valid;
    },
    [],
  );

  const signOut = useCallback(() => setRole(null), []);

  const addRequest = useCallback(
    (
      title: string,
      description: string,
      type: RequestType,
      priority: RequestPriority,
      clientId = 'northstar',
    ) => {
      const now = new Date();
      const createdAt = `Today, ${now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
      setData((previous) => ({
        ...previous,
        requests: [
          {
            id: `req-${Date.now()}`,
            clientId,
            title,
            description,
            type,
            priority,
            status: 'Submitted',
            createdAt,
            comments: [],
          },
          ...previous.requests,
        ],
      }));
    },
    [],
  );

  const updateRequest = useCallback(
    (id: string, patch: Partial<DemoRequest>) => {
      setData((previous) => ({
        ...previous,
        requests: previous.requests.map((request) =>
          request.id === id ? { ...request, ...patch } : request,
        ),
      }));
    },
    [],
  );

  const addComment = useCallback(
    (requestId: string, body: string, sender: DemoRole, internal = false) => {
      const activeUser =
        sender === 'admin' ? 'Taylor · Bradyn' : 'Alex Rivera';
      const comment: DemoComment = {
        id: `com-${Date.now()}`,
        sender,
        name: internal && sender === 'admin' ? 'Internal note' : activeUser,
        body,
        internal,
        time: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      setData((previous) => ({
        ...previous,
        requests: previous.requests.map((request) =>
          request.id === requestId
            ? { ...request, comments: [...request.comments, comment] }
            : request,
        ),
      }));
    },
    [],
  );

  const sendMessage = useCallback(
    (body: string, sender: DemoRole, clientId = 'northstar') => {
      const message: DemoMessage = {
        id: `msg-${Date.now()}`,
        clientId,
        sender,
        name: sender === 'admin' ? 'Taylor · Bradyn' : 'Alex Rivera',
        body,
        time: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
        read: sender === 'client',
      };
      setData((previous) => ({
        ...previous,
        messages: [...previous.messages, message],
      }));
    },
    [],
  );

  const markMessagesRead = useCallback((clientId: string) => {
    setData((previous) => ({
      ...previous,
      messages: previous.messages.map((message) =>
        message.clientId === clientId ? { ...message, read: true } : message,
      ),
    }));
  }, []);

  const updateProject = useCallback(
    (id: string, patch: Partial<DemoProject>) => {
      setData((previous) => ({
        ...previous,
        projects: previous.projects.map((project) =>
          project.id === id ? { ...project, ...patch } : project,
        ),
      }));
    },
    [],
  );

  const addProject = useCallback(
    (name: string, clientId: string, description: string) => {
      const id = `project-${Date.now()}`;
      const project: DemoProject = {
        id,
        clientId,
        name,
        description,
        status: 'Planning',
        stage: 'Planning',
        progress: 0,
        updatedAt: 'Just created',
        milestones: [
          { id: `${id}-1`, title: 'Planning', complete: false },
          { id: `${id}-2`, title: 'Design', complete: false },
          { id: `${id}-3`, title: 'Development', complete: false },
          { id: `${id}-4`, title: 'Review', complete: false },
          { id: `${id}-5`, title: 'Launch', complete: false },
        ],
      };
      setData((previous) => ({
        ...previous,
        projects: [project, ...previous.projects],
        clients: previous.clients.map((client) =>
          client.id === clientId ? { ...client, projectId: id } : client,
        ),
      }));
    },
    [],
  );

  const deleteProject = useCallback((id: string) => {
    setData((previous) => ({
      ...previous,
      projects: previous.projects.filter((project) => project.id !== id),
      clients: previous.clients.map((client) =>
        client.projectId === id ? { ...client, projectId: '' } : client,
      ),
    }));
  }, []);

  const toggleMilestone = useCallback(
    (projectId: string, milestoneId: string) => {
      setData((previous) => ({
        ...previous,
        projects: previous.projects.map((project) => {
          if (project.id !== projectId) return project;
          const milestones = project.milestones.map((milestone) =>
            milestone.id === milestoneId
              ? { ...milestone, complete: !milestone.complete }
              : milestone,
          );
          const complete = milestones.filter((item) => item.complete).length;
          return {
            ...project,
            milestones,
            progress: Math.round((complete / Math.max(milestones.length, 1)) * 100),
            updatedAt: 'Updated just now',
          };
        }),
      }));
    },
    [],
  );

  const addMilestone = useCallback((projectId: string, title: string) => {
    setData((previous) => ({
      ...previous,
      projects: previous.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              milestones: [
                ...project.milestones,
                { id: `milestone-${Date.now()}`, title, complete: false },
              ],
            }
          : project,
      ),
    }));
  }, []);

  const addClient = useCallback(
    (name: string, business: string, email: string, phone: string) => {
      const id = `client-${Date.now()}`;
      const projectId = `project-${id}`;
      const client: DemoClient = {
        id,
        name,
        business,
        email,
        phone,
        websiteName: business,
        websiteUrl: `${business.toLowerCase().replace(/[^a-z0-9]+/g, '')}.demo`,
        previewUrl: `preview.${business
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '')}.demo`,
        websiteStatus: 'Building',
        subscriptionName: 'Launch',
        subscriptionPrice: 149,
        subscriptionStatus: 'Active',
        nextBilling: 'Nov 01, 2026',
        status: 'Onboarding',
        lastActivity: 'Just now',
        projectId,
      };
      const project: DemoProject = {
        id: projectId,
        clientId: id,
        name: `${business} website`,
        description: `A new digital presence for ${business}.`,
        status: 'Planning',
        stage: 'Planning',
        progress: 0,
        updatedAt: 'Just created',
        milestones: [
          { id: `${projectId}-1`, title: 'Planning', complete: false },
          { id: `${projectId}-2`, title: 'Design', complete: false },
          { id: `${projectId}-3`, title: 'Development', complete: false },
          { id: `${projectId}-4`, title: 'Review', complete: false },
          { id: `${projectId}-5`, title: 'Launch', complete: false },
        ],
      };
      setData((previous) => ({
        ...previous,
        clients: [client, ...previous.clients],
        projects: [project, ...previous.projects],
      }));
    },
    [],
  );

  const updateClient = useCallback(
    (id: string, patch: Partial<DemoClient>) => {
      setData((previous) => ({
        ...previous,
        clients: previous.clients.map((client) =>
          client.id === id ? { ...client, ...patch } : client,
        ),
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      role,
      data,
      signIn,
      signOut,
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
    }),
    [
      role,
      data,
      signIn,
      signOut,
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
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error('useDemo must be used within DemoProvider.');
  }
  return value;
}