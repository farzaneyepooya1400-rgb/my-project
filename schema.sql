-- MySQL 8.0+ schema for the current Firestore collections.
-- Collection names are mapped to snake_case table names below.
-- IDs from Firestore remain VARCHAR; users.id is auto-increment for PHP account creation.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  school_id BIGINT UNSIGNED NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('sub_admin', 'admin', 'executive_vp', 'academic_vp', 'cultural_vp', 'teacher', 'student', 'parent') NOT NULL,
  username VARCHAR(100) NULL,
  full_name VARCHAR(191) NULL,
  phone VARCHAR(32) NULL,
  linked_id VARCHAR(191) NULL,
  school_name VARCHAR(191) NULL,
  school_code VARCHAR(100) NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_school_role (school_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: gradeLevels
CREATE TABLE IF NOT EXISTS grade_levels (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  grade_order INT NOT NULL,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_grade_levels_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: schoolClasses
CREATE TABLE IF NOT EXISTS school_classes (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  grade_id VARCHAR(191) NOT NULL,
  academic_year VARCHAR(32) NOT NULL,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_school_classes_school (school_id),
  KEY idx_school_classes_grade (school_id, grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: students
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  national_id VARCHAR(32) NOT NULL,
  student_code VARCHAR(100) NOT NULL,
  class_id VARCHAR(191) NOT NULL,
  grade_id VARCHAR(191) NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_school_national_id (school_id, national_id),
  UNIQUE KEY uq_students_school_code (school_id, student_code),
  KEY idx_students_school_class (school_id, class_id),
  KEY idx_students_school_grade (school_id, grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: teachers
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  specialty VARCHAR(191) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  experience_years SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  employment_type ENUM('official', 'contractual', 'hourly', 'corporate') NOT NULL,
  teacher_code VARCHAR(100) NOT NULL,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teachers_school_code (school_id, teacher_code),
  KEY idx_teachers_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: teacherAssignments
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  teacher_id VARCHAR(191) NOT NULL,
  class_id VARCHAR(191) NOT NULL,
  subject VARCHAR(191) NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_teacher_assignments_school_teacher (school_id, teacher_id),
  KEY idx_teacher_assignments_school_class (school_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: studentGrades
CREATE TABLE IF NOT EXISTS student_grades (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  class_id VARCHAR(191) NOT NULL,
  teacher_id VARCHAR(191) NOT NULL,
  subject VARCHAR(191) NOT NULL,
  pre_midterm DECIMAL(5,2) NULL,
  midterm DECIMAL(5,2) NULL,
  post_midterm DECIMAL(5,2) NULL,
  final DECIMAL(5,2) NULL,
  continuous DECIMAL(5,2) NULL,
  continuous_term1 DECIMAL(5,2) NULL,
  term1_exam DECIMAL(5,2) NULL,
  continuous_term2 DECIMAL(5,2) NULL,
  term2_exam DECIMAL(5,2) NULL,
  continuous_term1_mode VARCHAR(16) NULL,
  continuous_term2_mode VARCHAR(16) NULL,
  continuous_grade_mode VARCHAR(16) NULL,
  calculated_average DECIMAL(6,3) NULL,
  assessment_date VARCHAR(40) NULL,
  assessment_term VARCHAR(32) NULL,
  indicator_name VARCHAR(191) NULL,
  indicator_level VARCHAR(16) NULL,
  indicator_score DECIMAL(5,2) NULL,
  behavior_type VARCHAR(16) NULL,
  behavior_note TEXT NULL,
  concept_entries JSON NULL,
  concept_summary JSON NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_student_grades_school_student (school_id, student_id),
  KEY idx_student_grades_school_class (school_id, class_id),
  KEY idx_student_grades_school_teacher (school_id, teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: attendanceRecords
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  class_id VARCHAR(191) NOT NULL,
  month VARCHAR(32) NOT NULL,
  absences INT UNSIGNED NOT NULL DEFAULT 0,
  tardies INT UNSIGNED NOT NULL DEFAULT 0,
  homework_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  homework_quality TINYINT UNSIGNED NOT NULL DEFAULT 0,
  participation TINYINT UNSIGNED NOT NULL DEFAULT 0,
  behavior TINYINT UNSIGNED NOT NULL DEFAULT 0,
  responsibility TINYINT UNSIGNED NOT NULL DEFAULT 0,
  teamwork TINYINT UNSIGNED NOT NULL DEFAULT 0,
  rules_observance TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_attendance_school_student (school_id, student_id),
  KEY idx_attendance_school_class_month (school_id, class_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: psychTestResults
CREATE TABLE IF NOT EXISTS psych_test_results (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  gardner_scores JSON NOT NULL,
  holland_scores JSON NOT NULL,
  vark_scores JSON NULL,
  holland_code VARCHAR(16) NOT NULL,
  learning_style VARCHAR(64) NOT NULL,
  personality_type VARCHAR(64) NOT NULL,
  answers JSON NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  completed_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_psych_results_school_student (school_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: teacherLearningProfiles
CREATE TABLE IF NOT EXISTS teacher_learning_profiles (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  teacher_id VARCHAR(191) NOT NULL,
  teaching_skills JSON NOT NULL,
  classroom_approach JSON NOT NULL,
  answers JSON NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teacher_learning_school_teacher (school_id, teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: schoolAttitudeResults
CREATE TABLE IF NOT EXISTS school_attitude_results (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  answers JSON NOT NULL,
  domain_scores JSON NOT NULL,
  overall_score DECIMAL(6,3) NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  completed_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_attitude_school_student (school_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: schoolTuitionPayments
CREATE TABLE IF NOT EXISTS school_tuition_payments (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NULL,
  payer_name VARCHAR(191) NULL,
  amount_toman BIGINT UNSIGNED NOT NULL,
  month VARCHAR(32) NOT NULL,
  school_year VARCHAR(32) NOT NULL,
  category VARCHAR(100) NOT NULL,
  payment_method ENUM('cash', 'card_reader', 'transfer', 'check') NOT NULL,
  paid_at VARCHAR(40) NOT NULL,
  receipt_code VARCHAR(100) NULL,
  note TEXT NULL,
  created_at VARCHAR(40) NULL,
  created_by VARCHAR(191) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tuition_school_student (school_id, student_id),
  KEY idx_tuition_school_year_month (school_id, school_year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: schoolExpenses
CREATE TABLE IF NOT EXISTS school_expenses (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(191) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount_toman BIGINT UNSIGNED NOT NULL,
  month VARCHAR(32) NOT NULL,
  school_year VARCHAR(32) NOT NULL,
  payment_method ENUM('cash', 'card_reader', 'transfer', 'check') NOT NULL,
  paid_at VARCHAR(40) NOT NULL,
  receipt_code VARCHAR(100) NULL,
  note TEXT NULL,
  created_at VARCHAR(40) NULL,
  created_by VARCHAR(191) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_expenses_school_year_month (school_id, school_year, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: familyProfiles
CREATE TABLE IF NOT EXISTS family_profiles (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  father_education VARCHAR(100) NOT NULL,
  father_job VARCHAR(191) NOT NULL,
  mother_education VARCHAR(100) NOT NULL,
  mother_job VARCHAR(191) NOT NULL,
  children_count TINYINT UNSIGNED NOT NULL,
  marital_status VARCHAR(32) NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  calculated_bmi DECIMAL(5,2) NOT NULL,
  sleep_hour VARCHAR(32) NOT NULL,
  screen_time_hours DECIMAL(5,2) NOT NULL,
  breakfast_status VARCHAR(32) NOT NULL,
  has_vision_hearing_issue TINYINT(1) NOT NULL DEFAULT 0,
  sensory_issue_details TEXT NULL,
  distance_to_school_km DECIMAL(7,2) NOT NULL,
  commute_method VARCHAR(64) NOT NULL,
  home_responsibility_score TINYINT UNSIGNED NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_family_profiles_school_student (school_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: teacherEvaluations
CREATE TABLE IF NOT EXISTS teacher_evaluations (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  teacher_id VARCHAR(191) NOT NULL,
  evaluator_role ENUM('admin', 'academic_vp', 'cultural_vp', 'parent') NOT NULL,
  evaluator_id VARCHAR(191) NOT NULL,
  evaluator_name VARCHAR(191) NULL,
  scores JSON NOT NULL,
  average_score DECIMAL(5,2) NOT NULL,
  notes TEXT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_teacher_evaluations_school_teacher (school_id, teacher_id),
  KEY idx_teacher_evaluations_school_evaluator (school_id, evaluator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: studentStaffEvaluations
CREATE TABLE IF NOT EXISTS student_staff_evaluations (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  target_id VARCHAR(191) NOT NULL,
  target_role ENUM('teacher', 'admin', 'academic_vp', 'cultural_vp') NOT NULL,
  scores JSON NOT NULL,
  average_score DECIMAL(5,2) NOT NULL,
  notes TEXT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_staff_evaluations_school_student (school_id, student_id),
  KEY idx_staff_evaluations_school_target (school_id, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: subjectDifficulties
CREATE TABLE IF NOT EXISTS subject_difficulties (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(191) NOT NULL,
  grade_id VARCHAR(191) NULL,
  track VARCHAR(100) NULL,
  education_level VARCHAR(191) NULL,
  category VARCHAR(64) NULL,
  is_custom TINYINT(1) NOT NULL DEFAULT 0,
  coefficient DECIMAL(6,3) NOT NULL,
  rationale TEXT NOT NULL,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_subject_difficulties_school_subject (school_id, subject),
  KEY idx_subject_difficulties_school_grade (school_id, grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: extracurricularActivities
CREATE TABLE IF NOT EXISTS extracurricular_activities (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  class_id VARCHAR(191) NOT NULL,
  month VARCHAR(32) NOT NULL,
  title VARCHAR(191) NULL,
  activity_date VARCHAR(40) NULL,
  category VARCHAR(32) NULL,
  participants INT UNSIGNED NULL,
  description TEXT NULL,
  artistic DECIMAL(6,3) NOT NULL,
  sports DECIMAL(6,3) NOT NULL,
  skills DECIMAL(6,3) NOT NULL,
  scientific DECIMAL(6,3) NOT NULL,
  monthly_average DECIMAL(6,3) NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  updated_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_extracurricular_school_class_month (school_id, class_id, month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: schoolCalendarEvents
CREATE TABLE IF NOT EXISTS school_calendar_events (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  event_date VARCHAR(40) NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NULL,
  kind VARCHAR(32) NOT NULL,
  created_by VARCHAR(191) NOT NULL,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_calendar_school_date (school_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: schoolWideActivities
CREATE TABLE IF NOT EXISTS school_wide_activities (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(191) NOT NULL,
  activity_date VARCHAR(40) NOT NULL,
  month VARCHAR(32) NOT NULL,
  category VARCHAR(32) NOT NULL,
  participants INT UNSIGNED NOT NULL DEFAULT 0,
  description TEXT NULL,
  created_by VARCHAR(191) NOT NULL,
  created_at VARCHAR(40) NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_school_activities_school_date (school_id, activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: prayerSurveyResponses
CREATE TABLE IF NOT EXISTS prayer_survey_responses (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(191) NOT NULL,
  class_id VARCHAR(191) NOT NULL,
  answers JSON NOT NULL,
  submitted_at VARCHAR(40) NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_prayer_responses_school_student (school_id, student_id),
  KEY idx_prayer_responses_school_class (school_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Firestore: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(191) NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(191) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('grade', 'meeting', 'vp_message', 'attendance', 'general') NOT NULL,
  sender_role VARCHAR(32) NULL,
  sender_name VARCHAR(191) NULL,
  target_role VARCHAR(32) NULL,
  target_student_id VARCHAR(191) NULL,
  target_class_id VARCHAR(191) NULL,
  read_by JSON NOT NULL,
  created_at VARCHAR(40) NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_school_created (school_id, created_at),
  KEY idx_notifications_school_target_role (school_id, target_role),
  KEY idx_notifications_school_target_student (school_id, target_student_id),
  KEY idx_notifications_school_target_class (school_id, target_class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
