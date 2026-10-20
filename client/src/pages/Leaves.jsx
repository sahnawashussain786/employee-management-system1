import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import {
  CalendarDays,
  Plus,
  Clock,
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ConfirmDialog } from '../components/UI';
import { LeaveTypeBadge } from './LeaveTypeBadge';

export default function Leaves() {
  const api = useApi();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({ status: '', leaveType: '', from: '', to: '', mine: 'false' });
  const [showModal, setShowModal] = useState(false);
  const [approvalModal, setApprovalModal] = useState(null);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    isHalfDay: false,
    reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [balance, setBalance] = useState([]);

  const isAdmin = ['admin', 'hr'].includes(user?.role);
  const isManager = user?.role === 'manager';
  const isOwn = (leave) => String(leave.employee?._id) === String(user?.employee?._id);

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  useEffect(() => {
    api.get('/api/leaves/types').then((res) => setLeaveTypes(res.data || [])).catch(() => {});
    api.get('/api/leaves/balance').then((res) => setBalance(res.data || [])).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        mine: filters.mine,
        ...(filters.status && { status: filters.status }),
        ...(filters.leaveType && { leaveType: filters.leaveType }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
      });
      const res = await api.get(`/api/leaves?${params}`);
      setLeaves(res.data?.data || []);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setSaving(true);
    try {
      const res = await api.post('/api/leaves', formData);
      setLeaves((prev) => [res.data, ...prev]);
      setShowModal(false);
      setBalance((prev) => []);
    } catch (err) {
      alert(err.message || 'Failed to apply for leave');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalModal) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/leaves/${approvalModal._id}/approve`, { comments: approvalModal.comments });
      setLeaves((prev) => prev.map((l) => (String(l._id) === String(approvalModal._id) ? res.data : l)));
      setApprovalModal(null);
    } catch (err) {
      alert(err.message || 'Failed to approve leave');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!approvalModal) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/leaves/${approvalModal._id}/reject`, { comments: approvalModal.comments });
      setLeaves((prev) => prev.map((l) => (String(l._id) === String(approvalModal._id) ? res.data : l)));
      setApprovalModal(null);
    } catch (err) {
      alert(err.message || 'Failed to reject leave');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const res = await api.patch(`/api/leaves/${deleteConfirm._id}/cancel`);
      setLeaves((prev) => prev.map((l) => (String(l._id) === String(deleteConfirm._id) ? res.data : l)));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || 'Failed to cancel leave');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/api/leaves/${deleteConfirm._id}`);
      setLeaves((prev) => prev.filter((l) => String(l._id) !== String(deleteConfirm._id)));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || 'Failed to delete leave');
    }
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage leave requests and balances</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              onClick={() => { setFilters((f) => ({ ...f, mine: 'false' })); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filters.mine === 'false' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Requests
            </button>
          )}
          <button
            onClick={() => { setFilters((f) => ({ ...f, mine: 'true' })); setPage(1); }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filters.mine === 'true' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            My Leaves
          </button>
          {(isAdmin || isManager) && (
            <button
              onClick={() => { setFilters((f) => ({ ...f, mine: 'false', status: 'pending' })); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filters.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending ({leaves.filter((l) => l.status === 'pending').length})
            </button>
          )}
        </div>
      </div>

      {/* Balance cards */}
      {balance.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {balance.map((b) => (
            <div key={b.leaveType._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: b.leaveType.color }} />
                  <span className="text-sm font-medium text-gray-900">{b.leaveType.name}</span>
                </div>
                <Badge variant={b.leaveType.isPaid ? 'success' : 'default'}>
                  {b.leaveType.isPaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{b.balance}</p>
                  <p className="text-xs text-gray-500">days available</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{b.entitlement} granted</p>
                  <p>{b.used} used</p>
                  {b.pending > 0 && <p>{b.pending} pending</p>}
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, ((b.entitlement - b.balance) / b.entitlement) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className={inputClass}
          />
        </div>
        <select
          value={filters.leaveType}
          onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
          className={inputClass}
        >
          <option value="">All Types</option>
          {leaveTypes.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className={inputClass}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          className={inputClass}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className={inputClass}
        />
        {(filters.leaveType || filters.status || filters.from || filters.to) && (
          <button onClick={() => setFilters({})} className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Clear
          </button>
        )}
      </div>

      {/* Apply button */}
      {user?.employee && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Apply for Leave
          </button>
        </div>
      )}

      {/* Leaves list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-3 w-64 rounded bg-gray-200" />
              </div>
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      ) : leaves.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No leave requests"
          description={filters.mine === 'true' ? 'You haven\'t applied for any leave yet.' : 'No leave requests match your filters.'}
          action={user?.employee && <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"><Plus className="h-4 w-4" />Apply for Leave</button>}
        />
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => {
            const canApprove = isAdmin || (isManager && !isOwn(leave));
            const canCancel = isOwn(leave) || isAdmin;
            const typeColor = leave.leaveType?.color || '#4f46e5';

            return (
              <div key={leave._id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold"
                      style={{ backgroundColor: typeColor }}
                    >
                      {leave.employee?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{leave.employee?.fullName || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {dayjs(leave.startDate).format('MMM D')} – {dayjs(leave.endDate).format('MMM D, YYYY')}
                        {' '}({leave.days} day{leave.days !== 1 ? 's' : ''}{leave.isHalfDay ? ' (half day)' : ''})
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-xs font-medium text-white px-2 py-1 rounded"
                      style={{ backgroundColor: typeColor }}
                    >
                      {leave.leaveType?.name}
                    </span>
                    <StatusBadge status={leave.status} />
                    {leave.days && <span className="text-sm text-gray-600">{leave.days}d</span>}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {leave.reviewedBy && (
                      <span className="text-xs text-gray-500">
                        by {leave.reviewedBy?.employee?.fullName || leave.reviewedBy?.firstName || 'Unknown'}
                        {' '}{dayjs(leave.reviewedAt).format('MMM D, h:mm A')}
                      </span>
                    )}
                    {canApprove && leave.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setApprovalModal({ ...leave, comments: '' })}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckCircle className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => setApprovalModal({ ...leave, comments: '' })}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    )}
                    {canCancel && (leave.status === 'pending' || leave.status === 'approved') && (
                      <button
                        onClick={() => setDeleteConfirm(leave)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-500 hover:bg-gray-100"
                      >
                        <RotateCcw className="h-3 w-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
                {leave.reason && <p className="text-sm text-gray-600 ml-13 pl-13">{leave.reason}</p>}
                {leave.reviewComments && <p className="text-sm text-gray-600 ml-13 pl-13"><em>{leave.reviewComments}</em></p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Apply for Leave</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Leave Type *</label>
                <select required value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} className={inputClass}>
                  <option value="">Select leave type</option>
                  {leaveTypes.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.daysPerYear} days/year)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start Date *</label>
                  <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={inputClass} min={dayjs().format('YYYY-MM-DD')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">End Date *</label>
                  <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={inputClass} min={formData.startDate || dayjs().format('YYYY-MM-DD')} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Half day</span>
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Reason (optional)</label>
                <textarea rows={3} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="block w-full rounded-lg border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">{saving ? <div className="spinner h-4 w-4" /> : <><Plus className="h-4 w-4" /> Apply</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {approvalModal.status === 'pending' ? 'Review Leave Request' : `Leave: ${approvalModal.status}`}
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {approvalModal.employee?.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{approvalModal.employee?.fullName || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">
                    {dayjs(approvalModal.startDate).format('MMM D')} – {dayjs(approvalModal.endDate).format('MMM D, YYYY')}
                  </p>
                </div>
              </div>
              {approvalModal.reason && <p className="mt-2 text-sm text-gray-600">{approvalModal.reason}</p>}
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Comments (optional)</label>
              <textarea
                rows={2}
                value={approvalModal.comments || ''}
                onChange={(e) => setApprovalModal({ ...approvalModal, comments: e.target.value })}
                className="block w-full rounded-lg border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Add a comment..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setApprovalModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleReject}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <div className="spinner h-4 w-4" /> : <><CheckCircle className="h-4 w-4" /> Approve</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={deleteConfirm?.status === 'approved' || deleteConfirm?.status === 'pending' ? handleCancel : handleDelete}
        title={deleteConfirm?.status === 'approved' || deleteConfirm?.status === 'pending' ? 'Cancel Leave Request' : 'Delete Leave Request'}
        message={`Are you sure you want to ${deleteConfirm?.status === 'approved' || deleteConfirm?.status === 'pending' ? 'cancel' : 'delete'} this ${deleteConfirm?.leaveType?.name || 'leave'} request?`}
        confirmText="Confirm"
        danger
      />
    </div>
  );
}
