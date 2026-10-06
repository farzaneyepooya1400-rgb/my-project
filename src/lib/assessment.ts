import type { AssessmentConceptEntry, AssessmentLevel, StudentGrade } from '../types';

export const LEVEL_SCORE_MAP: Record<AssessmentLevel, number> = {
  good: 18,
  medium: 12,
  weak: 7,
};

export const LEVEL_LABELS: Record<AssessmentLevel, string> = {
  good: 'خوب',
  medium: 'متوسط',
  weak: 'ضعیف',
};

export const getLevelScore = (level: AssessmentLevel): number => LEVEL_SCORE_MAP[level];

export const inferAssessmentTermFromDate = (dateInput?: string): 'midterm1' | 'midterm2' => {
  if (!dateInput) return 'midterm1';
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return 'midterm1';
  const month = parsed.getMonth() + 1;
  return month <= 6 ? 'midterm1' : 'midterm2';
};

export const buildConceptSummary = (entries: AssessmentConceptEntry[] = []) => ({
  good: entries.filter((entry) => entry.level === 'good').map((entry) => entry.name),
  medium: entries.filter((entry) => entry.level === 'medium').map((entry) => entry.name),
  weak: entries.filter((entry) => entry.level === 'weak').map((entry) => entry.name),
});

export const getAverageIndicatorScore = (entries: AssessmentConceptEntry[] = []) => {
  const assessedEntries = entries.filter((entry) => entry.level && typeof entry.score === 'number');
  if (!assessedEntries.length) return 0;
  return assessedEntries.reduce((total, entry) => total + entry.score!, 0) / assessedEntries.length;
};

export const getIndicatorContinuousAverages = (entries: AssessmentConceptEntry[] = []) => {
  const scoresByTermAndSession = new Map<string, { term: 'midterm1' | 'midterm2'; scores: number[] }>();

  for (const entry of entries) {
    if (!entry.level || typeof entry.score !== 'number') continue;
    const term = entry.assessmentTerm ?? inferAssessmentTermFromDate(entry.date);
    const sessionKey = entry.sessionId ?? `legacy:${entry.date}:${term}`;
    const key = `${term}:${sessionKey}`;
    const session = scoresByTermAndSession.get(key) ?? { term, scores: [] };
    session.scores.push(entry.score);
    scoresByTermAndSession.set(key, session);
  }

  const sessionAverages = Array.from(scoresByTermAndSession.values()).map((session) => ({
    term: session.term,
    score: session.scores.reduce((sum, score) => sum + score, 0) / session.scores.length,
  }));
  const averageForTerm = (term: 'midterm1' | 'midterm2') => {
    const sessions = sessionAverages.filter((session) => session.term === term);
    return sessions.length
      ? Math.round((sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length) * 100) / 100
      : null;
  };

  return {
    continuousTerm1: averageForTerm('midterm1'),
    continuousTerm2: averageForTerm('midterm2'),
  };
};

export const calculateAnnualGrade = (scores: {
  continuousTerm1?: number | null;
  term1Exam?: number | null;
  continuousTerm2?: number | null;
  term2Exam?: number | null;
}) => {
  const values = [scores.continuousTerm1, scores.term1Exam, scores.continuousTerm2, scores.term2Exam];
  if (values.some((value) => value === undefined || value === null)) return null;
  const [continuousTerm1, term1Exam, continuousTerm2, term2Exam] = values as number[];
  return Math.round(((continuousTerm1 + 2 * term1Exam + continuousTerm2 + 4 * term2Exam) / 8) * 100) / 100;
};

export const getIndicatorLevelFromAverage = (value: number): AssessmentLevel => {
  if (value >= 15) return 'good';
  if (value >= 10) return 'medium';
  return 'weak';
};

export const buildSubjectConceptMap = (grades: StudentGrade[]) => {
  const map = new Map<string, AssessmentConceptEntry[]>();

  for (const grade of grades) {
    if (!grade.conceptEntries?.length) continue;
    const records = map.get(grade.subject) ?? [];
    records.push(...grade.conceptEntries.map((entry) => ({
      ...entry,
      assessmentTerm: entry.assessmentTerm ?? grade.assessmentTerm,
      behaviorType: entry.behaviorType ?? grade.behaviorType,
      behaviorNote: entry.behaviorNote ?? grade.behaviorNote,
    })));
    map.set(grade.subject, records);
  }

  return map;
};
