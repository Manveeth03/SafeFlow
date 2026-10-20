import { useState } from 'react';
import { Plus, Pencil, CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react';
import { api, useResource } from '../api.js';
import { Badge, PageHeader, Loading, ErrorBanner, EmptyState } from '../ui.jsx';
import FormModal from '../FormModal.jsx';
import { riskScore, riskLevel } from '../risk.js';

const SCALE = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));
const FIELDS = [
  { name: 'title', label: 'Hazard title', autoFocus: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'severity', label: 'Severity (1 minor – 5 catastrophic)', type: 'select', options: SCALE, numeric: true },
  { name: 'likelihood', label: 'Likelihood (1 rare – 5 frequent)', type: 'select', options: SCALE, numeric: true },
  { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Mitigating', 'Resolved'] },
  { name: 'mitigation', label: 'Mitigation', type: 'textarea' },
];
const BLANK = { title: '', description: '', mitigation: '', severity: 3, likelihood: 3, status: 'Open' };

const Preview = (v) => {
  const score = riskScore(v.severity, v.likelihood);
  const level = riskLevel(score);
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm">
      <span className="text-slate-400">Risk score ({v.severity} × {v.likelihood})</span>
      <span className="flex items-center gap-2 font-medium text-white">{score} <Badge value={level} /></span>
    </div>
  );
};

export default function Hazards() {
  const { data, error, loading, reload } = useResource('/hazards');
  const [modal, setModal] = useState(null);
  const [status, setStatus] = useState('');
  const [actionError, setActionError] = useState('');

  if (loading) return <Loading />;
  if (!data) return <ErrorBanner message={error} onRetry={reload} />;

  const rows = data.filter((h) => !status || h.status === status);
  const act = async (fn) => { try { await fn(); setActionError(''); await reload(); } catch (e) { setActionError(e.message); } };
  const save = async (values) => {
    if (modal._id) await api.put(`/hazards/${modal._id}`, values);
    else await api.post('/hazards', values);
    await reload();
  };
  const add = <button className="btn-primary" onClick={() => setModal(BLANK)}><Plus className="h-4 w-4" /> Add hazard</button>;

  return (
    <>
      <PageHeader title="Hazard Register" subtitle="Risk score is severity × likelihood. Unresolved critical hazards block release." action={add} />
      <ErrorBanner message={actionError || error} />
      <div className="mb-3">
        <select className="input w-auto" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option><option>Open</option><option>Mitigating</option><option>Resolved</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState icon={ShieldAlert} title={data.length ? 'No hazards with that status' : 'No hazards logged'}
            text={data.length ? 'Choose another status to see more.' : 'Log the first hazard to start scoring risk.'} action={!data.length && add} />
        ) : (
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-white/10"><tr>
              <th className="th">Hazard</th><th className="th">Severity</th><th className="th">Likelihood</th><th className="th">Risk</th><th className="th">Status</th><th className="th" />
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((h) => (
                <tr key={h._id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="td text-white">{h.title}</td>
                  <td className="td">{h.severity}</td>
                  <td className="td">{h.likelihood}</td>
                  <td className="td"><span className="mr-2 font-medium text-white">{h.riskScore}</span><Badge value={h.riskLevel} /></td>
                  <td className="td"><Badge value={h.status} /></td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      {h.status !== 'Resolved' && (
                        <button className="btn-ghost px-2 py-1 text-xs" onClick={() => act(() => api.patch(`/hazards/${h._id}/resolve`))}><CheckCircle2 className="h-3.5 w-3.5 text-teal-300" /> Resolve</button>
                      )}
                      <button className="icon-btn" aria-label={`Edit ${h.title}`} onClick={() => setModal(h)}><Pencil className="h-4 w-4" /></button>
                      <button className="icon-btn hover:text-red-300" aria-label={`Delete ${h.title}`}
                        onClick={() => window.confirm(`Delete hazard "${h.title}"?`) && act(() => api.del(`/hazards/${h._id}`))}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <FormModal title={modal._id ? 'Edit hazard' : 'Add hazard'} fields={FIELDS} initial={modal} preview={Preview} onSubmit={save} onClose={() => setModal(null)} />}
    </>
  );
}
