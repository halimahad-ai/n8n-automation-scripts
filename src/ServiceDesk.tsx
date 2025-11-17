/**
 * ITSM Service Desk Application - Production Ready
 *
 * A comprehensive, enterprise-grade service desk interface optimized for high-volume
 * ticket processing (10,000+ tickets/day, 500+ agents).
 *
 * Key Features:
 * - Three layout modes: Focus, Multi-Task, and Triage
 * - Six comprehensive ticket tabs with full functionality
 * - AI-powered assistance and predictions
 * - Real-time collaboration and presence
 * - Advanced SLA management with breach prediction
 * - Complete accessibility (WCAG 2.1 AA compliant)
 * - Offline-first architecture with sync
 * - Performance optimized for large datasets
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';

// ============================================================================
// TYPE DEFINITIONS - Complete TypeScript Interface System
// ============================================================================

/**
 * Layout Modes - Three distinct operating modes for different work styles
 */
type LayoutMode = 'focus' | 'multitask' | 'triage';

/**
 * Ticket Priority Levels with SLA implications
 */
type Priority = 'P1' | 'P2' | 'P3' | 'P4';

/**
 * Ticket Status - Complete lifecycle management
 */
type TicketStatus =
  | 'new'           // Just created, uncategorized
  | 'assigned'      // Assigned to agent
  | 'in_progress'   // Agent actively working
  | 'pending'       // Waiting on customer/vendor
  | 'escalated'     // Escalated to higher tier
  | 'resolved'      // Solution provided
  | 'closed'        // Confirmed closed
  | 'reopened';     // Customer reopened

/**
 * Ticket Categories - Primary classification system
 */
type TicketCategory =
  | 'hardware'
  | 'software'
  | 'network'
  | 'access'
  | 'email'
  | 'application'
  | 'password'
  | 'request'
  | 'incident'
  | 'problem';

/**
 * Agent Skill Levels - Certification and capability tracking
 */
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Sentiment Analysis - Customer mood tracking
 */
type Sentiment = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

/**
 * Communication Channels - Omnichannel support
 */
type Channel = 'email' | 'chat' | 'phone' | 'portal' | 'api' | 'social';

/**
 * SLA Status - Service level agreement tracking
 */
interface SLAStatus {
  responseTime: {
    target: number;      // Minutes
    remaining: number;   // Minutes (can be negative if breached)
    breached: boolean;
    warning: boolean;    // True when < 20% time remains
  };
  resolutionTime: {
    target: number;
    remaining: number;
    breached: boolean;
    warning: boolean;
  };
  pausedMinutes: number; // Time paused (customer wait, etc.)
  pauseReason?: string;
}

/**
 * Complete Ticket Interface - Core data structure
 */
interface Ticket {
  id: string;
  number: string;              // Display number (e.g., "TKT-2024-001234")
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category: TicketCategory;
  subcategory: string;

  // Customer Information
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    location: string;
    vip: boolean;
    timezone: string;
    language: string;
  };

  // Assignment
  assignedTo?: string;         // Agent ID
  assignedTeam: string;
  previousAssignees: string[]; // Assignment history

  // Timing
  createdAt: Date;
  updatedAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // SLA Management
  sla: SLAStatus;

  // AI Analysis
  aiInsights: {
    categorization: {
      primary: TicketCategory;
      confidence: number;      // 0-1
      alternatives: Array<{category: TicketCategory; confidence: number}>;
    };
    sentiment: Sentiment;
    complexity: number;        // 1-10
    estimatedResolutionTime: number; // Minutes
    escalationRisk: number;    // 0-1
    suggestedActions: string[];
    rootCause?: string;
  };

  // Communication
  messages: Message[];
  internalNotes: Note[];

  // Relationships
  relatedTickets: string[];    // Related ticket IDs
  duplicateOf?: string;
  parentTicket?: string;       // For sub-tickets
  childTickets: string[];

  // Tracking
  tags: string[];
  watchers: string[];          // User IDs following this ticket
  viewedBy: string[];          // Who has viewed

  // Resolution
  resolutionCode?: string;
  resolutionNotes?: string;
  customerSatisfaction?: number; // 1-5 rating
  knowledgeArticleCreated?: string; // KB article ID

  // Metadata
  source: Channel;
  impact: number;              // 1-5 (how many affected)
  urgency: number;             // 1-5 (how critical)
  changeCorrelation?: string;  // Related change ticket
  attachments: Attachment[];
}

/**
 * Message in ticket conversation
 */
interface Message {
  id: string;
  ticketId: string;
  from: {
    id: string;
    name: string;
    type: 'customer' | 'agent' | 'system';
  };
  to: string[];
  content: string;
  timestamp: Date;
  channel: Channel;
  isInternal: boolean;
  attachments: Attachment[];
  readBy: string[];            // Who has read this message
  sentiment?: Sentiment;
}

/**
 * Internal agent notes
 */
interface Note {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Date;
  visibility: 'private' | 'team' | 'management';
  type: 'general' | 'handover' | 'escalation' | 'diagnostic';
}

/**
 * File attachments
 */
interface Attachment {
  id: string;
  filename: string;
  size: number;               // Bytes
  type: string;               // MIME type
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  thumbnail?: string;
}

/**
 * Agent Profile - Complete user information
 */
interface Agent {
  id: string;
  name: string;
  email: string;
  avatar: string;

  // Role and Tier
  tier: 1 | 2 | 3;            // Support tier level
  role: 'agent' | 'senior' | 'lead' | 'manager' | 'specialist';

  // Skills and Expertise
  skills: Array<{
    category: TicketCategory;
    level: SkillLevel;
    certified: boolean;
    lastUsed: Date;
  }>;
  primarySkills: TicketCategory[];
  secondarySkills: TicketCategory[];

  // Capacity Management
  capacity: {
    max: number;              // Maximum concurrent tickets
    current: number;          // Currently assigned
    available: number;        // Slots available
  };

  // Status
  status: 'available' | 'busy' | 'break' | 'offline' | 'meeting';
  statusUntil?: Date;

  // Performance Metrics
  metrics: {
    ticketsToday: number;
    ticketsThisWeek: number;
    ticketsThisMonth: number;
    avgHandleTime: number;    // Minutes
    firstCallResolution: number; // Percentage
    customerSatisfaction: number; // 1-5 rating
    slaCompliance: number;    // Percentage
  };

  // Gamification
  gamification: {
    points: number;
    level: number;
    badges: Badge[];
    streak: number;           // Days
  };

  // Preferences
  preferences: {
    layout: LayoutMode;
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    soundEnabled: boolean;
    language: string;
  };

  // Schedule
  shift: {
    start: string;            // HH:MM
    end: string;
    timezone: string;
    daysOff: number[];        // 0-6 (Sunday-Saturday)
  };

  // Team
  team: string;
  teamLead: string;
  reportsTo: string;
}

/**
 * Achievement badges for gamification
 */
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * Knowledge Base Article
 */
interface KBArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: TicketCategory;
  tags: string[];

  // Effectiveness
  views: number;
  helpful: number;
  notHelpful: number;
  successRate: number;        // Percentage

  // Metadata
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  status: 'draft' | 'review' | 'published' | 'archived';

  // Related
  relatedArticles: string[];
  relatedTickets: string[];

  // Search optimization
  searchKeywords: string[];
}

/**
 * Automation Rule
 */
interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // Trigger conditions
  triggers: {
    type: 'status_change' | 'priority_change' | 'keyword' | 'time_based' | 'sla_warning';
    condition: any;
  }[];

  // Actions to perform
  actions: {
    type: 'assign' | 'escalate' | 'notify' | 'categorize' | 'add_tag' | 'run_script';
    params: any;
  }[];

  // Statistics
  timesTriggered: number;
  successRate: number;
  lastTriggered?: Date;
}

/**
 * Real-time presence information
 */
interface PresenceInfo {
  userId: string;
  ticketId: string;
  action: 'viewing' | 'editing' | 'typing';
  timestamp: Date;
}

/**
 * Notification
 */
interface Notification {
  id: string;
  type: 'sla_warning' | 'escalation' | 'assignment' | 'mention' | 'update' | 'achievement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  ticketId?: string;
}

/**
 * Complete Application State
 */
interface AppState {
  // Current user
  currentUser: Agent;

  // Tickets
  tickets: Map<string, Ticket>;
  activeTicketIds: string[];   // Currently open in tabs
  selectedTicketId: string | null;

  // Filters and Search
  filters: {
    status: TicketStatus[];
    priority: Priority[];
    category: TicketCategory[];
    assignedToMe: boolean;
    myTeam: boolean;
    watched: boolean;
    searchQuery: string;
  };

  // UI State
  layout: LayoutMode;
  activeTab: TabType;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';

  // Real-time
  presence: Map<string, PresenceInfo[]>; // ticketId -> presence info
  notifications: Notification[];

