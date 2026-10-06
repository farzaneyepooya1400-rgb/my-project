const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://madreseyarapp.ir/api').replace(/\/+$/, '');
const TOKEN_KEY = 'token';

export interface ApiUser {
  id: string | number;
  email: string;
  role: UserRole;
  school_id: string | number | null;
}

type UserRole =
  | 'sub_admin'
  | 'admin'
  | 'executive_vp'
  | 'academic_vp'
  | 'cultural_vp'
  | 'teacher'
  | 'student'
  | 'parent';

export interface ApiError {
  error?: string;
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export function normalizeEmailOrNationalId(value: string): string {
  const normalized = value.trim().replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
  return normalized.includes('@') ? normalized.toLowerCase() : normalized;
}

export function isValidEmailOrNationalId(value: string): boolean {
  const identifier = normalizeEmailOrNationalId(value);
  return /^\d{10}$/.test(identifier) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

async function request<T>(action: string, body?: unknown): Promise<T> {
  const url = new URL(`${API_BASE_URL}/index.php`);
  url.searchParams.set('action', action);

  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = { error: 'invalid_response' };
  }

  if (!response.ok) throw responseBody;
  return responseBody as T;
}

export async function getRecords<T>(collection: string): Promise<T[]> {
  const response = await request<{ data?: Record<string, unknown> }>('school-data');
  const records = response.data?.[collection];
  if (!Array.isArray(records)) {
    throw { error: 'invalid_response' } satisfies ApiError;
  }
  return records as T[];
}

export function saveRecord<T extends { id: string }>(collection: string, record: T): Promise<{ ok: true; id?: string }> {
  return request('record-save', { collection, record });
}

export function deleteRecord(collection: string, id: string): Promise<{ ok: true }> {
  return request('record-delete', { collection, id });
}

export function register(input: { email: string; password: string; school_code: string }): Promise<{ ok: true }> {
  const email = normalizeEmailOrNationalId(input.email);
  if (!isValidEmailOrNationalId(email)) throw { error: 'invalid' } satisfies ApiError;
  return request('register', { ...input, email });
}

export async function login(input: { email: string; password: string }): Promise<{ token: string }> {
  const email = normalizeEmailOrNationalId(input.email);
  if (!isValidEmailOrNationalId(email)) throw { error: 'invalid' } satisfies ApiError;
  const result = await request<{ token: string }>('login', { ...input, email });
  localStorage.setItem(TOKEN_KEY, result.token);
  return result;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  username: string;
  full_name: string;
  linked_id?: string;
  phone?: string;
}

export function createUserAccount(input: CreateUserInput): Promise<{ ok: true; id: string }> {
  const email = normalizeEmailOrNationalId(input.email);
  if (!isValidEmailOrNationalId(email)) throw { error: 'invalid' } satisfies ApiError;
  return request('user-create', { ...input, email });
}

export function me(): Promise<ApiUser> {
  return request('me');
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasStoredToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getApiErrorMessage(error: unknown): string {
  const apiError = error as ApiError | null;
  const code = apiError?.error || apiError?.code;

  switch (code) {
    case 'bad_credentials':
      return 'نام کاربری، ایمیل یا رمز عبور درست نیست.';
    case 'exists':
      return 'این ایمیل قبلاً ثبت‌نام کرده است.';
    case 'invalid':
      return 'اطلاعات واردشده معتبر نیست؛ موارد را بررسی کنید.';
    case 'unauthorized':
      return 'نشست شما معتبر نیست؛ دوباره وارد شوید.';
    default:
      return apiError?.message || 'ارتباط با سرویس انجام نشد؛ دوباره تلاش کنید.';
  }
}