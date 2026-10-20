import { useEffect, useState } from 'react';
import { LayoutDashboard, ClipboardList, ShieldAlert, ListTodo, ShieldCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Requirements from './pages/Requirements.jsx';
import Hazards from './pages/Hazards.jsx';
import Tasks from './pages/Tasks.jsx';

const NAV = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: Dashboard },
  { path: 'requirements', label: 'Requirements', icon: ClipboardList, page: Requirements },
  { path: 'hazards', label: 'Hazard Register', icon: ShieldAlert, page: Hazards },
  { path: 'tasks', label: 'Tasks', icon: ListTodo, page: Tasks },
];

const current = () => NAV.find((n) => n.path === window.location.hash.slice(2)) || NAV[0];

export default function App() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => setRoute(current());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const Page = route.page;

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-white/10 bg-navy-900 md:w-56">
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-teal-200"><ShieldCheck className="h-4 w-4" /></div>
          <span className="hidden font-semibold tracking-tight text-white md:block">SafeFlow <span className="font-normal text-slate-400">Lite</span></span>
        </div>
        <nav className="flex-1 space-y-1 p-2" aria-label="Main">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = route.path === path;
            return (
              <a key={path} href={`#/${path}`} title={label} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-blue-500/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-teal-300' : ''}`} />
                <span className="hidden md:block">{label}</span>
              </a>
            );
          })}
        </nav>
        <p className="hidden p-4 text-xs text-slate-500 md:block">Safety project tracker</p>
      </aside>
      <main className="pl-16 md:pl-56">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <Page key={route.path} />
        </div>
      </main>
    </div>
  );
}
