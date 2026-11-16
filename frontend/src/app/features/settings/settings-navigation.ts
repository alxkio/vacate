import type { Person } from '../../core/models/workspace.models';
import type { SettingsAccess } from '../../core/http/contracts';

const sections = [
  { id: 'profile', name: 'Profile', admin: false },
  { id: 'organization', name: 'Organization', admin: true },
  { id: 'department', name: 'Departments', admin: true },
  { id: 'team', name: 'Teams', admin: true },
  { id: 'system', name: 'System', admin: false },
] as const;

export type SettingsSection = (typeof sections)[number]['id'];

export function settingsSections(
  person: Pick<Person, 'capability'> | null,
  access?: SettingsAccess,
): (typeof sections)[number][] {
  return sections.filter(
    (section) =>
      !section.admin ||
      (section.id === 'organization'
        ? (access?.organization ?? person?.capability === 'admin')
        : section.id === 'department'
          ? access
            ? access.departments.length > 0
            : person?.capability === 'admin'
          : access
            ? access.teams.length > 0
            : person?.capability === 'admin'),
  );
}

export function resolveSettingsSection(
  section: string | null,
  person: Pick<Person, 'capability'> | null,
  access?: SettingsAccess,
): SettingsSection {
  return settingsSections(person, access).find((item) => item.id === section)?.id || 'profile';
}
