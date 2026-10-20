import { useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';

const TONES = {
  slate: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  blue: 'bg-blue-500/15 text-blue-300 ring-blue-400/25',
  teal: 'bg-teal-500/15 text-teal-300 ring-teal-400/25',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/25',
  orange: 'bg-orange-500/15 text-orange-300 ring-orange-400/25',
  red: 'bg-red-500/15 text-red-300 ring-red-400/25',
};

const BADGE_TONE = {
  Low: 'teal', Medium: 'amber', High: 'orange', Critical: 'red',
  Draft: 'slate', Approved: 'blue', Implemented: 'amber', Verified: 'teal',
  Pending: 'slate', Passed: 'teal', Failed: 'red',
  Open: 'red', Mitigating: 'amber', Resolved: 'teal',
  'To Do': 'slate', 'In Progress': 'blue', Done: 'teal',
};

export function Badge({ value, tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone || BADGE_TONE[value] || 'slate']}`}>
      {value}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-16 text-sm text-slate-400" role="status">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && <button className="underline" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 rounded-xl border border-white/10 bg-navy-800 p-3 text-blue-300"><Icon className="h-5 w-5" /></div>
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="font-medium text-white">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
