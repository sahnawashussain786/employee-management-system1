import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import {
  Laptop, Plus, Edit, Trash2, Search, Filter,
  AlertTriangle, CheckCircle, Wrench, Package, XCircle,
} from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ConfirmDialog } from '../components/UI';

const assetIcons = {
  laptop: Laptop,
  monitor: Laptop,
  phone: Laptop,
  tablet: Laptop,
  headset: Laptop,
  vehicle: Laptop,
  furniture: Laptop,
  'id-card': Laptop,
  other: Laptop,
};

const statusConfig = {
  available: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  assigned: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'under-maintenance': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  retired: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  lost: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function Assets() {
  const api = useApi();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isAdmin = ['admin', 'hr'].includes(user?.role);

  useEffect(() => {
    api.get('/api/assets').then((res) => setAssets(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = assets.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.assetTag?.toLowerCase().includes(search.toLowerCase()) && !a.serialNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (typeFilter && a.assetType !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: assets.length,
    available: assets.filter((a) => a.status === 'available').length,
    assigned: assets.filter((a) => a.status === 'assigned').length,
    maintenance: assets.filter((a) => a.status === 'under-maintenance').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="mt-1 text-sm text-gray-500">Manage company equipment and assets</p>
        </div>
        {isAdmin && (
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><Laptop className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Assets</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.available}</p><p className="text-sm text-gray-500">Available</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Package className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.assigned}</p><p className="text-sm text-gray-500">Assigned</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Wrench className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p><p className="text-sm text-gray-500">Maintenance</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="under-maintenance">Under Maintenance</option>
          <option value="retired">Retired</option>
          <option value="lost">Lost</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All Types</option>
          <option value="laptop">Laptop</option>
          <option value="monitor">Monitor</option>
          <option value="phone">Phone</option>
          <option value="tablet">Tablet</option>
          <option value="headset">Headset</option>
          <option value="vehicle">Vehicle</option>
          <option value="furniture">Furniture</option>
          <option value="id-card">ID Card</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Assets grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"><div className="h-4 w-32 rounded bg-gray-200 mb-3" /><div className="h-3 w-48 rounded bg-gray-200" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Laptop} title="No assets found" description="Add your first asset to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => {
            const Icon = assetIcons[asset.assetType] || Laptop;
            const sc = statusConfig[asset.status] || statusConfig.available;
            return (
              <div key={asset._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${sc.bg} ${sc.text}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                      <p className="text-xs text-gray-500">{asset.assetTag || 'No tag'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{asset.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  {asset.brand && <p><span className="text-gray-400">Brand:</span> {asset.brand} {asset.model ? `(${asset.model})` : ''}</p>}
                  {asset.serialNumber && <p><span className="text-gray-400">S/N:</span> {asset.serialNumber}</p>}
                  {asset.location && <p><span className="text-gray-400">Location:</span> {asset.location}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                  {asset.purchaseDate && <span>Purchased: {dayjs(asset.purchaseDate).format('MMM D, YYYY')}</span>}
                  {asset.purchaseCost > 0 && <span>Cost: ${asset.purchaseCost.toLocaleString()}</span>}                    {asset.condition && <span>Condition: {asset.condition}</span>}
                </div>
                {asset.assignedTo && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                    <span className="text-gray-400">Assigned to:</span>
                    <span className="font-medium text-gray-700 ml-1">{asset.assignedTo?.fullName || 'Unknown'}</span>
                  </div>
                )}
                {isAdmin && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1">
                    <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteConfirm(asset)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={async () => { if (!deleteConfirm) return; try { await api.delete(`/api/assets/${deleteConfirm._id}`); setAssets((p) => p.filter((a) => String(a._id) !== String(deleteConfirm._id))); setDeleteConfirm(null); } catch (err) { alert(err.message || 'Failed to delete'); } }} title="Delete Asset" message={`Are you sure you want to delete "${deleteConfirm?.name}"?`} confirmText="Delete" danger />
    </div>
  );
}
