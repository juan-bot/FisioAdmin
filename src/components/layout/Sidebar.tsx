import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../ui/BrandLogo';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

export function Sidebar({ navItems, activeTab, onTabChange, isOpen, setIsOpen }: SidebarProps) {
  const { profile, logout } = useAuth();
  const initials = (profile?.displayName || profile?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const navigationGroups = [
    { label: 'Organización', ids: ['dashboard', 'metrics', 'patients', 'appointments', 'calendar'] },
    { label: 'Atención clínica', ids: ['prescriptions', 'progress'] },
    { label: 'Administración', ids: ['finanzas', 'users'] },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200/80 w-64 max-w-[85%] z-50 transform transition-transform duration-300 dark:bg-slate-950 dark:border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        <div className="flex flex-col h-full">
          <div className="px-5 pb-7 pt-6"><BrandLogo /></div>

          <nav className="min-h-0 flex-1 px-3 overflow-y-auto pb-3">
            {navigationGroups.map(group => {
              const items = navItems.filter(item => group.ids.includes(item.id));
              if (items.length === 0) return null;
              return <section key={group.label} className="mb-5"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group.label}</p><div className="space-y-1">{items.map(item => (
                <button key={item.id} onClick={() => { onTabChange(item.id); setIsOpen(false); }} className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'}`}>
                  <span className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'}>{item.icon}</span>{item.label}
                </button>
              ))}</div></section>;
            })}
          </nav>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark font-bold text-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.displayName || profile?.email}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{profile?.role === 'admin' ? 'Administrador' : profile?.role === 'therapist' ? 'Terapeuta' : 'Pendiente'}</p>
              </div>
              <button onClick={() => logout()} aria-label="Cerrar sesión" title="Cerrar sesión" className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-light hover:text-danger transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
