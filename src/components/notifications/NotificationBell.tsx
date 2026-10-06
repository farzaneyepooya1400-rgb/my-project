import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { isNotificationRelevantForUser } from '../../lib/notificationUtils';
import { toPersianDigits } from '../../lib/persianUtils';
import { NotificationCenter } from './NotificationCenter';

export const NotificationBell: React.FC = () => {
  const { currentUser, notifications, students } = useSchool();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const relevant = notifications.filter((n) =>
    isNotificationRelevantForUser(n, currentUser, students)
  );

  const unreadCount = relevant.filter(
    (n) => !n.readBy.includes(currentUser.id)
  ).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={`مرکز اعلان‌های هوشمند (${toPersianDigits(unreadCount)} پیام خوانده نشده)`}
        className="relative p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-all cursor-pointer group"
        aria-label="اعلان‌ها"
      >
        <Bell className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-[#102a45] shadow-sm animate-pulse">
            {toPersianDigits(unreadCount)}
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
