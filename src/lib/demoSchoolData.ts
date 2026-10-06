import type {
  ExtracurricularActivity,
  FamilyProfile,
  PrayerSurveyResponse,
  PsychTestResult,
  SchoolAttitudeResult,
  SchoolClass,
  SchoolWideActivity,
  Student,
  StudentGrade,
  StudentStaffEvaluation,
  Teacher,
  TeacherAssignment,
  TeacherEvaluation,
  TeacherLearningProfile,
} from '../types';
import { INITIAL_STUDENTS, createDemoAttendanceRecord, createDemoPsychResult } from './sampleData';
import { PRAYER_SURVEY_QUESTIONS } from './prayerSurvey';
import { calculateSchoolAttitudeScores, SCHOOL_ATTITUDE_QUESTIONS } from './schoolAttitudeSurvey';

export const DEMO_STUDENTS_PER_CLASS = 15;

const firstNames = [
  'آرین', 'هستی', 'پارسا', 'هلیا', 'سام', 'آوا', 'بردیا', 'رها', 'کیان', 'ترانه',
  'سینا', 'یلدا', 'رادین', 'نیایش', 'مهراد', 'مبینا', 'آرتین', 'نازنین', 'مانی', 'درسا',
];
const lastNames = [
  'مهرآیین', 'دادگر', 'نیک‌پی', 'فرهمند', 'سپهر', 'روشن', 'آزاد', 'مهرگان', 'پارسا', 'دانشور',
  'به‌آیین', 'سروش', 'کوشا', 'راد', 'آگاه', 'فرزانه', 'مهربان', 'پویان', 'نیک‌روش', 'دادخواه',
];
const persianMonths = ['مهر', 'آبان', 'آذر'];
const demoSampleStudentIds = new Set(INITIAL_STUDENTS.map((student) => student.id));

const safeToken = (value: string) => value.normalize('NFKD').replace(/[^A-Za-z0-9_-]/g, '_');
const round1 = (value: number) => Math.round(value * 10) / 10;

const createIranianNationalId = (serial: number) => {
  const body = String(800000000 + (serial % 100000000)).padStart(9, '0');
  const weightedTotal = [...body].reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = weightedTotal % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;
  return `${body}${checkDigit}`;
};

