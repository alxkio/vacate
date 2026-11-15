import { loginUrl, safeReturnUrl } from './core/http/session-navigation';
import { workspacePath } from './core/navigation/app-paths';
import { inject } from '@angular/core';
import { CanActivateFn, Route, Router, Routes, UrlTree } from '@angular/router';
import { WorkspaceDataService } from './core/state/workspace-data.service';
import { resolveSettingsSection } from './features/settings/settings-navigation';

const signedIn: CanActivateFn = async (route, state) => {
  const data = inject(WorkspaceDataService);
  const router = inject(Router);
  await data.initialize();
  if (!data.currentUser()) return router.parseUrl(loginUrl(state.url));
  if (route.data['page'] === 'settings') {
    if (!(await data.api.restoreSession())) return router.parseUrl(loginUrl(state.url));
    const section = route.data['section'] || 'profile';
    const permitted = resolveSettingsSection(section, data.currentUser(), data.api.settingsAccess);
    if (section !== permitted) return router.createUrlTree([workspacePath('settings', permitted)]);
  }
  return true;
};

const signedOut: CanActivateFn = async (route): Promise<boolean | UrlTree> => {
  const data = inject(WorkspaceDataService);
  const router = inject(Router);
  await data.initialize();
  return data.currentUser()
    ? router.parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')))
    : true;
};

const legacyTarget: CanActivateFn = (route) => {
  const router = inject(Router);
  const params = { ...route.queryParams };
  const requested = params['page'] || route.routeConfig?.path || 'calendar';
  const organization = ['organization', 'organization-settings'].includes(requested);
  const page = organization ? 'settings' : requested;
  const section = organization ? 'organization' : params['section'] || 'profile';
  delete params['page'];
  delete params['section'];
  if (!['calendar', 'availability', 'index.html', 'app.html'].includes(page)) {
    for (const key of ['view', 'date', 'group', 'team', 'department']) delete params[key];
  }
  return router.createUrlTree([workspacePath(page, section)], {
    queryParams: params,
    fragment: route.fragment || undefined,
  });
};

const workspace: NonNullable<Route['loadComponent']> = () =>
  import('./features/workspace/workspace').then((module) => module.Workspace);

function screen(path: string, page: string, extra: Record<string, string> = {}): Route {
  return {
    path,
    data: { page, ...extra },
    canActivate: [signedIn],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: workspace,
  };
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [legacyTarget], loadComponent: workspace },
  {
    path: 'login',
    canActivate: [signedOut],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'login.html',
    canActivate: [
      (route) => inject(Router).createUrlTree(['/login'], { queryParams: route.queryParams }),
    ],
    loadComponent: workspace,
  },
  ...['index.html', 'app.html', 'availability', 'balances', 'admin-balances', 'settings'].map(
    (path) => ({
      path,
      pathMatch: 'full' as const,
      canActivate: [legacyTarget],
      loadComponent: workspace,
    }),
  ),
  screen('calendar', 'calendar'),
  screen('leave/requests/:requestGuid', 'leave', { detail: 'request' }),
  screen('leave/balances', 'balances'),
  screen('leave', 'leave'),
  screen('people/:personGuid/memberships/:membershipGuid', 'people', { detail: 'membership' }),
  screen('people/:personGuid/leave', 'people', { detail: 'person-leave' }),
  screen('people/:personGuid', 'people', { detail: 'person' }),
  screen('people', 'people'),
  screen('approvals/:requestGuid', 'approvals'),
  screen('approvals', 'approvals'),
  screen('settings/organization', 'settings', { section: 'organization' }),
  screen('settings/departments/:nodeGuid', 'settings', { section: 'department' }),
  screen('settings/departments', 'settings', { section: 'department' }),
  screen('settings/teams/:nodeGuid', 'settings', { section: 'team' }),
  screen('settings/teams', 'settings', { section: 'team' }),
  screen('settings/system', 'settings', { section: 'system' }),
  screen('settings/profile', 'settings', { section: 'profile' }),
  screen('help', 'help'),
  { path: '**', redirectTo: 'calendar' },
];
