import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  Award,
  Megaphone,
  AlertTriangle,
  School,
  Volume2,
  VolumeX,
  ExternalLink,
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
import { toPersianDigits } from '../../lib/persianUtils';

interface NotificationToastsProps {
  onOpenCenter?: () => void;
}

interface ToastItem {
  notification: AppNotification;
  remainingMs: number;
  totalMs: number;
  isPaused: boolean;
}

const TOAST_DURATION_MS = 9000;

export const NotificationToasts: React.FC<NotificationToastsProps> = ({ onOpenCenter }) => {
  const { currentUser, notifications, markNotificationAsRead, students } = useSchool();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [muted, setMutedState] = useState<boolean>(isSoundMuted());
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Sync mute state
  const handleToggleMute = () => {
    const nextVal = !muted;
    setSoundMuted(nextVal);
    setMutedState(nextVal);
  };

  // Listen to new notifications and pop corner toasts
  useEffect(() => {
    if (!currentUser) {
      setToasts([]);
      seenNotificationIdsRef.current.clear();
      isInitialMountRef.current = true;
      return;
    }

    // Filter relevant notifications
    const relevant = notifications.filter((n) =>
      isNotificationRelevantForUser(n, currentUser, students)
    );

    // On initial mount or login, show recent unread notifications (up to 2) as welcoming alerts
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const unreadRecent = relevant
        .filter((n) => !n.readBy.includes(currentUser.id))
        .slice(0, 2);

      unreadRecent.forEach((n) => seenNotificationIdsRef.current.add(n.id));

      if (unreadRecent.length > 0) {
        const initialToasts: ToastItem[] = unreadRecent.map((n) => ({
          notification: n,
          remainingMs: TOAST_DURATION_MS,
          totalMs: TOAST_DURATION_MS,
          isPaused: false,
        }));
        setToasts(initialToasts);
        // Play sound for the latest notification
        playNotificationSound(unreadRecent[0].type);
      }
      return;
    }

    // Check for newly arrived notifications
    const newItems: AppNotification[] = [];
    for (const notif of relevant) {
      if (!seenNotificationIdsRef.current.has(notif.id)) {
        seenNotificationIdsRef.current.add(notif.id);
        // General announcements are shown on panel entry, not as interruptions during work.
        if (!notif.readBy.includes(currentUser.id) && notif.type !== 'general') {
          newItems.push(notif);
        }
      }
    }

    if (newItems.length > 0) {
      const latestItem = newItems[0];
      playNotificationSound(latestItem.type);

      setToasts((prev) => {
        const addedToasts = newItems.map((n) => ({
          notification: n,
          remainingMs: TOAST_DURATION_MS,
          totalMs: TOAST_DURATION_MS,
          isPaused: false,
        }));
        // Prepend and keep maximum 3 toasts visible at once
        return [...addedToasts, ...prev].slice(0, 3);
      });
    }
  }, [notifications, currentUser, students]);

  // Interval timer for countdown progress bar and auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;

    const interval = setInterval(() => {
      setToasts((prev) =>
        prev
          .map((t) => {
            if (t.isPaused) return t;
            return {
              ...t,
              remainingMs: Math.max(0, t.remainingMs - 100),
            };
          })
          .filter((t) => t.remainingMs > 0)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [toasts.length]);

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.notification.id !== id));
  };

  const handleMarkRead = async (id: string) => {
    handleDismiss(id);
    await markNotificationAsRead(id);
  };

  const handleMouseEnter = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.notification.id === id ? { ...t, isPaused: true } : t))
    );
  };

  const handleMouseLeave = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.notification.id === id ? { ...t, isPaused: false } : t))
    );
  };

  if (!currentUser || toasts.length === 0) {
    return null;
  }

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case 'grade':
        return <Award className="w-5 h-5 text-emerald-500" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'vp_message':
        return <Megaphone className="w-5 h-5 text-indigo-500" />;
      case 'attendance':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <School className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div
      className="fixed bottom-5 left-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
      dir="rtl"
      aria-live="polite"
    >
      {/* Sound Mute Control Bar */}
      <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 dark:text-slate-400 pointer-events-auto">
        <span className="font-bold flex items-center gap-1.5 bg-slate-900/80 dark:bg-slate-900/90 text-white px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>اعلان‌های هوشمند زنده ({toPersianDigits(toasts.length)})</span>
        </span>
        <button
          type="button"
          onClick={handleToggleMute}
          title={muted ? 'فعال‌سازی صدای اعلان‌ها' : 'بی‌صدا کردن اعلان‌ها'}
          className="p-1 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
        </button>
      </div>

      {toasts.map(({ notification, remainingMs, totalMs, isPaused }) => {
        const meta = NOTIFICATION_METAS[notification.type] || NOTIFICATION_METAS.general;
        const progressPercent = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

        return (
          <div
            key={notification.id}
            onMouseEnter={() => handleMouseEnter(notification.id)}
            onMouseLeave={() => handleMouseLeave(notification.id)}
            className="pointer-events-auto group relative bg-white/95 dark:bg-[#121c2e]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 overflow-hidden transition-all duration-300 hover:shadow-teal-500/10 hover:border-teal-500/40 transform hover:-translate-y-0.5"
          >
            {/* Top color accent strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${meta.bgColor} ${meta.borderColor}`} />

            <div className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0 shadow-inner">
                    {renderIcon(notification.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>
                        {meta.badgeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatRelativePersianTime(notification.createdAt)}
                      </span>
                    </div>
                    {notification.senderName && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                        از طرف: {notification.senderName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => handleDismiss(notification.id)}
                  title="بستن"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Message */}
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mb-1 leading-snug">
                {notification.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {notification.message}
              </p>

              {/* Actions row */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold text-[11px] transition-colors cursor-pointer border border-teal-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>خوانده شد</span>
                  </button>

                  {onOpenCenter && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDismiss(notification.id);
                        onOpenCenter();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-[11px] transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>مرکز پیام‌ها</span>
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {isPaused ? 'مکث (نشانگر روی پیام)' : ''}
                </span>
              </div>
            </div>

            {/* Countdown progress bar line */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-amber-400 transition-all duration-100 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
