import { Injectable } from '@angular/core';

// Only known application destinations may be resumed after authentication.
export function safeReturnUrl(value: string | null): string {
  if (!value || /[\\\x00-\x20]/.test(value)) return '/index.html';
  try {
    const url = new URL(value, 'https://vacate.invalid');
    const paths = [
      '/index.html',
      '/leave',
      '/approvals',
      '/availability',
      '/people',
      '/settings',
      '/balances',
      '/admin-balances',
    ];
    return value.startsWith('/') &&
      url.origin === 'https://vacate.invalid' &&
      paths.includes(url.pathname)
      ? url.pathname + url.search + url.hash
      : '/index.html';
  } catch {
    return '/index.html';
  }
}

export function loginUrl(destination: string): string {
  return '/login.html?returnUrl=' + encodeURIComponent(safeReturnUrl(destination));
}

@Injectable({ providedIn: 'root' })
export class SessionNavigation {
  expired(token: string): void {
    // A late failure from a signed-out or replaced account must not clear the new session.
    if (!token || sessionStorage.getItem('vacate.session.token') !== token) return;
    sessionStorage.removeItem('vacate.session.token');
    location.replace(
      loginUrl(location.pathname + location.search + location.hash) + '&reason=expired',
    );
  }
}
