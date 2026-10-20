import { useState } from 'react';
import { Modal, ErrorBanner } from './ui.jsx';

/**
 * Generic create/edit dialog.
 * fields: [{ name, label, type: 'text'|'textarea'|'select'|'checkbox', options? }]
 * preview(values) can render extra content, e.g. a live risk score.
 */
export default function FormModal({ title, fields, initial, onSubmit, onClose, submitLabel = 'Save', preview }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        {fields.map((f) => (
          <label key={f.name} className={f.type === 'checkbox' ? 'flex items-center gap-2 text-sm' : 'block text-sm'}>
            {f.type === 'checkbox' ? (
              <>
                <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4 rounded accent-blue-500" />
                <span className="text-slate-300">{f.label}</span>
              </>
            ) : (
              <>
                <span className="mb-1.5 block text-slate-300">{f.label}</span>
                {f.type === 'textarea' && <textarea rows={3} className="input" value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />}
                {f.type === 'select' && (
                  <select className="input" value={values[f.name]} onChange={(e) => set(f.name, f.numeric ? Number(e.target.value) : e.target.value)}>
                    {f.options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                  </select>
                )}
                {(!f.type || f.type === 'text') && <input className="input" value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} autoFocus={f.autoFocus} />}
              </>
            )}
          </label>
        ))}
        {preview && preview(values)}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
        </div>
      </form>
    </Modal>
  );
}
