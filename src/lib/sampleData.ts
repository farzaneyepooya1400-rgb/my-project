import {
  GradeLevel,
  SchoolClass,
  Student,
  Teacher,
  TeacherAssignment,
  SubjectDifficulty,
  StudentGrade,
  AttendanceRecord,
  PsychTestResult,
  TeacherLearningProfile,
  StudentStaffEvaluation,
  FamilyProfile,
  TeacherEvaluation,
  ExtracurricularActivity,
  AppNotification,
} from '../types';
import { PSYCH_QUESTIONS } from './psychologyData';

export const INITIAL_SUBJECT_DIFFICULTIES: SubjectDifficulty[] = [
  {
    id: 'sd_math',
    subject: 'ریاضی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 1.20,
    rationale: 'مفاهیم انتزاعی، تفکر صوری، استدلال منطقی و حل مسائل چندلایه‌ای و محاسباتی پیچیده.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_science',
    subject: 'علوم تجربی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 1.10,
    rationale: 'تلفیق مباحث فیزیک، شیمی، زیست‌شناسی و زمین‌شناسی همزمان با کار آزمایشگاهی و تحلیل پدیده‌ها.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_english',
    subject: 'زبان انگلیسی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 1.05,
    rationale: 'زبان غیرمادری و سنجش همزمان مهارت‌های چهارگانه (شنیدن، خواندن، نوشتن و دستور زبان).',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_persian',
    subject: 'زبان و ادبیات فارسی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 1.00,
    rationale: 'زبان معیار مادری و پایه سنجش ادبی، آرایه‌ها و درک مطلب استاندارد کشوری.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_social',
    subject: 'مطالعات اجتماعی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.95,
    rationale: 'محتوای توصیفی و مفهومی تاریخ، جغرافیا و مدنی با قابلیت یادگیری روایی و عینی.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_writing',
    subject: 'نگارش فارسی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 1.00,
    rationale: 'تقویت نوشتار، درست‌نویسی، سازمان‌دهی متن و سنجش مهارت تولید زبانی.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_arabic',
    subject: 'زبان عربی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 1.05,
    rationale: 'یادگیری واژگان و ساختارهای صرفی و نحوی زبان دوم با نیاز به تمرین مستمر.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_quran',
    subject: 'آموزش قرآن',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.95,
    rationale: 'ترکیب روخوانی، روان‌خوانی، مفاهیم و انس با آیات متناسب با سن دانش‌آموز.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_religion',
    subject: 'پیام‌های آسمان',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.95,
    rationale: 'محتوای مفهومی و تربیتی با تمرکز بر فهم، تحلیل و کاربرد آموزه‌ها.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_life',
    subject: 'تفکر و سبک زندگی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.90,
    rationale: 'فعالیت‌محور بودن درس و سنجش مهارت‌های تفکر، تصمیم‌گیری و خودشناسی.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_art',
    subject: 'فرهنگ و هنر',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.90,
    rationale: 'ارزیابی فرایند خلاقیت، مهارت عملی و تولید هنری با تفاوت طبیعی توانایی‌ها.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_technology',
    subject: 'کار و فناوری',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.95,
    rationale: 'ترکیب دانش نظری، مهارت عملی، حل مسئله و پروژه‌های فناورانه.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_pe',
    subject: 'تربیت بدنی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.85,
    rationale: 'ارزیابی آمادگی جسمانی، مشارکت، مهارت حرکتی و رعایت اصول سلامت.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sd_defense',
    subject: 'آمادگی دفاعی',
    educationLevel: 'دوره اول متوسطه (پایه‌های هفتم تا نهم)',
    coefficient: 0.95,
    rationale: 'مفاهیم هویتی، اجتماعی و مهارت‌های آمادگی و مسئولیت‌پذیری شهروندی.',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_GRADES: GradeLevel[] = [
  { id: 'grade_1', name: 'پایه اول ابتدایی', order: 1, createdAt: new Date().toISOString() },
  { id: 'grade_2', name: 'پایه دوم ابتدایی', order: 2, createdAt: new Date().toISOString() },
  { id: 'grade_3', name: 'پایه سوم ابتدایی', order: 3, createdAt: new Date().toISOString() },
  { id: 'grade_4', name: 'پایه چهارم ابتدایی', order: 4, createdAt: new Date().toISOString() },
  { id: 'grade_5', name: 'پایه پنجم ابتدایی', order: 5, createdAt: new Date().toISOString() },
  { id: 'grade_6', name: 'پایه ششم ابتدایی', order: 6, createdAt: new Date().toISOString() },
  { id: 'grade_7', name: 'پایه هفتم', order: 7, createdAt: new Date().toISOString() },
  { id: 'grade_8', name: 'پایه هشتم', order: 8, createdAt: new Date().toISOString() },
  { id: 'grade_9', name: 'پایه نهم', order: 9, createdAt: new Date().toISOString() },
  { id: 'grade_10', name: 'پایه دهم', order: 10, createdAt: new Date().toISOString() },
  { id: 'grade_11', name: 'پایه یازدهم', order: 11, createdAt: new Date().toISOString() },
  { id: 'grade_12', name: 'پایه دوازدهم', order: 12, createdAt: new Date().toISOString() },
];

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'class_701', name: 'کلاس ۷۰۱ (شهید چمران)', gradeId: 'grade_7', academicYear: '۱۴۰۴-۱۴۰۵', createdAt: new Date().toISOString() },
  { id: 'class_702', name: 'کلاس ۷۰۲ (شهید باکری)', gradeId: 'grade_7', academicYear: '۱۴۰۴-۱۴۰۵', createdAt: new Date().toISOString() },
  { id: 'class_801', name: 'کلاس ۸۰۱ (شهید همت)', gradeId: 'grade_8', academicYear: '۱۴۰۴-۱۴۰۵', createdAt: new Date().toISOString() },
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'teach_1',
    fullName: 'مهندس علیرضا کمالی',
    specialty: 'ریاضیات',
    degree: 'کارشناسی ارشد آموزش ریاضی',
    experienceYears: 12,
    employmentType: 'official',
    teacherCode: 'T101',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'teach_2',
    fullName: 'دکتر مریم صادقی',
    specialty: 'علوم تجربی',
    degree: 'دکتری زیست‌شناسی سلولی',
    experienceYears: 8,
    employmentType: 'official',
    teacherCode: 'T102',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'teach_3',
    fullName: 'استاد حمیدرضا احمدی',
    specialty: 'زبان انگلیسی',
    degree: 'کارشناسی ارشد آموزش زبان',
    experienceYears: 6,
    employmentType: 'contractual',
    teacherCode: 'T103',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'teach_4',
    fullName: 'سرکار خانم فاطمه حسینی',
    specialty: 'زبان و ادبیات فارسی',
    degree: 'کارشناسی ارشد ادبیات فارسی',
    experienceYears: 14,
    employmentType: 'official',
    teacherCode: 'T104',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'teach_strictness_demo',
    fullName: 'دبیر نمونه ریاضی (کلاس ۷۰۲)',
    specialty: 'ریاضی',
    degree: 'کارشناسی',
    experienceYears: 5,
    employmentType: 'official',
    teacherCode: 'TS702',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ASSIGNMENTS: TeacherAssignment[] = [
  { id: 'asgn_1', teacherId: 'teach_1', classId: 'class_701', subject: 'ریاضی', createdAt: new Date().toISOString() },
  { id: 'asgn_2', teacherId: 'teach_1', classId: 'class_702', subject: 'ریاضی', createdAt: new Date().toISOString() },
  { id: 'asgn_3', teacherId: 'teach_2', classId: 'class_701', subject: 'علوم تجربی', createdAt: new Date().toISOString() },
  { id: 'asgn_4', teacherId: 'teach_3', classId: 'class_701', subject: 'زبان انگلیسی', createdAt: new Date().toISOString() },
  { id: 'asgn_5', teacherId: 'teach_4', classId: 'class_701', subject: 'زبان و ادبیات فارسی', createdAt: new Date().toISOString() },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stud_1',
    firstName: 'سهراب',
    lastName: 'سپهری‌راد',
    nationalId: '0010328411', // valid iranian national code
    studentCode: 'S701-01',
    classId: 'class_701',
    gradeId: 'grade_7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stud_2',
    firstName: 'علی',
    lastName: 'رضایی',
    nationalId: '0021439522', // valid
    studentCode: 'S701-02',
    classId: 'class_701',
    gradeId: 'grade_7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stud_3',
    firstName: 'پارسا',
    lastName: 'شایان',
    nationalId: '0032540633', // valid
    studentCode: 'S701-03',
    classId: 'class_701',
    gradeId: 'grade_7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stud_4',
    firstName: 'امیرحسین',
    lastName: 'مرادی',
    nationalId: '0043651744', // valid
    studentCode: 'S701-04',
    classId: 'class_701',
    gradeId: 'grade_7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stud_5',
    firstName: 'محمد',
    lastName: 'طاهری',
    nationalId: '0054762855', // valid
    studentCode: 'S702-01',
    classId: 'class_702',
    gradeId: 'grade_7',
    createdAt: new Date().toISOString(),
  },
];

