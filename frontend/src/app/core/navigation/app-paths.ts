export const publicGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function workspaceQuery(
  page: string,
  params: Record<string, string | string[]>,
  companyId: string,
  isAdmin: boolean,
): Record<string, string> {
  const allowed =
    page === 'calendar'
      ? ['scope', 'group', 'view', 'team', 'department']
      : page === 'people'
        ? ['scope', 'group', 'year']
        : [];
  const result: Record<string, string> = {};
  for (const key of [...allowed, 'company']) {
    const value = Array.isArray(params[key]) ? params[key][0] : params[key];
    if (value) result[key] = value;
  }
  // A foreign-company probe remains explicit so the view denies it rather than widening scope.
  if (result['company'] === companyId) delete result['company'];
  if (page === 'people') {
    if (!['team', 'department'].includes(result['scope'])) {
      delete result['scope'];
      delete result['group'];
    }
    if (!isAdmin || result['year'] === String(new Date().getFullYear())) delete result['year'];
  }
  return result;
}

export function workspacePath(page: string, section = 'profile', nodeGuid = ''): string {
  if (page === 'settings') {
    if (section === 'team' || section === 'department') {
      const base = `/settings/${section === 'team' ? 'teams' : 'departments'}`;
      return publicGuid.test(nodeGuid) ? `${base}/${nodeGuid}` : base;
    }
    return `/settings/${['organization', 'system'].includes(section) ? section : 'profile'}`;
  }
  return (
    (
      {
        calendar: '/calendar',
        availability: '/calendar',
        leave: '/leave',
        balances: '/leave/balances',
        people: '/people',
        'admin-balances': '/people',
        approvals: '/approvals',
        help: '/help',
      } as Record<string, string>
    )[page] || '/calendar'
  );
}

export function resumablePath(path: string): boolean {
  const plain = path.replace(/\/$/, '');
  if (
    [
      '/index.html',
      '/app.html',
      '/calendar',
      '/leave',
      '/leave/balances',
      '/approvals',
      '/availability',
      '/people',
      '/settings',
      '/balances',
      '/admin-balances',
      '/help',
      '/settings/profile',
      '/settings/system',
      '/settings/organization',
      '/settings/departments',
      '/settings/teams',
    ].includes(plain)
  )
    return true;
  const parts = plain.split('/').slice(1);
  if (parts[0] === 'people' && publicGuid.test(parts[1] || '')) {
    return (
      parts.length === 2 ||
      (parts.length === 3 && parts[2] === 'leave') ||
      (parts.length === 4 && parts[2] === 'memberships' && publicGuid.test(parts[3]))
    );
  }
  return (
    (parts.length === 3 &&
      parts[0] === 'leave' &&
      parts[1] === 'requests' &&
      publicGuid.test(parts[2])) ||
    (parts.length === 2 && parts[0] === 'approvals' && publicGuid.test(parts[1])) ||
    (parts.length === 3 &&
      parts[0] === 'settings' &&
      ['teams', 'departments'].includes(parts[1]) &&
      publicGuid.test(parts[2]))
  );
}
