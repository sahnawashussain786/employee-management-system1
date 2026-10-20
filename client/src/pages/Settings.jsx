import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import { Settings, Save, Building2, Globe, Clock, DollarSign, Shield } from 'lucide-react';
import { Badge, ProgressBar } from '../components/UI';

export default function CompanySettings() {
  const api = useApi();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/api/settings').then((res) => setSettings(res.data || null)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/settings', settings);
      alert('Settings saved successfully');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;
  if (!settings) return <div className="flex items-center justify-center min-h-[400px] text-gray-500">No settings found</div>;

  const inputClass = 'block w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage company settings and configurations</p>
      </div>

      {/* Company Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Company Name</label>
            <input value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Legal Name</label>
            <input value={settings.legalName} onChange={(e) => setSettings({ ...settings, legalName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Website</label>
            <input value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Industry</label>
            <input value={settings.industry} onChange={(e) => setSettings({ ...settings, industry: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Founded Year</label>
            <input type="number" value={settings.founded || ''} onChange={(e) => setSettings({ ...settings, founded: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
            <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className={inputClass}>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className={inputClass}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
          <h2 className="text-lg font-semibold text-gray-900">Work Schedule</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Work Start Time</label>
            <input type="time" value={settings.workStartTime} onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Work End Time</label>
            <input type="time" value={settings.workEndTime} onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Late Grace (minutes)</label>
            <input type="number" min={0} value={settings.lateGraceMinutes} onChange={(e) => setSettings({ ...settings, lateGraceMinutes: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Standard Work (minutes)</label>
            <input type="number" min={0} value={settings.standardWorkMinutes} onChange={(e) => setSettings({ ...settings, standardWorkMinutes: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date Format</label>
            <select value={settings.dateFormat} onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })} className={inputClass}>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fiscal Year Start (month)</label>
            <select value={settings.fiscalYearStartMonth} onChange={(e) => setSettings({ ...settings, fiscalYearStartMonth: Number(e.target.value) })} className={inputClass}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{dayjs(`2024-${String(m).padStart(2, '0')}-01`).format('MMMM')}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Payroll Day (of month)</label>
            <input type="number" min={1} max={28} value={settings.payrollDay} onChange={(e) => setSettings({ ...settings, payrollDay: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Leave Year Start (month)</label>
            <select value={settings.leaveYearStartMonth} onChange={(e) => setSettings({ ...settings, leaveYearStartMonth: Number(e.target.value) })} className={inputClass}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{dayjs(`2024-${String(m).padStart(2, '0')}-01`).format('MMMM')}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-gray-50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.autoMarkAbsent} onChange={(e) => setSettings({ ...settings, autoMarkAbsent: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <div>
              <span className="text-sm font-medium text-gray-900">Auto-mark absent</span>
              <p className="text-xs text-gray-500">Automatically mark employees as absent if they have no attendance record and no approved leave</p>
            </div>
          </label>
        </div>
      </div>

      {/* Payroll Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><DollarSign className="h-5 w-5" /></div>
          <h2 className="text-lg font-semibold text-gray-900">Payroll Configuration</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">PF Percentage (%)</label>
            <input type="number" min={0} max={100} step={0.5} value={settings.payroll.pfPercent} onChange={(e) => setSettings({ ...settings, payroll: { ...settings.payroll, pfPercent: Number(e.target.value) } })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tax Percentage (%)</label>
            <input type="number" min={0} max={100} step={0.5} value={settings.payroll.taxPercent} onChange={(e) => setSettings({ ...settings, payroll: { ...settings.payroll, taxPercent: Number(e.target.value) } })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Professional Tax</label>
            <input type="number" min={0} value={settings.payroll.professionalTax} onChange={(e) => setSettings({ ...settings, payroll: { ...settings.payroll, professionalTax: Number(e.target.value) } })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Insurance</label>
            <input type="number" min={0} value={settings.payroll.insurance} onChange={(e) => setSettings({ ...settings, payroll: { ...settings.payroll, insurance: Number(e.target.value) } })} className={inputClass} />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.payroll.enablePf} onChange={(e) => setSettings({ ...settings, payroll: { ...settings.payroll, enablePf: e.target.checked } })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm text-gray-700">Enable PF</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.payroll.enableTax} onChange={(e) => setSettings({ ...settings, payroll: { ...settings.payroll, enableTax: e.target.checked } })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm text-gray-700">Enable Tax</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => setSettings(JSON.parse(JSON.stringify(settings)))} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Reset</button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
          {saving ? <div className="spinner h-4 w-4" /> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