const makeStrictnessSampleGrade = (
  studentId: string,
  classId: string,
  teacherId: string,
  subject: string,
  subjectKey: string,
  score: number,
): StudentGrade => ({
  id: `grd_strictness_sample_${studentId}_${subjectKey}`,
  studentId,
  classId,
  teacherId,
  subject,
  preMidterm: score,
  midterm: score,
  postMidterm: score,
  final: score,
  continuous: score,
  continuousTerm1: score,
  term1Exam: score,
  continuousTerm2: score,
  term2Exam: score,
  continuousGradeMode: 'manual',
  calculatedAverage: score,
  updatedAt: new Date().toISOString(),
});

export const TEACHER_STRICTNESS_SAMPLE_GRADES: StudentGrade[] = [
  makeStrictnessSampleGrade('stud_1', 'class_701', 'teach_2', 'علوم تجربی', 'science', 17),
  makeStrictnessSampleGrade('stud_1', 'class_701', 'teach_3', 'زبان انگلیسی', 'english', 18),
  makeStrictnessSampleGrade('stud_1', 'class_701', 'teach_4', 'زبان و ادبیات فارسی', 'persian', 17.5),
  makeStrictnessSampleGrade('stud_2', 'class_701', 'teach_2', 'علوم تجربی', 'science', 16.2),
  makeStrictnessSampleGrade('stud_2', 'class_701', 'teach_3', 'زبان انگلیسی', 'english', 15.5),
  makeStrictnessSampleGrade('stud_2', 'class_701', 'teach_4', 'زبان و ادبیات فارسی', 'persian', 15),
  makeStrictnessSampleGrade('stud_3', 'class_701', 'teach_2', 'علوم تجربی', 'science', 18),
  makeStrictnessSampleGrade('stud_3', 'class_701', 'teach_3', 'زبان انگلیسی', 'english', 17.5),
  makeStrictnessSampleGrade('stud_3', 'class_701', 'teach_4', 'زبان و ادبیات فارسی', 'persian', 18),
  makeStrictnessSampleGrade('stud_4', 'class_701', 'teach_2', 'علوم تجربی', 'science', 14.5),
  makeStrictnessSampleGrade('stud_4', 'class_701', 'teach_3', 'زبان انگلیسی', 'english', 13),
  makeStrictnessSampleGrade('stud_4', 'class_701', 'teach_4', 'زبان و ادبیات فارسی', 'persian', 14.2),
  makeStrictnessSampleGrade('stud_5', 'class_702', 'teach_strictness_demo', 'ریاضی', 'math_702', 20),
  makeStrictnessSampleGrade('stud_5', 'class_702', 'teach_2', 'علوم تجربی', 'science_702', 10),
  makeStrictnessSampleGrade('stud_5', 'class_702', 'teach_3', 'زبان انگلیسی', 'english_702', 10),
  makeStrictnessSampleGrade('stud_5', 'class_702', 'teach_4', 'زبان و ادبیات فارسی', 'persian_702', 10),
];

