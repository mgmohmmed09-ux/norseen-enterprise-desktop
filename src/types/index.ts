export type UserRole = 
  | 'system_admin'              // مسؤول النظام
  | 'supervisor_auditor'        // متابع ومراقب
  | 'branches_director'         // مدير إدارة الفروع
  | 'branch_manager'            // مدير فرع
  | 'supervisor'                // مشرف
  | 'procurement_director'      // مدير إدارة المشتريات
  | 'marketing_director'        // مدير إدارة التسويق
  | 'marketing_office_manager'  // مدير مكتب التسويق
  | 'social_media_specialist'   // مسؤول منصات والتسويق
  | 'hr_officer'                // مسؤول موارد بشرية
  | 'finance_director'          // مدير مالی
  | 'accountant'                // محاسب
  | 'treasurer'                 // أمين خزينة
  | 'backup_treasurer'          // أمين خزينة احتياطي
  | 'cash_collector'            // محصل مالی
  | 'warehouse_custodian'       // أمين المخازن
  | 'warehouse_staff'           // موظف مخازن
  | 'sales_agent'               // موظف بيع
  | 'logistics_transport_officer' // مسؤول الحركة والنقل
  | 'comms_coordinator'         // ضابط الإتصالات والتنسيق
  | 'general_assistant_custodian' // مساعد عام أمين
  | 'sanitation_worker'         // عامل نظافة
  // Legacy mappings for compatibility
  | 'hr'
  | 'financial'
  | 'marketing'
  | 'assistant_branch_manager'
  | 'employee'
  | string;

export interface UserRoleInfo {
  id: UserRole;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  badgeColor: string;
}

export type PermissionKey =
  // Employees
  | 'view_employees'
  | 'create_employee'
  | 'edit_employee'
  | 'delete_employee'
  | 'export_employees'
  | 'import_employees'
  // Attendance & Incidents
  | 'view_attendance'
  | 'create_incident'
  | 'delete_incident'
  | 'export_attendance'
  // Requests
  | 'view_requests'
  | 'create_request'
  | 'approve_request'
  | 'reject_request'
  | 'approve_transfer_request'
  // Tasks
  | 'view_tasks'
  | 'create_task'
  | 'complete_task'
  | 'manage_tasks'
  // Reports
  | 'approve_weekly_report'
  // System Settings & Users
  | 'manage_branches'
  | 'manage_shifts'
  | 'manage_statuses'
  | 'manage_users'
  | 'manage_permissions'
  // Catalog & Inventory
  | 'manage_catalog'
  | 'manage_inventory'
  | 'order_items'
  // Casual / Contingent Labor
  | 'view_casual_workers'
  | 'create_casual_worker'
  | 'approve_casual_worker'
  | 'transfer_casual_worker'
  // Inter-Branch Logistics & Transfers (النقل والطرود)
  | 'view_logistics'
  | 'create_logistics_transfer'
  | 'pickup_logistics_transfer'
  | 'receive_logistics_transfer'
  | 'manage_logistics';

export interface PermissionDefinition {
  key: PermissionKey;
  labelAr: string;
  categoryAr: string;
  descriptionAr: string;
}

export type WorkShiftType = 'morning' | 'evening' | 'full_time';

export type EmploymentStatusType = 
  | 'system_admin'
  | 'supervisor_auditor'
  | 'branches_director'
  | 'branch_manager'
  | 'supervisor'
  | 'procurement_director'
  | 'marketing_director'
  | 'marketing_office_manager'
  | 'social_media_specialist'
  | 'hr_officer'
  | 'finance_director'
  | 'accountant'
  | 'treasurer'
  | 'backup_treasurer'
  | 'cash_collector'
  | 'warehouse_custodian'
  | 'warehouse_staff'
  | 'sales_agent'
  | 'logistics_transport_officer'
  | 'comms_coordinator'
  | 'general_assistant_custodian'
  | 'sanitation_worker'
  // Legacy
  | 'temporary_worker'
  | 'warehouse_employee'
  | 'branch_employee'
  | 'financial_dept'
  | 'marketing_dept'
  | 'hr'
  | 'procurement_dept'
  | string;

export interface Branch {
  id: string;
  code: string;
  nameAr: string;
  cityAr: string;
  addressAr: string;
  phone: string;
  isActive: boolean;
  managerName?: string;
  managerEmployeeId?: string;
}

