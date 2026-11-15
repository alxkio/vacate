import { ParamMap } from '@angular/router';
import { CalendarState } from '../../core/models/workspace.models';
import {
  addDays,
  dateFromKey,
  dateKey,
  currentDate,
} from '../../core/state/workspace-data.service';

const routePages: CalendarState['page'][] = [
  'calendar',
  'balances',
  'settings',
  'leave',
  'people',
  'approvals',
  'admin-balances',
  'help',
];

export const workspacePageFromRoute = (requested: string): CalendarState['page'] => {
  if (requested === 'organization' || requested === 'organization-settings') {
    return 'settings';
  }
  return routePages.includes(requested as CalendarState['page'])
    ? (requested as CalendarState['page'])
    : 'calendar';
};

export const workspaceGroupFromRoute = (params: ParamMap, scope: string): string | null =>
  params.get('group') ||
  params.get(scope === 'team' ? 'team' : scope === 'department' ? 'department' : 'company');

export const workspaceViewFromRoute = (
  requested: string | null,
  layout: CalendarState['layout'],
): CalendarState['view'] => {
  if (
    requested === 'year' ||
    requested === 'month' ||
    requested === 'week' ||
    requested === 'day'
  ) {
    return requested;
  }
  return layout === 'planner' ? 'week' : 'month';
};

export const workspaceDateFromRoute = (value: string | null): Date => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return currentDate();
  }
  const date = dateFromKey(value);
  return dateKey(date) === value ? date : currentDate();
};

export const shiftWorkspaceDate = (
  date: Date,
  view: CalendarState['view'],
  direction: -1 | 1,
): Date => {
  if (view === 'year') {
    return new Date(date.getFullYear() + direction, date.getMonth(), 1);
  }
  if (view === 'month') {
    return new Date(date.getFullYear(), date.getMonth() + direction, 1);
  }
  return addDays(date, direction * (view === 'week' ? 7 : 1));
};
