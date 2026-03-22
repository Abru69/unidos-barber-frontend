import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppointmentsService } from '../../core/services/appointments.service';
import { environment } from '../../../environments/environment';

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

@Component({
  selector: 'app-manage-hours',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './manage-hours.html',
  styleUrl: './manage-hours.scss',
})
export class ManageHours implements OnInit {
  days = DAYS; form!: FormGroup; saving = false; saved = false; loading = true; error = '';
  intervals = [15, 20, 30, 45, 60];

  constructor(private fb: FormBuilder, private apptSvc: AppointmentsService, private http: HttpClient) {}

  ngOnInit() {
    this.apptSvc.getBusinessHours().subscribe((res: any) => {
      const hours = res.data ?? res;
      this.form = this.fb.group({
        dias: this.fb.array(DAYS.map((_, i) => {
          const h = hours.find((d: any) => d.diaSemana === i);
          return this.fb.group({
            diaSemana:    [i],
            activo:       [h?.activo       ?? false],
            startTime:    [h?.startTime    ?? '09:00', Validators.required],
            endTime:      [h?.endTime      ?? '18:00', Validators.required],
            intervaloMin: [h?.intervaloMin ?? 30,      Validators.required],
          });
        }))
      });
      this.loading = false;
    });
  }

  get diasArray(): FormArray { return this.form.get('dias') as FormArray; }
  dayGroup(i: number): FormGroup { return this.diasArray.at(i) as FormGroup; }

  submit() {
    if (this.form.invalid) return;
    this.saving = true; this.error = '';
    const dias = this.diasArray.value.map((d: any) => ({
      diaSemana:    d.diaSemana,
      activo:       d.activo,
      startTime:    d.startTime,
      endTime:      d.endTime,
      intervaloMin: Number(d.intervaloMin),
    }));
    this.http.put(`${environment.apiUrl}/business/hours`, { dias }).subscribe({
      next: () => { this.saving = false; this.saved = true; setTimeout(() => this.saved = false, 3000); },
      error: (e) => { this.error = e.error?.message || 'Error al guardar'; this.saving = false; }
    });
  }
}
