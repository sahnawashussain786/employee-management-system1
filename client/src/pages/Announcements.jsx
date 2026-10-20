import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import { Megaphone, Pin, Clock, Eye } from 'lucide-react';
import { Badge, EmptyState } from '../components/UI';

export default function Announcements() {
  const api = useApi();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/announcements').then((res) => setAnnouncements(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">Company-wide updates and notifications</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="There are no announcements to display." />
      ) : (
        <div className="space-y-4">
          {announcements.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.publishedAt) - new Date(a.publishedAt)).map((ann) => (
            <div
              key={ann._id}
              className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                ann.isPinned ? 'border-primary/20 bg-primary/5' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {ann.isPinned && <Pin className="h-5 w-5 text-primary flex-shrink-0" />}
                  <h2 className="text-lg font-semibold text-gray-900">{ann.title}</h2>
                  <Badge variant={ann.category === 'urgent' ? 'danger' : ann.category === 'event' ? 'info' : ann.category === 'benefit' ? 'success' : 'default'}>
                    {ann.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  {dayjs(ann.publishedAt).format('MMM D, YYYY h:mm A')}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
              {ann.expiresAt && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Expires: {dayjs(ann.expiresAt).format('MMM D, YYYY')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
