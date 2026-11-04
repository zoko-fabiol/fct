/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Cloche de notifications temps réel
 */

import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {
  AppNotification,
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationCenterService.ts';
import { Language } from '../services/i18n.ts';

interface NotificationBellProps {
  userId: string;
  lang: Language;
  onOpenModule?: (moduleId: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId, lang, onOpenModule }) => {
  const isEn = lang === 'en';
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToNotifications(
      userId,
      (list) => {
        setItems(list);
        setError(null);
      },
      () => setError(isEn ? 'Notifications unavailable.' : 'Notifications indisponibles.')
    );
    return unsub;
  }, [userId, isEn]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const unread = items.filter((n) => !n.isRead);

  const handleClick = async (n: AppNotification) => {
    try {
      if (!n.isRead) await markNotificationRead(n.id);
    } catch {
      setError(isEn ? 'Could not update notification.' : 'Mise à jour impossible.');
    }
    if (n.linkUrl && onOpenModule) {
      onOpenModule(n.linkUrl);
      setOpen(false);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead(unread.map((n) => n.id));
    } catch {
      setError(isEn ? 'Could not update notifications.' : 'Mise à jour impossible.');
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        aria-label="Notifications"
        className="relative p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-black">Notifications</span>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                {isEn ? 'Mark all read' : 'Tout marquer lu'}
              </button>
            )}
          </div>
          {error && <div className="px-3 py-2 text-[11px] text-rose-600 bg-rose-50">{error}</div>}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">
                {isEn ? 'No notifications yet.' : 'Aucune notification.'}
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition cursor-pointer ${
                    n.isRead ? '' : 'bg-blue-50/60'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{n.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.createdAtMs).toLocaleString(isEn ? 'en-GB' : 'fr-FR')}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

