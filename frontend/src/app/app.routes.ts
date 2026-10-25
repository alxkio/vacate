import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { DemoData } from './demo/demo-data';

const signedIn: CanActivateFn = () =>
  inject(DemoData).currentUser() ? true : inject(Router).parseUrl('/login.html');
const signedOut: CanActivateFn = () =>
  inject(DemoData).currentUser() ? inject(Router).parseUrl('/index.html') : true;
const workspace = () => import('./demo/workspace').then((module) => module.Workspace);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'index.html' },
  {
    path: 'login.html',
    canActivate: [signedOut],
    loadComponent: () => import('./demo/login').then((module) => module.Login),
  },
  { path: 'index.html', canActivate: [signedIn], loadComponent: workspace },
  ...['leave', 'approvals', 'availability', 'people'].map((path) => ({
    path,
    canActivate: [signedIn],
    loadComponent: workspace,
  })),
  { path: '**', redirectTo: 'index.html' },
];