const createStudent = (schoolClass: SchoolClass, classIndex: number, ordinal: number): Student => {
  const classToken = safeToken(schoolClass.id);
  const nameIndex = (classIndex * DEMO_STUDENTS_PER_CLASS + ordinal - 1) % firstNames.length;
  const lastNameIndex = (classIndex * DEMO_STUDENTS_PER_CLASS + ordinal - 1) % lastNames.length;
  const serial = classIndex * 100 + ordinal;
  const studentCode = `DM-${classToken.toUpperCase()}-${String(ordinal).padStart(2, '0')}`;
  return {
    id: `demo_student_${classToken}_${String(ordinal).padStart(2, '0')}`,
    firstName: firstNames[nameIndex],
    lastName: lastNames[lastNameIndex],
    nationalId: createIranianNationalId(1000 + serial),
    studentCode,
    classId: schoolClass.id,
    gradeId: schoolClass.gradeId,
    isDemo: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
};

const createSchoolAttitudeResult = (student: Student, index: number): SchoolAttitudeResult => {
  const answers = Object.fromEntries(SCHOOL_ATTITUDE_QUESTIONS.map((question, questionIndex) => [
    question.id,
    1 + ((index + questionIndex * 2) % 5),
  ]));
  return {
    id: `school_attitude_${student.id}`,
    studentId: student.id,
    answers,
    ...calculateSchoolAttitudeScores(answers),
    isDemo: true,
    completedAt: '2026-01-01T00:00:00.000Z',
  };
};

const createPrayerResponse = (student: Student, index: number): PrayerSurveyResponse => ({
  id: `prayer_demo_${student.id}`,
  studentId: student.id,
  classId: student.classId,
  answers: Object.fromEntries(PRAYER_SURVEY_QUESTIONS.map((question, questionIndex) => [
    question.id,
    (index + questionIndex) % question.options.length,
  ])),
  submittedAt: '2026-01-01T00:00:00.000Z',
  isDemo: true,
});

const createFamilyProfile = (student: Student, index: number): FamilyProfile => {
  const heightCm = 145 + (index % 21);
  const weightKg = 38 + ((index * 3) % 33);
  return {
    id: `demo_family_${student.id}`,
    studentId: student.id,
    fatherEducation: ['دیپلم', 'کارشناسی', 'کارشناسی ارشد'][index % 3],
    fatherJob: ['کارمند', 'آزاد', 'فنی'][index % 3],
    motherEducation: ['دیپلم', 'کارشناسی', 'کارشناسی ارشد'][(index + 1) % 3],
    motherJob: ['خانه‌دار', 'کارمند', 'آزاد'][(index + 1) % 3],
    childrenCount: 1 + (index % 4),
    maritalStatus: 'همراه',
    heightCm,
    weightKg,
    calculatedBmi: Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10,
    sleepHour: ['۲۱:۳۰', '۲۲:۰۰', '۲۲:۳۰'][index % 3],
    screenTimeHours: round1(1 + (index % 4) * 0.5),
    breakfastStatus: (['همیشه', 'گاهی', 'به‌ندرت'] as const)[index % 3],
    hasVisionHearingIssue: false,
    distanceToSchoolKm: round1(1 + (index % 8) * 0.7),
    commuteMethod: (['پیاده', 'سرویس', 'خودرو شخصی', 'حمل‌ونقل عمومی'] as const)[index % 4],
    homeResponsibilityScore: 2 + (index % 4),
    isDemo: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
};

const createGrades = (student: Student, classAssignments: TeacherAssignment[], index: number): StudentGrade[] =>
  classAssignments.map((assignment, assignmentIndex) => {
    const seed = (index * 7 + assignmentIndex * 3) % 10;
    const midterm = 10 + seed;
    const final = Math.min(20, midterm + ((index + assignmentIndex) % 4));
    const continuous = Math.min(20, midterm + ((index + 2 * assignmentIndex) % 3));
    const conceptNames = ['درک مفاهیم پایه', 'حل تمرین و مسئله', 'کاربرد آموخته‌ها'];
    const levels = ['good', 'medium', 'weak'] as const;
    const scores = { good: 18, medium: 12, weak: 7 };
    const makeConceptEntries = (term: 'midterm1' | 'midterm2', sessionNumber: number, date: string, levelOffset: number) => conceptNames.map((name, conceptIndex) => {
      const level = levels[(index + assignmentIndex + conceptIndex + levelOffset) % levels.length];
      return {
        id: `demo_concept_${safeToken(student.id)}_${safeToken(assignment.id)}_${term}_${conceptIndex + 1}`,
        sessionId: `demo_session_${safeToken(assignment.id)}_${term}`,
        sessionNumber,
        sessionLabel: `جلسه ${sessionNumber}`,
        name,
        date,
        assessmentTerm: term,
        level,
        score: scores[level],
        note: level === 'good' ? 'یادگیری و پاسخ‌گویی مطلوب' : level === 'medium' ? 'با تمرین بیشتر تثبیت می‌شود' : 'نیازمند مرور و تمرین هدایت‌شده',
        behaviorType: index % 3 === 0 ? 'negative' as const : 'positive' as const,
        behaviorNote: index % 3 === 0 ? 'برای رعایت نوبت و تمرکز در فعالیت گروهی به یادآوری نیاز دارد.' : 'با نظم و همکاری در فعالیت کلاسی شرکت می‌کند.',
      };
    });
    const term1ConceptEntries = makeConceptEntries('midterm1', 1, '2026-01-15', 0);
    const term2ConceptEntries = makeConceptEntries('midterm2', 2, '2026-10-15', 1);
    const conceptEntries = [...term1ConceptEntries, ...term2ConceptEntries];
    const term1Continuous = round1(term1ConceptEntries.reduce((total, entry) => total + entry.score, 0) / term1ConceptEntries.length);
    const term2Continuous = round1(term2ConceptEntries.reduce((total, entry) => total + entry.score, 0) / term2ConceptEntries.length);
    const indicatorScore = round1(conceptEntries.reduce((total, entry) => total + entry.score, 0) / conceptEntries.length);
    const behaviorType = index % 3 === 0 ? 'negative' : 'positive';
    return {
      id: `demo_grade_${safeToken(student.id)}_${safeToken(assignment.id)}`,
      studentId: student.id,
      classId: student.classId,
      teacherId: assignment.teacherId,
      subject: assignment.subject,
      assessmentDate: '2026-01-15',
      assessmentTerm: 'midterm1',
      indicatorName: 'ارزیابی مفهومی میان‌ترم',
      indicatorScore,
      indicatorLevel: indicatorScore >= 15 ? 'good' : indicatorScore >= 10 ? 'medium' : 'weak',
      behaviorType,
      behaviorNote: behaviorType === 'positive' ? 'با نظم و همکاری در فعالیت کلاسی شرکت می‌کند.' : 'برای رعایت نوبت و تمرکز در فعالیت گروهی به یادآوری نیاز دارد.',
      conceptEntries,
      conceptSummary: {
        good: conceptEntries.filter((entry) => entry.level === 'good').map((entry) => entry.name),
        medium: conceptEntries.filter((entry) => entry.level === 'medium').map((entry) => entry.name),
        weak: conceptEntries.filter((entry) => entry.level === 'weak').map((entry) => entry.name),
      },
      preMidterm: Math.max(0, midterm - 1),
      midterm,
      postMidterm: Math.min(20, midterm + 0.5),
      final,
      continuous,
      continuousTerm1: term1Continuous,
      term1Exam: midterm,
      continuousTerm2: term2Continuous,
      term2Exam: final,
      continuousGradeMode: 'indicator',
      calculatedAverage: Math.round((term1Continuous + midterm * 2 + term2Continuous + final * 4) / 8 * 100) / 100,
      isDemo: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
  });

const createStudentTeacherEvaluations = (student: Student, classAssignments: TeacherAssignment[], index: number): StudentStaffEvaluation[] => {
  const teacherIds = [...new Set(classAssignments.map((assignment) => assignment.teacherId))];
  return teacherIds.map((teacherId) => {
    const scores = {
      lesson_clarity: 3 + (index % 3),
      classroom_management: 3 + ((index + 1) % 3),
      teaching_variety: 3 + ((index + 2) % 3),
      fair_assessment: 4,
      feedback: 3 + (index % 3),
      student_motivation: 3 + ((index + 1) % 3),
    };
    const values = Object.values(scores);
    return {
      id: `demo_student_evaluation_${safeToken(student.id)}_${safeToken(teacherId)}`,
      studentId: student.id,
      targetId: teacherId,
      targetRole: 'teacher',
      scores,
      averageScore: round1(values.reduce((sum, value) => sum + value, 0) / values.length),
      notes: 'بازخورد آزمایشی برای بررسی نمای گزارش؛ نظر واقعی دانش‌آموز نیست.',
      isDemo: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
  });
};

export interface DemoSchoolData {
  newStudents: Student[];
  demoStudents: Student[];
  assignments: TeacherAssignment[];
  psychResults: PsychTestResult[];
  attendance: ReturnType<typeof createDemoAttendanceRecord>[];
  grades: StudentGrade[];
  schoolAttitudeResults: SchoolAttitudeResult[];
  prayerResponses: PrayerSurveyResponse[];
  familyProfiles: FamilyProfile[];
  studentStaffEvaluations: StudentStaffEvaluation[];
  classActivities: ExtracurricularActivity[];
  schoolActivities: SchoolWideActivity[];
  teacherEvaluations: TeacherEvaluation[];
  teacherProfiles: TeacherLearningProfile[];
}

export function buildDemoSchoolData(
  existingStudents: Student[],
  classes: SchoolClass[],
  teachers: Teacher[],
  existingAssignments: TeacherAssignment[],
  initialTeacherProfiles: TeacherLearningProfile[],
  initialTeacherEvaluations: TeacherEvaluation[],
  academicYear = '۱۴۰۴-۱۴۰۵'
): DemoSchoolData {
  const studentsByClass = new Map(classes.map((schoolClass) => [
    schoolClass.id,
    existingStudents.filter((student) => student.classId === schoolClass.id),
  ]));
  const existingIds = new Set(existingStudents.map((student) => student.id));
  const existingCodes = new Set(existingStudents.map((student) => student.studentCode));
  const newStudents: Student[] = [];

  classes.forEach((schoolClass, classIndex) => {
    const currentCount = studentsByClass.get(schoolClass.id)?.length || 0;
    let ordinal = 1;
    while (currentCount + newStudents.filter((student) => student.classId === schoolClass.id).length < DEMO_STUDENTS_PER_CLASS) {
      const candidate = createStudent(schoolClass, classIndex, ordinal);
      ordinal += 1;
      if (existingIds.has(candidate.id) || existingCodes.has(candidate.studentCode)) continue;
      newStudents.push(candidate);
      existingIds.add(candidate.id);
      existingCodes.add(candidate.studentCode);
    }
  });

  const demoInitialIds = new Set(INITIAL_STUDENTS.map((student) => student.id));
  const demoStudents = [...existingStudents, ...newStudents].filter((student) => student.isDemo || demoInitialIds.has(student.id));
  const completedStudents = [...existingStudents, ...newStudents];
  const newAssignments = classes.flatMap((schoolClass, classIndex) => {
    if (existingAssignments.some((assignment) => assignment.classId === schoolClass.id)) return [];
    const teacher = teachers[classIndex % Math.max(teachers.length, 1)];
    if (!teacher) return [];
    return [{
      id: `demo_assignment_${safeToken(schoolClass.id)}_${safeToken(teacher.id)}`,
      teacherId: teacher.id,
      classId: schoolClass.id,
      subject: teacher.specialty || 'درس نمونه',
      isDemo: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    } satisfies TeacherAssignment];
  });
  const assignments = [...existingAssignments, ...newAssignments];
  const demoStudentsWithIndexes = demoStudents.map((student, index) => ({ student, index }));
  const assignmentsByClass = new Map(classes.map((schoolClass) => [
    schoolClass.id,
    assignments.filter((assignment) => assignment.classId === schoolClass.id),
  ]));

  const classActivities = classes.flatMap((schoolClass, classIndex) => persianMonths.map((month, monthIndex) => {
    const artistic = 2 + ((classIndex + monthIndex) % 4);
    const sports = 3 + ((classIndex + monthIndex + 1) % 4);
    const skills = 2 + ((classIndex + 2 * monthIndex) % 4);
    const scientific = 3 + ((classIndex + monthIndex * 2) % 4);
    return {
      id: `demo_extra_${safeToken(schoolClass.id)}_${monthIndex + 1}`,
      classId: schoolClass.id,
      month,
      title: ['کارگاه خلاقیت', 'جشنواره ورزشی', 'باشگاه علوم'][monthIndex],
      category: (['هنری', 'ورزشی', 'علمی'] as const)[monthIndex],
      participants: completedStudents.filter((student) => student.classId === schoolClass.id).length,
      description: 'فعالیت نمونه برای نمایش امکانات سامانه.',
      artistic,
      sports,
      skills,
      scientific,
      monthlyAverage: round1((artistic + sports + skills + scientific) / 4),
      isDemo: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
  }));

  const schoolActivities: SchoolWideActivity[] = [
    { id: 'demo_school_activity_science', title: 'نمایشگاه پژوهش دانش‌آموزی', date: '2026-11-10', month: 'آبان', category: 'علمی', participants: demoStudents.length, description: 'برنامهٔ نمونهٔ مدرسه‌گسترده.', createdBy: 'usr_cultural', createdAt: '2026-01-01T00:00:00.000Z', isDemo: true },
    { id: 'demo_school_activity_art', title: 'جشنوارهٔ هنر و کتاب', date: '2026-12-01', month: 'آذر', category: 'هنری', participants: demoStudents.length, description: 'برنامهٔ نمونهٔ مدرسه‌گسترده.', createdBy: 'usr_cultural', createdAt: '2026-01-01T00:00:00.000Z', isDemo: true },
  ];

  return {
    newStudents,
    demoStudents,
    assignments: newAssignments,
    psychResults: demoStudentsWithIndexes.map(({ student, index }) => createDemoPsychResult(student.id, index)),
    attendance: demoStudentsWithIndexes.map(({ student, index }) => createDemoAttendanceRecord(student.id, student.classId, index)),
    grades: demoStudentsWithIndexes.flatMap(({ student, index }) => createGrades(student, assignmentsByClass.get(student.classId) || [], index)),
    schoolAttitudeResults: demoStudentsWithIndexes.map(({ student, index }) => createSchoolAttitudeResult(student, index)),
    prayerResponses: demoStudentsWithIndexes.map(({ student, index }) => createPrayerResponse(student, index)),
    familyProfiles: demoStudentsWithIndexes.map(({ student, index }) => createFamilyProfile(student, index)),
    studentStaffEvaluations: demoStudentsWithIndexes.flatMap(({ student, index }) => createStudentTeacherEvaluations(student, assignmentsByClass.get(student.classId) || [], index)),
    classActivities,
    schoolActivities,
    teacherEvaluations: initialTeacherEvaluations.filter((evaluation) => teachers.some((teacher) => teacher.id === evaluation.teacherId)),
    teacherProfiles: initialTeacherProfiles.filter((profile) => teachers.some((teacher) => teacher.id === profile.teacherId)),
  };
}
