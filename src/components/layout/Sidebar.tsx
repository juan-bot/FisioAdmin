import { useState, ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Logo = () => (
  <div className="flex items-center gap-3 px-5 py-5">
    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 dark:shadow-lg dark:shadow-[#a7c874]/40">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </div>
    <div>
      <h1 className="text-lg font-bold text-gray-900">FisioAdmin</h1>
      <span className="text-xs text-gray-500">Gestión Clínica</span>
    </div>
  </div>
);

export function Sidebar({ navItems, activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, logout } = useAuth();
  const initials = (profile?.displayName || profile?.email || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        className="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-primary text-white shadow-lg lg:hidden"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 max-w-[85%] z-50 transform transition-transform duration-300 dark:bg-gradient-to-b dark:from-[#15211a] dark:to-[#0d130e] dark:border-[#2c4730] ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        <div className="flex flex-col h-full">
          <Logo />

          <nav className="flex-1 mt-2 px-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-light text-primary-dark border-l-2 border-primary dark:bg-[#a7c874]/15 dark:text-[#c2e08a] dark:border-[#a7c874] dark:shadow-lg dark:shadow-[#a7c874]/40'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent dark:text-[#b6c6b4] dark:hover:bg-[#a7c874]/10 dark:hover:text-[#dde7da]'
                }`}
              >
                <span className={activeTab === item.id ? 'text-primary' : 'text-gray-500'}>{item.icon}</span>
                {item.label}
                {activeTab === item.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-[#2c4730]">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl dark:bg-[#a7c874]/10">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile?.displayName || profile?.email}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{profile?.role === 'admin' ? 'Administrador' : profile?.role === 'therapist' ? 'Terapeuta' : 'Pendiente'}</p>
              </div>
              <button onClick={() => logout()} aria-label="Cerrar sesión" className="text-gray-400 hover:text-danger transition-colors">
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