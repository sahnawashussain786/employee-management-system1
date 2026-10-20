import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { Badge, EmptyState } from '../components/UI';

export default function Notifications() {
  const api = useApi();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markAllRead, setMarkAllRead] = useState(false);

  useEffect(() => {
    api.get('/api/notifications').then((res) => setNotifications(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date() })));
      setMarkAllRead(true);
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div key={notif._id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
              notif.read ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-primary/20 bg-primary/5'
            }`}>
              <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${notif.read ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                {notif.type === 'leave' && <Clock className="h-4 w-4" />}
                {notif.type === 'attendance' && <Clock className="h-4 w-4" />}
                {notif.type === 'payroll' && <span className="text-sm font-semibold">💰</span>}
                {notif.type === 'performance' && <span className="text-sm font-semibold">⭐</span>}
                {notif.type === 'training' && <span className="text-sm font-semibold">📚</span>}
                {notif.type === 'asset' && <span className="text-sm font-semibold">💻</span>}
                {notif.type === 'recruitment' && <span className="text-sm font-semibold">📋</span>}
                {notif.type === 'announcement' && <span className="text-sm font-semibold">📢</span>}
                {!notif.type || notif.type === 'system' ? <Bell className="h-4 w-4" /> : <span className="text-sm font-semibold">🔔</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${notif.read ? 'text-gray-900' : 'text-gray-900'}`}>{notif.title}</p>
                    <p className={`text-sm mt-0.5 ${notif.read ? 'text-gray-500' : 'text-gray-700'}`}>{notif.message}</p>
                  </div>
                  {!notif.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{dayjs(notif.createdAt).format('MMM D, h:mm A')}</span>
                  {notif.link && (
                    <a href={notif.link} className="text-xs text-primary hover:underline">View</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
