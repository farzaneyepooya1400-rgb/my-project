import { PsychTestResult, TeacherClassroomApproach, TeacherLearningProfile, VarkScores } from '../types';

export type TeacherAssessmentDimension = keyof VarkScores | keyof TeacherClassroomApproach;

export interface TeacherAssessmentQuestion {
  id: string;
  section: 'teachingSkills' | 'classroomApproach';
  dimension: TeacherAssessmentDimension;
  text: string;
}

export const TEACHER_ASSESSMENT_QUESTIONS: TeacherAssessmentQuestion[] = [
  { id: 'visual_1', section: 'teachingSkills', dimension: 'visual', text: 'می‌توانم مفاهیم را با نمودار، تصویر یا نقشه مفهومی روشن آموزش دهم.' },
  { id: 'visual_2', section: 'teachingSkills', dimension: 'visual', text: 'در طراحی محتوای دیداری و نمایش مرحله‌ای مطالب توانمندم.' },
  { id: 'auditory_1', section: 'teachingSkills', dimension: 'auditory', text: 'با توضیح شفاهی، گفت‌وگوی هدایت‌شده و پرسش‌وپاسخ خوب تدریس می‌کنم.' },
  { id: 'auditory_2', section: 'teachingSkills', dimension: 'auditory', text: 'می‌توانم بحث کلاسی را طوری هدایت کنم که دانش‌آموزان با توضیح دادن یاد بگیرند.' },
  { id: 'readWrite_1', section: 'teachingSkills', dimension: 'readWrite', text: 'در آموزش با متن کوتاه، خلاصه‌نویسی و تمرین نوشتاری توانمندم.' },
  { id: 'readWrite_2', section: 'teachingSkills', dimension: 'readWrite', text: 'می‌توانم برای دانش‌آموزان راهنمای مطالعه و محتوای نوشتاری مرحله‌بندی‌شده فراهم کنم.' },
  { id: 'kinesthetic_1', section: 'teachingSkills', dimension: 'kinesthetic', text: 'می‌توانم مفاهیم را با آزمایش، ساخت مدل یا تمرین کاربردی آموزش دهم.' },
  { id: 'kinesthetic_2', section: 'teachingSkills', dimension: 'kinesthetic', text: 'در طراحی فعالیت‌های عملی و یادگیری مبتنی بر تجربه توانمندم.' },
  { id: 'structured_1', section: 'classroomApproach', dimension: 'structured', text: 'قواعد روشن و روال‌های قابل پیش‌بینی برای مدیریت کلاس ایجاد می‌کنم.' },
  { id: 'structured_2', section: 'classroomApproach', dimension: 'structured', text: 'زمان و جابه‌جایی بین فعالیت‌های کلاس را منظم و روشن مدیریت می‌کنم.' },
  { id: 'collaborative_1', section: 'classroomApproach', dimension: 'collaborative', text: 'در سازمان‌دهی کار گروهی و گفت‌وگوی همسالان توانمندم.' },
  { id: 'collaborative_2', section: 'classroomApproach', dimension: 'collaborative', text: 'می‌توانم نقش‌های گروهی را طوری تعریف کنم که همه دانش‌آموزان مشارکت کنند.' },
  { id: 'individualSupport_1', section: 'classroomApproach', dimension: 'individualSupport', text: 'تفاوت‌های فردی را تشخیص می‌دهم و بازخورد اختصاصی و محترمانه می‌دهم.' },
  { id: 'individualSupport_2', section: 'classroomApproach', dimension: 'individualSupport', text: 'می‌توانم برای دانش‌آموزی که در کلاس کمتر مشارکت می‌کند، حمایت مناسب فراهم کنم.' },
  { id: 'activeLearning_1', section: 'classroomApproach', dimension: 'activeLearning', text: 'با فعالیت‌های کوتاه و متنوع، مشارکت و تمرکز کلاس را حفظ می‌کنم.' },
  { id: 'activeLearning_2', section: 'classroomApproach', dimension: 'activeLearning', text: 'می‌توانم حرکت و فعالیت عملی را بدون برهم خوردن نظم کلاس مدیریت کنم.' },
];

const TEACHING_DIMENSIONS: (keyof VarkScores)[] = ['visual', 'auditory', 'readWrite', 'kinesthetic'];
const MANAGEMENT_DIMENSIONS: (keyof TeacherClassroomApproach)[] = ['structured', 'collaborative', 'individualSupport', 'activeLearning'];

export function calculateTeacherLearningProfile(teacherId: string, answers: Record<string, number>) {
  const teachingSkills: VarkScores = { visual: 0, auditory: 0, readWrite: 0, kinesthetic: 0 };
  const classroomApproach: TeacherClassroomApproach = { structured: 0, collaborative: 0, individualSupport: 0, activeLearning: 0 };

  for (const question of TEACHER_ASSESSMENT_QUESTIONS) {
    const score = answers[question.id];
    if (question.section === 'teachingSkills') {
      teachingSkills[question.dimension as keyof VarkScores] += score;
    } else {
      classroomApproach[question.dimension as keyof TeacherClassroomApproach] += score;
    }
  }

  return { teacherId, teachingSkills, classroomApproach, answers };
}

export interface TeacherStudentMatch {
  score: number;
  teachingFit: number;
  classroomFit: number;
}

const getStudentLearningScores = (result: PsychTestResult): VarkScores => result.varkScores || {
  visual: result.learningStyle === 'دیداری' ? 10 : 2,
  auditory: result.learningStyle === 'شنیداری' ? 10 : 2,
  readWrite: 2,
  kinesthetic: result.learningStyle === 'عملی' ? 10 : 2,
};

export function calculateTeacherStudentMatch(
  studentResult: PsychTestResult,
  teacherProfile: TeacherLearningProfile
): TeacherStudentMatch {
  const studentLearning = getStudentLearningScores(studentResult);
  const studentLearningTotal = TEACHING_DIMENSIONS.reduce((sum, key) => sum + studentLearning[key], 0) || 1;
  const teachingFit = TEACHING_DIMENSIONS.reduce(
    (sum, key) => sum + (studentLearning[key] / studentLearningTotal) * (teacherProfile.teachingSkills[key] / 10),
    0
  ) * 100;

  const interpersonal = studentResult.gardnerScores.interpersonal / 10;
  const intrapersonal = studentResult.gardnerScores.intrapersonal / 10;
  const bodily = studentResult.gardnerScores.bodily / 10;
  const kinesthetic = studentLearning.kinesthetic / 10;
  const needs: TeacherClassroomApproach = {
    structured: Math.min(1, 0.4 + (studentResult.personalityType === 'درون‌گرا' ? 0.25 : 0) + intrapersonal * 0.2),
    collaborative: Math.min(1, 0.4 + (studentResult.personalityType === 'برون‌گرا' ? 0.25 : 0) + interpersonal * 0.2),
    individualSupport: 0.55,
    activeLearning: Math.min(1, 0.3 + kinesthetic * 0.4 + bodily * 0.3),
  };
  const needTotal = MANAGEMENT_DIMENSIONS.reduce((sum, key) => sum + needs[key], 0) || 1;
  const classroomFit = MANAGEMENT_DIMENSIONS.reduce(
    (sum, key) => sum + (needs[key] / needTotal) * (teacherProfile.classroomApproach[key] / 10),
    0
  ) * 100;

  return {
    score: Math.round((teachingFit * 0.72 + classroomFit * 0.28) * 10) / 10,
    teachingFit: Math.round(teachingFit * 10) / 10,
    classroomFit: Math.round(classroomFit * 10) / 10,
  };
}
