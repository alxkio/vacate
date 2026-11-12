import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceDataService } from '../../core/state/workspace-data.service';
import { apiId } from '../../core/state/workspace-api.service';
import { MemberRecord, Roles } from '../../core/http/contracts';
import {
  OrganizationNode,
  OrganizationRecord,
  OrganizationTeam,
} from '../../core/models/workspace.models';

@Component({
  selector: 'vacate-organization',
  imports: [FormsModule],
  templateUrl: './organization-settings.html',
  styleUrl: './organization-settings.scss',
})
export class OrganizationSettings implements OnChanges {
  readonly data = inject(WorkspaceDataService);
  readonly detector = inject(ChangeDetectorRef);
  readonly apiId = apiId;
  selectedMember: MemberRecord | null = null;
  memberDraft = {
    systemRoleId: '',
    jobRoleId: '',
    managerUserId: null as string | null,
    workScheduleId: null as string | null,
    holidayCalendarId: null as string | null,
    leavePolicyId: null as string | null,
    departmentId: null as string | null,
    teamId: null as string | null,
    hireDate: null as string | null,
    employmentEndDate: null as string | null,
    priorService: null as number | null,
    customAllocation: null as number | null,
  };
  get members(): MemberRecord[] {
    return this.data.api.members;
  }
  get roles(): Roles {
    return this.data.api.roles;
  }

  editMember(member: MemberRecord): void {
    this.memberTrigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.selectedMember = member;
    const m = member.membership;
    this.memberDraft = {
      systemRoleId: m.systemRoleId,
      jobRoleId: m.jobRoleId,
      managerUserId: m.managerUserId,
      workScheduleId: m.workScheduleId,
      holidayCalendarId: m.holidayCalendarId,
      leavePolicyId: m.leavePolicyId,
      departmentId: m.departmentId,
      teamId: m.teamId,
      hireDate: m.hireDate,
      employmentEndDate: m.employmentEndDate,
      priorService: m.priorService,
      customAllocation: m.balance.customAllocation,
    };
    setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('#membership-editor-heading');
      heading?.focus();
      heading?.scrollIntoView({ block: 'start' });
    });
  }

  private memberTrigger: HTMLElement | null = null;

  closeMember(): void {
    this.selectedMember = null;
    this.detector.detectChanges();
    this.memberTrigger?.focus();
  }

  async saveMember(): Promise<void> {
    if (!this.selectedMember || this.busy) {
      return;
    }
    this.busy = true;
    const patch = {
      ...this.memberDraft,
      hireDate: this.memberDraft.hireDate || null,
      employmentEndDate: this.memberDraft.employmentEndDate || null,
    };
    const result = await this.data.api.updateMembership(
      this.actorId,
      this.selectedMember.userGuid,
      patch,
    );
    this.finish(result);
    if (result.ok) {
      this.closeMember();
    }
  }

  @Input() companyId = '';
  @Input() membersOnly = false;
  readonly changed = output<void>();
  readonly staleSession = output<void>();
  readonly actorId = this.data.currentUser()?.id || '';
  @ViewChild('viewHeading') viewHeading?: ElementRef<HTMLElement>;
  record: OrganizationRecord | null = null;
  draft: { name: string; workWeekDays: number; timeZone?: string; countryCode?: string } = {
    name: '',
    workWeekDays: 5,
    timeZone: 'UTC',
    countryCode: '',
  };
  departmentId: string | null = null;
  teamId: string | null = null;
  nodeName = '';
  error = '';
  message = '';
  busy = false;
  settingsDraft = {
    requireVacationApproval: true,
    departmentLeadSettingsEnabled: false,
    teamLeadSettingsEnabled: false,
    carryoverEnabled: false,
    carryoverYears: 0,
  };

  async savePolicies(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const result = await this.data.api.updateOrganizationSettings(this.actorId, this.settingsDraft);
    this.busy = false;
    this.finish(result);
  }
  get department(): OrganizationNode | undefined {
    return this.record?.departments.find((item) => item.id === this.departmentId);
  }
  get team(): OrganizationTeam | undefined {
    return this.record?.teams.find((item) => item.id === this.teamId);
  }
  get memberCount(): number {
    return this.record?.members.length || 0;
  }
  get teamCount(): number {
    return this.record?.teams.length || 0;
  }
  get directTeams(): OrganizationTeam[] {
    return this.record?.teams.filter((item) => !item.departmentId) || [];
  }
  get directMembers(): { id: string; name: string; jobTitle: string; systemRole: string }[] {
    return (
      this.record?.members.filter(
        (member) =>
          !this.record?.teams.some((team) => team.members.some((item) => item.id === member.id)),
      ) || []
    );
  }

  teamsFor(departmentId: string): OrganizationTeam[] {
    return this.record?.teams.filter((item) => item.departmentId === departmentId) || [];
  }

  ngOnChanges(): void {
    this.reset();
  }

  reset(): void {
    if (this.data.currentUser()?.id !== this.actorId) {
      this.record = null;
      this.staleSession.emit();
      return;
    }
    this.record = this.data.organization.read(this.companyId);
    this.settingsDraft = { ...this.settingsDraft, ...this.data.api.organizationSettings };
    if (this.record) {
      this.draft = {
        name: this.record.name,
        workWeekDays: this.record.workWeekDays,
        timeZone: this.record.settings?.timeZone || 'UTC',
        countryCode: this.record.settings?.countryCode || '',
      };
    }
    this.nodeName = this.team?.name || this.department?.name || '';
    this.message = '';
    this.error = '';
  }

  home(): void {
    this.departmentId = null;
    this.teamId = null;
    this.reset();
    this.focusHeading();
  }

  openDepartment(id: string): void {
    if (!this.record?.departments.some((item) => item.id === id)) {
      return;
    }
    this.departmentId = id;
    this.teamId = null;
    this.reset();
    this.focusHeading();
  }

  openTeam(departmentId: string | null, teamId: string): void {
    if (
      !this.record?.teams.some((item) => item.id === teamId && item.departmentId === departmentId)
    ) {
      return;
    }
    this.departmentId = departmentId;
    this.teamId = teamId;
    this.reset();
    this.focusHeading();
  }

  private focusHeading(): void {
    setTimeout(() => this.viewHeading?.nativeElement.focus());
  }

  async save(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const result = await this.data.organization.update(this.companyId, this.actorId, {
      ...this.draft,
      countryCode: this.draft.countryCode?.trim().toUpperCase() || null,
    });
    this.finish(result);
  }

  async rename(): Promise<void> {
    if (this.busy) {
      return;
    }
    this.busy = true;
    const result = await this.data.organization.rename(
      this.companyId,
      this.actorId,
      this.teamId ? 'team' : 'department',
      this.teamId || this.departmentId || '',
      this.nodeName,
    );
    this.finish(result);
  }

  private finish(result: { ok: boolean; error?: string }): void {
    this.busy = false;
    this.error = result.error || '';
    this.detector.markForCheck();
    this.message = '';
    if (!result.ok) {
      if (
        this.data.currentUser()?.id !== this.actorId ||
        !this.data.organization.read(this.companyId)
      ) {
        this.record = null;
        this.staleSession.emit();
      }
      return;
    }
    this.reset();
    this.message = 'Updated by the demo API.';
    this.changed.emit();
  }
}
