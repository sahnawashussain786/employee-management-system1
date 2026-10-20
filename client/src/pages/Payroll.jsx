import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { DollarSign, Search, Filter, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge, Badge, EmptyState } from '../components/UI';

export default function Payroll() {
  const api = useApi();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  const isAdmin = ['admin', 'hr'].includes(useApi().constructor.name === 'Object' ? false : true);

  useEffect(() => {
    const params = new URLSearchParams({ month, year, limit: 100 });
    api.get(`/api/payroll?${params}`).then((res) => setPayrolls(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [month, year]);

  const filtered = payrolls.filter((p) => {
    if (search && !p.employee?.fullName?.toLowerCase().includes(search.toLowerCase()) && !p.employee?.empId?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: payrolls.length,
    draft: payrolls.filter((p) => p.status === 'draft').length,
    finalized: payrolls.filter((p) => p.status === 'finalized').length,
    paid: payrolls.filter((p) => p.status === 'paid').length,
    totalAmount: payrolls.reduce((sum, p) => sum + (p.net || 0), 0),
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">{dayjs().month(month - 1).format('MMMM YYYY')} payroll</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { const l = document.createElement('a'); l.href = `/api/payroll/export.csv?month=${month}&year=${year}`; l.download = `payroll-${month}-${year}.csv`; l.click(); }} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><Download className="h-4 w-4" /> Export</button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><DollarSign className="h-4 w-4" /> Generate Payroll</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><DollarSign className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Payslips</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.paid}</p><p className="text-sm text-gray-500">Paid</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><FileText className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.finalized}</p><p className="text-sm text-gray-500">Finalized</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><DollarSign className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">${(stats.totalAmount / 1000).toFixed(0)}k</p><p className="text-sm text-gray-500">Total Net</p></div></div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or employee ID..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="finalized">Finalized</option>
          <option value="paid">Paid</option>
        </select>
        <input type="number" min={2020} max={2030} value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass} style={{ width: 80 }} />
      </div>

      {filtered.length === 0 ? <EmptyState icon={DollarSign} title="No payroll records" description="No payroll records found for this period." /> : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Employee</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Payslip No</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Gross</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Deductions</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Net</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">{p.employee?.fullName?.charAt(0) || '?'}</div>
                        <div>
                          <p className="font-medium text-gray-900">{p.employee?.fullName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{p.employee?.empId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 font-mono">{p.payslipNo}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium text-gray-900">${(p.gross || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-right text-red-600">-${(p.totalDeductions || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-right font-bold text-gray-900">${(p.net || 0).toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} type="payroll" /></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{month}/{year}</td>
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
