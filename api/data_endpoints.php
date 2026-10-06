<?php
declare(strict_types=1);

function data_roles(): array
{
    return ['sub_admin', 'admin', 'executive_vp', 'academic_vp', 'cultural_vp', 'teacher', 'student', 'parent'];
}

function data_managers(): array
{
    return ['sub_admin', 'admin'];
}

function data_policies(): array
{
    $all = data_roles();
    $managers = data_managers();
    $learning = ['sub_admin', 'admin', 'academic_vp', 'cultural_vp', 'teacher', 'student', 'parent'];
    $policies = [
        'users' => ['table' => 'users', 'fields' => ['email', 'role', 'username', 'full_name', 'phone', 'linked_id', 'school_name', 'school_code', 'is_demo', 'created_at'], 'json' => [], 'read' => $managers, 'write' => [], 'delete' => [], 'scope' => 'users'],
        'gradeLevels' => ['table' => 'grade_levels', 'fields' => ['name', 'grade_order', 'created_at'], 'json' => [], 'aliases' => ['grade_order' => 'order'], 'read' => $all, 'write' => ['sub_admin', 'admin', 'executive_vp'], 'delete' => $managers, 'scope' => 'school'],
        'schoolClasses' => ['table' => 'school_classes', 'fields' => ['name', 'grade_id', 'academic_year', 'created_at'], 'json' => [], 'read' => $all, 'write' => ['sub_admin', 'admin', 'executive_vp'], 'delete' => $managers, 'scope' => 'class'],
        'students' => ['table' => 'students', 'fields' => ['first_name', 'last_name', 'national_id', 'student_code', 'class_id', 'grade_id', 'is_demo', 'created_at'], 'json' => [], 'read' => $all, 'write' => $managers, 'delete' => $managers, 'scope' => 'student'],
        'teachers' => ['table' => 'teachers', 'fields' => ['full_name', 'specialty', 'degree', 'experience_years', 'employment_type', 'teacher_code', 'created_at'], 'json' => [], 'read' => $all, 'write' => $managers, 'delete' => $managers, 'scope' => 'teacher'],
        'teacherAssignments' => ['table' => 'teacher_assignments', 'fields' => ['teacher_id', 'class_id', 'subject', 'is_demo', 'created_at'], 'json' => [], 'read' => $all, 'write' => $managers, 'delete' => $managers, 'scope' => 'assignment'],
        'studentGrades' => ['table' => 'student_grades', 'fields' => ['student_id', 'class_id', 'teacher_id', 'subject', 'pre_midterm', 'midterm', 'post_midterm', 'final', 'continuous', 'continuous_term1', 'term1_exam', 'continuous_term2', 'term2_exam', 'continuous_term1_mode', 'continuous_term2_mode', 'continuous_grade_mode', 'calculated_average', 'assessment_date', 'assessment_term', 'indicator_name', 'indicator_level', 'indicator_score', 'behavior_type', 'behavior_note', 'concept_entries', 'concept_summary', 'is_demo', 'updated_at'], 'json' => ['concept_entries', 'concept_summary'], 'read' => $learning, 'write' => ['sub_admin', 'admin', 'teacher'], 'delete' => ['sub_admin', 'admin', 'teacher'], 'scope' => 'student_record'],
        'attendanceRecords' => ['table' => 'attendance_records', 'fields' => ['student_id', 'class_id', 'month', 'absences', 'tardies', 'homework_percent', 'homework_quality', 'participation', 'behavior', 'responsibility', 'teamwork', 'rules_observance', 'is_demo', 'updated_at'], 'json' => [], 'read' => $learning, 'write' => ['sub_admin', 'admin', 'teacher'], 'delete' => ['sub_admin', 'admin', 'teacher'], 'scope' => 'student_record'],
        'psychTestResults' => ['table' => 'psych_test_results', 'fields' => ['student_id', 'gardner_scores', 'holland_scores', 'vark_scores', 'holland_code', 'learning_style', 'personality_type', 'answers', 'is_demo', 'completed_at'], 'json' => ['gardner_scores', 'holland_scores', 'vark_scores', 'answers'], 'read' => $learning, 'write' => ['sub_admin', 'admin', 'student'], 'delete' => $managers, 'scope' => 'student_record'],
        'teacherLearningProfiles' => ['table' => 'teacher_learning_profiles', 'fields' => ['teacher_id', 'teaching_skills', 'classroom_approach', 'answers', 'is_demo', 'updated_at'], 'json' => ['teaching_skills', 'classroom_approach', 'answers'], 'read' => ['sub_admin', 'admin', 'academic_vp', 'teacher'], 'write' => ['sub_admin', 'admin', 'teacher'], 'delete' => $managers, 'scope' => 'teacher_record'],
        'schoolAttitudeResults' => ['table' => 'school_attitude_results', 'fields' => ['student_id', 'answers', 'domain_scores', 'overall_score', 'is_demo', 'completed_at'], 'json' => ['answers', 'domain_scores'], 'read' => ['sub_admin', 'admin', 'academic_vp', 'cultural_vp', 'student', 'parent'], 'write' => ['sub_admin', 'admin', 'student'], 'delete' => $managers, 'scope' => 'student_record'],
        'schoolTuitionPayments' => ['table' => 'school_tuition_payments', 'fields' => ['student_id', 'payer_name', 'amount_toman', 'month', 'school_year', 'category', 'payment_method', 'paid_at', 'receipt_code', 'note', 'created_at', 'created_by'], 'json' => [], 'read' => ['sub_admin', 'admin', 'executive_vp'], 'write' => ['sub_admin', 'admin', 'executive_vp'], 'delete' => ['sub_admin', 'admin', 'executive_vp'], 'scope' => 'school'],
        'schoolExpenses' => ['table' => 'school_expenses', 'fields' => ['title', 'category', 'amount_toman', 'month', 'school_year', 'payment_method', 'paid_at', 'receipt_code', 'note', 'created_at', 'created_by'], 'json' => [], 'read' => ['sub_admin', 'admin', 'executive_vp'], 'write' => ['sub_admin', 'admin', 'executive_vp'], 'delete' => ['sub_admin', 'admin', 'executive_vp'], 'scope' => 'school'],
        'familyProfiles' => ['table' => 'family_profiles', 'fields' => ['student_id', 'father_education', 'father_job', 'mother_education', 'mother_job', 'children_count', 'marital_status', 'height_cm', 'weight_kg', 'calculated_bmi', 'sleep_hour', 'screen_time_hours', 'breakfast_status', 'has_vision_hearing_issue', 'sensory_issue_details', 'distance_to_school_km', 'commute_method', 'home_responsibility_score', 'is_demo', 'updated_at'], 'json' => [], 'read' => ['sub_admin', 'admin', 'parent'], 'write' => ['sub_admin', 'admin', 'parent'], 'delete' => $managers, 'scope' => 'student_record'],
        'teacherEvaluations' => ['table' => 'teacher_evaluations', 'fields' => ['teacher_id', 'evaluator_role', 'evaluator_id', 'evaluator_name', 'scores', 'average_score', 'notes', 'is_demo', 'updated_at'], 'json' => ['scores'], 'read' => ['sub_admin', 'admin', 'academic_vp', 'cultural_vp', 'teacher', 'parent'], 'write' => ['sub_admin', 'admin', 'academic_vp', 'cultural_vp', 'parent'], 'delete' => $managers, 'scope' => 'teacher_evaluation'],
        'studentStaffEvaluations' => ['table' => 'student_staff_evaluations', 'fields' => ['student_id', 'target_id', 'target_role', 'scores', 'average_score', 'notes', 'is_demo', 'updated_at'], 'json' => ['scores'], 'read' => ['sub_admin', 'admin', 'teacher', 'student'], 'write' => ['sub_admin', 'admin', 'student'], 'delete' => $managers, 'scope' => 'staff_evaluation'],
        'subjectDifficulties' => ['table' => 'subject_difficulties', 'fields' => ['subject', 'grade_id', 'track', 'education_level', 'category', 'is_custom', 'coefficient', 'rationale', 'updated_at'], 'json' => [], 'read' => $all, 'write' => $managers, 'delete' => $managers, 'scope' => 'school'],
        'extracurricularActivities' => ['table' => 'extracurricular_activities', 'fields' => ['class_id', 'month', 'title', 'activity_date', 'category', 'participants', 'description', 'artistic', 'sports', 'skills', 'scientific', 'monthly_average', 'is_demo', 'updated_at'], 'json' => [], 'aliases' => ['activity_date' => 'date'], 'read' => $all, 'write' => ['sub_admin', 'admin', 'cultural_vp'], 'delete' => ['sub_admin', 'admin', 'cultural_vp'], 'scope' => 'class_record'],
        'schoolCalendarEvents' => ['table' => 'school_calendar_events', 'fields' => ['event_date', 'title', 'description', 'kind', 'created_by', 'created_at'], 'json' => [], 'aliases' => ['event_date' => 'date'], 'read' => $all, 'write' => ['sub_admin', 'admin', 'cultural_vp'], 'delete' => ['sub_admin', 'admin', 'cultural_vp'], 'scope' => 'created_record'],
        'schoolWideActivities' => ['table' => 'school_wide_activities', 'fields' => ['title', 'activity_date', 'month', 'category', 'participants', 'description', 'created_by', 'created_at', 'is_demo'], 'json' => [], 'aliases' => ['activity_date' => 'date'], 'read' => $all, 'write' => ['sub_admin', 'admin', 'cultural_vp'], 'delete' => ['sub_admin', 'admin', 'cultural_vp'], 'scope' => 'created_record'],
        'prayerSurveyResponses' => ['table' => 'prayer_survey_responses', 'fields' => ['student_id', 'class_id', 'answers', 'submitted_at', 'is_demo'], 'json' => ['answers'], 'read' => ['sub_admin', 'admin', 'academic_vp', 'cultural_vp', 'student', 'parent'], 'write' => ['sub_admin', 'admin', 'student'], 'delete' => $managers, 'scope' => 'student_record'],
        'notifications' => ['table' => 'notifications', 'fields' => ['title', 'message', 'type', 'sender_role', 'sender_name', 'target_role', 'target_student_id', 'target_class_id', 'read_by', 'created_at'], 'json' => ['read_by'], 'read' => $all, 'write' => ['sub_admin', 'admin', 'academic_vp', 'cultural_vp', 'teacher'], 'delete' => $managers, 'scope' => 'notification'],
    ];

    foreach ($policies as $collection => &$policy) {
        $policy['collection'] = $collection;
        $policy['columns'] = array_fill_keys(array_merge(['id'], $policy['fields']), true);
    }
    unset($policy);
    return $policies;
}