export const INITIAL_GRADES_SHEET: StudentGrade[] = [
  {
    id: 'grd_1',
    studentId: 'stud_1',
    classId: 'class_701',
    teacherId: 'teach_1',
    subject: 'ریاضی',
    preMidterm: 17,
    midterm: 18,
    postMidterm: 16.5,
    final: 18.5,
    continuous: 19,
    continuousTerm1: 19,
    term1Exam: 18,
    continuousTerm2: 19,
    term2Exam: 18.5,
    continuousGradeMode: 'manual',
    calculatedAverage: Math.round((19 + 18 * 2 + 19 + 18.5 * 4) / 8 * 100) / 100,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'grd_2',
    studentId: 'stud_2',
    classId: 'class_701',
    teacherId: 'teach_1',
    subject: 'ریاضی',
    preMidterm: 14,
    midterm: 15,
    postMidterm: 15,
    final: 16,
    continuous: 16.5,
    continuousTerm1: 16.5,
    term1Exam: 15,
    continuousTerm2: 16.5,
    term2Exam: 16,
    continuousGradeMode: 'manual',
    calculatedAverage: Math.round((16.5 + 15 * 2 + 16.5 + 16 * 4) / 8 * 100) / 100,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'grd_3',
    studentId: 'stud_3',
    classId: 'class_701',
    teacherId: 'teach_1',
    subject: 'ریاضی',
    preMidterm: 18,
    midterm: 19,
    postMidterm: 19,
    final: 19.5,
    continuous: 20,
    continuousTerm1: 20,
    term1Exam: 19,
    continuousTerm2: 20,
    term2Exam: 19.5,
    continuousGradeMode: 'manual',
    calculatedAverage: Math.round((20 + 19 * 2 + 20 + 19.5 * 4) / 8 * 100) / 100,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'grd_4',
    studentId: 'stud_4',
    classId: 'class_701',
    teacherId: 'teach_1',
    subject: 'ریاضی',
    preMidterm: 11,
    midterm: 12.5,
    postMidterm: 13,
    final: 14,
    continuous: 15,
    continuousTerm1: 15,
    term1Exam: 12.5,
    continuousTerm2: 15,
    term2Exam: 14,
    continuousGradeMode: 'manual',
    calculatedAverage: Math.round((15 + 12.5 * 2 + 15 + 14 * 4) / 8 * 100) / 100,
    updatedAt: new Date().toISOString(),
  },
  ...TEACHER_STRICTNESS_SAMPLE_GRADES,
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_1',
    studentId: 'stud_1',
    classId: 'class_701',
    month: 'آبان',
    absences: 1,
    tardies: 0,
    homeworkPercent: 95,
    homeworkQuality: 5,
    participation: 5,
    behavior: 5,
    responsibility: 5,
    teamwork: 4,
    rulesObservance: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'att_2',
    studentId: 'stud_2',
    classId: 'class_701',
    month: 'آبان',
    absences: 2,
    tardies: 1,
    homeworkPercent: 85,
    homeworkQuality: 4,
    participation: 4,
    behavior: 4,
    responsibility: 4,
    teamwork: 4,
    rulesObservance: 4,
    updatedAt: new Date().toISOString(),
  },
];

