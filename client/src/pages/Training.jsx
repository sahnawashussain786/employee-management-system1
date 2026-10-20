import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { GraduationCap, Plus, Users, Clock, Award, CheckCircle } from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ProgressBar } from '../components/UI';

export default function Training() {
  const api = useApi();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/training').then((res) => setTrainings(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = {
    upcoming: trainings.filter((t) => t.status === 'upcoming').length,
    ongoing: trainings.filter((t) => t.status === 'ongoing').length,
    completed: trainings.filter((t) => t.status === 'completed').length,
    totalEnrolled: trainings.reduce((sum, t) => sum + (t.enrolledCount || 0), 0),
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training</h1>
          <p className="mt-1 text-sm text-gray-500">Manage employee training and development</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
          <Plus className="h-4 w-4" /> Create Training
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><GraduationCap className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{trainings.length}</p><p className="text-sm text-gray-500">Total Programs</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Users className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.totalEnrolled}</p><p className="text-sm text-gray-500">Total Enrolled</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.ongoing}</p><p className="text-sm text-gray-500">In Progress</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Award className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.completed}</p><p className="text-sm text-gray-500">Completed</p></div></div></div>
      </div>

      {trainings.length === 0 ? <EmptyState icon={GraduationCap} title="No training programs" description="Create your first training program." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainings.map((t) => (
            <div key={t._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><GraduationCap className="h-4 w-4" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.title}</h3>
                    <p className="text-xs text-gray-500">{t.code || 'No code'}</p>
                  </div>
                </div>
                <Badge variant={t.status === 'ongoing' ? 'info' : t.status === 'completed' ? 'success' : t.status === 'cancelled' ? 'danger' : 'default'}>{t.status}</Badge>
              </div>
              {t.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.enrolledCount || 0}/{t.capacity || 20} enrolled</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.durationHours}h</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{t.category}</span>
                {t.mandatory && <Badge variant="warning">Mandatory</Badge>}
              </div>
              {t.startDate && (
                <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                  <span className="text-gray-500">{dayjs(t.startDate).format('MMM D')} – {t.endDate ? dayjs(t.endDate).format('MMM D, YYYY') : 'TBD'}</span>
                  <span className="text-gray-400">{t.instructor || 'TBD'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
