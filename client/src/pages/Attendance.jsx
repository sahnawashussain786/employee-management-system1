import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import {
  Clock,
  Calendar,
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ConfirmDialog } from '../components/UI';

export default function Attendance() {
  const api = useApi();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [searchEmployee, setSearchEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);

  const isManager = user?.role === 'manager';
  const isAdmin = ['admin', 'hr'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = await api.get('/api/attendance/today');
      setTodayRecord(today.data || null);

      const params = new URLSearchParams({ month, year, limit: 100 });
      const res = await api.get(`/api/attendance?${params}`);
      setRecords(res.data?.data || []);
      setSummary(res.data?.meta || null);

      if (isAdmin || isManager) {
        const empRes = await api.get('/api/employees/quick?activeOnly=false');
        setEmployees(empRes.data || []);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const res = await api.post('/api/attendance/clock-in');
      setTodayRecord(res.data);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await api.post('/api/attendance/clock-out');
      setTodayRecord(res.data);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to clock out');
    }
  };

  const handleMarkMissing = async () => {
    try {
      await api.post('/api/attendance/mark-missing', { date: dayjs().format('YYYY-MM-DD') });
      alert('Missing attendance marked as absent');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to mark missing');
    }
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = `/api/attendance/export.csv?month=${month}&year=${year}`;
    link.download = `attendance-${month}-${year}.csv`;
    link.click();
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  const monthName = dayjs().month(month - 1).format('MMMM');
  const daysInMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth();

  const calendarDays = [];
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).day();
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getRecordForDate = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find((r) => dayjs(r.date).format('YYYY-MM-DD') === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">{monthName} {year}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button onClick={handleMarkMissing} className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors">
              <AlertCircle className="h-4 w-4" />
              Mark Missing
            </button>
          )}
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setMonth((m) => Math.max(1, m - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[140px] text-center">{monthName} {year}</span>
          <button onClick={() => setMonth((m) => Math.min(12, m + 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <input
          type="number"
          min={2020}
          max={2030}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={inputClass}
          style={{ width: 80 }}
        />
      </div>

      {/* Today's status card */}
      {todayRecord && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Status
            </h2>
            <span className="text-sm text-gray-500">{dayjs().format('dddd, MMMM D, YYYY')}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-semibold text-gray-900">
                  {todayRecord.checkIn ? dayjs(todayRecord.checkIn).format('h:mm A') : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-semibold text-gray-900">
                  {todayRecord.checkOut ? dayjs(todayRecord.checkOut).format('h:mm A') : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={todayRecord.status} type="attendance" />
              </div>
            </div>
            {todayRecord.workedMinutes > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Worked</p>
                  <p className="font-semibold text-gray-900">
                    {(todayRecord.workedMinutes / 60).toFixed(2)} hours
                  </p>
                </div>
              </div>
            )}
          </div>
          {user?.employee && todayRecord.status === 'absent' && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              You are marked absent for today. Please contact your manager.
            </div>
          )}
        </div>
      )}

      {/* Clock In/Out buttons */}
      {user?.employee && !todayRecord && (
        <div className="flex gap-3">
          <button
            onClick={handleClockIn}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-sm"
          >              <Clock className="h-5 w-5" />
            Clock In Now
          </button>
          <button
            onClick={handleClockOut}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >              <LogOut className="h-5 w-5" />
            Clock Out
          </button>
        </div>
      )}
      {user?.employee && todayRecord?.checkIn && !todayRecord?.checkOut && (
        <div className="flex gap-3">
          <button
            onClick={handleClockOut}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 shadow-sm"
          >              <LogOut className="h-5 w-5" />
            Clock Out Now
          </button>
        </div>
      )}

      {/* Calendar View */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h2>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
          ))}
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;
            const record = getRecordForDate(day);
            const statusColors = {
              present: 'bg-emerald-500',
              late: 'bg-amber-500',
              'work-from-home': 'bg-blue-500',
              'half-day': 'bg-yellow-500',
              absent: 'bg-red-500',
              leave: 'bg-purple-500',
              holiday: 'bg-orange-500',
              'business-trip': 'bg-indigo-500',
            };
            return (
              <div
                key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                  record
                    ? 'hover:ring-2 hover:ring-primary'
                    : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: record ? statusColors[record.status] || '#e5e7eb' : '#f9fafb',
                  color: record ? '#fff' : '#6b7280',
                }}
                title={record ? `${record.status}: ${dayjs(record.date).format('MMM D')}` : `${day}`}
                onClick={() => {
                  if (record) {
                    setDeleteConfirm(record);
                  }
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="capitalize text-gray-600">{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Records table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
          <span className="text-sm text-gray-500">{records.length} records</span>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : records.length === 0 ? (
          <EmptyState icon={Clock} title="No records found" description={`No attendance records for ${monthName} ${year}.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Employee</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Check-in</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Check-out</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Hours</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  {isAdmin && <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {dayjs(record.date).format('MMM D, YYYY')}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {record.employee?.fullName?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{record.employee?.fullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {record.checkIn ? dayjs(record.checkIn).format('h:mm A') : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {record.checkOut ? dayjs(record.checkOut).format('h:mm A') : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {record.workedMinutes > 0 ? `${(record.workedMinutes / 60).toFixed(2)}h` : '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={record.status} type="attendance" />
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setDeleteConfirm(record)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          try {
            await api.delete(`/api/attendance/${deleteConfirm._id}`);
            fetchData();
          } catch (err) {
            alert(err.message || 'Failed to delete record');
          }
        }}
        title="Delete Attendance Record"
        message={`Are you sure you want to delete the attendance record for ${deleteConfirm?.employee?.fullName || 'Unknown'} on ${deleteConfirm?.date ? dayjs(deleteConfirm.date).format('MMM D, YYYY') : '?'}?`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
