import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, School, UserRound } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { isValidEmailOrNationalId, normalizeEmailOrNationalId } from '../../api';

export const ApiLoginView: React.FC = () => {
  const { login } = useSchool();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    const normalizedIdentifier = normalizeEmailOrNationalId(identifier);
    if (!isValidEmailOrNationalId(normalizedIdentifier)) {
      setErrorMessage('ایمیل معتبر یا کدملی ۱۰ رقمی وارد کنید.');
      return;
    }
    setIsLoading(true);

    try {
      const result = await login(normalizedIdentifier, password);

      if (!result.success) {
        setErrorMessage(result.message || 'درخواست انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="login-view" className="min-h-[calc(100vh-4.5rem)] py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-900/15">
            <School className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">ورود به پرتال مدرسه‌یار</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">با ایمیل یا کدملی ۱۰ رقمی وارد شوید.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
            {errorMessage && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">ایمیل یا کدملی</span>
              <span className="relative block">
                <input
                  id="login-identifier"
                  type="text"
                  inputMode="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="ایمیل یا کدملی ۱۰ رقمی"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pl-10 text-left text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  dir="ltr"
                />
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">رمز عبور</span>
              <span className="relative block">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="رمز عبور"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pl-10 text-left text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  dir="ltr"
                />
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isLoading ? 'در حال ورود...' : 'ورود'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};