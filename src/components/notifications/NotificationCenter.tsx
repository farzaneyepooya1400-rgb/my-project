import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  Award,
  Megaphone,
  AlertTriangle,
  School,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Filter,
  Sparkles,
  Search,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { AppNotification, NotificationType } from '../../types';
import {
  NOTIFICATION_METAS,
  formatRelativePersianTime,
  isNotificationRelevantForUser,
} from '../../lib/notificationUtils';
import {
  playNotificationSound,
  isSoundMuted,
  setSoundMuted,
} from '../../lib/notificationSound';
import { toPersianDigits, formatShamsiDate } from '../../lib/persianUtils';
import { CreateNotificationModal } from './CreateNotificationModal';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    addNotification,
    students,
    classes,
  } = useSchool();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [muted, setMutedState] = useState<boolean>(isSoundMuted());

  if (!isOpen || !currentUser) return null;

  const handleToggleMute = () => {
    const nextVal = !muted;
    setSoundMuted(nextVal);
    setMutedState(nextVal);
  };

  // Filter relevant notifications
  const userNotifications = notifications.filter((n) =>
    isNotificationRelevantForUser(n, currentUser, students)
  );

  const unreadCount = userNotifications.filter(
    (n) => !n.readBy.includes(currentUser.id)
  ).length;

  const filteredList = userNotifications.filter((n) => {
    const isUnread = !n.readBy.includes(currentUser.id);
    if (activeFilter === 'unread' && !isUnread) return false;
    if (activeFilter !== 'all' && activeFilter !== 'unread' && n.type !== activeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      const matchSender = n.senderName?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchSender;
    }

    return true;
  });

  // Fast test notification generator for immediate user verification
  const handleSendTestNotification = async (type: NotificationType) => {
    if (type === 'grade') {
      await addNotification({
        title: 'ثبت نمره جدید در درس علوم تجربی',
        message: 'دبیر محترم نمرات مستمر و پایانی دانش‌آموزان کلاس را در سامانه ثبت نمود. میانگین زنده ۱۸.۷۵ محاسبه شد.',
        type: 'grade',
        senderRole: 'teacher',
        senderName: 'استاد حسینی (دبیر علوم)',
        targetRole: 'all',
      });
    } else if (type === 'meeting') {
      await addNotification({
        title: 'یادآور جلسه فوری اولیا و مربیان',
        message: 'جلسه بررسی پیشرفت تحصیلی دانش‌آموزان فردا پنج‌شنبه ساعت ۱۶:۰۰ در سالن اجتماعات برگزار می‌گردد.',
        type: 'meeting',
        senderRole: 'admin',
        senderName: 'مدیریت آموزشگاه',
        targetRole: 'all',
      });
    } else {
      await addNotification({
        title: 'پیام معاونت پرورشی: آغاز مسابقات جشنواره امید فردا',
        message: 'ثبت‌نام رشته‌های هنری، عکاسی و سرود همگانی در دفتر پرورشی تا روز شنبه ادامه دارد.',
        type: 'vp_message',
        senderRole: 'cultural_vp',
        senderName: 'معاونت پرورشی مجتمع',
        targetRole: 'all',
      });
    }
    playNotificationSound(type);
  };

  const canCreate =
    currentUser.role === 'admin' ||
    currentUser.role === 'sub_admin' ||
    currentUser.role === 'academic_vp' ||
    currentUser.role === 'cultural_vp' ||
    currentUser.role === 'teacher';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
        dir="rtl"
      >
        <div className="bg-white dark:bg-[#102038] w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#102a45] to-[#1e3a5f] text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 relative shadow-sm">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-[#102a45]">
                    {toPersianDigits(unreadCount)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>مرکز اعلان‌های هوشمند و پیام‌ها</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {toPersianDigits(unreadCount)} جدید
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">
                  سامانه اطلاع‌رسانی یکپارچه نمرات، یادآور جلسات، پیام‌های معاونین و انضباطی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                title={muted ? 'روشن کردن صدای اعلان‌ها' : 'بی‌صدا کردن'}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-colors cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-300" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Bar & Filter Tabs */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              {[
                { id: 'all', label: 'همه اعلان‌ها', count: userNotifications.length },
                { id: 'unread', label: 'خوانده‌نشده', count: unreadCount },
                { id: 'grade', label: 'نمرات', count: userNotifications.filter((n) => n.type === 'grade').length },
                { id: 'meeting', label: 'جلسات', count: userNotifications.filter((n) => n.type === 'meeting').length },
                { id: 'vp_message', label: 'پیام معاونین', count: userNotifications.filter((n) => n.type === 'vp_message').length },
              ].map((tab) => {
                const isSelected = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {toPersianDigits(tab.count)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-bold transition-colors cursor-pointer border border-teal-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>خوانده شدن همه</span>
                </button>
              )}

              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ارسال اعلان جدید</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Input & Demo triggers */}
          <div className="px-6 py-2.5 bg-white dark:bg-[#102038] border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، پیام یا نام فرستنده..."
                className="w-full pr-9 pl-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Quick Test Chime Buttons */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] hidden sm:inline">آزمایش نوتیفیکیشن زنده:</span>
              <button
                type="button"
                onClick={() => handleSendTestNotification('grade')}
                className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
              >
                + نمره
              </button>
              <button
                type="button"
                onClick={() => handleSendTestNotification('meeting')}
                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold hover:bg-amber-100 cursor-pointer"
              >
                + جلسه
              </button>
              <button
                type="button"
                onClick={() => handleSendTestNotification('vp_message')}
                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold hover:bg-indigo-100 cursor-pointer"
              >
                + معاونت
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 dark:bg-[#0d1624]">
            {filteredList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  اعلانی در این بخش یافت نشد
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  فعالیت‌های مهم مانند نمره جدید، پیام‌های معاونین یا جلسات به‌صورت خودکار در اینجا نمایش داده می‌شوند.
                </p>
              </div>
            ) : (
              filteredList.map((notif) => {
                const isRead = notif.readBy.includes(currentUser.id);
                const meta = NOTIFICATION_METAS[notif.type] || NOTIFICATION_METAS.general;

                return (
                  <div
                    key={notif.id}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isRead
                        ? 'bg-white dark:bg-[#131f33] border-slate-200 dark:border-slate-800 opacity-90'
                        : `bg-white dark:bg-[#16253d] border-teal-500/40 shadow-md ring-1 ring-teal-500/20`
                    }`}
                  >
                    {!isRead && (
                      <span className="absolute top-4 left-4 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.badgeColor}`}
                        >
                          {notif.type === 'grade' && <Award className="w-5 h-5" />}
                          {notif.type === 'meeting' && <Calendar className="w-5 h-5" />}
                          {notif.type === 'vp_message' && <Megaphone className="w-5 h-5" />}
                          {notif.type === 'attendance' && <AlertTriangle className="w-5 h-5" />}
                          {notif.type === 'general' && <School className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>
                              {meta.badgeLabel}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatRelativePersianTime(notif.createdAt)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({formatShamsiDate(notif.createdAt)})
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                            {notif.title}
                          </h4>

                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                            {notif.message}
                          </p>

                          {/* Extra info footer */}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            {notif.senderName && (
                              <span>فرستنده: <strong className="text-slate-700 dark:text-slate-200">{notif.senderName}</strong></span>
                            )}
                            {notif.targetRole && notif.targetRole !== 'all' && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium">
                                مخاطب: {notif.targetRole === 'parent' ? 'اولیا' : notif.targetRole === 'teacher' ? 'معلمان' : 'دانش‌آموزان'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {!isRead ? (
                          <button
                            type="button"
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-500/20 hover:bg-teal-100 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>خوانده شد</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>مشاهده شده</span>
                          </span>
                        )}

                        {(currentUser.role === 'admin' ||
                          currentUser.role === 'sub_admin' ||
                          notif.senderName?.includes(currentUser.fullName)) && (
                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            title="حذف اعلان"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal to compose a new notification */}
      <CreateNotificationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