function data_authenticate(PDO $pdo, string $tokenSecret): array
{
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+([A-Za-z0-9_.-]+)$/i', $authorization, $matches)) {
        unauthorized();
    }

    $parts = explode('.', $matches[1]);
    if (count($parts) !== 2) {
        unauthorized();
    }

    [$payload, $signature] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', $payload, $tokenSecret, true));
    if (!hash_equals($expected, $signature)) {
        unauthorized();
    }

    $normalized = strtr($payload, '-_', '+/');
    $normalized .= str_repeat('=', (4 - strlen($normalized) % 4) % 4);
    $json = base64_decode($normalized, true);
    $claims = $json === false ? null : json_decode($json, true);
    if (!is_array($claims)
        || !isset($claims['sub'], $claims['exp'])
        || !is_numeric($claims['sub'])
        || !is_numeric($claims['exp'])
        || (int)$claims['exp'] <= time()) {
        unauthorized();
    }

    $statement = $pdo->prepare(
        'SELECT id, school_id, email, role, linked_id, full_name '
        . 'FROM users WHERE id = :user_id LIMIT 1'
    );
    $statement->execute(['user_id' => (string)$claims['sub']]);
    $user = $statement->fetch();
    if (!$user || !in_array($user['role'], data_roles(), true) || (int)$user['school_id'] < 1) {
        unauthorized();
    }

    $user['id'] = (string)$user['id'];
    $user['school_id'] = (string)$user['school_id'];
    return $user;
}