export function createDemoAttendanceRecord(studentId: string, classId: string, index = 0): AttendanceRecord {
  const profiles = [
    { absences: 1, tardies: 0, homeworkPercent: 92, homeworkQuality: 4, participation: 4, behavior: 4, responsibility: 5, teamwork: 4, rulesObservance: 5 },
    { absences: 3, tardies: 2, homeworkPercent: 65, homeworkQuality: 2, participation: 2, behavior: 3, responsibility: 3, teamwork: 2, rulesObservance: 4 },
  ];
  const safeStudentId = studentId.replace(/[^A-Za-z0-9_-]/g, '_');
  return {
    id: `att_demo_${safeStudentId}_aban`,
    studentId,
    classId,
    month: 'آبان',
    ...profiles[index % profiles.length],
    isDemo: true,
    updatedAt: new Date().toISOString(),
  };
}

const SAMPLE_PSYCH_ARCHETYPES: Omit<PsychTestResult, 'id' | 'studentId' | 'completedAt'>[] = [
  {
    gardnerScores: { verbal: 8, logical: 9, spatial: 9, musical: 5, bodily: 6, intrapersonal: 7, interpersonal: 8, naturalist: 6 },
    hollandScores: { R: 6, I: 10, A: 8, S: 7, E: 7, C: 5 },
    hollandCode: 'IAS', learningStyle: 'دیداری', personalityType: 'درون‌گرا',
    varkScores: { visual: 10, auditory: 6, readWrite: 8, kinesthetic: 4 }, answers: {}, isDemo: true,
  },
  {
    gardnerScores: { verbal: 7, logical: 6, spatial: 5, musical: 6, bodily: 7, intrapersonal: 5, interpersonal: 9, naturalist: 6 },
    hollandScores: { R: 5, I: 6, A: 7, S: 9, E: 8, C: 7 },
    hollandCode: 'SEC', learningStyle: 'شنیداری', personalityType: 'برون‌گرا',
    varkScores: { visual: 4, auditory: 10, readWrite: 6, kinesthetic: 8 }, answers: {}, isDemo: true,
  },
  {
    gardnerScores: { verbal: 9, logical: 8, spatial: 6, musical: 5, bodily: 4, intrapersonal: 9, interpersonal: 5, naturalist: 7 },
    hollandScores: { R: 7, I: 9, A: 5, S: 5, E: 6, C: 8 },
    hollandCode: 'ICR', learningStyle: 'دیداری', personalityType: 'درون‌گرا',
    varkScores: { visual: 5, auditory: 4, readWrite: 10, kinesthetic: 5 }, answers: {}, isDemo: true,
  },
  {
    gardnerScores: { verbal: 6, logical: 6, spatial: 8, musical: 7, bodily: 10, intrapersonal: 6, interpersonal: 8, naturalist: 9 },
    hollandScores: { R: 9, I: 6, A: 7, S: 8, E: 7, C: 5 },
    hollandCode: 'RSE', learningStyle: 'عملی', personalityType: 'برون‌گرا',
    varkScores: { visual: 6, auditory: 5, readWrite: 4, kinesthetic: 10 }, answers: {}, isDemo: true,
  },
  {
    gardnerScores: { verbal: 8, logical: 7, spatial: 8, musical: 9, bodily: 6, intrapersonal: 8, interpersonal: 7, naturalist: 8 },
    hollandScores: { R: 6, I: 8, A: 9, S: 7, E: 6, C: 7 },
    hollandCode: 'AIC', learningStyle: 'دیداری', personalityType: 'درون‌گرا',
    varkScores: { visual: 9, auditory: 8, readWrite: 8, kinesthetic: 6 }, answers: {}, isDemo: true,
  },
];

