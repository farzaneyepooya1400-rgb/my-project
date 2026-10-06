<?php

return [
    'db_dsn' => 'mysql:host=localhost;dbname=school_app;charset=utf8mb4',
    'db_username' => 'CHANGE_ME',
    'db_password' => 'CHANGE_ME',
    'token_secret' => 'REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG',
    'token_ttl_seconds' => 43200,
    'allowed_origins' => [
        'https://madreseyarapp.ir',
        'https://www.madreseyarapp.ir',
        'http://localhost:3000',
    ],
    // This table must exist and provide an id plus the configured school-code column.
    'school_table' => 'schools',
    'school_code_column' => 'code',
];