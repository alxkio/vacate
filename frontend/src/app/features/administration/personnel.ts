import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi, adminError, Personnel } from './admin-api';

@Component({
  selector: 'vacate-personnel',
  imports: [FormsModule],
  templateUrl: './personnel.html',
  styleUrl: './admin.scss',
})
export class PersonnelOverview implements OnInit {
  readonly api = inject(AdminApi);
  readonly detector = inject(ChangeDetectorRef);
  @ViewChild('detailHeading') detailHeading?: ElementRef<HTMLElement>;
  private trigger: HTMLElement | null = null;
  year = new Date().getFullYear();
  loadedYear = this.year;
  search = '';
  records: Personnel[] = [];
  selected: Personnel | null = null;
  loading = false;
  error = '';
  private sequence = 0;
  get filtered(): Personnel[] {
    const query = this.search.trim().toLocaleLowerCase();
    return this.records.filter((person) =>
      `${person.displayName} ${person.departmentName || ''} ${person.teamName || ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }

  review(person: Personnel, target: EventTarget | null): void {
    this.selected = person;
    this.trigger = target instanceof HTMLElement ? target : null;
    this.detector.detectChanges();
    this.detailHeading?.nativeElement.focus();
  }

  close(): void {
    this.selected = null;
    this.trigger?.focus();
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    if (!Number.isInteger(this.year) || this.year < 1 || this.year > 9999) {
      this.error = 'Enter a valid year from 1 to 9999.';
      return;
    }
    const year = this.year;
    const owner = this.api.owner;
    const sequence = ++this.sequence;
    this.records = [];
    this.selected = null;
    this.loading = true;
    this.error = '';
    try {
      const records = await this.api.personnel(year);
      if (owner === this.api.owner && sequence === this.sequence) {
        this.records = records;
        this.loadedYear = year;
      }
    } catch (error) {
      if (owner === this.api.owner && sequence === this.sequence)
        this.error = adminError(error, 'Personnel leave could not be loaded. Try again.');
    } finally {
      if (sequence === this.sequence) this.loading = false;
      this.detector.markForCheck();
    }
  }
}
