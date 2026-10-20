import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import { Users as UsersIcon, Search, Shield, Ban, LogIn, Edit, Trash2 } from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ConfirmDialog } from '../components/UI';

const canModifyUser = (u, currentUser) => String(u._id) !== String(currentUser?._id);

export default function Users() {
  const api = useApi();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/api/users').then((res) => setUsers(res.data?.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = users.filter((u) => {
    if (search && !u.email?.toLowerCase().includes(search.toLowerCase()) && !(u.employee?.fullName?.toLowerCase().includes(search.toLowerCase()))) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && String(u.isActive) !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    hr: users.filter((u) => u.role === 'hr').length,
    manager: users.filter((u) => u.role === 'manager').length,
    employee: users.filter((u) => u.role === 'employee').length,
    active: users.filter((u) => u.isActive).length,
  };

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">{stats.active} of {stats.total} active users</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><UsersIcon className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Users</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><LogIn className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.active}</p><p className="text-sm text-gray-500">Active</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Shield className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.admin + stats.hr}</p><p className="text-sm text-gray-500">Admins/HR</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Shield className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.manager}</p><p className="text-sm text-gray-500">Managers</p></div></div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputClass}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="manager">Manager</option>
          <option value="employee">Employee</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? <EmptyState icon={UsersIcon} title="No users found" description="No users match your filters." /> : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <div key={u._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 flex-1">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold ${u.role === 'admin' ? 'bg-red-600' : u.role === 'hr' ? 'bg-purple-600' : u.role === 'manager' ? 'bg-blue-600' : 'bg-gray-500'}`}>
                  {u.employee?.fullName?.charAt(0) || u.email?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{u.employee?.fullName || u.email}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                  {u.employee && <p className="text-xs text-gray-400">{u.employee.empId} • {u.employee.job?.designation || 'No designation'}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'hr' ? 'primary' : u.role === 'manager' ? 'info' : 'default'}>{u.role}</Badge>
                <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                {u.lastLoginAt && <span className="text-xs text-gray-400">Last login: {dayjs(u.lastLoginAt).format('MMM D, YYYY')}</span>}
                {canModify(u) && (
                  <div className="flex gap-1">
                    <button onClick={() => setResetPasswordConfirm(u)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><LogIn className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteConfirm(u)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          try {
            await api.delete(`/api/users/${deleteConfirm._id}`);
            setUsers((prev) => prev.filter((u) => String(u._id) !== String(deleteConfirm._id)));
            setDeleteConfirm(null);
          } catch (err) {
            alert(err.message || 'Failed to delete user');
          }
        }}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm?.employee?.fullName || deleteConfirm?.email}? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />

      <ConfirmDialog
        isOpen={!!resetPasswordConfirm}
        onClose={() => setResetPasswordConfirm(null)}
        onConfirm={async () => {
          if (!resetPasswordConfirm) return;
          try {
            await api.patch(`/api/users/${resetPasswordConfirm._id}/reset-password`);
            alert(`Password for ${resetPasswordConfirm?.employee?.fullName || resetPasswordConfirm?.email} has been reset to the default.`);
            setResetPasswordConfirm(null);
          } catch (err) {
            alert(err.message || 'Failed to reset password');
          }
        }}
        title="Reset Password"
        message={`Are you sure you want to reset the password for ${resetPasswordConfirm?.employee?.fullName || resetPasswordConfirm?.email}? The password will be set to the default.`}
        confirmText="Reset"
        danger
      />
    </div>
  );
}

function canModify(u) {
  return canModifyUser(u, currentUser);
}
