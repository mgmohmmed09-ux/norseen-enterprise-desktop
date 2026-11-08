import * as XLSX from 'xlsx';
import { Branch, Employee, EmploymentStatusConfig, IncidentRecord, ShiftConfig, WeeklyBranchReportRecord } from '../types';

export const exportEmployeesToExcel = (
  employees: Employee[],
  branches: Branch[],
  statuses: EmploymentStatusConfig[],
  shifts: ShiftConfig[],
  fileName = 'norseen_employees_registry.xlsx'
) => {
  const branchMap = new Map(branches.map(b => [b.id, b.nameAr]));
  const statusMap = new Map(statuses.map(s => [s.id, s.nameAr]));
  const shiftMap = new Map(shifts.map(s => [s.id, s.nameAr]));

  const data = employees.map((emp, index) => ({
    'م': index + 1,
    'الرقم الوظيفي': emp.jobId,
    'اسم الموظف': emp.nameAr,
    'الرقم الوطني': emp.nationalId,
    'سنة الميلاد': emp.birthYear || '-',
    'الفرع': branchMap.get(emp.branchId) || emp.branchId,
    'الوضع الوظيفي': statusMap.get(emp.statusId) || emp.statusId,
    'الدوام': shiftMap.get(emp.shift) || emp.shift,
    'تاريخ المباشرة': emp.startDate,
    'رصيد الإجازات (أيام)': emp.vacationBalance,
    'رقم الهاتف': emp.phone || '-',
    'البريد الإلكتروني': emp.email || '-',
    'ملاحظات': emp.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Set RTL on sheet
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل الموظفين');
  XLSX.writeFile(workbook, fileName);
};

export const exportWeeklyBranchReportToExcel = (
  branch: Branch,
  employees: Employee[],
  statuses: EmploymentStatusConfig[],
  shifts: ShiftConfig[],
  leaveMap: Map<string, string>,
  reportRecord?: WeeklyBranchReportRecord,
  fileName?: string
) => {
  const statusMap = new Map(statuses.map(s => [s.id, s.nameAr]));
  const shiftMap = new Map(shifts.map(s => [s.id, s.nameAr]));

  const evalLabels: Record<string, string> = {
    excellent: 'ممتاز 🌟',
    very_good: 'جيد جداً ⭐',
    good: 'جيد 👍',
    needs_improvement: 'يحتاج تحسين ⚠️',
  };

  const data = employees.map((emp, index) => {
    const ev = reportRecord?.evaluations?.[emp.id];
    return {
      'م': index + 1,
      'الرقم الوظيفي': emp.jobId,
      'اسم الموظف': emp.nameAr,
      'الوضع الوظيفي': statusMap.get(emp.statusId) || emp.statusId,
      'وردية الدوام': shiftMap.get(emp.shift) || (emp.shift === 'morning' ? 'صباحي' : emp.shift === 'evening' ? 'مسائي' : 'دوام كامل'),
      'حالة العمل / الإجازة': leaveMap.get(emp.id) || 'على رأس العمل',
      'التقييم الأسبوعي': ev ? evalLabels[ev.rating] || ev.rating : 'لم يتم التقييم',
      'ملاحظات التقييم': ev?.note || '-',
      'الفرع': branch.nameAr,
      'تاريخ المباشرة': emp.startDate,
      'حالة اعتماد التقرير': reportRecord?.isApproved ? `معتمد - ${reportRecord.approvedByNameAr || 'مدير الفرع'}` : 'قيد المراجعة',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  const safeName = (branch.nameAr || 'branch').replace(/[/\\?%*:|"<>]/g, '_');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير الأسبوعي');
  XLSX.writeFile(workbook, fileName || `weekly_report_${safeName}.xlsx`);
};

export const exportIncidentsToExcel = (
  incidents: IncidentRecord[],
  branches: Branch[],
  fileName = 'norseen_attendance_incidents.xlsx'
) => {
  const branchMap = new Map(branches.map(b => [b.id, b.nameAr]));

  const data = incidents.map((inc, index) => ({
    'م': index + 1,
    'التاريخ': inc.date,
    'الرقم الوظيفي': inc.jobId,
    'اسم الموظف': inc.employeeNameAr,
    'الفرع': branchMap.get(inc.branchId) || inc.branchId,
    'نوع الحالة': inc.type === 'absence' ? 'غياب' : 'تأخير',
    'مدة التأخير (دقائق)': inc.delayDurationMinutes ? `${inc.delayDurationMinutes} دقيقة` : '-',
    'وقت الوصول': inc.arrivalTime || '-',
    'الحالة': inc.isExcused ? 'معذور / معتمد' : 'غير معذور',
    'السبب / الملاحظات': inc.reasonAr || '-',
    'المسجل': inc.recordedByName,
    'تاريخ التسجيل': inc.createdAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الغياب والتأخير');
  XLSX.writeFile(workbook, fileName);
};

export const downloadEmployeeImportTemplate = () => {
  const templateData = [
    {
      'الرقم الوظيفي': 'NRS-901',
      'اسم الموظف': 'مثال: أحمد عبد الله المحمودي',
      'الرقم الوطني': '119950123456',
      'سنة الميلاد': 1995,
      'تاريخ المباشرة (YYYY-MM-DD)': '2024-05-01',
      'رصيد الإجازات': 21,
      'رمز الفرع': 'b-jaraba',
      'رمز الدوام': 'morning',
      'رمز الوضع الوظيفي': 'sales_agent',
      'رقم الهاتف': '091-1234567',
      'البريد الإلكتروني': 'ahmed.m@norseen.ly',
      'ملاحظات': 'موظف مبيعات جديد',
    },
    {
      'الرقم الوظيفي': 'NRS-902',
      'اسم الموظف': 'مثال: مروان كمال الدرسي',
      'الرقم الوطني': '119930987654',
      'سنة الميلاد': 1993,
      'تاريخ المباشرة (YYYY-MM-DD)': '2024-06-15',
      'رصيد الإجازات': 18,
      'رمز الفرع': 'b-siahiya',
      'رمز الدوام': 'evening',
      'رمز الوضع الوظيفي': 'warehouse_custodian',
      'رقم الهاتف': '092-2345678',
      'البريد الإلكتروني': 'marwan.d@norseen.ly',
      'ملاحظات': 'أمين مخزن',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!views'] = [{ rightToLeft: true }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج استيراد الموظفين');
  XLSX.writeFile(workbook, 'norseen_employees_template.xlsx');
};

export interface ParsedEmployeeRow {
  rowNum: number;
  nameAr: string;
  jobId?: string;
  nationalId?: string;
  birthYear?: number;
  startDate?: string;
  vacationBalance?: number;
  branchId?: string;
  shift?: string;
  statusId?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel/diacritics
    .replace(/[إأآٱ]/g, 'ا') // standardize alifs
    .replace(/ة/g, 'ه') // standardize taa marbouta
    .replace(/ى/g, 'ي') // standardize yaa
    .replace(/[\-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

export const parseEmployeeExcelFile = async (
  file: File,
  branches: Branch[],
  statuses: EmploymentStatusConfig[],
  shifts: ShiftConfig[]
): Promise<ParsedEmployeeRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Branch mapping index
        const branchMap = new Map<string, string>();
        branches.forEach((b) => {
          branchMap.set(b.id.toLowerCase(), b.id);
          branchMap.set(b.code.toLowerCase(), b.id);
          branchMap.set(normalizeArabic(b.nameAr), b.id);
          branchMap.set(normalizeArabic(b.nameAr.replace(/^فرع\s+/, '')), b.id);
        });

        // Shift mapping index
        const shiftMap = new Map<string, string>();
        shifts.forEach((s) => {
          shiftMap.set(s.id.toLowerCase(), s.id);
          shiftMap.set(normalizeArabic(s.nameAr), s.id);
        });
        shiftMap.set('morning', 'morning');
        shiftMap.set('صباحي', 'morning');
        shiftMap.set('صباح', 'morning');
        shiftMap.set('الفترة الصباحية', 'morning');
        shiftMap.set('evening', 'evening');
        shiftMap.set('مسائي', 'evening');
        shiftMap.set('مساء', 'evening');
        shiftMap.set('الفترة المسائية', 'evening');
        shiftMap.set('full_time', 'full_time');
        shiftMap.set('دوام كامل', 'full_time');
        shiftMap.set('كامل', 'full_time');

        // Status mapping index
        const statusMap = new Map<string, string>();
        statuses.forEach((st) => {
          statusMap.set(st.id.toLowerCase(), st.id);
          statusMap.set(normalizeArabic(st.nameAr), st.id);
        });
        statusMap.set(normalizeArabic('موظف مبيعات'), 'sales_agent');
        statusMap.set(normalizeArabic('مندوب مبيعات'), 'sales_agent');
        statusMap.set(normalizeArabic('بائع'), 'sales_agent');
        statusMap.set(normalizeArabic('أمين مخازن'), 'warehouse_custodian');
        statusMap.set(normalizeArabic('أمين مخزن'), 'warehouse_custodian');
        statusMap.set(normalizeArabic('مسؤول مخازن'), 'warehouse_custodian');
        statusMap.set(normalizeArabic('مشرف'), 'supervisor');
        statusMap.set(normalizeArabic('مدير فرع'), 'branch_manager');
        statusMap.set(normalizeArabic('محاسب'), 'accountant');
        statusMap.set(normalizeArabic('أمين خزينة'), 'treasurer');

        const findRowVal = (row: any, keys: string[]): any => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
              return row[k];
            }
          }
          const rowKeys = Object.keys(row);
          for (const k of keys) {
            const kNorm = k.trim().toLowerCase();
            const foundKey = rowKeys.find((rk) => rk.trim().toLowerCase() === kNorm);
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
              return row[foundKey];
            }
          }
          return undefined;
        };

        const parseDate = (val: any): string | undefined => {
          if (val === null || val === undefined || val === '') return undefined;
          if (typeof val === 'number') {
            const d = new Date(Math.round((val - 25569) * 86400 * 1000));
            if (!isNaN(d.getTime())) {
              return d.toISOString().split('T')[0];
            }
          }
          const str = String(val).trim();
          if (!str || str === '-') return undefined;
          if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
            const parts = str.split(/[-/]/);
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
          if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
            const parts = str.split(/[-/]/);
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          return str;
        };

        const parseYear = (val: any): number | undefined => {
          if (val === null || val === undefined || val === '' || val === '-') return undefined;
          if (typeof val === 'number') {
            if (val >= 1930 && val <= 2030) return Math.floor(val);
            if (val > 20000) {
              const d = new Date(Math.round((val - 25569) * 86400 * 1000));
              if (!isNaN(d.getTime())) return d.getFullYear();
            }
          }
          const str = String(val).trim();
          const match = str.match(/\b(19\d\d|20\d\d)\b/);
          if (match) return parseInt(match[1], 10);
          return undefined;
        };

        const parseString = (val: any): string | undefined => {
          if (val === null || val === undefined) return undefined;
          const s = String(val).trim();
          if (s === '' || s === '-' || s === 'لا يوجد' || s === 'null') return undefined;
          return s;
        };

        const parsedEmployees: ParsedEmployeeRow[] = [];

        rows.forEach((row, idx) => {
          const rowNum = idx + 2;

          const nameAr = parseString(
            findRowVal(row, [
              'اسم الموظف',
              'الاسم',
              'اسم الموظف الرباعي',
              'الاسم الرباعي',
              'اسم',
              'الأسم',
              'اسم_الموظف',
              'Name',
              'Employee Name',
              'EmployeeName',
            ])
          );

          const jobId = parseString(
            findRowVal(row, [
              'الرقم الوظيفي',
              'رقم الوظيفة',
              'رقم الموظف',
              'كود الموظف',
              'الرقم_الوظيفي',
              'الرقم',
              'JobId',
              'Job ID',
              'ID',
              'EmpID',
              'Employee ID',
            ])
          );

          const nationalId = parseString(
            findRowVal(row, [
              'الرقم الوطني',
              'الرقم_الوطني',
              'الرقم القومي',
              'رقم الهوية',
              'الهوية الوطنية',
              'الهوية',
              'NationalId',
              'National ID',
              'NID',
            ])
          );

          // If completely empty line (no name, no jobId, no nationalId), skip
          if (!nameAr && !jobId && !nationalId) return;

          const birthYear = parseYear(
            findRowVal(row, [
              'سنة الميلاد',
              'سنة_الميلاد',
              'الميلاد',
              'عام الميلاد',
              'تاريخ الميلاد',
              'BirthYear',
              'Birth Year',
              'Year',
            ])
          );

          const startDate = parseDate(
            findRowVal(row, [
              'تاريخ المباشرة (YYYY-MM-DD)',
              'تاريخ المباشرة',
              'تاريخ_المباشرة',
              'تاريخ التعيين',
              'تاريخ البدء',
              'Start Date',
              'StartDate',
              'HireDate',
            ])
          );

          const rawVacation = findRowVal(row, [
            'رصيد الإجازات (أيام)',
            'رصيد الإجازات',
            'رصيد الاجازات',
            'الرصيد',
            'إجازات',
            'اجازات',
            'VacationBalance',
            'Vacation Balance',
            'Balance',
          ]);
          let vacationBalance: number | undefined = undefined;
          if (rawVacation !== undefined && rawVacation !== null && String(rawVacation).trim() !== '' && String(rawVacation).trim() !== '-') {
            const num = parseFloat(String(rawVacation).trim());
            if (!isNaN(num)) vacationBalance = num;
          }

          // Resolve branch if provided
          const rawBranch = parseString(
            findRowVal(row, [
              'رمز الفرع',
              'الفرع',
              'اسم الفرع',
              'رمز_الفرع',
              'Branch',
              'Branch Name',
              'Branch Code',
              'BranchId',
            ])
          );
          let branchId: string | undefined = undefined;
          if (rawBranch) {
            const normB = normalizeArabic(rawBranch);
            if (branchMap.has(rawBranch.toLowerCase())) {
              branchId = branchMap.get(rawBranch.toLowerCase());
            } else if (branchMap.has(normB)) {
              branchId = branchMap.get(normB);
            } else {
              // Try partial match
              const partial = branches.find(
                (b) =>
                  normalizeArabic(b.nameAr).includes(normB) ||
                  normB.includes(normalizeArabic(b.nameAr))
              );
              if (partial) branchId = partial.id;
            }
          }

          // Resolve shift if provided
          const rawShift = parseString(
            findRowVal(row, [
              'رمز الدوام',
              'الدوام',
              'نوع الدوام',
              'الفترة',
              'رمز_الدوام',
              'Shift',
              'Work Shift',
              'ShiftId',
            ])
          );
          let shift: string | undefined = undefined;
          if (rawShift) {
            const normS = normalizeArabic(rawShift);
            if (shiftMap.has(rawShift.toLowerCase())) {
              shift = shiftMap.get(rawShift.toLowerCase());
            } else if (shiftMap.has(normS)) {
              shift = shiftMap.get(normS);
            }
          }

          // Resolve status if provided
          const rawStatus = parseString(
            findRowVal(row, [
              'رمز الوضع الوظيفي',
              'الوضع الوظيفي',
              'رمز_الوضع_الوظيفي',
              'المسمى الوظيفي',
              'الوظيفة',
              'الصفة',
              'Status',
              'Job Title',
              'Role',
              'StatusId',
            ])
          );
          let statusId: string | undefined = undefined;
          if (rawStatus) {
            const normSt = normalizeArabic(rawStatus);
            if (statusMap.has(rawStatus.toLowerCase())) {
              statusId = statusMap.get(rawStatus.toLowerCase());
            } else if (statusMap.has(normSt)) {
              statusId = statusMap.get(normSt);
            }
          }

          const phone = parseString(
            findRowVal(row, ['رقم الهاتف', 'الهاتف', 'رقم الموبايل', 'الموبايل', 'الجوال', 'Phone', 'Mobile', 'Tel'])
          );

          const email = parseString(
            findRowVal(row, [
              'البريد الإلكتروني',
              'البريد الالكتروني',
              'البريد',
              'الايميل',
              'الإيميل',
              'Email',
              'E-mail',
            ])
          );

          const notes = parseString(
            findRowVal(row, ['ملاحظات', 'الملاحظات', 'ملاحظة', 'Notes', 'Note', 'Comment'])
          );

          parsedEmployees.push({
            rowNum,
            nameAr: nameAr || '',
            jobId,
            nationalId,
            birthYear,
            startDate,
            vacationBalance,
            branchId,
            shift,
            statusId,
            phone,
            email,
            notes,
          });
        });

        resolve(parsedEmployees);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