export function createDemoPsychResult(studentId: string, index = 0): PsychTestResult {
  const safeStudentId = studentId.replace(/[^A-Za-z0-9_-]/g, '_').replace(/_/g, '');
  const archetype = SAMPLE_PSYCH_ARCHETYPES[index % SAMPLE_PSYCH_ARCHETYPES.length];
  const answers: Record<string, number> = {};
  const groupedQuestions = new Map<string, typeof PSYCH_QUESTIONS>();
  for (const question of PSYCH_QUESTIONS) {
    if (!['gardner', 'holland', 'vark'].includes(question.category)) continue;
    const groupId = `${question.category}_${question.subCategory}`;
    groupedQuestions.set(groupId, [...(groupedQuestions.get(groupId) || []), question]);
  }
  for (const [groupId, questions] of groupedQuestions) {
    const [category, subCategory] = groupId.split('_', 2);
    const score = category === 'gardner'
      ? archetype.gardnerScores[subCategory as keyof PsychTestResult['gardnerScores']]
      : category === 'holland'
        ? archetype.hollandScores[subCategory as keyof PsychTestResult['hollandScores']]
        : archetype.varkScores?.[subCategory as keyof NonNullable<PsychTestResult['varkScores']>] || 5;
    const firstAnswer = Math.max(1, Math.min(5, Math.ceil(score / 2)));
    questions.forEach((question, questionIndex) => {
      answers[question.id] = questionIndex === 0 ? firstAnswer : Math.max(1, Math.min(5, score - firstAnswer));
    });
  }
  answers.ls_vis_1 = Math.max(1, Math.min(5, Math.round((archetype.varkScores?.visual || 5) / 2)));
  answers.ls_aud_1 = Math.max(1, Math.min(5, Math.round((archetype.varkScores?.auditory || 5) / 2)));
  answers.ls_kin_1 = Math.max(1, Math.min(5, Math.round((archetype.varkScores?.kinesthetic || 5) / 2)));
  answers.p_ext_1 = archetype.personalityType === 'برون‌گرا' ? 5 : 2;
  answers.p_int_1 = archetype.personalityType === 'درون‌گرا' ? 5 : 2;
  return {
    ...archetype,
    id: `psych_${safeStudentId}`,
    studentId,
    answers,
    completedAt: new Date().toISOString(),
  };
}

