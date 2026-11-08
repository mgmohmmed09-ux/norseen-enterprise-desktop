import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EnterpriseTask, UserRole } from '../../types';
import {
  CheckSquare,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Eye,
  Trash2,
  X,
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Users,
  Flag,
  Sparkles,
} from 'lucide-react';

export const TaskManagement: React.FC = () => {
  const {
    scopedTasks,
    branches,
    createTask,
    toggleTaskCompletion,
    toggleTaskArchive,
    deleteTask,
    hasPermission,
    currentUser,
  } = useApp();

  const [showArchived, setShowArchived] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');

  // Create Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [targetRoles, setTargetRoles] = useState<UserRole[]>(['branch_manager', 'assistant_branch_manager']);
  const [targetBranches, setTargetBranches] = useState<string[]>(['*']);
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [createError, setCreateError] = useState<string | null>(null);

  // Audit View Modal ("Who Completed" vs "Who is Remaining")
  const [auditTask, setAuditTask] = useState<EnterpriseTask | null>(null);

  // Complete Task Modal (for logged-in targeted user)
  const [completingTask, setCompletingTask] = useState<EnterpriseTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const openCreateModal = () => {
    setCreateError(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('high');
    setTargetRoles(['branch_manager', 'assistant_branch_manager']);
    setTargetBranches(['*']);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setTaskDueDate(d.toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!taskTitle.trim() || !taskDesc.trim()) {
      setCreateError('عنوان المهمة وتفاصيلها مطلوبة');
      return;
    }

    if (targetRoles.length === 0) {
      setCreateError('يرجى تحديد فئة مستهدفة على الأقل (مدراء الفروع أو المساعدين)');
      return;
    }

    const res = createTask({
      titleAr: taskTitle.trim(),
      descriptionAr: taskDesc.trim(),
      priority: taskPriority,
      targetRoles,
      targetBranchIds: targetBranches,
      dueDate: taskDueDate,
    });

    if (!res.success) {
      setCreateError(res.error || 'حدث خطأ أثناء إنشاء المهمة');
      return;
    }

    setIsCreateModalOpen(false);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;
    toggleTaskCompletion(completingTask.id, completionNotes.trim() || undefined);
    setCompletingTask(null);
  };

  const toggleRoleSelection = (role: UserRole) => {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleBranchSelection = (bId: string) => {
    if (bId === '*') {
      setTargetBranches(prev => prev.includes('*') ? [] : ['*']);
      return;
    }
    setTargetBranches(prev => {
      const withoutAll = prev.filter(b => b !== '*');
      return withoutAll.includes(bId) ? withoutAll.filter(b => b !== bId) : [...withoutAll, bId];
    });
  };

  // Filter tasks based on priority and archive status
  const visibleTasks = useMemo(() => {
    return scopedTasks.filter(task => {
      // Archive filter
      if (!showArchived && task.isArchived) return false;
      if (showArchived && !task.isArchived) return false;

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      return true;
    });
  }, [scopedTasks, showArchived, priorityFilter]);

  const canCreate = hasPermission('create_task');
  const canManage = hasPermission('manage_tasks');

  return (
    <div className="space-y-6 text-right">
      
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              الشاشة 7
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              شاشة المهام ومتابعة الإنجاز (Task Management & Audit)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إسناد المهام الميدانية والإدارية لمدراء ومساعدي الفروع، تتبع نسب الإنجاز اللحظية، وتدقيق من أنجز ومن تبقى.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle show archived */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? 'المهام المؤرشفة (المكتملة 100%)' : 'عرض الأرشيف والمكتملة'}</span>
          </button>

          {canCreate && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تكليف مهمة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">تصفية حسب الأولوية:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'urgent', label: 'عاجل جداً' },
              { id: 'high', label: 'مرتفع' },
              { id: 'medium', label: 'متوسط' },
              { id: 'low', label: 'عادي' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPriorityFilter(p.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  priorityFilter === p.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          المهام المعروضة: <strong className="text-slate-800">{visibleTasks.length}</strong> مهمة
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleTasks.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
            <CheckSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-600">
              {showArchived ? 'لا توجد مهام مؤرشفة حالياً' : 'لا توجد مهام نشطة حالياً'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {showArchived ? 'تتم أرشفة المهام تلقائياً فور وصول نسبة الإنجاز إلى 100%' : 'يمكنك إنشاء وتوزيع مهام جديدة'}
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const totalTargets = task.targets.length;
            const completedCount = task.targets.filter(t => t.isCompleted).length;
            const completionPercent = totalTargets > 0 ? Math.round((completedCount / totalTargets) * 100) : 0;

            // Check if current user is one of the targeted assignees
            const myTarget = task.targets.find(t => t.userId === currentUser?.id);
            const isCompletedByMe = myTarget?.isCompleted;

            const priorityBadge = {
              urgent: 'bg-rose-100 text-rose-800 border-rose-300',
              high: 'bg-orange-100 text-orange-800 border-orange-300',
              medium: 'bg-amber-100 text-amber-800 border-amber-300',
              low: 'bg-slate-100 text-slate-800 border-slate-300',
            }[task.priority];

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top Bar: Priority & Due Date */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${priorityBadge}`}>
                        {task.priority === 'urgent' && '🚨 عاجل جداً'}
                        {task.priority === 'high' && '🔥 أولوية قصوى'}
                        {task.priority === 'medium' && '⚡ أولوية متوسطة'}
                        {task.priority === 'low' && 'عادي'}
                      </span>

                      {task.isArchived && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          مؤرشفة (100%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>تاريخ الاستحقاق: {task.dueDate}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{task.titleAr}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{task.descriptionAr}</p>

                  {/* Targeted Roles Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
                    <span className="text-slate-400">الفئة المستهدفة:</span>
                    {task.targetRoles.map(role => (
                      <span
                        key={role}
                        className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        {role === 'branch_manager' ? 'مدراء الفروع' : 'مساعدي مدراء الفروع'}
                      </span>
                    ))}
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>نسبة الإنجاز الفعلية للفروع</span>
                      </span>
                      <span className="font-bold font-mono text-emerald-700 text-sm">
                        {completionPercent}% ({completedCount} من {totalTargets})
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          completionPercent === 100
                            ? 'bg-emerald-600'
                            : completionPercent >= 50
                            ? 'bg-teal-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Bottom: Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  
                  {/* Audit View Trigger */}
                  <button
                    onClick={() => setAuditTask(task)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>سجل التدقيق (من أنجز ومن تبقى)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Mark Complete for targeted user */}
                    {myTarget && (
                      <button
                        onClick={() => {
                          if (isCompletedByMe) {
                            toggleTaskCompletion(task.id);
                          } else {
                            setCompletingTask(task);
                            setCompletionNotes('');
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                          isCompletedByMe
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isCompletedByMe ? 'تم إنجازك ✓' : 'تأكيد إنجاز المهمة'}</span>
                      </button>
                    )}

                    {/* Manage / Archive / Delete */}
                    {canManage && (
                      <>
                        <button
                          onClick={() => toggleTaskArchive(task.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title={task.isArchived ? 'إلغاء الأرشفة' : 'أرشفة المهمة'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="حذف المهمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Audit View Modal ("Who Completed" vs "Who is Remaining") */}
      {auditTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => setAuditTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">سجل تدقيق المهمة (Audit View)</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{auditTask.titleAr}</p>
              </div>
            </div>

            <div className="py-4 space-y-5 text-xs">
              
              {/* Completed Targets List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>من أنجز المهمة ({auditTask.targets.filter(t => t.isCompleted).length})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {auditTask.targets.filter(t => t.isCompleted).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                      لم يقم أي مستهدف بإتمام المهمة حتى الآن
                    </div>
                  ) : (
                    auditTask.targets.filter(t => t.isCompleted).map((target) => (
                      <div
                        key={target.userId}
                        className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{target.userNameAr}</span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">
                              {target.branchNameAr}
                            </span>
                          </div>
                          {target.completionNotesAr && (
                            <p className="text-[11px] text-slate-600 mt-1 italic">
                              "{target.completionNotesAr}"
                            </p>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-md shrink-0 self-start sm:self-center">
                          أنجز في: {target.completedAt}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Remaining Targets List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <UserX className="w-4 h-4 text-amber-600" />
                    <span>المتبقين قيد الانتظار ({auditTask.targets.filter(t => !t.isCompleted).length})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {auditTask.targets.filter(t => !t.isCompleted).length === 0 ? (
                    <div className="p-4 bg-emerald-50 rounded-xl text-center text-emerald-800 text-xs font-bold">
                      🎉 تم إنجاز المهمة بنسبة 100% من قِبل جميع المستهدفين!
                    </div>
                  ) : (
                    auditTask.targets.filter(t => !t.isCompleted).map((target) => (
                      <div
                        key={target.userId}
                        className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{target.userNameAr}</div>
                          <div className="text-[10px] text-slate-500">
                            {target.userRole === 'branch_manager' ? 'مدير فرع' : 'مساعد مدير'} | {target.branchNameAr}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900">
                          لم يتم الإنجاز بعد
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuditTask(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Complete Task Modal with notes */}
      {completingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setCompletingTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">تأكيد إنجاز المهمة</h3>
            </div>

            <div className="py-3 text-xs text-slate-600">
              <div className="font-bold text-slate-900 text-sm mb-1">{completingTask.titleAr}</div>
              <p className="text-slate-500">
                سيتم تسجيل تاريخ ووقت إنجازك في سجل التدقيق ومشاركته مع الإدارة العامة.
              </p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تقرير الإنجاز أو الملاحظات</label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="مثال: تم إتمام مطابقة الجرد وتوقيع المحضر من الفرع..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  تأكيد الإنجاز
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-900">إنشاء وتوزيع مهمة جديدة</h3>
            </div>

            {createError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              
              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="مثال: مطابقة الإيداعات النقدية الأسبوعية"
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1.5">تفاصيل وتعليمات المهمة *</label>
                <textarea
                  rows={3}
                  required
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="وصف المطلوب تنفيذه من مدراء الفروع..."
                  className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-medium text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">درجة الأولوية</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  >
                    <option value="urgent" className="text-slate-900 bg-white">عاجل جداً (Urgent)</option>
                    <option value="high" className="text-slate-900 bg-white">أولوية قصوى (High)</option>
                    <option value="medium" className="text-slate-900 bg-white">أولوية متوسطة (Medium)</option>
                    <option value="low" className="text-slate-900 bg-white">عادي (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-900 mb-1.5">تاريخ الاستحقاق (Due Date)</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl font-bold text-xs text-slate-950 focus:ring-2 focus:ring-emerald-500/20 shadow-xs outline-hidden transition"
                  />
                </div>
              </div>

              {/* Target Roles */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1.5">
                  الفئة الوظيفية المستهدفة (Target Roles) *
                </label>
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                    targetRoles.includes('branch_manager')
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={targetRoles.includes('branch_manager')}
                      onChange={() => toggleRoleSelection('branch_manager')}
                      className="rounded text-emerald-600"
                    />
                    <span>مدراء الفروع</span>
                  </label>

                  <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                    targetRoles.includes('assistant_branch_manager')
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={targetRoles.includes('assistant_branch_manager')}
                      onChange={() => toggleRoleSelection('assistant_branch_manager')}
                      className="rounded text-emerald-600"
                    />
                    <span>مساعدي الفروع</span>
                  </label>
                </div>
              </div>

              {/* Target Branches */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1.5">
                  الفروع المستهدفة بالتكليف *
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetBranches.includes('*')}
                      onChange={() => toggleBranchSelection('*')}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-bold text-emerald-800">كافة فروع الشركة (توزيع عام)</span>
                  </label>

                  {!targetBranches.includes('*') && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {branches.map(b => (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                            targetBranches.includes(b.id)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={targetBranches.includes(b.id)}
                            onChange={() => toggleBranchSelection(b.id)}
                            className="rounded text-emerald-600"
                          />
                          <span>🏢 {b.nameAr}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  تكليف وتوزيع المهمة
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
