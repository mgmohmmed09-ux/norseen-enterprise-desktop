import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Branch,
  Employee,
  EmploymentStatusConfig,
  EnterpriseTask,
  IncidentRecord,
  EmployeeRequest,
  RequestType,
  WorkShiftType,
  PermissionKey,
  ShiftConfig,
  TaskTargetUser,
  UserAccount,
  UserRole,
  ItemCategory,
  MainSection,
  SubSection,
  CatalogItem,
  PurchaseOrder,
  PurchaseOrderStatus,
  CloudDbStats,
  CloudStatusType,
  WeeklyBranchReportRecord,
  WeeklyEvaluationRating,
  WeeklyEmployeeEvaluation,
  CasualEmployee,
  CasualApprovalStatus,
  CasualDocumentCategory,
  CasualEmployeeDocument,
  EmploymentStatusType,
  BranchTransfer,
  TransferStatus,
  DeficitAlertNotification,
} from '../types';
import { normalizeArabic, ParsedEmployeeRow } from '../utils/exportImport';
import {
  CLEAN_ADMIN_EMPLOYEE,
  CLEAN_BRANCH,
  CLEAN_SUPER_ADMIN,
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_BRANCHES,
  INITIAL_EMPLOYEES,
  INITIAL_EMPLOYMENT_STATUSES,
  INITIAL_INCIDENTS,
  INITIAL_REQUESTS,
  INITIAL_SHIFTS,
  INITIAL_TASKS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_MAIN_SECTIONS,
  INITIAL_SUB_SECTIONS,
  INITIAL_CATALOG_ITEMS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_CASUAL_EMPLOYEES,
  INITIAL_BRANCH_TRANSFERS,
} from '../data/initialData';
import {
  testConnection,
  saveDocToFirestore,
  deleteDocFromFirestore,
  clearFirestoreCollection,
  subscribeToCollection,
  fetchCollectionOnce,
} from '../services/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AppContextType {
  // Current session
  currentUser: UserAccount | null;
  activeBranchFilter: string; // 'all' or branchId
  setActiveBranchFilter: (branchId: string) => void;
  login: (usernameOrJobId: string, password?: string) => { success: boolean; message?: string };
  verifyCredentials: (usernameOrJobId: string, password?: string) => { success: boolean; message?: string; user?: UserAccount };
  quickLoginAs: (userId: string) => void;
  logout: () => void;

  // Permissions & Scoping
  hasPermission: (permission: PermissionKey) => boolean;
  canAccessBranch: (branchId: string) => boolean;
  userAssignedBranches: Branch[];
  isGlobalUser: boolean; // system_admin or hr with '*' branches

  // Entities
  employees: Employee[];
  branches: Branch[];
  shifts: ShiftConfig[];
  employmentStatuses: EmploymentStatusConfig[];
  users: UserAccount[];
  rolePermissions: Record<UserRole, Record<PermissionKey, boolean>>;
  incidents: IncidentRecord[];
  requests: EmployeeRequest[];
  tasks: EnterpriseTask[];

  // 3-Tier Catalog Entities
  categories: ItemCategory[];
  mainSections: MainSection[];
  subSections: SubSection[];
  catalogItems: CatalogItem[];
  purchaseOrders: PurchaseOrder[];

  // Casual Labor Entities (العمالة العارضة)
  casualEmployees: CasualEmployee[];

  // Inter-Branch Logistics & Transfers (النقل والطرود بين الفروع)
  transfers: BranchTransfer[];

  // Scoped lists according to user branches & active branch filter
  scopedEmployees: Employee[];
  scopedCasualEmployees: CasualEmployee[];
  scopedTransfers: BranchTransfer[];
  scopedIncidents: IncidentRecord[];
  scopedRequests: EmployeeRequest[];
  scopedTasks: EnterpriseTask[];
  scopedItems: CatalogItem[];
  scopedPurchaseOrders: PurchaseOrder[];

  // Employee Actions
  addEmployee: (
    emp: Omit<Employee, 'id' | 'createdAt'>,
    createOperatorAccount?: boolean,
    operatorOptions?: { username?: string; password?: string; role?: UserRole }
  ) => { success: boolean; error?: string; createdUserId?: string };
  updateEmployee: (id: string, emp: Partial<Employee>) => { success: boolean; error?: string };
  deleteEmployee: (id: string) => { success: boolean; error?: string };
  importEmployees: (emps: (ParsedEmployeeRow | Omit<Employee, 'id' | 'createdAt'>)[]) => {
    addedCount: number;
    updatedCount: number;
    errors: string[];
  };

  // Incident Actions
  addIncident: (rec: {
    employeeId: string;
    type: 'absence' | 'delay';
    date: string;
    delayDurationMinutes?: number;
    arrivalTime?: string;
    reasonAr?: string;
    isExcused: boolean;
  }) => { success: boolean; error?: string };
  deleteIncident: (id: string) => { success: boolean; error?: string };

  // Request Actions
  createRequest: (req: {
    employeeId: string;
    type: RequestType;
    startDate?: string;
    endDate?: string;
    exitTime?: string;
    delayDurationMinutes?: number;
    vacationType?: 'annual' | 'sick' | 'emergency' | 'unpaid';
    reasonAr: string;
    targetBranchId?: string;
    targetShift?: WorkShiftType | string;
    effectiveDate?: string;
  }) => { success: boolean; error?: string };
  reviewRequest: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;

  // Task Actions
  createTask: (data: {
    titleAr: string;
    descriptionAr: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetRoles: UserRole[];
    targetBranchIds: string[];
    dueDate: string;
  }) => { success: boolean; error?: string };
  toggleTaskCompletion: (taskId: string, notes?: string) => void;
  toggleTaskArchive: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // User & Permission Actions
  addUser: (user: Omit<UserAccount, 'id'>) => { success: boolean; error?: string };
  updateUser: (id: string, user: Partial<UserAccount>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  updateRolePermission: (role: UserRole, key: PermissionKey, value: boolean) => void;
  updateUserPermissionOverride: (userId: string, key: PermissionKey, value: boolean | undefined) => void;
  resetRolePermissionsToDefault: () => void;
  updateCurrentUserProfile: (profileData: {
    fullNameAr?: string;
    avatarUrl?: string;
    password?: string;
    email?: string;
    emailNotificationsEnabled?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;

  // Settings Actions
  addBranch: (branch: Omit<Branch, 'id'>) => { success: boolean; error?: string };
  updateBranch: (id: string, branch: Partial<Branch>) => void;
  toggleBranchStatus: (id: string) => void;
  addShift: (shift: ShiftConfig) => void;
  updateShift: (id: string, shift: Partial<ShiftConfig>) => void;
  addEmploymentStatus: (status: EmploymentStatusConfig) => void;
  updateEmploymentStatus: (id: string, status: Partial<EmploymentStatusConfig>) => void;

  // 3-Tier Hierarchy Actions
  addCategory: (cat: Omit<ItemCategory, 'id'>) => { success: boolean; error?: string };
  updateCategory: (id: string, cat: Partial<ItemCategory>) => void;
  deleteCategory: (id: string) => { success: boolean; error?: string };

  addMainSection: (sec: Omit<MainSection, 'id'>) => { success: boolean; error?: string };
  updateMainSection: (id: string, sec: Partial<MainSection>) => void;
  deleteMainSection: (id: string) => { success: boolean; error?: string };

  addSubSection: (sub: Omit<SubSection, 'id'>) => { success: boolean; error?: string };
  updateSubSection: (id: string, sub: Partial<SubSection>) => void;
  deleteSubSection: (id: string) => { success: boolean; error?: string };

  // Catalog Item & Multi-Branch Inventory Actions
  addCatalogItem: (item: Omit<CatalogItem, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateCatalogItem: (id: string, item: Partial<CatalogItem>) => { success: boolean; error?: string };
  deleteCatalogItem: (id: string) => { success: boolean; error?: string };
  updateItemStock: (itemId: string, branchId: string, quantity: number) => void;

  // Storefront & Purchasing Actions
  createPurchaseOrder: (data: {
    itemId: string;
    quantity: number;
    sourceBranchId: string;
    targetBranchId?: string;
    notesAr?: string;
  }) => { success: boolean; error?: string; orderNumber?: string };
  updatePurchaseOrderStatus: (orderId: string, status: PurchaseOrderStatus) => void;

  // Weekly Branch Reports Actions
  weeklyReports: WeeklyBranchReportRecord[];
  approveWeeklyReport: (data: {
    branchId: string;
    branchNameAr: string;
    yearWeek: string;
    weekStartDate: string;
    weekEndDate: string;
    approvalNotesAr?: string;
  }) => { success: boolean; error?: string };
  updateWeeklyEvaluation: (
    branchId: string,
    yearWeek: string,
    employeeId: string,
    rating: WeeklyEvaluationRating,
    note?: string
  ) => void;
  unapproveWeeklyReport: (reportId: string) => void;

  // Casual Labor (العمالة العارضة) Actions
  addCasualEmployee: (
    worker: Omit<CasualEmployee, 'id' | 'createdAt' | 'approvalStatus' | 'isTransferredToPermanent' | 'tempCode' | 'documents'>,
    initialDocs?: Omit<CasualEmployeeDocument, 'id' | 'uploadedAt' | 'uploadedBy'>[]
  ) => { success: boolean; error?: string; id?: string; tempCode?: string };
  approveCasualEmployee: (id: string, assignedJobId: string, notes?: string) => { success: boolean; error?: string };
  rejectCasualEmployee: (id: string, reason: string) => { success: boolean; error?: string };
  updateCasualEmployee: (id: string, updates: Partial<CasualEmployee>) => { success: boolean; error?: string };
  deleteCasualEmployee: (id: string) => { success: boolean; error?: string };
  addCasualEmployeeDocument: (
    workerId: string,
    doc: Omit<CasualEmployeeDocument, 'id' | 'uploadedAt' | 'uploadedBy'>
  ) => { success: boolean; error?: string };
  deleteCasualEmployeeDocument: (workerId: string, docId: string) => { success: boolean; error?: string };
  transferCasualToPermanent: (
    workerId: string,
    transferData: {
      statusId: EmploymentStatusType;
      permanentJobId?: string;
      commencementDate?: string;
      vacationBalance?: number;
      notes?: string;
    }
  ) => { success: boolean; error?: string; newEmployeeId?: string };

  // Inter-Branch Logistics Actions (إجراءات النقل والطرود بين الفروع)
  createTransfer: (data: {
    originBranchId: string;
    destinationBranchId: string;
    sentPackages: number;
    packageDescriptionAr?: string;
    notesAr?: string;
    senderManagerNameAr?: string;
  }) => { success: boolean; error?: string; trackingNumber?: string; id?: string };
  pickupTransfer: (
    transferId: string,
    logisticsNotesAr?: string,
    officerReceivedPackages?: number,
    logisticsOfficerNameAr?: string
  ) => { success: boolean; error?: string };
  receiveTransfer: (
    transferId: string,
    data: { receivedPackages: number; receiptNotesAr?: string; receiverManagerNameAr?: string }
  ) => { success: boolean; error?: string; hasDeficit: boolean; deficitCount: number; message: string };
  updateTransfer: (transferId: string, updates: Partial<BranchTransfer>) => { success: boolean; error?: string };
  deleteTransfer: (transferId: string) => { success: boolean; error?: string };

  // Cloud Database Actions & Controls
  cloudStatus: CloudStatusType;
  isSyncing: boolean;
  lastCloudSync: string | null;
  isCleanDatabase: boolean;
  cloudStats: CloudDbStats;
  clearAllDefaultValuesAndResetCloud: () => Promise<{ success: boolean; error?: string }>;
  loadDemoSampleData: () => Promise<{ success: boolean; error?: string }>;
  syncAllToCloud: () => Promise<{ success: boolean; error?: string }>;
  resetFactoryData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Clean Slate Storage key: switches by default to clean state without default demo records
const STORAGE_PREFIX = 'norseen_cloud_v2_';

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage`, err);
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage`, err);
  }
}

function getSessionItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    return defaultValue;
  }
}

function setSessionItem<T>(key: string, value: T): void {
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
    } else {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
  } catch (err) {
    console.error(`Error saving ${key} to session storage`, err);
  }
}

function broadcastEntitySync(entity: string, data: any): void {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bus = new BroadcastChannel('norseen_sync_bus');
      bus.postMessage({ type: 'ENTITY_SYNC', entity, data });
      bus.close();
    }
  } catch (err) {
    // broadcast channel fallback
  }
}

// Tombstone Management to prevent deleted records from resurrecting from remote snapshots
const TOMBSTONES_KEY = 'norseen_cloud_v2_tombstones';

function getTombstones(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONES_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function recordDeletedId(id: string): void {
  try {
    const set = getTombstones();
    set.add(id);
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Error saving tombstone', err);
  }
}

function clearDeletedId(id: string): void {
  try {
    const set = getTombstones();
    if (set.has(id)) {
      set.delete(id);
      localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(Array.from(set)));
    }
  } catch (err) {
    console.error('Error clearing tombstone', err);
  }
}

function clearAllTombstones(): void {
  try {
    localStorage.removeItem(TOMBSTONES_KEY);
  } catch (err) {
    console.error('Error clearing all tombstones', err);
  }
}

/**
 * Intelligent Two-Way Collection Merger:
 * 1. Takes all valid items from remote Firestore snapshot (excluding locally deleted tombstones).
 * 2. Compares against local items (e.g. from localStorage / state).
 * 3. Any locally created item that is not yet in the remote snapshot is PRESERVED and uploaded to Firestore.
 * This guarantees that new employees, operators, branches, or catalog items never vanish upon reload!
 */