export interface ShiftConfig {
  id: WorkShiftType | string;
  nameAr: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  descriptionAr: string;
}

export interface EmploymentStatusConfig {
  id: string;
  nameAr: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface Employee {
  id: string;
  nameAr: string;
  jobId: string; // الرقم الوظيفي (Unique)
  nationalId: string; // الرقم الوطني (Unique)
  birthYear?: number; // سنة الميلاد (e.g. 1995)
  startDate: string; // YYYY-MM-DD
  vacationBalance: number; // Days
  branchId: string;
  shift: WorkShiftType | string;
  statusId: EmploymentStatusType;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

// ----------------------------------------------------
// CASUAL / CONTINGENT LABOR TYPES (العمالة العارضة)
// ----------------------------------------------------
export type CasualDocumentCategory =
  | 'national_id'         // صورة البطاقة الشخصية / جواز السفر
  | 'contract'            // عقد التكليف المؤقت
  | 'health_certificate'  // الشهادة الصحية
  | 'clearance'           // نموذج إبراء الذمة
  | 'work_permit'         // تصريح العمل المؤقت
  | 'receipt_pledge'      // إقرار استلام عهدة / معدات
  | 'other';              // مستندات أخرى

export interface CasualEmployeeDocument {
  id: string;
  title: string;
  category: CasualDocumentCategory;
  fileName: string;
  fileType: string;
  fileData: string; // Base64 data URL
  fileSize: number; // in bytes
  uploadedAt: string;
  uploadedBy: string;
}

export type CasualApprovalStatus =
  | 'pending_hr_approval'        // بانتظار اعتماد الموارد البشرية
  | 'approved'                   // معتمد - تم إصدار الرقم الوظيفي
  | 'rejected'                   // مرفوض من الموارد البشرية
  | 'transferred_to_permanent';  // تم نقله لسجل الموظفين الدائمين

export interface CasualEmployee {
  id: string;
  tempCode: string; // كود مرجعي مؤقت قبل الاعتماد (e.g. "CAS-2026-001")
  nameAr: string;
  nationalId: string;
  birthYear?: number;
  phone?: string;
  email?: string;
  branchId: string;
  shift: WorkShiftType | string;
  jobTitleAr: string; // المسمى أو المهمة المكلف بها
  dailyWageRate?: number; // الأجر اليومي / المخصص
  commencementDate?: string; // تاريخ المباشرة الفعلي (YYYY-MM-DD)
  startDate: string; // YYYY-MM-DD (تاريخ بدء العمل / المباشرة)
  contractDurationDays?: number; // مدة التكليف بالأيام
  endDate?: string;
  notes?: string;

  // HR Approval & Job ID Issuance Workflow
  approvalStatus: CasualApprovalStatus;
  jobId?: string; // يتم إعطاؤه الرقم الوظيفي حصراً بعد اعتماد HR
  approvedByUserId?: string;
  approvedByNameAr?: string;
  approvedAt?: string;
  rejectionReason?: string;

  // Attached Documents
  documents: CasualEmployeeDocument[];

  // Transfer to Permanent Registry
  isTransferredToPermanent: boolean;
  transferredAt?: string;
  transferredBy?: string;
  permanentEmployeeId?: string; // معرف الموظف الجديد في سجل الموظفين الدائمين

  createdAt: string;
}

export interface UserAccount {
  id: string;
  username: string; // e.g. Mohamed Ghashout or ghashout
  fullNameAr: string;
  password?: string;
  role: UserRole;
  employeeId?: string; // Linked employee ID
  assignedBranchIds: string[]; // ['*'] for all branches or list of branch IDs
  isActive: boolean;
  customPermissions?: Partial<Record<PermissionKey, boolean>>;
  lastLogin?: string;
  avatarUrl?: string; // Profile picture (base64 or URL)
  email?: string; // Linked email for notifications
  emailNotificationsEnabled?: boolean; // Receive task, request and attendance notifications by email
}

export type IncidentType = 'absence' | 'delay';

export interface IncidentRecord {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  jobId: string;
  branchId: string;
  type: IncidentType;
  date: string; // YYYY-MM-DD
  // For delays
  delayDurationMinutes?: number;
  arrivalTime?: string;
  // Details
  reasonAr?: string;
  isExcused: boolean;
  recordedByUserId: string;
  recordedByName: string;
  createdAt: string;
}

export type RequestType = 'absence' | 'delay' | 'vacation' | 'early_departure' | 'transfer';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface EmployeeRequest {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  jobId: string;
  branchId: string;
  type: RequestType;
  status: RequestStatus;
  submissionDate: string; // YYYY-MM-DD
  // Dates/Times
  startDate?: string;
  endDate?: string;
  exitTime?: string;
  delayDurationMinutes?: number;
  vacationType?: 'annual' | 'sick' | 'emergency' | 'unpaid';
  reasonAr: string;
  // Branch Transfer specific fields
  fromBranchId?: string;
  fromBranchNameAr?: string;
  targetBranchId?: string;
  targetBranchNameAr?: string;
  targetShift?: WorkShiftType | string;
  effectiveDate?: string;
  // Review
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewDate?: string;
  reviewNotesAr?: string;
}

export interface TaskTargetUser {
  userId: string;
  userNameAr: string;
  userRole: UserRole;
  branchId: string;
  branchNameAr: string;
  isCompleted: boolean;
  completedAt?: string;
  completionNotesAr?: string;
}

export interface EnterpriseTask {
  id: string;
  titleAr: string;
  descriptionAr: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetRoles: UserRole[]; // 'branch_manager' | 'assistant_branch_manager'
  targetBranchIds: string[]; // ['*'] or specific branch IDs
  dueDate: string; // YYYY-MM-DD
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  isArchived: boolean;
  targets: TaskTargetUser[];
  completionRate?: number;
}

// ----------------------------------------------------
// WEEKLY BRANCH REPORT & CERTIFICATION
// ----------------------------------------------------
export type WeeklyEvaluationRating = 'excellent' | 'very_good' | 'good' | 'needs_improvement';

export interface WeeklyEmployeeEvaluation {
  rating: WeeklyEvaluationRating;
  note?: string;
  evaluatedByUserId?: string;
  evaluatedByNameAr?: string;
  evaluatedAt?: string;
}

export interface WeeklyBranchReportRecord {
  id: string; // wrep-{branchId}-{yearWeek}
  branchId: string;
  branchNameAr: string;
  yearWeek: string; // e.g. "2026-W43"
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  isApproved: boolean;
  approvedByUserId?: string;
  approvedByNameAr?: string;
  approvedByRole?: UserRole;
  approvedAt?: string;
  approvalNotesAr?: string;
  managerSignatureTitle?: string; // "اعتماد مدير الفرع"
  digitalStampCode?: string; // e.g. "NORSEEN-CERT-W43-8472"
  evaluations: Record<string, WeeklyEmployeeEvaluation>; // employeeId -> evaluation
  updatedAt: string;
}

// ----------------------------------------------------
// 3-TIER CATALOG HIERARCHY
// ----------------------------------------------------
export interface ItemCategory {
  id: string;
  code: string;
  nameAr: string;
  descriptionAr?: string;
  icon?: string;
}

export interface MainSection {
  id: string;
  categoryId: string; // Parent Category
  code: string;
  nameAr: string;
  descriptionAr?: string;
}

export interface SubSection {
  id: string;
  mainSectionId: string; // Parent Main Section
  categoryId: string; // Convenient direct reference
  code: string;
  nameAr: string;
  descriptionAr?: string;
}

// ----------------------------------------------------
// ITEM REGISTRY & MULTI-BRANCH INVENTORY
// ----------------------------------------------------
export interface CatalogItem {
  id: string;
  code: string; // SKU Unique
  nameAr: string;
  basePrice: number; // in LYD (د.ل)
  categoryId: string;
  mainSectionId: string;
  subSectionId: string;
  unit: string; // قطعة, كرتونة, علبة, عبوة
  branchStock: Record<string, number>; // branchId -> quantity in stock
  minAlertStock?: number;
  descriptionAr?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

// ----------------------------------------------------
// STOREFRONT & PURCHASING ORDERS
// ----------------------------------------------------
export type PurchaseOrderStatus = 'pending' | 'approved' | 'dispatched' | 'completed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // PO-YYYYMMDD-XXX
  itemId: string;
  itemNameAr: string;
  itemCode: string;
  price: number;
  quantity: number;
  totalPrice: number;
  sourceBranchId: string; // الفرع المراد الطلب منه (صاحب المخزون)
  targetBranchId?: string; // الفرع الطالب أو المستلم
  requestedByUserId: string;
  requestedByName: string;
  requestDate: string;
  status: PurchaseOrderStatus;
  notesAr?: string;
}

// ----------------------------------------------------
// INTER-BRANCH LOGISTICS & TRANSFERS (النقل والطرود بين الفروع)
// ----------------------------------------------------
export type TransferStatus =
  | 'pending_pickup'          // بانتظار استلام مسؤول النقل (تم الإنشاء من الفرع المرسل)
  | 'in_transit'              // جاري النقل (استلمها مسؤول النقل عند التعبئة)
  | 'delivered'               // تم الاستلام بنجاح (الطرود متطابقة)
  | 'delivered_with_deficit'; // مستلم مع وجود عجز (يوجد نقص في عدد الطرود)

export interface DeficitAlertNotification {
  alertId: string;
  reportedAt: string;
  deficitAmount: number;
  alertMessageAr: string;
  tripTrackingNumber: string;
  originBranchNameAr: string;
  destinationBranchNameAr: string;
  sentPackages: number;
  receivedPackages: number;
  reportedByNameAr: string;
  carrierOfficerNameAr?: string;
  targetRoles: ('system_admin' | 'hr_officer' | 'hr')[];
  isAcknowledged?: boolean;
}

export interface BranchTransfer {
  id: string; // Document ID / Key
  trackingNumber: string; // رقم الرحلة / الشحنة (مثال: TRP-2026-0001)

  // Origin & Destination Branches
  originBranchId: string; // الفرع المنقول منه
  originBranchNameAr: string;
  destinationBranchId: string; // الفرع المنقول له
  destinationBranchNameAr: string;

  // Parcel details
  sentPackages: number; // عدد الطرود المرسلة
  officerReceivedPackages?: number; // عدد الطرود المستلمة من الفرع بواسطة مسؤول النقل
  receivedPackages?: number; // عدد الطرود المستلمة فعلياً بالفرع المستلم
  deficitPackages?: number; // مقدار العجز (المرسل - المستلم)
  packageDescriptionAr?: string; // وصف محتويات الطرود
  notesAr?: string; // ملاحظات الشحنة

  // Overall Status
  status: TransferStatus;

  // 1. Creation details (الفرع المرسل)
  createdAt: string; // توقيت وتاريخ الإنشاء (المرحلة 1)
  createdByUserId: string;
  createdByNameAr: string;
  senderManagerNameAr?: string; // توقيع / اسم مدير الفرع المرسل

  // 2. Logistics Officer Pickup details (مسؤول النقل عند التعبئة)
  pickedUpAt?: string; // توقيت وتاريخ استلام مسؤول النقل (المرحلة 2)
  pickedUpByUserId?: string;
  pickedUpByNameAr?: string;
  logisticsOfficerNameAr?: string; // اسم مسؤول النقل المعتمد
  logisticsNotesAr?: string; // ملاحظات الشحن ووسيلة النقل

  // 3. Destination Branch Receipt & Verification details (الفرع المستلم)
  receivedAt?: string; // توقيت وتاريخ الاستلام النهائي للفرع المستلم (المرحلة 3)
  receivedByUserId?: string;
  receivedByNameAr?: string;
  receiverManagerNameAr?: string; // توقيع / اسم مدير الفرع المستلم
  receiptNotesAr?: string; // محضر الفحص وملاحظات الاستلام

  // Deficit Warning & HR/Admin notification
  hasDeficit: boolean;
  deficitReportedToHrAndAdmin?: boolean;
  deficitAlertDetails?: DeficitAlertNotification;
}

// ----------------------------------------------------
// CLOUD DATABASE TYPES
// ----------------------------------------------------
export type CloudStatusType = 'connected' | 'connecting' | 'offline' | 'error';

export interface CloudDbStats {
  status: CloudStatusType;
  projectId: string;
  databaseId: string;
  lastSyncTime?: string;
  isClean: boolean;
  counts: {
    employees: number;
    branches: number;
    shifts: number;
    statuses: number;
    users: number;
    incidents: number;
    requests: number;
    tasks: number;
    categories: number;
    mainSections: number;
    subSections: number;
    catalogItems: number;
    purchaseOrders: number;
    weeklyReports?: number;
    casualEmployees?: number;
    branchTransfers?: number;
  };
}
