import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { FileText, Plus, Clock, Search, Filter } from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ProgressBar } from '../components/UI';

export default function Timesheets() {
  const api = useApi();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [weekStart, setWeekStart] = useState(dayjs().startOf('isoWeek').format('YYYY-MM-DD'));

  useEffect(() => {
    const params = new URLSearchParams({ weekStart, limit: 100 });
    api.get(`/api/timesheets?${params}`).then((res) => setEntries(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [weekStart]);

  const filtered = entries.filter((e) => {
    if (search && !e.employee?.fullName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: entries.length,
    submitted: entries.filter((e) => e.status === 'submitted').length,
    approved: entries.filter((e) => e.status === 'approved').length,
    draft: entries.filter((e) => e.status === 'draft').length,
    totalHours: entries.reduce((sum, e) => sum + (e.hours || 0), 0),
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="mt-1 text-sm text-gray-500">Employee timesheet entries</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><Plus className="h-4 w-4" /> Add Entry</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Entries</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.approved}</p><p className="text-sm text-gray-500">Approved</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><FileText className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.submitted}</p><p className="text-sm text-gray-500">Submitted</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}h</p><p className="text-sm text-gray-500">Total Hours</p></div></div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by employee..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? <EmptyState icon={FileText} title="No timesheet entries" description="No entries found for this week." /> : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Employee</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Project</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Hours</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Task</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-900 whitespace-nowrap">{dayjs(entry.date).format('MMM D, YYYY')}</td>
                    <td className="px-5 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{entry.employee?.fullName?.charAt(0) || '?'}</div>
                        <span className="font-medium text-gray-900">{entry.employee?.fullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.project?.name || 'No project'}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">{entry.hours.toFixed(2)}h</td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-[200px] truncate">{entry.task || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
