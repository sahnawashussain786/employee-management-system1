import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { Star, Plus, Award, TrendingUp, Clock } from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ProgressBar } from '../components/UI';

export default function PerformanceReviews() {
  const api = useApi();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/performance').then((res) => setReviews(res.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const stats = {
    draft: reviews.filter((r) => r.status === 'draft').length,
    'in-progress': reviews.filter((r) => r.status === 'in-progress').length,
    completed: reviews.filter((r) => r.status === 'completed').length,
    acknowledged: reviews.filter((r) => r.status === 'acknowledged').length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">Employee performance evaluation</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><Plus className="h-4 w-4" /> Create Review</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.draft}</p><p className="text-sm text-gray-500">Drafts</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats['in-progress']}</p><p className="text-sm text-gray-500">In Progress</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Award className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.completed}</p><p className="text-sm text-gray-500">Completed</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Star className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.acknowledged}</p><p className="text-sm text-gray-500">Acknowledged</p></div></div></div>
      </div>

      {reviews.length === 0 ? <EmptyState icon={Star} title="No reviews" description="Create your first performance review." /> : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold flex-shrink-0">
                {review.employee?.fullName?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{review.employee?.fullName || 'Unknown'}</h3>
                  <StatusBadge status={review.status} type="performance" />
                  <Badge variant="default">{review.period?.label || 'No period'}</Badge>
                </div>
                {review.overallRating && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<span key={i} className={i < Math.round(review.overallRating) ? 'text-amber-400' : 'text-gray-300'}>★</span>))}</div>
                    <span className="text-sm text-gray-500">{review.overallRating.toFixed(1)} / 5.0</span>
                  </div>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  {review.strengths && <p className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">S:</span><span className="text-gray-700">{review.strengths}</span></p>}
                  {review.improvements && <p className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">I:</span><span className="text-gray-700">{review.improvements}</span></p>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span>Reviewer: {review.reviewer?.employee?.fullName || 'Unknown'}</span>
                  {review.completedAt && <span>Completed: {dayjs(review.completedAt).format('MMM D, YYYY')}</span>}
                </div>
              </div>
              {review.recommendation && (
                <Badge variant={review.recommendation === 'raise' || review.recommendation === 'bonus' ? 'success' : review.recommendation === 'promotion' ? 'primary' : review.recommendation === 'pip' ? 'danger' : 'default'}>
                  {review.recommendation}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
