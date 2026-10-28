import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { WorkspaceDataService } from './core/state/workspace-data.service';

const signedIn: CanActivateFn = async () => {
  const data = inject(WorkspaceDataService),
    router = inject(Router);
  await data.initialize();
  return data.currentUser() ? true : router.parseUrl('/login.html');
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
  { path: 'index.html', canActivate: [signedIn], loadComponent: workspace },
  ...['leave', 'approvals', 'availability', 'people'].map((path) => ({
    path,
    canActivate: [signedIn],
    loadComponent: workspace,
  })),
  { path: '**', redirectTo: 'index.html' },
];
