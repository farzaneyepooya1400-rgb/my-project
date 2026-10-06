import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AppUser,
  UserRole,
  GradeLevel,
  SchoolClass,
  Student,
  Teacher,
  TeacherLearningProfile,
  TeacherAssignment,
  StudentGrade,
  AttendanceRecord,
  PsychTestResult,
  SchoolAttitudeResult,
  SchoolExpense,
  SchoolTuitionPayment,
  FamilyProfile,
  TeacherEvaluation,
  StudentStaffEvaluation,
  SubjectDifficulty,
  ExtracurricularActivity,
  AppNotification,
  SchoolCalendarEvent,
  SchoolWideActivity,
  PrayerSurveyResponse,
} from '../types';
import {
} from '../lib/auth';
import { ApiUser, createUserAccount as apiCreateUserAccount, deleteRecord, getApiErrorMessage, getRecords, hasStoredToken, login as apiLogin, logout as apiLogout, me as apiMe, normalizeEmailOrNationalId, register as apiRegister, saveRecord } from '../api';
import {
  INITIAL_GRADES,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_ASSIGNMENTS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECT_DIFFICULTIES,
  INITIAL_GRADES_SHEET,
  TEACHER_STRICTNESS_SAMPLE_GRADES,
  INITIAL_ATTENDANCE,
  INITIAL_PSYCH_RESULTS,
  INITIAL_FAMILY_PROFILE,
  INITIAL_EVALUATIONS,
  INITIAL_STUDENT_STAFF_EVALUATIONS,
  INITIAL_TEACHER_LEARNING_PROFILES,
  INITIAL_EXTRACURRICULARS,
  INITIAL_NOTIFICATIONS,
} from '../lib/sampleData';
import { buildDemoSchoolData, DEMO_STUDENTS_PER_CLASS } from '../lib/demoSchoolData';
import { validateIranianNationalId } from '../lib/persianUtils';
import { calculateAnnualGrade, getIndicatorContinuousAverages } from '../lib/assessment';