function data_user_context(PDO $pdo, array $user): array
{
    $context = ['student_id' => null, 'student_code' => null, 'class_id' => null, 'teacher_id' => null, 'class_ids' => []];
    if (in_array($user['role'], ['student', 'parent'], true) && !empty($user['linked_id'])) {
        $statement = $pdo->prepare(
            'SELECT id, student_code, class_id FROM students '
            . 'WHERE school_id = :school_id AND (student_code = :student_code OR national_id = :national_id) LIMIT 1'
        );
        $statement->execute([
            'school_id' => $user['school_id'],
            'student_code' => $user['linked_id'],
            'national_id' => $user['linked_id'],
        ]);
        $student = $statement->fetch();
        if ($student) {
            $context['student_id'] = (string)$student['id'];
            $context['student_code'] = (string)$student['student_code'];
            $context['class_id'] = (string)$student['class_id'];
        }
    }

    if ($user['role'] === 'teacher' && !empty($user['linked_id'])) {
        $statement = $pdo->prepare(
            'SELECT id FROM teachers WHERE school_id = :school_id AND teacher_code = :teacher_code LIMIT 1'
        );
        $statement->execute(['school_id' => $user['school_id'], 'teacher_code' => $user['linked_id']]);
        $teacher = $statement->fetch();
        if ($teacher) {
            $context['teacher_id'] = (string)$teacher['id'];
            $statement = $pdo->prepare(
                'SELECT class_id FROM teacher_assignments '
                . 'WHERE school_id = :school_id AND teacher_id = :teacher_id'
            );
            $statement->execute(['school_id' => $user['school_id'], 'teacher_id' => $context['teacher_id']]);
            $context['class_ids'] = array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN));
        }
    }

    return $context;
}

