import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Award,
  Star,
  Users,
  Save,
  Check,
  Info,
  ChevronLeft,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { StudentGrade, AttendanceRecord, PsychTestResult, AssessmentLevel } from '../../types';
import {
  toPersianDigits,
  toEnglishDigits,
  PERSIAN_MONTHS,
  PERSIAN_CALENDAR_MONTHS,
  PersianDateParts,
  formatPersianDateParts,
  getGregorianDateFromPersian,
  getPersianDateParts,
  getPersianMonthLength,
  updatePersianDate,
} from '../../lib/persianUtils';
import { getPedagogicalRecommendations, getStudentPerformanceRecommendations, HOLLAND_TITLES } from '../../lib/psychologyData';
import { buildConceptSummary, calculateAnnualGrade, getAverageIndicatorScore, getIndicatorContinuousAverages, getIndicatorLevelFromAverage, getLevelScore, inferAssessmentTermFromDate, LEVEL_LABELS } from '../../lib/assessment';
import { TalentOverview } from '../TalentOverview';
import { TeacherLearningPanel } from './TeacherLearningPanel';

export const TeacherPanel: React.FC = () => {
  const {
    currentUser,
    teachers,
    assignments,
    classes,
    students,
    gradesSheet,
    attendanceRecords,
    psychResults,
    evaluations,
    studentStaffEvaluations,
    subjectDifficulties,
    saveStudentGrade,
    saveAttendance,
    calculateTeacherWeightedScore,
  } = useSchool();

  // Find linked teacher profile
  const teacherProfile = teachers.find(
    (t) => t.teacherCode === currentUser?.linkedId || t.fullName === currentUser?.fullName
  ) || teachers[0]; // fallback to first teacher if testing

  // Filter only assignments for this teacher
  const myAssignments = assignments.filter((a) => a.teacherId === teacherProfile?.id);

  // Selected assignment
  const [selectedAsgnId, setSelectedAsgnId] = useState<string>(
    myAssignments[0]?.id || assignments[0]?.id || ''
  );

  const activeAssignment = assignments.find((a) => a.id === selectedAsgnId);
  const activeClass = classes.find((c) => c.id === activeAssignment?.classId);
  const activeStudents = students.filter((s) => s.classId === activeClass?.id);

  // Tabs: 1. نمرات و کارنامه 2. ثبت شاخص محور 3. حضور و تکالیف ماهانه 4. توصیه‌های روانشناختی دانش‌آموزان 5. کارنامه عملکرد و ارزیابی من
  const [activeTab, setActiveTab] = useState<'grades' | 'indicatorAssessment' | 'attendance' | 'recommendations' | 'performance' | 'talents' | 'matching'>('grades');

  // Indicator assessment state
  const [indicatorDateParts, setIndicatorDateParts] = useState<PersianDateParts>(() => getPersianDateParts());
  const indicatorDate = getGregorianDateFromPersian(indicatorDateParts);
  const [assessmentTerm, setAssessmentTerm] = useState<'midterm1' | 'midterm2'>('midterm1');
  const [indicatorSessionId, setIndicatorSessionId] = useState<string>(() => crypto.randomUUID());
  const [indicatorConcepts, setIndicatorConcepts] = useState<Array<{ id: string; name: string }>>([
    { id: `concept_${Date.now()}`, name: '' },
  ]);
  const [studentIndicatorLevels, setStudentIndicatorLevels] = useState<Record<string, Record<string, AssessmentLevel | null>>>({});
  const [studentBehaviorMap, setStudentBehaviorMap] = useState<Record<string, { type: 'positive' | 'negative' | null; note: string }>>({});
  const [indicatorStudentSearch, setIndicatorStudentSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'graded' | 'ungraded' | 'unasked'>('all');
  const [continuousModeOverrides, setContinuousModeOverrides] = useState<Record<string, { term1: 'manual' | 'indicator'; term2: 'manual' | 'indicator' }>>({});
  const [savingContinuousModes, setSavingContinuousModes] = useState(false);

  // Month for attendance tab
  const [selectedMonth, setSelectedMonth] = useState<string>('آبان');
  const [attendanceDateParts, setAttendanceDateParts] = useState<PersianDateParts>(() => getPersianDateParts());
  const attendanceDate = getGregorianDateFromPersian(attendanceDateParts);
  const attendanceMonth = PERSIAN_CALENDAR_MONTHS[attendanceDateParts.month - 1];
  const [attendanceFeedback, setAttendanceFeedback] = useState<Record<string, string>>({});

  const saveDailyAttendance = async (studentId: string, values: Partial<AttendanceRecord>) => {
    if (!activeAssignment || !teacherProfile || !attendanceDate) return;
    const result = await saveAttendance({
      studentId,
      classId: activeAssignment.classId,
      month: attendanceMonth,
      date: attendanceDate,
      teacherId: teacherProfile.id,
      subject: activeAssignment.subject,
      ...values,
    });
    setAttendanceFeedback((current) => ({
      ...current,
      [studentId]: result.success ? 'ذخیره شد' : result.message || 'ثبت انجام نشد',
    }));
  };

  // Validation errors: record of "studentId_field" -> error message
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string>('');
  const [indicatorFeedback, setIndicatorFeedback] = useState<Record<string, { success: boolean; message: string }>>({});
  const [savingIndicatorStudent, setSavingIndicatorStudent] = useState<string | null>(null);
  const [isFinalizingIndicatorSession, setIsFinalizingIndicatorSession] = useState(false);
  const [sessionFinalizeFeedback, setSessionFinalizeFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const startNewIndicatorSession = () => {
    setIndicatorSessionId(crypto.randomUUID());
    setStudentIndicatorLevels({});
    setStudentBehaviorMap({});
    setIndicatorFeedback({});
    setSessionFinalizeFeedback(null);
  };

  const getIndicatorSessionNumber = (sessionId: string) => {
    const savedSessions = new Map<string, number>();
    for (const grade of gradesSheet) {
      if (grade.classId !== activeAssignment?.classId || grade.subject !== activeAssignment?.subject) continue;
      for (const entry of grade.conceptEntries ?? []) {
        const key = entry.sessionId ?? `legacy:${entry.date}:${entry.assessmentTerm ?? grade.assessmentTerm ?? 'unknown'}`;
        const labelNumber = entry.sessionLabel?.match(/[0-9۰-۹٠-٩]+/)?.[0];
        const number = entry.sessionNumber ?? (labelNumber ? Number(toEnglishDigits(labelNumber)) : 0);
        savedSessions.set(key, Math.max(savedSessions.get(key) ?? 0, number));
      }
    }

    const currentSessionNumber = savedSessions.get(sessionId);
    if (currentSessionNumber) return currentSessionNumber;
    const highestSavedNumber = Math.max(0, ...savedSessions.values());
    return Math.max(savedSessions.size, highestSavedNumber) + 1;
  };

  // Selected student for psychological recommendations
  const [selectedStudentForRec, setSelectedStudentForRec] = useState<string>(activeStudents[0]?.id || '');

  const addIndicatorConcept = () => {
    setIndicatorConcepts((current) => [
      ...current,
      { id: `concept_${Date.now()}_${Math.random().toString(16).slice(2)}`, name: '' },
    ]);
  };

  const getContinuousGradeMode = (grade: StudentGrade | undefined, term: 'term1' | 'term2' = 'term1'): 'manual' | 'indicator' =>
    (term === 'term1' ? grade?.continuousTerm1Mode : grade?.continuousTerm2Mode) ?? grade?.continuousGradeMode ?? (
      grade?.continuous !== undefined && !grade.conceptEntries?.length ? 'manual' : 'indicator'
    );

  const updateIndicatorConcept = (conceptId: string, name: string) => {
    setIndicatorConcepts((current) =>
      current.map((concept) => (concept.id === conceptId ? { ...concept, name } : concept))
    );
  };

  const updateStudentIndicatorLevel = (studentId: string, conceptId: string, level: AssessmentLevel | null) => {
    setStudentIndicatorLevels((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || {}),
        [conceptId]: level,
      },
    }));
  };

  const saveIndicatorAssessmentForStudent = async (studentId: string): Promise<boolean> => {
    if (!activeAssignment || !teacherProfile) {
      setIndicatorFeedback((current) => ({
        ...current,
        [studentId]: { success: false, message: 'کلاس، درس یا حساب معلم انتخاب نشده است.' },
      }));
      return false;
    }

    const term = assessmentTerm;
    const sessionNumber = getIndicatorSessionNumber(indicatorSessionId);
    const gradeRec = gradesSheet.find(
      (grade) => grade.studentId === studentId && grade.subject === activeAssignment.subject && grade.classId === activeAssignment.classId
    );
    const behavior = studentBehaviorMap[studentId] || { type: null, note: '' };
    const sessionLabel = `جلسه ${toPersianDigits(sessionNumber)}`;
    const entries = indicatorConcepts
      .filter((concept) => concept.name.trim())
      .map((concept) => {
        const level = studentIndicatorLevels[studentId]?.[concept.id] ?? null;
        return {
          id: `${indicatorSessionId}_${concept.id}`,
          sessionId: indicatorSessionId,
          sessionNumber,
          sessionLabel,
          name: concept.name.trim(),
          date: indicatorDate,
          assessmentTerm: term,
          level,
          score: level ? getLevelScore(level) : null,
          behaviorType: behavior.type,
          behaviorNote: behavior.note.trim(),
        };
      });

    if (!entries.length) {
      setIndicatorFeedback((current) => ({
        ...current,
        [studentId]: { success: false, message: 'ابتدا نام حداقل یک مفهوم جلسه را وارد کنید.' },
      }));
      return false;
    }

    const assessedEntries = entries.filter((entry) => entry.level && typeof entry.score === 'number');
    const averageScore = assessedEntries.length
      ? Number(getAverageIndicatorScore(assessedEntries).toFixed(2))
      : undefined;
    const conceptEntries = [
      ...(gradeRec?.conceptEntries ?? []).filter((entry) => entry.sessionId !== indicatorSessionId),
      ...entries,
    ];

    setSavingIndicatorStudent(studentId);
    setIndicatorFeedback((current) => {
      const next = { ...current };
      delete next[studentId];
      return next;
    });
    try {
      const result = await saveStudentGrade({
        ...(gradeRec || {}),
        studentId,
        classId: activeAssignment.classId,
        teacherId: teacherProfile.id,
        subject: activeAssignment.subject,
        assessmentDate: indicatorDate,
        assessmentTerm: term,
        indicatorName: entries.map((entry) => entry.name).join(', '),
        ...(averageScore === undefined ? {} : { indicatorLevel: getIndicatorLevelFromAverage(averageScore) }),
        ...(averageScore === undefined ? {} : { indicatorScore: averageScore }),
        conceptEntries,
        conceptSummary: buildConceptSummary(conceptEntries),
        behaviorType: behavior.type,
        behaviorNote: behavior.note.trim(),
      });
      setIndicatorFeedback((current) => ({
        ...current,
        [studentId]: {
          success: result.success,
          message: result.success ? 'نمره و مفاهیم این دانش‌آموز ثبت شد.' : result.message || 'ثبت نمره انجام نشد.',
        },
      }));
      return result.success;
    } catch (error) {
      console.error('Error saving indicator assessment:', error);
      setIndicatorFeedback((current) => ({
        ...current,
        [studentId]: { success: false, message: 'ذخیره انجام نشد؛ اتصال را بررسی کنید و دوباره تلاش کنید.' },
      }));
      return false;
    } finally {
      setSavingIndicatorStudent(null);
    }
  };

  const finalizeIndicatorSession = async () => {
    if (!activeAssignment || !teacherProfile || activeStudents.length === 0) {
      setSessionFinalizeFeedback({ success: false, message: 'برای این درس دانش‌آموزی در دسترس نیست.' });
      return;
    }
    if (!indicatorConcepts.some((concept) => concept.name.trim())) {
      setSessionFinalizeFeedback({ success: false, message: 'برای ثبت جلسه، ابتدا نام حداقل یک مفهوم را وارد کنید.' });
      return;
    }

    const sessionNumber = getIndicatorSessionNumber(indicatorSessionId);
    let savedCount = 0;
    setIsFinalizingIndicatorSession(true);
    setSessionFinalizeFeedback(null);
    try {
      for (const student of activeStudents) {
        if (await saveIndicatorAssessmentForStudent(student.id)) savedCount += 1;
      }

      if (savedCount === activeStudents.length) {
        startNewIndicatorSession();
        setSessionFinalizeFeedback({
          success: true,
          message: `مفاهیم جلسه ${toPersianDigits(sessionNumber)} برای ${toPersianDigits(savedCount)} دانش‌آموز ثبت شد؛ سطح‌های خالی در میانگین نمره محاسبه نشدند. جلسه بعد آماده است.`,
        });
      } else {
        setSessionFinalizeFeedback({
          success: false,
          message: `ثبت نهایی کامل نشد؛ ${toPersianDigits(savedCount)} از ${toPersianDigits(activeStudents.length)} دانش‌آموز ثبت شدند. همین جلسه را دوباره تلاش کنید.`,
        });
      }
    } finally {
      setIsFinalizingIndicatorSession(false);
    }
  };

  const handleContinuousModeChange = async (term: 'term1' | 'term2', mode: 'manual' | 'indicator') => {
    if (!activeAssignment || !teacherProfile) return;
    const modeKey = `${activeAssignment.classId}:${activeAssignment.subject}`;
    const representativeGrade = gradesSheet.find((grade) =>
      grade.studentId === activeStudents[0]?.id &&
      grade.subject === activeAssignment.subject &&
      grade.classId === activeAssignment.classId
    );
    setContinuousModeOverrides((current) => ({
      ...current,
      [modeKey]: {
        term1: term === 'term1' ? mode : current[modeKey]?.term1 ?? getContinuousGradeMode(representativeGrade, 'term1'),
        term2: term === 'term2' ? mode : current[modeKey]?.term2 ?? getContinuousGradeMode(representativeGrade, 'term2'),
      },
    }));
    setSavingContinuousModes(true);
    const results = await Promise.all(activeStudents.map((student) => {
      const existing = gradesSheet.find((grade) =>
        grade.studentId === student.id &&
        grade.subject === activeAssignment.subject &&
        grade.classId === activeAssignment.classId
      );
      return saveStudentGrade({
        ...(existing || {}),
        studentId: student.id,
        classId: activeAssignment.classId,
        teacherId: teacherProfile.id,
        subject: activeAssignment.subject,
        [term === 'term1' ? 'continuousTerm1Mode' : 'continuousTerm2Mode']: mode,
      });
    }));
    setSavingContinuousModes(false);
    if (results.some((result) => !result.success)) {
      setSuccessToast('ذخیره نحوه ورود مستمر برای بعضی دانش‌آموزان انجام نشد.');
    }
  };

  const calculateLiveGradeAvg = (scores: {
    continuousTerm1?: number | null;
    term1Exam?: number | null;
    continuousTerm2?: number | null;
    term2Exam?: number | null;
  }) => calculateAnnualGrade(scores);

  const handleGradeChange = async (
    studentId: string,
    field: keyof StudentGrade,
    rawVal: string
  ) => {
    const cellKey = `${studentId}_${field}`;
    
    if (rawVal.trim() === '') {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
      if (['continuousTerm1', 'term1Exam', 'continuousTerm2', 'term2Exam'].includes(field)) {
        if (!activeAssignment || !teacherProfile) return;
        const existing = gradesSheet.find((grade) =>
          grade.studentId === studentId &&
          grade.subject === activeAssignment.subject &&
          grade.classId === activeAssignment.classId
        );
        await saveStudentGrade({
          ...(existing || {}),
          studentId,
          classId: activeAssignment.classId,
          teacherId: teacherProfile.id,
          subject: activeAssignment.subject,
          [field]: null,
        });
      }
      return;
    }

    const num = parseFloat(rawVal);
    if (isNaN(num) || num < 0 || num > 20) {
      setValidationErrors((prev) => ({
        ...prev,
        [cellKey]: 'نمره باید بین ۰ تا ۲۰ باشد.',
      }));
      return;
    }

    // Clear error
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });

    if (!activeAssignment || !teacherProfile) return;

    // Get current grade record
    const existing = gradesSheet.find(
      (g) =>
        g.studentId === studentId &&
        g.subject === activeAssignment.subject &&
        g.classId === activeAssignment.classId
    );

    const payload: Partial<StudentGrade> & { studentId: string; classId: string; teacherId: string; subject: string } = {
      ...(existing || {}),
      studentId,
      classId: activeAssignment.classId,
      teacherId: teacherProfile.id,
      subject: activeAssignment.subject,
      [field]: num,
    };

    await saveStudentGrade(payload);
  };

  // Raw average and adjusted average calculation
  const myGrades = gradesSheet.filter((g) => g.teacherId === teacherProfile?.id);
  const indicatorArchive = gradesSheet
    .filter((grade) =>
      grade.classId === activeAssignment?.classId &&
      grade.subject === activeAssignment?.subject &&
      Boolean(grade.conceptEntries?.length)
    )
    .flatMap((grade) => {
      const student = students.find((item) => item.id === grade.studentId);
      const sessions = new Map<string, typeof grade.conceptEntries>();
      for (const entry of grade.conceptEntries ?? []) {
        const sessionKey = entry.sessionId ?? `${entry.date}_${entry.assessmentTerm ?? grade.assessmentTerm ?? 'unknown'}`;
        sessions.set(sessionKey, [...(sessions.get(sessionKey) ?? []), entry]);
      }

      return Array.from(sessions.entries()).map(([sessionKey, entries]) => {
        const firstEntry = entries?.[0];
        return {
          id: `${grade.studentId}_${sessionKey}`,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'دانش‌آموز',
          date: firstEntry?.date ?? grade.assessmentDate,
          term: firstEntry?.assessmentTerm ?? grade.assessmentTerm,
          sessionLabel: firstEntry?.sessionLabel ?? 'جلسه ثبت‌شده',
          concepts: (entries ?? []).map((entry) => `${entry.name} (${entry.level ? LEVEL_LABELS[entry.level] : 'بدون نمره'})`).join('، '),
          behaviorNote: (entries ?? []).find((entry) => entry.behaviorNote !== undefined)?.behaviorNote ?? grade.behaviorNote,
        };
      });
    })
    .sort((first, second) => (second.date ?? '').localeCompare(first.date ?? ''));
  const classSubjectGrades = gradesSheet.filter((grade) =>
    grade.classId === activeAssignment?.classId && grade.subject === activeAssignment?.subject
  );
  const trackedConcepts = [...new Set(classSubjectGrades.flatMap((grade) =>
    (grade.conceptEntries ?? []).map((entry) => entry.name.trim()).filter(Boolean)
  ))].sort((first, second) => first.localeCompare(second, 'fa'));
  const getConceptCoverage = (studentId: string, conceptName: string) => {
    const grade = classSubjectGrades.find((record) => record.studentId === studentId);
    const entries = (grade?.conceptEntries ?? []).filter((entry) => entry.name.trim() === conceptName);
    const sortedEntries = [...entries].sort((first, second) =>
      (first.date ?? '').localeCompare(second.date ?? '') || (first.sessionNumber ?? 0) - (second.sessionNumber ?? 0)
    );
    const latest = sortedEntries.at(-1);
    const latestGraded = [...sortedEntries].reverse().find((entry) => entry.level && typeof entry.score === 'number');
    return { entries, latest, latestGraded };
  };
  const normalizedIndicatorSearch = indicatorStudentSearch.trim().toLocaleLowerCase();
  const indicatorVisibleStudents = activeStudents.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLocaleLowerCase();
    const matchesSearch = !normalizedIndicatorSearch || fullName.includes(normalizedIndicatorSearch) || student.studentCode.toLocaleLowerCase().includes(normalizedIndicatorSearch);
    if (!matchesSearch) return false;
    if (coverageFilter === 'all') return true;
    const conceptStates = trackedConcepts.map((conceptName) => {
      const { entries, latest } = getConceptCoverage(student.id, conceptName);
      if (!entries.length) return 'unasked';
      return latest?.level && typeof latest.score === 'number' ? 'graded' : 'ungraded';
    });
    if (coverageFilter === 'graded') return conceptStates.includes('graded');
    if (coverageFilter === 'ungraded') return conceptStates.includes('ungraded');
    return conceptStates.includes('unasked');
  });
  const activeModeKey = `${activeAssignment?.classId ?? ''}:${activeAssignment?.subject ?? ''}`;
  const firstStudentGrade = gradesSheet.find((grade) =>
    grade.studentId === activeStudents[0]?.id && grade.classId === activeAssignment?.classId && grade.subject === activeAssignment?.subject
  );
  const term1Mode = continuousModeOverrides[activeModeKey]?.term1 ?? getContinuousGradeMode(firstStudentGrade, 'term1');
  const term2Mode = continuousModeOverrides[activeModeKey]?.term2 ?? getContinuousGradeMode(firstStudentGrade, 'term2');
  const rawSum = myGrades.reduce((acc, curr) => acc + (curr.calculatedAverage || 0), 0);
  const rawAverage = myGrades.length > 0 ? Math.round((rawSum / myGrades.length) * 100) / 100 : 0;

  // Subject difficulty
  const currDifficulty = subjectDifficulties.find((sd) => sd.subject === activeAssignment?.subject)?.coefficient || 1.0;
  const adjustedAverage = Math.min(20, Math.round(rawAverage * currDifficulty * 100) / 100);

  const teacherWeightedScore = teacherProfile ? calculateTeacherWeightedScore(teacherProfile.id) : null;
  const hasDemoPerformanceData = Boolean(teacherProfile && (
    evaluations.some((evaluation) => evaluation.teacherId === teacherProfile.id && evaluation.isDemo)
    || studentStaffEvaluations.some((evaluation) => evaluation.targetId === teacherProfile.id && evaluation.isDemo)
  ));

  return (
    <div className="space-y-6">
      {/* Top Welcome & Assignment Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                پرتال تخصصی دبیر: {teacherProfile?.fullName || currentUser?.fullName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تخصص: {teacherProfile?.specialty || 'دبیر'} • کد پرسنلی:{' '}
              <span className="font-mono">{toPersianDigits(teacherProfile?.teacherCode || '')}</span>
            </p>
          </div>

          {/* Assignment Selector */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">کلاس و درس جاری:</label>
            <select
              value={selectedAsgnId}
              onChange={(e) => {
                setSelectedAsgnId(e.target.value);
                setValidationErrors({});
              }}
              className="px-3.5 py-2 rounded-xl border border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 text-xs sm:text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              {myAssignments.length === 0 ? (
                <option value="">هیچ کلاسی به شما تخصیص نیافته است</option>
              ) : (
                myAssignments.map((asgn) => {
                  const c = classes.find((cls) => cls.id === asgn.classId);
                  return (
                    <option key={asgn.id} value={asgn.id}>
                      {c?.name} — درس {asgn.subject}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('grades')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'grades'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>۱. ورود نمرات ۵ گانه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('indicatorAssessment')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'indicatorAssessment'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>۲. ثبت نمرات شاخص محور</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>۳. حضور و تکالیف ماهانه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'recommendations'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>۴. توصیه‌های روانشناختی دانش‌آموزان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'performance'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>۵. کارنامه عملکرد و ارزیابی من</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('talents')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'talents'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>۶. استعداد و شخصیت کلاس</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matching')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'matching'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>۷. پرسشنامه و تناسب معلم-دانش‌آموز</span>
        </button>
      </div>

      {activeTab === 'matching' && (
        <TeacherLearningPanel teacherId={teacherProfile?.id} classId={activeClass?.id} />
      )}

      {activeTab === 'talents' && (
        <TalentOverview
          classes={classes}
          students={students}
          psychResults={psychResults}
          grades={gradesSheet}
          attendanceRecords={attendanceRecords}
          classId={activeClass?.id}
          recommendationMode="both"
          title="استعدادها و شخصیت‌شناسی تجمیعی کلاس جاری"
        />
      )}

      {/* TAB 1: GRADES ENTRY SHEET */}
      {activeTab === 'grades' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>لیست نمرات کلاس: {activeClass?.name || 'انتخاب نشده'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold">
                  درس {activeAssignment?.subject}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                نمره سالانه: <strong className="text-teal-600">(مستمر ترم اول + ۲×نمره ترم اول + مستمر ترم دوم + ۴×نمره ترم دوم) ÷ ۸</strong>.
                نمرات خارج از بازه ۰ تا ۲۰ به صورت آنی رد شده و کادر قرمز می‌گردد.
              </p>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto font-bold">
              تعداد دانش‌آموزان: {toPersianDigits(activeStudents.length)} نفر
            </div>
          </div>

          {/* Live Validation Alert if any errors exist */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                توجه: در جدول زیر {toPersianDigits(Object.keys(validationErrors).length)} خانه با مقادیر نامعتبر (خارج از محدوده ۰ تا ۲۰) مشخص شده است.
              </span>
            </div>
          )}

          {/* Grades Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl w-12 text-center">ردیف</th>
                  <th className="p-3 min-w-[140px]">دانش‌آموز</th>
                  <th className="p-2 text-center min-w-[150px] bg-teal-500/10">
                    <div>مستمر ترم اول (ضریب ۱)</div>
                    <select
                      aria-label="نحوه تکمیل مستمر ترم اول"
                      value={term1Mode}
                      disabled={savingContinuousModes}
                      onChange={(event) => handleContinuousModeChange('term1', event.target.value as 'manual' | 'indicator')}
                      className="mt-2 max-w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option value="indicator">خودکار از شاخص‌ها</option>
                      <option value="manual">ورود دستی</option>
                    </select>
                  </th>
                  <th className="p-3 text-center min-w-[110px] bg-teal-500/10">نمره ترم اول (ضریب ۲)</th>
                  <th className="p-2 text-center min-w-[150px] bg-teal-500/10">
                    <div>مستمر ترم دوم (ضریب ۱)</div>
                    <select
                      aria-label="نحوه تکمیل مستمر ترم دوم"
                      value={term2Mode}
                      disabled={savingContinuousModes}
                      onChange={(event) => handleContinuousModeChange('term2', event.target.value as 'manual' | 'indicator')}
                      className="mt-2 max-w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option value="indicator">خودکار از شاخص‌ها</option>
                      <option value="manual">ورود دستی</option>
                    </select>
                  </th>
                  <th className="p-3 text-center min-w-[110px] bg-teal-500/10">نمره ترم دوم (ضریب ۴)</th>
                  <th className="p-3 text-center min-w-[110px] rounded-l-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black">
                    نمره سالانه
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      هیچ دانش‌آموزی در این کلاس ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((st, idx) => {
                    const gradeRec = gradesSheet.find(
                      (g) =>
                        g.studentId === st.id &&
                        g.subject === activeAssignment?.subject &&
                        g.classId === activeAssignment?.classId
                    );
                    const continuousTerm1Mode = getContinuousGradeMode(gradeRec, 'term1');
                    const continuousTerm2Mode = getContinuousGradeMode(gradeRec, 'term2');
                    const indicatorAverages = getIndicatorContinuousAverages(gradeRec?.conceptEntries ?? []);
                    const continuousTerm1 = gradeRec?.continuousTerm1 ?? (
                      continuousTerm1Mode === 'indicator' ? indicatorAverages.continuousTerm1 : gradeRec?.continuous ?? null
                    );
                    const continuousTerm2 = gradeRec?.continuousTerm2 ?? (
                      continuousTerm2Mode === 'indicator' ? indicatorAverages.continuousTerm2 : null
                    );
                    const term1Exam = gradeRec?.term1Exam ?? gradeRec?.midterm ?? null;
                    const term2Exam = gradeRec?.term2Exam ?? gradeRec?.final ?? null;
                    const liveAvg = calculateLiveGradeAvg({ continuousTerm1, term1Exam, continuousTerm2, term2Exam });

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div>{st.firstName} {st.lastName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {st.studentCode}
                          </span>
                        </td>

                        {/* First-term continuous score */}
                        <td className="p-2 text-center bg-teal-500/5">
                          <input
                            key={`${st.id}_continuousTerm1_${continuousTerm1Mode}_${continuousTerm1 ?? ''}`}
                            type="number"
                            step={0.25}
                            min={0}
                            max={20}
                            disabled={continuousTerm1Mode === 'indicator'}
                            defaultValue={continuousTerm1 ?? ''}
                            onBlur={(e) => handleGradeChange(st.id, 'continuousTerm1', e.target.value)}
                            className={`w-20 px-2 py-1.5 rounded-lg border text-center font-mono text-xs transition ${
                              continuousTerm1Mode === 'indicator'
                                ? 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                : validationErrors[`${st.id}_continuousTerm1`]
                                ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/40'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                            }`}
                            placeholder="—"
                          />
                        </td>

                        {/* First-term exam */}
                        <td className="p-2 text-center bg-teal-500/5">
                          <input
                            key={`${st.id}_term1Exam_${term1Exam ?? ''}`}
                            type="number"
                            step={0.25}
                            min={0}
                            max={20}
                            defaultValue={term1Exam ?? ''}
                            onBlur={(e) => handleGradeChange(st.id, 'term1Exam', e.target.value)}
                            className={`w-20 px-2 py-1.5 rounded-lg border text-center font-mono text-xs font-bold transition ${
                              validationErrors[`${st.id}_term1Exam`]
                                ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/40'
                                : 'border-teal-400/60 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200'
                            }`}
                            placeholder="—"
                          />
                        </td>

                        {/* Second-term continuous score */}
                        <td className="p-2 text-center bg-teal-500/5">
                          <input
                            key={`${st.id}_continuousTerm2_${continuousTerm2Mode}_${continuousTerm2 ?? ''}`}
                            type="number"
                            step={0.25}
                            min={0}
                            max={20}
                            disabled={continuousTerm2Mode === 'indicator'}
                            defaultValue={continuousTerm2 ?? ''}
                            onBlur={(e) => handleGradeChange(st.id, 'continuousTerm2', e.target.value)}
                            className={`w-20 px-2 py-1.5 rounded-lg border text-center font-mono text-xs transition ${
                              continuousTerm2Mode === 'indicator'
                                ? 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                : validationErrors[`${st.id}_continuousTerm2`]
                                ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/40'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                            }`}
                            placeholder="—"
                          />
                        </td>

                        {/* Second-term exam */}
                        <td className="p-2 text-center bg-teal-500/5">
                          <input
                            key={`${st.id}_term2Exam_${term2Exam ?? ''}`}
                            type="number"
                            step={0.25}
                            min={0}
                            max={20}
                            defaultValue={term2Exam ?? ''}
                            onBlur={(e) => handleGradeChange(st.id, 'term2Exam', e.target.value)}
                            className={`w-20 px-2 py-1.5 rounded-lg border text-center font-mono text-xs font-bold transition ${
                              validationErrors[`${st.id}_term2Exam`]
                                ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/40'
                                : 'border-teal-400/60 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200'
                            }`}
                            placeholder="—"
                          />
                        </td>

                        {/* Live Average Calculated */}
                        <td className="p-2 text-center bg-amber-500/10">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs font-mono ${
                              liveAvg === null
                                ? 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                                : liveAvg >= 17
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60'
                                : liveAvg >= 12
                                ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60'
                                : 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60'
                            }`}
                          >
                            {liveAvg === null ? '—' : toPersianDigits(liveAvg.toFixed(2))}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <details className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-slate-800 dark:text-slate-100">
              بایگانی ارزیابی‌های همین کلاس و درس ({toPersianDigits(indicatorArchive.length)} مورد)
            </summary>
            <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-700">
              {indicatorArchive.length ? (
                <table className="w-full min-w-[720px] text-right text-xs">
                  <thead className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-3">تاریخ</th>
                      <th className="p-3">دوره</th>
                      <th className="p-3">دانش‌آموز</th>
                      <th className="p-3">مفاهیم و سطح</th>
                      <th className="p-3">یادداشت اخلاقی همان جلسه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {indicatorArchive.map((session) => (
                      <tr key={session.id}>
                        <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {session.date ? new Date(session.date).toLocaleDateString('fa-IR') : '—'} · {session.sessionLabel}
                        </td>
                        <td className="p-3 whitespace-nowrap font-bold text-teal-800 dark:text-teal-200">
                          {session.term === 'midterm1' ? 'مستمر ترم اول' : session.term === 'midterm2' ? 'مستمر ترم دوم' : 'نامشخص'}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{session.studentName}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-200">{session.concepts || '—'}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{session.behaviorNote || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-xs text-slate-500 dark:text-slate-400">هنوز برای این کلاس و درس جلسه‌ای بایگانی نشده است.</p>
              )}
            </div>
          </details>
        </div>
      )}

      {activeTab === 'indicatorAssessment' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>ثبت نمرات شاخص محور و وضعیت اخلاقی/کلاسی</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                دوره را انتخاب کنید؛ میانگین مفاهیم در ستون همان دوره ثبت می‌شود و یادداشت هر جلسه جداگانه در کارنامه می‌ماند.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <label htmlFor="indicator-assessment-term" className="text-xs font-bold text-slate-700 dark:text-slate-300">دوره نمره:</label>
              <select
                id="indicator-assessment-term"
                value={assessmentTerm}
                onChange={(event) => {
                  setAssessmentTerm(event.target.value as 'midterm1' | 'midterm2');
                  startNewIndicatorSession();
                }}
                className="rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="midterm1">مستمر ترم اول</option>
                <option value="midterm2">مستمر ترم دوم</option>
              </select>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تاریخ شمسی:</span>
              <label className="sr-only" htmlFor="indicator-date-year">سال شمسی</label>
              <select
                id="indicator-date-year"
                aria-label="سال شمسی"
                value={indicatorDateParts.year}
                onChange={(event) => {
                  setIndicatorDateParts((date) => updatePersianDate(date, 'year', Number(event.target.value)));
                  startNewIndicatorSession();
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                {Array.from({ length: 10 }, (_, index) => indicatorDateParts.year - 4 + index).map((year) => (
                  <option key={year} value={year}>{toPersianDigits(year)}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="indicator-date-month">ماه شمسی</label>
              <select
                id="indicator-date-month"
                aria-label="ماه شمسی"
                value={indicatorDateParts.month}
                onChange={(event) => {
                  setIndicatorDateParts((date) => updatePersianDate(date, 'month', Number(event.target.value)));
                  startNewIndicatorSession();
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                {PERSIAN_CALENDAR_MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="indicator-date-day">روز شمسی</label>
              <select
                id="indicator-date-day"
                aria-label="روز شمسی"
                value={indicatorDateParts.day}
                onChange={(event) => {
                  setIndicatorDateParts((date) => updatePersianDate(date, 'day', Number(event.target.value)));
                  startNewIndicatorSession();
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                {Array.from({ length: getPersianMonthLength(indicatorDateParts.year, indicatorDateParts.month) }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>{toPersianDigits(day)}</option>
                ))}
              </select>
              <span className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-black text-slate-700 dark:text-slate-200">
                {formatPersianDateParts(indicatorDateParts)}
              </span>
              <span
                role="status"
                aria-live="polite"
                className="rounded-lg bg-teal-100 dark:bg-teal-950/60 px-2 py-1 text-[10px] font-black text-teal-800 dark:text-teal-200"
              >
                جلسه جاری: {toPersianDigits(getIndicatorSessionNumber(indicatorSessionId))}
              </span>
              <button
                type="button"
                onClick={startNewIndicatorSession}
                className="rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-teal-800 dark:text-teal-200"
              >
                جلسه جدید
              </button>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">پوشش مفاهیم این درس برای هر دانش‌آموز</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">آخرین وضعیت هر مفهوم از همهٔ جلسه‌های ثبت‌شده نمایش داده می‌شود.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  aria-label="جست‌وجوی دانش‌آموز در پوشش مفاهیم"
                  value={indicatorStudentSearch}
                  onChange={(event) => setIndicatorStudentSearch(event.target.value)}
                  placeholder="جست‌وجوی نام یا کد دانش‌آموز..."
                  className="min-w-[220px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <select
                  aria-label="فیلتر وضعیت مفاهیم"
                  value={coverageFilter}
                  onChange={(event) => setCoverageFilter(event.target.value as typeof coverageFilter)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="graded">دارای نمره</option>
                  <option value="ungraded">پرسیده‌شده، بدون نمره</option>
                  <option value="unasked">هنوز پرسیده‌نشده</option>
                </select>
              </div>
            </div>
            {trackedConcepts.length ? (
              <div className="max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="w-full min-w-max text-right text-[10px]">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <tr>
                      <th className="sticky right-0 z-20 bg-slate-100 dark:bg-slate-800 p-2 min-w-[150px]">دانش‌آموز</th>
                      {trackedConcepts.map((concept) => <th key={concept} className="p-2 min-w-[130px]">{concept}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {indicatorVisibleStudents.map((student) => (
                      <tr key={student.id}>
                        <th className="sticky right-0 bg-white dark:bg-slate-900 p-2 text-right font-bold text-slate-800 dark:text-slate-100">
                          {student.firstName} {student.lastName}<span className="block font-mono text-[9px] text-slate-400">{student.studentCode}</span>
                        </th>
                        {trackedConcepts.map((concept) => {
                          const { entries, latest, latestGraded } = getConceptCoverage(student.id, concept);
                          const hasLatestGrade = Boolean(latest?.level && typeof latest.score === 'number');
                          const statusText = !entries.length
                            ? 'هنوز پرسیده نشده'
                            : hasLatestGrade
                              ? `${LEVEL_LABELS[latest!.level!]} · ${toPersianDigits(latest!.score!)}`
                              : latestGraded
                                ? `بدون نمره · قبلاً ${LEVEL_LABELS[latestGraded.level!]}`
                                : 'پرسیده‌شده · بدون نمره';
                          return (
                            <td
                              key={concept}
                              title={latest?.date ? `آخرین ثبت: ${formatPersianDateParts(getPersianDateParts(new Date(`${latest.date}T12:00:00`)))}` : undefined}
                              className={`p-2 text-center font-bold ${!entries.length ? 'text-slate-400' : hasLatestGrade ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}
                            >
                              {statusText}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {!indicatorVisibleStudents.length && (
                      <tr><td colSpan={trackedConcepts.length + 1} className="p-4 text-center text-slate-500">دانش‌آموزی با این جست‌وجو یا فیلتر پیدا نشد.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl bg-white dark:bg-slate-900 p-4 text-xs text-slate-500">پس از ثبت نهایی نخستین جلسه، مفاهیم و وضعیت هر دانش‌آموز در این جدول دیده می‌شود.</p>
            )}
          </section>

          <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">درس/پایه در حال ارزیابی:</label>
              <select
                value={selectedAsgnId}
                onChange={(e) => {
                  setSelectedAsgnId(e.target.value);
                  startNewIndicatorSession();
                }}
                className="px-3.5 py-2 rounded-xl border border-teal-500/40 bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-200 text-xs sm:text-sm font-bold"
              >
                {myAssignments.map((assignment) => {
                  const className = classes.find((schoolClass) => schoolClass.id === assignment.classId)?.name;
                  return (
                    <option key={assignment.id} value={assignment.id}>
                      {className} · {assignment.subject}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={addIndicatorConcept}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                + افزودن مفهوم جدید
              </button>
              <button
                type="button"
                onClick={finalizeIndicatorSession}
                disabled={isFinalizingIndicatorSession || savingIndicatorStudent !== null}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
              >
                {isFinalizingIndicatorSession ? 'در حال ثبت نهایی جلسه...' : 'ثبت نهایی اطلاعات جلسه'}
              </button>
            </div>
            {sessionFinalizeFeedback && (
              <p
                role={sessionFinalizeFeedback.success ? 'status' : 'alert'}
                className={`text-xs font-bold ${sessionFinalizeFeedback.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
              >
                {sessionFinalizeFeedback.message}
              </p>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {indicatorConcepts.map((concept) => (
                <div key={concept.id} className="rounded-xl border border-teal-200 bg-white dark:bg-slate-900 p-3">
                  <input
                    value={concept.name}
                    onChange={(event) => updateIndicatorConcept(concept.id, event.target.value)}
                    placeholder="نام مفهوم یا مهارت درسی ..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl min-w-[150px]">دانش‌آموز</th>
                  {indicatorConcepts.map((concept) => (
                    <th key={concept.id} className="p-3 text-center min-w-[170px]">
                      {concept.name || 'مفهوم جدید'}
                    </th>
                  ))}
                  <th className="p-3 text-center min-w-[150px]">رفتار کلاسی / اخلاق</th>
                  <th className="p-3 text-center min-w-[140px] rounded-l-xl bg-teal-500/10 text-teal-700 dark:text-teal-200">ثبت نمره</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeStudents.map((student) => {
                  const ratedConcepts = indicatorConcepts
                    .filter((concept) => concept.name.trim())
                    .flatMap((concept) => {
                      const level = studentIndicatorLevels[student.id]?.[concept.id];
                      return level ? [getLevelScore(level)] : [];
                    });
                  const scoreAverage = ratedConcepts.length
                    ? ratedConcepts.reduce((sum, score) => sum + score, 0) / ratedConcepts.length
                    : null;

                  const behavior = studentBehaviorMap[student.id] || { type: null, note: '' };

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div>{student.firstName} {student.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{student.studentCode}</div>
                      </td>

                      {indicatorConcepts.map((concept) => (
                        <td key={concept.id} className="p-2 text-center">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {(['unassessed', 'good', 'medium', 'weak'] as const).map((level) => {
                              const selectedLevel = studentIndicatorLevels[student.id]?.[concept.id] ?? null;
                              const isSelected = level === 'unassessed' ? selectedLevel === null : selectedLevel === level;
                              return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => updateStudentIndicatorLevel(student.id, concept.id, level === 'unassessed' ? null : level)}
                                className={`min-w-[52px] rounded-lg border px-2 py-1.5 text-[10px] font-black transition ${
                                  isSelected
                                    ? level === 'unassessed'
                                      ? 'border-slate-500 bg-slate-500 text-white'
                                      : level === 'good'
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : level === 'medium'
                                        ? 'border-amber-500 bg-amber-500 text-white'
                                        : 'border-rose-500 bg-rose-500 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                }`}
                              >
                                {level === 'unassessed' ? 'بدون نمره' : LEVEL_LABELS[level]}
                              </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}

                      <td className="p-2 text-center">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1 justify-center">
                            {(['unselected', 'positive', 'negative'] as const).map((status) => {
                              const isSelected = status === 'unselected' ? behavior.type === null : behavior.type === status;
                              return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setStudentBehaviorMap((current) => ({
                                  ...current,
                                  [student.id]: {
                                    type: status === 'unselected' ? null : status,
                                    note: current[student.id]?.note || '',
                                  },
                                }))}
                                className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                                  isSelected
                                    ? status === 'unselected'
                                      ? 'bg-slate-500 text-white'
                                      : status === 'positive'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-rose-500 text-white'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {status === 'unselected' ? 'ثبت نشده' : status === 'positive' ? 'مثبت' : 'منفی'}
                              </button>
                              );
                            })}
                          </div>
                          <input
                            value={behavior.note}
                            onChange={(event) => setStudentBehaviorMap((current) => ({
                              ...current,
                              [student.id]: {
                                type: current[student.id]?.type ?? null,
                                note: event.target.value,
                              },
                            }))}
                            placeholder="یادداشت اخلاقی"
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[10px] text-slate-900 dark:text-white"
                          />
                        </div>
                      </td>

                      <td className="p-2 text-center bg-teal-500/5">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-[11px] ${
                            scoreAverage === null
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : scoreAverage >= 15
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : scoreAverage >= 10
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {scoreAverage === null ? '—' : toPersianDigits(scoreAverage.toFixed(2))}
                          </span>
                          <button
                            type="button"
                            onClick={() => saveIndicatorAssessmentForStudent(student.id)}
                            disabled={savingIndicatorStudent === student.id || isFinalizingIndicatorSession}
                            className="rounded-lg bg-teal-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-teal-700"
                          >
                            {savingIndicatorStudent === student.id ? 'در حال ثبت...' : 'ثبت برای این دانش‌آموز'}
                          </button>
                          {indicatorFeedback[student.id] && (
                            <p
                              role={indicatorFeedback[student.id].success ? 'status' : 'alert'}
                              className={`max-w-[180px] text-[10px] font-bold ${indicatorFeedback[student.id].success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
                            >
                              {indicatorFeedback[student.id].message}
                            </p>
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
      )}

      {/* TAB 2: MONTHLY ATTENDANCE, HOMEWORK & BEHAVIOR */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
          <section className="space-y-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">ثبت روزانهٔ حضور و وضعیت کلاس</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {activeClass?.name || 'کلاس انتخاب‌شده'} · درس {activeAssignment?.subject || '—'} · ثبت‌ها بلافاصله در پنل معاون اجرایی نمایش داده می‌شوند.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  سال شمسی
                  <select value={attendanceDateParts.year} onChange={(event) => setAttendanceDateParts((date) => updatePersianDate(date, 'year', Number(event.target.value)))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    {Array.from({ length: 8 }, (_, index) => attendanceDateParts.year - 3 + index).map((year) => <option key={year} value={year}>{toPersianDigits(year)}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  ماه شمسی
                  <select value={attendanceDateParts.month} onChange={(event) => setAttendanceDateParts((date) => updatePersianDate(date, 'month', Number(event.target.value)))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    {PERSIAN_CALENDAR_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  روز شمسی
                  <select value={attendanceDateParts.day} onChange={(event) => setAttendanceDateParts((date) => updatePersianDate(date, 'day', Number(event.target.value)))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
                    {Array.from({ length: getPersianMonthLength(attendanceDateParts.year, attendanceDateParts.month) }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{toPersianDigits(day)}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr><th className="p-3">دانش‌آموز</th><th className="p-3 text-center">وضعیت حضور</th><th className="p-3 text-center">تکلیف</th><th className="p-3 text-center">وضعیت انضباطی</th><th className="p-3">یادداشت انضباطی</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeStudents.map((student) => {
                    const record = attendanceRecords.find((item) => item.studentId === student.id && item.classId === activeAssignment?.classId && item.date === attendanceDate && item.teacherId === teacherProfile?.id);
                    const statusButtons = [
                      { value: 'present' as const, label: 'حاضر', style: 'bg-emerald-600 text-white' },
                      { value: 'absent' as const, label: 'غایب', style: 'bg-rose-600 text-white' },
                      { value: 'late' as const, label: 'تأخیر', style: 'bg-amber-500 text-white' },
                    ];
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="whitespace-nowrap p-3 font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</td>
                        <td className="p-2">
                          <div className="flex justify-center gap-1">
                            {statusButtons.map((status) => (
                              <button key={status.value} type="button" aria-pressed={record?.status === status.value} onClick={() => void saveDailyAttendance(student.id, { status: status.value, absences: status.value === 'absent' ? 1 : 0, tardies: status.value === 'late' ? 1 : 0 })} className={`rounded-md px-2.5 py-1.5 font-bold transition-colors ${record?.status === status.value ? status.style : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{status.label}</button>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <select aria-label={`وضعیت تکلیف ${student.firstName} ${student.lastName}`} value={record?.homeworkStatus || ''} onChange={(event) => void saveDailyAttendance(student.id, { homeworkStatus: event.target.value as AttendanceRecord['homeworkStatus'] })} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                            <option value="">ثبت نشده</option><option value="done">انجام شده</option><option value="partial">ناقص</option><option value="missing">انجام نشده</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <select aria-label={`وضعیت انضباطی ${student.firstName} ${student.lastName}`} value={record?.disciplineStatus || ''} onChange={(event) => void saveDailyAttendance(student.id, { disciplineStatus: event.target.value as AttendanceRecord['disciplineStatus'] })} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                            <option value="">ثبت نشده</option><option value="positive">مثبت</option><option value="neutral">عادی</option><option value="needs_attention">نیازمند پیگیری</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input aria-label={`یادداشت انضباطی ${student.firstName} ${student.lastName}`} defaultValue={record?.disciplineNote || ''} key={`${student.id}-${attendanceDate}-${record?.updatedAt || 'new'}`} onBlur={(event) => { if (event.target.value !== (record?.disciplineNote || '')) void saveDailyAttendance(student.id, { disciplineNote: event.target.value }); }} placeholder="یادداشت کوتاه" className="w-full min-w-40 rounded-md border border-slate-300 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800" />
                          {attendanceFeedback[student.id] && <span role="status" className="mt-1 block text-[10px] text-slate-500">{attendanceFeedback[student.id]}</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {activeStudents.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">برای این کلاس دانش‌آموزی ثبت نشده است.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>حضور و غیاب، تکالیف و شاخص‌های رفتاری کلاسی</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                شامل غیبت، تأخیر، درصد انجام تکالیف (۰ تا ۱۰۰)، کیفیت تکالیف (۱ تا ۵) و ۵ شاخص رفتاری (مشارکت، رفتار، مسئولیت‌پذیری، همکاری، قوانین).
              </p>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ماه تحصیلی:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              >
                {PERSIAN_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3 rounded-r-xl">دانش‌آموز</th>
                  <th className="p-3 text-center">غیبت</th>
                  <th className="p-3 text-center">تأخیر</th>
                  <th className="p-3 text-center">انجام تکلیف (٪)</th>
                  <th className="p-3 text-center">کیفیت تکلیف (۱-۵)</th>
                  <th className="p-3 text-center">مشارکت</th>
                  <th className="p-3 text-center">رفتار کلاسی</th>
                  <th className="p-3 text-center">مسئولیت‌پذیری</th>
                  <th className="p-3 text-center">همکاری گروهی</th>
                  <th className="p-3 text-center rounded-l-xl">رعایت قوانین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeStudents.map((st) => {
                  const att = attendanceRecords.find(
                    (a) =>
                      a.studentId === st.id &&
                      a.month === selectedMonth &&
                      a.classId === activeAssignment?.classId &&
                      !a.date
                  );

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {st.firstName} {st.lastName}
                      </td>

                      {/* Absences */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          defaultValue={att?.absences ?? 0}
                          onBlur={async (e) => {
                            if (!activeAssignment) return;
                            await saveAttendance({
                              studentId: st.id,
                              classId: activeAssignment.classId,
                              month: selectedMonth,
                              absences: parseInt(e.target.value) || 0,
                            });
                          }}
                          className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono"
                        />
                      </td>

                      {/* Tardies */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          defaultValue={att?.tardies ?? 0}
                          onBlur={async (e) => {
                            if (!activeAssignment) return;
                            await saveAttendance({
                              studentId: st.id,
                              classId: activeAssignment.classId,
                              month: selectedMonth,
                              tardies: parseInt(e.target.value) || 0,
                            });
                          }}
                          className="w-14 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono"
                        />
                      </td>

                      {/* Homework % */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={att?.homeworkPercent ?? 90}
                          onBlur={async (e) => {
                            if (!activeAssignment) return;
                            const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            await saveAttendance({
                              studentId: st.id,
                              classId: activeAssignment.classId,
                              month: selectedMonth,
                              homeworkPercent: val,
                            });
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono"
                        />
                      </td>

                      {/* Quality 1-5 */}
                      <td className="p-2 text-center">
                        <select
                          defaultValue={att?.homeworkQuality ?? 5}
                          onChange={async (e) => {
                            if (!activeAssignment) return;
                            await saveAttendance({
                              studentId: st.id,
                              classId: activeAssignment.classId,
                              month: selectedMonth,
                              homeworkQuality: Number(e.target.value),
                            });
                          }}
                          className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                        >
                          {[1, 2, 3, 4, 5].map((v) => (
                            <option key={v} value={v}>
                              {toPersianDigits(v)}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 5 Behavioral indicators 1-5 */}
                      {(['participation', 'behavior', 'responsibility', 'teamwork', 'rulesObservance'] as const).map(
                        (bh) => (
                          <td key={bh} className="p-2 text-center">
                            <select
                              defaultValue={att?.[bh] ?? 5}
                              onChange={async (e) => {
                                if (!activeAssignment) return;
                                await saveAttendance({
                                  studentId: st.id,
                                  classId: activeAssignment.classId,
                                  month: selectedMonth,
                                  [bh]: Number(e.target.value),
                                });
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                            >
                              {[1, 2, 3, 4, 5].map((v) => (
                                <option key={v} value={v}>
                                  {toPersianDigits(v)}
                                </option>
                              ))}
                            </select>
                          </td>
                        )
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PEDAGOGICAL & PSYCHOLOGICAL RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                <span>راهنمای روانشناسی تربیتی و توصیه‌های آموزشی برای دبیر</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                بر اساس نتیجه آزمون دانش‌آموز و در صورت وجود، نمره‌ها، حضور، تکلیف و مشارکت ثبت‌شده.
              </p>
            </div>

            {/* Select Student */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">انتخاب دانش‌آموز:</label>
              <select
                value={selectedStudentForRec}
                onChange={(e) => setSelectedStudentForRec(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
              >
                {activeStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.firstName} {st.lastName} ({st.studentCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prominent Educational Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="font-bold">توجه و اخطار حرفه‌ای: </strong>
              این پیشنهادها راهنمای عمومی تدریس‌اند، نه تشخیص یا نسخه قطعی. ترجیح‌های یادگیری، از جمله خودارزیابی چهارگانه، برچسب ثابت برای دانش‌آموز نیستند؛ آن‌ها را با عملکرد درسی، گفت‌وگو و آزمودن چند روش آموزشی بسنجید.
            </div>
          </div>

          {/* Student Psych Profile & Recommendations Card */}
          {(() => {
            const currentPsych = psychResults.find((p) => p.studentId === selectedStudentForRec);
            const currentStudentObj = activeStudents.find((s) => s.id === selectedStudentForRec);

            if (!currentPsych) {
              return (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Brain className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    این دانش‌آموز هنوز آزمون روانشناختی را تکمیل نکرده است
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    به محض اینکه دانش‌آموز از طریق پنل اختصاصی خود به پرسشنامه خودشناسی پاسخ دهد، نمودارها و توصیه‌های ۴ گانه تدریس برای شما نمایش داده خواهد شد.
                  </p>
                </div>
              );
            }

            const primaryHollandLetter = currentPsych.hollandCode.charAt(0) || 'I';
            const recs = getPedagogicalRecommendations(
              currentPsych.learningStyle,
              currentPsych.personalityType,
              primaryHollandLetter,
              currentPsych.varkScores
            );
            const currentAttendance = attendanceRecords.filter((record) => record.studentId === selectedStudentForRec && !record.date);
            const performance = getStudentPerformanceRecommendations(
              gradesSheet.filter((grade) => grade.studentId === selectedStudentForRec),
              currentAttendance
            );

            return (
              <div className="space-y-6">
                {/* Summary badges */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      مشخصات دانش‌آموز: {currentStudentObj?.firstName} {currentStudentObj?.lastName}
                    </h4>
                    {currentPsych.isDemo && <span className="mt-1 inline-block rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">نتیجه‌ی نمونه</span>}
                    <p className="text-xs text-slate-500 mt-0.5">
                      کد هالند: <strong className="text-teal-600 font-mono">{currentPsych.hollandCode}</strong> ({HOLLAND_TITLES[primaryHollandLetter]?.fa})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold">
                      سبک یادگیری: {currentPsych.learningStyle}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold">
                      تیپ شخصیتی: {currentPsych.personalityType}
                    </span>
                  </div>
                </div>

                <section className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">پیشنهاد بر پایه نمره و حضور همین دانش‌آموز</h4>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">شاخص‌ها از رکوردهای درسی و حضور ثبت‌شده محاسبه می‌شوند؛ برای پیگیری آموزشی‌اند و تشخیص یا برچسب دانش‌آموز نیستند.</p>
                    {currentAttendance.some((record) => record.isDemo) && <p className="mt-2 text-[11px] font-bold text-amber-800 dark:text-amber-300">سابقه حضور دارای نشان «نمونه» است؛ آن را با داده واقعی جایگزین کنید.</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                    {[
                      { label: 'میانگین نمره', value: performance.gradeAverage === null ? 'ثبت نشده' : `${toPersianDigits(performance.gradeAverage.toFixed(1))} از ۲۰` },
                      { label: 'غیبت', value: performance.absences === null ? 'ثبت نشده' : `${toPersianDigits(performance.absences)} جلسه` },
                      { label: 'تأخیر', value: performance.tardies === null ? 'ثبت نشده' : `${toPersianDigits(performance.tardies)} مورد` },
                      { label: 'انجام تکلیف', value: performance.homeworkPercent === null ? 'ثبت نشده' : `${toPersianDigits(Math.round(performance.homeworkPercent))}٪` },
                      { label: 'کیفیت تکلیف', value: performance.homeworkQuality === null ? 'ثبت نشده' : `${toPersianDigits(performance.homeworkQuality.toFixed(1))} از ۵` },
                      { label: 'مشارکت کلاسی', value: performance.participation === null ? 'ثبت نشده' : `${toPersianDigits(performance.participation.toFixed(1))} از ۵` },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/70">
                        <span className="block text-[10px] font-bold text-slate-500">{metric.label}</span>
                        <strong className="mt-1 block text-xs text-slate-900 dark:text-slate-100">{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                  {performance.suggestions.length > 0 ? (
                    <ul className="space-y-2">
                      {performance.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2 text-xs leading-6 text-slate-700 dark:text-slate-300"><span className="font-black text-amber-700 dark:text-amber-300">•</span><span>{suggestion}</span></li>)}
                    </ul>
                  ) : (
                    <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                      {performance.gradeAverage === null && performance.absences === null
                        ? 'هنوز اطلاعات کافی از نمره و حضور این دانش‌آموز ثبت نشده است؛ پیشنهاد عملکردی پس از ثبت داده‌ها نمایش داده می‌شود.'
                        : 'با آستانه‌های حمایتی فعلی، اقدام اصلاحی مشخصی لازم نیست؛ پایش و بازخورد منظم را ادامه دهید.'}
                    </p>
                  )}
                </section>

                {/* 4 Practical Recommendation Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Teaching Method */}
                  <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-black text-sm">
                      <BookOpen className="w-4 h-4" />
                      <h4>۱. نحوه تدریس و ارائه مفاهیم در کلاس</h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {recs.teachingMethod}
                    </p>
                  </div>

                  {/* 2. Behavioral Management */}
                  <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-black text-sm">
                      <Users className="w-4 h-4" />
                      <h4>۲. نحوه برخورد رفتاری و انگیزش فردی</h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {recs.behavioralApproach}
                    </p>
                  </div>

                  {/* 3. Homework Design */}
                  <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-black text-sm">
                      <Save className="w-4 h-4" />
                      <h4>۳. طراحی تکالیف و فعالیت‌های منزل</h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {recs.homeworkDesign}
                    </p>
                  </div>

                  {/* 4. Parent Communication */}
                  <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm">
                      <Info className="w-4 h-4" />
                      <h4>۴. نحوه تعامل و بازخورد به والدین</h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {recs.parentCommunication}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: MY PERFORMANCE & EVALUATION SCORE */}
      {activeTab === 'performance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-600" />
              <span>کارنامه عملکرد، میانگین تعدیل‌شده و نتایج ارزیابی دبیر</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مشاهده شفاف نمره ارزیابی ۳۶۰ درجه، میانگین خام نمرات داده‌شده به دانش‌آموزان و میانگین تعدیل‌شده با ضریب سختی درس.
            </p>
          </div>

          {/* Metric Cards */}
          {hasDemoPerformanceData && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              بخشی از ارزیابی‌های این کارنامه داده‌ی نمونه برای نمایش و آزمایش سامانه است.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Raw Average */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 font-bold">میانگین خام نمرات کلاسی:</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {toPersianDigits(rawAverage.toFixed(2))} <span className="text-xs font-normal text-slate-400">از ۲۰</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                میانگین حسابی کل دانش‌آموزان این درس
              </p>
            </div>

            {/* Adjusted Average */}
            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
              <span className="text-xs text-teal-800 dark:text-teal-300 font-bold">
                میانگین تعدیل‌شده (با ضریب سختی {toPersianDigits(currDifficulty)}):
              </span>
              <div className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">
                {toPersianDigits(adjustedAverage.toFixed(2))} <span className="text-xs font-normal text-teal-600">از ۲۰</span>
              </div>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-2">
                محاسبه: میانگین خام × {toPersianDigits(currDifficulty)} (سقف ۲۰)
              </p>
            </div>

            {/* 360 Evaluation Score */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">نمره ارزیابی تجمیعی (۳۶۰ درجه):</span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-2">
                <span>{toPersianDigits((teacherWeightedScore?.finalScore || 0).toFixed(2))}</span>
                <span className="text-xs font-normal text-amber-600">از ۵</span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                وزن‌ها: مدیر ۲۰٪ • معاونین ۴۰٪ • اولیا ۴۰٪
              </p>
            </div>
          </div>

          {/* Detailed Sub-scores Breakdown */}
          {teacherWeightedScore && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                تفکیک نمرات ارزیابی از دیدگاه ارکان مدرسه:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">ارزیابی مدیر (۲۰٪):</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                    {teacherWeightedScore.adminScore ? `${toPersianDigits(teacherWeightedScore.adminScore)} از ۵` : 'هنوز ثبت نشده'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">معاون آموزشی (۲۰٪):</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                    {teacherWeightedScore.academicVpScore ? `${toPersianDigits(teacherWeightedScore.academicVpScore)} از ۵` : 'هنوز ثبت نشده'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">معاون پرورشی (۲۰٪):</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                    {teacherWeightedScore.culturalVpScore ? `${toPersianDigits(teacherWeightedScore.culturalVpScore)} از ۵` : 'هنوز ثبت نشده'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">میانگین اولیا (۴۰٪):</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">
                    {teacherWeightedScore.parentScore
                      ? `${toPersianDigits(teacherWeightedScore.parentScore)} از ۵ (${toPersianDigits(teacherWeightedScore.parentEvaluationsCount)} نظر)`
                      : 'هنوز نظری ثبت نشده'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
