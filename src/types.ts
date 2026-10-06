export type UserRole =
  | 'sub_admin'      // ساب‌ادمین / ناظر عالی
  | 'admin'          // مدیر مدرسه
  | 'executive_vp'   // معاون اجرایی
  | 'academic_vp'    // معاون آموزشی
  | 'cultural_vp'    // معاون پرورشی
  | 'teacher'        // معلم
  | 'student'        // دانش‌آموز
  | 'parent';        // والدین

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  schoolId?: string | number | null;
  email?: string;
  phone?: string;
  linkedId?: string; // studentCode / nationalId for student/parent, teacherCode for teacher
  schoolName?: string; // نام مدرسه برای مدیران
  schoolCode?: string; // کد مدرسه
  isDemo?: boolean;
  createdAt: string;
}

export interface GradeLevel {
  id: string;
  name: string;      // e.g. پایه هفتم, پایه هشتم
  order: number;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;      // e.g. کلاس ۷۰۱, کلاس ۷۰۲
  gradeId: string;
  academicYear: string;
  createdAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string; // 10-digit Iranian national ID with checksum
  studentCode: string; // کد دانش‌آموزی
  classId: string;
  gradeId: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  specialty: string;        // تخصص (ریاضی، فیزیک، علوم...)
  degree: string;           // مدرک تحصیلی (کارشناسی، ارشد، دکتری)
  experienceYears: number;  // سابقه خدمت
  employmentType: 'official' | 'contractual' | 'hourly' | 'corporate'; // رسمی، پیمانی، حق‌التدریس، شرکتی
  teacherCode: string;      // کد پرسنلی / شماره دبیر
  createdAt: string;
}

export interface TeacherClassroomApproach {
  structured: number;
  collaborative: number;
  individualSupport: number;
  activeLearning: number;
}

export interface TeacherLearningProfile {
  id: string;
  teacherId: string;
  teachingSkills: VarkScores;
  classroomApproach: TeacherClassroomApproach;
  answers: Record<string, number>;
  isDemo?: boolean;
  updatedAt: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subject: string;          // نام درس (ریاضی، علوم، فارسی...)
  isDemo?: boolean;
  createdAt: string;
}

export type AssessmentLevel = 'good' | 'medium' | 'weak';
export type ContinuousGradeMode = 'manual' | 'indicator';

export interface AssessmentConceptEntry {
  id: string;
  sessionId?: string;
  sessionNumber?: number;
  sessionLabel?: string;
  name: string;
  date: string;
  assessmentTerm?: 'midterm1' | 'midterm2';
  level?: AssessmentLevel | null;
  score?: number | null;
  note?: string;
  behaviorType?: 'positive' | 'negative' | null;
  behaviorNote?: string | null;
}

export interface StudentGrade {
  id: string;
  studentId: string;
  classId: string;
  teacherId: string;
  subject: string;
  preMidterm?: number;     // آزمون قبل میان‌ترم (0-20)
  midterm?: number;        // نمره میان‌ترم (0-20)
  postMidterm?: number;    // آزمون بعد میان‌ترم (0-20)
  final?: number;          // نمره پایان‌ترم (0-20)
  continuous?: number;     // نمره مستمر (0-20)
  continuousTerm1?: number | null;
  term1Exam?: number | null;
  continuousTerm2?: number | null;
  term2Exam?: number | null;
  continuousTerm1Mode?: ContinuousGradeMode;
  continuousTerm2Mode?: ContinuousGradeMode;
  continuousGradeMode?: ContinuousGradeMode;
  calculatedAverage?: number | null;
  assessmentDate?: string;
  assessmentTerm?: 'midterm1' | 'midterm2';
  indicatorName?: string;
  indicatorLevel?: AssessmentLevel;
  indicatorScore?: number | null;
  behaviorType?: 'positive' | 'negative' | null;
  behaviorNote?: string | null;
  conceptEntries?: AssessmentConceptEntry[];
  conceptSummary?: {
    good: string[];
    medium: string[];
    weak: string[];
  };
  isDemo?: boolean;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date?: string;
  teacherId?: string;
  subject?: string;
  status?: 'present' | 'absent' | 'late';
  homeworkStatus?: 'done' | 'partial' | 'missing';
  disciplineStatus?: 'positive' | 'neutral' | 'needs_attention';
  disciplineNote?: string;
  month: string;           // مهر، آبان، آذر...
  absences: number;        // غیبت
  tardies: number;         // تأخیر
  homeworkPercent: number; // درصد انجام تکالیف (0-100)
  homeworkQuality: number; // کیفیت تکالیف (1-5)
  participation: number;   // مشارکت کلاسی (1-5)
  behavior: number;        // رفتار کلاسی (1-5)
  responsibility: number;  // مسئولیت‌پذیری (1-5)
  teamwork: number;        // همکاری گروهی (1-5)
  rulesObservance: number; // رعایت قوانین (1-5)
  isDemo?: boolean;
  updatedAt: string;
}

export interface GardnerScores {
  verbal: number;          // کلامی
  logical: number;         // منطقی-ریاضی
  spatial: number;         // فضایی
  musical: number;         // موسیقایی
  bodily: number;          // بدنی-جنبشی
  intrapersonal: number;   // درون‌فردی
  interpersonal: number;   // میان‌فردی
  naturalist: number;      // طبیعت‌گرا
}

export interface HollandScores {
  R: number; // واقع‌گرا (Realistic)
  I: number; // پژوهشی (Investigative)
  A: number; // هنری (Artistic)
  S: number; // اجتماعی (Social)
  E: number; // متهور / کارآفرین (Enterprising)
  C: number; // قراردادی / قاعده‌مند (Conventional)
}