function data_visibility(PDO $pdo, array $policy, array $user, array $context, string $operation = 'read'): array
{
    $scope = $policy['scope'];
    $role = $user['role'];
    if (in_array($role, data_managers(), true) || $scope === 'school' || $scope === 'users') {
        if ($scope === 'users' && !in_array($role, data_managers(), true)) {
            return ['1 = 0', []];
        }
        return ['1 = 1', []];
    }

    if ($role === 'teacher') {
        if ($scope === 'teacher') {
            return $context['teacher_id'] ? ['id = :visible_teacher_id', ['visible_teacher_id' => $context['teacher_id']]] : ['1 = 0', []];
        }
        if ($scope === 'assignment') {
            return $context['teacher_id'] ? ['teacher_id = :visible_teacher_id', ['visible_teacher_id' => $context['teacher_id']]] : ['1 = 0', []];
        }
        if ($scope === 'class') {
            return $context['class_ids'] ? data_in_filter('id', $context['class_ids'], 'visible_class_') : ['1 = 0', []];
        }
        if ($scope === 'student') {
            return $context['class_ids'] ? data_in_filter('class_id', $context['class_ids'], 'visible_student_class_') : ['1 = 0', []];
        }
        if ($scope === 'teacher_record' || $scope === 'teacher_evaluation') {
            return $context['teacher_id'] ? ['teacher_id = :visible_teacher_id', ['visible_teacher_id' => $context['teacher_id']]] : ['1 = 0', []];
        }
        if ($scope === 'staff_evaluation') {
            return $context['teacher_id'] ? ['target_id = :visible_target_id', ['visible_target_id' => $context['teacher_id']]] : ['1 = 0', []];
        }
        if ($scope === 'student_record' || $scope === 'class_record') {
            if (!$context['class_ids']) {
                return ['1 = 0', []];
            }
            if ($scope === 'student_record' && $policy['collection'] === 'psychTestResults') {
                [$classFilter, $classParams] = data_in_filter('visible_student.class_id', $context['class_ids'], 'visible_psych_class_');
                return ['student_id IN (SELECT visible_student.id FROM students AS visible_student WHERE visible_student.school_id = :visible_psych_school_id AND ' . $classFilter . ')', array_merge(['visible_psych_school_id' => $user['school_id']], $classParams)];
            }
            return data_in_filter('class_id', $context['class_ids'], 'visible_record_class_');
        }
        if ($scope === 'notification') {
            return ["(target_role IS NULL OR target_role = 'all' OR target_role = :visible_role) AND (target_class_id IS NULL OR target_class_id IN (SELECT class_id FROM teacher_assignments WHERE school_id = :visible_school_id AND teacher_id = :visible_teacher_id)) AND (target_student_id IS NULL OR EXISTS (SELECT 1 FROM students AS visible_student JOIN teacher_assignments AS visible_assignment ON visible_assignment.school_id = visible_student.school_id AND visible_assignment.class_id = visible_student.class_id WHERE visible_student.school_id = :visible_student_school AND (visible_student.id = notifications.target_student_id OR visible_student.student_code = notifications.target_student_id) AND visible_assignment.school_id = :visible_assignment_school AND visible_assignment.teacher_id = :visible_assignment_teacher_id))", [
                'visible_role' => $role,
                'visible_school_id' => $user['school_id'],
                'visible_teacher_id' => $context['teacher_id'] ?? '',
                'visible_student_school' => $user['school_id'],
                'visible_assignment_school' => $user['school_id'],
                'visible_assignment_teacher_id' => $context['teacher_id'] ?? '',
            ]];
        }
    }

    if ($role === 'student' || $role === 'parent') {
        if ($scope === 'student') {
            return $context['student_id'] ? ['id = :visible_student_id', ['visible_student_id' => $context['student_id']]] : ['1 = 0', []];
        }
        if ($scope === 'class') {
            return $context['class_id'] ? ['id = :visible_class_id', ['visible_class_id' => $context['class_id']]] : ['1 = 0', []];
        }
        if ($scope === 'teacher') {
            if (!$context['class_id']) return ['1 = 0', []];
            return ['id IN (SELECT teacher_id FROM teacher_assignments WHERE school_id = :visible_school_id AND class_id = :visible_class_id)', [
                'visible_school_id' => $user['school_id'], 'visible_class_id' => $context['class_id'],
            ]];
        }
        if ($scope === 'assignment') {
            return $context['class_id'] ? ['class_id = :visible_class_id', ['visible_class_id' => $context['class_id']]] : ['1 = 0', []];
        }
        if ($scope === 'student_record') {
            return $context['student_id'] ? ['student_id = :visible_student_id', ['visible_student_id' => $context['student_id']]] : ['1 = 0', []];
        }
        if ($scope === 'student_class' || $scope === 'class_record') {
            return $context['class_id'] ? ['class_id = :visible_class_id', ['visible_class_id' => $context['class_id']]] : ['1 = 0', []];
        }
        if ($scope === 'teacher_record') {
            return ['1 = 0', []];
        }
        if ($scope === 'teacher_evaluation') {
            if ($role === 'parent' && $context['class_id']) {
                return ['teacher_id IN (SELECT teacher_id FROM teacher_assignments WHERE school_id = :visible_school_id AND class_id = :visible_class_id) OR evaluator_id = :visible_user_id', [
                    'visible_school_id' => $user['school_id'], 'visible_class_id' => $context['class_id'], 'visible_user_id' => $user['id'],
                ]];
            }
            return ['evaluator_id = :visible_user_id', ['visible_user_id' => $user['id']]];
        }
        if ($scope === 'staff_evaluation') {
            if ($role === 'student') {
                return $context['student_id'] ? ['student_id = :visible_student_id', ['visible_student_id' => $context['student_id']]] : ['1 = 0', []];
            }
            return ['1 = 0', []];
        }
        if ($scope === 'notification') {
            return ["(target_role IS NULL OR target_role = 'all' OR target_role = :visible_role) AND (target_student_id IS NULL OR target_student_id IN (:visible_student_id, :visible_student_code)) AND (target_class_id IS NULL OR target_class_id = :visible_class_id)", [
                'visible_role' => $role,
                'visible_student_id' => $context['student_id'] ?? '',
                'visible_student_code' => $context['student_code'] ?? '',
                'visible_class_id' => $context['class_id'] ?? '',
            ]];
        }
    }

    if ($role === 'cultural_vp' && $scope === 'created_record' && $operation !== 'read') {
        return ['created_by = :visible_creator_id', ['visible_creator_id' => $user['id']]];
    }

    return ['1 = 1', []];
}

