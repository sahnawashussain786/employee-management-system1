import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { TreePine, Users, Building2 } from 'lucide-react';
import { EmptyState } from '../components/UI';

function OrgNode({ node, level = 0 }) {
  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className="flex flex-col items-center rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-lg font-semibold mb-2">
          {node.name?.charAt(0) || '?'}
        </div>
        <p className="text-sm font-semibold text-gray-900 text-center">{node.name}</p>
        <p className="text-xs text-gray-500 text-center">{node.title}</p>
        {node.department && <p className="text-xs text-gray-400 text-center mt-1">{node.department}</p>}
      </div>

      {/* Children connector */}
      {node.children && node.children.length > 0 && (
        <div className="flex-1 flex flex-col items-center">
          <div className="w-0.5 h-6 bg-gray-300" />
          <div className="flex gap-4 flex-1">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-gray-300" />
              <div className="flex flex-1 flex-wrap justify-center gap-4 mt-2">
                {node.children.map((child) => (
                  <OrgNode key={child.id} node={child} level={level + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const api = useApi();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/org/chart').then((res) => setData(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Chart</h1>
          <p className="mt-1 text-sm text-gray-500">View the company hierarchy</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TreePine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              <p className="text-sm text-gray-500">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{new Set(data.flatMap((n) => [n.department, ...(n.children || []).map((c) => c.department)])).size}</p>
              <p className="text-sm text-gray-500">Departments</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.filter((n) => n.children?.length > 0).length}</p>
              <p className="text-sm text-gray-500">Managers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Org tree */}
      {data.length === 0 ? (
        <EmptyState icon={TreePine} title="No data available" description="The organization chart is empty." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center min-w-[600px]">
            {data.map((root) => (
              <OrgNode key={root.id} node={root} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
