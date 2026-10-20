import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import {
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ConfirmDialog } from '../components/UI';

export default function Holidays() {
  const api = useApi();
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', date: dayjs().format('YYYY-MM-DD'), type: 'public', description: '', appliesTo: 'all', departments: [] });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [departments, setDepartments] = useState([]);

  const canManage = ['admin', 'hr'].includes(user?.role);
  const holidaysThisYear = holidays.filter((h) => dayjs(h.date).year() === dayjs().year());
  const totalDaysOff = holidaysThisYear.length;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    api.get('/api/departments').then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/holidays');
      setHolidays(res.data || []);
    } catch {
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ name: '', date: dayjs().format('YYYY-MM-DD'), type: 'public', description: '', appliesTo: 'all', departments: [] });
    setShowModal(true);
  };

  const handleEdit = (holiday) => {
    setEditingId(holiday._id);
    setFormData({
      name: holiday.name || '',
      date: dayjs(holiday.date).format('YYYY-MM-DD'),
      type: holiday.type || 'public',
      description: holiday.description || '',
      appliesTo: holiday.appliesTo || 'all',
      departments: holiday.departments?.map((d) => String(d._id)) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/api/holidays/${editingId}`, formData);
      } else {
        await api.post('/api/holidays', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/api/holidays/${deleteConfirm._id}`);
      setHolidays((prev) => prev.filter((h) => String(h._id) !== String(deleteConfirm._id)));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || 'Failed to delete holiday');
    }
  };

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = `/api/holidays?year=${dayjs().year()}`;
    link.download = `holidays-${dayjs().year()}.csv`;
    link.click();
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  const typeColors = { public: 'bg-blue-500', regional: 'bg-purple-500', optional: 'bg-amber-500', company: 'bg-emerald-500' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
          <p className="mt-1 text-sm text-gray-500">{totalDaysOff} holidays this year</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <button onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
              <Plus className="h-4 w-4" /> Add Holiday
            </button>
          )}
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{holidaysThisYear.length}</p>
              <p className="text-sm text-gray-500">This Year</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{holidays.filter((h) => h.type === 'public').length}</p>
              <p className="text-sm text-gray-500">Public Holidays</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{holidays.filter((h) => h.type === 'regional').length}</p>
              <p className="text-sm text-gray-500">Regional</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{holidays.filter((h) => h.type === 'company').length}</p>
              <p className="text-sm text-gray-500">Company Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar grid for current month */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{dayjs().format('MMMM YYYY')} Calendar</h2>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
          {Array.from({ length: dayjs().startOf('month').day() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {dayjs().daysInMonth().times((d) => d + 1).map((day) => {
            const date = dayjs(`${dayjs().year()}-${String(dayjs().month() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            const holiday = holidays.find((h) => dayjs(h.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD'));
            return (
              <div
                key={day}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  holiday ? 'hover:ring-2 ring-primary' : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: holiday ? (typeColors[holiday.type] || '#4f46e5') : '#f9fafb',
                  color: holiday ? '#fff' : '#6b7280',
                }}
                title={holiday ? holiday.name : `${day}`}
              >
                {day}
                {holiday && <span className="ml-1 text-[10px]">📅</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holidays list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-3 w-32 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No holidays added"
          description="Add holidays to track company holidays and time off."
          action={canManage && <button onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"><Plus className="h-4 w-4" />Add Holiday</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {holidays.sort((a, b) => dayjs(a.date) - dayjs(b.date)).map((holiday) => (
            <div key={holiday._id} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold text-lg flex-shrink-0"
                style={{ backgroundColor: typeColors[holiday.type] || '#4f46e5' }}
              >
                {dayjs(holiday.date).format('D')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{holiday.name}</h3>
                  <Badge variant={holiday.type === 'public' ? 'info' : holiday.type === 'company' ? 'success' : 'warning'}>
                    {holiday.type}
                  </Badge>
                </div>
                <p className="text-sm text-primary font-medium">{dayjs(holiday.date).format('dddd, MMMM D, YYYY')}</p>
                {holiday.description && <p className="mt-1 text-sm text-gray-500 line-clamp-1">{holiday.description}</p>}
              </div>
              {canManage && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleEdit(holiday)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(holiday)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Holiday' : 'Add Holiday'}</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputClass}>
                    <option value="public">Public</option>
                    <option value="regional">Regional</option>
                    <option value="optional">Optional</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="block w-full rounded-lg border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">{saving ? <div className="spinner h-4 w-4" /> : <><Plus className="h-4 w-4" /> {editingId ? 'Update' : 'Create'}</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"?`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