interface SchoolContextType {
  currentUser: AppUser | null;
  isAuthLoading: boolean;
  users: AppUser[];
  grades: GradeLevel[];
  classes: SchoolClass[];
  students: Student[];
  teachers: Teacher[];
  assignments: TeacherAssignment[];
  gradesSheet: StudentGrade[];
  attendanceRecords: AttendanceRecord[];
  psychResults: PsychTestResult[];
  teacherLearningProfiles: TeacherLearningProfile[];
  schoolAttitudeResults: SchoolAttitudeResult[];
  tuitionPayments: SchoolTuitionPayment[];
  schoolExpenses: SchoolExpense[];
  familyProfiles: FamilyProfile[];
  evaluations: TeacherEvaluation[];
  studentStaffEvaluations: StudentStaffEvaluation[];
  subjectDifficulties: SubjectDifficulty[];
  extracurriculars: ExtracurricularActivity[];
  notifications: AppNotification[];
  calendarEvents: SchoolCalendarEvent[];
  schoolWideActivities: SchoolWideActivity[];
  prayerSurveyResponses: PrayerSurveyResponse[];
  isFirestoreReady: boolean;
  isSeeding: boolean;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) => Promise<{ success: boolean; message?: string }>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, schoolCode: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  createUserAccount: (user: Omit<AppUser, 'id' | 'createdAt'> & { passwordPlain: string }) => Promise<{ success: boolean; message?: string }>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; message?: string }>;
  addGrade: (name: string, order: number) => Promise<{ success: boolean; message?: string }>;
  deleteGrade: (gradeId: string) => Promise<{ success: boolean; message?: string }>;
  addClass: (name: string, gradeId: string, academicYear: string) => Promise<{ success: boolean; message?: string }>;
  deleteClass: (classId: string) => Promise<{ success: boolean; message?: string }>;
  addStudent: (data: Omit<Student, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteStudent: (studentId: string) => Promise<{ success: boolean; message?: string }>;
  addTeacher: (data: Omit<Teacher, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteTeacher: (teacherId: string) => Promise<{ success: boolean; message?: string }>;
  addAssignment: (teacherId: string, classId: string, subject: string) => Promise<{ success: boolean; message?: string }>;
  deleteAssignment: (assignmentId: string) => Promise<{ success: boolean; message?: string }>;
  saveStudentGrade: (grade: Partial<StudentGrade> & { studentId: string; classId: string; teacherId: string; subject: string }) => Promise<{ success: boolean; message?: string }>;
  deleteStudentGrade: (gradeId: string) => Promise<{ success: boolean; message?: string }>;
  saveAttendance: (rec: Partial<AttendanceRecord> & { studentId: string; classId: string; month: string }) => Promise<{ success: boolean; message?: string }>;
  deleteAttendance: (recordId: string) => Promise<{ success: boolean; message?: string }>;
  savePsychTest: (result: Omit<PsychTestResult, 'id' | 'completedAt'>) => Promise<{ success: boolean; message?: string }>;
  saveTeacherLearningProfile: (profile: Omit<TeacherLearningProfile, 'id' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  saveSchoolAttitudeResult: (result: Omit<SchoolAttitudeResult, 'id' | 'completedAt'>) => Promise<{ success: boolean; message?: string }>;
  addTuitionPayment: (payment: Omit<SchoolTuitionPayment, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; message?: string }>;
  deleteTuitionPayment: (paymentId: string) => Promise<{ success: boolean; message?: string }>;
  addSchoolExpense: (expense: Omit<SchoolExpense, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; message?: string }>;
  deleteSchoolExpense: (expenseId: string) => Promise<{ success: boolean; message?: string }>;
  deletePsychTest: (testId: string) => Promise<{ success: boolean; message?: string }>;
  saveFamilyProfile: (profile: Omit<FamilyProfile, 'id' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteFamilyProfile: (profileId: string) => Promise<{ success: boolean; message?: string }>;
  saveTeacherEvaluation: (evaluation: Omit<TeacherEvaluation, 'id' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteTeacherEvaluation: (evaluationId: string) => Promise<{ success: boolean; message?: string }>;
  saveStudentStaffEvaluation: (evaluation: Omit<StudentStaffEvaluation, 'id' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  updateSubjectDifficulty: (subject: string, coefficient: number, rationale: string, gradeId?: string, track?: string) => Promise<{ success: boolean; message?: string }>;
  addCustomSubject: (subject: string, category: SubjectDifficulty['category'], coefficient: number, gradeId: string, track: string) => Promise<{ success: boolean; message?: string }>;
  deleteCustomSubject: (subjectDifficultyId: string) => Promise<{ success: boolean; message?: string }>;
  saveExtracurricular: (data: Omit<ExtracurricularActivity, 'id' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteExtracurricular: (activityId: string) => Promise<{ success: boolean; message?: string }>;
  addCalendarEvent: (data: Omit<SchoolCalendarEvent, 'id' | 'createdAt' | 'createdBy' | 'kind'>) => Promise<{ success: boolean; message?: string }>;
  deleteCalendarEvent: (eventId: string) => Promise<{ success: boolean; message?: string }>;
  addSchoolWideActivity: (data: Omit<SchoolWideActivity, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; message?: string }>;
  deleteSchoolWideActivity: (activityId: string) => Promise<{ success: boolean; message?: string }>;
  savePrayerSurveyResponse: (data: Omit<PrayerSurveyResponse, 'id' | 'submittedAt'>) => Promise<{ success: boolean; message?: string }>;
  seedSampleData: () => Promise<void>;
  seedDashboardDemoData: () => Promise<{ success: boolean; message: string }>;
  seedTeacherStrictnessSamples: () => Promise<{ success: boolean; message: string }>;
  calculateTeacherWeightedScore: (teacherId: string) => {
    finalScore: number;
    studentScore: number | null;
    studentEvaluationsCount: number;
    adminScore: number | null;
    academicVpScore: number | null;
    culturalVpScore: number | null;
    parentScore: number | null;
    parentEvaluationsCount: number;
  };
}

const SchoolContext = createContext<SchoolContextType | null>(null);

const toAppUser = (user: ApiUser): AppUser => ({
  id: String(user.id),
  username: user.email,
  role: user.role,
  fullName: user.email,
  email: user.email,
  schoolId: user.school_id,
  createdAt: '',
});

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [gradesSheet, setGradesSheet] = useState<StudentGrade[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [psychResults, setPsychResults] = useState<PsychTestResult[]>([]);
  const [teacherLearningProfiles, setTeacherLearningProfiles] = useState<TeacherLearningProfile[]>([]);
  const [schoolAttitudeResults, setSchoolAttitudeResults] = useState<SchoolAttitudeResult[]>([]);
  const [tuitionPayments, setTuitionPayments] = useState<SchoolTuitionPayment[]>([]);
  const [schoolExpenses, setSchoolExpenses] = useState<SchoolExpense[]>([]);
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([]);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [studentStaffEvaluations, setStudentStaffEvaluations] = useState<StudentStaffEvaluation[]>([]);
  const [subjectDifficulties, setSubjectDifficulties] = useState<SubjectDifficulty[]>(INITIAL_SUBJECT_DIFFICULTIES);
  const [extracurriculars, setExtracurriculars] = useState<ExtracurricularActivity[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [calendarEvents, setCalendarEvents] = useState<SchoolCalendarEvent[]>([]);
  const [schoolWideActivities, setSchoolWideActivities] = useState<SchoolWideActivity[]>([]);
  const [prayerSurveyResponses, setPrayerSurveyResponses] = useState<PrayerSurveyResponse[]>([]);
  const [isFirestoreReady, setIsFirestoreReady] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  useEffect(() => {
    let isActive = true;

    const restoreSession = async () => {
      if (!hasStoredToken()) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const user = await apiMe();
        if (isActive) setCurrentUser(toAppUser(user));
      } catch (error) {
        const apiError = error as { error?: string; code?: string };
        if (apiError?.error === 'unauthorized' || apiError?.code === 'unauthorized') {
          apiLogout();
        }
      } finally {
        if (isActive) setIsAuthLoading(false);
      }
    };

    void restoreSession();
    return () => {
      isActive = false;
    };
  }, []);

  // Sync with Firestore Realtime listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let isActive = true;

    try {
      const syncCollection = <T,>(colName: string, setter: ((items: T[]) => void) | React.Dispatch<React.SetStateAction<T[]>>) => {
        const q = collection(db, colName);
        return onSnapshot(
          q,
          (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...docSnap.data() } as T);
            });
            setter(items);
            setIsFirestoreReady(true);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, colName);
          }
        );
      };

      unsubs.push(syncCollection<AppUser>('users', setUsers));
      void getRecords<GradeLevel>('gradeLevels').then(async (gradeList) => {
        const knownGrades = new Map(INITIAL_GRADES.map((grade) => [grade.id, grade]));
        const normalizedGrades = gradeList.map((grade) => {
          const knownGrade = knownGrades.get(grade.id);
          return knownGrade ? { ...grade, name: knownGrade.name, order: knownGrade.order } : grade;
        });
        if (!isActive) return;
        setGrades(normalizedGrades);
        setIsFirestoreReady(true);

        try {
          const existingIds = new Set(gradeList.map((grade) => grade.id));
          for (const grade of INITIAL_GRADES) {
            if (!existingIds.has(grade.id) || gradeList.find((item) => item.id === grade.id)?.order !== grade.order) {
              await saveRecord('gradeLevels', grade);
            }
          }
        } catch (err) {
          console.error('Error normalizing grade levels:', err);
        }
      }).catch((error) => {
        if (isActive) console.error('Error loading grade levels from API:', error);
      });
      unsubs.push(syncCollection<SchoolClass>('schoolClasses', setClasses));
      unsubs.push(syncCollection<Student>('students', setStudents));
      unsubs.push(syncCollection<Teacher>('teachers', setTeachers));
      unsubs.push(syncCollection<TeacherAssignment>('teacherAssignments', setAssignments));
      unsubs.push(syncCollection<StudentGrade>('studentGrades', setGradesSheet));
      unsubs.push(syncCollection<AttendanceRecord>('attendanceRecords', setAttendanceRecords));
      unsubs.push(syncCollection<PsychTestResult>('psychTestResults', setPsychResults));
      unsubs.push(syncCollection<TeacherLearningProfile>('teacherLearningProfiles', setTeacherLearningProfiles));
      unsubs.push(syncCollection<SchoolAttitudeResult>('schoolAttitudeResults', setSchoolAttitudeResults));
      unsubs.push(syncCollection<SchoolTuitionPayment>('schoolTuitionPayments', setTuitionPayments));
      unsubs.push(syncCollection<SchoolExpense>('schoolExpenses', setSchoolExpenses));
      unsubs.push(syncCollection<FamilyProfile>('familyProfiles', setFamilyProfiles));
      unsubs.push(syncCollection<TeacherEvaluation>('teacherEvaluations', setEvaluations));
      unsubs.push(syncCollection<StudentStaffEvaluation>('studentStaffEvaluations', setStudentStaffEvaluations));
      unsubs.push(syncCollection<SubjectDifficulty>('subjectDifficulties', (diffs: SubjectDifficulty[]) => {
        if (diffs.length > 0) {
          setSubjectDifficulties(diffs);
        }
      }));
      unsubs.push(syncCollection<ExtracurricularActivity>('extracurricularActivities', setExtracurriculars));
      unsubs.push(syncCollection<AppNotification>('notifications', (items: AppNotification[]) => {
        if (items.length > 0) {
          setNotifications(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      }));
      unsubs.push(syncCollection<SchoolCalendarEvent>('schoolCalendarEvents', setCalendarEvents));
      unsubs.push(syncCollection<SchoolWideActivity>('schoolWideActivities', setSchoolWideActivities));
      unsubs.push(syncCollection<PrayerSurveyResponse>('prayerSurveyResponses', setPrayerSurveyResponses));
    } catch (e) {
      console.error('Error attaching Firestore listeners:', e);
    }

    return () => {
      isActive = false;
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  // Quick Seed Sample Data to Firestore
  const seedSampleData = useCallback(async () => {
    setIsSeeding(true);
    try {
      for (const g of INITIAL_GRADES) {
        await saveRecord('gradeLevels', g);
      }
      for (const c of INITIAL_CLASSES) {
        await setDoc(doc(db, 'schoolClasses', c.id), c);
      }
      for (const t of INITIAL_TEACHERS) {
        await setDoc(doc(db, 'teachers', t.id), t);
      }
      for (const a of INITIAL_ASSIGNMENTS) {
        await setDoc(doc(db, 'teacherAssignments', a.id), a);
      }
      for (const s of INITIAL_STUDENTS) {
        await setDoc(doc(db, 'students', s.id), s);
      }
      for (const sd of INITIAL_SUBJECT_DIFFICULTIES) {
        await setDoc(doc(db, 'subjectDifficulties', sd.id), sd);
      }
      for (const gr of INITIAL_GRADES_SHEET) {
        await setDoc(doc(db, 'studentGrades', gr.id), gr);
      }
      for (const att of INITIAL_ATTENDANCE) {
        await setDoc(doc(db, 'attendanceRecords', att.id), att);
      }
      for (const ps of INITIAL_PSYCH_RESULTS) {
        await setDoc(doc(db, 'psychTestResults', ps.id), ps);
      }
      await setDoc(doc(db, 'familyProfiles', INITIAL_FAMILY_PROFILE.id), INITIAL_FAMILY_PROFILE);
      for (const ev of INITIAL_EVALUATIONS) {
        await setDoc(doc(db, 'teacherEvaluations', ev.id), ev);
      }
      for (const ex of INITIAL_EXTRACURRICULARS) {
        await setDoc(doc(db, 'extracurricularActivities', ex.id), ex);
      }
      for (const notif of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      }
    } catch (err) {
      console.error('Error seeding data:', err);
    } finally {
      setIsSeeding(false);
    }
  }, []);

  const seedDashboardDemoData = async (): Promise<{ success: boolean; message: string }> => {
    setIsSeeding(true);
    try {
      if (classes.length === 0 || teachers.length === 0) {
        return { success: false, message: 'ابتدا ساختار کلاس‌ها و دبیران مدرسه را ثبت یا بارگذاری کنید.' };
      }

      const seedMissingCollection = async <T extends { id: string }>(
        collectionName: string,
        records: T[],
        alreadyRepresented: (record: T, existing: Record<string, unknown>[]) => boolean = (record, existing) =>
          existing.some((item) => item.id === record.id)
      ) => {
        const snapshot = await getDocs(collection(db, collectionName));
        const existing = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
        const missing = records.filter((record) => !alreadyRepresented(record, existing));
        await Promise.all(missing.map((record) => setDoc(doc(db, collectionName, record.id), record)));
        return missing.length;
      };

      const [storedStudentsSnapshot, storedAssignmentsSnapshot] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'teacherAssignments')),
      ]);
      const allStudents = new Map(students.map((student) => [student.id, student]));
      storedStudentsSnapshot.forEach((document) => allStudents.set(document.id, { id: document.id, ...document.data() } as Student));
      const allAssignments = new Map(assignments.map((assignment) => [assignment.id, assignment]));
      storedAssignmentsSnapshot.forEach((document) => allAssignments.set(document.id, { id: document.id, ...document.data() } as TeacherAssignment));
      const demoData = buildDemoSchoolData(
        [...allStudents.values()],
        classes,
        teachers,
        [...allAssignments.values()],
        INITIAL_TEACHER_LEARNING_PROFILES,
        INITIAL_EVALUATIONS
      );
      const schoolClassIds = new Set(classes.map((schoolClass) => schoolClass.id));
      const demoFamilyProfiles = demoData.familyProfiles.filter((profile) => demoData.demoStudents.some((student) => student.id === profile.studentId));
      const validClassActivities = demoData.classActivities.filter((activity) => schoolClassIds.has(activity.classId));

      const insertedCounts = await Promise.all([
        seedMissingCollection('students', demoData.newStudents, (record, existing) => existing.some((item) => item.id === record.id || item.studentCode === record.studentCode)),
        seedMissingCollection('teacherAssignments', demoData.assignments, (record, existing) => existing.some((item) => item.id === record.id || (item.classId === record.classId && item.teacherId === record.teacherId && item.subject === record.subject))),
        seedMissingCollection('psychTestResults', demoData.psychResults, (record, existing) => existing.some((item) => item.studentId === record.studentId)),
        seedMissingCollection('teacherLearningProfiles', demoData.teacherProfiles, (record, existing) => existing.some((item) => item.teacherId === record.teacherId)),
        seedMissingCollection('studentGrades', demoData.grades, (record, existing) => existing.some((item) =>
          item.id === record.id || (item.studentId === record.studentId && item.classId === record.classId && item.subject === record.subject && item.teacherId === record.teacherId)
        )),
        seedMissingCollection('attendanceRecords', demoData.attendance, (record, existing) => existing.some((item) => item.studentId === record.studentId && item.month === record.month)),
        seedMissingCollection('schoolAttitudeResults', demoData.schoolAttitudeResults, (record, existing) => existing.some((item) => item.studentId === record.studentId)),
        seedMissingCollection('prayerSurveyResponses', demoData.prayerResponses, (record, existing) => existing.some((item) => item.studentId === record.studentId)),
        seedMissingCollection('familyProfiles', demoFamilyProfiles, (record, existing) => existing.some((item) => item.studentId === record.studentId)),
        seedMissingCollection('studentStaffEvaluations', demoData.studentStaffEvaluations, (record, existing) => existing.some((item) => item.studentId === record.studentId && item.targetId === record.targetId && item.targetRole === record.targetRole)),
        seedMissingCollection('teacherEvaluations', demoData.teacherEvaluations, (record, existing) => existing.some((item) => item.teacherId === record.teacherId && item.evaluatorId === record.evaluatorId)),
        seedMissingCollection('extracurricularActivities', validClassActivities, (record, existing) => existing.some((item) => item.id === record.id || (item.classId === record.classId && item.month === record.month))),
        seedMissingCollection('schoolWideActivities', demoData.schoolActivities),
      ]);

      const storedGradesSnapshot = await getDocs(collection(db, 'studentGrades'));
      const storedGrades = storedGradesSnapshot.docs.map((gradeDoc) => ({
        id: gradeDoc.id,
        data: gradeDoc.data() as StudentGrade,
      }));
      const demoGradesToRefresh = demoData.grades.flatMap((sampleGrade) => {
        const existingGrade = storedGrades.find(({ id, data }) =>
          id === sampleGrade.id || (
            data.isDemo &&
            data.studentId === sampleGrade.studentId &&
            data.classId === sampleGrade.classId &&
            data.teacherId === sampleGrade.teacherId &&
            data.subject === sampleGrade.subject
          )
        );
        return existingGrade?.data.isDemo ? [{ existingGrade, sampleGrade }] : [];
      });
      await Promise.all(demoGradesToRefresh.map(({ existingGrade, sampleGrade }) => setDoc(
        doc(db, 'studentGrades', existingGrade.id),
        { ...existingGrade.data, ...sampleGrade, id: existingGrade.id, isDemo: true }
      )));
      const enrichedDemoGrades = demoGradesToRefresh.length;

      const insertedCount = insertedCounts.reduce((sum, count) => sum + count, 0);
      const classSummary = classes.map((schoolClass) => `${schoolClass.name}: ${Math.max(
        allStudents.size ? [...allStudents.values()].filter((student) => student.classId === schoolClass.id).length : 0,
        DEMO_STUDENTS_PER_CLASS
      )}`).join('، ');
      return {
        success: true,
        message: `دادهٔ نمونه تکمیل شد (${classSummary})؛ ${demoData.demoStudents.length.toLocaleString('fa-IR')} دانش‌آموز نمونه در دسترس است، ${demoData.newStudents.length} دانش‌آموز جدید و ${insertedCount} رکورد مرتبط اضافه شد و ${enrichedDemoGrades} کارنامهٔ نمایشی به‌روزرسانی شد. نمره‌های واقعی بازنویسی نشدند.`,
      };
    } catch (error) {
      console.error('Error seeding dashboard demo data:', error);
      return { success: false, message: 'بارگذاری داده‌های نمایشی کامل نشد؛ دوباره تلاش کنید.' };
    } finally {
      setIsSeeding(false);
    }
  };

  const seedTeacherStrictnessSamples = useCallback(async () => {
    const obsoleteSampleId = 'grd_strictness_sample_stud_5_math';
    const existingIds = new Set(gradesSheet.filter((grade) => grade.id !== obsoleteSampleId).map((grade) => grade.id));
    const newGrades = TEACHER_STRICTNESS_SAMPLE_GRADES.filter((grade) => !existingIds.has(grade.id));
    const demoTeacher = INITIAL_TEACHERS.find((teacher) => teacher.id === 'teach_strictness_demo');
    const hasDemoTeacher = teachers.some((teacher) => teacher.id === 'teach_strictness_demo');

    setGradesSheet((current) => {
      const currentIds = new Set(current.filter((grade) => grade.id !== obsoleteSampleId).map((grade) => grade.id));
      return [...current.filter((grade) => grade.id !== obsoleteSampleId), ...newGrades.filter((grade) => !currentIds.has(grade.id))];
    });
    if (demoTeacher && !hasDemoTeacher) {
      setTeachers((current) => current.some((teacher) => teacher.id === demoTeacher.id) ? current : [...current, demoTeacher]);
    }

    const writes = [
      ...newGrades.map((grade) => setDoc(doc(db, 'studentGrades', grade.id), grade)),
      ...(demoTeacher && !hasDemoTeacher ? [setDoc(doc(db, 'teachers', demoTeacher.id), demoTeacher)] : []),
      ...(gradesSheet.some((grade) => grade.id === obsoleteSampleId) ? [deleteDoc(doc(db, 'studentGrades', obsoleteSampleId))] : []),
    ];
    const results = await Promise.allSettled(writes);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some teacher strictness sample records could not be synced.', failures);
      return { success: false, message: 'نمونه در همین صفحه اضافه شد، اما ذخیرهٔ ابری کامل نشد؛ اتصال Firestore را بررسی کنید.' };
    }

    return { success: true, message: newGrades.length > 0 ? `${newGrades.length} نمرهٔ نمونه به مخزن داده اضافه شد.` : 'نمره‌های نمونه قبلاً به مخزن اضافه شده‌اند.' };
  }, [gradesSheet, teachers]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await apiLogin({ email: email.trim(), password });
      const user = await apiMe();
      setCurrentUser(toAppUser(user));
      return { success: true };
    } catch (error) {
      const apiError = error as { error?: string; code?: string };
      if (apiError?.error === 'unauthorized' || apiError?.code === 'unauthorized') apiLogout();
      return { success: false, message: getApiErrorMessage(error) };
    }
  };

  const register = async (email: string, password: string, schoolCode: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await apiRegister({ email: email.trim(), password, school_code: schoolCode.trim() });
      return { success: true };
    } catch (error) {
      return { success: false, message: getApiErrorMessage(error) };
    }
  };

  const logout = () => {
    apiLogout();
    setCurrentUser(null);
  };

  // Create user account by Admin or Sub-Admin
  const createUserAccount = async (
    data: Omit<AppUser, 'id' | 'createdAt'> & { passwordPlain: string }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const identifier = normalizeEmailOrNationalId(data.email || '');
      const result = await apiCreateUserAccount({
        email: identifier,
        password: data.passwordPlain,
        role: data.role,
        username: data.username,
        full_name: data.fullName,
        linked_id: data.linkedId,
        phone: data.phone,
      });
      setUsers((current) => [...current, {
        id: result.id,
        username: data.username,
        role: data.role,
        fullName: data.fullName,
        email: identifier,
        phone: data.phone,
        linkedId: data.linkedId,
        schoolId: currentUser?.schoolId,
        createdAt: new Date().toISOString(),
      }]);
      return { success: true };
    } catch (error) {
      return { success: false, message: getApiErrorMessage(error) };
    }
  };

  // Delete user account
  const deleteUserAccount = async (userId: string): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.id === userId) {
      return { success: false, message: 'حساب جاری واردشده قابل حذف نمی‌باشد.' };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'امکان حذف آخرین مدیر سامانه وجود ندارد.' };
      }
    }

    // Optimistic
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    try {
      await deleteDoc(doc(db, 'users', userId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Add Grade
  const addGrade = async (name: string, order: number): Promise<{ success: boolean; message?: string }> => {
    const id = `grd_${Date.now()}`;
    const newGrade: GradeLevel = {
      id,
      name: name.trim(),
      order,
      createdAt: new Date().toISOString(),
    };
    setGrades((prev) => [...prev, newGrade]);
    try {
      await saveRecord('gradeLevels', newGrade);
      return { success: true };
    } catch (e) {
      console.error(e);
      setGrades((prev) => prev.filter((grade) => grade.id !== id));
      return { success: false, message: 'ذخیره پایه در سرور انجام نشد.' };
    }
  };

  // Delete Grade with child dependency check
  const deleteGrade = async (gradeId: string): Promise<{ success: boolean; message?: string }> => {
    const hasClasses = classes.some((c) => c.gradeId === gradeId);
    if (hasClasses) {
      return { success: false, message: 'این پایه دارای کلاس‌های زیرمجموعه است و قابل حذف نیست.' };
    }
    setGrades((prev) => prev.filter((g) => g.id !== gradeId));
    try {
      await deleteRecord('gradeLevels', gradeId);
      return { success: true };
    } catch (e) {
      console.error(e);
      setGrades((prev) => [...prev, grades.find((grade) => grade.id === gradeId)!]);
      return { success: false, message: 'حذف پایه از سرور انجام نشد.' };
    }
  };

  // Add Class
  const addClass = async (name: string, gradeId: string, academicYear: string): Promise<{ success: boolean; message?: string }> => {
    const id = `cls_${Date.now()}`;
    const newClass: SchoolClass = {
      id,
      name: name.trim(),
      gradeId,
      academicYear: academicYear.trim(),
      createdAt: new Date().toISOString(),
    };
    setClasses((prev) => [...prev, newClass]);
    try {
      await saveRecord('schoolClasses', newClass);
      return { success: true };
    } catch (e) {
      console.error(e);
      setClasses((prev) => prev.filter((schoolClass) => schoolClass.id !== id));
      return { success: false, message: 'ذخیره کلاس در سرور انجام نشد.' };
    }
  };

  // Delete Class with child dependency check
  const deleteClass = async (classId: string): Promise<{ success: boolean; message?: string }> => {
    const hasStudents = students.some((s) => s.classId === classId);
    if (hasStudents) {
      return { success: false, message: 'این کلاس دارای دانش‌آموز فعال است و قابل حذف نیست.' };
    }
    const hasAssignments = assignments.some((a) => a.classId === classId);
    if (hasAssignments) {
      return { success: false, message: 'این کلاس دارای تخصیص‌های کلاسی دبیران است و ابتدا باید تخصیص‌ها لغو شوند.' };
    }
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    try {
      await deleteDoc(doc(db, 'schoolClasses', classId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Add Student with Iranian National ID validation
  const addStudent = async (data: Omit<Student, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    if (!validateIranianNationalId(data.nationalId)) {
      return { success: false, message: 'کد ملی وارد شده نامعتبر است (کنترل رقم رقم آخر کد ملی ۱۰ رقمی با شکست مواجه شد).' };
    }

    const id = `std_${crypto.randomUUID()}`;
    const newStudent: Student = {
      ...data,
      id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      nationalId: data.nationalId.trim(),
      studentCode: data.studentCode.trim(),
      createdAt: new Date().toISOString(),
    };

    setStudents((prev) => [...prev, newStudent]);
    try {
      await setDoc(doc(db, 'students', id), newStudent);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Delete Student
  const deleteStudent = async (studentId: string): Promise<{ success: boolean; message?: string }> => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    try {
      await deleteDoc(doc(db, 'students', studentId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Add Teacher
  const addTeacher = async (data: Omit<Teacher, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    const id = `tch_${crypto.randomUUID()}`;
    const newTeacher: Teacher = {
      ...data,
      id,
      fullName: data.fullName.trim(),
      specialty: data.specialty.trim(),
      teacherCode: data.teacherCode.trim(),
      createdAt: new Date().toISOString(),
    };
    setTeachers((prev) => [...prev, newTeacher]);
    try {
      await setDoc(doc(db, 'teachers', id), newTeacher);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Delete Teacher with assignment dependency check
  const deleteTeacher = async (teacherId: string): Promise<{ success: boolean; message?: string }> => {
    const hasAssignments = assignments.some((a) => a.teacherId === teacherId);
    if (hasAssignments) {
      return { success: false, message: 'این دبیر به چند کلاس تخصیص داده شده است. لطفاً ابتدا تخصیص‌های وی را لغو نمایید.' };
    }
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    try {
      await deleteDoc(doc(db, 'teachers', teacherId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Teacher Assignment
  const addAssignment = async (teacherId: string, classId: string, subject: string): Promise<{ success: boolean; message?: string }> => {
    const id = `asgn_${crypto.randomUUID()}`;
    const newAssignment: TeacherAssignment = {
      id,
      teacherId,
      classId,
      subject: subject.trim(),
      createdAt: new Date().toISOString(),
    };
    setAssignments((prev) => [...prev, newAssignment]);
    try {
      await setDoc(doc(db, 'teacherAssignments', id), newAssignment);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const deleteAssignment = async (assignmentId: string): Promise<{ success: boolean; message?: string }> => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    try {
      await deleteDoc(doc(db, 'teacherAssignments', assignmentId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Save student grade with the annual term weights: 1:2:1:4.
  const saveStudentGrade = async (
    gradeData: Partial<StudentGrade> & { studentId: string; classId: string; teacherId: string; subject: string }
  ): Promise<{ success: boolean; message?: string }> => {
    // Validate range 0-20
    const fieldsToCheck: (keyof StudentGrade)[] = [
      'preMidterm', 'midterm', 'postMidterm', 'final', 'continuous', 'indicatorScore',
      'continuousTerm1', 'term1Exam', 'continuousTerm2', 'term2Exam',
    ];
    for (const f of fieldsToCheck) {
      const val = gradeData[f];
      if (val !== undefined && val !== null) {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 20) {
          return { success: false, message: `نمره وارد شده برای ${f} نامعتبر است (باید بین ۰ تا ۲۰ باشد).` };
        }
      }
    }

    const existing = gradesSheet.find(
      (g) => g.studentId === gradeData.studentId && g.subject === gradeData.subject && g.classId === gradeData.classId
    );

    const conceptEntries = gradeData.conceptEntries ?? existing?.conceptEntries ?? [];
    const normalizedConceptEntries = conceptEntries.map((entry) => ({
      ...entry,
      score: entry.score === null || entry.score === undefined ? null : Number(entry.score),
      level: entry.level,
    }));

    const assessedConceptEntries = normalizedConceptEntries.filter((entry) => entry.level && typeof entry.score === 'number');
    const effectiveIndicatorScore = gradeData.indicatorScore ?? (
      assessedConceptEntries.length
        ? assessedConceptEntries.reduce((sum, entry) => sum + entry.score!, 0) / assessedConceptEntries.length
        : undefined
    );
    const effectiveAssessmentTerm = gradeData.assessmentTerm ?? existing?.assessmentTerm ?? (gradeData.assessmentDate ? (new Date(gradeData.assessmentDate).getMonth() + 1 <= 6 ? 'midterm1' : 'midterm2') : 'midterm1');
    const legacyContinuousGradeMode = gradeData.continuousGradeMode ?? existing?.continuousGradeMode ?? (
      existing?.continuous !== undefined && !existing.conceptEntries?.length ? 'manual' : 'indicator'
    );
    const indicatorAverages = getIndicatorContinuousAverages(normalizedConceptEntries);
    const continuousTerm1Mode = gradeData.continuousTerm1Mode ?? existing?.continuousTerm1Mode ?? legacyContinuousGradeMode;
    const continuousTerm2Mode = gradeData.continuousTerm2Mode ?? existing?.continuousTerm2Mode ?? legacyContinuousGradeMode;
    const continuousTerm1 = continuousTerm1Mode === 'indicator'
      ? indicatorAverages.continuousTerm1
      : gradeData.continuousTerm1 !== undefined ? gradeData.continuousTerm1 : existing?.continuousTerm1 ?? null;
    const continuousTerm2 = continuousTerm2Mode === 'indicator'
      ? indicatorAverages.continuousTerm2
      : gradeData.continuousTerm2 !== undefined ? gradeData.continuousTerm2 : existing?.continuousTerm2 ?? null;

    const normalizedGradeData = {
      ...existing,
      ...gradeData,
      assessmentTerm: effectiveAssessmentTerm,
      conceptEntries: normalizedConceptEntries,
      conceptSummary: gradeData.conceptSummary ?? {
        good: normalizedConceptEntries.filter((entry) => entry.level === 'good').map((entry) => entry.name),
        medium: normalizedConceptEntries.filter((entry) => entry.level === 'medium').map((entry) => entry.name),
        weak: normalizedConceptEntries.filter((entry) => entry.level === 'weak').map((entry) => entry.name),
      },
      indicatorScore: effectiveIndicatorScore ?? existing?.indicatorScore ?? null,
      indicatorLevel: gradeData.indicatorLevel ??
        (effectiveIndicatorScore !== undefined
          ? (effectiveIndicatorScore >= 15 ? 'good' : effectiveIndicatorScore >= 10 ? 'medium' : 'weak')
          : existing?.indicatorLevel),
      continuousTerm1Mode,
      continuousTerm2Mode,
      continuousGradeMode: continuousTerm1Mode === continuousTerm2Mode ? continuousTerm1Mode : legacyContinuousGradeMode,
      continuousTerm1,
      term1Exam: gradeData.term1Exam !== undefined ? gradeData.term1Exam : existing?.term1Exam ?? existing?.midterm ?? null,
      continuousTerm2,
      term2Exam: gradeData.term2Exam !== undefined ? gradeData.term2Exam : existing?.term2Exam ?? existing?.final ?? null,
    };

    const calculatedAvg = calculateAnnualGrade(normalizedGradeData);

    const docId = existing?.id || `grd_${Date.now()}_${gradeData.studentId.substring(0, 5)}`;
    const updatedGrade: StudentGrade = {
      ...(existing || {}),
      ...normalizedGradeData,
      id: docId,
      calculatedAverage: calculatedAvg,
      updatedAt: new Date().toISOString(),
    };

    setGradesSheet((prev) => {
      const filtered = prev.filter((g) => g.id !== docId);
      return [...filtered, updatedGrade];
    });

    try {
      await setDoc(doc(db, 'studentGrades', docId), updatedGrade);
      
      // Auto-trigger smart notification for students, parents and principal
      const studentObj = students.find((s) => s.id === gradeData.studentId);
      const studentFullName = studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : 'دانش‌آموز';
      addNotification({
        title: `ثبت نمره جدید: درس ${gradeData.subject}`,
        message: `نمره جدید برای ${studentFullName} در درس ${gradeData.subject} با میانگین زنده ${calculatedAvg} از ۲۰ در سامانه ثبت شد.`,
        type: 'grade',
        senderRole: currentUser?.role || 'teacher',
        senderName: currentUser?.fullName || 'دبیر محترم',
        targetClassId: gradeData.classId,
        targetStudentId: gradeData.studentId,
        targetRole: 'all',
      }).catch(console.error);

      return { success: true };
    } catch (e) {
      console.error(e);
      setGradesSheet((prev) => {
        const filtered = prev.filter((grade) => grade.id !== docId);
        return existing ? [...filtered, existing] : filtered;
      });
      return { success: false, message: 'ذخیره در پایگاه داده انجام نشد؛ اتصال یا دسترسی را بررسی کنید.' };
    }
  };

  const deleteStudentGrade = async (gradeId: string): Promise<{ success: boolean; message?: string }> => {
    setGradesSheet((prev) => prev.filter((g) => g.id !== gradeId));
    try {
      await deleteDoc(doc(db, 'studentGrades', gradeId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Save Attendance & Homework & Behaviors
  const saveAttendance = async (
    rec: Partial<AttendanceRecord> & { studentId: string; classId: string; month: string }
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = attendanceRecords.find(
      (a) => a.studentId === rec.studentId && a.classId === rec.classId && (
        rec.date
          ? a.date === rec.date && a.teacherId === rec.teacherId
          : a.month === rec.month && !a.date
      )
    );
    const docId = existing?.id || (rec.date
      ? `att_daily_${rec.studentId}_${rec.classId}_${rec.date}_${rec.teacherId || 'teacher'}`
      : `att_${Date.now()}_${rec.studentId.substring(0, 5)}`);

    const newRec: AttendanceRecord = {
      absences: 0,
      tardies: 0,
      homeworkPercent: 100,
      homeworkQuality: 5,
      participation: 5,
      behavior: 5,
      responsibility: 5,
      teamwork: 5,
      rulesObservance: 5,
      ...(existing || {}),
      ...rec,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) => {
      const filtered = prev.filter((a) => a.id !== docId);
      return [...filtered, newRec];
    });

    try {
      await setDoc(doc(db, 'attendanceRecords', docId), newRec);
      return { success: true };
    } catch (e) {
      console.error(e);
      setAttendanceRecords((prev) => {
        const filtered = prev.filter((record) => record.id !== docId);
        return existing ? [...filtered, existing] : filtered;
      });
      return { success: false, message: 'ذخیره در پایگاه داده انجام نشد؛ اتصال یا دسترسی را بررسی کنید.' };
    }
  };

  const deleteAttendance = async (recordId: string): Promise<{ success: boolean; message?: string }> => {
    setAttendanceRecords((prev) => prev.filter((a) => a.id !== recordId));
    try {
      await deleteDoc(doc(db, 'attendanceRecords', recordId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Save Psychological Test Result
  const savePsychTest = async (
    result: Omit<PsychTestResult, 'id' | 'completedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = psychResults.find((p) => p.studentId === result.studentId);
    const docId = existing?.id || `psych_${Date.now()}_${result.studentId}`;

    const newResult: PsychTestResult = {
      ...result,
      id: docId,
      completedAt: new Date().toISOString(),
    };

    setPsychResults((prev) => {
      const filtered = prev.filter((p) => p.id !== docId);
      return [...filtered, newResult];
    });

    try {
      await setDoc(doc(db, 'psychTestResults', docId), newResult);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const deletePsychTest = async (testId: string): Promise<{ success: boolean; message?: string }> => {
    setPsychResults((prev) => prev.filter((p) => p.id !== testId));
    try {
      await deleteDoc(doc(db, 'psychTestResults', testId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const saveSchoolAttitudeResult = async (
    result: Omit<SchoolAttitudeResult, 'id' | 'completedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const docId = `school_attitude_${result.studentId}`;
    const savedResult: SchoolAttitudeResult = {
      ...result,
      id: docId,
      completedAt: new Date().toISOString(),
    };

    setSchoolAttitudeResults((previous) => [
      ...previous.filter((item) => item.studentId !== result.studentId),
      savedResult,
    ]);

    try {
      await setDoc(doc(db, 'schoolAttitudeResults', docId), savedResult);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: true };
    }
  };

  const saveTeacherLearningProfile = async (
    profile: Omit<TeacherLearningProfile, 'id' | 'updatedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const teacher = teachers.find((item) => item.id === profile.teacherId);
    const isOwner = teacher && (teacher.teacherCode === currentUser?.linkedId || teacher.fullName === currentUser?.fullName);
    if (currentUser?.role !== 'teacher' || !isOwner) {
      return { success: false, message: 'فقط معلم می‌تواند خودارزیابی پرونده‌ی خودش را ثبت کند.' };
    }

    const id = `teacher_learning_${profile.teacherId}`;
    const savedProfile: TeacherLearningProfile = { ...profile, id, updatedAt: new Date().toISOString() };
    setTeacherLearningProfiles((previous) => [
      ...previous.filter((item) => item.teacherId !== profile.teacherId),
      savedProfile,
    ]);

    try {
      await setDoc(doc(db, 'teacherLearningProfiles', id), savedProfile);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'ثبت خودارزیابی در پایگاه داده انجام نشد.' };
    }
  };

  const canManageFinance = currentUser?.role === 'admin' || currentUser?.role === 'executive_vp';

  const addTuitionPayment = async (
    payment: Omit<SchoolTuitionPayment, 'id' | 'createdAt' | 'createdBy'>
  ): Promise<{ success: boolean; message?: string }> => {
    if (!canManageFinance || !currentUser) return { success: false, message: 'دسترسی ثبت دریافت مالی ندارید.' };
    if ((!payment.studentId && !payment.payerName?.trim()) || !Number.isFinite(payment.amountToman) || payment.amountToman <= 0 || !payment.month || !payment.schoolYear || !payment.paidAt) {
      return { success: false, message: 'دانش‌آموز یا منبع درآمد، مبلغ، ماه، سال تحصیلی و تاریخ را بررسی کنید.' };
    }

    const record: SchoolTuitionPayment = {
      ...payment,
      id: `tuition_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      payerName: payment.payerName?.trim() || undefined,
      receiptCode: payment.receiptCode?.trim() || undefined,
      note: payment.note?.trim() || undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setTuitionPayments((previous) => [record, ...previous]);
    try {
      await setDoc(doc(db, 'schoolTuitionPayments', record.id), record);
      return { success: true };
    } catch (error) {
      console.error(error);
      setTuitionPayments((previous) => previous.filter((item) => item.id !== record.id));
      return { success: false, message: 'ذخیرهٔ دریافت ناموفق بود؛ اتصال پایگاه داده را بررسی کنید.' };
    }
  };

  const deleteTuitionPayment = async (paymentId: string): Promise<{ success: boolean; message?: string }> => {
    if (!canManageFinance) return { success: false, message: 'دسترسی حذف دریافت مالی ندارید.' };
    const payment = tuitionPayments.find((item) => item.id === paymentId);
    if (!payment) return { success: false, message: 'رکورد دریافت پیدا نشد.' };
    setTuitionPayments((previous) => previous.filter((item) => item.id !== paymentId));
    try {
      await deleteDoc(doc(db, 'schoolTuitionPayments', paymentId));
      return { success: true };
    } catch (error) {
      console.error(error);
      setTuitionPayments((previous) => [payment, ...previous]);
      return { success: false, message: 'حذف دریافت انجام نشد.' };
    }
  };

  const addSchoolExpense = async (
    expense: Omit<SchoolExpense, 'id' | 'createdAt' | 'createdBy'>
  ): Promise<{ success: boolean; message?: string }> => {
    if (!canManageFinance || !currentUser) return { success: false, message: 'دسترسی ثبت هزینه ندارید.' };
    if (!expense.title.trim() || !expense.category || !Number.isFinite(expense.amountToman) || expense.amountToman <= 0 || !expense.month || !expense.schoolYear || !expense.paidAt) {
      return { success: false, message: 'عنوان، دسته، مبلغ، ماه، سال تحصیلی و تاریخ را بررسی کنید.' };
    }

    const record: SchoolExpense = {
      ...expense,
      id: `expense_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: expense.title.trim(),
      receiptCode: expense.receiptCode?.trim() || undefined,
      note: expense.note?.trim() || undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setSchoolExpenses((previous) => [record, ...previous]);
    try {
      await setDoc(doc(db, 'schoolExpenses', record.id), record);
      return { success: true };
    } catch (error) {
      console.error(error);
      setSchoolExpenses((previous) => previous.filter((item) => item.id !== record.id));
      return { success: false, message: 'ذخیرهٔ هزینه ناموفق بود؛ اتصال پایگاه داده را بررسی کنید.' };
    }
  };

  const deleteSchoolExpense = async (expenseId: string): Promise<{ success: boolean; message?: string }> => {
    if (!canManageFinance) return { success: false, message: 'دسترسی حذف هزینه ندارید.' };
    const expense = schoolExpenses.find((item) => item.id === expenseId);
    if (!expense) return { success: false, message: 'رکورد هزینه پیدا نشد.' };
    setSchoolExpenses((previous) => previous.filter((item) => item.id !== expenseId));
    try {
      await deleteDoc(doc(db, 'schoolExpenses', expenseId));
      return { success: true };
    } catch (error) {
      console.error(error);
      setSchoolExpenses((previous) => [expense, ...previous]);
      return { success: false, message: 'حذف هزینه انجام نشد.' };
    }
  };

  // Save Family Profile
  const saveFamilyProfile = async (
    profile: Omit<FamilyProfile, 'id' | 'updatedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = familyProfiles.find((f) => f.studentId === profile.studentId);
    const docId = existing?.id || `fam_${Date.now()}_${profile.studentId}`;

    const newProfile: FamilyProfile = {
      ...profile,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    setFamilyProfiles((prev) => {
      const filtered = prev.filter((f) => f.id !== docId);
      return [...filtered, newProfile];
    });

    try {
      await setDoc(doc(db, 'familyProfiles', docId), newProfile);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const deleteFamilyProfile = async (profileId: string): Promise<{ success: boolean; message?: string }> => {
    setFamilyProfiles((prev) => prev.filter((f) => f.id !== profileId));
    try {
      await deleteDoc(doc(db, 'familyProfiles', profileId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Teacher Evaluation (Replace previous evaluation or create new)
  const saveTeacherEvaluation = async (
    evaluation: Omit<TeacherEvaluation, 'id' | 'updatedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = evaluations.find(
      (e) => e.teacherId === evaluation.teacherId && e.evaluatorId === evaluation.evaluatorId
    );
    const docId = existing?.id || `eval_${Date.now()}_${evaluation.teacherId}`;

    const newEval: TeacherEvaluation = {
      ...evaluation,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    setEvaluations((prev) => {
      const filtered = prev.filter((e) => e.id !== docId);
      return [...filtered, newEval];
    });

    try {
      await setDoc(doc(db, 'teacherEvaluations', docId), newEval);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const deleteTeacherEvaluation = async (evaluationId: string): Promise<{ success: boolean; message?: string }> => {
    setEvaluations((prev) => prev.filter((e) => e.id !== evaluationId));
    try {
      await deleteDoc(doc(db, 'teacherEvaluations', evaluationId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const saveStudentStaffEvaluation = async (
    evaluation: Omit<StudentStaffEvaluation, 'id' | 'updatedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = studentStaffEvaluations.find(
      (item) => item.studentId === evaluation.studentId && item.targetId === evaluation.targetId
    );
    const docId = existing?.id || `student_eval_${Date.now()}_${evaluation.targetId}`;
    const newEvaluation: StudentStaffEvaluation = {
      ...evaluation,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    setStudentStaffEvaluations((previous) => [
      ...previous.filter((item) => item.id !== docId),
      newEvaluation,
    ]);

    try {
      await setDoc(doc(db, 'studentStaffEvaluations', docId), newEvaluation);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Subject difficulty update (Admin and Sub-Admin)
  const addCustomSubject = async (
    subject: string,
    category: SubjectDifficulty['category'],
    coefficient: number,
    gradeId: string,
    track: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'sub_admin') {
      return { success: false, message: 'فقط مدیر مدرسه و ساب‌ادمین مجاز به افزودن درس هستند.' };
    }

    const cleanSubject = subject.trim();
    if (!cleanSubject || !gradeId || !track || coefficient <= 0) {
      return { success: false, message: 'نام درس، پایه، رشته و ضریب معتبر الزامی است.' };
    }

    const duplicate = subjectDifficulties.some(
      (item) => item.subject === cleanSubject && item.gradeId === gradeId && item.track === track
    );
    if (duplicate) {
      return { success: false, message: 'این درس قبلاً برای همین پایه و رشته ثبت شده است.' };
    }

    const newDifficulty: SubjectDifficulty = {
      id: `custom_${gradeId}_${track}_${Date.now()}`,
      subject: cleanSubject,
      gradeId,
      track,
      category: category || 'تخصصی',
      isCustom: true,
      coefficient,
      rationale: 'درس سفارشی افزوده‌شده توسط مدیر مدرسه؛ ضریب قابل ویرایش است.',
      updatedAt: new Date().toISOString(),
    };

    setSubjectDifficulties((previous) => [...previous, newDifficulty]);
    try {
      await setDoc(doc(db, 'subjectDifficulties', newDifficulty.id), newDifficulty);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'ذخیره درس سفارشی انجام نشد.' };
    }
  };

  const deleteCustomSubject = async (subjectDifficultyId: string): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'sub_admin') {
      return { success: false, message: 'فقط مدیر مدرسه و ساب‌ادمین مجاز به حذف درس هستند.' };
    }

    const target = subjectDifficulties.find((item) => item.id === subjectDifficultyId);
    if (!target?.isCustom) {
      return { success: false, message: 'درس‌های استاندارد سامانه قابل حذف نیستند.' };
    }

    setSubjectDifficulties((previous) => previous.filter((item) => item.id !== subjectDifficultyId));
    try {
      await deleteDoc(doc(db, 'subjectDifficulties', subjectDifficultyId));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'حذف درس سفارشی انجام نشد.' };
    }
  };

  const updateSubjectDifficulty = async (
    subject: string,
    coefficient: number,
    rationale: string,
    gradeId?: string,
    track?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'sub_admin') {
      return { success: false, message: 'فقط مدیر مدرسه و ساب‌ادمین دسترسی به ویرایش ضرایب سختی دروس دارند.' };
    }

    const existing = subjectDifficulties.find(
      (item) => item.subject === subject && item.gradeId === gradeId && item.track === track
    ) || subjectDifficulties.find((item) => item.subject === subject && !item.gradeId);
    const docId = existing && existing.gradeId === gradeId && existing.track === track
      ? existing.id
      : `sd_${gradeId || 'all'}_${track || 'general'}_${encodeURIComponent(subject)}`;

    const newDifficulty: SubjectDifficulty = {
      id: docId,
      subject,
      gradeId,
      track,
      coefficient,
      rationale,
      updatedAt: new Date().toISOString(),
    };

    setSubjectDifficulties((prev) => {
      const filtered = prev.filter((s) => !(s.subject === subject && s.gradeId === gradeId && s.track === track));
      return [...filtered, newDifficulty];
    });

    try {
      await setDoc(doc(db, 'subjectDifficulties', docId), newDifficulty);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Extracurricular Activity
  const saveExtracurricular = async (
    data: Omit<ExtracurricularActivity, 'id' | 'updatedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const existing = extracurriculars.find(
      (e) => e.classId === data.classId && e.month === data.month
    );
    const docId = existing?.id || `extra_${Date.now()}_${data.classId}`;

    const newExtra: ExtracurricularActivity = {
      ...data,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    setExtracurriculars((prev) => {
      const filtered = prev.filter((e) => e.id !== docId);
      return [...filtered, newExtra];
    });

    try {
      await setDoc(doc(db, 'extracurricularActivities', docId), newExtra);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const addCalendarEvent = async (
    data: Omit<SchoolCalendarEvent, 'id' | 'createdAt' | 'createdBy' | 'kind'>
  ): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'cultural_vp' && currentUser?.role !== 'admin') {
      return { success: false, message: 'فقط معاون پرورشی یا مدیر مجاز به ثبت برنامه تقویمی است.' };
    }
    if (!data.date || !data.title.trim()) {
      return { success: false, message: 'تاریخ و عنوان برنامه الزامی است.' };
    }

    const event: SchoolCalendarEvent = {
      ...data,
      id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      kind: 'school',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setCalendarEvents((previous) => [...previous, event]);
    try {
      await setDoc(doc(db, 'schoolCalendarEvents', event.id), event);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'ذخیره برنامه تقویمی انجام نشد.' };
    }
  };

  const deleteCalendarEvent = async (eventId: string): Promise<{ success: boolean; message?: string }> => {
    const event = calendarEvents.find((item) => item.id === eventId);
    if (!event || (currentUser?.role !== 'admin' && event.createdBy !== currentUser?.id)) {
      return { success: false, message: 'دسترسی حذف این برنامه را ندارید.' };
    }
    setCalendarEvents((previous) => previous.filter((item) => item.id !== eventId));
    try {
      await deleteDoc(doc(db, 'schoolCalendarEvents', eventId));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'حذف برنامه تقویمی انجام نشد.' };
    }
  };

  const addSchoolWideActivity = async (
    data: Omit<SchoolWideActivity, 'id' | 'createdAt' | 'createdBy'>
  ): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'cultural_vp' && currentUser?.role !== 'admin') {
      return { success: false, message: 'فقط معاون پرورشی یا مدیر مجاز به ثبت فعالیت عمومی مدرسه است.' };
    }
    if (!data.title.trim() || !data.date || !data.month || data.participants < 0) {
      return { success: false, message: 'عنوان، تاریخ، ماه و تعداد شرکت‌کنندگان را کامل کنید.' };
    }

    const activity: SchoolWideActivity = {
      ...data,
      id: `schoolwide_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    setSchoolWideActivities((previous) => [...previous, activity]);
    try {
      await setDoc(doc(db, 'schoolWideActivities', activity.id), activity);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'ذخیره فعالیت عمومی مدرسه انجام نشد.' };
    }
  };

  const deleteSchoolWideActivity = async (activityId: string): Promise<{ success: boolean; message?: string }> => {
    const activity = schoolWideActivities.find((item) => item.id === activityId);
    if (!activity || (currentUser?.role !== 'admin' && activity.createdBy !== currentUser?.id)) {
      return { success: false, message: 'دسترسی حذف این فعالیت را ندارید.' };
    }
    setSchoolWideActivities((previous) => previous.filter((item) => item.id !== activityId));
    try {
      await deleteDoc(doc(db, 'schoolWideActivities', activityId));
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'حذف فعالیت عمومی مدرسه انجام نشد.' };
    }
  };

  const savePrayerSurveyResponse = async (
    data: Omit<PrayerSurveyResponse, 'id' | 'submittedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    if (currentUser?.role !== 'student') {
      return { success: false, message: 'فقط دانش‌آموز می‌تواند به این پرسشنامه پاسخ دهد.' };
    }
    const response: PrayerSurveyResponse = {
      ...data,
      id: `prayer_${data.studentId}`,
      submittedAt: new Date().toISOString(),
    };
    setPrayerSurveyResponses((previous) => [
      ...previous.filter((item) => item.studentId !== data.studentId),
      response,
    ]);
    try {
      await setDoc(doc(db, 'prayerSurveyResponses', response.id), response);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'ذخیره پاسخ پرسشنامه انجام نشد.' };
    }
  };

  const deleteExtracurricular = async (activityId: string): Promise<{ success: boolean; message?: string }> => {
    setExtracurriculars((prev) => prev.filter((e) => e.id !== activityId));
    try {
      await deleteDoc(doc(db, 'extracurricularActivities', activityId));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  // Notification management
  const addNotification = async (
    notif: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>
  ): Promise<{ success: boolean; message?: string }> => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: AppNotification = {
      ...notif,
      id,
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);

    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: true };
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notificationId && !n.readBy.includes(userId)) {
          return { ...n, readBy: [...n.readBy, userId] };
        }
        return n;
      })
    );

    const target = notifications.find((n) => n.id === notificationId);
    if (target && !target.readBy.includes(userId)) {
      try {
        await setDoc(
          doc(db, 'notifications', notificationId),
          { ...target, readBy: [...target.readBy, userId] },
          { merge: true }
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setNotifications((prev) =>
      prev.map((n) =>
        n.readBy.includes(userId) ? n : { ...n, readBy: [...n.readBy, userId] }
      )
    );

    for (const n of notifications) {
      if (!n.readBy.includes(userId)) {
        try {
          await setDoc(
            doc(db, 'notifications', n.id),
            { ...n, readBy: [...n.readBy, userId] },
            { merge: true }
          );
        } catch {
          // ignore
        }
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate teacher final weighted evaluation score:
  // Students: 25%, Parents: 25%, Principal: 20%, Academic VP: 15%, Cultural VP: 15%.
  // Normalized if some groups have not yet evaluated!
  const calculateTeacherWeightedScore = useCallback((teacherId: string) => {
    const teacherEvals = evaluations.filter((e) => e.teacherId === teacherId);
    const studentEvals = studentStaffEvaluations.filter(
      (evaluation) => evaluation.targetId === teacherId && evaluation.targetRole === 'teacher'
    );

    const adminEval = teacherEvals.find((e) => e.evaluatorRole === 'admin');
    const academicVpEval = teacherEvals.find((e) => e.evaluatorRole === 'academic_vp');
    const culturalVpEval = teacherEvals.find((e) => e.evaluatorRole === 'cultural_vp');
    const parentEvals = teacherEvals.filter((e) => e.evaluatorRole === 'parent');

    const adminScore = adminEval ? adminEval.averageScore : null;
    const academicVpScore = academicVpEval ? academicVpEval.averageScore : null;
    const culturalVpScore = culturalVpEval ? culturalVpEval.averageScore : null;

    let studentScore: number | null = null;
    if (studentEvals.length > 0) {
      const sum = studentEvals.reduce((acc, curr) => acc + curr.averageScore, 0);
      studentScore = Math.round((sum / studentEvals.length) * 100) / 100;
    }
    
    let parentScore: number | null = null;
    if (parentEvals.length > 0) {
      const sum = parentEvals.reduce((acc, curr) => acc + curr.averageScore, 0);
      parentScore = Math.round((sum / parentEvals.length) * 100) / 100;
    }

    // Weighted normalization
    let totalScoreWeight = 0;
    let totalWeight = 0;

    if (studentScore !== null) {
      totalScoreWeight += studentScore * 0.25;
      totalWeight += 0.25;
    }
    if (adminScore !== null) {
      totalScoreWeight += adminScore * 0.20;
      totalWeight += 0.20;
    }
    if (academicVpScore !== null) {
      totalScoreWeight += academicVpScore * 0.20;
      totalWeight += 0.20;
    }
    if (culturalVpScore !== null) {
      totalScoreWeight += culturalVpScore * 0.20;
      totalWeight += 0.20;
    }
    if (parentScore !== null) {
      totalScoreWeight += parentScore * 0.40;
      totalWeight += 0.40;
    }

    const finalScore = totalWeight > 0 ? Math.round((totalScoreWeight / totalWeight) * 100) / 100 : 0;

    return {
      finalScore,
      studentScore,
      studentEvaluationsCount: studentEvals.length,
      adminScore,
      academicVpScore,
      culturalVpScore,
      parentScore,
      parentEvaluationsCount: parentEvals.length,
    };
  }, [evaluations, studentStaffEvaluations]);

  return (
    <SchoolContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        users,
        grades,
        classes,
        students,
        teachers,
        assignments,
        gradesSheet,
        attendanceRecords,
        psychResults,
        teacherLearningProfiles,
        schoolAttitudeResults,
        tuitionPayments,
        schoolExpenses,
        familyProfiles,
        evaluations,
        studentStaffEvaluations,
        subjectDifficulties,
        extracurriculars,
        notifications,
        calendarEvents,
        schoolWideActivities,
        prayerSurveyResponses,
        isFirestoreReady,
        isSeeding,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        login,
        register,
        logout,
        createUserAccount,
        deleteUserAccount,
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
        saveStudentGrade,
        deleteStudentGrade,
        saveAttendance,
        deleteAttendance,
        savePsychTest,
        saveTeacherLearningProfile,
        saveSchoolAttitudeResult,
        addTuitionPayment,
        deleteTuitionPayment,
        addSchoolExpense,
        deleteSchoolExpense,
        deletePsychTest,
        saveFamilyProfile,
        deleteFamilyProfile,
        saveTeacherEvaluation,
        deleteTeacherEvaluation,
        saveStudentStaffEvaluation,
        updateSubjectDifficulty,
        addCustomSubject,
        deleteCustomSubject,
        saveExtracurricular,
        deleteExtracurricular,
        addCalendarEvent,
        deleteCalendarEvent,
        addSchoolWideActivity,
        deleteSchoolWideActivity,
        savePrayerSurveyResponse,
        seedSampleData,
        seedDashboardDemoData,
        seedTeacherStrictnessSamples,
        calculateTeacherWeightedScore,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within SchoolProvider');
  return ctx;
}
