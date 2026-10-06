import React, { useEffect, useState } from 'react';
import {
  Layers,
  School,
  Users,
  GraduationCap,
  BookOpen,
  Link2,
  Trash2,
  Plus,
  Sliders,
  Star,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  Check,
  Shield,
  History,
  Megaphone,
  Brain,
  Download,
  Upload,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { isValidEmailOrNationalId, normalizeEmailOrNationalId } from '../../api';
import { UserRole, Teacher, Student } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { toEnglishDigits, toPersianDigits, validateIranianNationalId, formatShamsiDate } from '../../lib/persianUtils';
import { ROLE_DETAILS } from '../../lib/auth';
import { CreateNotificationModal } from '../notifications/CreateNotificationModal';
import { CurriculumSubject, CurriculumTrack, getCurriculumSubjects, getSuggestedCoefficient } from '../../lib/curriculum';
import { TalentOverview } from '../TalentOverview';
import { StudentHolisticReport } from './StudentHolisticReport';
import { SchoolAttitudeDashboard } from '../SchoolAttitudeDashboard';
import { SchoolRiskMap } from './SchoolRiskMap';

const normalizeSpreadsheetText = (value: unknown) =>
  toEnglishDigits(String(value ?? ''))
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const getSpreadsheetValue = (row: Record<string, unknown>, aliases: string[]) => {
  const column = Object.keys(row).find((key) =>
    aliases.some((alias) => normalizeSpreadsheetText(key) === normalizeSpreadsheetText(alias))
  );
  return column ? String(row[column] ?? '').trim() : '';
};

const getSpreadsheetCellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const cellValue = value as Record<string, unknown>;
    if (typeof cellValue.text === 'string') return cellValue.text;
    if (typeof cellValue.result === 'string' || typeof cellValue.result === 'number') return String(cellValue.result);
    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((part) => typeof part === 'object' && part !== null && 'text' in part ? String(part.text) : '').join('');
    }
  }
  return String(value);
};

