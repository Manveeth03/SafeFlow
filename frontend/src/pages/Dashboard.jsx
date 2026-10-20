import { ShieldCheck, ShieldAlert, ClipboardList, CheckCircle2, Activity, Gauge, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useResource } from '../api.js';
import { PageHeader, Loading, ErrorBanner, EmptyState } from '../ui.jsx';

const LEVEL_COLOR = { Low: '#2dd4bf', Medium: '#fbbf24', High: '#fb923c', Critical: '#f87171' };

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="card p-4 transition-colors hover:border-white/20">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-sm">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Readiness({ readiness }) {
  const ready = readiness.ready;
  return (
    <section className={`card mb-4 overflow-hidden border-l-4 p-5 ${ready ? 'border-l-teal-400' : 'border-l-red-400'}`} aria-label="Release readiness">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${ready ? 'bg-teal-500/15 text-teal-300' : 'bg-red-500/15 text-red-300'}`}>
            {ready ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm text-slate-400">Release readiness</p>
            <p className="text-xl font-semibold text-white">{ready ? 'Ready to release' : 'Release blocked'}</p>
          </div>
        </div>
        <p className="max-w-sm text-sm text-slate-400">
          {ready ? 'No unresolved critical hazards and all required verification has passed.' : 'Clear every blocker below before this release can go ahead.'}
        </p>
      </div>
      {!ready && (
        <ul className="mt-4 space-y-2">
          {readiness.blockers.map((b) => (
            <li key={b.code} className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <div>
                <p className="text-slate-200">{b.message}</p>
                <p className="text-xs text-slate-500">{b.items.slice(0, 4).join(', ')}{b.items.length > 4 ? ` and ${b.items.length - 4} more` : ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { data, error, loading, reload } = useResource('/dashboard');
  if (loading) return <Loading />;
  if (!data) return <ErrorBanner message={error} onRetry={reload} />;

  const total = data.riskDistribution.reduce((n, r) => n + r.count, 0);
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live view of requirements, hazards and tasks for this release." />
      <ErrorBanner message={error} onRetry={reload} />
      <Readiness readiness={data.readiness} />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={ClipboardList} label="Total requirements" value={data.totalRequirements} hint="Across all statuses" />
        <Stat icon={ShieldAlert} label="Open hazards" value={data.openHazards} hint={`${data.readiness.stats.criticalOpen} critical`} />
        <Stat icon={CheckCircle2} label="Completed tasks" value={`${data.completedTasks}/${data.totalTasks}`} hint="Tasks in Done" />
        <Stat icon={Gauge} label="Verification pass rate" value={data.passRate === null ? '—' : `${data.passRate}%`} hint={`${data.readiness.stats.passedVerifications} of ${data.readiness.stats.requiredVerifications} required`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="font-medium text-white">Open hazards by risk level</h2>
          {total === 0 ? (
            <EmptyState icon={ShieldCheck} title="No open hazards" text="Every logged hazard is resolved, or none have been added yet." />
          ) : (
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.riskDistribution} margin={{ left: -20 }}>
                  <XAxis dataKey="level" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#0a1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="count" name="Hazards" radius={[6, 6, 0, 0]}>
                    {data.riskDistribution.map((r) => <Cell key={r.level} fill={LEVEL_COLOR[r.level]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="font-medium text-white">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" text="Changes to requirements, hazards and tasks show up here." />
          ) : (
            <ul className="mt-3 space-y-3">
              {data.recentActivity.map((a) => (
                <li key={a._id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                  <div className="min-w-0">
                    <p className="truncate text-slate-200" title={a.message}>{a.message}</p>
                    <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