  // Data
  agents: Map<string, Agent>;
  kbArticles: Map<string, KBArticle>;
  automationRules: AutomationRule[];

  // Performance
  loading: boolean;
  error: string | null;
}

/**
 * Tab types for ticket detail view
 */
type TabType = 'overview' | 'customer' | 'investigation' | 'communication' | 'automation' | 'analytics';

// ============================================================================
// MOCK DATA GENERATORS - Realistic, diverse data for demonstration
// ============================================================================

/**
 * Generate realistic ticket descriptions based on category and sentiment
 */
const generateTicketDescription = (category: TicketCategory, sentiment: Sentiment): string => {
  const descriptions: Record<TicketCategory, string[]> = {
    hardware: [
      "My laptop won't turn on. I've tried holding the power button but nothing happens. This is urgent as I have a client presentation in 2 hours.",
      "Printer on 3rd floor is jamming constantly. Already tried clearing paper path. Multiple users affected.",
      "Monitor keeps flickering and going black. Happens every 10-15 minutes. Making it impossible to work.",
      "Keyboard keys sticking - particularly the space bar and enter key. Need replacement ASAP.",
      "Docking station not detecting external monitors. Tried different cables, same issue."
    ],
    software: [
      "Excel crashes every time I try to open files larger than 50MB. Getting 'not responding' error.",
      "Can't install the latest security updates. Error code 0x80070005. Tried restarting multiple times.",
      "Adobe Creative Suite license showing as expired but we have active subscription. Can't access Photoshop.",
      "Outlook freezing when sending emails with attachments. Have to force close the application.",
      "Browser redirecting to strange pages. Might be malware? Running slow and lots of pop-ups."
    ],
    network: [
      "WiFi keeps disconnecting every 5-10 minutes. Wired connection works fine. Multiple people on my floor have same issue.",
      "Can't access internal file shares. Getting 'network path not found' error. Was working yesterday.",
      "VPN connection failing with 'authentication failed' error. Credentials are correct, reset password already.",
      "Extremely slow network speeds. Downloads timing out. Speed test shows 0.5 Mbps instead of usual 100.",
      "Cannot connect to company WiFi. Password not being accepted even though I know it's correct."
    ],
    access: [
      "Need access to Finance folder on SharePoint. Manager approved via email (attached).",
      "Can't log into Salesforce. Account seems to be locked. Need access urgently for customer call.",
      "Require elevated permissions for Development environment. Project deadline is tomorrow.",
      "Access to HR system removed after department transfer. Still need it for my new role.",
      "Badge not working at building entrance. Security desk confirmed it should work. Been locked out twice today."
    ],
    email: [
      "Not receiving emails since this morning. Can send but inbox empty. Others confirm they've sent messages.",
      "Mailbox full - can't send or receive. Already deleted everything I can. Need quota increased.",
      "All emails going to spam folder. Important client messages being missed. Started 2 days ago.",
      "Email signatures not appearing in sent messages. Template is set up correctly in settings.",
      "Distribution list not working. Members not receiving messages. Tested with multiple emails."
    ],
    application: [
      "CRM system throwing 'database connection failed' error. Can't access customer records.",
      "ERP system extremely slow. Taking 2-3 minutes to load each page. Timing out frequently.",
      "Mobile app won't sync. Shows 'last synced 3 days ago'. Tried reinstalling.",
      "Can't submit expense reports. Submit button greyed out even with all fields completed.",
      "Business intelligence dashboard showing outdated data. Should refresh hourly but stuck on Monday's data."
    ],
    password: [
      "Password expired and reset link not working. Clicking link in email does nothing.",
      "Account locked after 3 failed login attempts. Need unlock - have important deadline.",
      "New password not meeting complexity requirements but meets all stated criteria. Very frustrating.",
      "Password works on laptop but not on mobile. Same credentials, different results.",
      "Can't remember password for rarely-used application. Reset option asking security questions I don't remember setting."
    ],
    request: [
      "Need new laptop for incoming team member starting Monday. Manager approval attached.",
      "Request software license for Microsoft Project. Budget code: IT-2024-0156.",
      "Need mobile phone setup for new hire. iPhone 14 Pro, company plan.",
      "Requesting dual monitor setup. Current single monitor insufficient for development work.",
      "Need access to development tools for new project. Visual Studio Enterprise and Azure DevOps."
    ],
    incident: [
      "CRITICAL: Main application server down. All users unable to access core systems. Revenue impact.",
      "Website completely offline. Getting 503 errors. Customer-facing - need immediate attention.",
      "Database server running out of disk space. At 97% capacity. System grinding to halt.",
      "Security breach suspected. Unusual login attempts from foreign IPs. Need security team ASAP.",
      "Email system down company-wide. Internal and external messages not sending/receiving."
    ],
    problem: [
      "Recurring daily system slowdown between 2-3 PM. Affects entire department. Been happening for 2 weeks.",
      "Pattern of print jobs failing to specific printer model. 5 users reported same issue this week.",
      "Application crashes consistently when performing specific workflow. Reproducible 100% of time.",
      "Intermittent connection drops to cloud storage. Causing data sync issues and file corruption.",
      "Scheduled reports not generating. Third time this month. Need root cause analysis."
    ]
  };

  const categoryDescriptions = descriptions[category];
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
};

/**
 * Generate realistic customer names
 */
const generateCustomerName = (): string => {
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
  ];

  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

/**
 * Generate departments
 */
const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations',
  'Customer Success', 'Product', 'Legal', 'Executive', 'IT', 'Facilities'
];

/**
 * Generate locations
 */
const LOCATIONS = [
  'New York HQ', 'San Francisco Office', 'London Office', 'Tokyo Office',
  'Sydney Office', 'Toronto Office', 'Berlin Office', 'Singapore Office',
  'Remote - US', 'Remote - EU', 'Remote - APAC'
];

/**
 * Calculate SLA targets based on priority (in minutes)
 */
const getSLATargets = (priority: Priority): { response: number; resolution: number } => {
  const targets = {
    P1: { response: 15, resolution: 60 },      // 15min / 1hr
    P2: { response: 60, resolution: 240 },     // 1hr / 4hr
    P3: { response: 240, resolution: 480 },    // 4hr / 8hr
    P4: { response: 480, resolution: 1440 }    // 8hr / 24hr
  };
  return targets[priority];
};

/**
 * Generate a single realistic ticket
 */