const createSpreadsheetTemplateBlob = async (kind: 'students' | 'teachers' | 'assignments') => {
  const ExcelJS = await import('exceljs');
  const headers = kind === 'students'
    ? ['نام', 'نام خانوادگی', 'کد ملی', 'شماره دانش‌آموزی', 'کلاس']
    : kind === 'teachers'
      ? ['نام و نام خانوادگی', 'تخصص', 'مدرک تحصیلی', 'سابقه (سال)', 'وضعیت استخدام', 'کد پرسنلی']
      : ['کد پرسنلی', 'نام دبیر', 'کلاس', 'نام درس'];
  const workbook = new ExcelJS.Workbook();
  const worksheetName = kind === 'students' ? 'دانش‌آموزان' : kind === 'teachers' ? 'دبیران' : 'تخصیص دروس';
  const worksheet = workbook.addWorksheet(worksheetName);
  worksheet.addRow(headers);
  worksheet.columns = headers.map((_, index) => ({ key: `column${index}`, width: 22 }));
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const downloadSpreadsheetTemplate = (kind: 'students' | 'teachers' | 'assignments', url?: string) => {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = kind === 'students' ? 'قالب-دانش‌آموزان.xlsx' : kind === 'teachers' ? 'قالب-دبیران.xlsx' : 'قالب-تخصیص-دروس.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    users,
    grades,
    classes,
    students,
    teachers,
    assignments,
    subjectDifficulties,
    evaluations,
    studentStaffEvaluations,
    gradesSheet,
    psychResults,
    schoolAttitudeResults,
    tuitionPayments,
    schoolExpenses,
    familyProfiles,
    extracurriculars,
    attendanceRecords,
    prayerSurveyResponses,
    addGrade,
    deleteGrade,
    addClass,
    deleteClass,
    addStudent,
    deleteStudent,
    addTeacher,
    deleteTeacher,
    addAssignment,
    deleteAssignment,
    createUserAccount,
    deleteUserAccount,
    updateSubjectDifficulty,
    addCustomSubject,
    deleteCustomSubject,
    saveTeacherEvaluation,
    deleteTeacherEvaluation,
    deleteStudentGrade,
    deletePsychTest,
    deleteFamilyProfile,
    deleteExtracurricular,
    calculateTeacherWeightedScore,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'structure' | 'users' | 'difficulty' | 'evaluation' | 'talents' | 'studentSummary' | 'schoolAttitude' | 'riskMap' | 'allData'>('structure');

  // Structure subtabs
  const [structureSubTab, setStructureSubTab] = useState<'grades_classes' | 'students' | 'teachers' | 'assignments'>('grades_classes');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isImportingSpreadsheet, setIsImportingSpreadsheet] = useState(false);
  const [spreadsheetTemplateUrls, setSpreadsheetTemplateUrls] = useState<Partial<Record<'students' | 'teachers' | 'assignments', string>>>({});
  const [spreadsheetTemplateError, setSpreadsheetTemplateError] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    let isActive = true;
    let templateUrls: string[] = [];

    const prepareTemplates = async () => {
      const [studentsBlob, teachersBlob, assignmentsBlob] = await Promise.all([
        createSpreadsheetTemplateBlob('students'),
        createSpreadsheetTemplateBlob('teachers'),
        createSpreadsheetTemplateBlob('assignments'),
      ]);
      const urls = {
        students: URL.createObjectURL(studentsBlob),
        teachers: URL.createObjectURL(teachersBlob),
        assignments: URL.createObjectURL(assignmentsBlob),
      };
      templateUrls = Object.values(urls);

      if (!isActive) {
        templateUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      setSpreadsheetTemplateUrls(urls);
    };

    void prepareTemplates().catch((error) => {
      console.error('Failed to prepare spreadsheet templates.', error);
      if (isActive) setSpreadsheetTemplateError(true);
    });

    return () => {
      isActive = false;
      templateUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Grade Form State
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeOrder, setNewGradeOrder] = useState<number>(grades.length + 1);

  // Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGradeId, setNewClassGradeId] = useState('');
  const [newClassYear, setNewClassYear] = useState('۱۴۰۴-۱۴۰۵');

  // Student Form State
  const [studentFirst, setStudentFirst] = useState('');
  const [studentLast, setStudentLast] = useState('');
  const [studentNationalId, setStudentNationalId] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentClassId, setStudentClassId] = useState('');

  // Teacher Form State
  const [teacherName, setTeacherName] = useState('');
  const [teacherSpecialty, setTeacherSpecialty] = useState('');
  const [teacherDegree, setTeacherDegree] = useState('کارشناسی ارشد');
  const [teacherExp, setTeacherExp] = useState(5);
  const [teacherEmployment, setTeacherEmployment] = useState<'official' | 'contractual' | 'hourly' | 'corporate'>('official');
  const [teacherCode, setTeacherCode] = useState('');

  // Assignment Form State
  const [asgnTeacherId, setAsgnTeacherId] = useState('');
  const [asgnClassId, setAsgnClassId] = useState('');
  const [asgnSubject, setAsgnSubject] = useState('');

  // User Account Form State
  const [accRole, setAccRole] = useState<UserRole>('teacher');
  const [accFullName, setAccFullName] = useState('');
  const [accUsername, setAccUsername] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accLinkedId, setAccLinkedId] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPhone, setAccPhone] = useState('');

  // Evaluation by Principal State
  const [evalTeacherId, setEvalTeacherId] = useState('');
  const [evalScores, setEvalScores] = useState({
    time_management: 5,
    student_engagement: 5,
    formative_feedback: 5,
    positive_atmosphere: 5,
    instructional_design: 5,
    teaching_variety: 5,
  });
  const [evalNotes, setEvalNotes] = useState('');

  // Search filter for all data tab
  const [dataSearchTerm, setDataSearchTerm] = useState('');
  const [dataFilterType, setDataFilterType] = useState<string>('all');
  const [difficultyGradeId, setDifficultyGradeId] = useState('grade_7');
  const [difficultyTrack, setDifficultyTrack] = useState<CurriculumTrack>('general');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customSubjectCategory, setCustomSubjectCategory] = useState<CurriculumSubject['category']>('تخصصی');
  const [customSubjectCoefficient, setCustomSubjectCoefficient] = useState('1.00');

  // Handlers
  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName) return;
    const res = await addGrade(newGradeName, Number(newGradeOrder));
    if (res.success) {
      setNewGradeName('');
      showFeedback('success', 'پایه تحصیلی با موفقیت افزوده شد.');
    } else {
      showFeedback('error', res.message || 'خطا در افزودن پایه.');
    }
  };

  const handleAddCustomSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addCustomSubject(
      customSubjectName,
      customSubjectCategory,
      Number(customSubjectCoefficient),
      difficultyGradeId,
      difficultyTrack
    );
    if (result.success) {
      setCustomSubjectName('');
      setCustomSubjectCoefficient('1.00');
      showFeedback('success', 'درس سفارشی با موفقیت اضافه شد.');
    } else {
      showFeedback('error', result.message || 'افزودن درس انجام نشد.');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassGradeId) {
      showFeedback('error', 'لطفاً نام کلاس و پایه مربوطه را مشخص فرمایید.');
      return;
    }
    const res = await addClass(newClassName, newClassGradeId, newClassYear);
    if (res.success) {
      setNewClassName('');
      showFeedback('success', 'کلاس با موفقیت ایجاد شد.');
    } else {
      showFeedback('error', res.message || 'خطا در ثبت کلاس.');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIranianNationalId(studentNationalId)) {
      showFeedback('error', 'کد ملی وارد شده نامعتبر است (کنترل رقم رقم آخر کد ملی ۱۰ رقمی با شکست مواجه شد).');
      return;
    }
    const targetClass = classes.find((c) => c.id === studentClassId);
    if (!targetClass) {
      showFeedback('error', 'لطفاً کلاس دانش‌آموز را انتخاب فرمایید.');
      return;
    }

    const res = await addStudent({
      firstName: studentFirst,
      lastName: studentLast,
      nationalId: studentNationalId,
      studentCode: studentCode || `S-${Date.now().toString().slice(-4)}`,
      classId: studentClassId,
      gradeId: targetClass.gradeId,
    });

    if (res.success) {
      setStudentFirst('');
      setStudentLast('');
      setStudentNationalId('');
      setStudentCode('');
      showFeedback('success', 'دانش‌آموز با موفقیت ثبت شد.');
    } else {
      showFeedback('error', res.message || 'خطا در ثبت دانش‌آموز.');
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherSpecialty || !teacherCode) {
      showFeedback('error', 'لطفاً فیلدهای الزامی دبیر را تکمیل نمایید.');
      return;
    }

    const res = await addTeacher({
      fullName: teacherName,
      specialty: teacherSpecialty,
      degree: teacherDegree,
      experienceYears: Number(teacherExp),
      employmentType: teacherEmployment,
      teacherCode,
    });

    if (res.success) {
      setTeacherName('');
      setTeacherSpecialty('');
      setTeacherCode('');
      showFeedback('success', 'مشخصات دبیر با موفقیت ثبت گردید.');
    } else {
      showFeedback('error', res.message || 'خطا در ثبت دبیر.');
    }
  };

  const handleSpreadsheetImport = async (file: File, kind: 'students' | 'teachers' | 'assignments') => {
    setIsImportingSpreadsheet(true);
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('برگه‌ای برای خواندن در فایل پیدا نشد.');

      const headers = (worksheet.getRow(1).values as unknown[]).slice(1).map(getSpreadsheetCellText);
      const rows: Record<string, unknown>[] = [];
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
        const values = worksheet.getRow(rowNumber).values as unknown[];
        rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index + 1]])));
      }
      if (rows.length === 0) throw new Error('فایل اکسل ردیفی برای ثبت ندارد.');

      const assignmentTeacherCodeAliases = ['کد پرسنلی', 'شماره دبیر', 'teacher code'];
      const assignmentTeacherNameAliases = ['نام دبیر', 'نام و نام خانوادگی', 'نام کامل', 'teacher name', 'full name'];
      const requiredHeaders: Record<string, string[]> = kind === 'students'
        ? { firstName: ['نام', 'first name'], lastName: ['نام خانوادگی', 'last name'], nationalId: ['کد ملی', 'national id'], className: ['کلاس', 'نام کلاس', 'class'] }
        : kind === 'teachers'
          ? { fullName: ['نام و نام خانوادگی', 'نام کامل', 'full name'], specialty: ['تخصص', 'رشته', 'specialty'], teacherCode: ['کد پرسنلی', 'شماره دبیر', 'teacher code'] }
          : { className: ['کلاس', 'نام کلاس', 'class'], subject: ['نام درس', 'درس', 'subject'] };
      const missingHeaders = Object.entries(requiredHeaders)
        .filter(([, aliases]) => !headers.some((header) => aliases.some((alias) => normalizeSpreadsheetText(header) === normalizeSpreadsheetText(alias))));
      const hasAssignmentTeacherHeader = headers.some((header) =>
        [...assignmentTeacherCodeAliases, ...assignmentTeacherNameAliases].some((alias) => normalizeSpreadsheetText(header) === normalizeSpreadsheetText(alias))
      );
      if (kind === 'assignments' && !hasAssignmentTeacherHeader) {
        throw new Error('ستون کد پرسنلی یا نام دبیر باید در فایل وجود داشته باشد.');
      }
      if (missingHeaders.length > 0) {
        throw new Error(kind === 'students'
          ? 'ستون‌های نام، نام خانوادگی، کد ملی و کلاس باید در فایل وجود داشته باشند.'
          : kind === 'teachers'
            ? 'ستون‌های نام و نام خانوادگی، تخصص و کد پرسنلی باید در فایل وجود داشته باشند.'
            : 'ستون‌های کلاس و نام درس باید در فایل وجود داشته باشند.');
      }

      const errors: string[] = [];
      let importedCount = 0;

      if (kind === 'students') {
        const usedNationalIds = new Set(students.map((student) => normalizeSpreadsheetText(student.nationalId)));
        const usedStudentCodes = new Set(students.map((student) => normalizeSpreadsheetText(student.studentCode)));
        const classByName = new Map(classes.map((schoolClass) => [normalizeSpreadsheetText(schoolClass.name), schoolClass]));

        for (const [index, row] of rows.entries()) {
          const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, getSpreadsheetCellText(value)]));
          const firstName = getSpreadsheetValue(normalizedRow, ['نام', 'first name']);
          const lastName = getSpreadsheetValue(normalizedRow, ['نام خانوادگی', 'last name']);
          let nationalId = toEnglishDigits(getSpreadsheetValue(normalizedRow, ['کد ملی', 'national id']));
          if (/^\d{1,9}$/.test(nationalId)) nationalId = nationalId.padStart(10, '0');
          const rawStudentCode = getSpreadsheetValue(normalizedRow, ['شماره دانش‌آموزی', 'کد دانش‌آموزی', 'student code']);
          const studentCode = rawStudentCode || `S-${crypto.randomUUID().slice(0, 8)}`;
          const schoolClass = classByName.get(normalizeSpreadsheetText(getSpreadsheetValue(normalizedRow, ['کلاس', 'نام کلاس', 'class'])));
          if (![firstName, lastName, nationalId, rawStudentCode].some(Boolean)) continue;

          let error = '';
          if (!firstName || !lastName) error = 'نام و نام خانوادگی الزامی است.';
          else if (!validateIranianNationalId(nationalId)) error = 'کد ملی معتبر نیست.';
          else if (!schoolClass) error = 'کلاس واردشده در سامانه موجود نیست.';
          else if (usedNationalIds.has(normalizeSpreadsheetText(nationalId))) error = 'کد ملی تکراری است.';
          else if (usedStudentCodes.has(normalizeSpreadsheetText(studentCode))) error = 'شماره دانش‌آموزی تکراری است.';

          if (error) {
            errors.push(`ردیف ${index + 2}: ${error}`);
            continue;
          }

          if (!schoolClass) continue;
          const result = await addStudent({ firstName, lastName, nationalId, studentCode, classId: schoolClass.id, gradeId: schoolClass.gradeId });
          if (result.success) {
            importedCount += 1;
            usedNationalIds.add(normalizeSpreadsheetText(nationalId));
            usedStudentCodes.add(normalizeSpreadsheetText(studentCode));
          } else {
            errors.push(`ردیف ${index + 2}: ${result.message || 'ثبت دانش‌آموز انجام نشد.'}`);
          }
        }
      } else if (kind === 'teachers') {
        const usedTeacherCodes = new Set(teachers.map((teacher) => normalizeSpreadsheetText(teacher.teacherCode)));
        const employmentTypes: Record<string, Teacher['employmentType']> = {
          official: 'official', 'رسمی': 'official', contractual: 'contractual', 'پیمانی': 'contractual',
          hourly: 'hourly', 'حق التدریس': 'hourly', 'حق‌التدریس': 'hourly', corporate: 'corporate', 'شرکتی': 'corporate',
        };

        for (const [index, row] of rows.entries()) {
          const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, getSpreadsheetCellText(value)]));
          const fullName = getSpreadsheetValue(normalizedRow, ['نام و نام خانوادگی', 'نام کامل', 'full name']);
          const specialty = getSpreadsheetValue(normalizedRow, ['تخصص', 'رشته', 'specialty']);
          const teacherCode = getSpreadsheetValue(normalizedRow, ['کد پرسنلی', 'شماره دبیر', 'teacher code']);
          const degreeText = getSpreadsheetValue(normalizedRow, ['مدرک تحصیلی', 'مدرک', 'degree']);
          const experienceText = toEnglishDigits(getSpreadsheetValue(normalizedRow, ['سابقه (سال)', 'سابقه', 'سابقه خدمت', 'experience years', 'experience']));
          const employmentText = normalizeSpreadsheetText(getSpreadsheetValue(normalizedRow, ['وضعیت استخدام', 'نوع استخدام', 'employment type'])) || 'official';
          const experienceYears = experienceText ? Number(experienceText) : 0;
          const employmentType = employmentTypes[employmentText];
          if (![fullName, specialty, teacherCode, degreeText, experienceText].some(Boolean)) continue;

          let error = '';
          if (!fullName || !specialty || !teacherCode) error = 'نام، تخصص و کد پرسنلی الزامی است.';
          else if (!Number.isFinite(experienceYears) || experienceYears < 0 || experienceYears > 50) error = 'سابقه باید عددی بین صفر تا ۵۰ باشد.';
          else if (!employmentType) error = 'وضعیت استخدام معتبر نیست.';
          else if (usedTeacherCodes.has(normalizeSpreadsheetText(teacherCode))) error = 'کد پرسنلی تکراری است.';

          if (error) {
            errors.push(`ردیف ${index + 2}: ${error}`);
            continue;
          }

          if (!employmentType) continue;
          const result = await addTeacher({ fullName, specialty, degree: degreeText || 'کارشناسی ارشد', experienceYears, employmentType, teacherCode });
          if (result.success) {
            importedCount += 1;
            usedTeacherCodes.add(normalizeSpreadsheetText(teacherCode));
          } else {
            errors.push(`ردیف ${index + 2}: ${result.message || 'ثبت دبیر انجام نشد.'}`);
          }
        }
      } else {
        const usedAssignments = new Set(assignments.map((assignment) =>
          `${assignment.teacherId}|${assignment.classId}|${normalizeSpreadsheetText(assignment.subject)}`
        ));

        for (const [index, row] of rows.entries()) {
          const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, getSpreadsheetCellText(value)]));
          const teacherCode = getSpreadsheetValue(normalizedRow, assignmentTeacherCodeAliases);
          const teacherName = getSpreadsheetValue(normalizedRow, assignmentTeacherNameAliases);
          const className = getSpreadsheetValue(normalizedRow, ['کلاس', 'نام کلاس', 'class']);
          const subject = getSpreadsheetValue(normalizedRow, ['نام درس', 'درس', 'subject']);
          if (![teacherCode, teacherName, className, subject].some(Boolean)) continue;

          const matchingTeachers = teacherCode
            ? teachers.filter((teacher) => normalizeSpreadsheetText(teacher.teacherCode) === normalizeSpreadsheetText(teacherCode))
            : teachers.filter((teacher) => normalizeSpreadsheetText(teacher.fullName) === normalizeSpreadsheetText(teacherName));
          const matchingClasses = classes.filter((schoolClass) => normalizeSpreadsheetText(schoolClass.name) === normalizeSpreadsheetText(className));
          let error = '';
          if (!teacherCode && !teacherName) error = 'کد پرسنلی یا نام دبیر الزامی است.';
          else if (matchingTeachers.length === 0) error = 'دبیر با این کد یا نام در سامانه پیدا نشد.';
          else if (matchingTeachers.length > 1) error = 'نام دبیر تکراری است؛ کد پرسنلی را وارد کنید.';
          else if (!className) error = 'نام کلاس الزامی است.';
          else if (matchingClasses.length === 0) error = 'کلاس واردشده در سامانه موجود نیست.';
          else if (matchingClasses.length > 1) error = 'نام کلاس تکراری است و قابل تشخیص نیست.';
          else if (!subject) error = 'عنوان درس الزامی است.';

          const teacher = matchingTeachers[0];
          const schoolClass = matchingClasses[0];
          const assignmentKey = teacher && schoolClass
            ? `${teacher.id}|${schoolClass.id}|${normalizeSpreadsheetText(subject)}`
            : '';
          if (!error && assignmentKey && usedAssignments.has(assignmentKey)) error = 'این تخصیص قبلاً ثبت شده است.';

          if (error) {
            errors.push(`ردیف ${index + 2}: ${error}`);
            continue;
          }

          if (!teacher || !schoolClass) continue;
          const result = await addAssignment(teacher.id, schoolClass.id, subject);
          if (result.success) {
            importedCount += 1;
            usedAssignments.add(assignmentKey);
          } else {
            errors.push(`ردیف ${index + 2}: ${result.message || 'ثبت تخصیص انجام نشد.'}`);
          }
        }
      }

      const summary = `${toPersianDigits(importedCount)} رکورد ثبت شد.${errors.length ? ` ${toPersianDigits(errors.length)} ردیف رد شد: ${errors.slice(0, 3).join(' ')}` : ''}`;
      showFeedback(importedCount > 0 ? 'success' : 'error', summary);
    } catch (error) {
      showFeedback('error', error instanceof Error ? error.message : 'خواندن فایل اکسل انجام نشد.');
    } finally {
      setIsImportingSpreadsheet(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgnTeacherId || !asgnClassId || !asgnSubject) {
      showFeedback('error', 'لطفاً دبیر، کلاس و درس را مشخص نمایید.');
      return;
    }

    const res = await addAssignment(asgnTeacherId, asgnClassId, asgnSubject);
    if (res.success) {
      setAsgnSubject('');
      showFeedback('success', 'تخصیص دبیر به کلاس و درس با موفقیت ثبت شد.');
    } else {
      showFeedback('error', res.message || 'خطا در تخصیص.');
    }
  };

  const handleCreateUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedIdentifier = normalizeEmailOrNationalId(accEmail);
    if (!accUsername || !accPassword || !accFullName) {
      showFeedback('error', 'نام، نام کاربری و رمز عبور الزامی است.');
      return;
    }
    if (!isValidEmailOrNationalId(normalizedIdentifier)) {
      showFeedback('error', 'ایمیل معتبر یا کدملی ۱۰ رقمی وارد کنید.');
      return;
    }
    if (accPassword.length < 8) {
      showFeedback('error', 'رمز عبور باید دست‌کم ۸ نویسه باشد.');
      return;
    }

    const res = await createUserAccount({
      username: accUsername,
      passwordPlain: accPassword,
      role: accRole,
      fullName: accFullName,
      linkedId: accLinkedId,
      email: normalizedIdentifier,
      phone: accPhone,
    });

    if (res.success) {
      setAccUsername('');
      setAccPassword('');
      setAccFullName('');
      setAccLinkedId('');
      setAccEmail('');
      setAccPhone('');
      showFeedback('success', 'حساب کاربری با موفقیت ساخته شد و رمز عبور به صورت امن هش گردید.');
    } else {
      showFeedback('error', res.message || 'خطا در ایجاد حساب کاربری.');
    }
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTeacherId) {
      showFeedback('error', 'لطفاً دبیر مورد نظر را انتخاب نمایید.');
      return;
    }

    const scoreVals = Object.values(evalScores);
    const avg = Math.round((scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 100) / 100;

    const res = await saveTeacherEvaluation({
      teacherId: evalTeacherId,
      evaluatorRole: 'admin',
      evaluatorId: currentUser?.id || 'admin',
      evaluatorName: currentUser?.fullName || 'مدیر مدرسه',
      scores: evalScores,
      averageScore: avg,
      notes: evalNotes,
    });

    if (res.success) {
      showFeedback('success', `ارزیابی با میانگین ${toPersianDigits(avg)} از ۵ برای دبیر ثبت گردید.`);
    } else {
      showFeedback('error', res.message || 'خطا در ثبت ارزیابی.');
    }
  };

  const averageScores = (scores: number[]) => scores.length > 0
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100
    : null;

  const schoolStaffEvaluationSummaries = [
    { role: 'admin' as const, title: 'عملکرد کلی مدرسه و مدیر', subtitle: 'ارزیابی دانش‌آموزان از مدیریت، عدالت و کیفیت کلی مدرسه' },
    { role: 'academic_vp' as const, title: 'معاون آموزشی', subtitle: 'این نقش از پنل دانش‌آموزی قابل ارزیابی نیست' },
    { role: 'cultural_vp' as const, title: 'معاون پرورشی', subtitle: 'ارزیابی دانش‌آموزان از برنامه‌های فرهنگی، تربیتی و حمایت اجتماعی' },
  ].map((item) => {
    const records = studentStaffEvaluations.filter((evaluation) => evaluation.targetRole === item.role);
    return {
      ...item,
      score: averageScores(records.map((record) => record.averageScore)),
      count: records.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Top Banner Alert Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-rose-500 text-white shadow-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('structure')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'structure'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>۱. ساختار مدرسه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>۲. صدور حساب‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('difficulty')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'difficulty'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>۳. ضرایب سختی دروس</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'evaluation'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>۴. ارزیابی معلمان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('talents')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'talents'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>۵. استعداد و شخصیت دانش‌آموزان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('studentSummary')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'studentSummary'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>۶. پروندهٔ جامع دانش‌آموزان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schoolAttitude')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'schoolAttitude'
              ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>۷. آزمون رغبت‌سنجی مدرسه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('riskMap')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'riskMap'
              ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>۸. نقشهٔ ریسک مدرسه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('allData')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'allData'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>۹. مانیتورینگ و حذف داده‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNotifModalOpen(true)}
          className="flex-1 min-w-[140px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 shadow-md shadow-amber-500/20"
        >
          <Megaphone className="w-4 h-4" />
          <span>۱۰. ارسال اعلان و یادآور مدرسه</span>
        </button>
      </div>

      {/* TAB 1: SCHOOL STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[
              { id: 'grades_classes', label: 'پایه‌ها و کلاس‌ها', icon: Layers },
              { id: 'students', label: `دانش‌آموزان (${toPersianDigits(students.length)})`, icon: GraduationCap },
              { id: 'teachers', label: `دبیران (${toPersianDigits(teachers.length)})`, icon: BookOpen },
              { id: 'assignments', label: `تخصیص دروس به معلمان (${toPersianDigits(assignments.length)})`, icon: Link2 },
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setStructureSubTab(sub.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    structureSubTab === sub.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SubTab: Grades and Classes */}
          {structureSubTab === 'grades_classes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add & List Grades */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <span>پایه‌های تحصیلی مدرسه</span>
                </h3>

                <form onSubmit={handleAddGrade} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    required
                    value={newGradeName}
                    onChange={(e) => setNewGradeName(e.target.value)}
                    placeholder="عنوان پایه (مثال: پایه هفتم)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newGradeOrder}
                    onChange={(e) => setNewGradeOrder(Number(e.target.value))}
                    className="w-16 px-2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-center font-mono"
                    title="ترتیب نمایش"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن</span>
                  </button>
                </form>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {grades.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">پایه‌ای تعریف نشده است.</p>
                  ) : (
                    grades.map((g) => {
                      const classCount = classes.filter((c) => c.gradeId === g.id).length;
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{g.name}</span>
                            <span className="text-[11px] text-slate-400 mr-3">
                              ({toPersianDigits(classCount)} کلاس فعال)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                title: `حذف پایه تحصیلی ${g.name}`,
                                message:
                                  classCount > 0
                                    ? 'این پایه دارای کلاس‌های زیرمجموعه است و ابتدا باید کلاس‌های آن حذف شوند.'
                                    : 'آیا از حذف این پایه تحصیلی اطمینان دارید؟ این عمل بلافاصله در پایگاه داده اعمال می‌شود.',
                                onConfirm: async () => {
                                  const r = await deleteGrade(g.id);
                                  if (!r.success) showFeedback('error', r.message || 'خطا در حذف.');
                                  else showFeedback('success', 'پایه با موفقیت حذف شد.');
                                },
                              })
                            }
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="حذف پایه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add & List Classes */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <School className="w-5 h-5 text-teal-600" />
                  <span>کلاس‌های درس مدرسه</span>
                </h3>

                <form onSubmit={handleAddClass} className="space-y-3 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="نام کلاس (مثال: کلاس ۷۰۱ شهید چمران)"
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                    <select
                      required
                      value={newClassGradeId}
                      onChange={(e) => setNewClassGradeId(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- انتخاب پایه تحصیلی --</option>
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newClassYear}
                      onChange={(e) => setNewClassYear(e.target.value)}
                      placeholder="سال تحصیلی (مثال: ۱۴۰۴-۱۴۰۵)"
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن کلاس</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {classes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">کلاسی تعریف نشده است.</p>
                  ) : (
                    classes.map((c) => {
                      const gradeObj = grades.find((g) => g.id === c.gradeId);
                      const studentCount = students.filter((s) => s.classId === c.id).length;
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>پایه: {gradeObj?.name || 'نامشخص'}</span>
                              <span>•</span>
                              <span>{toPersianDigits(studentCount)} دانش‌آموز</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                title: `حذف کلاس ${c.name}`,
                                message:
                                  studentCount > 0
                                    ? 'این کلاس دارای دانش‌آموز فعال است و قابل حذف نمی‌باشد.'
                                    : 'آیا از حذف این کلاس اطمینان دارید؟ داده‌های آن بلافاصله از پایگاه‌داده حذف می‌شود.',
                                onConfirm: async () => {
                                  const r = await deleteClass(c.id);
                                  if (!r.success) showFeedback('error', r.message || 'خطا در حذف.');
                                  else showFeedback('success', 'کلاس با موفقیت حذف شد.');
                                },
                              })
                            }
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="حذف کلاس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SubTab: Students */}
          {structureSubTab === 'students' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-600" />
                  <span>ثبت و مدیریت دانش‌آموزان</span>
                </h3>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-xs text-slate-400">
                    مجموع: {toPersianDigits(students.length)} دانش‌آموز
                  </span>
                  <button type="button" disabled={!spreadsheetTemplateUrls.students} onClick={() => downloadSpreadsheetTemplate('students', spreadsheetTemplateUrls.students)} title={spreadsheetTemplateError ? 'صفحه را تازه‌سازی کنید.' : undefined} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> {spreadsheetTemplateUrls.students ? 'قالب اکسل' : spreadsheetTemplateError ? 'خطای ساخت قالب' : 'آماده‌سازی قالب...'}
                  </button>
                  <label className={`px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isImportingSpreadsheet ? 'opacity-60 pointer-events-none' : 'hover:bg-teal-700'}`}>
                    <Upload className="w-4 h-4" /> {isImportingSpreadsheet ? 'در حال ثبت...' : 'ورود از اکسل'}
                    <input type="file" accept=".xlsx,.xls" className="sr-only" disabled={isImportingSpreadsheet} onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void handleSpreadsheetImport(file, 'students');
                      event.currentTarget.value = '';
                    }} />
                  </label>
                </div>
              </div>

              {/* Add Student Form */}
              <form onSubmit={handleAddStudent} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
                <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400">افزودن دانش‌آموز جدید</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نام</label>
                    <input
                      type="text"
                      required
                      value={studentFirst}
                      onChange={(e) => setStudentFirst(e.target.value)}
                      placeholder="سهراب"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={studentLast}
                      onChange={(e) => setStudentLast(e.target.value)}
                      placeholder="سپهری‌راد"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      کد ملی (با اعتبارسنجی ایرانی)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={studentNationalId}
                      onChange={(e) => setStudentNationalId(e.target.value)}
                      placeholder="۱۰ رقمی معتبر"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">شماره دانش‌آموزی</label>
                    <input
                      type="text"
                      required
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="S701-01"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">انتخاب کلاس</label>
                    <select
                      required
                      value={studentClassId}
                      onChange={(e) => setStudentClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">-- کلاس --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت دانش‌آموز در سیستم</span>
                  </button>
                </div>
              </form>

              {/* Student Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3 rounded-r-xl">ردیف</th>
                      <th className="p-3">نام و نام خانوادگی</th>
                      <th className="p-3">کد ملی</th>
                      <th className="p-3">شماره دانش‌آموزی</th>
                      <th className="p-3">کلاس</th>
                      <th className="p-3 rounded-l-xl text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          دانش‌آموزی ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      students.map((st, idx) => {
                        const cl = classes.find((c) => c.id === st.classId);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3 text-slate-400">{toPersianDigits(idx + 1)}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {st.firstName} {st.lastName}
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                              {toPersianDigits(st.nationalId)}
                            </td>
                            <td className="p-3 font-mono text-teal-600 dark:text-teal-400">
                              {st.studentCode}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{cl?.name || 'نامشخص'}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    title: `حذف دانش‌آموز ${st.firstName} ${st.lastName}`,
                                    message: 'آیا از حذف این دانش‌آموز مطمئن هستید؟ تمام کارنامه‌ها و سوابق وی بلافاصله پاک می‌شوند.',
                                    onConfirm: async () => {
                                      await deleteStudent(st.id);
                                      showFeedback('success', 'دانش‌آموز با موفقیت حذف گردید.');
                                    },
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="حذف دانش‌آموز"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTab: Teachers */}
          {structureSubTab === 'teachers' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <span>ثبت و مدیریت کادر دبیران</span>
                </h3>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-xs text-slate-400">
                    مجموع: {toPersianDigits(teachers.length)} دبیر
                  </span>
                  <button type="button" disabled={!spreadsheetTemplateUrls.teachers} onClick={() => downloadSpreadsheetTemplate('teachers', spreadsheetTemplateUrls.teachers)} title={spreadsheetTemplateError ? 'صفحه را تازه‌سازی کنید.' : undefined} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> {spreadsheetTemplateUrls.teachers ? 'قالب اکسل' : spreadsheetTemplateError ? 'خطای ساخت قالب' : 'آماده‌سازی قالب...'}
                  </button>
                  <label className={`px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isImportingSpreadsheet ? 'opacity-60 pointer-events-none' : 'hover:bg-teal-700'}`}>
                    <Upload className="w-4 h-4" /> {isImportingSpreadsheet ? 'در حال ثبت...' : 'ورود از اکسل'}
                    <input type="file" accept=".xlsx,.xls" className="sr-only" disabled={isImportingSpreadsheet} onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void handleSpreadsheetImport(file, 'teachers');
                      event.currentTarget.value = '';
                    }} />
                  </label>
                </div>
              </div>

              {/* Add Teacher Form */}
              <form onSubmit={handleAddTeacher} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
                <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400">افزودن دبیر جدید</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="دکتر مسعود کریمی"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">تخصص / رشته</label>
                    <input
                      type="text"
                      required
                      value={teacherSpecialty}
                      onChange={(e) => setTeacherSpecialty(e.target.value)}
                      placeholder="فیزیک و شیمی"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">مدرک تحصیلی</label>
                    <input
                      type="text"
                      value={teacherDegree}
                      onChange={(e) => setTeacherDegree(e.target.value)}
                      placeholder="کارشناسی ارشد"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">سابقه (سال)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={teacherExp}
                      onChange={(e) => setTeacherExp(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">کد پرسنلی / دبیر</label>
                    <input
                      type="text"
                      required
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      placeholder="T105"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">وضعیت استخدام:</span>
                    {[
                      { val: 'official', label: 'رسمی' },
                      { val: 'contractual', label: 'پیمانی' },
                      { val: 'hourly', label: 'حق‌التدریس' },
                      { val: 'corporate', label: 'شرکتی' },
                    ].map((st) => (
                      <label key={st.val} className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="empType"
                          value={st.val}
                          checked={teacherEmployment === st.val}
                          onChange={() => setTeacherEmployment(st.val as any)}
                          className="text-teal-600"
                        />
                        <span>{st.label}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت مشخصات دبیر</span>
                  </button>
                </div>
              </form>

              {/* Teacher Roster */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((t) => {
                  const assignedCount = assignments.filter((a) => a.teacherId === t.id).length;
                  const weighted = calculateTeacherWeightedScore(t.id);
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.fullName}</h4>
                            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{t.specialty}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {t.teacherCode}
                          </span>
                        </div>

                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                          <p>مدرک: {t.degree} • سابقه: {toPersianDigits(t.experienceYears)} سال</p>
                          <p>
                            وضعیت: {t.employmentType === 'official' ? 'رسمی' : t.employmentType === 'contractual' ? 'پیمانی' : 'حق‌التدریس'} • تخصیص: {toPersianDigits(assignedCount)} کلاس
                          </p>
                          {weighted.finalScore > 0 && (
                            <p className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>امتیاز ارزیابی ۳۶۰ درجه: {toPersianDigits(weighted.finalScore)} از ۵</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: `حذف دبیر ${t.fullName}`,
                              message:
                                assignedCount > 0
                                  ? 'این دبیر دارای تخصیص‌های فعال به کلاس‌های مدرسه است. ابتدا باید تخصیص‌ها لغو شوند.'
                                  : 'آیا از حذف این دبیر اطمینان دارید؟',
                              onConfirm: async () => {
                                const r = await deleteTeacher(t.id);
                                if (!r.success) showFeedback('error', r.message || 'خطا در حذف.');
                                else showFeedback('success', 'دبیر با موفقیت حذف گردید.');
                              },
                            })
                          }
                          className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف دبیر</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SubTab: Assignments */}
          {structureSubTab === 'assignments' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-teal-600" />
                    <span>تخصیص دبیران به کلاس‌ها و دروس</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    طبق ضوابط، هر معلم فقط می‌تواند برای کلاس‌ها و دروسی که در این بخش به او تخصیص داده شده نمره و حضور وارد کند.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" disabled={!spreadsheetTemplateUrls.assignments} onClick={() => downloadSpreadsheetTemplate('assignments', spreadsheetTemplateUrls.assignments)} title={spreadsheetTemplateError ? 'صفحه را تازه‌سازی کنید.' : undefined} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> {spreadsheetTemplateUrls.assignments ? 'قالب اکسل' : spreadsheetTemplateError ? 'خطای ساخت قالب' : 'آماده‌سازی قالب...'}
                  </button>
                  <label className={`px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isImportingSpreadsheet ? 'opacity-60 pointer-events-none' : 'hover:bg-teal-700'}`}>
                    <Upload className="w-4 h-4" /> {isImportingSpreadsheet ? 'در حال ثبت...' : 'ورود از اکسل'}
                    <input type="file" accept=".xlsx" className="sr-only" disabled={isImportingSpreadsheet} onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void handleSpreadsheetImport(file, 'assignments');
                      event.currentTarget.value = '';
                    }} />
                  </label>
                </div>
              </div>

              {/* Assignment Form */}
              <form onSubmit={handleAddAssignment} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">دبیر</label>
                  <select
                    required
                    value={asgnTeacherId}
                    onChange={(e) => setAsgnTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- انتخاب دبیر --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">کلاس</label>
                  <select
                    required
                    value={asgnClassId}
                    onChange={(e) => setAsgnClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- انتخاب کلاس --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">عنوان درس</label>
                  <input
                    type="text"
                    required
                    value={asgnSubject}
                    onChange={(e) => setAsgnSubject(e.target.value)}
                    placeholder="ریاضی، علوم، انگلیسی..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت تخصیص</span>
                </button>
              </form>

              {/* Assignment Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3 rounded-r-xl">ردیف</th>
                      <th className="p-3">نام دبیر</th>
                      <th className="p-3">کلاس</th>
                      <th className="p-3">نام درس</th>
                      <th className="p-3 rounded-l-xl text-center">لغو تخصیص</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          هنوز هیچ تخصیصی برای معلمان ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      assignments.map((a, idx) => {
                        const t = teachers.find((tch) => tch.id === a.teacherId);
                        const c = classes.find((cls) => cls.id === a.classId);
                        return (
                          <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <td className="p-3 text-slate-400">{toPersianDigits(idx + 1)}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {t?.fullName || 'نامشخص'}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{c?.name || 'نامشخص'}</td>
                            <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{a.subject}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'لغو تخصیص معلم به کلاس',
                                    message: `آیا از لغو تدریس درس ${a.subject} توسط ${t?.fullName} در ${c?.name} اطمینان دارید؟`,
                                    onConfirm: async () => {
                                      await deleteAssignment(a.id);
                                      showFeedback('success', 'تخصیص با موفقیت حذف گردید.');
                                    },
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="حذف تخصیص"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS ISSUANCE */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>صدور و مدیریت حساب‌های کاربری مدرسه</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تنها مدیر مدرسه دسترسی به ایجاد حساب برای معلمان، اولیا، دانش‌آموزان و معاونین دارد. رمزهای عبور به صورت هش‌شده یک‌طرفه (SHA-256) ذخیره می‌شوند.
            </p>
          </div>

          {/* Create User Form */}
          <form onSubmit={handleCreateUserAccount} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400">صدور حساب جدید</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نقش کاربری</label>
                <select
                  value={accRole}
                  onChange={(e) => setAccRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                >
                  <option value="teacher">معلم و دبیر</option>
                  <option value="student">دانش‌آموز</option>
                  <option value="parent">والدین</option>
                  <option value="executive_vp">معاون اجرایی</option>
                  <option value="academic_vp">معاون آموزشی</option>
                  <option value="cultural_vp">معاون پرورشی</option>
                  <option value="admin">مدیر مجتمع</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={accFullName}
                  onChange={(e) => setAccFullName(e.target.value)}
                  placeholder="مثال: مهندس حسینی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">نام کاربری (لاتین)</label>
                <input
                  type="text"
                  required
                  value={accUsername}
                  onChange={(e) => setAccUsername(e.target.value)}
                  placeholder="teacher_hosseini"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">رمز عبور</label>
                <input
                  type="password"
                  required
                  value={accPassword}
                  onChange={(e) => setAccPassword(e.target.value)}
                  minLength={8}
                  placeholder="حداقل ۸ نویسه"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  کد مرتبط (کد دبیر یا شماره دانش‌آموز)
                </label>
                <input
                  type="text"
                  value={accLinkedId}
                  onChange={(e) => setAccLinkedId(e.target.value)}
                  placeholder={accRole === 'teacher' ? 'T101' : 'S701-01'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">ایمیل یا کدملی</label>
                <input
                  type="text"
                  inputMode="text"
                  required
                  value={accEmail}
                  onChange={(e) => setAccEmail(e.target.value)}
                  placeholder="ایمیل یا کدملی ۱۰ رقمی"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">شماره تماس بازیابی</label>
                <input
                  type="tel"
                  value={accPhone}
                  onChange={(e) => setAccPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>صدور حساب و هش‌سازی رمز</span>
              </button>
            </div>
          </form>

          {/* User List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl">نام و نام خانوادگی</th>
                  <th className="p-3">نام کاربری</th>
                  <th className="p-3">نقش سازمانی</th>
                  <th className="p-3">کد پیوند داده</th>
                  <th className="p-3">وضعیت رمز</th>
                  <th className="p-3 rounded-l-xl text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const roleDetail = ROLE_DETAILS[u.role];
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u.fullName}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                            حساب جاری شما
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{u.username}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleDetail?.badgeColor || 'bg-slate-500 text-white'}`}>
                          {roleDetail?.title || u.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-teal-600 dark:text-teal-400">
                        {u.linkedId || '—'}
                      </td>
                      <td className="p-3 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <Shield className="w-3.5 h-3.5" />
                        <span>SHA-256 Hashed</span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: `حذف حساب کاربری ${u.username}`,
                              message:
                                u.role === 'admin' && users.filter((x) => x.role === 'admin').length <= 1
                                  ? 'امکان حذف آخرین مدیر سیستم وجود ندارد.'
                                  : `آیا از حذف حساب کاربری ${u.fullName} (${u.username}) مطمئن هستید؟`,
                              onConfirm: async () => {
                                const r = await deleteUserAccount(u.id);
                                if (!r.success) showFeedback('error', r.message || 'خطا در حذف حساب.');
                                else showFeedback('success', 'حساب کاربری حذف گردید.');
                              },
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="حذف حساب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT DIFFICULTY COEFFICIENTS */}
      {activeTab === 'difficulty' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-600" />
              <span>ضرایب سختی دروس (تعدیل نمرات برای مقایسه منصفانه)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              جهت ایجاد عدالت آموزشی بین دروس سنگین و درک‌محور با سایر دروس، نمره خام دبیر در ضریب سختی ضرب شده و نمره تعدیل‌شده (تا سقف ۲۰) محاسبه می‌شود. فقط مدیر مدرسه مجاز به ویرایش این ضرایب است.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 p-4 border border-teal-200/70 dark:border-teal-900/70">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">انتخاب پایه تحصیلی</label>
              <select
                value={difficultyGradeId}
                onChange={(event) => setDifficultyGradeId(event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
              >
                {grades.sort((a, b) => a.order - b.order).map((grade) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">شاخه یا رشته</label>
              <select
                value={difficultyTrack}
                onChange={(event) => setDifficultyTrack(event.target.value as CurriculumTrack)}
                disabled={(grades.find((grade) => grade.id === difficultyGradeId)?.order || 0) < 10}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
              >
                <option value="general">عمومی / بدون رشته</option>
                {(grades.find((grade) => grade.id === difficultyGradeId)?.order || 0) >= 10 && (
                  <>
                    <option value="math">ریاضی و فیزیک</option>
                    <option value="experimental">علوم تجربی</option>
                    <option value="humanities">ادبیات و علوم انسانی</option>
                    <option value="islamic_studies">علوم و معارف اسلامی</option>
                    <option value="vocational_network">فنی‌وحرفه‌ای: شبکه و نرم‌افزار</option>
                    <option value="karadanesh">کاردانش: مهارت عمومی</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const selectedGrade = grades.find((grade) => grade.id === difficultyGradeId);
              const curriculumSubjects = selectedGrade
                ? getCurriculumSubjects(selectedGrade.order, difficultyTrack)
                : [];

              return curriculumSubjects.map((curriculumSubject) => {
                const storedDifficulty = subjectDifficulties.find(
                  (item) => item.subject === curriculumSubject.name && item.gradeId === difficultyGradeId && item.track === difficultyTrack
                ) || subjectDifficulties.find((item) => item.subject === curriculumSubject.name && !item.gradeId);
                const sd = storedDifficulty || {
                  id: `${difficultyGradeId}_${difficultyTrack}_${curriculumSubject.name}`,
                  subject: curriculumSubject.name,
                  coefficient: curriculumSubject.suggestedCoefficient,
                  rationale: `ضریب پیشنهادی برای ${curriculumSubject.category} در ${selectedGrade?.name || 'پایه انتخاب‌شده'}؛ قابل تغییر توسط مدیر مدرسه.`,
                };

              return (
                <div
                  key={sd.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-slate-900 dark:text-white">{sd.subject}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      ضریب: {toPersianDigits(sd.coefficient.toFixed(2))}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-teal-700 dark:text-teal-300">{curriculumSubject.category} · ضریب پیشنهادی {toPersianDigits(curriculumSubject.suggestedCoefficient.toFixed(2))}</span><br />
                    <span className="font-bold text-slate-700 dark:text-slate-200">مبنای علمی ضریب: </span>
                    {sd.rationale}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <input
                      type="number"
                      step={0.05}
                      min={0.5}
                      max={2.0}
                      defaultValue={sd.coefficient}
                      id={`coeff_input_${sd.id}`}
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const elem = document.getElementById(`coeff_input_${sd.id}`) as HTMLInputElement;
                        if (!elem) return;
                        const val = parseFloat(elem.value);
                        if (isNaN(val) || val <= 0) return;
                        const res = await updateSubjectDifficulty(sd.subject, val, sd.rationale, difficultyGradeId, difficultyTrack);
                        if (res.success) {
                          showFeedback('success', `ضریب درس ${sd.subject} به ${toPersianDigits(val.toFixed(2))} تغییر یافت.`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      به‌روزرسانی ضریب
                    </button>
                  </div>
                </div>
              );
              });
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: TEACHER EVALUATION (BY PRINCIPAL) */}
      {activeTab === 'evaluation' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                <span>گزارش تجمیعی ارزیابی دبیران</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                امتیاز نهایی با مشارکت دانش‌آموزان (۲۵٪)، والدین (۲۵٪)، مدیر (۲۰٪)، معاون آموزشی (۱۵٪) و معاون پرورشی (۱۵٪) محاسبه می‌شود؛ در نبود هر منبع، وزن‌ها بر اساس داده‌های موجود نرمال می‌شوند.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3 rounded-r-xl">دبیر</th>
                    <th className="p-3 text-center">دانش‌آموزان</th>
                    <th className="p-3 text-center">والدین</th>
                    <th className="p-3 text-center">مدیر</th>
                    <th className="p-3 text-center">معاون آموزشی</th>
                    <th className="p-3 text-center">معاون پرورشی</th>
                    <th className="p-3 text-center rounded-l-xl">امتیاز نهایی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">دبیری برای نمایش وجود ندارد.</td>
                    </tr>
                  ) : teachers.map((teacher) => {
                    const weighted = calculateTeacherWeightedScore(teacher.id);
                    const formatScore = (score: number | null) => score === null ? '—' : toPersianDigits(score.toFixed(2));
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{teacher.fullName}</td>
                        <td className="p-3 text-center text-indigo-600 dark:text-indigo-400">{formatScore(weighted.studentScore)}{weighted.studentEvaluationsCount > 0 && <span className="text-[10px] text-slate-400 mr-1">({toPersianDigits(weighted.studentEvaluationsCount)})</span>}</td>
                        <td className="p-3 text-center">{formatScore(weighted.parentScore)}</td>
                        <td className="p-3 text-center">{formatScore(weighted.adminScore)}</td>
                        <td className="p-3 text-center">{formatScore(weighted.academicVpScore)}</td>
                        <td className="p-3 text-center">{formatScore(weighted.culturalVpScore)}</td>
                        <td className="p-3 text-center font-black text-amber-600 dark:text-amber-400">{weighted.finalScore > 0 ? formatScore(weighted.finalScore) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">ارزیابی عملکرد مدیر و معاونان</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">این گزارش از ارزیابی‌های ثبت‌شده توسط دانش‌آموزان محاسبه می‌شود. ارزیابی معاون آموزشی در پنل دانش‌آموزی غیرفعال است و فقط سوابق قبلی در صورت وجود نمایش داده می‌شود.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {schoolStaffEvaluationSummaries.map((summary) => (
                <div key={summary.role} className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{summary.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-5">{summary.subtitle}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{summary.score === null ? '—' : toPersianDigits(summary.score.toFixed(2))}</span>
                    <span className="text-[11px] text-slate-500">{toPersianDigits(summary.count)} ارزیابی</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>ارزیابی کیفی دبیران (شاخص‌های ویژه مدیر مدرسه - وزن ۲۰٪)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مدیر مدرسه دبیران را بر اساس ۶ شاخص حاکمیتی از ۱ تا ۵ ارزیابی می‌کند. نمره نهایی دبیر حاصل تجمیع نظرات مدیر (۲۰٪)، معاون آموزشی (۲۰٪)، معاون پرورشی (۲۰٪) و والدین (۴۰٪) می‌باشد.
            </p>
          </div>

          <form onSubmit={handleSaveEvaluation} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">انتخاب دبیر جهت ارزیابی</label>
              <select
                required
                value={evalTeacherId}
                onChange={(e) => {
                  setEvalTeacherId(e.target.value);
                  // Load previous evaluation if exists
                  const prev = evaluations.find(
                    (ev) => ev.teacherId === e.target.value && ev.evaluatorRole === 'admin'
                  );
                  if (prev) {
                    setEvalScores(prev.scores as any);
                    setEvalNotes(prev.notes || '');
                  }
                }}
                className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
              >
                <option value="">-- دبیر را انتخاب کنید --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} (دبیر {t.specialty})
                  </option>
                ))}
              </select>
            </div>

            {/* 6 Principal Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'time_management', title: '۱. مدیریت زمان و پویایی کلاس', desc: 'شروع و اتمام به‌موقع و جریان فعال تدریس' },
                { key: 'student_engagement', title: '۲. مشارکت فعال دانش‌آموزان', desc: 'ایجاد تعامل دوطرفه و ترغیب به پرسش‌گری' },
                { key: 'formative_feedback', title: '۳. سنجش تکوینی و بازخورد سازنده', desc: 'بررسی مداوم فهم دانش‌آموزان در طول درس' },
                { key: 'positive_atmosphere', title: '۴. ایجاد اتمسفر مثبت و هویت‌بخشی', desc: 'احترام متقابل و ایجاد انگیزه و امید' },
                { key: 'instructional_design', title: '۵. طراحی آموزشی و طرح درس', desc: 'سناریوی منسجم و متناسب با اهداف درسی' },
                { key: 'teaching_variety', title: '۶. تنوع در روش‌های تدریس', desc: 'استفاده از رسانه، دست‌ورزی و فناوری' },
              ].map((crit) => {
                const currentScore = evalScores[crit.key as keyof typeof evalScores] || 5;
                return (
                  <div key={crit.key} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">{crit.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">{crit.desc}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEvalScores((prev) => ({ ...prev, [crit.key]: star }))}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                            currentScore >= star
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {toPersianDigits(star)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">یادداشت و توصیه مدیریتی (اختیاری)</label>
              <textarea
                rows={2}
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                placeholder="توصیه‌های تشویقی یا رهنمودهای مهارتی برای دبیر..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ثبت و ذخیره ارزیابی مدیر</span>
              </button>
            </div>
          </form>

          {/* Current Evaluations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl">نام دبیر</th>
                  <th className="p-3">نمره ارزیابی مدیر (از ۵)</th>
                  <th className="p-3">یادداشت</th>
                  <th className="p-3">تاریخ ثبت</th>
                  <th className="p-3 rounded-l-xl text-center">حذف نظر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {evaluations.filter((e) => e.evaluatorRole === 'admin').map((ev) => {
                  const t = teachers.find((tch) => tch.id === ev.teacherId);
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{t?.fullName || 'نامشخص'}</td>
                      <td className="p-3">
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {toPersianDigits(ev.averageScore.toFixed(2))}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{ev.notes || '—'}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{formatShamsiDate(ev.updatedAt)}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: 'حذف ارزیابی مدیر',
                              message: 'آیا مایلید ارزیابی ثبت‌شده برای این دبیر حذف شود؟',
                              onConfirm: async () => {
                                await deleteTeacherEvaluation(ev.id);
                                showFeedback('success', 'ارزیابی با موفقیت حذف شد.');
                              },
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'talents' && (
        <TalentOverview
          classes={classes}
          students={students}
          psychResults={psychResults}
          grades={gradesSheet}
          attendanceRecords={attendanceRecords}
          recommendationMode="both"
          title="گزارش تجمیعی استعداد و شخصیت دانش‌آموزان"
        />
      )}

      {activeTab === 'studentSummary' && (
        <StudentHolisticReport
          students={students}
          classes={classes}
          teachers={teachers}
          grades={gradesSheet}
          psychResults={psychResults}
          schoolAttitudeResults={schoolAttitudeResults}
          attendanceRecords={attendanceRecords}
          extracurriculars={extracurriculars}
          familyProfiles={familyProfiles}
          prayerSurveyResponses={prayerSurveyResponses}
        />
      )}

      {activeTab === 'schoolAttitude' && (
        <SchoolAttitudeDashboard students={students} classes={classes} results={schoolAttitudeResults} />
      )}

      {activeTab === 'riskMap' && (
        <SchoolRiskMap
          classes={classes}
          students={students}
          grades={gradesSheet}
          extracurriculars={extracurriculars}
          tuitionPayments={tuitionPayments}
          schoolExpenses={schoolExpenses}
        />
      )}

      {/* TAB 5: ALL DATA MANAGEMENT & AUDIT */}
      {activeTab === 'allData' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              <span>مدیریت جامع داده‌ها و بایگانی تمام ثبتی‌های سامانه</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مدیر مدرسه می‌تواند تمام رکوردهای ثبت‌شده توسط معلمان، دانش‌آموزان، اولیا و معاونین (نمرات، آزمون‌ها، ارزیابی‌ها، فوق‌برنامه و سلامت) را پایش نموده و در صورت نیاز با تأیید صریح حذف نماید.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">نوع رکورد:</label>
              <select
                value={dataFilterType}
                onChange={(e) => setDataFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="all">همه ثبتی‌ها</option>
                <option value="grades">نمرات درسی ({toPersianDigits(gradesSheet.length)})</option>
                <option value="psych">آزمون‌های روانشناختی ({toPersianDigits(psychResults.length)})</option>
                <option value="eval">ارزیابی‌های معلمان ({toPersianDigits(evaluations.length)})</option>
                <option value="extra">فوق‌برنامه‌ها ({toPersianDigits(extracurriculars.length)})</option>
                <option value="family">پرونده سلامت و خانواده ({toPersianDigits(familyProfiles.length)})</option>
              </select>
            </div>

            <div className="relative w-64">
              <input
                type="text"
                value={dataSearchTerm}
                onChange={(e) => setDataSearchTerm(e.target.value)}
                placeholder="جستجو در داده‌ها..."
                className="w-full px-3 py-1.5 pr-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Unified records listing */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {/* Grades */}
            {(dataFilterType === 'all' || dataFilterType === 'grades') &&
              gradesSheet.map((gr) => {
                const s = students.find((st) => st.id === gr.studentId);
                const t = teachers.find((tch) => tch.id === gr.teacherId);
                return (
                  <div
                    key={gr.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px]">
                          نمره درسی
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          دانش‌آموز: {s?.firstName} {s?.lastName} • درس: {gr.subject}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        میانگین سالانه: <strong className="text-teal-600">{toPersianDigits(gr.calculatedAverage?.toFixed(2) ?? '—')}</strong> (مستمر ترم اول: {toPersianDigits(gr.continuousTerm1 ?? '—')}، نمره ترم اول: {toPersianDigits(gr.term1Exam ?? gr.midterm ?? '—')}، مستمر ترم دوم: {toPersianDigits(gr.continuousTerm2 ?? '—')}، نمره ترم دوم: {toPersianDigits(gr.term2Exam ?? gr.final ?? '—')}) • دبیر: {t?.fullName || 'نامشخص'} • تاریخ: {formatShamsiDate(gr.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'حذف نمره تحصیلی',
                          message: `آیا از حذف رکورد نمره ${gr.subject} برای دانش‌آموز ${s?.firstName} ${s?.lastName} اطمینان دارید؟`,
                          onConfirm: async () => {
                            await deleteStudentGrade(gr.id);
                            showFeedback('success', 'رکورد نمره با موفقیت حذف گردید.');
                          },
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

            {/* Psych Tests */}
            {(dataFilterType === 'all' || dataFilterType === 'psych') &&
              psychResults.map((ps) => {
                const s = students.find((st) => st.id === ps.studentId);
                return (
                  <div
                    key={ps.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px]">
                          آزمون روانشناختی
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          دانش‌آموز: {s?.firstName} {s?.lastName}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        کد هالند: <strong className="text-indigo-600">{ps.hollandCode}</strong> • سبک یادگیری: <strong>{ps.learningStyle}</strong> • تیپ شخصیتی: <strong>{ps.personalityType}</strong> • تاریخ ثبت: {formatShamsiDate(ps.completedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'حذف نتیجه آزمون روانشناختی',
                          message: `آیا از حذف نتایج آزمون دانش‌آموز ${s?.firstName} ${s?.lastName} مطمئن هستید؟`,
                          onConfirm: async () => {
                            await deletePsychTest(ps.id);
                            showFeedback('success', 'آزمون روانشناختی حذف شد.');
                          },
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

            {/* Evaluations */}
            {(dataFilterType === 'all' || dataFilterType === 'eval') &&
              evaluations.map((ev) => {
                const t = teachers.find((tch) => tch.id === ev.teacherId);
                const roleFa = ROLE_DETAILS[ev.evaluatorRole]?.title || ev.evaluatorRole;
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px]">
                          ارزیابی معلم ({roleFa})
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          دبیر ارزیابی‌شده: {t?.fullName || 'نامشخص'}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        میانگین امتیاز: <strong className="text-amber-600">{toPersianDigits(ev.averageScore.toFixed(2))} از ۵</strong> • ارزیاب: {ev.evaluatorName || roleFa} • تاریخ: {formatShamsiDate(ev.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'حذف رکورد ارزیابی دبیر',
                          message: `آیا مایلید ارزیابی ثبت‌شده توسط ${roleFa} برای ${t?.fullName} را حذف کنید؟`,
                          onConfirm: async () => {
                            await deleteTeacherEvaluation(ev.id);
                            showFeedback('success', 'ارزیابی حذف شد.');
                          },
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

            {/* Extracurriculars */}
            {(dataFilterType === 'all' || dataFilterType === 'extra') &&
              extracurriculars.map((ex) => {
                const c = classes.find((cl) => cl.id === ex.classId);
                return (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px]">
                          فوق‌برنامه پرورشی
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          کلاس: {c?.name || 'نامشخص'} • ماه: {ex.month}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        معدل پرورشی: <strong className="text-purple-600">{toPersianDigits(ex.monthlyAverage)}</strong> (هنری: {toPersianDigits(ex.artistic)}، ورزشی: {toPersianDigits(ex.sports)}، مهارتی: {toPersianDigits(ex.skills)}، علمی: {toPersianDigits(ex.scientific)})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'حذف فعالیت فوق‌برنامه',
                          message: `آیا از حذف داده‌های فوق‌برنامه ماه ${ex.month} برای کلاس ${c?.name} اطمینان دارید؟`,
                          onConfirm: async () => {
                            await deleteExtracurricular(ex.id);
                            showFeedback('success', 'رکورد فوق‌برنامه حذف شد.');
                          },
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

            {/* Family Profiles */}
            {(dataFilterType === 'all' || dataFilterType === 'family') &&
              familyProfiles.map((fp) => {
                const s = students.find((st) => st.id === fp.studentId);
                return (
                  <div
                    key={fp.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px]">
                          شناسنامه سلامت و خانواده
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          فرزند: {s?.firstName} {s?.lastName}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        شاخص BMI: <strong className="text-teal-600">{toPersianDigits(fp.calculatedBmi)}</strong> • شغل پدر: {fp.fatherJob} • شغل مادر: {fp.motherJob} • رفت‌وآمد: {fp.commuteMethod}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: 'حذف شناسنامه سلامت و خانواده',
                          message: `آیا مایلید اطلاعات ثبت‌شده خانواده برای دانش‌آموز ${s?.firstName} ${s?.lastName} را حذف فرمایید؟`,
                          onConfirm: async () => {
                            await deleteFamilyProfile(fp.id);
                            showFeedback('success', 'اطلاعات خانواده با موفقیت حذف گردید.');
                          },
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      <CreateNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        defaultType="meeting"
      />
    </div>
  );
};
