import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { WorkspaceDataService } from './core/state/workspace-data.service';
import { resolveSettingsSection } from './features/settings/settings-navigation';

const signedIn: CanActivateFn = async (route) => {
  const data = inject(WorkspaceDataService),
    router = inject(Router);
  await data.initialize();
  const page = route.queryParamMap.get('page') || route.routeConfig?.path;
  if (
    data.currentUser() &&
    ['settings', 'organization', 'organization-settings'].includes(page || '')
  ) {
    try {
      await data.api.refresh();
    } catch {
      data.environment.VacateSession.logout();
      return router.parseUrl('/login.html');
    }
  }
  const person = data.currentUser();
  if (!person) return router.parseUrl('/login.html');
  const legacyOrganization = page === 'organization' || page === 'organization-settings';
  if (page === 'settings' || legacyOrganization) {
    const section = legacyOrganization
      ? 'organization'
      : route.queryParamMap.get('section') || 'profile';
    const permitted = resolveSettingsSection(section, person, data.api.settingsAccess);
    if (section !== permitted) {
      return router.createUrlTree(['/index.html'], {
        queryParams: { ...route.queryParams, page: 'settings', section: permitted },
      });
    }
  }
  return true;
};
const signedOut: CanActivateFn = async () => {
  const data = inject(WorkspaceDataService),
    router = inject(Router);
  await data.initialize();
  return data.currentUser() ? router.parseUrl('/index.html') : true;
};
const workspace = () => import('./features/workspace/workspace').then((module) => module.Workspace);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'index.html' },
  {
    path: 'login.html',
    canActivate: [signedOut],
    loadComponent: () => import('./features/auth/login').then((module) => module.Login),
  },
  {
    path: 'index.html',
    canActivate: [signedIn],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: workspace,
  },
  ...['leave', 'approvals', 'availability', 'people', 'settings', 'balances', 'admin-balances'].map(
    (path) => ({
      path,
      canActivate: [signedIn],
      runGuardsAndResolvers: 'paramsOrQueryParamsChange' as const,
      loadComponent: workspace,
    }),
  ),
  { path: '**', redirectTo: 'index.html' },
];
