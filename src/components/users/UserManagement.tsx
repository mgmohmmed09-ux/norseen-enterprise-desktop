import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PermissionKey, UserAccount, UserRole } from '../../types';
import {
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  Building2,
  Check,
  X,
  RotateCcw,
  KeyRound,
  Shield,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  Cloud,
  RefreshCw,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { PERMISSION_DEFINITIONS, USER_ROLES } from '../../data/initialData';

export const UserManagement: React.FC = () => {
  const {
    users,
    employees,
    branches,
    rolePermissions,
    addUser,
    updateUser,
    deleteUser,
    updateRolePermission,
    updateUserPermissionOverride,
    resetRolePermissionsToDefault,
    hasPermission,
    currentUser,
    cloudStatus,
    isSyncing,
    syncAllToCloud,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('branch_manager');
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formBranches, setFormBranches] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formCustomPermissions, setFormCustomPermissions] = useState<Partial<Record<PermissionKey, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Selected role for the matrix viewer/editor
  const [matrixRole, setMatrixRole] = useState<UserRole>('branch_manager');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // System Admin Password Reveal Feature
  const isAdmin = currentUser?.role === 'system_admin' || currentUser?.id === 'usr-admin';
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [revealAllPasswords, setRevealAllPasswords] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleToggleRevealAll = () => {
    const next = !revealAllPasswords;
    setRevealAllPasswords(next);
    if (next) {
      const all: Record<string, boolean> = {};
      users.forEach((u) => {
        all[u.id] = true;
      });
      setRevealedPasswords(all);
    } else {
      setRevealedPasswords({});
    }
  };

  const copyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd).then(() => {
      setSuccessToast('تم نسخ الرمز السري بنجاح');
      setTimeout(() => setSuccessToast(null), 3000);
    }).catch(() => {});
  };

  const openAddUser = () => {
    setFormError(null);
    setEditingUser(null);
    setFormUsername('');
    setFormFullName('');
    setFormPassword('123456');
    setShowModalPassword(false);
    setFormRole('branch_manager');
    setFormEmployeeId('');
    setFormBranches([branches[0]?.id || 'b-jaraba']);
    setFormIsActive(true);
    setFormCustomPermissions({});
    setIsUserModalOpen(true);
  };

  const openEditUser = (u: UserAccount) => {
    setFormError(null);
    setEditingUser(u);
    setFormUsername(u.username);
    setFormFullName(u.fullNameAr);
    setFormPassword(u.password || '');
    setShowModalPassword(false);
    setFormRole(u.role);
    setFormEmployeeId(u.employeeId || '');
    setFormBranches(u.assignedBranchIds);
    setFormIsActive(u.isActive);
    setFormCustomPermissions(u.customPermissions || {});
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim() || !formFullName.trim()) {
      setFormError('اسم المستخدم والاسم الكامل مطلوبان');
      return;
    }

    if (formBranches.length === 0 && formRole !== 'system_admin' && formRole !== 'hr') {
      setFormError('يرجى تحديد فرع واحد على الأقل للمستخدم لتحديد نطاق الوصول');
      return;
    }

    const assigned = (formRole === 'system_admin' || formRole === 'hr' || formBranches.includes('*'))
      ? ['*']
      : formBranches;

    if (editingUser) {
      const res = updateUser(editingUser.id, {
        username: formUsername.trim(),
        fullNameAr: formFullName.trim(),
        password: formPassword || editingUser.password,
        role: formRole,
        employeeId: formEmployeeId || undefined,
        assignedBranchIds: assigned,
        isActive: formIsActive,
        customPermissions: formCustomPermissions,
      });
      if (!res.success) {
        setFormError(res.error || 'فشل تحديث الحساب');
        return;
      }
      setSuccessToast(`تم تحديث حساب المشغل (${formFullName}) ومزامنة صلاحياته بنجاح!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      const res = addUser({
        username: formUsername.trim(),
        fullNameAr: formFullName.trim(),
        password: formPassword || '123456',
        role: formRole,
        employeeId: formEmployeeId || undefined,
        assignedBranchIds: assigned,
        isActive: formIsActive,
        customPermissions: formCustomPermissions,
      });
      if (!res.success) {
        setFormError(res.error || 'فشل إنشاء الحساب');
        return;
      }
      setSuccessToast(`تم إنشاء حساب المشغل الجديد (@${formUsername}) ومزامنته سحابياً بنجاح!`);
      setTimeout(() => setSuccessToast(null), 4000);
    }

    setIsUserModalOpen(false);
  };

  const toggleBranchSelection = (branchId: string) => {
    if (branchId === '*') {
      setFormBranches(prev => prev.includes('*') ? [] : ['*']);
      return;
    }

    setFormBranches(prev => {
      const withoutAll = prev.filter(b => b !== '*');
      if (withoutAll.includes(branchId)) {
        return withoutAll.filter(b => b !== branchId);
      } else {
        return [...withoutAll, branchId];
      }
    });
  };

  // Group permissions by category
  const permissionCategories = Array.from(new Set(PERMISSION_DEFINITIONS.map(p => p.categoryAr)));

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-800 border border-purple-200">
              الشاشة 4
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              إعدادات المستخدمين والصلاحيات (Users & RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الحسابات، ربط المستخدمين بالرقم الوظيفي، تقييد النطاق بالفروع (Branch Scoping)، وضبط مصفوفة الصلاحيات الديناميكية.
          </p>
        </div>

        {/* View Switchers & Add button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>حسابات المستخدمين ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>مصفوفة الصلاحيات (RBAC Matrix)</span>
            </button>
          </div>

          {activeTab === 'users' && hasPermission('manage_users') && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await syncAllToCloud();
                  if (res.success) {
                    setSuccessToast('تمت مزامنة كافة حسابات المشغلين سحابياً مع قاعدة البيانات بنجاح!');
                    setTimeout(() => setSuccessToast(null), 4000);
                  }
                }}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border border-slate-300"
                title="مزامنة فورية لحسابات المشغلين مع قاعدة بيانات Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'جارِ المزامنة...' : 'مزامنة المشغلين سحابياً'}</span>
              </button>

              <button
                type="button"
                onClick={openAddUser}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء مشغل / مستخدم جديد</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Success Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Tab 1: Users List */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Search & Actions */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث باسم المستخدم أو الاسم الكامل..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleToggleRevealAll}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    revealAllPasswords
                      ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="إظهار أو إخفاء الرموز السرية لكافة المستخدمين"
                >
                  {revealAllPasswords ? <EyeOff className="w-4 h-4 text-purple-700" /> : <Eye className="w-4 h-4 text-purple-600" />}
                  <span>{revealAllPasswords ? 'إخفاء الرموز السرية' : 'إظهار الرموز السرية (مدير النظام)'}</span>
                </button>
              )}
              <div className="text-xs text-slate-500 font-medium">
                إجمالي الحسابات: <strong className="text-slate-800 font-bold">{users.length}</strong>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">الدور الوظيفي (Role)</th>
                    {isAdmin && (
                      <th className="py-3 px-4 text-purple-950 font-extrabold bg-purple-50/50">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-purple-600" />
                          <span>الرمز السري (PIN / Password)</span>
                        </div>
                      </th>
                    )}
                    <th className="py-3 px-4">الموظف المرتبط</th>
                    <th className="py-3 px-4">نطاق الفروع المسموح بها</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">آخر دخول</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {users
                    .filter(u =>
                      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.fullNameAr.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((user) => {
                      const roleInfo = USER_ROLES.find(r => r.id === user.role);
                      const linkedEmp = employees.find(e => e.id === user.employeeId);
                      const isSuper = user.id === 'usr-admin';

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition">
                          
                          {/* Username & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                                isSuper ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                              }`}>
                                {user.fullNameAr.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.fullNameAr}</span>
                                  {isSuper && (
                                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded-sm">
                                      المسؤول العام
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">@{user.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                roleInfo?.badgeColor || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {roleInfo?.nameAr || user.role}
                            </span>
                          </td>

                          {/* Password / Secret PIN for Admin */}
                          {isAdmin && (
                            <td className="py-3.5 px-4 font-mono text-xs bg-purple-50/20">
                              <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-xl border border-slate-300 w-fit transition shadow-2xs">
                                <span className="font-mono font-bold text-slate-950 tracking-wider select-all">
                                  {revealedPasswords[user.id] ? (user.password || '123456') : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  className="p-1 text-slate-500 hover:text-purple-700 rounded-lg hover:bg-white/80 transition cursor-pointer"
                                  title={revealedPasswords[user.id] ? 'إخفاء الرمز السري' : 'إظهار الرمز السري'}
                                >
                                  {revealedPasswords[user.id] ? (
                                    <EyeOff className="w-3.5 h-3.5 text-purple-700" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                                  )}
                                </button>
                                {revealedPasswords[user.id] && (
                                  <button
                                    type="button"
                                    onClick={() => copyPassword(user.password || '123456')}
                                    className="p-1 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white/80 transition cursor-pointer"
                                    title="نسخ الرمز السري"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Linked Employee */}
                          <td className="py-3.5 px-4">
                            {linkedEmp ? (
                              <div className="text-slate-800">
                                <div>{linkedEmp.nameAr}</div>
                                <div className="text-[10px] font-mono text-emerald-700">{linkedEmp.jobId}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">غير مرتبط بموظف</span>
                            )}
                          </td>

                          {/* Branch Scope */}
                          <td className="py-3.5 px-4">
                            {user.assignedBranchIds.includes('*') ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                🌐 كافة فروع الشركة (وصول شامل)
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {user.assignedBranchIds.map(bId => {
                                  const bObj = branches.find(b => b.id === bId);
                                  return (
                                    <span
                                      key={bId}
                                      className="inline-block text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                                    >
                                      🏢 {bObj ? bObj.nameAr.replace('فرع ', '') : bId}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Status & Cloud Sync */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  user.isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {user.isActive ? 'مفعل' : 'معطل'}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200 font-medium"
                                title="الحساب متزامن ومحفوظ سحابياً"
                              >
                                <Cloud className="w-3 h-3 text-teal-600" />
                                <span>متزامن</span>
                              </span>
                            </div>
                          </td>

                          {/* Last Login */}
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {user.lastLogin || 'لم يسجل الدخول'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {hasPermission('manage_users') && (
                                <button
                                  onClick={() => openEditUser(user)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                  title="تعديل الحساب والنطاق"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {!isSuper && hasPermission('manage_users') && (
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                  title="حذف الحساب"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Dynamic Permission Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">مصفوفة الصلاحيات الديناميكية (RBAC Matrix)</h2>
              <p className="text-xs text-slate-500">
                تحكم لحظي بكافة صلاحيات النظام لكل دور وظيفي. التغييرات تطبق فوراً على جميع المستخدمين التابعين للدور.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetRolePermissionsToDefault}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                استعادة الصلاحيات الافتراضية
              </button>
            </div>
          </div>

          {/* Role Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {USER_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setMatrixRole(role.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                  matrixRole === role.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {role.nameAr}
              </button>
            ))}
          </div>

          {/* Current Role Info Banner */}
          {(() => {
            const currentRoleInfo = USER_ROLES.find(r => r.id === matrixRole);
            return (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{currentRoleInfo?.nameAr}</span>
                    <span className="font-mono text-xs text-slate-400">({currentRoleInfo?.id})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{currentRoleInfo?.descriptionAr}</p>
                </div>
                {matrixRole === 'system_admin' && (
                  <span className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1 rounded-xl">
                    صلاحيات مطلقة غير مقيدة
                  </span>
                )}
              </div>
            );
          })()}

          {/* Permissions Matrix categorized */}
          <div className="space-y-4">
            {permissionCategories.map((category) => {
              const categoryPermissions = PERMISSION_DEFINITIONS.filter(p => p.categoryAr === category);

              return (
                <div key={category} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
                    <span>صلاحيات {category}</span>
                    <span className="text-[11px] font-mono text-slate-400">{categoryPermissions.length} إجراءات</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {categoryPermissions.map((perm) => {
                      const isEnabled = matrixRole === 'system_admin' ? true : !!rolePermissions[matrixRole]?.[perm.key];

                      return (
                        <div
                          key={perm.key}
                          className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <span>{perm.labelAr}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-normal">({perm.key})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{perm.descriptionAr}</div>
                          </div>

                          <div>
                            {matrixRole === 'system_admin' ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                متاح دوماً
                              </span>
                            ) : (
                              <button
                                onClick={() => updateRolePermission(matrixRole, perm.key, !isEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                                  isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                    isEnabled ? 'right-7' : 'right-1'
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'تعديل بيانات المستخدم ونطاق الوصول' : 'إنشاء حساب مستخدم جديد'}
              </h3>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">اسم المستخدم (Username) *</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="مثال: salem.mgr"
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-extrabold text-slate-900">
                      {editingUser ? 'الرمز السري / كلمة المرور' : 'الرمز السري (Password) *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showModalPassword ? 'إخفاء' : 'إظهار الرمز'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-purple-600 rounded-xl font-mono text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/20 shadow-xs outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                      title={showModalPassword ? 'إخفاء' : 'إظهار'}
                    >
                      {showModalPassword ? <EyeOff className="w-4 h-4 text-purple-700" /> : <Eye className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                  {editingUser && isAdmin && (
                    <div className="mt-1.5 p-2 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-950 flex items-center justify-between font-medium">
                      <span>الرمز الحالي: <strong className="font-mono text-xs font-bold text-slate-950 bg-white px-2 py-0.5 rounded-md border border-purple-200 select-all">{editingUser.password || '123456'}</strong></span>
                      <button
                        type="button"
                        onClick={() => copyPassword(editingUser.password || '123456')}
                        className="text-purple-800 hover:text-purple-950 font-bold flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-purple-200"
                        title="نسخ الرمز السري"
                      >
                        <Copy className="w-3 h-3 text-purple-700" />
                        <span>نسخ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">الاسم الكامل بالعربية *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="مثال: سالم الورفلي"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">الدور الوظيفي (Role) *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  >
                    {USER_ROLES.map(r => (
                      <option key={r.id} value={r.id} className="text-slate-900 bg-white font-medium">
                        {r.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">ربط بالموظف من السجل</label>
                  <select
                    value={formEmployeeId}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setFormEmployeeId(empId);
                      const emp = employees.find(e => e.id === empId);
                      if (emp) {
                        setFormFullName(emp.nameAr);
                        if (!formUsername.trim()) {
                          setFormUsername(emp.jobId.toLowerCase().replace(/[^a-z0-9]/g, ''));
                        }
                        if (emp.branchId) {
                          setFormBranches([emp.branchId]);
                        }
                        if (emp.statusId && USER_ROLES.some(r => r.id === emp.statusId)) {
                          setFormRole(emp.statusId as UserRole);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  >
                    <option value="" className="text-slate-900 bg-white">بدون ربط مباشر</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id} className="text-slate-900 bg-white">
                        {e.nameAr} ({e.jobId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch Multi-Selection */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>تعيين الفروع المصرح بها (Branch Scoping) *</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">عزل البيانات مفعل</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  اختر فرعاً واحداً أو عدة فروع. لن يتمكن المستخدم من رؤية موظفي أو سجلات أي فروع غير محددة.
                </p>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBranches.includes('*')}
                      onChange={() => toggleBranchSelection('*')}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-emerald-800">🌐 وصول شامل لكافة الفروع (All Branches)</span>
                  </label>

                  {!formBranches.includes('*') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {branches.map(b => (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                            formBranches.includes(b.id)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formBranches.includes(b.id)}
                            onChange={() => toggleBranchSelection(b.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>🏢 {b.nameAr}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Custom Permission Overrides */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">صلاحيات استثنائية خاصة للمستخدم</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-bold">
                    تخصيص فردي
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  يمكنك منح صلاحيات اعتماد محددة لهذا الشخص حتى وإن لم تكن متوفرة في دوره الوظيفي العام:
                </p>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-purple-300 transition">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        formRole === 'system_admin' ||
                        formRole === 'hr' ||
                        formRole === 'hr_officer' ||
                        formRole === 'branches_director' ||
                        !!formCustomPermissions['approve_transfer_request']
                      }
                      disabled={
                        formRole === 'system_admin' ||
                        formRole === 'hr' ||
                        formRole === 'hr_officer' ||
                        formRole === 'branches_director'
                      }
                      onChange={(e) => {
                        setFormCustomPermissions(prev => ({
                          ...prev,
                          approve_transfer_request: e.target.checked,
                        }));
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">صلاحية قبول واعتماد طلبات النقل بين الفروع</div>
                      <div className="text-[10px] text-slate-500">تمكين هذا الشخص من مراجعة واعتماد طلبات نقل الموظفين رسمياً بين الفروع</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                    {formRole === 'system_admin' || formRole === 'hr' || formRole === 'hr_officer' || formRole === 'branches_director'
                      ? 'مفعلة بالدور'
                      : formCustomPermissions['approve_transfer_request']
                      ? 'ممنوحة'
                      : 'غير ممنوحة'}
                  </span>
                </label>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="user-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="user-active" className="font-bold text-slate-700 cursor-pointer">
                  تفعيل الحساب والسماح بتسجيل الدخول
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
