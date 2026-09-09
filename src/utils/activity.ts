import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../firebase/db';

let currentSession: { userId: string; id: string } | null = null;

function getSessionId(userId: string): string {
  if (!currentSession || currentSession.userId !== userId) {
    currentSession = {
      userId,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    };
  }
  return currentSession.id;
}

export function useActivityTracking({ trackLifecycle = true }: { trackLifecycle?: boolean } = {}) {
  const { profile } = useAuth();
  const pageHistory = useRef<string[]>([]);
  const initialized = useRef(false);
  const userId = profile?.uid;
  const userName = profile?.displayName || profile?.email || 'Desconocido';
  const sessionId = useMemo(() => userId ? getSessionId(userId) : '', [userId]);

  useEffect(() => {
    if (!trackLifecycle || !userId || !sessionId) return;
    if (initialized.current) return;
    initialized.current = true;

    const log = async (action: string, details: string, page: string) => {
      try {
        await logUserActivity({
          userId,
          userName,
          action,
          details,
          page,
          sessionId,
        });
      } catch (e) {
        console.warn('No se pudo registrar la actividad:', action, e);
      }
    };

    const handlePageChange = () => {
      const currentPage = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
      const prevPage = pageHistory.current.length > 0 ? pageHistory.current[pageHistory.current.length - 1] : null;
      log('page_view', prevPage && prevPage !== currentPage ? `Navegó de ${prevPage} a ${currentPage}` : `Abrió ${currentPage}`, currentPage);
      pageHistory.current.push(currentPage);
      if (pageHistory.current.length > 50) pageHistory.current.shift();
    };

    const handleVisibilityChange = () => {
      log(document.visibilityState === 'visible' ? 'app_active' : 'app_background', document.visibilityState === 'visible' ? 'Volvió a la aplicación' : 'Dejó la aplicación en segundo plano', '');
    };

    log('login', 'Sesión iniciada', 'login');
    handlePageChange();

    window.addEventListener('hashchange', handlePageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('hashchange', handlePageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackLifecycle, userId, userName, sessionId]);

  const trackClick = useCallback((elementName: string, page: string, extra?: string) => {
    if (!userId || !sessionId) return;
    logUserActivity({
      userId,
      userName,
      action: 'click',
      details: extra ? `${elementName}: ${extra}` : elementName,
      page,
      sessionId,
    }).catch(() => console.warn('No se pudo registrar el click:', elementName));
  }, [userId, userName, sessionId]);

  return { trackClick };
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

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
