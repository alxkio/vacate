import { CalendarState, Person } from '../../core/models/workspace.models';

export const workspacePageTitle = (page: CalendarState['page']): string =>
  ({
    calendar: 'Your time, in view',
    balances: 'Your leave, in balance',
    settings: 'Settings',
    organization: 'Settings',
    leave: 'My Leave',
    people: 'People',
    approvals: 'Approval Requests',
    'admin-balances': 'Leave balances overview',
  })[page];

export const workspaceSubtitle = (
  page: CalendarState['page'],
  layout: CalendarState['layout'],
  user: Person,
): string =>
  ({
    calendar:
      layout === 'planner'
        ? 'A shared view of time away. A little easier to plan together.'
        : 'Plan your next break. Keep your team in the picture.',
    balances:
      'Fictional reference allowances, eligibility and rules, separate from saved request balances.',
    settings:
      user.capability === 'admin'
        ? 'Organization, department, team, profile and system settings in one place.'
        : 'Your profile, display preferences and any delegated settings.',
    organization: 'Organization settings.',
    leave: 'Your requests and personal leave balances.',
    people:
      user.capability === 'admin'
        ? 'Colleagues and membership management.'
        : 'Your organization’s directory.',
    approvals: 'Approval inbox and assignments are not available yet.',
    'admin-balances': 'Review employee annual leave balances across your organization.',
  })[page];
