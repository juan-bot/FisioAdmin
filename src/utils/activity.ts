import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../firebase/db';

let globalSessionId = '';

function getSessionId(): string {
  if (!globalSessionId) {
    globalSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return globalSessionId;
}

export function useActivityTracking() {
  const { profile } = useAuth();
  const pageHistory = useRef<string[]>([]);

  useEffect(() => {
    if (!profile || profile.role !== 'therapist') return;
    const sessionId = getSessionId();

    const log = async (action: string, details: string, page: string) => {
      try {
        await logUserActivity({
          userId: profile.uid,
          userName: profile.displayName || profile.email || 'Desconocido',
          action,
          details,
          page,
          sessionId,
        });
      } catch {
        console.warn('No se pudo registrar la actividad:', action);
      }
    };

    const handlePageChange = () => {
      const currentPage = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
      const prevPage = pageHistory.current.length > 0 ? pageHistory.current[pageHistory.current.length - 1] : null;
      if (prevPage && prevPage !== currentPage) {
        log('page_view', `Navegó de ${prevPage} a ${currentPage}`, currentPage);
      }
      pageHistory.current.push(currentPage);
      if (pageHistory.current.length > 50) pageHistory.current.shift();
    };

    log('login', 'Sesión iniciada', 'login');
    handlePageChange();

    window.addEventListener('hashchange', handlePageChange);
    window.addEventListener('load', handlePageChange);

    return () => {
      window.removeEventListener('hashchange', handlePageChange);
      window.removeEventListener('load', handlePageChange);
      log('logout', 'Sesión cerrada', '');
    };
  }, [profile]);

  const trackClick = useCallback((elementName: string, page: string, extra?: string) => {
    if (!profile || profile.role !== 'therapist') return;
    logUserActivity({
      userId: profile.uid,
      userName: profile.displayName || profile.email || 'Desconocido',
      action: 'click',
      details: extra ? `${elementName}: ${extra}` : elementName,
      page,
      sessionId: getSessionId(),
    }).catch(() => console.warn('No se pudo registrar el click:', elementName));
  }, [profile]);

  return { trackClick };
}

export function generateSessionId(): string {
  return getSessionId();
}

export function formatLastActivity(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHour < 24) return `Hace ${diffHour}h`;
  if (diffDay < 7) return `Hace ${diffDay}d`;
  return date.toLocaleDateString('es-MX');
}