export const INITIAL_PSYCH_RESULTS: PsychTestResult[] = INITIAL_STUDENTS.map((student, index) =>
  createDemoPsychResult(student.id, index)
);

const splitDemoScore = (score: number): [number, number] => {
  const first = Math.ceil(score / 2);
  return [first, score - first];
};

const createDemoTeacherProfile = (
  teacherId: string,
  teachingSkills: TeacherLearningProfile['teachingSkills'],
  classroomApproach: TeacherLearningProfile['classroomApproach']
): TeacherLearningProfile => {
  const answers: Record<string, number> = {};
  for (const [dimension, score] of Object.entries({ ...teachingSkills, ...classroomApproach })) {
    const [first, second] = splitDemoScore(score);
    answers[`${dimension}_1`] = first;
    answers[`${dimension}_2`] = second;
  }
  return {
    id: `teacher_learning_${teacherId}`,
    teacherId,
    teachingSkills,
    classroomApproach,
    answers,
    isDemo: true,
    updatedAt: new Date().toISOString(),
  };
};

export const INITIAL_TEACHER_LEARNING_PROFILES: TeacherLearningProfile[] = [
  createDemoTeacherProfile('teach_1', { visual: 9, auditory: 8, readWrite: 7, kinesthetic: 6 }, { structured: 9, collaborative: 7, individualSupport: 8, activeLearning: 7 }),
  createDemoTeacherProfile('teach_2', { visual: 8, auditory: 7, readWrite: 6, kinesthetic: 10 }, { structured: 8, collaborative: 8, individualSupport: 8, activeLearning: 10 }),
  createDemoTeacherProfile('teach_3', { visual: 6, auditory: 10, readWrite: 8, kinesthetic: 7 }, { structured: 7, collaborative: 10, individualSupport: 8, activeLearning: 9 }),
  createDemoTeacherProfile('teach_4', { visual: 8, auditory: 8, readWrite: 10, kinesthetic: 5 }, { structured: 10, collaborative: 7, individualSupport: 10, activeLearning: 6 }),
];

export const INITIAL_FAMILY_PROFILE: FamilyProfile = {
  id: 'fam_stud1',
  studentId: 'stud_1',
  fatherEducation: 'کارشناسی ارشد مهندسی برق',
  fatherJob: 'مهندس مشاور پروژه‌های نیروگاهی',
  motherEducation: 'کارشناسی مدیریت بازرگانی',
  motherJob: 'کارمند بانک',
  childrenCount: 2,
  maritalStatus: 'همراه',
  heightCm: 162,
  weightKg: 52,
  calculatedBmi: 19.8,
  sleepHour: '۲۲:۳۰',
  screenTimeHours: 1.5,
  breakfastStatus: 'همیشه',
  hasVisionHearingIssue: false,
  sensoryIssueDetails: '',
  distanceToSchoolKm: 3.5,
  commuteMethod: 'سرویس',
  homeResponsibilityScore: 4,
  updatedAt: new Date().toISOString(),
};

