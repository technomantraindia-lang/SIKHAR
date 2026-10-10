// Local store and session manager for Sikhar Fleet (no external DB required)

const STORAGE_KEYS = {
  CURRENT_USER: 'sikhar_current_user',
  REGISTERED_USERS: 'sikhar_registered_users',
  ALERTS: 'sikhar_alerts_data',
  SYSTEM_PREFS: 'sikhar_system_prefs'
};

const DEFAULT_USERS = [
  {
    id: 'USR-001',
    name: 'Fleet Administrator',
    email: 'admin@sikharfleet.com',
    password: 'admin123',
    role: 'Administrator',
    initials: 'FA',
    branch: 'Delhi NCR Central Hub',
    phone: '+91 98110 44291',
    accessLevel: 'Global Admin'
  },
  {
    id: 'USR-002',
    name: 'Rajesh Verma',
    email: 'operations@sikharfleet.com',
    password: 'ops123',
    role: 'Fleet Operations Manager',
    initials: 'RV',
    branch: 'Gurgaon Hub · Sector 44',
    phone: '+91 98188 12044',
    accessLevel: 'Operations Master'
  },
  {
    id: 'USR-003',
    name: 'Pooja Mehra',
    email: 'finance@sikharfleet.com',
    password: 'fin123',
    role: 'Finance & Accounts Head',
    initials: 'PM',
    branch: 'Central Treasury / Delhi',
    phone: '+91 99200 88319',
    accessLevel: 'Finance Controller'
  }
];

export const getRegisteredUsers = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_USERS;
  }
};

export const registerUser = ({ name, email, password, role = 'Fleet Operations', branch = 'Delhi NCR Hub' }) => {
  const users = getRegisteredUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this corporate email already exists.');
  }

  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SF';

  const newUser = {
    id: `USR-${String(users.length + 1).padStart(3, '0')}`,
    name,
    email,
    password,
    role,
    initials,
    branch,
    phone: '+91 98XXX XXXXX',
    accessLevel: role === 'Owner / Super Administrator' ? 'Global Superadmin' : 'Standard Enterprise'
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updatedUsers));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  return newUser;
};

export const authenticateUser = (email, password) => {
  const users = getRegisteredUsers();
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error('Invalid email or security password.');
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
};

export const getCurrentUser = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!stored) {
    // Default to Super Admin for seamless initial loading
    const defaultAdmin = DEFAULT_USERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultAdmin));
    return defaultAdmin;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_USERS[0];
  }
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Executive Dashboard Mock Data (aligned with Client Wireframe v8)
export const getDashboardData = () => {
  return {
    operationalDate: 'Tuesday, 18 August 2026',
    timeSlot: '09:42 AM IST',
    hubName: 'Sikhar Fleet Private Limited · Delhi NCR Hub',
    metrics: {
      totalStock: 72,
      totalStockDesc: '100% of fleet registered',
      utilizedStock: 64,
      utilizationRate: '88.89%',
      nonOpsStock: 4,
      nonOpsRate: '5.56%',
      inMaintenance: 3,
      maintenanceRate: '4.17%',
      driverOnLeave: 7,
      driverLeaveDesc: 'Drivers on leave today',
      revenueToday: '₹29,050',
      revenueGrowth: '↑ 8.3%',
      collectionToday: '₹28,200',
      collectionGrowth: '↑ 7.6%'
    },
    utilizationTrend: [
      { date: '12 Aug', rate: 78, value: '₹27,400' },
      { date: '13 Aug', rate: 71, value: '₹25,800' },
      { date: '14 Aug', rate: 87, value: '₹31,200' },
      { date: '15 Aug', rate: 75, value: '₹28,000' },
      { date: '16 Aug', rate: 83, value: '₹29,800' },
      { date: '17 Aug', rate: 77, value: '₹27,500' },
      { date: '18 Aug', rate: 88.89, value: '₹29,050', isToday: true }
    ],
    assetBreakdown: [
      { label: 'Utilized', count: 64, color: '#18a957', percentage: '88.9%' },
      { label: 'Non Ops', count: 4, color: '#f59a23', percentage: '5.6%' },
      { label: 'Maintenance', count: 3, color: '#ef3340', percentage: '4.2%' },
      { label: 'Driver Leave', count: 7, color: '#7b45e8', percentage: '9.7%' }
    ],
    finance7Days: {
      revenue: {
        total: '₹2,29,050',
        change: '↑ 12.4%',
        bars: [42, 65, 78, 54, 88, 62, 70]
      },
      collections: {
        total: '₹1,98,450',
        change: '↑ 9.7%',
        bars: [35, 60, 72, 68, 52, 64, 58]
      },
      waivers: {
        total: '₹14,250',
        change: '↑ 6.3%',
        bars: [20, 38, 75, 58, 42, 30, 52]
      }
    },
    riskMonitors: {
      outstanding: {
        amount: '₹1,64,286.99',
        invoicesCount: 159,
        statusText: '159 overdue customer invoices'
      },
      walletHealth: {
        healthyCount: 38,
        healthySum: '₹1,24,750',
        breachedCount: 14,
        breachedSum: '₹14,960'
      },
      vendorPayables: {
        amount: '₹1,24,713',
        pendingBills: 12,
        statusText: '12 workshop bills to be paid'
      }
    },
    alerts: [
      { id: 1, type: 'maintenance', icon: '🔧', text: '3 vehicles in maintenance stage', count: 3, level: 'danger' },
      { id: 2, type: 'challan', icon: '⚠', text: '5 traffic challans pending clearance', count: 5, level: 'warning' },
      { id: 3, type: 'insurance', icon: '🟡', text: 'Insurance due within next 7 days', count: 6, level: 'warning' }
    ],
    reminders: [
      { task: 'Commercial Insurance renewal (DL52GD6605)', date: '24 Aug 2026', tag: 'High' },
      { task: 'NCR Route Permit renewal (HR38AK1234)', date: '25 Aug 2026', tag: 'Action' },
      { task: 'Scheduled 10K EV battery service', date: '21 Aug 2026', tag: 'Workshop' }
    ],
    scorecard: [
      { metric: 'Fleet Utilization', value: '88.89%', highlight: 'good' },
      { metric: 'Revenue Today', value: '₹29,050', highlight: 'neutral' },
      { metric: 'Collections Today', value: '₹28,200', highlight: 'good' },
      { metric: 'Wallet Breaches', value: '14 accounts', highlight: 'bad' },
      { metric: 'Credit Notes / Waivers', value: '₹14,250', highlight: 'bad' },
      { metric: 'Free Operating Cash Flow', value: '₹7,03,557.97', highlight: 'good' }
    ]
  };
};
