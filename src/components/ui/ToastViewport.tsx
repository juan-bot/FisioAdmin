import { useEffect, useState } from 'react';
import type { NoticeType } from '../../utils/notify';

interface Notice {
  id: number;
  message: string;
  type: NoticeType;
}

export function ToastViewport() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const handleNotice = (event: Event) => {
      const detail = (event as CustomEvent<Omit<Notice, 'id'>>).detail;
      const notice = { ...detail, id: Date.now() + Math.random() };
      setNotices(current => [...current.slice(-2), notice]);
      window.setTimeout(() => setNotices(current => current.filter(item => item.id !== notice.id)), 4200);
    };
    window.addEventListener('fisioadmin:notice', handleNotice);
    return () => window.removeEventListener('fisioadmin:notice', handleNotice);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-96" aria-live="polite">
      {notices.map(notice => (
        <div key={notice.id} role="status" className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/95 dark:text-emerald-100' : 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-900 dark:bg-red-950/95 dark:text-red-100'}`}>
          <span aria-hidden="true" className="mt-0.5">{notice.type === 'success' ? '✓' : '!'}</span>
          <span className="flex-1">{notice.message}</span>
          <button onClick={() => setNotices(current => current.filter(item => item.id !== notice.id))} className="pointer-events-auto -m-1 rounded-lg p-1 opacity-60 hover:opacity-100" aria-label="Cerrar aviso">×</button>
        </div>
      ))}
    </div>
  );
}
