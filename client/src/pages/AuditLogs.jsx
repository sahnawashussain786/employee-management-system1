import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { ScrollText, Search, Filter, Download } from 'lucide-react';
import { Badge, EmptyState, StatusBadge } from '../components/UI';

export default function AuditLogs() {
  const api = useApi();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: 500 });
    api.get(`/api/audit-logs?${params}`).then((res) => setLogs(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    if (search && !l.action?.toLowerCase().includes(search.toLowerCase()) && !l.entity?.toLowerCase().includes(search.toLowerCase()) && !l.details?.toString().toLowerCase().includes(search.toLowerCase())) return false;
    if (actionFilter && l.action !== actionFilter) return false;
    if (entityFilter && l.entity !== entityFilter) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    today: logs.filter((l) => dayjs(l.createdAt).isSame(dayjs(), 'day')).length,
    actions: [...new Set(logs.map((l) => l.action))].length,
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">{stats.total} log entries • {stats.today} today</p>
        </div>
        <button onClick={() => { const l = document.createElement('a'); l.href = '/api/audit-logs/export.csv'; l.download = 'audit-logs.csv'; l.click(); }} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ScrollText className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Logs</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><ScrollText className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.today}</p><p className="text-sm text-gray-500">Today</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ScrollText className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.actions}</p><p className="text-sm text-gray-500">Unique Actions</p></div></div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={inputClass}>
          <option value="">All Actions</option>
          {[...new Set(logs.map((l) => l.action))].sort().map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className={inputClass}>
          <option value="">All Entities</option>
          {[...new Set(logs.map((l) => l.entity))].sort().map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? <EmptyState icon={ScrollText} title="No logs found" description="No audit logs match your filters." /> : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Timestamp</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Action</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Entity</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Details</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={String(log._id)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{dayjs(log.createdAt).format('MMM D, YYYY h:mm:ss A')}</td>
                    <td className="px-5 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {log.user && <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">{log.user.employee?.fullName?.charAt(0) || log.user.email?.charAt(0) || '?'}</div>}
                        <span className="font-medium text-gray-900">{log.user?.employee?.fullName || log.user?.email || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge variant="primary">{log.action}</Badge></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{log.entity}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate">{log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 font-mono">{log.ip || '—'}</td>
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