export const INITIAL_EVALUATIONS: TeacherEvaluation[] = [
  {
    id: 'eval_adm_t1',
    teacherId: 'teach_1',
    evaluatorRole: 'admin',
    evaluatorId: 'usr_admin',
    evaluatorName: 'دکتر صادقیان (مدیر)',
    scores: {
      time_management: 5,
      student_engagement: 4,
      formative_feedback: 5,
      positive_atmosphere: 5,
      instructional_design: 4,
      teaching_variety: 4,
    },
    averageScore: 4.5,
    notes: 'تسلط عالی بر مفاهیم ریاضی و ارائه منسجم تکالیف.',
    isDemo: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eval_vp_t1',
    teacherId: 'teach_1',
    evaluatorRole: 'academic_vp',
    evaluatorId: 'usr_academic',
    evaluatorName: 'مهندس افشار (معاون آموزشی)',
    scores: {
      pacing: 5,
      exam_quality: 5,
      homework_followup: 4,
      department_coordination: 5,
      evaluation_analysis: 4,
    },
    averageScore: 4.6,
    notes: 'بودجه‌بندی دقیق و آزمون‌های استاندارد.',
    isDemo: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eval_prnt_t1',
    teacherId: 'teach_1',
    evaluatorRole: 'parent',
    evaluatorId: 'usr_parent1',
    evaluatorName: 'مهندس سپهری‌راد (اولیا)',
    scores: {
      parent_interaction: 5,
      motivation: 4,
      homework_balance: 4,
      fairness: 5,
      timely_feedback: 4,
    },
    averageScore: 4.4,
    notes: 'پاسخگویی بسیار محترمانه و افزایش انگیزه فرزندم در ریاضی.',
    isDemo: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'eval_cultural_t1',
    teacherId: 'teach_1',
    evaluatorRole: 'cultural_vp',
    evaluatorId: 'usr_cultural',
    evaluatorName: 'معاون پرورشی نمونه',
    scores: { ethical_atmosphere: 4, cultural_engagement: 5, role_modeling: 5, pastoral_care: 4, national_religious_events: 4 },
    averageScore: 4.4,
    notes: 'ارتباط سازنده و مشارکت مناسب دانش‌آموزان در فعالیت‌های گروهی.',
    isDemo: true,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_STUDENT_STAFF_EVALUATIONS: StudentStaffEvaluation[] = [
  {
    id: 'student_eval_demo_stud1_teacher1',
    studentId: 'stud_1',
    targetId: 'teach_1',
    targetRole: 'teacher',
    scores: { lesson_clarity: 5, classroom_management: 4, teaching_variety: 5, fair_assessment: 5, feedback: 4, student_motivation: 5 },
    averageScore: 4.67,
    notes: 'توضیح‌ها روشن است و مثال‌های متنوع به یادگیری کمک می‌کند.',
    isDemo: true,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_EXTRACURRICULARS: ExtracurricularActivity[] = [
  {
    id: 'extra_701_aban',
    classId: 'class_701',
    month: 'آبان',
    artistic: 4,
    sports: 6,
    skills: 3,
    scientific: 5,
    monthlyAverage: 4.5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'extra_702_aban',
    classId: 'class_702',
    month: 'آبان',
    artistic: 3,
    sports: 5,
    skills: 4,
    scientific: 3,
    monthlyAverage: 3.75,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_meeting_1',
    title: 'یادآور جلسه عمومی مجمع اولیا و مربیان',
    message: 'جلسه هم‌اندیشی اولیای گرامی پیرامون ارزیابی میان‌ترم روز چهارشنبه ساعت ۱۵:۳۰ در سالن اجتماعات برگزار می‌گردد.',
    type: 'meeting',
    senderRole: 'admin',
    senderName: 'دفتر مدیریت مجتمع',
    targetRole: 'all',
    readBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif_grade_1',
    title: 'ثبت نمره جدید در درس ریاضی',
    message: 'دبیر محترم ریاضی نمرات پایان‌ترم و مستمر کلاس ۷۰۱ را در سامانه ثبت نمود. میانگین زنده محاسبه گردید.',
    type: 'grade',
    senderRole: 'teacher',
    senderName: 'مهندس کمالی (دبیر ریاضی)',
    targetRole: 'all',
    targetClassId: 'class_701',
    readBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'notif_vp_1',
    title: 'پیام معاونت پرورشی: فراخوان مسابقات فرهنگی و قرآنی',
    message: 'دانش‌آموزان علاقه‌مند به شرکت در مسابقات سرود، کتابخوانی، نهج‌البلاغه و طراحی پوستر تا پایان هفته به دفتر پرورشی مراجعه نمایند.',
    type: 'vp_message',
    senderRole: 'cultural_vp',
    senderName: 'حجت‌الاسلام حسینی (معاون پرورشی)',
    targetRole: 'all',
    readBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'notif_academic_1',
    title: 'اطلاعیه معاونت آموزشی پیرامون بودجه‌بندی آزمون‌ها',
    message: 'برنامه بودجه‌بندی دروس پایه هفتم و هشتم برای آزمون‌های پیش‌رو در پنل قرار گرفت. لطفاً دبیران و اولیا بررسی فرمایند.',
    type: 'vp_message',
    senderRole: 'academic_vp',
    senderName: 'مهندس افشار (معاون آموزشی)',
    targetRole: 'all',
    readBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

