import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { FolderKanban, Plus, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ProgressBar } from '../components/UI';

const projectStatusConfig = { planned: { bg: 'bg-gray-50', text: 'text-gray-600' }, active: { bg: 'bg-blue-50', text: 'text-blue-700' }, 'on-hold': { bg: 'bg-amber-50', text: 'text-amber-700' }, completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' }, cancelled: { bg: 'bg-red-50', text: 'text-red-700' } };
const priorityColors = { low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-amber-500', critical: 'bg-red-500' };

export default function Projects() {
  const api = useApi();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/projects').then((res) => setProjects(res.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const stats = {
    active: projects.filter((p) => p.status === 'active').length,
    planned: projects.filter((p) => p.status === 'planned').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    total: projects.length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage company projects and assignments</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><Plus className="h-4 w-4" /> Create Project</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FolderKanban className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.total}</p><p className="text-sm text-gray-500">Total Projects</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FolderKanban className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.active}</p><p className="text-sm text-gray-500">Active</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><FolderKanban className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.planned}</p><p className="text-sm text-gray-500">Planned</p></div></div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><FolderKanban className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{stats.completed}</p><p className="text-sm text-gray-500">Completed</p></div></div></div>
      </div>

      {projects.length === 0 ? <EmptyState icon={FolderKanban} title="No projects" description="Create your first project." /> : (
        <div className="space-y-4">
          {projects.map((project) => {
            const sc = projectStatusConfig[project.status] || projectStatusConfig.planned;
            return (
              <div key={project._id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.code || 'No code'} • {project.client || 'Internal'}</p>
                    </div>
                    <Badge variant={project.billable ? 'primary' : 'default'}>{project.billable ? 'Billable' : 'Internal'}</Badge>
                  </div>
                  {project.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {project.startDate && <span>Start: {dayjs(project.startDate).format('MMM D, YYYY')}</span>}
                    {project.endDate && <span>End: {dayjs(project.endDate).format('MMM D, YYYY')}</span>}
                    {project.budget > 0 && <span>Budget: ${project.budget.toLocaleString()}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tags?.map((tag, i) => <Badge key={i} variant="info">{tag}</Badge>)}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {project.members?.map((m, i) => (
                      <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold" title={m.employee?.fullName}>
                        {m.employee?.fullName?.charAt(0) || '?'}
                      </div>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{project.members?.length || 0} members</span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-3 sm:min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${sc.bg} ${sc.text}`}>{project.status}</span>
                    <span className={`inline-flex items-center gap-1 h-5 min-w-[20px] rounded-full px-2 text-[10px] font-medium text-white ${priorityColors[project.priority]}`}>{project.priority}</span>
                  </div>
                  <div className="min-w-full">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} color={project.status === 'completed' ? 'bg-emerald-500' : project.status === 'on-hold' ? 'bg-amber-500' : 'bg-primary'} />
                  </div>
                  {project.deadline && dayjs(project.deadline).isBefore(dayjs(), 'day') && project.status !== 'completed' && (
                    <div className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" /> Overdue</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
