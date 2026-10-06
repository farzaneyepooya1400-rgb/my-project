import React, { useState } from 'react';
import {
  X,
  Bell,
  Calendar,
  Award,
  Megaphone,
  AlertTriangle,
  School,
  Send,
  Sparkles,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { NotificationType, UserRole } from '../../types';
import { NOTIFICATION_METAS } from '../../lib/notificationUtils';
import { playNotificationSound } from '../../lib/notificationSound';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: NotificationType;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'meeting',
}) => {
  const { currentUser, classes, addNotification } = useSchool();

  const [type, setType] = useState<NotificationType>(defaultType);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole | 'all'>('all');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Preset templates for rapid Iranian school operations
  const PRESET_TEMPLATES = [
    {
      label: '📅 یادآور جلسه اولیا و مربیان',
      type: 'meeting' as NotificationType,
      title: 'یادآور جلسه عمومی مجمع اولیا و مربیان',
      message: 'با احترام، جلسه دیدار با دبیران و بررسی وضعیت تحصیلی دانش‌آموزان روز چهارشنبه ساعت ۱۵:۳۰ در سالن اجتماعات برگزار می‌گردد.',
      targetRole: 'parent' as UserRole,
    },
    {
      label: '👥 یادآور جلسه شورای دبیران',
      type: 'meeting' as NotificationType,
      title: 'یادآور نشست تخصصی شورای دبیران',
      message: 'جلسه تبادل نظر پیرامون ارزشیابی مستمر و بودجه‌بندی دروس فردا ساعت ۱۲:۴۵ در دفتر مدیریت تشکیل خواهد شد.',
      targetRole: 'teacher' as UserRole,
    },
    {
      label: '📘 پیام معاونت آموزشی (آزمون‌ها)',
      type: 'vp_message' as NotificationType,
      title: 'اطلاعیه معاونت آموزشی پیرامون امتحانات میان‌ترم',
      message: 'برنامه زمان‌بندی و سرفصل آزمون‌های هماهنگ نوبت اول اعلام شد. دانش‌آموزان برنامه مطالعاتی خود را تنظیم فرمایند.',
      targetRole: 'all' as const,
    },
    {
      label: '🎨 پیام معاونت پرورشی (مسابقات)',
      type: 'vp_message' as NotificationType,
      title: 'فراخوان ثبت‌نام در مسابقات فرهنگی، هنری و ورزشی',
      message: 'علاقه‌مندان به حضور در تیم‌های قرآنی، سرود، تئاتر و مسابقات شطرنج منطقه تا پایان هفته به دفتر پرورشی مراجعه نمایند.',
      targetRole: 'student' as UserRole,
    },
  ];

  const handleApplyTemplate = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setType(tmpl.type);
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setTargetRole(tmpl.targetRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const res = await addNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        senderRole: currentUser?.role || 'admin',
        senderName: currentUser?.fullName || 'مسئول سامانه',
        targetRole,
        targetClassId: targetClassId || undefined,
      });

      if (res.success) {
        playNotificationSound(type);
        setSuccessMsg('اعلان هوشمند با موفقیت ثبت شد و به کاربران ارسال گردید.');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
          // Reset form
          setTitle('');
          setMessage('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const meta = NOTIFICATION_METAS[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="bg-white dark:bg-[#102038] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#102a45] to-[#1e3a5f] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                ارسال اعلان و یادآور هوشمند
              </h2>
              <p className="text-xs text-slate-300">
                اطلاع‌رسانی فوری به دانش‌آموزان، اولیا و کادر آموزشی مدرسه
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>الگوهای آماده برای ارسال سریع:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="text-right p-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-500 hover:bg-teal-500/5 transition-all text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-2"
                >
                  <span className="truncate">{tmpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Notification Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نوع اعلان:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'meeting', label: 'یادآور جلسه', icon: Calendar },
                  { id: 'vp_message', label: 'پیام معاونت', icon: Megaphone },
                  { id: 'grade', label: 'نمره و تحصیلی', icon: Award },
                  { id: 'general', label: 'اطلاعیه عمومی', icon: Bell },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as NotificationType)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  گروه مخاطبان:
                </label>
                <div className="relative">
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRole | 'all')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="all">همه کاربران (عمومی)</option>
                    <option value="parent">فقط اولیای دانش‌آموزان</option>
                    <option value="teacher">فقط معلمان و کادر آموزشی</option>
                    <option value="student">فقط دانش‌آموزان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  کلاس هدف (اختیاری):
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">همه کلاس‌ها</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان اعلان:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: یادآور جلسه مجمع عمومی اولیا و مربیان"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                متن کامل پیام / جزئیات جلسه:
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="شرح جزئیات، زمان، مکان یا نکات مهم مورد نظر را بنویسید..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Live Preview Card */}
            {title && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-1.5">
                  پیش‌نمایش اعلان در گوشه صفحه کاربر:
                </span>
                <div
                  className={`p-3.5 rounded-2xl border ${meta.borderColor} bg-gradient-to-r ${meta.bgColor} ${meta.darkBgColor} shadow-md flex items-start gap-3`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>
                        {meta.badgeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">هم‌اکنون</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'در حال ارسال اعلان...' : 'ارسال اعلان فوری'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