export interface VarkScores {
  visual: number;
  auditory: number;
  readWrite: number;
  kinesthetic: number;
}

export interface PsychTestResult {
  id: string;
  studentId: string;
  gardnerScores: GardnerScores;
  hollandScores: HollandScores;
  varkScores?: VarkScores;
  hollandCode: string;          // e.g. "IAS", "SEC"
  learningStyle: 'دیداری' | 'شنیداری' | 'عملی';
  personalityType: 'برون‌گرا' | 'درون‌گرا';
  answers: Record<string, number>;
  isDemo?: boolean;
  completedAt: string;
}

export type SchoolAttitudeDomain =
  | 'academicSelfPerception'
  | 'attitudesTowardTeachers'
  | 'attitudesTowardSchool'
  | 'goalValuation'
  | 'motivationSelfRegulation';

export interface SchoolAttitudeResult {
  id: string;
  studentId: string;
  answers: Record<string, number>;
  domainScores: Record<SchoolAttitudeDomain, number>;
  overallScore: number;
  isDemo?: boolean;
  completedAt: string;
}

export type SchoolPaymentMethod = 'cash' | 'card_reader' | 'transfer' | 'check';

export interface SchoolTuitionPayment {
  id: string;
  studentId?: string;
  payerName?: string;
  amountToman: number;
  month: string;
  schoolYear: string;
  category: string;
  paymentMethod: SchoolPaymentMethod;
  paidAt: string;
  receiptCode?: string;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface SchoolExpense {
  id: string;
  title: string;
  category: string;
  amountToman: number;
  month: string;
  schoolYear: string;
  paymentMethod: SchoolPaymentMethod;
  paidAt: string;
  receiptCode?: string;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface FamilyProfile {
  id: string;
  studentId: string;
  fatherEducation: string;
  fatherJob: string;
  motherEducation: string;
  motherJob: string;
  childrenCount: number;
  maritalStatus: 'همراه' | 'متارکه' | 'فوت سرپرست' | 'سایر';
  heightCm: number;
  weightKg: number;
  calculatedBmi: number;
  sleepHour: string;
  screenTimeHours: number;
  breakfastStatus: 'همیشه' | 'گاهی' | 'به‌ندرت';
  hasVisionHearingIssue: boolean;
  sensoryIssueDetails?: string;
  distanceToSchoolKm: number;
  commuteMethod: 'سرویس' | 'پیاده' | 'خودرو شخصی' | 'حمل‌ونقل عمومی';
  homeResponsibilityScore: number; // 1-5
  isDemo?: boolean;
  updatedAt: string;
}

export interface TeacherEvaluation {
  id: string;
  teacherId: string;
  evaluatorRole: 'admin' | 'academic_vp' | 'cultural_vp' | 'parent';
  evaluatorId: string;
  evaluatorName?: string;
  scores: Record<string, number>; // criterion -> score 1-5
  averageScore: number;
  notes?: string;
  isDemo?: boolean;
  updatedAt: string;
}

export interface StudentStaffEvaluation {
  id: string;
  studentId: string;
  targetId: string;
  targetRole: 'teacher' | 'admin' | 'academic_vp' | 'cultural_vp';
  scores: Record<string, number>;
  averageScore: number;
  notes?: string;
  isDemo?: boolean;
  updatedAt: string;
}

export interface SubjectDifficulty {
  id: string;
  subject: string;
  gradeId?: string;
  track?: string;
  educationLevel?: string;
  category?: 'عمومی' | 'تخصصی' | 'شایستگی پایه' | 'شایستگی فنی' | 'شایستگی غیرفنی' | 'مهارتی';
  isCustom?: boolean;
  coefficient: number;     // e.g. 1.20, 1.10, 1.05, 1.00, 0.95
  rationale: string;       // مبنای تعیین ضریب
  updatedAt: string;
}

export interface ExtracurricularActivity {
  id: string;
  classId: string;
  month: string;
  title?: string;
  date?: string;
  category?: 'هنری' | 'ورزشی' | 'مهارتی' | 'علمی' | 'مذهبی' | 'ملی';
  participants?: number;
  description?: string;
  artistic: number;        // هنری
  sports: number;          // ورزشی
  skills: number;          // مهارتی
  scientific: number;      // علمی
  monthlyAverage: number;  // معدل فوق‌برنامه
  isDemo?: boolean;
  updatedAt: string;
}

export interface SchoolCalendarEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  kind: 'school';
  createdBy: string;
  createdAt: string;
}

export interface SchoolWideActivity {
  id: string;
  title: string;
  date: string;
  month: string;
  category: 'هنری' | 'ورزشی' | 'مهارتی' | 'علمی' | 'مذهبی' | 'ملی';
  participants: number;
  description?: string;
  createdBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface PrayerSurveyResponse {
  id: string;
  studentId: string;
  classId: string;
  answers: Record<string, number>;
  submittedAt: string;
  isDemo?: boolean;
}

export type NotificationType =
  | 'grade'           // ثبت نمره جدید
  | 'meeting'         // یادآور جلسات اولیا و مربیان یا شورا
  | 'vp_message'      // پیام‌های معاونین آموزشی و پرورشی
  | 'attendance'      // غیبت، تأخیر یا انضباطی
  | 'general';        // اعلانات عمومی مدرسه

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  senderRole?: UserRole;
  senderName?: string;
  targetRole?: UserRole | 'all'; // چه نقشی این اعلان را دریافت کند
  targetStudentId?: string;      // اگر مختص دانش‌آموز یا اولیای خاصی باشد
  targetClassId?: string;        // اگر مختص یک کلاس خاص باشد
  readBy: string[];              // آرایه آیدی کاربرانی که اعلان را خوانده‌اند
  createdAt: string;
}

