import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { api, useResource } from '../api.js';
import { Badge, PageHeader, Loading, ErrorBanner } from '../ui.jsx';
import FormModal from '../FormModal.jsx';

const COLUMNS = ['To Do', 'In Progress', 'Done'];
const FIELDS = [
  { name: 'title', label: 'Task title', autoFocus: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
  { name: 'status', label: 'Status', type: 'select', options: COLUMNS },
];
const BLANK = { title: '', description: '', priority: 'Medium', status: 'To Do' };

export default function Tasks() {
  const { data, error, loading, reload } = useResource('/tasks');
  const [modal, setModal] = useState(null);
  const [actionError, setActionError] = useState('');

  if (loading) return <Loading />;
  if (!data) return <ErrorBanner message={error} onRetry={reload} />;

  const act = async (fn) => { try { await fn(); setActionError(''); await reload(); } catch (e) { setActionError(e.message); } };
  const move = (t, dir) => act(() => api.put(`/tasks/${t._id}`, { status: COLUMNS[COLUMNS.indexOf(t.status) + dir] }));
  const save = async (values) => {
    if (modal._id) await api.put(`/tasks/${modal._id}`, values);
    else await api.post('/tasks', values);
    await reload();
  };

  return (
    <>
      <PageHeader title="Tasks" subtitle="Move work across the board as it progresses."
        action={<button className="btn-primary" onClick={() => setModal(BLANK)}><Plus className="h-4 w-4" /> Add task</button>} />
      <ErrorBanner message={actionError || error} />

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = data.filter((t) => t.status === col);
          return (
            <section key={col} className="rounded-xl border border-white/10 bg-navy-900 p-3" aria-label={col}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-white">{col}</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.length === 0 && <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-500">No tasks in {col}</p>}
                {items.map((t) => (
                  <article key={t._id} className="card p-3 transition-colors hover:border-white/20">
                    <p className="text-sm font-medium text-white">{t.title}</p>
                    {t.description && <p className="mt-1 text-xs text-slate-400">{t.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <Badge value={t.priority} />
                      <div className="flex">
                        {col !== COLUMNS[0] && <button className="icon-btn h-7 w-7" aria-label={`Move ${t.title} back`} onClick={() => move(t, -1)}><ArrowLeft className="h-3.5 w-3.5" /></button>}
                        {col !== COLUMNS[2] && <button className="icon-btn h-7 w-7" aria-label={`Move ${t.title} forward`} onClick={() => move(t, 1)}><ArrowRight className="h-3.5 w-3.5" /></button>}
                        <button className="icon-btn h-7 w-7" aria-label={`Edit ${t.title}`} onClick={() => setModal(t)}><Pencil className="h-3.5 w-3.5" /></button>
                        <button className="icon-btn h-7 w-7 hover:text-red-300" aria-label={`Delete ${t.title}`}
                          onClick={() => window.confirm(`Delete task "${t.title}"?`) && act(() => api.del(`/tasks/${t._id}`))}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {modal && <FormModal title={modal._id ? 'Edit task' : 'Add task'} fields={FIELDS} initial={modal} onSubmit={save} onClose={() => setModal(null)} />}
    </>
  );
}