function data_query(PDO $pdo, string $sql, array $params): PDOStatement
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement;
}

function data_in_filter(string $column, array $values, string $prefix): array
{
    $placeholders = [];
    $params = [];
    foreach (array_values($values) as $index => $value) {
        $name = $prefix . $index;
        $placeholders[] = ':' . $name;
        $params[$name] = $value;
    }
    return [$column . ' IN (' . implode(', ', $placeholders) . ')', $params];
}

function data_rows(PDO $pdo, array $policy, array $user, array $context): array
{
    if (!in_array($user['role'], $policy['read'], true)) {
        return [];
    }
    [$visibility, $visibilityParams] = data_visibility($pdo, $policy, $user, $context);
    $table = $policy['table'];
    if ($table === 'users') {
        $columns = 'id, school_id, email, role, username, full_name, phone, linked_id, school_name, school_code, is_demo, created_at';
    } else {
        $columns = '*';
    }
    $sql = 'SELECT ' . $columns . ' FROM `' . $table . '` WHERE school_id = :school_id AND (' . $visibility . ')';
    $statement = data_query($pdo, $sql, array_merge(['school_id' => $user['school_id']], $visibilityParams));

    $rows = [];
    foreach ($statement->fetchAll() as $row) {
        $record = [];
        foreach ($row as $column => $value) {
            if ($column === 'school_id') {
                continue;
            }
            $key = $policy['aliases'][$column] ?? preg_replace_callback('/_([a-z])/', static fn(array $match): string => strtoupper($match[1]), $column);
            if (in_array($column, $policy['json'], true) && is_string($value)) {
                $decoded = json_decode($value, true);
                $value = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
            }
            if ($column === 'id') $value = (string)$value;
            if ($column === 'is_demo') $value = (bool)$value;
            $record[$key] = $value;
        }
        $rows[] = $record;
    }
    return $rows;
}

function data_permission(array $policy, array $user, string $operation): void
{
    if (!in_array($user['role'], $policy[$operation], true)) {
        respond(403, ['error' => 'forbidden']);
    }
}

function data_table(array $policies, mixed $collection): array
{
    if (!is_string($collection) || !isset($policies[$collection])) {
        respond(400, ['error' => 'invalid']);
    }
    return $policies[$collection];
}

function data_own_student_id(PDO $pdo, array $user, array $context): string
{
    if (!$context['student_id']) respond(403, ['error' => 'forbidden']);
    return $context['student_id'];
}

function data_own_teacher_id(array $user, array $context): string
{
    if (!$context['teacher_id']) respond(403, ['error' => 'forbidden']);
    return $context['teacher_id'];
}

function data_relation_exists(PDO $pdo, string $table, string $id, array $user): bool
{
    $allowedTables = [
        'students' => 'students',
        'school_classes' => 'school_classes',
        'grade_levels' => 'grade_levels',
        'teachers' => 'teachers',
    ];
    if (!isset($allowedTables[$table])) return false;
    $statement = data_query(
        $pdo,
        'SELECT id FROM `' . $allowedTables[$table] . '` WHERE school_id = :school_id AND id = :id LIMIT 1',
        ['school_id' => $user['school_id'], 'id' => $id]
    );
    return (bool)$statement->fetchColumn();
}

function data_validate_relations(PDO $pdo, string $collection, array $record, array $user): void
{
    $relations = [
        'student_id' => 'students',
        'class_id' => 'school_classes',
        'grade_id' => 'grade_levels',
        'teacher_id' => 'teachers',
        'target_student_id' => 'students',
        'target_class_id' => 'school_classes',
    ];
    foreach ($relations as $column => $table) {
        if (isset($record[$column]) && !data_relation_exists($pdo, $table, (string)$record[$column], $user)) {
            respond(400, ['error' => 'invalid']);
        }
    }

    if (isset($record['target_id'], $record['target_role'])) {
        $targetTable = match ($record['target_role']) {
            'teacher' => 'teachers',
            'admin', 'academic_vp', 'cultural_vp' => 'users',
            default => null,
        };
        if ($targetTable === null) respond(400, ['error' => 'invalid']);
        if ($targetTable === 'users') {
            $statement = data_query($pdo, 'SELECT id FROM users WHERE school_id = :school_id AND id = :id LIMIT 1', [
                'school_id' => $user['school_id'], 'id' => (string)$record['target_id'],
            ]);
            if (!$statement->fetchColumn()) respond(400, ['error' => 'invalid']);
        } elseif (!data_relation_exists($pdo, $targetTable, (string)$record['target_id'], $user)) {
            respond(400, ['error' => 'invalid']);
        }
    }
}

