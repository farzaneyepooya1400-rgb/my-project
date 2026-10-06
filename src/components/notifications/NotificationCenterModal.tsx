import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  Sparkles,
  UserCheck,
  CheckCheck,
  Trash2,
  X,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { AppNotification, NotificationType, UserRole } from '../../types';
import { toPersianDigits, formatShamsiDate } from '../../lib/persianUtils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    notifications,
    classes,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useSchool();

  const [filterType, setFilterType] = useState<string>('all');
  const [isComposing, setIsComposing] = useState(false);

  // Compose form state
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState<NotificationType>('meeting');
  const [newTargetRole, setNewTargetRole] = useState<UserRole | 'all'>('all');
  const [newTargetClassId, setNewTargetClassId] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter notifications relevant to current user
  const userNotifs = notifications.filter((n) => {
    if (!currentUser) return false;
    if (n.targetRole && n.targetRole !== 'all' && n.targetRole !== currentUser.role) {
      return false;
    }
    if (n.targetStudentId && currentUser.role === 'student' && currentUser.linkedId !== n.targetStudentId) {
      return false;
    }
    if (n.targetStudentId && currentUser.role === 'parent' && currentUser.linkedId !== n.targetStudentId) {
      return false;
    }
    return true;
  });

  const filteredNotifs = filterType === 'all'
    ? userNotifs
    : userNotifs.filter((n) => n.type === filterType);

  const unreadCount = userNotifs.filter(
    (n) => currentUser && !n.readBy.includes(currentUser.id)
  ).length;

  const canBroadcast = currentUser && ['admin', 'sub_admin', 'academic_vp', 'cultural_vp', 'teacher'].includes(currentUser.role);

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const res = await addNotification({
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      senderRole: currentUser?.role,
      senderName: currentUser?.fullName,
      targetRole: newTargetRole,
      targetClassId: newTargetClassId || undefined,
    });

    if (res.success) {
      setNewTitle('');
      setNewMessage('');
      setIsComposing(false);
      setToastMessage('اعلان هوشمند با موفقیت در سامانه ثبت و ارسال شد.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'grade':
        return <BookOpen className="w-4 h-4 text-teal-600" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'vp_message':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'attendance':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  مرکز اعلانات و پیام‌های هوشمند مدرسه
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono">
                    {toPersianDigits(unreadCount)} جدید
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                رویدادها، نمرات جدید، پیام‌های معاونین و یادآور جلسات به صورت زنده
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback */}
        {toastMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="px-5 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'همه' },
              { id: 'grade', label: 'نمرات' },
              { id: 'meeting', label: 'جلسات و رویدادها' },
              { id: 'vp_message', label: 'پیام‌های معاونین' },
              { id: 'attendance', label: 'حضور و انضباطی' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  filterType === f.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>خواندن همه</span>
              </button>
            )}

            {canBroadcast && (
              <button
                type="button"
                onClick={() => setIsComposing((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isComposing ? 'بستن فرم ارسال' : 'ارسال اعلان جدید'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Compose Form */}
        {isComposing && canBroadcast && (
          <form
            onSubmit={handleComposeSubmit}
            className="m-5 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>ارسال پیام یا اعلان هوشمند جدید</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                فرستنده: {currentUser?.fullName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع اعلان:
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as NotificationType)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="meeting">یادآور جلسه و مجمع</option>
                  <option value="vp_message">پیام معاونت آموزشی/پرورشی</option>
                  <option value="grade">اطلاعیه نمرات</option>
                  <option value="attendance">حضور و غیاب / انضباطی</option>
                  <option value="general">اعلان عمومی مدرسه</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مخاطبان:
                </label>
                <select
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">عموم (تمام کاربران)</option>
                  <option value="parent">منحصراً اولیا و والدین</option>
                  <option value="student">منحصراً دانش‌آموزان</option>
                  <option value="teacher">منحصراً معلمان و دبیران</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  کلاس هدف (اختیاری):
                </label>
                <select
                  value={newTargetClassId}
                  onChange={(e) => setNewTargetClassId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
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

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان پیام / اعلان:
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: یادآور جلسه مجمع اولیا و مربیان روز چهارشنبه"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                متن کامل اعلان:
              </label>
              <textarea
                required
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="توضیحات، ساعت برگزاری، محل یا جزئیات اطلاعیه..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>انتشار اعلان فوری</span>
              </button>
            </div>
          </form>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-400">اعلانی در این بخش وجود ندارد.</p>
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const isUnread = currentUser && !notif.readBy.includes(currentUser.id);
              const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.role === 'sub_admin' || notif.senderName === currentUser.fullName);
              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isUnread
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-300/80 dark:border-teal-800/80 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0 mt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {notif.title}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[10px] text-slate-400 font-medium">
                          {notif.senderName && (
                            <span>فرستنده: <strong className="text-slate-600 dark:text-slate-300">{notif.senderName}</strong></span>
                          )}
                          <span>•</span>
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatShamsiDate(notif.createdAt)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف اعلان"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
