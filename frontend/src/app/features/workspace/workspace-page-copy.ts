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
      'Your own allowances, eligibility and rules. Each leave type keeps its own unit and period.',
    settings:
      user.capability === 'admin'
        ? 'Organization, department, team, profile and system settings in one place.'
        : 'Your profile and system display preferences.',
    organization: 'Organization settings.',
    leave: 'Your requests and personal leave balances.',
    people: 'Colleagues and employee management.',
    approvals: 'Leave requests awaiting your approval.',
    'admin-balances': 'Review employee annual leave balances across your organization.',
  })[page];