function data_teacher_owns_class(PDO $pdo, array $user, array $context, string $classId): bool
{
    if (!$context['teacher_id']) return false;
    $statement = data_query($pdo,
        'SELECT id FROM teacher_assignments WHERE school_id = :school_id AND teacher_id = :teacher_id AND class_id = :class_id LIMIT 1',
        ['school_id' => $user['school_id'], 'teacher_id' => $context['teacher_id'], 'class_id' => $classId]
    );
    return (bool)$statement->fetchColumn();
}

function data_guard_write(PDO $pdo, string $collection, array &$record, array $user, array $context): void
{
    $role = $user['role'];
    if (in_array($role, ['student', 'parent'], true)) {
        $studentId = data_own_student_id($pdo, $user, $context);
        if ($collection === 'familyProfiles' && $role === 'parent') $record['student_id'] = $studentId;
        if ($collection === 'studentGrades' || $collection === 'attendanceRecords' || $collection === 'psychTestResults'
            || $collection === 'schoolAttitudeResults' || $collection === 'prayerSurveyResponses'
            || $collection === 'studentStaffEvaluations') {
            if ($role !== 'student' && !in_array($collection, ['familyProfiles'], true)) respond(403, ['error' => 'forbidden']);
            $record['student_id'] = $studentId;
        }
        if ($collection === 'teacherEvaluations' && $role === 'parent') {
            $record['evaluator_id'] = $user['id'];
            $record['evaluator_role'] = 'parent';
            $record['evaluator_name'] = (string)($user['full_name'] ?? '');
            if (empty($context['class_id']) || empty($record['teacher_id'])) respond(400, ['error' => 'invalid']);
            $statement = data_query($pdo,
                'SELECT id FROM teacher_assignments WHERE school_id = :school_id AND teacher_id = :teacher_id AND class_id = :class_id LIMIT 1',
                ['school_id' => $user['school_id'], 'teacher_id' => $record['teacher_id'], 'class_id' => $context['class_id']]
            );
            if (!$statement->fetchColumn()) respond(403, ['error' => 'forbidden']);
        }
        if ($collection === 'studentStaffEvaluations' && $role === 'student') $record['student_id'] = $studentId;
    }

    if ($role === 'teacher') {
        $teacherId = data_own_teacher_id($user, $context);
        if ($collection === 'studentGrades' || $collection === 'attendanceRecords') {
            $record['teacher_id'] = $teacherId;
            if (empty($record['class_id']) || !data_teacher_owns_class($pdo, $user, $context, (string)$record['class_id'])) {
                respond(403, ['error' => 'forbidden']);
            }
            if (!empty($record['student_id'])) {
                $statement = data_query($pdo,
                    'SELECT id FROM students WHERE school_id = :school_id AND id = :student_id AND class_id = :class_id LIMIT 1',
                    ['school_id' => $user['school_id'], 'student_id' => $record['student_id'], 'class_id' => $record['class_id']]
                );
                if (!$statement->fetchColumn()) respond(403, ['error' => 'forbidden']);
            }
        }
        if ($collection === 'teacherLearningProfiles') $record['teacher_id'] = $teacherId;
    }

    if (in_array($collection, ['schoolTuitionPayments', 'schoolExpenses', 'schoolCalendarEvents', 'schoolWideActivities'], true)) {
        $record['created_by'] = $user['id'];
    }
    if ($collection === 'teacherEvaluations' && $role !== 'parent') {
        $record['evaluator_id'] = $user['id'];
        $record['evaluator_role'] = $role === 'sub_admin' ? 'admin' : $role;
        $record['evaluator_name'] = (string)($user['full_name'] ?? '');
    }
}

