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
import { MemberRecord } from '../../core/http/contracts';
import { OrganizationRecord } from '../../core/models/workspace.models';

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
  get members() {
    return this.data.api.members;
  }
  get roles() {
    return this.data.api.roles;
  }

  editMember(member: MemberRecord) {
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

  async saveMember() {
    if (!this.selectedMember || this.busy) return;
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
    if (result.ok) this.selectedMember = null;
    this.finish(result);
  }

  @Input() companyId = '';
  readonly changed = output<void>();
  readonly staleSession = output<void>();
  readonly actorId = this.data.currentUser()?.id || '';
  @ViewChild('viewHeading') viewHeading?: ElementRef<HTMLElement>;
  record: OrganizationRecord | null = null;
  draft = { name: '', workWeekDays: 5 };
  departmentId: string | null = null;
  teamId: string | null = null;
  nodeName = '';
  error = '';
  message = '';
  busy = false;
  get department() {
    return this.record?.departments.find((item) => item.id === this.departmentId);
  }
  get team() {
    return this.record?.teams.find((item) => item.id === this.teamId);
  }
  get memberCount() {
    return this.record?.members.length || 0;
  }
  get teamCount() {
    return this.record?.teams.length || 0;
  }
  get directTeams() {
    return this.record?.teams.filter((item) => !item.departmentId) || [];
  }
  get directMembers() {
    return (
      this.record?.members.filter(
        (member) =>
          !this.record?.teams.some((team) => team.members.some((item) => item.id === member.id)),
      ) || []
    );
  }

  teamsFor(departmentId: string) {
    return this.record?.teams.filter((item) => item.departmentId === departmentId) || [];
  }

  ngOnChanges() {
    this.reset();
  }

  reset() {
    if (this.data.currentUser()?.id !== this.actorId) {
      this.record = null;
      this.staleSession.emit();
      return;
    }
    this.record = this.data.organization.read(this.companyId);
    if (this.record)
      this.draft = { name: this.record.name, workWeekDays: this.record.workWeekDays };
    this.nodeName = this.team?.name || this.department?.name || '';
    this.message = '';
    this.error = '';
  }

  home() {
    this.departmentId = null;
    this.teamId = null;
    this.reset();
    this.focusHeading();
  }

  openDepartment(id: string) {
    if (!this.record?.departments.some((item) => item.id === id)) return;
    this.departmentId = id;
    this.teamId = null;
    this.reset();
    this.focusHeading();
  }

  openTeam(departmentId: string | null, teamId: string) {
    if (
      !this.record?.teams.some((item) => item.id === teamId && item.departmentId === departmentId)
    )
      return;
    this.departmentId = departmentId;
    this.teamId = teamId;
    this.reset();
    this.focusHeading();
  }

  private focusHeading() {
    setTimeout(() => this.viewHeading?.nativeElement.focus());
  }

  async save() {
    if (this.busy) return;
    this.busy = true;
    const result = await this.data.organization.update(this.companyId, this.actorId, this.draft);
    this.finish(result);
  }

  async rename() {
    if (this.busy) return;
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

  private finish(result: { ok: boolean; error?: string }) {
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
