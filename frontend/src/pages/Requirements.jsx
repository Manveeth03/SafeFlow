import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, ClipboardList } from 'lucide-react';
import { api, useResource } from '../api.js';
import { Badge, PageHeader, Loading, ErrorBanner, EmptyState } from '../ui.jsx';
import FormModal from '../FormModal.jsx';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Draft', 'Approved', 'Implemented', 'Verified'];
const FIELDS = [
  { name: 'title', label: 'Title', autoFocus: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'priority', label: 'Priority', type: 'select', options: PRIORITIES },
  { name: 'status', label: 'Status', type: 'select', options: STATUSES },
  { name: 'verification', label: 'Verification', type: 'select', options: ['Pending', 'Passed', 'Failed'] },
  { name: 'verificationRequired', label: 'Verification is required for release', type: 'checkbox' },
];
const BLANK = { title: '', description: '', priority: 'Medium', status: 'Draft', verification: 'Pending', verificationRequired: true };

export default function Requirements() {
  const { data, error, loading, reload } = useResource('/requirements');
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ q: '', status: '', priority: '' });
  const [actionError, setActionError] = useState('');

  if (loading) return <Loading />;
  if (!data) return <ErrorBanner message={error} onRetry={reload} />;

  const rows = data.filter((r) =>
    (!filters.status || r.status === filters.status) &&
    (!filters.priority || r.priority === filters.priority) &&
    (!filters.q || `${r.reqId} ${r.title}`.toLowerCase().includes(filters.q.toLowerCase())));

  const save = async (values) => {
    if (modal._id) await api.put(`/requirements/${modal._id}`, values);
    else await api.post('/requirements', values);
    await reload();
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.reqId}? This cannot be undone.`)) return;
    try { await api.del(`/requirements/${r._id}`); setActionError(''); await reload(); } catch (e) { setActionError(e.message); }
  };
  const add = <button className="btn-primary" onClick={() => setModal(BLANK)}><Plus className="h-4 w-4" /> Add requirement</button>;

  return (
    <>
      <PageHeader title="Requirements" subtitle="What the product must do, and whether it has been verified." action={add} />
      <ErrorBanner message={actionError || error} />

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search by ID or title" aria-label="Search requirements" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <select className="input w-auto" aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto" aria-label="Filter by priority" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title={data.length ? 'No requirements match' : 'No requirements yet'}
            text={data.length ? 'Try clearing a filter or changing the search.' : 'Add the first requirement to start tracking verification.'}
            action={!data.length && add} />
        ) : (
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-white/10"><tr>
              <th className="th">ID</th><th className="th">Title</th><th className="th">Priority</th><th className="th">Status</th><th className="th">Verification</th><th className="th" />
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r._id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="td font-medium text-blue-300">{r.reqId}</td>
                  <td className="td text-white">{r.title}</td>
                  <td className="td"><Badge value={r.priority} /></td>
                  <td className="td"><Badge value={r.status} /></td>
                  <td className="td">{r.verificationRequired ? <Badge value={r.verification} /> : <span className="text-xs text-slate-500">Not required</span>}</td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <button className="icon-btn" aria-label={`Edit ${r.reqId}`} onClick={() => setModal(r)}><Pencil className="h-4 w-4" /></button>
                      <button className="icon-btn hover:text-red-300" aria-label={`Delete ${r.reqId}`} onClick={() => remove(r)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <FormModal title={modal._id ? `Edit ${modal.reqId}` : 'Add requirement'} fields={FIELDS} initial={modal} onSubmit={save} onClose={() => setModal(null)} />}
    </>
  );
}
