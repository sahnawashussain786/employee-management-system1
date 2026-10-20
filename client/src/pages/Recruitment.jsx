import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import dayjs from 'dayjs';
import { Briefcase, Plus, Users, Filter, Search } from 'lucide-react';
import { StatusBadge, Badge, EmptyState, ProgressBar } from '../components/UI';

const stageColors = { applied: 'bg-gray-500', screening: 'bg-blue-500', interview: 'bg-amber-500', offer: 'bg-emerald-500', hired: 'bg-green-600', rejected: 'bg-red-500' };

export default function Recruitment() {
  const api = useApi();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([api.get('/api/recruitment/jobs'), api.get('/api/recruitment/applications')]).then(([j, a]) => {
      setJobs(j.data || []);
      setApplications(a.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeJobs = statusFilter ? jobs.filter((j) => j.status === statusFilter) : jobs.filter((j) => j.status === 'open');
  const openCount = jobs.filter((j) => j.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="mt-1 text-sm text-gray-500">Manage job postings and applicants</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
          <Plus className="h-4 w-4" /> Post New Job
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setActiveTab('jobs')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'jobs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Job Postings ({jobs.length})
        </button>
        <button onClick={() => setActiveTab('applications')} className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applications' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Applications ({applications.length})
        </button>
      </div>

      {loading ? <div className="flex items-center justify-center min-h-[400px]"><div className="spinner" /></div> : activeTab === 'jobs' ? (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Briefcase className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{openCount}</p><p className="text-sm text-gray-500">Open Positions</p></div></div></div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{applications.filter((a) => a.stage !== 'rejected').length}</p><p className="text-sm text-gray-500">Active Applicants</p></div></div></div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Briefcase className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{applications.filter((a) => a.stage === 'interview').length}</p><p className="text-sm text-gray-500">In Interview</p></div></div></div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><Briefcase className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{applications.filter((a) => a.stage === 'hired').length}</p><p className="text-sm text-gray-500">Hired This Year</p></div></div></div>
          </div>

          {/* Job listings */}
          {jobs.length === 0 ? <EmptyState icon={Briefcase} title="No job postings" description="Post your first job to start recruiting." /> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <div key={job._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.department?.name || 'No department'} • {job.location}</p>
                    </div>
                    <StatusBadge status={job.status} type="default" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    {job.experienceMin > 0 && <span>{job.experienceMin}-{job.experienceMax > 0 ? job.experienceMax : '+'} yrs exp</span>}
                    <span>                      {job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
                    {job.salaryMin > 0 && <span>${job.salaryMin.toLocaleString()}-${job.salaryMax > 0 ? job.salaryMax.toLocaleString() : 'Negotiable'}</span>}                      {job.isRemote && <span>Remote</span>}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{job.applicantsCount || 0} applicants</span>
                    <div className="flex gap-1">
                      <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20">View Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {applications.length === 0 ? <EmptyState icon={Users} title="No applications" description="No applicants yet." /> : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">{app.candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{app.candidate.name}</p>
                      <p className="text-xs text-gray-500">{app.candidate.email} • {app.job?.title || 'Unknown position'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${app.severity || 'text-gray-600'}`} style={{ backgroundColor: `${stageColors[app.stage]}20`, color: stageColors[app.stage] }}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stageColors[app.stage]}`} />
                      {app.stage}
                    </span>
                    {app.rating > 0 && <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<span key={i} className={i < app.rating ? 'text-amber-400' : 'text-gray-300'}>★</span>))}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