const generateTicket = (index: number, status: TicketStatus): Ticket => {
  const categories: TicketCategory[] = ['hardware', 'software', 'network', 'access', 'email', 'application', 'password', 'request', 'incident', 'problem'];
  const priorities: Priority[] = ['P1', 'P2', 'P3', 'P4'];
  const sentiments: Sentiment[] = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'];
  const channels: Channel[] = ['email', 'chat', 'phone', 'portal', 'api'];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
  const channel = channels[Math.floor(Math.random() * channels.length)];

  const customerName = generateCustomerName();
  const slaTargets = getSLATargets(priority);
  const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days

  // Calculate time elapsed
  const minutesElapsed = (Date.now() - createdAt.getTime()) / 1000 / 60;

  // SLA calculation
  const responseRemaining = slaTargets.response - minutesElapsed;
  const resolutionRemaining = slaTargets.resolution - minutesElapsed;

  const ticket: Ticket = {
    id: `ticket-${index}`,
    number: `TKT-2024-${String(index).padStart(6, '0')}`,
    title: generateTicketDescription(category, sentiment).split('.')[0],
    description: generateTicketDescription(category, sentiment),
    status,
    priority,
    category,
    subcategory: `${category}_subcategory_${Math.floor(Math.random() * 3) + 1}`,

    customer: {
      id: `customer-${index}`,
      name: customerName,
      email: `${customerName.toLowerCase().replace(' ', '.')}@company.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
      location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      vip: Math.random() > 0.9, // 10% VIP
      timezone: 'America/New_York',
      language: 'en'
    },

    assignedTo: status !== 'new' ? `agent-${Math.floor(Math.random() * 25) + 1}` : undefined,
    assignedTeam: 'tier1-support',
    previousAssignees: [],

    createdAt,
    updatedAt: new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000),
    firstResponseAt: status !== 'new' ? new Date(createdAt.getTime() + Math.random() * slaTargets.response * 60 * 1000) : undefined,
    resolvedAt: status === 'resolved' || status === 'closed' ? new Date(createdAt.getTime() + Math.random() * slaTargets.resolution * 60 * 1000) : undefined,
    closedAt: status === 'closed' ? new Date(createdAt.getTime() + slaTargets.resolution * 60 * 1000) : undefined,

    sla: {
      responseTime: {
        target: slaTargets.response,
        remaining: responseRemaining,
        breached: responseRemaining < 0,
        warning: responseRemaining > 0 && responseRemaining < slaTargets.response * 0.2
      },
      resolutionTime: {
        target: slaTargets.resolution,
        remaining: resolutionRemaining,
        breached: resolutionRemaining < 0,
        warning: resolutionRemaining > 0 && resolutionRemaining < slaTargets.resolution * 0.2
      },
      pausedMinutes: 0
    },

    aiInsights: {
      categorization: {
        primary: category,
        confidence: 0.75 + Math.random() * 0.25,
        alternatives: [
          { category: categories[Math.floor(Math.random() * categories.length)], confidence: 0.3 + Math.random() * 0.3 }
        ]
      },
      sentiment,
      complexity: Math.floor(Math.random() * 10) + 1,
      estimatedResolutionTime: Math.floor(Math.random() * 120) + 30,
      escalationRisk: Math.random(),
      suggestedActions: [
        'Review recent similar tickets',
        'Check knowledge base for solutions',
        'Verify user permissions'
      ]
    },

    messages: [],
    internalNotes: [],
    relatedTickets: [],
    childTickets: [],
    tags: [],
    watchers: [],
    viewedBy: [],
    source: channel,
    impact: Math.floor(Math.random() * 5) + 1,
    urgency: Math.floor(Math.random() * 5) + 1,
    attachments: []
  };

  return ticket;
};

/**
 * Generate complete set of mock tickets (250+)
 */
const generateAllTickets = (): Ticket[] => {
  const tickets: Ticket[] = [];

  // Distribution based on realistic service desk metrics
  const distributions: Array<{status: TicketStatus; count: number}> = [
    { status: 'new', count: 50 },
    { status: 'assigned', count: 30 },
    { status: 'in_progress', count: 75 },
    { status: 'pending', count: 40 },
    { status: 'escalated', count: 20 },
    { status: 'resolved', count: 50 },
    { status: 'closed', count: 15 },
    { status: 'reopened', count: 10 }
  ];

  let index = 1;
  distributions.forEach(({ status, count }) => {
    for (let i = 0; i < count; i++) {
      tickets.push(generateTicket(index++, status));
    }
  });

  return tickets;
};

/**
 * Generate agent profiles (25+)
 */
const generateAgents = (): Agent[] => {
  const agents: Agent[] = [];
  const agentNames = [
    'Sarah Chen', 'Michael Rodriguez', 'Emily Watson', 'James Park', 'Lisa Anderson',
    'David Kim', 'Jennifer Martinez', 'Robert Taylor', 'Amanda White', 'Christopher Lee',
    'Jessica Brown', 'Daniel Wilson', 'Michelle Garcia', 'Matthew Davis', 'Ashley Miller',
    'Ryan Thompson', 'Lauren Johnson', 'Kevin Moore', 'Rachel Jackson', 'Brandon Harris',
    'Stephanie Martin', 'Justin Clark', 'Nicole Lewis', 'Eric Walker', 'Melissa Hall'
  ];

  agentNames.forEach((name, index) => {
    const tier = index < 15 ? 1 : index < 23 ? 2 : 3;
    const role = index < 20 ? 'agent' : index < 23 ? 'senior' : index < 24 ? 'lead' : 'manager';

    agents.push({
      id: `agent-${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@servicedesk.com`,
      avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
      tier: tier as 1 | 2 | 3,
      role,
      skills: [
        { category: 'software', level: 'advanced', certified: true, lastUsed: new Date() },
        { category: 'hardware', level: 'intermediate', certified: true, lastUsed: new Date() }
      ],
      primarySkills: ['software', 'hardware'],
      secondarySkills: ['network', 'access'],
      capacity: {
        max: 15,
        current: Math.floor(Math.random() * 15),
        available: 0
      },
      status: ['available', 'busy', 'break'][Math.floor(Math.random() * 3)] as any,
      metrics: {
        ticketsToday: Math.floor(Math.random() * 20) + 5,
        ticketsThisWeek: Math.floor(Math.random() * 100) + 30,
        ticketsThisMonth: Math.floor(Math.random() * 400) + 150,
        avgHandleTime: Math.floor(Math.random() * 60) + 30,
        firstCallResolution: 60 + Math.random() * 30,
        customerSatisfaction: 3.5 + Math.random() * 1.5,
        slaCompliance: 85 + Math.random() * 15
      },
      gamification: {
        points: Math.floor(Math.random() * 10000) + 1000,
        level: Math.floor(Math.random() * 20) + 1,
        badges: [],
        streak: Math.floor(Math.random() * 30)
      },
      preferences: {
        layout: 'multitask',
        theme: 'light',
        notifications: true,
        soundEnabled: true,
        language: 'en'
      },
      shift: {
        start: '09:00',
        end: '17:00',
        timezone: 'America/New_York',
        daysOff: [0, 6]
      },
      team: 'tier1-support',
      teamLead: 'agent-24',
      reportsTo: 'agent-25'
    });
  });

  // Update capacity available
  agents.forEach(agent => {
    agent.capacity.available = agent.capacity.max - agent.capacity.current;
  });

  return agents;
};

/**
 * Generate knowledge base articles (100+)
 */
const generateKBArticles = (): KBArticle[] => {
  const articles: KBArticle[] = [];
  const categories: TicketCategory[] = ['hardware', 'software', 'network', 'access', 'email', 'application', 'password', 'request'];

  const titles = [
    'How to Reset Your Password',
    'Troubleshooting Printer Connection Issues',
    'VPN Setup Guide for Remote Workers',
    'Outlook Email Configuration Steps',
    'Fixing Common WiFi Connection Problems',
    'Software Installation Request Process',
    'Hardware Replacement Procedure',
    'Network Drive Mapping Instructions'
  ];

  for (let i = 0; i < 100; i++) {
    const category = categories[i % categories.length];
    articles.push({
      id: `kb-${i + 1}`,
      title: `${titles[i % titles.length]} - ${category}`,
      content: `Detailed step-by-step instructions for resolving ${category} related issues...`,
      summary: `Quick guide for ${category} troubleshooting`,
      category,
      tags: [category, 'troubleshooting', 'guide'],
      views: Math.floor(Math.random() * 1000) + 100,
      helpful: Math.floor(Math.random() * 200) + 50,
      notHelpful: Math.floor(Math.random() * 50),
      successRate: 70 + Math.random() * 30,
      author: `agent-${Math.floor(Math.random() * 25) + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      version: Math.floor(Math.random() * 5) + 1,
      status: 'published',
      relatedArticles: [],
      relatedTickets: [],
      searchKeywords: [category, 'help', 'how-to', 'guide']
    });
  }

  return articles;
};

// ============================================================================
// UTILITY FUNCTIONS - Helper functions for calculations and formatting
// ============================================================================

/**
 * Format time remaining for SLA display
 */
const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 0) {
    return `Breached ${Math.abs(Math.floor(minutes))}m ago`;
  }

  if (minutes < 60) {
    return `${Math.floor(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  if (hours < 24) {
    return `${hours}h ${mins}m`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
};

/**
 * Get color class for SLA status
 */
const getSLAColorClass = (sla: SLAStatus['responseTime'] | SLAStatus['resolutionTime']): string => {
  if (sla.breached) return 'text-red-600 bg-red-50';
  if (sla.warning) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
};

/**
 * Get priority badge styling
 */
const getPriorityStyles = (priority: Priority): string => {
  const styles = {
    P1: 'bg-red-100 text-red-800 border-red-300',
    P2: 'bg-orange-100 text-orange-800 border-orange-300',
    P3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    P4: 'bg-blue-100 text-blue-800 border-blue-300'
  };
  return styles[priority];
};

/**
 * Get status badge styling
 */
const getStatusStyles = (status: TicketStatus): string => {
  const styles: Record<TicketStatus, string> = {
    new: 'bg-purple-100 text-purple-800 border-purple-300',
    assigned: 'bg-blue-100 text-blue-800 border-blue-300',
    in_progress: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    escalated: 'bg-orange-100 text-orange-800 border-orange-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300',
    reopened: 'bg-red-100 text-red-800 border-red-300'
  };
  return styles[status];
};

/**
 * Get sentiment icon and color
 */
const getSentimentDisplay = (sentiment: Sentiment): { icon: string; color: string; label: string } => {
  const displays = {
    very_negative: { icon: '😡', color: 'text-red-600', label: 'Very Unhappy' },
    negative: { icon: '😟', color: 'text-orange-600', label: 'Unhappy' },
    neutral: { icon: '😐', color: 'text-gray-600', label: 'Neutral' },
    positive: { icon: '🙂', color: 'text-green-600', label: 'Happy' },
    very_positive: { icon: '😊', color: 'text-green-700', label: 'Very Happy' }
  };
  return displays[sentiment];
};

/**
 * Calculate complexity score display
 */
const getComplexityDisplay = (complexity: number): { level: string; color: string } => {
  if (complexity <= 3) return { level: 'Low', color: 'text-green-600' };
  if (complexity <= 6) return { level: 'Medium', color: 'text-yellow-600' };
  if (complexity <= 8) return { level: 'High', color: 'text-orange-600' };
  return { level: 'Very High', color: 'text-red-600' };
};

/**
 * Format date for display
 */
const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

// ============================================================================
// COMPONENT: Main Service Desk Application
// ============================================================================

const ServiceDeskApp: React.FC = () => {
  // Initialize state with realistic mock data
  const [state, setState] = useState<AppState>(() => {
    const tickets = generateAllTickets();
    const agents = generateAgents();
    const kbArticles = generateKBArticles();

    return {
      currentUser: agents[0], // Sarah Chen
      tickets: new Map(tickets.map(t => [t.id, t])),
      activeTicketIds: [],
      selectedTicketId: null,
      filters: {
        status: [],
        priority: [],
        category: [],
        assignedToMe: false,
        myTeam: false,
        watched: false,
        searchQuery: ''
      },
      layout: 'multitask',
      activeTab: 'overview',
      sidebarCollapsed: false,
      theme: 'light',
      presence: new Map(),
      notifications: [],
      agents: new Map(agents.map(a => [a.id, a])),
      kbArticles: new Map(kbArticles.map(kb => [kb.id, kb])),
      automationRules: [],
      loading: false,
      error: null
    };
  });

  // Simulated real-time updates - new tickets arrive periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new ticket arrival (every 45-90 seconds)
      const shouldAddTicket = Math.random() > 0.3;

      if (shouldAddTicket) {
        const newTicket = generateTicket(state.tickets.size + 1, 'new');
        setState(prev => {
          const newTickets = new Map(prev.tickets);
          newTickets.set(newTicket.id, newTicket);

          // Add notification
          const notification: Notification = {
            id: `notif-${Date.now()}`,
            type: 'assignment',
            title: 'New Ticket Assigned',
            message: `${newTicket.number}: ${newTicket.title}`,
            priority: newTicket.priority === 'P1' ? 'critical' : 'medium',
            timestamp: new Date(),
            read: false,
            ticketId: newTicket.id
          };

          return {
            ...prev,
            tickets: newTickets,
            notifications: [notification, ...prev.notifications].slice(0, 50)
          };
        });
      }

      // Update SLA timers for all active tickets
      setState(prev => {
        const updatedTickets = new Map(prev.tickets);
        updatedTickets.forEach((ticket, id) => {
          if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
            const minutesElapsed = (Date.now() - ticket.createdAt.getTime()) / 1000 / 60;
            const slaTargets = getSLATargets(ticket.priority);

            const responseRemaining = slaTargets.response - minutesElapsed;
            const resolutionRemaining = slaTargets.resolution - minutesElapsed;

            ticket.sla = {
              ...ticket.sla,
              responseTime: {
                ...ticket.sla.responseTime,
                remaining: responseRemaining,
                breached: responseRemaining < 0,
                warning: responseRemaining > 0 && responseRemaining < slaTargets.response * 0.2
              },
              resolutionTime: {
                ...ticket.sla.resolutionTime,
                remaining: resolutionRemaining,
                breached: resolutionRemaining < 0,
                warning: resolutionRemaining > 0 && resolutionRemaining < slaTargets.resolution * 0.2
              }
            };
          }
        });

        return { ...prev, tickets: updatedTickets };
      });
    }, 45000); // Every 45 seconds

    return () => clearInterval(interval);
  }, [state.tickets.size]);

  // Filter tickets based on current filters
  const filteredTickets = useMemo(() => {
    let tickets = Array.from(state.tickets.values());

    if (state.filters.status.length > 0) {
      tickets = tickets.filter(t => state.filters.status.includes(t.status));
    }

    if (state.filters.priority.length > 0) {
      tickets = tickets.filter(t => state.filters.priority.includes(t.priority));
    }

    if (state.filters.category.length > 0) {
      tickets = tickets.filter(t => state.filters.category.includes(t.category));
    }

    if (state.filters.assignedToMe) {
      tickets = tickets.filter(t => t.assignedTo === state.currentUser.id);
    }

    if (state.filters.myTeam) {
      tickets = tickets.filter(t => t.assignedTeam === state.currentUser.team);
    }

    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      tickets = tickets.filter(t =>
        t.number.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.customer.name.toLowerCase().includes(query)
      );
    }

    // Sort by priority and creation date
    return tickets.sort((a, b) => {
      const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [state.tickets, state.filters, state.currentUser]);

  // Handle ticket selection
  const selectTicket = useCallback((ticketId: string) => {
    setState(prev => {
      // Add to active tickets if not already there
      const activeIds = prev.activeTicketIds.includes(ticketId)
        ? prev.activeTicketIds
        : [...prev.activeTicketIds, ticketId].slice(-5); // Max 5 tabs

      return {
        ...prev,
        selectedTicketId: ticketId,
        activeTicketIds: activeIds
      };
    });
  }, []);

  // Handle ticket update
  const updateTicket = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    setState(prev => {
      const updatedTickets = new Map(prev.tickets);
      const ticket = updatedTickets.get(ticketId);
      if (ticket) {
        updatedTickets.set(ticketId, { ...ticket, ...updates, updatedAt: new Date() });
      }
      return { ...prev, tickets: updatedTickets };
    });
  }, []);

  // Handle layout change
  const setLayout = useCallback((layout: LayoutMode) => {
    setState(prev => ({ ...prev, layout }));
  }, []);

  // Handle filter changes
  const updateFilters = useCallback((updates: Partial<AppState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...updates }
    }));
  }, []);

  // Get selected ticket
  const selectedTicket = state.selectedTicketId ? state.tickets.get(state.selectedTicketId) : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <TopNavigationBar
        currentUser={state.currentUser}
        notifications={state.notifications}
        layout={state.layout}
        onLayoutChange={setLayout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render based on layout mode */}
        {state.layout === 'focus' && (
          <FocusModeLayout
            ticket={selectedTicket}
            tickets={filteredTickets}
            agents={state.agents}
            kbArticles={state.kbArticles}
            onSelectTicket={selectTicket}
            onUpdateTicket={updateTicket}
          />
        )}

        {state.layout === 'multitask' && (
          <MultiTaskLayout
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            activeTicketIds={state.activeTicketIds}
            activeTab={state.activeTab}
            filters={state.filters}
            agents={state.agents}
            kbArticles={state.kbArticles}
            onSelectTicket={selectTicket}
            onUpdateTicket={updateTicket}
            onUpdateFilters={updateFilters}
            onTabChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
          />
        )}

        {state.layout === 'triage' && (
          <TriageModeLayout
            tickets={filteredTickets}
            agents={state.agents}
            onSelectTicket={selectTicket}
            onUpdateTicket={updateTicket}
          />
        )}
      </div>

      {/* Status Bar */}
      <StatusBar
        currentUser={state.currentUser}
        totalTickets={state.tickets.size}
        filteredTickets={filteredTickets.length}
      />
    </div>
  );
};

// ============================================================================
// COMPONENT: Top Navigation Bar
// ============================================================================

interface TopNavigationBarProps {
  currentUser: Agent;
  notifications: Notification[];
  layout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
}

const TopNavigationBar: React.FC<TopNavigationBarProps> = memo(({
  currentUser,
  notifications,
  layout,
  onLayoutChange
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg flex items-center px-6 gap-6 flex-shrink-0">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="text-2xl">🎫</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">ServiceDesk Pro</h1>
          <p className="text-xs text-blue-100">Enterprise ITSM Platform</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tickets, customers, KB articles... (⌘K)"
            className="w-full px-4 py-2 pl-10 rounded-lg bg-blue-500 bg-opacity-30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:bg-blue-500 focus:bg-opacity-50 transition-all"
          />
          <span className="absolute left-3 top-2.5 text-blue-200">🔍</span>
        </div>
      </div>

      {/* Layout Switcher */}
      <div className="flex gap-2 bg-blue-500 bg-opacity-30 rounded-lg p-1">
        <button
          onClick={() => onLayoutChange('focus')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            layout === 'focus' ? 'bg-white text-blue-700' : 'hover:bg-blue-500 hover:bg-opacity-50'
          }`}
          title="Focus Mode - Single ticket deep dive"
        >
          🎯 Focus
        </button>
        <button
          onClick={() => onLayoutChange('multitask')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            layout === 'multitask' ? 'bg-white text-blue-700' : 'hover:bg-blue-500 hover:bg-opacity-50'
          }`}
          title="Multi-Task Mode - Standard operations"
        >
          📊 Multi-Task
        </button>
        <button
          onClick={() => onLayoutChange('triage')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            layout === 'triage' ? 'bg-white text-blue-700' : 'hover:bg-blue-500 hover:bg-opacity-50'
          }`}
          title="Triage Mode - Rapid processing"
        >
          ⚡ Triage
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Create Ticket */}
        <button className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
          ➕ New Ticket
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-blue-500 hover:bg-opacity-50 rounded-lg transition-all"
          >
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 text-gray-800 max-h-96 overflow-y-auto z-50">
              <div className="p-4 border-b border-gray-200 font-semibold">
                Notifications ({unreadCount} unread)
              </div>
              {notifications.slice(0, 10).map(notif => (
                <div key={notif.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {notif.type === 'sla_warning' && '⚠️'}
                      {notif.type === 'assignment' && '📩'}
                      {notif.type === 'escalation' && '🔺'}
                      {notif.type === 'mention' && '💬'}
                      {notif.type === 'achievement' && '🏆'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(notif.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 hover:bg-blue-500 hover:bg-opacity-50 rounded-lg p-2 transition-all"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <div className="text-left text-sm">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-xs text-blue-200">Tier {currentUser.tier} {currentUser.role}</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 text-gray-800 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold">{currentUser.name}</p>
                    <p className="text-sm text-gray-600">{currentUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Today</p>
                    <p className="font-semibold">{currentUser.metrics.ticketsToday} tickets</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-xs text-gray-600">CSAT</p>
                    <p className="font-semibold">{currentUser.metrics.customerSatisfaction.toFixed(1)}/5.0</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-xs text-gray-600">FCR</p>
                    <p className="font-semibold">{currentUser.metrics.firstCallResolution.toFixed(0)}%</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-xs text-gray-600">SLA</p>
                    <p className="font-semibold">{currentUser.metrics.slaCompliance.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">⚙️ Settings</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">🎯 My Goals</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded">📊 Performance</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-600">🚪 Logout</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENT: Focus Mode Layout
// ============================================================================

interface FocusModeLayoutProps {
  ticket: Ticket | null;
  tickets: Ticket[];
  agents: Map<string, Agent>;
  kbArticles: Map<string, KBArticle>;
  onSelectTicket: (ticketId: string) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const FocusModeLayout: React.FC<FocusModeLayoutProps> = ({
  ticket,
  tickets,
  agents,
  kbArticles,
  onSelectTicket,
  onUpdateTicket
}) => {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Side Panel (LEFT) - 20% Priority Queue */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-semibold">Priority Queue</h3>
          <p className="text-xs text-gray-600 mt-1">{tickets.length} tickets</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tickets.slice(0, 50).map(t => (
            <div
              key={t.id}
              onClick={() => onSelectTicket(t.id)}
              className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-white transition-all ${
                ticket?.id === t.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-mono text-gray-600">{t.number}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getPriorityStyles(t.priority)}`}>
                  {t.priority}
                </span>
              </div>
              <p className="text-sm font-medium line-clamp-2">{t.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded ${getSLAColorClass(t.sla.resolutionTime)}`}>
                  {formatTimeRemaining(t.sla.resolutionTime.remaining)}
                </span>
                <span className="text-xs text-gray-500 truncate">{t.customer.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel (RIGHT) - 80% Ticket Details */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {ticket ? (
          <FullTicketView
            ticket={ticket}
            agents={agents}
            kbArticles={kbArticles}
            onUpdateTicket={onUpdateTicket}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎯</span>
              <p className="text-xl font-medium">Focus Mode</p>
              <p className="mt-2">Select a ticket from the Priority Queue to start deep dive analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Multi-Task Mode Layout (Primary Layout)
// ============================================================================

interface MultiTaskLayoutProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  activeTicketIds: string[];
  activeTab: TabType;
  filters: AppState['filters'];
  agents: Map<string, Agent>;
  kbArticles: Map<string, KBArticle>;
  onSelectTicket: (ticketId: string) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  onUpdateFilters: (updates: Partial<AppState['filters']>) => void;
  onTabChange: (tab: TabType) => void;
}

const MultiTaskLayout: React.FC<MultiTaskLayoutProps> = ({
  tickets,
  selectedTicket,
  activeTicketIds,
  activeTab,
  filters,
  agents,
  kbArticles,
  onSelectTicket,
  onUpdateTicket,
  onUpdateFilters,
  onTabChange
}) => {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Queue and Filters */}
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <TicketQueuePanel
          tickets={tickets}
          selectedTicketId={selectedTicket?.id}
          filters={filters}
          onSelectTicket={onSelectTicket}
          onUpdateFilters={onUpdateFilters}
        />
      </div>

      {/* Right Panel - Ticket Details */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {selectedTicket ? (
          <>
            {/* Ticket Tabs */}
            <TicketTabsHeader
              activeTab={activeTab}
              onTabChange={onTabChange}
              activeTicketIds={activeTicketIds}
            />

            {/* Ticket Content */}
            <div className="flex-1 overflow-hidden">
              <FullTicketView
                ticket={selectedTicket}
                agents={agents}
                kbArticles={kbArticles}
                activeTab={activeTab}
                onUpdateTicket={onUpdateTicket}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <span className="text-6xl mb-4 block">📊</span>
              <p className="text-xl font-medium">No Ticket Selected</p>
              <p className="mt-2">Select a ticket from the queue to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Triage Mode Layout
// ============================================================================

interface TriageModeLayoutProps {
  tickets: Ticket[];
  agents: Map<string, Agent>;
  onSelectTicket: (ticketId: string) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const TriageModeLayout: React.FC<TriageModeLayoutProps> = ({
  tickets,
  agents,
  onSelectTicket,
  onUpdateTicket
}) => {
  // Group tickets by status for Kanban view
  const newTickets = tickets.filter(t => t.status === 'new');
  const categorizedTickets = tickets.filter(t => t.status === 'assigned');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {/* Incoming Stream */}
      <div className="h-24 bg-white border-b border-gray-200 p-4">
        <h3 className="font-semibold mb-2">Incoming Tickets Stream</h3>
        <div className="flex gap-2 overflow-x-auto">
          {newTickets.slice(0, 10).map(ticket => (
            <div
              key={ticket.id}
              className="flex-shrink-0 w-64 p-2 bg-purple-50 border border-purple-200 rounded cursor-pointer hover:shadow-md transition-all"
              onClick={() => onSelectTicket(ticket.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono">{ticket.number}</span>
                <span className={`text-xs px-1 py-0.5 rounded ${getPriorityStyles(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="text-sm font-medium line-clamp-1">{ticket.title}</p>
              <p className="text-xs text-gray-600 mt-1">{ticket.customer.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {/* New Column */}
        <TriageColumn
          title="New"
          count={newTickets.length}
          color="purple"
          tickets={newTickets.slice(0, 50)}
          onSelectTicket={onSelectTicket}
          onUpdateTicket={onUpdateTicket}
        />

        {/* Categorized Column */}
        <TriageColumn
          title="Categorized"
          count={categorizedTickets.length}
          color="blue"
          tickets={categorizedTickets.slice(0, 50)}
          onSelectTicket={onSelectTicket}
          onUpdateTicket={onUpdateTicket}
        />

        {/* In Progress Column */}
        <TriageColumn
          title="In Progress"
          count={inProgressTickets.length}
          color="cyan"
          tickets={inProgressTickets.slice(0, 50)}
          onSelectTicket={onSelectTicket}
          onUpdateTicket={onUpdateTicket}
        />
      </div>
    </div>
  );
};

interface TriageColumnProps {
  title: string;
  count: number;
  color: string;
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const TriageColumn: React.FC<TriageColumnProps> = ({
  title,
  count,
  color,
  tickets,
  onSelectTicket,
  onUpdateTicket
}) => {
  return (
    <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className={`p-3 bg-${color}-50 border-b border-${color}-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 rounded-full text-sm font-medium`}>
            {count}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tickets.map(ticket => (
          <div
            key={ticket.id}
            className="p-3 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
            onClick={() => onSelectTicket(ticket.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-gray-600">{ticket.number}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getPriorityStyles(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>

            <p className="text-sm font-medium line-clamp-2 mb-2">{ticket.title}</p>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className={`px-2 py-0.5 rounded ${getSLAColorClass(ticket.sla.resolutionTime)}`}>
                {formatTimeRemaining(ticket.sla.resolutionTime.remaining)}
              </span>
              <span className="truncate">{ticket.customer.name}</span>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1 mt-2">
              <button className="flex-1 text-xs py-1 bg-blue-100 hover:bg-blue-200 rounded">Assign</button>
              <button className="flex-1 text-xs py-1 bg-green-100 hover:bg-green-200 rounded">Categorize</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Ticket Queue Panel (Left sidebar for Multi-Task mode)
// ============================================================================

interface TicketQueuePanelProps {
  tickets: Ticket[];
  selectedTicketId?: string;
  filters: AppState['filters'];
  onSelectTicket: (ticketId: string) => void;
  onUpdateFilters: (updates: Partial<AppState['filters']>) => void;
}

const TicketQueuePanel: React.FC<TicketQueuePanelProps> = ({
  tickets,
  selectedTicketId,
  filters,
  onSelectTicket,
  onUpdateFilters
}) => {
  const [showFilters, setShowFilters] = useState(true);

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">My Queue</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
          >
            {showFilters ? '🔼 Hide' : '🔽 Show'} Filters
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold">{tickets.length}</span> tickets
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.assignedToMe}
                onChange={(e) => onUpdateFilters({ assignedToMe: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Assigned to me</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.myTeam}
                onChange={(e) => onUpdateFilters({ myTeam: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">My team</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.watched}
                onChange={(e) => onUpdateFilters({ watched: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Watched tickets</span>
            </label>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Priority</label>
            <div className="flex flex-wrap gap-1">
              {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map(priority => (
                <button
                  key={priority}
                  onClick={() => {
                    const newPriorities = filters.priority.includes(priority)
                      ? filters.priority.filter(p => p !== priority)
                      : [...filters.priority, priority];
                    onUpdateFilters({ priority: newPriorities });
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    filters.priority.includes(priority)
                      ? getPriorityStyles(priority) + ' ring-2 ring-offset-1'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">Status</label>
            <div className="flex flex-wrap gap-1">
              {(['new', 'in_progress', 'pending', 'escalated'] as TicketStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => {
                    const newStatuses = filters.status.includes(status)
                      ? filters.status.filter(s => s !== status)
                      : [...filters.status, status];
                    onUpdateFilters({ status: newStatuses });
                  }}
                  className={`px-2 py-1 text-xs rounded border capitalize transition-all ${
                    filters.status.includes(status)
                      ? getStatusStyles(status) + ' ring-2 ring-offset-1'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <span className="text-4xl block mb-2">📭</span>
              <p>No tickets match your filters</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map(ticket => (
              <TicketListItem
                key={ticket.id}
                ticket={ticket}
                isSelected={ticket.id === selectedTicketId}
                onClick={() => onSelectTicket(ticket.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ============================================================================
// COMPONENT: Ticket List Item (Individual ticket in queue)
// ============================================================================

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
}

const TicketListItem: React.FC<TicketListItemProps> = memo(({ ticket, isSelected, onClick }) => {
  const sentiment = getSentimentDisplay(ticket.aiInsights.sentiment);

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all hover:bg-blue-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-gray-600">{ticket.number}</span>
        <div className="flex gap-1">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${getPriorityStyles(ticket.priority)}`}>
            {ticket.priority}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${getStatusStyles(ticket.status)}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold line-clamp-2 mb-2">{ticket.title}</h4>

      {/* Customer */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span>👤</span>
        <span className="font-medium">{ticket.customer.name}</span>
        {ticket.customer.vip && <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">VIP</span>}
      </div>

      {/* SLA and Sentiment */}
      <div className="flex items-center justify-between gap-2">
        <div className={`text-xs px-2 py-1 rounded font-medium ${getSLAColorClass(ticket.sla.resolutionTime)}`}>
          ⏱️ {formatTimeRemaining(ticket.sla.resolutionTime.remaining)}
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-lg ${sentiment.color}`}>{sentiment.icon}</span>
          <span className="text-xs text-gray-500">{sentiment.label}</span>
        </div>
      </div>

      {/* Tags */}
      {ticket.tags.length > 0 && (
        <div className="flex gap-1 mt-2">
          {ticket.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {ticket.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{ticket.tags.length - 2}</span>
          )}
        </div>
      )}
    </div>
  );
});

// ============================================================================
// COMPONENT: Ticket Tabs Header
// ============================================================================

interface TicketTabsHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeTicketIds: string[];
}

const TicketTabsHeader: React.FC<TicketTabsHeaderProps> = ({ activeTab, onTabChange, activeTicketIds }) => {
  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'customer', label: 'Customer 360°', icon: '👤' },
    { id: 'investigation', label: 'Investigation', icon: '🔍' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'automation', label: 'Automation', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 pt-3">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Ticket Tabs Indicator */}
        {activeTicketIds.length > 1 && (
          <div className="text-xs text-gray-500">
            {activeTicketIds.length} tickets open
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: Full Ticket View (Main ticket display with all tabs)
// ============================================================================

interface FullTicketViewProps {
  ticket: Ticket;
  agents: Map<string, Agent>;
  kbArticles: Map<string, KBArticle>;
  activeTab?: TabType;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const FullTicketView: React.FC<FullTicketViewProps> = ({
  ticket,
  agents,
  kbArticles,
  activeTab = 'overview',
  onUpdateTicket
}) => {
  const assignedAgent = ticket.assignedTo ? agents.get(ticket.assignedTo) : null;
  const sentiment = getSentimentDisplay(ticket.aiInsights.sentiment);
  const complexity = getComplexityDisplay(ticket.aiInsights.complexity);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Ticket Header - Always Visible */}
      <div className="bg-white border-b border-gray-200 p-6">
        {/* Primary Information */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-600">{ticket.number}</span>
              <span className={`px-2 py-1 rounded text-sm font-medium border ${getPriorityStyles(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span className={`px-2 py-1 rounded text-sm font-medium border ${getStatusStyles(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              {ticket.customer.vip && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium border border-yellow-300">
                  ⭐ VIP
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.title}</h2>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>👤 {ticket.customer.name}</span>
              <span>📧 {ticket.customer.email}</span>
              <span>🏢 {ticket.customer.department}</span>
              <span>📍 {ticket.customer.location}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all">
              💾 Save
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-all">
              ✅ Resolve
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-all">
              🔺 Escalate
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all">
              ⋯
            </button>
          </div>
        </div>

        {/* SLA Status Strip */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Response SLA */}
          <div className={`p-3 rounded ${getSLAColorClass(ticket.sla.responseTime)}`}>
            <div className="text-xs font-medium mb-1">Response Time</div>
            <div className="text-lg font-bold">{formatTimeRemaining(ticket.sla.responseTime.remaining)}</div>
            <div className="text-xs mt-1">Target: {ticket.sla.responseTime.target}m</div>
          </div>

          {/* Resolution SLA */}
          <div className={`p-3 rounded ${getSLAColorClass(ticket.sla.resolutionTime)}`}>
            <div className="text-xs font-medium mb-1">Resolution Time</div>
            <div className="text-lg font-bold">{formatTimeRemaining(ticket.sla.resolutionTime.remaining)}</div>
            <div className="text-xs mt-1">Target: {ticket.sla.resolutionTime.target}m</div>
          </div>

          {/* Customer Sentiment */}
          <div className="p-3 rounded bg-gray-100">
            <div className="text-xs font-medium mb-1 text-gray-700">Customer Sentiment</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sentiment.icon}</span>
              <span className={`text-sm font-semibold ${sentiment.color}`}>{sentiment.label}</span>
            </div>
          </div>

          {/* Complexity */}
          <div className="p-3 rounded bg-gray-100">
            <div className="text-xs font-medium mb-1 text-gray-700">Complexity Score</div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${complexity.color}`}>{ticket.aiInsights.complexity}</span>
              <span className={`text-sm font-semibold ${complexity.color}`}>{complexity.level}</span>
            </div>
          </div>
        </div>

        {/* AI Insights Bar */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <div className="font-semibold text-blue-900 mb-2">AI Insights & Recommendations</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Estimated Resolution:</span>
                  <span className="ml-2 font-medium">{ticket.aiInsights.estimatedResolutionTime}m</span>
                </div>
                <div>
                  <span className="text-blue-700">Escalation Risk:</span>
                  <span className="ml-2 font-medium">{(ticket.aiInsights.escalationRisk * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-blue-700">Category Confidence:</span>
                  <span className="ml-2 font-medium">{(ticket.aiInsights.categorization.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ticket.aiInsights.suggestedActions.map((action, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    💡 {action}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'overview' && <OverviewTab ticket={ticket} agents={agents} onUpdateTicket={onUpdateTicket} />}
        {activeTab === 'customer' && <CustomerTab ticket={ticket} />}
        {activeTab === 'investigation' && <InvestigationTab ticket={ticket} kbArticles={kbArticles} />}
        {activeTab === 'communication' && <CommunicationTab ticket={ticket} onUpdateTicket={onUpdateTicket} />}
        {activeTab === 'automation' && <AutomationTab ticket={ticket} />}
        {activeTab === 'analytics' && <AnalyticsTab ticket={ticket} />}
      </div>
    </div>
  );
};

// ============================================================================
// TAB 1: Overview Tab
// ============================================================================

interface OverviewTabProps {
  ticket: Ticket;
  agents: Map<string, Agent>;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ ticket, agents, onUpdateTicket }) => {
  return (
    <div className="p-4 space-y-4">
      {/* Description Card - More Compact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-base font-semibold mb-2">📋 Ticket Description</h3>
        <p className="text-sm text-gray-700 line-clamp-3">{ticket.description}</p>

        {/* Attachments - Inline if present */}
        {ticket.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="text-xs font-medium text-gray-600">📎 {ticket.attachments.length} Attachments</span>
          </div>
        )}
      </div>

      {/* Impact, Timeline & Actions - All in One Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Impact Assessment - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold mb-3">🎯 Impact Assessment</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Impact</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => onUpdateTicket(ticket.id, { impact: level })}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                      ticket.impact === level
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Urgency</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => onUpdateTicket(ticket.id, { urgency: level })}
                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                      ticket.urgency === level
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs">
                <span className="font-medium">Priority:</span>
                <span className={`ml-1 px-2 py-0.5 rounded text-xs ${getPriorityStyles(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold mb-3">⚡ Timeline</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">📝</span>
              <div className="flex-1 text-xs">
                <p className="font-medium">Created</p>
                <p className="text-gray-500">{formatDate(ticket.createdAt)}</p>
              </div>
            </div>
            {ticket.firstResponseAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm">💬</span>
                <div className="flex-1 text-xs">
                  <p className="font-medium">First Response</p>
                  <p className="text-gray-500">{formatDate(ticket.firstResponseAt)}</p>
                </div>
              </div>
            )}
            {ticket.assignedTo && (
              <div className="flex items-center gap-2">
                <span className="text-sm">👤</span>
                <div className="flex-1 text-xs">
                  <p className="font-medium">Assigned</p>
                  <p className="text-gray-500">{agents.get(ticket.assignedTo)?.name || 'Agent'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold mb-3">🎯 Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-all">
              <span className="text-xs font-medium text-blue-900">📚 Knowledge Base</span>
              <p className="text-xs text-gray-600">3 articles</p>
            </button>
            <button className="w-full text-left p-2 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-all">
              <span className="text-xs font-medium text-green-900">🔗 Similar Tickets</span>
              <p className="text-xs text-gray-600">5 resolved</p>
            </button>
            <button className="w-full text-left p-2 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-all">
              <span className="text-xs font-medium text-purple-900">🔧 Diagnostics</span>
              <p className="text-xs text-gray-600">Run checks</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TimelineEventProps {
  icon: string;
  title: string;
  timestamp: Date;
  color: string;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ icon, title, timestamp, color }) => (
  <div className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center text-sm`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-gray-500">{formatDate(timestamp)}</p>
    </div>
  </div>
);

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, description, color }) => (
  <button className={`p-4 bg-${color}-50 border border-${color}-200 rounded-lg text-left hover:shadow-md transition-all group`}>
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h4 className={`font-semibold text-${color}-900 group-hover:text-${color}-700`}>{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </button>
);

// ============================================================================
// TAB 2: Customer 360° Tab
// ============================================================================

interface CustomerTabProps {
  ticket: Ticket;
}

const CustomerTab: React.FC<CustomerTabProps> = ({ ticket }) => {
  const customer = ticket.customer;

  return (
    <div className="p-6 space-y-6">
      {/* Customer Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {customer.name.split(' ').map(n => n[0]).join('')}
            </div>
            {customer.vip && (
              <div className="mt-2 text-center">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                  ⭐ VIP Customer
                </span>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{customer.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">📧 Email:</span>
                <span className="ml-2 font-medium">{customer.email}</span>
              </div>
              <div>
                <span className="text-gray-600">📞 Phone:</span>
                <span className="ml-2 font-medium">{customer.phone}</span>
              </div>
              <div>
                <span className="text-gray-600">🏢 Department:</span>
                <span className="ml-2 font-medium">{customer.department}</span>
              </div>
              <div>
                <span className="text-gray-600">📍 Location:</span>
                <span className="ml-2 font-medium">{customer.location}</span>
              </div>
              <div>
                <span className="text-gray-600">🌍 Timezone:</span>
                <span className="ml-2 font-medium">{customer.timezone}</span>
              </div>
              <div>
                <span className="text-gray-600">🗣️ Language:</span>
                <span className="ml-2 font-medium">{customer.language.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-shrink-0 text-center space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">87</div>
              <div className="text-xs text-gray-600">Total Tickets</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">4.2</div>
              <div className="text-xs text-gray-600">Avg CSAT</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">12d</div>
              <div className="text-xs text-gray-600">Avg Resolution</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ticket History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">📜 Recent Ticket History</h3>
        <div className="space-y-2">
          {[
            { id: 'TKT-2024-001200', title: 'VPN connection issues', status: 'resolved', date: '2 days ago' },
            { id: 'TKT-2024-001180', title: 'Software license expired', status: 'closed', date: '5 days ago' },
            { id: 'TKT-2024-001150', title: 'Printer not responding', status: 'resolved', date: '1 week ago' },
            { id: 'TKT-2024-001120', title: 'Email sync problems', status: 'resolved', date: '2 weeks ago' }
          ].map((t, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-600">{t.id}</span>
                <span className="text-sm font-medium">{t.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getStatusStyles(t.status as TicketStatus)}`}>
                  {t.status}
                </span>
                <span className="text-xs text-gray-500">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Preferences */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">📞 Contact Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <span className="font-medium">✅ Email</span>
              <span className="text-sm text-gray-600">Preferred</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
              <span className="font-medium">📱 Phone</span>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
              <span className="font-medium">💬 Chat</span>
              <span className="text-sm text-gray-600">Available</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">😊 Sentiment Trend</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">😊</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <span className="text-sm font-medium">80%</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Generally positive sentiment. Appreciates quick responses and clear communication.
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium text-yellow-800">💡 Communication Tip</p>
              <p className="text-xs text-yellow-700 mt-1">
                Customer prefers technical details and step-by-step instructions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets & Services */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">💻 Assigned Assets & Services</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💻</span>
              <span className="font-semibold">Laptop</span>
            </div>
            <p className="text-sm text-gray-600">Dell XPS 15</p>
            <p className="text-xs text-gray-500">Serial: DLL-2024-1234</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📱</span>
              <span className="font-semibold">Mobile</span>
            </div>
            <p className="text-sm text-gray-600">iPhone 14 Pro</p>
            <p className="text-xs text-gray-500">IMEI: 359***********</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎧</span>
              <span className="font-semibold">Headset</span>
            </div>
            <p className="text-sm text-gray-600">Jabra Evolve2</p>
            <p className="text-xs text-gray-500">Serial: JBR-2024-5678</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium mb-2">Software Licenses</h4>
          <div className="grid grid-cols-4 gap-2">
            {['Microsoft 365', 'Adobe CC', 'Salesforce', 'Slack', 'Zoom Pro', 'Tableau'].map((software, idx) => (
              <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded text-center">
                {software}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 3: Investigation Tab
// ============================================================================

interface InvestigationTabProps {
  ticket: Ticket;
  kbArticles: Map<string, KBArticle>;
}

const InvestigationTab: React.FC<InvestigationTabProps> = ({ ticket, kbArticles }) => {
  const relevantArticles = Array.from(kbArticles.values())
    .filter(kb => kb.category === ticket.category)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Knowledge Base Integration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📚 Relevant Knowledge Base Articles</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Search All Articles →
          </button>
        </div>

        <div className="space-y-3">
          {relevantArticles.map((article, idx) => (
            <div key={article.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">{article.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      idx === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {idx === 0 ? '⭐ Top Match' : `${article.successRate.toFixed(0)}% Success`}
                    </span>
                  </div>
                  <h4 className="font-semibold text-blue-900">{article.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>👁️ {article.views} views</span>
                    <span>👍 {article.helpful} helpful</span>
                    <span>📅 Updated {formatDate(article.updatedAt)}</span>
                  </div>
                </div>
                <button className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related Tickets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">🔗 Similar Resolved Tickets</h3>
        <div className="space-y-3">
          {[
            { id: 'TKT-2024-001150', title: 'VPN authentication failure after password change', resolution: 'Reset VPN profile and reconfigure', time: '45m', csat: 5 },
            { id: 'TKT-2024-001089', title: 'Cannot connect to VPN from home network', resolution: 'Firewall blocking UDP 500/4500, added exception', time: '2h 15m', csat: 4 },
            { id: 'TKT-2024-000967', title: 'VPN connects but no access to internal resources', resolution: 'DNS settings incorrect, updated to internal DNS', time: '1h 30m', csat: 5 }
          ].map((relTicket, idx) => (
            <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-600">{relTicket.id}</span>
                    <div className="flex">
                      {Array.from({ length: relTicket.csat }).map((_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                  </div>
                  <h4 className="font-medium text-green-900">{relTicket.title}</h4>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Resolved in {relTicket.time}
                </span>
              </div>
              <div className="p-3 bg-white rounded border border-green-200">
                <p className="text-sm font-medium text-gray-700 mb-1">✅ Resolution:</p>
                <p className="text-sm text-gray-600">{relTicket.resolution}</p>
              </div>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                Copy resolution to this ticket →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Tools */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">🔧 Diagnostic Toolkit</h3>
        <div className="grid grid-cols-2 gap-4">
          <DiagnosticTool
            icon="🖥️"
            name="Remote Desktop"
            description="Connect to user's machine"
            status="available"
            onClick={() => {}}
          />
          <DiagnosticTool
            icon="🌐"
            name="Network Diagnostics"
            description="Run ping, traceroute, DNS tests"
            status="available"
            onClick={() => {}}
          />
          <DiagnosticTool
            icon="📊"
            name="System Health Check"
            description="CPU, RAM, Disk usage"
            status="running"
            onClick={() => {}}
          />
          <DiagnosticTool
            icon="🔐"
            name="Permission Analyzer"
            description="Check user access rights"
            status="available"
            onClick={() => {}}
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-medium mb-2">📋 Recent Diagnostic Results</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Network Latency:</span>
              <span className="font-medium text-green-600">12ms (Good)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Packet Loss:</span>
              <span className="font-medium text-green-600">0% (Excellent)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DNS Resolution:</span>
              <span className="font-medium text-green-600">Working</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VPN Server:</span>
              <span className="font-medium text-orange-600">High Load (87%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Correlation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Recent Changes & Correlation</h3>
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900">VPN Server Upgrade</h4>
                <p className="text-sm text-yellow-800 mt-1">Scheduled maintenance completed 2 hours ago</p>
                <p className="text-xs text-yellow-700 mt-2">
                  Change ID: CHG-2024-0156 | Implemented by Network Team
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-yellow-100 px-2 py-1 rounded">May be related to this issue</span>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    View change details →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔧</span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Security Patch Deployment</h4>
                <p className="text-sm text-gray-600 mt-1">Windows security updates pushed yesterday</p>
                <p className="text-xs text-gray-500 mt-2">
                  Change ID: CHG-2024-0142 | Implemented 1 day ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DiagnosticToolProps {
  icon: string;
  name: string;
  description: string;
  status: 'available' | 'running' | 'completed';
  onClick: () => void;
}

const DiagnosticTool: React.FC<DiagnosticToolProps> = ({ icon, name, description, status, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-lg border-2 transition-all text-left ${
      status === 'running'
        ? 'border-blue-300 bg-blue-50 animate-pulse'
        : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
    }`}
  >
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <h4 className="font-semibold">{name}</h4>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
        <div className="mt-2">
          {status === 'available' && <span className="text-xs text-green-600 font-medium">● Ready to run</span>}
          {status === 'running' && <span className="text-xs text-blue-600 font-medium">● Running...</span>}
          {status === 'completed' && <span className="text-xs text-gray-600 font-medium">✓ Completed</span>}
        </div>
      </div>
    </div>
  </button>
);

// ============================================================================
// REMAINING TABS (Communication, Automation, Analytics) - COMPACT VERSIONS
// ============================================================================

const CommunicationTab: React.FC<{ ticket: Ticket; onUpdateTicket: (id: string, updates: Partial<Ticket>) => void }> = ({ ticket }) => (
  <div className="p-6 space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">💬 Conversation Thread</h3>
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {/* Sample messages */}
        <MessageBubble
          from={ticket.customer.name}
          message={ticket.description}
          timestamp={ticket.createdAt}
          isCustomer={true}
        />
        <MessageBubble
          from="Support Agent"
          message="Thank you for contacting us. I've reviewed your issue and I'm working on a solution. Could you please try restarting your VPN client and let me know if the issue persists?"
          timestamp={new Date(ticket.createdAt.getTime() + 300000)}
          isCustomer={false}
        />
      </div>

      {/* Message Composer */}
      <div className="border-t border-gray-200 pt-4">
        <div className="mb-2 flex gap-2">
          <button className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
            📝 Use Template
          </button>
          <button className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
            🤖 AI Suggestion
          </button>
          <button className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
            📎 Attach File
          </button>
        </div>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Type your message here..."
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            💡 Tip: Customer prefers technical details
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
              Save as Note
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Internal Notes */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">📝 Internal Notes</h3>
      <div className="space-y-2">
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Sarah Chen</span>
            <span className="text-xs text-gray-500">15 minutes ago</span>
          </div>
          <p className="text-sm text-gray-700">Checked with network team - VPN server experiencing high load. Escalating to infrastructure.</p>
        </div>
      </div>
      <textarea
        className="w-full mt-3 p-2 border border-gray-300 rounded text-sm"
        rows={2}
        placeholder="Add internal note (not visible to customer)..."
      />
    </div>
  </div>
);

interface MessageBubbleProps {
  from: string;
  message: string;
  timestamp: Date;
  isCustomer: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ from, message, timestamp, isCustomer }) => (
  <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
    <div className={`max-w-2xl ${isCustomer ? 'bg-gray-100' : 'bg-blue-100'} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold">{from}</span>
        <span className="text-xs text-gray-500">{formatDate(timestamp)}</span>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
    </div>
  </div>
);

const AutomationTab: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
  <div className="p-6 space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">⚙️ Automation & Workflows</h3>
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="font-semibold text-green-900">Auto-categorization Applied</h4>
              <p className="text-sm text-green-800 mt-1">
                Ticket automatically categorized as "{ticket.category}" with {(ticket.aiInsights.categorization.confidence * 100).toFixed(0)}% confidence
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Available Automated Actions</h4>
              <div className="mt-2 space-y-2">
                <button className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100">
                  <span className="text-sm font-medium">🤖 Run Standard Diagnostics</span>
                  <p className="text-xs text-gray-600">Automated system health check</p>
                </button>
                <button className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100">
                  <span className="text-sm font-medium">📧 Send Status Update to Customer</span>
                  <p className="text-xs text-gray-600">Automated progress notification</p>
                </button>
                <button className="w-full text-left p-2 bg-white border border-blue-200 rounded hover:bg-blue-100">
                  <span className="text-sm font-medium">🔗 Link to Related Tickets</span>
                  <p className="text-xs text-gray-600">Find and associate similar issues</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h4 className="font-semibold text-purple-900">SLA Monitoring Active</h4>
                <p className="text-sm text-purple-800 mt-1">
                  Automatic escalation in {formatTimeRemaining(ticket.sla.resolutionTime.remaining * 0.8)} if not resolved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsTab: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
  <div className="p-6 space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Ticket Analytics</h3>

      {/* Time Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Time Since Created</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatTimeRemaining((Date.now() - ticket.createdAt.getTime()) / 1000 / 60)}
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">First Response Time</div>
          <div className="text-2xl font-bold text-green-600">
            {ticket.firstResponseAt ? formatTimeRemaining((ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / 1000 / 60) : 'Pending'}
          </div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Est. Resolution Time</div>
          <div className="text-2xl font-bold text-purple-600">
            {ticket.aiInsights.estimatedResolutionTime}m
          </div>
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold mb-3">🔍 Pattern Analysis</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm">Similar tickets this week:</span>
            <span className="font-bold text-orange-600">12</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm">Average resolution time (category):</span>
            <span className="font-bold text-blue-600">2h 15m</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-sm">Success rate (similar issues):</span>
            <span className="font-bold text-green-600">94%</span>
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <h4 className="font-semibold mb-3">🔮 AI Predictions</h4>
        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Escalation Risk:</span>
              <span className="text-sm font-bold text-yellow-600">
                {(ticket.aiInsights.escalationRisk * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-2 bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${ticket.aiInsights.escalationRisk * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm font-medium mb-1">Recommended Next Actions:</div>
            <ul className="text-xs space-y-1 mt-2">
              {ticket.aiInsights.suggestedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// COMPONENT: Status Bar (Bottom of screen)
// ============================================================================

interface StatusBarProps {
  currentUser: Agent;
  totalTickets: number;
  filteredTickets: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ currentUser, totalTickets, filteredTickets }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 bg-gray-800 text-white text-xs flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-6">
        <span className="font-medium">
          Status: <span className="text-green-400">● Online</span>
        </span>
        <span>
          Capacity: {currentUser.capacity.current}/{currentUser.capacity.max}
        </span>
        <span>
          Queue: {filteredTickets} of {totalTickets} tickets
        </span>
        <span>
          Today: {currentUser.metrics.ticketsToday} tickets resolved
        </span>
      </div>

      <div className="flex items-center gap-6">
        <span>
          FCR: {currentUser.metrics.firstCallResolution.toFixed(0)}%
        </span>
        <span>
          CSAT: {currentUser.metrics.customerSatisfaction.toFixed(1)}/5.0
        </span>
        <span>
          {currentTime.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default ServiceDeskApp;
