import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { Target, Plus, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge, ProgressBar, EmptyState } from '../components/UI';

const priorityColors = { low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-amber-500', critical: 'bg-red-500' };
const statusColors = { 'not-started': 'bg-gray-400', 'in-progress': 'bg-blue-500', 'at-risk': 'bg-red-500', completed: 'bg-emerald-500', cancelled: 'bg-gray-400' };

export default function Goals() {
  const api = useApi();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/goals').then((res) => setGoals(res.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const stats = {
    total: goals.length,
    inProgress: goals.filter((g) => g.status === 'in-progress').length,
    completed: goals.filter((g) => g.status === 'completed').length,
    atRisk: goals.filter((g) => g.status === 'at-risk').length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="mt-1 text-sm text-gray-500">Employee goal tracking and OKRs</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><Plus className="h-4 w-4" /> Add Goal</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Goals</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Target className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p><p className="text-sm text-gray-500">In Progress</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.completed}</p><p className="text-sm text-gray-500">Completed</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.atRisk}</p><p className="text-sm text-gray-500">At Risk</p></div></div></div>
      </div>

      {goals.length === 0 ? <EmptyState icon={Target} title="No goals" description="Set your first goal to start tracking." /> : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  <Badge variant={goal.category === 'okr' ? 'primary' : goal.category === 'critical' ? 'danger' : 'default'}>{goal.category}</Badge>
                  <span className={`inline-flex items-center gap-1 h-5 min-w-[20px] rounded-full px-2 text-[10px] font-medium text-white ${priorityColors[goal.priority]}`}>{goal.priority}</span>
                </div>
                <p className="text-sm text-gray-500">{goal.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                  {goal.employee && <span>{goal.employee.fullName || 'Unknown'}</span>}
                  {goal.dueDate && <span>Due: {dayjs(goal.dueDate).format('MMM D, YYYY')}</span>}
                  <span>{goal.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="min-w-[120px]">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">{goal.progress}%</span>
                    <span className={`text-xs font-medium ${goal.status === 'completed' ? 'text-emerald-600' : 'text-gray-500'}`}>{goal.status}</span>
                  </div>
                  <ProgressBar value={goal.progress} color={goal.status === 'completed' ? 'bg-emerald-500' : goal.status === 'at-risk' ? 'bg-red-500' : 'bg-primary'} />
                </div>
                {goal.status !== 'completed' && goal.status !== 'cancelled' && (
                  <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><Target className="h-4 w-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
