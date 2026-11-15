import { Injectable } from '@angular/core';
import { resumablePath } from '../navigation/app-paths';

// Only known application destinations may be resumed after authentication.
export function safeReturnUrl(value: string | null): string {
  if (!value || /[\\\x00-\x20]/.test(value)) return '/calendar';
  try {
    const url = new URL(value, 'https://vacate.invalid');
    return value.startsWith('/') &&
      url.origin === 'https://vacate.invalid' &&
      resumablePath(url.pathname)
      ? url.pathname + url.search + url.hash
      : '/calendar';
  } catch {
    return '/calendar';
  }
}

export function loginUrl(destination: string): string {
  return '/login?returnUrl=' + encodeURIComponent(safeReturnUrl(destination));
}

export function expiredSessionUrl(currentUrl: string): string {
  const current = new URL(currentUrl, 'https://vacate.invalid');
  const destination = ['/login', '/login.html'].includes(current.pathname)
    ? safeReturnUrl(current.searchParams.get('returnUrl'))
    : current.pathname + current.search + current.hash;
  return loginUrl(destination) + '&reason=expired';
}

@Injectable({ providedIn: 'root' })
export class SessionNavigation {
  expired(token: string): void {
    // A late failure from a signed-out or replaced account must not clear the new session.
    if (!token || sessionStorage.getItem('vacate.session.token') !== token) return;
    sessionStorage.removeItem('vacate.session.token');
    location.replace(expiredSessionUrl(location.pathname + location.search + location.hash));
  }
}