function data_decode_input(array $policy, array $input): array
{
    $columns = $policy['columns'];
    $aliases = array_flip($policy['aliases'] ?? []);
    $record = [];
    foreach ($input as $key => $value) {
        if ($key === 'id') {
            $record['id'] = (string)$value;
            continue;
        }
        if ($key === 'school_id' || $key === 'schoolId') {
            respond(400, ['error' => 'invalid']);
        }
        $column = $aliases[$key] ?? strtolower((string)preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', (string)$key));
        if (!isset($columns[$column]) || $column === 'id') {
            respond(400, ['error' => 'invalid']);
        }
        if (in_array($column, $policy['json'], true) && $value !== null) {
            if (is_string($value)) {
                json_decode($value, true);
                if (json_last_error() !== JSON_ERROR_NONE) respond(400, ['error' => 'invalid']);
            } else {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                if ($value === false) respond(400, ['error' => 'invalid']);
            }
        }
        $record[$column] = $value;
    }
    return $record;
}

function data_record_save(PDO $pdo, array $policies, array $user, array $context, array $body): never
{
    $policy = data_table($policies, $body['collection'] ?? null);
    data_permission($policy, $user, 'write');
    if ($policy['table'] === 'users' || !isset($body['record']) || !is_array($body['record'])) {
        respond(400, ['error' => 'invalid']);
    }
    $record = data_decode_input($policy, $body['record']);
    data_guard_write($pdo, $policy['collection'], $record, $user, $context);
    data_validate_relations($pdo, $policy['collection'], $record, $user);

    $id = $record['id'] ?? bin2hex(random_bytes(16));
    if ($id === '') respond(400, ['error' => 'invalid']);
    unset($record['id']);

    [$visibility, $visibilityParams] = data_visibility($pdo, $policy, $user, $context, 'write');
    $exists = data_query($pdo,
        'SELECT id FROM `' . $policy['table'] . '` WHERE school_id = :school_id AND id = :record_id AND (' . $visibility . ') LIMIT 1',
        array_merge(['school_id' => $user['school_id'], 'record_id' => $id], $visibilityParams)
    )->fetchColumn();

    if ($exists) {
        if ($policy['collection'] === 'notifications' && !in_array($user['role'], data_managers(), true)) {
            if (array_diff(array_keys($record), ['read_by']) !== []) {
                respond(403, ['error' => 'forbidden']);
            }
        }
        if ($policy['collection'] === 'notifications' && array_key_exists('read_by', $record)) {
            $current = data_query($pdo, 'SELECT read_by FROM notifications WHERE school_id = :school_id AND id = :record_id LIMIT 1', [
                'school_id' => $user['school_id'], 'record_id' => $id,
            ])->fetchColumn();
            $readBy = is_string($current) ? json_decode($current, true) : [];
            $readBy = is_array($readBy) ? $readBy : [];
            if (!in_array($user['id'], $readBy, true)) $readBy[] = $user['id'];
            $record['read_by'] = json_encode($readBy, JSON_UNESCAPED_SLASHES);
        }
        if ($record === []) respond(400, ['error' => 'invalid']);
        $assignments = [];
        $params = ['school_id' => $user['school_id'], 'record_id' => $id];
        foreach ($record as $column => $value) {
            $placeholder = 'v_' . $column;
            $assignments[] = '`' . $column . '` = :' . $placeholder;
            $params[$placeholder] = $value;
        }
        data_query($pdo,
            'UPDATE `' . $policy['table'] . '` SET ' . implode(', ', $assignments)
            . ' WHERE school_id = :school_id AND id = :record_id AND (' . $visibility . ')',
            array_merge($params, $visibilityParams)
        );
    } else {
        if ($policy['collection'] === 'notifications') {
            $record['sender_role'] = $user['role'];
            $record['sender_name'] = (string)($user['full_name'] ?? '');
            $record['read_by'] = json_encode([], JSON_UNESCAPED_SLASHES);
        }
        $record['id'] = $id;
        $record['school_id'] = $user['school_id'];
        $columns = array_keys($record);
        $columnSql = implode(', ', array_map(static fn(string $column): string => '`' . $column . '`', $columns));
        $valueSql = implode(', ', array_map(static fn(string $column): string => ':v_' . $column, $columns));
        $params = [];
        foreach ($record as $column => $value) $params['v_' . $column] = $value;
        data_query($pdo, 'INSERT INTO `' . $policy['table'] . '` (' . $columnSql . ') VALUES (' . $valueSql . ')', $params);
    }

    respond(200, ['ok' => true, 'id' => (string)$id]);
}

function data_record_delete(PDO $pdo, array $policies, array $user, array $context, array $body): never
{
    $policy = data_table($policies, $body['collection'] ?? null);
    data_permission($policy, $user, 'delete');
    if ($policy['table'] === 'users') respond(400, ['error' => 'invalid']);
    $id = trim((string)($body['id'] ?? ''));
    if ($id === '') respond(400, ['error' => 'invalid']);
    [$visibility, $visibilityParams] = data_visibility($pdo, $policy, $user, $context, 'delete');
    $statement = data_query($pdo,
        'DELETE FROM `' . $policy['table'] . '` WHERE school_id = :school_id AND id = :record_id AND (' . $visibility . ')',
        array_merge(['school_id' => $user['school_id'], 'record_id' => $id], $visibilityParams)
    );
    if ($statement->rowCount() !== 1) respond(404, ['error' => 'invalid']);
    respond(200, ['ok' => true]);
}

function data_role_rank(string $role): int
{
    return match ($role) {
        'sub_admin' => 7,
        'admin' => 6,
        'executive_vp', 'academic_vp', 'cultural_vp' => 5,
        'teacher' => 4,
        'student', 'parent' => 3,
        default => 0,
    };
}

function data_user_create(PDO $pdo, array $user, array $body): never
{
    if (!in_array($user['role'], data_managers(), true)) respond(403, ['error' => 'forbidden']);
    foreach (['school_id', 'schoolId'] as $tenantKey) {
        if (array_key_exists($tenantKey, $body)) respond(400, ['error' => 'invalid']);
    }

    $email = normalize_email_or_national_id((string)($body['email'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $role = (string)($body['role'] ?? '');
    $fullName = trim((string)($body['full_name'] ?? ''));
    $linkedId = trim((string)($body['linked_id'] ?? ''));
    if ($email === null || strlen($email) > 254
        || strlen($password) < 8 || strlen($password) > 4096
        || !in_array($role, data_roles(), true)
        || data_role_rank($role) >= data_role_rank($user['role'])
        || $role === 'sub_admin'
        || (in_array($role, ['teacher', 'student', 'parent'], true) && $linkedId === '')) {
        respond(400, ['error' => 'invalid']);
    }

    if ($linkedId !== '' && in_array($role, ['student', 'parent'], true)) {
        $linkedStudent = data_query($pdo,
            'SELECT id FROM students WHERE school_id = :school_id AND (student_code = :linked_code OR national_id = :linked_national_id) LIMIT 1',
            ['school_id' => $user['school_id'], 'linked_code' => $linkedId, 'linked_national_id' => $linkedId]
        )->fetchColumn();
        if (!$linkedStudent) respond(400, ['error' => 'invalid']);
    }
    if ($linkedId !== '' && $role === 'teacher') {
        $linkedTeacher = data_query($pdo,
            'SELECT id FROM teachers WHERE school_id = :school_id AND teacher_code = :linked_id LIMIT 1',
            ['school_id' => $user['school_id'], 'linked_id' => $linkedId]
        )->fetchColumn();
        if (!$linkedTeacher) respond(400, ['error' => 'invalid']);
    }

    $exists = data_query($pdo,
        'SELECT id FROM users WHERE school_id = :school_id AND email = :email LIMIT 1',
        ['school_id' => $user['school_id'], 'email' => $email]
    )->fetchColumn();
    if ($exists) respond(409, ['error' => 'exists']);

    $insert = $pdo->prepare(
        'INSERT INTO users (school_id, email, password_hash, role, username, full_name, phone, linked_id, school_name, school_code, is_demo, created_at) '
        . 'VALUES (:school_id, :email, :password_hash, :role, :username, :full_name, :phone, :linked_id, :school_name, :school_code, 0, :created_at)'
    );
    $insert->execute([
        'school_id' => $user['school_id'],
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role,
        'username' => isset($body['username']) ? trim((string)$body['username']) : $email,
        'full_name' => $fullName !== '' ? $fullName : $email,
        'phone' => isset($body['phone']) ? trim((string)$body['phone']) : null,
        'linked_id' => $linkedId !== '' ? $linkedId : null,
        'school_name' => null,
        'school_code' => null,
        'created_at' => gmdate('c'),
    ]);
    respond(201, ['ok' => true, 'id' => (string)$pdo->lastInsertId()]);
}

function data_user_delete(PDO $pdo, array $user, array $body): never
{
    if (!in_array($user['role'], data_managers(), true)) respond(403, ['error' => 'forbidden']);
    $targetId = trim((string)($body['id'] ?? ''));
    if ($targetId === '' || $targetId === $user['id']) respond(400, ['error' => 'invalid']);

    $target = data_query($pdo,
        'SELECT id, role FROM users WHERE school_id = :school_id AND id = :user_id LIMIT 1',
        ['school_id' => $user['school_id'], 'user_id' => $targetId]
    )->fetch();
    if (!$target || data_role_rank((string)$target['role']) >= data_role_rank($user['role'])) {
        respond(403, ['error' => 'forbidden']);
    }

    if ($target['role'] === 'admin') {
        $adminCount = (int)data_query($pdo,
            "SELECT COUNT(*) FROM users WHERE school_id = :school_id AND role = 'admin'",
            ['school_id' => $user['school_id']]
        )->fetchColumn();
        if ($adminCount <= 1) respond(400, ['error' => 'invalid']);
    }

    data_query($pdo, 'DELETE FROM users WHERE school_id = :school_id AND id = :user_id', [
        'school_id' => $user['school_id'], 'user_id' => $targetId,
    ]);
    respond(200, ['ok' => true]);
}

function handle_data_action(PDO $pdo, array $config, string $action, array $body): never
{
    $tokenSecret = (string)($config['token_secret'] ?? '');
    $user = data_authenticate($pdo, $tokenSecret);
    $context = data_user_context($pdo, $user);
    $policies = data_policies();

    if ($action === 'school-data') {
        $data = [];
        foreach ($policies as $collection => $policy) {
            $data[$collection] = data_rows($pdo, $policy, $user, $context);
        }
        respond(200, ['data' => $data]);
    }
    if ($action === 'record-save') data_record_save($pdo, $policies, $user, $context, $body);
    if ($action === 'record-delete') data_record_delete($pdo, $policies, $user, $context, $body);
    if ($action === 'user-create') data_user_create($pdo, $user, $body);
    if ($action === 'user-delete') data_user_delete($pdo, $user, $body);

    respond(400, ['error' => 'invalid']);
}