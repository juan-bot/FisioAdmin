export type NoticeType = 'success' | 'error';

export function notify(message: string, type: NoticeType = 'success') {
  window.dispatchEvent(new CustomEvent('fisioadmin:notice', { detail: { message, type } }));
}