function mergeCollection<T extends { id: string }>(
  collectionName: string,
  remoteItems: T[],
  currentLocalItems: T[]
): T[] {
  const tombstones = getTombstones();

  // 1. Filter remote items by tombstones
  const validRemote = (remoteItems || []).filter(
    (item) => item && item.id && !tombstones.has(item.id)
  );

  const remoteMap = new Map<string, T>();
  validRemote.forEach((item) => remoteMap.set(item.id, item));

  // 2. Discover local items that are NOT in the remote snapshot
  const missingFromRemote: T[] = [];
  (currentLocalItems || []).forEach((localItem) => {
    if (
      localItem &&
      localItem.id &&
      !tombstones.has(localItem.id) &&
      !remoteMap.has(localItem.id)
    ) {
      missingFromRemote.push(localItem);
      // Immediately push missing local item up to Firestore so cloud syncs
      saveDocToFirestore(collectionName, localItem).catch(console.error);
    }
  });

  return [...validRemote, ...missingFromRemote];
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cloud database status states
  const [cloudStatus, setCloudStatus] = useState<CloudStatusType>('connecting');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [isCleanDatabase, setIsCleanDatabase] = useState<boolean>(() =>
    getStoredItem('is_clean_db', true)
  );

  // Clean Baseline initialization:
  const [branches, setBranches] = useState<Branch[]>(() => {
    const stored = getStoredItem<Branch[]>('branches', INITIAL_BRANCHES);
    if (!stored || stored.length <= 1) return INITIAL_BRANCHES;
    return stored;
  });
  const [shifts, setShifts] = useState<ShiftConfig[]>(() =>
    getStoredItem('shifts', INITIAL_SHIFTS)
  );
  const [employmentStatuses, setEmploymentStatuses] = useState<EmploymentStatusConfig[]>(() =>
    getStoredItem('statuses', INITIAL_EMPLOYMENT_STATUSES)
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    getStoredItem('employees', [CLEAN_ADMIN_EMPLOYEE])
  );
  const [users, setUsers] = useState<UserAccount[]>(() =>
    getStoredItem('users', [CLEAN_SUPER_ADMIN])
  );
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Record<PermissionKey, boolean>>>(() =>
    getStoredItem('permissions', DEFAULT_ROLE_PERMISSIONS)
  );
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() =>
    getStoredItem('incidents', [])
  );
  const [requests, setRequests] = useState<EmployeeRequest[]>(() =>
    getStoredItem('requests', [])
  );
  const [tasks, setTasks] = useState<EnterpriseTask[]>(() =>
    getStoredItem('tasks', [])
  );

  // 3-Tier Catalog State: Empty clean slate
  const [categories, setCategories] = useState<ItemCategory[]>(() =>
    getStoredItem('categories', [])
  );
  const [mainSections, setMainSections] = useState<MainSection[]>(() =>
    getStoredItem('main_sections', [])
  );
  const [subSections, setSubSections] = useState<SubSection[]>(() =>
    getStoredItem('sub_sections', [])
  );
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() =>
    getStoredItem('catalog_items', [])
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    getStoredItem('purchase_orders', [])
  );
  const [weeklyReports, setWeeklyReports] = useState<WeeklyBranchReportRecord[]>(() =>
    getStoredItem('weekly_reports', [])
  );
  const [casualEmployees, setCasualEmployees] = useState<CasualEmployee[]>(() => {
    const stored = getStoredItem<CasualEmployee[]>('casual_employees', []);
    // Ensure all demo placeholder records are completely removed
    return stored.filter((c) => !c.id.startsWith('cas-00'));
  });
  const [transfers, setTransfers] = useState<BranchTransfer[]>(() => {
    const stored = getStoredItem<BranchTransfer[]>('transfers', []);
    // Ensure all demo placeholder records are completely removed
    return stored.filter((t) => !t.id.startsWith('trp-00'));
  });

  // Mandatory Login: Session-based authentication (auto logout when browser or tab is closed)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return getSessionItem<UserAccount | null>('current_user', null);
  });

  const [activeBranchFilter, setActiveBranchFilter] = useState<string>('all');

  // Real-time synchronization with Firestore and cross-tab BroadcastChannel
  useEffect(() => {
    let mounted = true;
    const unsubscribers: (() => void)[] = [];

    async function initCloudSync() {
      try {
        const ok = await testConnection();
        if (!mounted) return;
        if (ok) {
          setCloudStatus('connected');
          setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));

          // Purge any legacy demo placeholder records from Firestore & local tombstones
          const demoCasualIds = ['cas-001', 'cas-002', 'cas-003'];
          demoCasualIds.forEach((id) => {
            recordDeletedId(id);
            deleteDocFromFirestore('contingentEmployees', id).catch(() => {});
          });
          const demoTransferIds = ['trp-001', 'trp-002', 'trp-003', 'trp-004'];
          demoTransferIds.forEach((id) => {
            recordDeletedId(id);
            deleteDocFromFirestore('branchTransfers', id).catch(() => {});
          });

          // Real-time listener for employees with intelligent merge
          const unsubEmps = subscribeToCollection<Employee>('employees', (cloudEmps) => {
            if (!mounted) return;
            setEmployees((prev) => {
              const stored = getStoredItem<Employee[]>('employees', prev);
              const merged = mergeCollection<Employee>('employees', cloudEmps, stored);
              setStoredItem('employees', merged);
              return merged;
            });
            setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
          });
          unsubscribers.push(unsubEmps);

          // Real-time listener for users / operators with intelligent merge
          const unsubUsers = subscribeToCollection<UserAccount>('users', (cloudUsers) => {
            if (!mounted) return;
            setUsers((prev) => {
              const stored = getStoredItem<UserAccount[]>('users', prev);
              const merged = mergeCollection<UserAccount>('users', cloudUsers, stored);
              setStoredItem('users', merged);
              return merged;
            });
            setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
          });
          unsubscribers.push(unsubUsers);

          // Real-time listener for branches with intelligent merge
          const unsubBranches = subscribeToCollection<Branch>('branches', (cloudBranches) => {
            if (!mounted) return;
            setBranches((prev) => {
              const stored = getStoredItem<Branch[]>('branches', prev);
              const merged = mergeCollection<Branch>('branches', cloudBranches, stored);
              setStoredItem('branches', merged);
              return merged;
            });
            setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
          });
          unsubscribers.push(unsubBranches);

          // Real-time listener for shifts with intelligent merge
          const unsubShifts = subscribeToCollection<ShiftConfig>('shifts', (cloudShifts) => {
            if (!mounted) return;
            setShifts((prev) => {
              const stored = getStoredItem<ShiftConfig[]>('shifts', prev);
              const merged = mergeCollection<ShiftConfig>('shifts', cloudShifts, stored);
              setStoredItem('shifts', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubShifts);

          // Real-time listener for employment statuses with intelligent merge
          const unsubStatuses = subscribeToCollection<EmploymentStatusConfig>('employmentStatuses', (cloudStatuses) => {
            if (!mounted) return;
            setEmploymentStatuses((prev) => {
              const stored = getStoredItem<EmploymentStatusConfig[]>('statuses', prev);
              const merged = mergeCollection<EmploymentStatusConfig>('employmentStatuses', cloudStatuses, stored);
              setStoredItem('statuses', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubStatuses);

          // Real-time listener for incidents with intelligent merge
          const unsubIncidents = subscribeToCollection<IncidentRecord>('incidents', (cloudIncidents) => {
            if (!mounted) return;
            setIncidents((prev) => {
              const stored = getStoredItem<IncidentRecord[]>('incidents', prev);
              const merged = mergeCollection<IncidentRecord>('incidents', cloudIncidents, stored);
              setStoredItem('incidents', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubIncidents);

          // Real-time listener for requests with intelligent merge
          const unsubRequests = subscribeToCollection<EmployeeRequest>('requests', (cloudRequests) => {
            if (!mounted) return;
            setRequests((prev) => {
              const stored = getStoredItem<EmployeeRequest[]>('requests', prev);
              const merged = mergeCollection<EmployeeRequest>('requests', cloudRequests, stored);
              setStoredItem('requests', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubRequests);

          // Real-time listener for tasks with intelligent merge
          const unsubTasks = subscribeToCollection<EnterpriseTask>('tasks', (cloudTasks) => {
            if (!mounted) return;
            setTasks((prev) => {
              const stored = getStoredItem<EnterpriseTask[]>('tasks', prev);
              const merged = mergeCollection<EnterpriseTask>('tasks', cloudTasks, stored);
              setStoredItem('tasks', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubTasks);

          // Real-time listener for categories with intelligent merge
          const unsubCats = subscribeToCollection<ItemCategory>('categories', (cloudCats) => {
            if (!mounted) return;
            setCategories((prev) => {
              const stored = getStoredItem<ItemCategory[]>('categories', prev);
              const merged = mergeCollection<ItemCategory>('categories', cloudCats, stored);
              setStoredItem('categories', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubCats);

          // Real-time listener for main sections with intelligent merge
          const unsubMain = subscribeToCollection<MainSection>('mainSections', (cloudMain) => {
            if (!mounted) return;
            setMainSections((prev) => {
              const stored = getStoredItem<MainSection[]>('main_sections', prev);
              const merged = mergeCollection<MainSection>('mainSections', cloudMain, stored);
              setStoredItem('main_sections', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubMain);

          // Real-time listener for sub sections with intelligent merge
          const unsubSub = subscribeToCollection<SubSection>('subSections', (cloudSubs) => {
            if (!mounted) return;
            setSubSections((prev) => {
              const stored = getStoredItem<SubSection[]>('sub_sections', prev);
              const merged = mergeCollection<SubSection>('subSections', cloudSubs, stored);
              setStoredItem('sub_sections', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubSub);

          // Real-time listener for catalog items with intelligent merge
          const unsubItems = subscribeToCollection<CatalogItem>('catalogItems', (cloudItems) => {
            if (!mounted) return;
            setCatalogItems((prev) => {
              const stored = getStoredItem<CatalogItem[]>('catalog_items', prev);
              const merged = mergeCollection<CatalogItem>('catalogItems', cloudItems, stored);
              setStoredItem('catalog_items', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubItems);

          // Real-time listener for purchase orders with intelligent merge
          const unsubPOs = subscribeToCollection<PurchaseOrder>('purchaseOrders', (cloudPOs) => {
            if (!mounted) return;
            setPurchaseOrders((prev) => {
              const stored = getStoredItem<PurchaseOrder[]>('purchase_orders', prev);
              const merged = mergeCollection<PurchaseOrder>('purchaseOrders', cloudPOs, stored);
              setStoredItem('purchase_orders', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubPOs);

          // Real-time listener for weekly branch reports with intelligent merge
          const unsubWeekly = subscribeToCollection<WeeklyBranchReportRecord>('weeklyReports', (cloudReports) => {
            if (!mounted) return;
            setWeeklyReports((prev) => {
              const stored = getStoredItem<WeeklyBranchReportRecord[]>('weekly_reports', prev);
              const merged = mergeCollection<WeeklyBranchReportRecord>('weeklyReports', cloudReports, stored);
              setStoredItem('weekly_reports', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubWeekly);

          // Real-time listener for casual/contingent employees with intelligent merge
          const unsubCasual = subscribeToCollection<CasualEmployee>('contingentEmployees', (cloudCasual) => {
            if (!mounted) return;
            setCasualEmployees((prev) => {
              const stored = getStoredItem<CasualEmployee[]>('casual_employees', prev);
              const merged = mergeCollection<CasualEmployee>('contingentEmployees', cloudCasual, stored);
              setStoredItem('casual_employees', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubCasual);

          // Real-time listener for branch transfers with intelligent merge
          const unsubTransfers = subscribeToCollection<BranchTransfer>('branchTransfers', (cloudTransfers) => {
            if (!mounted) return;
            setTransfers((prev) => {
              const stored = getStoredItem<BranchTransfer[]>('transfers', prev);
              const merged = mergeCollection<BranchTransfer>('branchTransfers', cloudTransfers, stored);
              setStoredItem('transfers', merged);
              return merged;
            });
          });
          unsubscribers.push(unsubTransfers);
        } else {
          setCloudStatus('offline');
        }
      } catch (err) {
        if (!mounted) return;
        console.warn('Firebase cloud init note:', err);
        setCloudStatus('offline');
      }
    }

    initCloudSync();

    // Cross-tab synchronization via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('norseen_sync_bus');
        channel.onmessage = (event) => {
          if (!mounted || !event.data) return;
          const { type, entity, data } = event.data;
          if (type === 'ENTITY_SYNC') {
            if (entity === 'employees') setEmployees(data);
            if (entity === 'users') setUsers(data);
            if (entity === 'branches') setBranches(data);
            if (entity === 'shifts') setShifts(data);
            if (entity === 'statuses') setEmploymentStatuses(data);
            if (entity === 'incidents') setIncidents(data);
            if (entity === 'requests') setRequests(data);
            if (entity === 'tasks') setTasks(data);
            if (entity === 'categories') setCategories(data);
            if (entity === 'main_sections') setMainSections(data);
            if (entity === 'sub_sections') setSubSections(data);
            if (entity === 'catalog_items') setCatalogItems(data);
            if (entity === 'purchase_orders') setPurchaseOrders(data);
            if (entity === 'weekly_reports') setWeeklyReports(data);
            if (entity === 'casual_employees') setCasualEmployees(data);
            if (entity === 'transfers') setTransfers(data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    return () => {
      mounted = false;
      unsubscribers.forEach((unsub) => {
        try { unsub(); } catch (_) {}
      });
      if (channel) {
        try { channel.close(); } catch (_) {}
      }
    };
  }, []);

  // Sync state changes to localStorage
  useEffect(() => { setStoredItem('branches', branches); }, [branches]);
  useEffect(() => { setStoredItem('shifts', shifts); }, [shifts]);
  useEffect(() => { setStoredItem('statuses', employmentStatuses); }, [employmentStatuses]);
  useEffect(() => { setStoredItem('employees', employees); }, [employees]);
  useEffect(() => { setStoredItem('users', users); }, [users]);
  useEffect(() => { setStoredItem('permissions', rolePermissions); }, [rolePermissions]);
  useEffect(() => { setStoredItem('incidents', incidents); }, [incidents]);
  useEffect(() => { setStoredItem('requests', requests); }, [requests]);
  useEffect(() => { setStoredItem('tasks', tasks); }, [tasks]);
  useEffect(() => { setStoredItem('categories', categories); }, [categories]);
  useEffect(() => { setStoredItem('main_sections', mainSections); }, [mainSections]);
  useEffect(() => { setStoredItem('sub_sections', subSections); }, [subSections]);
  useEffect(() => { setStoredItem('catalog_items', catalogItems); }, [catalogItems]);
  useEffect(() => { setStoredItem('purchase_orders', purchaseOrders); }, [purchaseOrders]);
  useEffect(() => { setStoredItem('weekly_reports', weeklyReports); }, [weeklyReports]);
  useEffect(() => { setStoredItem('casual_employees', casualEmployees); }, [casualEmployees]);
  useEffect(() => { setStoredItem('transfers', transfers); }, [transfers]);
  useEffect(() => { setSessionItem('current_user', currentUser); }, [currentUser]);
  useEffect(() => { setStoredItem('is_clean_db', isCleanDatabase); }, [isCleanDatabase]);

  // Self-heal corrupted categoryId/mainSectionId bindings (e.g. if 'all' was mistakenly saved)
  useEffect(() => {
    if (categories.length === 0) return;
    const validCatIds = new Set(categories.map((c) => c.id));
    const fallbackCatId = categories[0].id;

    setMainSections((prev) => {
      let changed = false;
      const healed = prev.map((m) => {
        if (!m.categoryId || m.categoryId === 'all' || !validCatIds.has(m.categoryId)) {
          changed = true;
          const fixed = { ...m, categoryId: fallbackCatId };
          saveDocToFirestore('mainSections', fixed).catch(console.error);
          return fixed;
        }
        return m;
      });
      return changed ? healed : prev;
    });
  }, [categories]);

  useEffect(() => {
    if (mainSections.length === 0) return;
    const validMainSecMap = new Map(mainSections.map((m) => [m.id, m]));
    const fallbackMainSec = mainSections[0];

    setSubSections((prev) => {
      let changed = false;
      const healed = prev.map((s) => {
        let needsFix = false;
        let newMainSecId = s.mainSectionId;
        let newCatId = s.categoryId;

        if (!s.mainSectionId || s.mainSectionId === 'all' || !validMainSecMap.has(s.mainSectionId)) {
          needsFix = true;
          newMainSecId = fallbackMainSec.id;
          newCatId = fallbackMainSec.categoryId;
        } else {
          const parent = validMainSecMap.get(s.mainSectionId);
          if (parent && s.categoryId !== parent.categoryId) {
            needsFix = true;
            newCatId = parent.categoryId;
          }
        }

        if (needsFix) {
          changed = true;
          const fixed = { ...s, mainSectionId: newMainSecId, categoryId: newCatId };
          saveDocToFirestore('subSections', fixed).catch(console.error);
          return fixed;
        }
        return s;
      });
      return changed ? healed : prev;
    });
  }, [mainSections]);

  // Determine if current user has unrestricted global access
  const isGlobalUser = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'system_admin' ||
      currentUser.role === 'hr' ||
      currentUser.assignedBranchIds.includes('*')
    );
  }, [currentUser]);

  // Branches assigned to the current user
  const userAssignedBranches = useMemo(() => {
    if (!currentUser) return [];
    if (isGlobalUser) {
      return branches.filter((b) => b.isActive);
    }
    return branches.filter((b) => b.isActive && currentUser.assignedBranchIds.includes(b.id));
  }, [branches, currentUser, isGlobalUser]);

  // Reset or adjust activeBranchFilter when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setActiveBranchFilter('all');
      return;
    }
    if (isGlobalUser) {
      setActiveBranchFilter('all');
    } else {
      if (currentUser.assignedBranchIds.length === 1) {
        setActiveBranchFilter(currentUser.assignedBranchIds[0]);
      } else {
        setActiveBranchFilter('all');
      }
    }
  }, [currentUser, isGlobalUser]);

  // Check if current user can access a specific branch
  const canAccessBranch = (branchId: string): boolean => {
    if (!currentUser) return false;
    if (isGlobalUser) return true;
    return currentUser.assignedBranchIds.includes(branchId);
  };

  // Check dynamic permissions
  const hasPermission = (permission: PermissionKey): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'system_admin') return true;

    if (currentUser.customPermissions && currentUser.customPermissions[permission] !== undefined) {
      return !!currentUser.customPermissions[permission];
    }

    const rolePerms = rolePermissions[currentUser.role];
    if (rolePerms && rolePerms[permission] !== undefined) {
      return rolePerms[permission];
    }

    return false;
  };

  // Scoped Data based on user role and branch filter
  const scopedEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!canAccessBranch(emp.branchId)) return false;
      if (activeBranchFilter !== 'all' && emp.branchId !== activeBranchFilter) return false;
      return true;
    });
  }, [employees, currentUser, activeBranchFilter, isGlobalUser]);

  const scopedCasualEmployees = useMemo(() => {
    return casualEmployees.filter((worker) => {
      if (!canAccessBranch(worker.branchId)) return false;
      if (activeBranchFilter !== 'all' && worker.branchId !== activeBranchFilter) return false;
      return true;
    });
  }, [casualEmployees, currentUser, activeBranchFilter, isGlobalUser]);

  const scopedIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (!canAccessBranch(inc.branchId)) return false;
      if (activeBranchFilter !== 'all' && inc.branchId !== activeBranchFilter) return false;
      return true;
    });
  }, [incidents, currentUser, activeBranchFilter, isGlobalUser]);

  const scopedRequests = useMemo(() => {
    return requests.filter((req) => {
      if (currentUser?.role === 'employee' && currentUser.employeeId) {
        return req.employeeId === currentUser.employeeId;
      }
      if (!canAccessBranch(req.branchId)) return false;
      if (activeBranchFilter !== 'all' && req.branchId !== activeBranchFilter) return false;
      return true;
    });
  }, [requests, currentUser, activeBranchFilter, isGlobalUser]);

  const scopedTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (isGlobalUser) {
        if (activeBranchFilter === 'all') return true;
        return (
          task.targetBranchIds.includes('*') ||
          task.targetBranchIds.includes(activeBranchFilter) ||
          task.targets.some((t) => t.branchId === activeBranchFilter)
        );
      }
      if (!currentUser) return false;
      const isTargetedUser = task.targets.some((t) => t.userId === currentUser.id);
      const isBranchTargeted =
        task.targetBranchIds.includes('*') ||
        task.targetBranchIds.some((bId) => currentUser.assignedBranchIds.includes(bId));
      const isRoleTargeted = task.targetRoles.includes(currentUser.role);
      return isTargetedUser || (isBranchTargeted && isRoleTargeted);
    });
  }, [tasks, currentUser, activeBranchFilter, isGlobalUser]);

  const scopedItems = useMemo(() => {
    return catalogItems.filter((item) => item.isActive);
  }, [catalogItems]);

  const scopedPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (isGlobalUser) {
        if (activeBranchFilter === 'all') return true;
        return po.sourceBranchId === activeBranchFilter || po.targetBranchId === activeBranchFilter;
      }
      if (!currentUser) return false;
      const userBranches = currentUser.assignedBranchIds;
      if (userBranches.includes('*')) return true;
      return (
        userBranches.includes(po.sourceBranchId) ||
        (po.targetBranchId && userBranches.includes(po.targetBranchId))
      );
    });
  }, [purchaseOrders, currentUser, activeBranchFilter, isGlobalUser]);

  const scopedTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (isGlobalUser || currentUser?.role === 'logistics_transport_officer') {
        if (activeBranchFilter === 'all') return true;
        return t.originBranchId === activeBranchFilter || t.destinationBranchId === activeBranchFilter;
      }
      if (!currentUser) return false;
      const userBranches = currentUser.assignedBranchIds;
      if (userBranches.includes('*')) {
        if (activeBranchFilter === 'all') return true;
        return t.originBranchId === activeBranchFilter || t.destinationBranchId === activeBranchFilter;
      }
      return (
        userBranches.includes(t.originBranchId) ||
        userBranches.includes(t.destinationBranchId)
      );
    });
  }, [transfers, currentUser, activeBranchFilter, isGlobalUser]);

  // Credentials Verification without immediate session commitment (for cinematic transitions)
  const verifyCredentials = (usernameOrCode: string, password?: string) => {
    if (!usernameOrCode || !usernameOrCode.trim()) {
      return { success: false, message: 'رمز المستخدم مطلوب لتسجيل الدخول' };
    }

    if (!password || !password.trim()) {
      return { success: false, message: 'كلمة المرور مطلوبة لتسجيل الدخول' };
    }

    const trimmed = usernameOrCode.trim().toLowerCase();
    const cleanPwd = password.trim();

    const user = users.find((u) => {
      const matchUsername = u.username.toLowerCase() === trimmed;
      const matchId = u.id.toLowerCase() === trimmed;
      const matchName = u.fullNameAr.trim().toLowerCase() === trimmed;
      const matchEmp = employees.find(
        (e) =>
          (e.id === u.employeeId || e.id === u.id) &&
          (e.jobId.toLowerCase() === trimmed || e.nationalId === trimmed)
      );
      return matchUsername || matchId || matchName || !!matchEmp;
    });

    if (!user) {
      return { success: false, message: 'رمز المستخدم غير مسجل بالمنظومة، يرجى التحقق وإعادة المحاولة' };
    }

    if (!user.isActive) {
      return { success: false, message: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة النظام' };
    }

    if (user.password !== cleanPwd) {
      return { success: false, message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
    }

    return { success: true, user };
  };

  // Authentication - Mandatory User Code & Password Verification
  const login = (usernameOrCode: string, password?: string) => {
    if (!usernameOrCode || !usernameOrCode.trim()) {
      return { success: false, message: 'رمز المستخدم مطلوب لتسجيل الدخول' };
    }

    if (!password || !password.trim()) {
      return { success: false, message: 'كلمة المرور مطلوبة لتسجيل الدخول' };
    }

    const trimmed = usernameOrCode.trim().toLowerCase();
    const cleanPwd = password.trim();

    const user = users.find((u) => {
      const matchUsername = u.username.toLowerCase() === trimmed;
      const matchId = u.id.toLowerCase() === trimmed;
      const matchName = u.fullNameAr.trim().toLowerCase() === trimmed;
      const matchEmp = employees.find(
        (e) =>
          (e.id === u.employeeId || e.id === u.id) &&
          (e.jobId.toLowerCase() === trimmed || e.nationalId === trimmed)
      );
      return matchUsername || matchId || matchName || !!matchEmp;
    });

    if (!user) {
      return { success: false, message: 'رمز المستخدم غير مسجل بالمنظومة، يرجى التحقق وإعادة المحاولة' };
    }

    if (!user.isActive) {
      return { success: false, message: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة النظام' };
    }

    if (user.password !== cleanPwd) {
      return { success: false, message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    saveDocToFirestore('users', updatedUser).catch(console.error);
    return { success: true };
  };

  const quickLoginAs = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      saveDocToFirestore('users', updatedUser).catch(console.error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + 'current_user');
      localStorage.removeItem(STORAGE_PREFIX + 'current_user');
    } catch (e) {
      console.error(e);
    }
  };

  // Employee CRUD with uniqueness validation and Operator Sync
  const addEmployee = (
    empData: Omit<Employee, 'id' | 'createdAt'>,
    createOperatorAccount?: boolean,
    operatorOptions?: { username?: string; password?: string; role?: UserRole }
  ) => {
    const cleanJobId = empData.jobId.trim();
    const cleanNationalId = empData.nationalId.trim();

    const existingJob = employees.find(
      (e) => e.jobId.toLowerCase() === cleanJobId.toLowerCase()
    );
    if (existingJob) {
      return {
        success: false,
        error: `الرقم الوظيفي (${cleanJobId}) مستخدم بالفعل للموظف: ${existingJob.nameAr}`,
      };
    }

    const existingNat = employees.find((e) => e.nationalId === cleanNationalId);
    if (existingNat) {
      return {
        success: false,
        error: `الرقم الوطني (${cleanNationalId}) مسجل مسبقاً للموظف: ${existingNat.nameAr}`,
      };
    }

    const newEmployee: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      jobId: cleanJobId,
      nationalId: cleanNationalId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    clearDeletedId(newEmployee.id);
    const newEmployees = [newEmployee, ...employees];
    setEmployees(newEmployees);
    setStoredItem('employees', newEmployees);
    broadcastEntitySync('employees', newEmployees);
    saveDocToFirestore('employees', newEmployee).catch(console.error);

    let createdUserId: string | undefined;

    // Optional or automatic operator user account creation
    if (createOperatorAccount || operatorOptions) {
      const baseUser = (operatorOptions?.username || cleanJobId.toLowerCase().replace(/[^a-z0-9]/g, '') || `usr${Date.now().toString().slice(-4)}`).trim();
      let uniqueUsername = baseUser;
      let counter = 1;
      while (users.some((u) => u.username.toLowerCase() === uniqueUsername.toLowerCase())) {
        uniqueUsername = `${baseUser}${counter++}`;
      }

      const assignedRole: UserRole = operatorOptions?.role || (
        empData.statusId in DEFAULT_ROLE_PERMISSIONS
          ? (empData.statusId as UserRole)
          : 'branch_manager'
      );

      const isGlobal = assignedRole === 'system_admin' || assignedRole === 'hr';
      const newOperator: UserAccount = {
        id: `usr-${Date.now()}`,
        username: uniqueUsername,
        fullNameAr: newEmployee.nameAr,
        password: operatorOptions?.password?.trim() || '123456',
        role: assignedRole,
        employeeId: newEmployee.id,
        assignedBranchIds: isGlobal ? ['*'] : [newEmployee.branchId],
        isActive: true,
        email: newEmployee.email || undefined,
      };

      clearDeletedId(newOperator.id);
      const newUsers = [...users, newOperator];
      setUsers(newUsers);
      setStoredItem('users', newUsers);
      broadcastEntitySync('users', newUsers);
      saveDocToFirestore('users', newOperator).catch(console.error);
      createdUserId = newOperator.id;
    }

    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true, createdUserId };
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    if (empData.jobId) {
      const cleanJobId = empData.jobId.trim().toLowerCase();
      const existingJob = employees.find(
        (e) => e.id !== id && e.jobId.toLowerCase() === cleanJobId
      );
      if (existingJob) {
        return { success: false, error: `الرقم الوظيفي (${empData.jobId}) مستخدم بالفعل لموظف آخر` };
      }
    }

    if (empData.nationalId) {
      const cleanNat = empData.nationalId.trim();
      const existingNat = employees.find((e) => e.id !== id && e.nationalId === cleanNat);
      if (existingNat) {
        return { success: false, error: `الرقم الوطني (${empData.nationalId}) مسجل لموظف آخر` };
      }
    }

    let updatedItem: Employee | undefined;
    const newEmployees = employees.map((e) => {
      if (e.id === id) {
        updatedItem = { ...e, ...empData };
        return updatedItem;
      }
      return e;
    });

    setEmployees(newEmployees);
    setStoredItem('employees', newEmployees);
    broadcastEntitySync('employees', newEmployees);

    if (updatedItem) {
      saveDocToFirestore('employees', updatedItem).catch(console.error);

      // Synchronize linked operator user account if present
      const linkedUser = users.find((u) => u.employeeId === id || u.id === id);
      if (linkedUser) {
        const isGlobal = linkedUser.role === 'system_admin' || linkedUser.role === 'hr';
        const updatedUser: UserAccount = {
          ...linkedUser,
          fullNameAr: updatedItem.nameAr,
          assignedBranchIds: isGlobal ? ['*'] : (updatedItem.branchId ? [updatedItem.branchId] : linkedUser.assignedBranchIds),
          email: updatedItem.email || linkedUser.email,
        };
        const newUsers = users.map((u) => (u.id === linkedUser.id ? updatedUser : u));
        setUsers(newUsers);
        setStoredItem('users', newUsers);
        broadcastEntitySync('users', newUsers);
        saveDocToFirestore('users', updatedUser).catch(console.error);
      }
    }

    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true };
  };

  const deleteEmployee = (id: string) => {
    recordDeletedId(id);
    const newEmployees = employees.filter((e) => e.id !== id);
    setEmployees(newEmployees);
    setStoredItem('employees', newEmployees);
    broadcastEntitySync('employees', newEmployees);
    deleteDocFromFirestore('employees', id).catch(console.error);

    // Unlink any operator accounts associated with this employee
    const newUsers = users.map((u) => {
      if (u.employeeId === id) {
        const unlinked = { ...u, employeeId: undefined };
        saveDocToFirestore('users', unlinked).catch(console.error);
        return unlinked;
      }
      return u;
    });
    setUsers(newUsers);
    setStoredItem('users', newUsers);
    broadcastEntitySync('users', newUsers);

    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true };
  };

  const importEmployees = (emps: (ParsedEmployeeRow | Omit<Employee, 'id' | 'createdAt'>)[]) => {
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    let currentEmployees = [...employees];
    let currentUsers = [...users];
    const modifiedEmpsToSave: Employee[] = [];
    const modifiedUsersToSave: UserAccount[] = [];

    const generateNextJobId = (list: Employee[]): string => {
      let maxNum = 100;
      list.forEach((e) => {
        const match = e.jobId.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum && n < 999999) maxNum = n;
        }
      });
      const candidate = `NRS-${maxNum + 1}`;
      if (!list.some((e) => e.jobId.toLowerCase() === candidate.toLowerCase())) {
        return candidate;
      }
      return `NRS-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    };

    emps.forEach((rawEmp, index) => {
      const emp = rawEmp as ParsedEmployeeRow;
      const rowNum = emp.rowNum || index + 2;

      const cleanName = emp.nameAr?.trim() || '';
      const normName = cleanName ? normalizeArabic(cleanName) : '';
      const cleanJobId = emp.jobId?.trim() || '';
      const cleanNatId = emp.nationalId?.trim() || '';

      if (!cleanName && !cleanJobId && !cleanNatId) {
        return;
      }

      // Check for existing employee:
      // Priority 1: Match by normalized full name (تحديث الأسماء الموجودة)
      let matchIdx = -1;
      if (normName) {
        matchIdx = currentEmployees.findIndex(
          (e) => normalizeArabic(e.nameAr) === normName
        );
      }

      // Priority 2: Match by Job ID if provided
      if (matchIdx === -1 && cleanJobId) {
        matchIdx = currentEmployees.findIndex(
          (e) => e.jobId.toLowerCase() === cleanJobId.toLowerCase()
        );
      }

      // Priority 3: Match by National ID if provided
      if (matchIdx === -1 && cleanNatId) {
        matchIdx = currentEmployees.findIndex(
          (e) => e.nationalId === cleanNatId
        );
      }

      // CASE 1: EXISTING EMPLOYEE -> UPDATE (UPSERT)
      if (matchIdx !== -1) {
        const existing = currentEmployees[matchIdx];

        // Check if provided jobId conflicts with ANOTHER employee
        let targetJobId = existing.jobId;
        if (cleanJobId && cleanJobId.toLowerCase() !== existing.jobId.toLowerCase()) {
          const conflict = currentEmployees.find(
            (e) => e.id !== existing.id && e.jobId.toLowerCase() === cleanJobId.toLowerCase()
          );
          if (conflict) {
            errors.push(
              `صف ${rowNum}: الرقم الوظيفي (${cleanJobId}) مستخدم لموظف آخر (${conflict.nameAr})، تم الاحتفاظ بالرقم الوظيفي الحالي (${existing.jobId}).`
            );
          } else {
            targetJobId = cleanJobId;
          }
        }

        // Check if provided nationalId conflicts with ANOTHER employee
        let targetNatId = existing.nationalId;
        if (cleanNatId && cleanNatId !== existing.nationalId) {
          const conflict = currentEmployees.find(
            (e) => e.id !== existing.id && e.nationalId === cleanNatId
          );
          if (conflict) {
            errors.push(
              `صف ${rowNum}: الرقم الوطني (${cleanNatId}) مسجل لموظف آخر (${conflict.nameAr})، تم الاحتفاظ بالرقم الوطني الحالي.`
            );
          } else {
            targetNatId = cleanNatId;
          }
        }

        // Apply non-empty updates (ignore empty Excel cells to preserve existing data)
        const updatedEmp: Employee = {
          ...existing,
          nameAr: cleanName || existing.nameAr,
          jobId: targetJobId,
          nationalId: targetNatId,
          birthYear: emp.birthYear !== undefined ? emp.birthYear : existing.birthYear,
          startDate: emp.startDate || existing.startDate,
          vacationBalance: emp.vacationBalance !== undefined ? emp.vacationBalance : existing.vacationBalance,
          branchId: emp.branchId || existing.branchId,
          shift: (emp.shift as any) || existing.shift,
          statusId: (emp.statusId as any) || existing.statusId,
          phone: emp.phone !== undefined ? emp.phone : existing.phone,
          email: emp.email !== undefined ? emp.email : existing.email,
          notes: emp.notes !== undefined ? emp.notes : existing.notes,
        };

        currentEmployees[matchIdx] = updatedEmp;
        modifiedEmpsToSave.push(updatedEmp);
        updatedCount++;

        // Sync linked operator account if present
        const linkedUserIdx = currentUsers.findIndex((u) => u.employeeId === existing.id || u.id === existing.id);
        if (linkedUserIdx !== -1) {
          const linkedUser = currentUsers[linkedUserIdx];
          const isGlobal = linkedUser.role === 'system_admin' || linkedUser.role === 'hr';
          const updatedUser: UserAccount = {
            ...linkedUser,
            fullNameAr: updatedEmp.nameAr,
            assignedBranchIds: isGlobal ? ['*'] : (updatedEmp.branchId ? [updatedEmp.branchId] : linkedUser.assignedBranchIds),
            email: updatedEmp.email || linkedUser.email,
          };
          currentUsers[linkedUserIdx] = updatedUser;
          modifiedUsersToSave.push(updatedUser);
        }
      } else {
        // CASE 2: NEW EMPLOYEE -> INSERT
        let finalJobId = cleanJobId;
        if (!finalJobId) {
          finalJobId = generateNextJobId(currentEmployees);
        } else {
          const conflict = currentEmployees.find(
            (e) => e.jobId.toLowerCase() === finalJobId.toLowerCase()
          );
          if (conflict) {
            const altJobId = generateNextJobId(currentEmployees);
            errors.push(
              `صف ${rowNum}: الرقم الوظيفي (${finalJobId}) مكرر، تم تخصيص رقم وظيفي جديد تلقائياً (${altJobId}).`
            );
            finalJobId = altJobId;
          }
        }

        let finalNatId = cleanNatId;
        if (!finalNatId) {
          finalNatId = `2000${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 899 + 100)}`;
        } else {
          const conflict = currentEmployees.find((e) => e.nationalId === finalNatId);
          if (conflict) {
            const altNatId = `2000${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 899 + 100)}`;
            errors.push(
              `صف ${rowNum}: الرقم الوطني (${finalNatId}) مكرر، تم اعتماد معرف وطني فريد بديل.`
            );
            finalNatId = altNatId;
          }
        }

        const newEmp: Employee = {
          id: `emp-imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          nameAr: cleanName || `موظف جديد ${finalJobId}`,
          jobId: finalJobId,
          nationalId: finalNatId,
          birthYear: emp.birthYear,
          startDate: emp.startDate || new Date().toISOString().split('T')[0],
          vacationBalance: emp.vacationBalance !== undefined ? emp.vacationBalance : 21,
          branchId: emp.branchId || branches[0]?.id || 'b-jaraba',
          shift: (emp.shift as any) || shifts[0]?.id || 'morning',
          statusId: (emp.statusId as any) || employmentStatuses[0]?.id || 'sales_agent',
          phone: emp.phone || '',
          email: emp.email || '',
          notes: emp.notes || '',
          createdAt: new Date().toISOString().split('T')[0],
        };

        currentEmployees.unshift(newEmp);
        modifiedEmpsToSave.push(newEmp);
        addedCount++;
      }
    });

    if (addedCount > 0 || updatedCount > 0) {
      setEmployees(currentEmployees);
      setStoredItem('employees', currentEmployees);
      broadcastEntitySync('employees', currentEmployees);

      if (modifiedUsersToSave.length > 0) {
        setUsers(currentUsers);
        setStoredItem('users', currentUsers);
        broadcastEntitySync('users', currentUsers);
        modifiedUsersToSave.forEach((u) => saveDocToFirestore('users', u).catch(console.error));
      }

      modifiedEmpsToSave.forEach((item) => saveDocToFirestore('employees', item).catch(console.error));
      setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    }

    return { addedCount, updatedCount, errors };
  };

  // Incident Actions
  const addIncident = (rec: {
    employeeId: string;
    type: 'absence' | 'delay';
    date: string;
    delayDurationMinutes?: number;
    arrivalTime?: string;
    reasonAr?: string;
    isExcused: boolean;
  }) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    if (!emp) return { success: false, error: 'الموظف المحدد غير موجود' };

    const newRec: IncidentRecord = {
      ...rec,
      id: `inc-${Date.now()}`,
      employeeNameAr: emp.nameAr,
      jobId: emp.jobId,
      branchId: emp.branchId,
      recordedByUserId: currentUser?.id || 'sys',
      recordedByName: currentUser?.fullNameAr || 'مدير النظام',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setIncidents((prev) => [newRec, ...prev]);
    saveDocToFirestore('incidents', newRec).catch(console.error);
    return { success: true };
  };

  const deleteIncident = (id: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    deleteDocFromFirestore('incidents', id).catch(console.error);
    return { success: true };
  };

  // Request Actions
  const createRequest = (req: {
    employeeId: string;
    type: RequestType;
    startDate?: string;
    endDate?: string;
    exitTime?: string;
    delayDurationMinutes?: number;
    vacationType?: 'annual' | 'sick' | 'emergency' | 'unpaid';
    reasonAr: string;
    targetBranchId?: string;
    targetShift?: WorkShiftType | string;
    effectiveDate?: string;
  }) => {
    const emp = employees.find((e) => e.id === req.employeeId);
    if (!emp) return { success: false, error: 'الموظف غير موجود في السجل' };

    if (req.type === 'transfer') {
      if (!req.targetBranchId) {
        return { success: false, error: 'يرجى اختيار الفرع المراد النقل إليه' };
      }
      if (req.targetBranchId === emp.branchId) {
        return { success: false, error: 'الموظف مسجل بالفعل في هذا الفرع. يرجى اختيار فرع مختلف لنقله إليه.' };
      }
    }

    const fromBranch = branches.find((b) => b.id === emp.branchId);
    const targetBranch = req.targetBranchId ? branches.find((b) => b.id === req.targetBranchId) : undefined;

    const newReq: EmployeeRequest = {
      ...req,
      id: `req-${Date.now()}`,
      employeeNameAr: emp.nameAr,
      jobId: emp.jobId,
      branchId: emp.branchId,
      fromBranchId: emp.branchId,
      fromBranchNameAr: fromBranch?.nameAr || emp.branchId,
      targetBranchId: req.targetBranchId,
      targetBranchNameAr: targetBranch?.nameAr || req.targetBranchId,
      targetShift: req.targetShift,
      effectiveDate: req.effectiveDate || req.startDate,
      status: 'pending',
      submissionDate: new Date().toISOString().split('T')[0],
    };

    setRequests((prev) => [newReq, ...prev]);
    saveDocToFirestore('requests', newReq).catch(console.error);
    return { success: true };
  };

  const reviewRequest = (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    let updatedReq: EmployeeRequest | undefined;
    setRequests((prev) =>
      prev.map((r): EmployeeRequest => {
        if (r.id === requestId) {
          const updated: EmployeeRequest = {
            ...r,
            status,
            reviewDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            reviewedByUserId: currentUser?.id,
            reviewedByName: currentUser?.fullNameAr,
            reviewNotesAr: notes,
          };
          updatedReq = updated;
          return updated;
        }
        return r;
      })
    );

    if (updatedReq) {
      saveDocToFirestore('requests', updatedReq).catch(console.error);

      // AUTOMATIC TRANSFER EXECUTION UPON APPROVAL
      if (status === 'approved' && updatedReq.type === 'transfer' && updatedReq.targetBranchId) {
        updateEmployee(updatedReq.employeeId, {
          branchId: updatedReq.targetBranchId,
          ...(updatedReq.targetShift ? { shift: updatedReq.targetShift } : {}),
        });
      }

      // AUTOMATIC VACATION BALANCE DEDUCTION UPON APPROVAL
      if (status === 'approved' && updatedReq.type === 'vacation' && updatedReq.vacationType === 'annual' && updatedReq.startDate && updatedReq.endDate) {
        const start = new Date(updatedReq.startDate);
        const end = new Date(updatedReq.endDate);
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
        const emp = employees.find((e) => e.id === updatedReq!.employeeId);
        if (emp && emp.vacationBalance > 0) {
          updateEmployee(emp.id, {
            vacationBalance: Math.max(0, emp.vacationBalance - days),
          });
        }
      }
    }
  };

  // Task Actions
  const createTask = (data: {
    titleAr: string;
    descriptionAr: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetRoles: UserRole[];
    targetBranchIds: string[];
    dueDate: string;
  }) => {
    const targets: TaskTargetUser[] = [];
    users.forEach((u) => {
      if (!u.isActive) return;
      const roleMatch = data.targetRoles.includes(u.role);
      const branchMatch =
        data.targetBranchIds.includes('*') ||
        u.assignedBranchIds.includes('*') ||
        u.assignedBranchIds.some((bId) => data.targetBranchIds.includes(bId));

      if (roleMatch && branchMatch) {
        const uBranch = branches.find((b) => b.id === u.assignedBranchIds[0]) || branches[0];
        targets.push({
          userId: u.id,
          userNameAr: u.fullNameAr,
          userRole: u.role,
          branchId: uBranch ? uBranch.id : 'br-tripoli',
          branchNameAr: uBranch ? uBranch.nameAr : 'المقر الرئيسي',
          isCompleted: false,
        });
      }
    });

    const newTask: EnterpriseTask = {
      ...data,
      id: `task-${Date.now()}`,
      createdByUserId: currentUser?.id || 'usr-admin',
      createdByName: currentUser?.fullNameAr || 'مدير النظام',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      targets,
      completionRate: 0,
      isArchived: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    saveDocToFirestore('tasks', newTask).catch(console.error);
    return { success: true };
  };

  const toggleTaskCompletion = (taskId: string, notes?: string) => {
    if (!currentUser) return;
    let updatedTask: EnterpriseTask | undefined;

    setTasks((prev) =>
      prev.map((task): EnterpriseTask => {
        if (task.id !== taskId) return task;
        const updatedTargets = task.targets.map((t) => {
          if (t.userId === currentUser.id) {
            const willComplete = !t.isCompleted;
            return {
              ...t,
              isCompleted: willComplete,
              completedAt: willComplete
                ? new Date().toISOString().replace('T', ' ').substring(0, 16)
                : undefined,
              completionNotesAr: notes || t.completionNotesAr,
            };
          }
          return t;
        });

        const completedCount = updatedTargets.filter((t) => t.isCompleted).length;
        const completionRate =
          updatedTargets.length > 0
            ? Math.round((completedCount / updatedTargets.length) * 100)
            : 0;

        const updated: EnterpriseTask = {
          ...task,
          targets: updatedTargets,
          completionRate,
          isArchived: completionRate === 100,
        };
        updatedTask = updated;
        return updated;
      })
    );

    if (updatedTask) {
      saveDocToFirestore('tasks', updatedTask).catch(console.error);
    }
  };

  const toggleTaskArchive = (taskId: string) => {
    let updated: EnterpriseTask | undefined;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          updated = { ...t, isArchived: !t.isArchived };
          return updated;
        }
        return t;
      })
    );
    if (updated) {
      saveDocToFirestore('tasks', updated).catch(console.error);
    }
  };

  const deleteTask = (taskId: string) => {
    recordDeletedId(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    deleteDocFromFirestore('tasks', taskId).catch(console.error);
  };

  // User & Permission Actions with Employee Synchronization
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const existing = users.find(
      (u) => u.username.toLowerCase() === userData.username.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'اسم المستخدم مسجل مسبقاً' };
    }

    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
    };

    clearDeletedId(newUser.id);
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    setStoredItem('users', newUsers);
    broadcastEntitySync('users', newUsers);
    saveDocToFirestore('users', newUser).catch(console.error);

    // If linked to an employee, synchronize employee's email or branch if needed
    if (newUser.employeeId) {
      const linkedEmp = employees.find((e) => e.id === newUser.employeeId);
      if (linkedEmp) {
        const needsBranchSync =
          newUser.assignedBranchIds.length === 1 &&
          newUser.assignedBranchIds[0] !== '*' &&
          linkedEmp.branchId !== newUser.assignedBranchIds[0];

        if (needsBranchSync) {
          const updatedEmp: Employee = {
            ...linkedEmp,
            branchId: newUser.assignedBranchIds[0],
          };
          const newEmps = employees.map((e) => (e.id === linkedEmp.id ? updatedEmp : e));
          setEmployees(newEmps);
          setStoredItem('employees', newEmps);
          broadcastEntitySync('employees', newEmps);
          saveDocToFirestore('employees', updatedEmp).catch(console.error);
        }
      }
    }

    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true };
  };

  const updateUser = (id: string, userData: Partial<UserAccount>) => {
    let updated: UserAccount | undefined;
    const newUsers = users.map((u) => {
      if (u.id === id) {
        updated = { ...u, ...userData };
        return updated;
      }
      return u;
    });

    setUsers(newUsers);
    setStoredItem('users', newUsers);
    broadcastEntitySync('users', newUsers);

    if (updated) {
      saveDocToFirestore('users', updated).catch(console.error);

      // If linked to employee, synchronize employee name or branch
      if (updated.employeeId && updated.fullNameAr) {
        const linkedEmp = employees.find((e) => e.id === updated!.employeeId);
        if (linkedEmp && (linkedEmp.nameAr !== updated.fullNameAr)) {
          const updatedEmp: Employee = {
            ...linkedEmp,
            nameAr: updated.fullNameAr,
          };
          const newEmps = employees.map((e) => (e.id === linkedEmp.id ? updatedEmp : e));
          setEmployees(newEmps);
          setStoredItem('employees', newEmps);
          broadcastEntitySync('employees', newEmps);
          saveDocToFirestore('employees', updatedEmp).catch(console.error);
        }
      }
    }
    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true };
  };

  const deleteUser = (id: string) => {
    if (id === 'usr-admin') {
      return { success: false, error: 'لا يمكن حذف حساب مدير النظام الرئيسي' };
    }
    recordDeletedId(id);
    const newUsers = users.filter((u) => u.id !== id);
    setUsers(newUsers);
    setStoredItem('users', newUsers);
    broadcastEntitySync('users', newUsers);
    deleteDocFromFirestore('users', id).catch(console.error);
    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true };
  };

  const updateRolePermission = (role: UserRole, key: PermissionKey, value: boolean) => {
    setRolePermissions((prev) => {
      const roleObj = { ...(prev[role] || {}) };
      roleObj[key] = value;
      const updated = { ...prev, [role]: roleObj };
      setStoredItem('permissions', updated);
      broadcastEntitySync('permissions', updated);
      saveDocToFirestore('systemSettings', { id: 'rolePermissions', value: JSON.stringify(updated) }).catch(console.error);
      return updated;
    });
  };

  const updateUserPermissionOverride = (
    userId: string,
    key: PermissionKey,
    value: boolean | undefined
  ) => {
    let updatedUser: UserAccount | undefined;
    const newUsers = users.map((u) => {
      if (u.id === userId) {
        const overrides = { ...(u.customPermissions || {}) };
        if (value === undefined) {
          delete overrides[key];
        } else {
          overrides[key] = value;
        }
        updatedUser = { ...u, customPermissions: overrides };
        return updatedUser;
      }
      return u;
    });
    setUsers(newUsers);
    setStoredItem('users', newUsers);
    broadcastEntitySync('users', newUsers);
    if (updatedUser) {
      saveDocToFirestore('users', updatedUser).catch(console.error);
    }
  };

  const resetRolePermissionsToDefault = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setStoredItem('permissions', DEFAULT_ROLE_PERMISSIONS);
    broadcastEntitySync('permissions', DEFAULT_ROLE_PERMISSIONS);
    saveDocToFirestore('systemSettings', {
      id: 'rolePermissions',
      value: JSON.stringify(DEFAULT_ROLE_PERMISSIONS),
    }).catch(console.error);
  };

  const updateCurrentUserProfile = async (profileData: {
    fullNameAr?: string;
    avatarUrl?: string;
    password?: string;
    email?: string;
    emailNotificationsEnabled?: boolean;
  }) => {
    if (!currentUser) return { success: false, error: 'لم يتم العثور على جلسة مستخدم نشطة' };

    const updatedUser: UserAccount = {
      ...currentUser,
      ...(profileData.fullNameAr !== undefined && { fullNameAr: profileData.fullNameAr.trim() }),
      ...(profileData.avatarUrl !== undefined && { avatarUrl: profileData.avatarUrl }),
      ...(profileData.password !== undefined && { password: profileData.password.trim() }),
      ...(profileData.email !== undefined && { email: profileData.email.trim() }),
      ...(profileData.emailNotificationsEnabled !== undefined && { emailNotificationsEnabled: profileData.emailNotificationsEnabled }),
    };

    setCurrentUser(updatedUser);
    const newUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
    setUsers(newUsers);
    setStoredItem('users', newUsers);
    broadcastEntitySync('users', newUsers);

    // Also sync linked employee record if present
    if (currentUser.employeeId) {
      const newEmps = employees.map((emp) => {
        if (emp.id === currentUser.employeeId) {
          const updatedEmp = {
            ...emp,
            ...(profileData.fullNameAr && { nameAr: profileData.fullNameAr.trim() }),
            ...(profileData.email && { email: profileData.email.trim() }),
          };
          saveDocToFirestore('employees', updatedEmp).catch(console.error);
          return updatedEmp;
        }
        return emp;
      });
      setEmployees(newEmps);
      setStoredItem('employees', newEmps);
      broadcastEntitySync('employees', newEmps);
    }

    try {
      await saveDocToFirestore('users', updatedUser);
      return { success: true };
    } catch (err) {
      console.error('Error saving profile to Firestore:', err);
      return { success: true };
    }
  };

  // Settings Actions with Branch Manager Sync
  const addBranch = (branchData: Omit<Branch, 'id'>) => {
    const existing = branches.find(
      (b) => b.code.toLowerCase() === branchData.code.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'كود الفرع مستخدم مسبقاً' };
    }
    const newBranch: Branch = {
      ...branchData,
      id: `br-${Date.now()}`,
    };
    const newBranches = [...branches, newBranch];
    setBranches(newBranches);
    setStoredItem('branches', newBranches);
    broadcastEntitySync('branches', newBranches);
    saveDocToFirestore('branches', newBranch).catch(console.error);

    // If a manager was selected on branch creation, synchronize the employee record
    if (newBranch.managerEmployeeId) {
      const targetEmp = employees.find((e) => e.id === newBranch.managerEmployeeId);
      if (targetEmp) {
        const updatedEmp: Employee = {
          ...targetEmp,
          branchId: newBranch.id,
          statusId: 'branch_manager',
        };
        const newEmps = employees.map((e) => (e.id === targetEmp.id ? updatedEmp : e));
        setEmployees(newEmps);
        setStoredItem('employees', newEmps);
        broadcastEntitySync('employees', newEmps);
        saveDocToFirestore('employees', updatedEmp).catch(console.error);
      }
    }

    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
    return { success: true };
  };

  const updateBranch = (id: string, branchData: Partial<Branch>) => {
    let updated: Branch | undefined;
    const newBranches = branches.map((b) => {
      if (b.id === id) {
        updated = { ...b, ...branchData };
        return updated;
      }
      return b;
    });

    setBranches(newBranches);
    setStoredItem('branches', newBranches);
    broadcastEntitySync('branches', newBranches);

    if (updated) {
      saveDocToFirestore('branches', updated).catch(console.error);

      // If branch manager is assigned, synchronize employee registry and user account!
      if (branchData.managerEmployeeId) {
        const targetEmp = employees.find((e) => e.id === branchData.managerEmployeeId);
        if (targetEmp) {
          const updatedEmp: Employee = {
            ...targetEmp,
            branchId: id,
            statusId: 'branch_manager',
          };
          const newEmps = employees.map((e) => (e.id === targetEmp.id ? updatedEmp : e));
          setEmployees(newEmps);
          setStoredItem('employees', newEmps);
          broadcastEntitySync('employees', newEmps);
          saveDocToFirestore('employees', updatedEmp).catch(console.error);

          // Also synchronize linked user account if any
          const linkedUser = users.find((u) => u.employeeId === targetEmp.id || u.id === targetEmp.id);
          if (linkedUser) {
            const updatedUser: UserAccount = {
              ...linkedUser,
              role: 'branch_manager',
              assignedBranchIds: [id],
            };
            const newUsers = users.map((u) => (u.id === linkedUser.id ? updatedUser : u));
            setUsers(newUsers);
            setStoredItem('users', newUsers);
            broadcastEntitySync('users', newUsers);
            saveDocToFirestore('users', updatedUser).catch(console.error);
          }
        }
      }
    }
    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
  };

  const toggleBranchStatus = (id: string) => {
    let updated: Branch | undefined;
    const newBranches = branches.map((b) => {
      if (b.id === id) {
        updated = { ...b, isActive: !b.isActive };
        return updated;
      }
      return b;
    });

    setBranches(newBranches);
    setStoredItem('branches', newBranches);
    broadcastEntitySync('branches', newBranches);
    if (updated) {
      saveDocToFirestore('branches', updated).catch(console.error);
    }
    setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
  };

  const addShift = (shift: ShiftConfig) => {
    setShifts((prev) => [...prev, shift]);
    saveDocToFirestore('shifts', shift).catch(console.error);
  };

  const updateShift = (id: string, shiftData: Partial<ShiftConfig>) => {
    let updated: ShiftConfig | undefined;
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updated = { ...s, ...shiftData };
          return updated;
        }
        return s;
      })
    );
    if (updated) {
      saveDocToFirestore('shifts', updated).catch(console.error);
    }
  };

  const addEmploymentStatus = (status: EmploymentStatusConfig) => {
    setEmploymentStatuses((prev) => [...prev, status]);
    saveDocToFirestore('employmentStatuses', status).catch(console.error);
  };

  const updateEmploymentStatus = (id: string, statusData: Partial<EmploymentStatusConfig>) => {
    let updated: EmploymentStatusConfig | undefined;
    setEmploymentStatuses((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updated = { ...s, ...statusData };
          return updated;
        }
        return s;
      })
    );
    if (updated) {
      saveDocToFirestore('employmentStatuses', updated).catch(console.error);
    }
  };

  // 3-Tier Hierarchy Actions
  const addCategory = (catData: Omit<ItemCategory, 'id'>) => {
    const existing = categories.find(
      (c) => c.code.toLowerCase() === catData.code.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'كود الفئة مستخدم مسبقاً' };
    }
    const newCat: ItemCategory = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
    saveDocToFirestore('categories', newCat).catch(console.error);
    return { success: true };
  };

  const updateCategory = (id: string, catData: Partial<ItemCategory>) => {
    let updated: ItemCategory | undefined;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...catData };
          return updated;
        }
        return c;
      })
    );
    if (updated) {
      saveDocToFirestore('categories', updated).catch(console.error);
    }
  };

  const deleteCategory = (id: string) => {
    recordDeletedId(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    deleteDocFromFirestore('categories', id).catch(console.error);
    return { success: true };
  };

  const addMainSection = (secData: Omit<MainSection, 'id'>) => {
    const validCatId =
      secData.categoryId && secData.categoryId !== 'all' && categories.some((c) => c.id === secData.categoryId)
        ? secData.categoryId
        : categories[0]?.id || 'cat-it';

    const newSec: MainSection = {
      ...secData,
      categoryId: validCatId,
      id: `msec-${Date.now()}`,
    };
    clearDeletedId(newSec.id);
    setMainSections((prev) => [...prev, newSec]);
    saveDocToFirestore('mainSections', newSec).catch(console.error);
    return { success: true };
  };

  const updateMainSection = (id: string, secData: Partial<MainSection>) => {
    let updated: MainSection | undefined;
    setMainSections((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const categoryId =
            secData.categoryId && secData.categoryId !== 'all' ? secData.categoryId : s.categoryId;
          updated = { ...s, ...secData, categoryId };
          return updated;
        }
        return s;
      })
    );
    if (updated) {
      saveDocToFirestore('mainSections', updated).catch(console.error);
    }
  };

  const deleteMainSection = (id: string) => {
    recordDeletedId(id);
    setMainSections((prev) => prev.filter((s) => s.id !== id));
    deleteDocFromFirestore('mainSections', id).catch(console.error);
    return { success: true };
  };

  const addSubSection = (subData: Omit<SubSection, 'id'>) => {
    const parentMain = mainSections.find((m) => m.id === subData.mainSectionId);
    const validMainSecId = parentMain ? parentMain.id : mainSections[0]?.id || 'msec-pos';
    const validCatId = parentMain?.categoryId && parentMain.categoryId !== 'all'
      ? parentMain.categoryId
      : (subData.categoryId && subData.categoryId !== 'all' ? subData.categoryId : categories[0]?.id || 'cat-it');

    const newSub: SubSection = {
      ...subData,
      mainSectionId: validMainSecId,
      categoryId: validCatId,
      id: `ssec-${Date.now()}`,
    };
    clearDeletedId(newSub.id);
    setSubSections((prev) => [...prev, newSub]);
    saveDocToFirestore('subSections', newSub).catch(console.error);
    return { success: true };
  };

  const updateSubSection = (id: string, subData: Partial<SubSection>) => {
    let updated: SubSection | undefined;
    setSubSections((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const mainSectionId =
            subData.mainSectionId && subData.mainSectionId !== 'all'
              ? subData.mainSectionId
              : s.mainSectionId;
          const parentMain = mainSections.find((m) => m.id === mainSectionId);
          const categoryId = parentMain?.categoryId || s.categoryId;

          updated = { ...s, ...subData, mainSectionId, categoryId };
          return updated;
        }
        return s;
      })
    );
    if (updated) {
      saveDocToFirestore('subSections', updated).catch(console.error);
    }
  };

  const deleteSubSection = (id: string) => {
    recordDeletedId(id);
    setSubSections((prev) => prev.filter((s) => s.id !== id));
    deleteDocFromFirestore('subSections', id).catch(console.error);
    return { success: true };
  };

  // Catalog Item & Multi-Branch Inventory Actions
  const addCatalogItem = (itemData: Omit<CatalogItem, 'id' | 'createdAt'>) => {
    const existing = catalogItems.find(
      (i) => i.code.toLowerCase() === itemData.code.trim().toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'كود الصنف (SKU) مستخدم مسبقاً' };
    }
    const newItem: CatalogItem = {
      ...itemData,
      id: `itm-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    clearDeletedId(newItem.id);
    setCatalogItems((prev) => [newItem, ...prev]);
    saveDocToFirestore('catalogItems', newItem).catch(console.error);
    return { success: true };
  };

  const updateCatalogItem = (id: string, itemData: Partial<CatalogItem>) => {
    let updated: CatalogItem | undefined;
    setCatalogItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updated = { ...item, ...itemData };
          return updated;
        }
        return item;
      })
    );
    if (updated) {
      saveDocToFirestore('catalogItems', updated).catch(console.error);
    }
    return { success: true };
  };

  const deleteCatalogItem = (id: string) => {
    recordDeletedId(id);
    setCatalogItems((prev) => prev.filter((i) => i.id !== id));
    deleteDocFromFirestore('catalogItems', id).catch(console.error);
    return { success: true };
  };

  const updateItemStock = (itemId: string, branchId: string, quantity: number) => {
    let updatedItem: CatalogItem | undefined;
    setCatalogItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedStock = { ...item.branchStock, [branchId]: Math.max(0, quantity) };
          updatedItem = { ...item, branchStock: updatedStock };
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) {
      saveDocToFirestore('catalogItems', updatedItem).catch(console.error);
    }
  };

  // Purchasing & Storefront Actions
  const createPurchaseOrder = (data: {
    itemId: string;
    quantity: number;
    sourceBranchId: string;
    targetBranchId?: string;
    notesAr?: string;
  }) => {
    const item = catalogItems.find((i) => i.id === data.itemId);
    if (!item) return { success: false, error: 'الصنف غير موجود' };

    const currentStock = item.branchStock[data.sourceBranchId] || 0;
    if (data.quantity > currentStock) {
      return {
        success: false,
        error: `الكمية المطلوبة (${data.quantity}) تتجاوز المخزون المتاح في الفرع (${currentStock})`,
      };
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const orderNumber = `PO-${todayStr}-${randNum}`;

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      itemId: item.id,
      itemNameAr: item.nameAr,
      itemCode: item.code,
      price: item.basePrice,
      quantity: data.quantity,
      totalPrice: item.basePrice * data.quantity,
      sourceBranchId: data.sourceBranchId,
      targetBranchId: data.targetBranchId,
      requestedByUserId: currentUser?.id || 'usr-admin',
      requestedByName: currentUser?.fullNameAr || 'مدير النظام',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
      notesAr: data.notesAr,
    };

    // Deduct stock from source branch
    const updatedStock = {
      ...item.branchStock,
      [data.sourceBranchId]: currentStock - data.quantity,
    };
    const updatedItem = { ...item, branchStock: updatedStock };

    setCatalogItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    setPurchaseOrders((prev) => [newOrder, ...prev]);

    saveDocToFirestore('catalogItems', updatedItem).catch(console.error);
    saveDocToFirestore('purchaseOrders', newOrder).catch(console.error);

    return { success: true, orderNumber };
  };

  const updatePurchaseOrderStatus = (orderId: string, status: PurchaseOrderStatus) => {
    let updated: PurchaseOrder | undefined;
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === orderId) {
          updated = { ...po, status };
          return updated;
        }
        return po;
      })
    );
    if (updated) {
      saveDocToFirestore('purchaseOrders', updated).catch(console.error);
    }
  };

  // Weekly Branch Report Actions
  const approveWeeklyReport = (data: {
    branchId: string;
    branchNameAr: string;
    yearWeek: string;
    weekStartDate: string;
    weekEndDate: string;
    approvalNotesAr?: string;
  }) => {
    const reportId = `wrep-${data.branchId}-${data.yearWeek}`;
    const stampCode = `NORSEEN-CERT-${data.yearWeek}-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = weeklyReports.find((r) => r.id === reportId);
    const newRecord: WeeklyBranchReportRecord = {
      id: reportId,
      branchId: data.branchId,
      branchNameAr: data.branchNameAr,
      yearWeek: data.yearWeek,
      weekStartDate: data.weekStartDate,
      weekEndDate: data.weekEndDate,
      isApproved: true,
      approvedByUserId: currentUser?.id,
      approvedByNameAr: currentUser?.fullNameAr || 'مدير الفرع',
      approvedByRole: currentUser?.role,
      approvedAt: new Date().toISOString(),
      approvalNotesAr: data.approvalNotesAr,
      managerSignatureTitle: 'اعتماد مدير الفرع',
      digitalStampCode: stampCode,
      evaluations: existing ? existing.evaluations : {},
      updatedAt: new Date().toISOString(),
    };

    const nextList = weeklyReports.filter((r) => r.id !== reportId).concat(newRecord);
    setWeeklyReports(nextList);
    setStoredItem('weekly_reports', nextList);
    broadcastEntitySync('weekly_reports', nextList);
    saveDocToFirestore('weeklyReports', newRecord).catch(console.error);

    return { success: true };
  };

  const updateWeeklyEvaluation = (
    branchId: string,
    yearWeek: string,
    employeeId: string,
    rating: WeeklyEvaluationRating,
    note?: string
  ) => {
    const reportId = `wrep-${branchId}-${yearWeek}`;
    const branchObj = branches.find((b) => b.id === branchId);

    setWeeklyReports((prev) => {
      const existing = prev.find((r) => r.id === reportId);
      const evalObj: WeeklyEmployeeEvaluation = {
        rating,
        note,
        evaluatedByUserId: currentUser?.id,
        evaluatedByNameAr: currentUser?.fullNameAr,
        evaluatedAt: new Date().toISOString(),
      };

      let updatedReport: WeeklyBranchReportRecord;
      if (existing) {
        updatedReport = {
          ...existing,
          evaluations: {
            ...existing.evaluations,
            [employeeId]: evalObj,
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedReport = {
          id: reportId,
          branchId,
          branchNameAr: branchObj?.nameAr || branchId,
          yearWeek,
          weekStartDate: '',
          weekEndDate: '',
          isApproved: false,
          managerSignatureTitle: 'اعتماد مدير الفرع',
          evaluations: {
            [employeeId]: evalObj,
          },
          updatedAt: new Date().toISOString(),
        };
      }

      const nextList = prev.filter((r) => r.id !== reportId).concat(updatedReport);
      saveDocToFirestore('weeklyReports', updatedReport).catch(console.error);
      setStoredItem('weekly_reports', nextList);
      broadcastEntitySync('weekly_reports', nextList);
      return nextList;
    });
  };

  const unapproveWeeklyReport = (reportId: string) => {
    setWeeklyReports((prev) => {
      const updated = prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              isApproved: false,
              approvedAt: undefined,
              approvedByUserId: undefined,
              approvedByNameAr: undefined,
              digitalStampCode: undefined,
            }
          : r
      );
      const target = updated.find((r) => r.id === reportId);
      if (target) {
        saveDocToFirestore('weeklyReports', target).catch(console.error);
      }
      setStoredItem('weekly_reports', updated);
      broadcastEntitySync('weekly_reports', updated);
      return updated;
    });
  };

  // Casual Labor (العمالة العارضة) Actions
  const addCasualEmployee = (
    workerData: Omit<CasualEmployee, 'id' | 'createdAt' | 'approvalStatus' | 'isTransferredToPermanent' | 'tempCode' | 'documents'>,
    initialDocs?: Omit<CasualEmployeeDocument, 'id' | 'uploadedAt' | 'uploadedBy'>[]
  ) => {
    const year = new Date().getFullYear();
    const count = casualEmployees.length + 1;
    const tempCode = `CAS-REQ-${year}-${String(count).padStart(3, '0')}`;
    const id = `cas-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const processedDocs: CasualEmployeeDocument[] = (initialDocs || []).map((doc, idx) => ({
      ...doc,
      id: `cdoc-${Date.now()}-${idx}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      uploadedBy: currentUser?.fullNameAr || 'الموارد البشرية',
    }));

    const effectiveStartDate = workerData.commencementDate || workerData.startDate || new Date().toISOString().split('T')[0];

    const newWorker: CasualEmployee = {
      ...workerData,
      id,
      tempCode,
      startDate: effectiveStartDate,
      commencementDate: effectiveStartDate,
      approvalStatus: 'pending_hr_approval',
      isTransferredToPermanent: false,
      documents: processedDocs,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    clearDeletedId(newWorker.id);
    const updatedList = [newWorker, ...casualEmployees];
    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    saveDocToFirestore('contingentEmployees', newWorker).catch(console.error);

    return { success: true, id, tempCode };
  };

  const approveCasualEmployee = (id: string, assignedJobId: string, notes?: string) => {
    const cleanJobId = assignedJobId.trim();
    if (!cleanJobId) {
      return { success: false, error: 'الرقم الوظيفي إلزامي لاعتماد الموظف من الموارد البشرية' };
    }

    const dupEmp = employees.find(
      (e) => e.jobId.trim().toLowerCase() === cleanJobId.toLowerCase()
    );
    if (dupEmp) {
      return { success: false, error: `الرقم الوظيفي (${cleanJobId}) مستخدم بالفعل للموظف الدائم: ${dupEmp.nameAr}` };
    }

    const dupCasual = casualEmployees.find(
      (c) => c.id !== id && c.jobId?.trim().toLowerCase() === cleanJobId.toLowerCase()
    );
    if (dupCasual) {
      return { success: false, error: `الرقم الوظيفي (${cleanJobId}) مسند بالفعل لموظف عمالة عارضة آخر: ${dupCasual.nameAr}` };
    }

    let updatedWorker: CasualEmployee | undefined;
    const updatedList = casualEmployees.map((w) => {
      if (w.id === id) {
        updatedWorker = {
          ...w,
          approvalStatus: 'approved' as CasualApprovalStatus,
          jobId: cleanJobId,
          approvedByUserId: currentUser?.id,
          approvedByNameAr: currentUser?.fullNameAr || 'الموارد البشرية',
          approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          notes: notes ? (w.notes ? `${w.notes} | ${notes}` : notes) : w.notes,
        };
        return updatedWorker;
      }
      return w;
    });

    if (!updatedWorker) {
      return { success: false, error: 'سجل الموظف غير موجود' };
    }

    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    saveDocToFirestore('contingentEmployees', updatedWorker).catch(console.error);

    return { success: true };
  };

  const rejectCasualEmployee = (id: string, reason: string) => {
    let updatedWorker: CasualEmployee | undefined;
    const updatedList = casualEmployees.map((w) => {
      if (w.id === id) {
        updatedWorker = {
          ...w,
          approvalStatus: 'rejected' as CasualApprovalStatus,
          rejectionReason: reason || 'مرفوض من قبل الموارد البشرية',
          approvedByUserId: currentUser?.id,
          approvedByNameAr: currentUser?.fullNameAr || 'الموارد البشرية',
          approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        return updatedWorker;
      }
      return w;
    });

    if (!updatedWorker) {
      return { success: false, error: 'سجل الموظف غير موجود' };
    }

    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    saveDocToFirestore('contingentEmployees', updatedWorker).catch(console.error);

    return { success: true };
  };

  const updateCasualEmployee = (id: string, updates: Partial<CasualEmployee>) => {
    let updatedWorker: CasualEmployee | undefined;
    const updatedList = casualEmployees.map((w) => {
      if (w.id === id) {
        const commencementDate = updates.commencementDate || (updates.startDate ? updates.startDate : w.commencementDate || w.startDate);
        const startDate = updates.startDate || updates.commencementDate || w.startDate;
        updatedWorker = { ...w, ...updates, commencementDate, startDate };
        return updatedWorker;
      }
      return w;
    });

    if (!updatedWorker) {
      return { success: false, error: 'سجل الموظف غير موجود' };
    }

    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    saveDocToFirestore('contingentEmployees', updatedWorker).catch(console.error);

    return { success: true };
  };

  const deleteCasualEmployee = (id: string) => {
    recordDeletedId(id);
    const updatedList = casualEmployees.filter((w) => w.id !== id);
    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    deleteDocFromFirestore('contingentEmployees', id).catch(console.error);
    return { success: true };
  };

  const addCasualEmployeeDocument = (
    workerId: string,
    docData: Omit<CasualEmployeeDocument, 'id' | 'uploadedAt' | 'uploadedBy'>
  ) => {
    const newDoc: CasualEmployeeDocument = {
      ...docData,
      id: `cdoc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      uploadedBy: currentUser?.fullNameAr || 'الموارد البشرية',
    };

    let updatedWorker: CasualEmployee | undefined;
    const updatedList = casualEmployees.map((w) => {
      if (w.id === workerId) {
        updatedWorker = {
          ...w,
          documents: [newDoc, ...(w.documents || [])],
        };
        return updatedWorker;
      }
      return w;
    });

    if (!updatedWorker) {
      return { success: false, error: 'سجل الموظف غير موجود' };
    }

    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    saveDocToFirestore('contingentEmployees', updatedWorker).catch(console.error);

    return { success: true };
  };

  const deleteCasualEmployeeDocument = (workerId: string, docId: string) => {
    let updatedWorker: CasualEmployee | undefined;
    const updatedList = casualEmployees.map((w) => {
      if (w.id === workerId) {
        updatedWorker = {
          ...w,
          documents: (w.documents || []).filter((d) => d.id !== docId),
        };
        return updatedWorker;
      }
      return w;
    });

    if (!updatedWorker) {
      return { success: false, error: 'سجل الموظف غير موجود' };
    }

    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    saveDocToFirestore('contingentEmployees', updatedWorker).catch(console.error);

    return { success: true };
  };

  const transferCasualToPermanent = (
    workerId: string,
    transferData: {
      statusId: EmploymentStatusType;
      permanentJobId?: string;
      commencementDate?: string;
      vacationBalance?: number;
      notes?: string;
    }
  ) => {
    const worker = casualEmployees.find((w) => w.id === workerId);
    if (!worker) {
      return { success: false, error: 'الموظف غير موجود في سجل العمالة العارضة' };
    }

    const targetJobId = (transferData.permanentJobId || worker.jobId || `EMP-${Date.now().toString().slice(-4)}`).trim();

    const existingPerm = employees.find((e) => e.jobId.trim().toLowerCase() === targetJobId.toLowerCase());
    if (existingPerm) {
      return { success: false, error: `الرقم الوظيفي (${targetJobId}) مستخدم بالفعل في سجل الموظفين للموظف: ${existingPerm.nameAr}` };
    }

    // Determine final commencement date (تاريخ المباشرة)
    const effectiveCommencementDate = transferData.commencementDate || worker.commencementDate || worker.startDate || new Date().toISOString().split('T')[0];

    // 1. Add to permanent employee registry (سجل الموظفين)
    const addResult = addEmployee({
      nameAr: worker.nameAr,
      jobId: targetJobId,
      nationalId: worker.nationalId,
      birthYear: worker.birthYear,
      phone: worker.phone,
      email: worker.email,
      branchId: worker.branchId,
      shift: worker.shift,
      statusId: transferData.statusId || 'active',
      startDate: effectiveCommencementDate, // تاريخ المباشرة الفعلي
      vacationBalance: transferData.vacationBalance ?? 30,
      notes: `المسمى الوظيفي: ${worker.jobTitleAr}` +
        (worker.notes ? ` | ${worker.notes}` : '') +
        ` | تم التثبيت والنقل من العمالة العارضة (كود: ${worker.tempCode}) بتاريخ ${new Date().toISOString().split('T')[0]}` +
        (transferData.notes ? ` | تفاصيل النقل: ${transferData.notes}` : ''),
    });

    if (!addResult.success) {
      return { success: false, error: addResult.error || 'فشل نقل الموظف إلى الكادر الدائم' };
    }

    // 2. Remove permanently from casual labor (يختفي من عمالة عارضة)
    recordDeletedId(workerId);
    const updatedList = casualEmployees.filter((w) => w.id !== workerId);
    setCasualEmployees(updatedList);
    setStoredItem('casual_employees', updatedList);
    broadcastEntitySync('casual_employees', updatedList);
    deleteDocFromFirestore('contingentEmployees', workerId).catch(console.error);

    return { success: true, newEmployeeId: targetJobId };
  };

  // ----------------------------------------------------
  // INTER-BRANCH LOGISTICS ACTIONS (حركة النقل والطرود بين الفروع)
  // ----------------------------------------------------
  const createTransfer = (data: {
    originBranchId: string;
    destinationBranchId: string;
    sentPackages: number;
    packageDescriptionAr?: string;
    notesAr?: string;
    senderManagerNameAr?: string;
  }) => {
    if (!data.originBranchId || !data.destinationBranchId) {
      return { success: false, error: 'يرجى تحديد كل من الفرع المنقول منه والفرع المنقول له' };
    }
    if (data.originBranchId === data.destinationBranchId) {
      return { success: false, error: 'لا يمكن أن يكون فرع المصدر هو نفسه فرع الوجهة' };
    }
    const sentCount = Number(data.sentPackages);
    if (!sentCount || sentCount <= 0) {
      return { success: false, error: 'يجب إدخال عدد طرود صحيح (طرد واحد على الأقل)' };
    }

    const originBranch = branches.find((b) => b.id === data.originBranchId);
    const destBranch = branches.find((b) => b.id === data.destinationBranchId);

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}`;
    
    // Auto-generate unique sequential serial number: TRP-2026-0001, TRP-2026-0002...
    let maxSeq = 1000;
    transfers.forEach((t) => {
      const match = t.trackingNumber.match(/TRP-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    const nextSeq = maxSeq + 1;
    const trackingNumber = `TRP-2026-${String(nextSeq).padStart(4, '0')}`;

    const newTransfer: BranchTransfer = {
      id: `trp-${Date.now()}`,
      trackingNumber,
      originBranchId: data.originBranchId,
      originBranchNameAr: originBranch?.nameAr || data.originBranchId,
      destinationBranchId: data.destinationBranchId,
      destinationBranchNameAr: destBranch?.nameAr || data.destinationBranchId,
      sentPackages: sentCount,
      officerReceivedPackages: sentCount, // default equal until verified at pickup
      packageDescriptionAr: data.packageDescriptionAr?.trim() || undefined,
      notesAr: data.notesAr?.trim() || undefined,
      status: 'pending_pickup',
      createdAt: timestamp,
      createdByUserId: currentUser?.id || 'usr-admin',
      createdByNameAr: currentUser?.fullNameAr || 'مسؤول الفرع',
      senderManagerNameAr: data.senderManagerNameAr?.trim() || originBranch?.managerName || currentUser?.fullNameAr || 'مدير الفرع المرسل',
      hasDeficit: false,
    };

    clearDeletedId(newTransfer.id);
    const updated = [newTransfer, ...transfers];
    setTransfers(updated);
    setStoredItem('transfers', updated);
    broadcastEntitySync('transfers', updated);
    saveDocToFirestore('branchTransfers', newTransfer).catch(console.error);

    return { success: true, trackingNumber, id: newTransfer.id };
  };

  const pickupTransfer = (
    transferId: string,
    logisticsNotesAr?: string,
    officerReceivedPackages?: number,
    logisticsOfficerNameAr?: string
  ) => {
    const existing = transfers.find((t) => t.id === transferId);
    if (!existing) {
      return { success: false, error: 'إرسالية النقل غير موجودة بالمنظومة' };
    }
    if (existing.status !== 'pending_pickup') {
      return { success: false, error: 'لا يمكن استلام هذه الشحنة لأنها ليست بانتظار استلام النقل' };
    }

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}`;
    const officerCount = officerReceivedPackages !== undefined && !isNaN(Number(officerReceivedPackages))
      ? Number(officerReceivedPackages)
      : existing.sentPackages;

    const officerName = logisticsOfficerNameAr?.trim() || currentUser?.fullNameAr || 'مسؤول النقل والشحن';

    const updatedTransfer: BranchTransfer = {
      ...existing,
      status: 'in_transit',
      pickedUpAt: timestamp,
      pickedUpByUserId: currentUser?.id || 'usr-logistics',
      pickedUpByNameAr: officerName,
      logisticsOfficerNameAr: officerName,
      officerReceivedPackages: officerCount,
      logisticsNotesAr: logisticsNotesAr?.trim() || existing.logisticsNotesAr || 'تم استلام الشحنة وتأكيد عدد الطرود عند التعبئة',
    };

    const updated = transfers.map((t) => (t.id === transferId ? updatedTransfer : t));
    setTransfers(updated);
    setStoredItem('transfers', updated);
    broadcastEntitySync('transfers', updated);
    saveDocToFirestore('branchTransfers', updatedTransfer).catch(console.error);

    return { success: true };
  };

  const receiveTransfer = (
    transferId: string,
    data: { receivedPackages: number; receiptNotesAr?: string; receiverManagerNameAr?: string }
  ) => {
    const existing = transfers.find((t) => t.id === transferId);
    if (!existing) {
      return { success: false, error: 'إرسالية النقل غير موجودة بالمنظومة', hasDeficit: false, deficitCount: 0, message: '' };
    }
    if (existing.status !== 'in_transit') {
      return { success: false, error: 'لا يمكن تأكيد استلام الفرع إلا للشحنات الجاري نقلها حالياً', hasDeficit: false, deficitCount: 0, message: '' };
    }

    const receivedCount = Number(data.receivedPackages);
    if (isNaN(receivedCount) || receivedCount < 0) {
      return { success: false, error: 'يرجى إدخال عدد طرود مستلمة صحيح (0 فما فوق)', hasDeficit: false, deficitCount: 0, message: '' };
    }

    const destBranch = branches.find((b) => b.id === existing.destinationBranchId);
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}`;

    let status: TransferStatus = 'delivered';
    let hasDeficit = false;
    let deficitCount = 0;
    let deficitAlert: DeficitAlertNotification | undefined = undefined;
    let userMsg = '';

    if (receivedCount < existing.sentPackages) {
      deficitCount = existing.sentPackages - receivedCount;
      status = 'delivered_with_deficit';
      hasDeficit = true;
      deficitAlert = {
        alertId: `ALT-DEF-${Date.now()}`,
        reportedAt: timestamp,
        deficitAmount: deficitCount,
        alertMessageAr: `بلاغ عاجل: تم رصد عجز ${deficitCount} طرد في الرحلة ${existing.trackingNumber} المنقولة من ${existing.originBranchNameAr} إلى ${existing.destinationBranchNameAr}. (المرسل: ${existing.sentPackages}، المستلم: ${receivedCount}). تم إخطار الموارد البشرية ومدير النظام للمطابقة والتحقيق.`,
        tripTrackingNumber: existing.trackingNumber,
        originBranchNameAr: existing.originBranchNameAr,
        destinationBranchNameAr: existing.destinationBranchNameAr,
        sentPackages: existing.sentPackages,
        receivedPackages: receivedCount,
        reportedByNameAr: currentUser?.fullNameAr || 'مستلم الفرع',
        carrierOfficerNameAr: existing.pickedUpByNameAr,
        targetRoles: ['system_admin', 'hr_officer', 'hr'],
        isAcknowledged: false,
      };
      userMsg = `تم تسجيل عجز بمقدار ${deficitCount} طرد في الشحنة. تم إشعار مدير النظام والموارد البشرية تلقائياً.`;
    } else {
      hasDeficit = false;
      deficitCount = 0;
      status = 'delivered';
      userMsg = `تم استلام الشحنة بنجاح: عدد الطرود المستلمة (${receivedCount}) مطابق تماماً للطرود المرسلة.`;
    }

    const receiverManager = data.receiverManagerNameAr?.trim() || destBranch?.managerName || currentUser?.fullNameAr || 'مدير الفرع المستلم';

    const updatedTransfer: BranchTransfer = {
      ...existing,
      status,
      receivedPackages: receivedCount,
      deficitPackages: deficitCount > 0 ? deficitCount : 0,
      receivedAt: timestamp,
      receivedByUserId: currentUser?.id || 'usr-branch',
      receivedByNameAr: currentUser?.fullNameAr || 'مستلم الفرع',
      receiverManagerNameAr: receiverManager,
      receiptNotesAr: data.receiptNotesAr?.trim() || (hasDeficit ? `محضر عجز: نقص ${deficitCount} طرد` : 'استلام مكتمل ومطابق'),
      hasDeficit,
      deficitReportedToHrAndAdmin: hasDeficit,
      deficitAlertDetails: deficitAlert,
    };

    const updated = transfers.map((t) => (t.id === transferId ? updatedTransfer : t));
    setTransfers(updated);
    setStoredItem('transfers', updated);
    broadcastEntitySync('transfers', updated);
    saveDocToFirestore('branchTransfers', updatedTransfer).catch(console.error);

    return {
      success: true,
      hasDeficit,
      deficitCount,
      message: userMsg,
    };
  };

  const updateTransfer = (transferId: string, updates: Partial<BranchTransfer>) => {
    const existing = transfers.find((t) => t.id === transferId);
    if (!existing) {
      return { success: false, error: 'إرسالية النقل غير موجودة بالمنظومة' };
    }
    const updatedTransfer: BranchTransfer = { ...existing, ...updates };
    const updated = transfers.map((t) => (t.id === transferId ? updatedTransfer : t));
    setTransfers(updated);
    setStoredItem('transfers', updated);
    broadcastEntitySync('transfers', updated);
    saveDocToFirestore('branchTransfers', updatedTransfer).catch(console.error);
    return { success: true };
  };

  const deleteTransfer = (transferId: string) => {
    recordDeletedId(transferId);
    const updated = transfers.filter((t) => t.id !== transferId);
    setTransfers(updated);
    setStoredItem('transfers', updated);
    broadcastEntitySync('transfers', updated);
    deleteDocFromFirestore('branchTransfers', transferId).catch(console.error);
    return { success: true };
  };

  // Clear All Default Values & Reset to Pure Clean Cloud Database
  const clearAllDefaultValuesAndResetCloud = async () => {
    setIsSyncing(true);
    try {
      // Set local clean baseline
      clearAllTombstones();
      setEmployees([CLEAN_ADMIN_EMPLOYEE]);
      setBranches(INITIAL_BRANCHES);
      setUsers([CLEAN_SUPER_ADMIN]);
      setCurrentUser(CLEAN_SUPER_ADMIN);
      setIncidents([]);
      setRequests([]);
      setTasks([]);
      setCategories([]);
      setMainSections([]);
      setSubSections([]);
      setCatalogItems([]);
      setPurchaseOrders([]);
      setCasualEmployees([]);
      setTransfers([]);
      setIsCleanDatabase(true);

      // Wipe remote collections and write super admin and branches
      await Promise.allSettled([
        clearFirestoreCollection('employees'),
        clearFirestoreCollection('incidents'),
        clearFirestoreCollection('requests'),
        clearFirestoreCollection('tasks'),
        clearFirestoreCollection('categories'),
        clearFirestoreCollection('mainSections'),
        clearFirestoreCollection('subSections'),
        clearFirestoreCollection('catalogItems'),
        clearFirestoreCollection('purchaseOrders'),
        clearFirestoreCollection('contingentEmployees'),
        clearFirestoreCollection('branchTransfers'),
        saveDocToFirestore('users', CLEAN_SUPER_ADMIN),
        saveDocToFirestore('employees', CLEAN_ADMIN_EMPLOYEE),
        ...INITIAL_BRANCHES.map(b => saveDocToFirestore('branches', b)),
      ]);

      setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
      return { success: true };
    } catch (err) {
      console.error('Error clearing cloud database', err);
      return { success: false, error: String(err) };
    } finally {
      setIsSyncing(false);
    }
  };

  // Load Demo Sample Data (for demonstration and testing)
  const loadDemoSampleData = async () => {
    setIsSyncing(true);
    try {
      setEmployees(INITIAL_EMPLOYEES);
      setBranches(INITIAL_BRANCHES);
      setUsers(INITIAL_USERS);
      setIncidents(INITIAL_INCIDENTS);
      setRequests(INITIAL_REQUESTS);
      setTasks(INITIAL_TASKS);
      setCategories(INITIAL_CATEGORIES);
      setMainSections(INITIAL_MAIN_SECTIONS);
      setSubSections(INITIAL_SUB_SECTIONS);
      setCatalogItems(INITIAL_CATALOG_ITEMS);
      setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
      setCasualEmployees(INITIAL_CASUAL_EMPLOYEES);
      setTransfers(INITIAL_BRANCH_TRANSFERS);
      setIsCleanDatabase(false);

      // Push all to cloud
      await syncAllToCloud();
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync All current data to Firestore
  const syncAllToCloud = async () => {
    setIsSyncing(true);
    try {
      const promises: Promise<any>[] = [];

      branches.forEach((b) => promises.push(saveDocToFirestore('branches', b)));
      shifts.forEach((s) => promises.push(saveDocToFirestore('shifts', s)));
      employmentStatuses.forEach((st) => promises.push(saveDocToFirestore('employmentStatuses', st)));
      employees.forEach((e) => promises.push(saveDocToFirestore('employees', e)));
      users.forEach((u) => promises.push(saveDocToFirestore('users', u)));
      incidents.forEach((i) => promises.push(saveDocToFirestore('incidents', i)));
      requests.forEach((r) => promises.push(saveDocToFirestore('requests', r)));
      tasks.forEach((t) => promises.push(saveDocToFirestore('tasks', t)));
      categories.forEach((c) => promises.push(saveDocToFirestore('categories', c)));
      mainSections.forEach((m) => promises.push(saveDocToFirestore('mainSections', m)));
      subSections.forEach((s) => promises.push(saveDocToFirestore('subSections', s)));
      catalogItems.forEach((it) => promises.push(saveDocToFirestore('catalogItems', it)));
      purchaseOrders.forEach((p) => promises.push(saveDocToFirestore('purchaseOrders', p)));
      casualEmployees.forEach((ce) => promises.push(saveDocToFirestore('contingentEmployees', ce)));
      transfers.forEach((tr) => promises.push(saveDocToFirestore('branchTransfers', tr)));

      await Promise.allSettled(promises);
      setLastCloudSync(new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }));
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    } finally {
      setIsSyncing(false);
    }
  };

  const resetFactoryData = () => {
    clearAllDefaultValuesAndResetCloud();
  };

  // Computed Cloud Stats for status modal
  const cloudStats: CloudDbStats = useMemo(() => {
    return {
      status: cloudStatus,
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      lastSyncTime: lastCloudSync || undefined,
      isClean: isCleanDatabase,
      counts: {
        employees: employees.length,
        casualEmployees: casualEmployees.length,
        branches: branches.length,
        shifts: shifts.length,
        statuses: employmentStatuses.length,
        users: users.length,
        incidents: incidents.length,
        requests: requests.length,
        tasks: tasks.length,
        categories: categories.length,
        mainSections: mainSections.length,
        subSections: subSections.length,
        catalogItems: catalogItems.length,
        purchaseOrders: purchaseOrders.length,
        weeklyReports: weeklyReports.length,
        branchTransfers: transfers.length,
      },
    };
  }, [
    cloudStatus,
    lastCloudSync,
    isCleanDatabase,
    employees,
    casualEmployees,
    branches,
    shifts,
    employmentStatuses,
    users,
    incidents,
    requests,
    tasks,
    categories,
    mainSections,
    subSections,
    catalogItems,
    purchaseOrders,
    weeklyReports,
    transfers,
  ]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeBranchFilter,
        setActiveBranchFilter,
        login,
        verifyCredentials,
        quickLoginAs,
        logout,
        hasPermission,
        canAccessBranch,
        userAssignedBranches,
        isGlobalUser,
        employees,
        branches,
        shifts,
        employmentStatuses,
        users,
        rolePermissions,
        incidents,
        requests,
        tasks,
        categories,
        mainSections,
        subSections,
        catalogItems,
        purchaseOrders,
        scopedEmployees,
        scopedIncidents,
        scopedRequests,
        scopedTasks,
        scopedItems,
        scopedPurchaseOrders,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        importEmployees,
        addIncident,
        deleteIncident,
        createRequest,
        reviewRequest,
        createTask,
        toggleTaskCompletion,
        toggleTaskArchive,
        deleteTask,
        addUser,
        updateUser,
        deleteUser,
        updateRolePermission,
        updateUserPermissionOverride,
        resetRolePermissionsToDefault,
        updateCurrentUserProfile,
        addBranch,
        updateBranch,
        toggleBranchStatus,
        addShift,
        updateShift,
        addEmploymentStatus,
        updateEmploymentStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        addMainSection,
        updateMainSection,
        deleteMainSection,
        addSubSection,
        updateSubSection,
        deleteSubSection,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        updateItemStock,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        weeklyReports,
        approveWeeklyReport,
        updateWeeklyEvaluation,
        unapproveWeeklyReport,
        casualEmployees,
        scopedCasualEmployees,
        addCasualEmployee,
        approveCasualEmployee,
        rejectCasualEmployee,
        updateCasualEmployee,
        deleteCasualEmployee,
        addCasualEmployeeDocument,
        deleteCasualEmployeeDocument,
        transferCasualToPermanent,
        transfers,
        scopedTransfers,
        createTransfer,
        pickupTransfer,
        receiveTransfer,
        updateTransfer,
        deleteTransfer,
        cloudStatus,
        isSyncing,
        lastCloudSync,
        isCleanDatabase,
        cloudStats,
        clearAllDefaultValuesAndResetCloud,
        loadDemoSampleData,
        syncAllToCloud,
        resetFactoryData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
