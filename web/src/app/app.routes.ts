import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'leave' },
  { path: 'people', loadChildren: () => import('./people/people.routes').then((m) => m.peopleRoutes) },
  { path: 'leave', loadChildren: () => import('./leave/leave.routes').then((m) => m.leaveRoutes) },
  {
    path: 'approvals',
    loadChildren: () => import('./approvals/approvals.routes').then((m) => m.approvalsRoutes),
  },
  {
    path: 'availability',
    loadChildren: () =>
      import('./availability/availability.routes').then((m) => m.availabilityRoutes),
  },
];
