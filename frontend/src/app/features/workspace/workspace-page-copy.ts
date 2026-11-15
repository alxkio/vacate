import { CalendarState, Person } from '../../core/models/workspace.models';

export const workspacePageTitle = (page: CalendarState['page']): string =>
  ({
    calendar: 'Your time, in view',
    help: 'Help & feedback',
    balances: 'Your leave, in balance',
    settings: 'Settings',
    organization: 'Settings',
    leave: 'My Leave',
    people: 'People',
    approvals: 'Approval Requests',
    'admin-balances': 'People',
  })[page];

export const workspaceSubtitle = (
  page: CalendarState['page'],
  layout: CalendarState['layout'],
  user: Person,
): string =>
  ({
    help: 'Guidance for planning leave and using your workspace.',
    calendar:
      layout === 'planner'
        ? 'A shared view of time away. A little easier to plan together.'
        : 'Plan your next break. Keep your team in the picture.',
    balances:
      'Saved annual balance, with reference allowances and eligibility guidance for other types.',
    settings:
      user.capability === 'admin'
        ? 'Organization, department, team, profile and system settings in one place.'
        : 'Your profile, display preferences and any delegated settings.',
    organization: 'Organization settings.',
    leave: 'Your requests and personal leave balances.',
    people:
      user.capability === 'admin'
        ? 'Colleagues, annual balances, recorded leave and membership management.'
        : 'Your organization’s directory.',
    approvals: 'Review and decide saved requests assigned to you.',
    'admin-balances': 'Colleagues, annual balances, recorded leave and membership management.',
  })[page];
