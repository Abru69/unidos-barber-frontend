import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Service } from '../../core/services/api.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { AuthService } from '../../core/services/auth.service';

interface TimeSlot { time: string; label: string; occupied: boolean; }

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './book-appointment.html',
  styleUrl: './book-appointment.scss',
})
export class BookAppointment implements OnInit {
  form!: FormGroup;
  services = signal<Service[]>([]);
  slots = signal<TimeSlot[]>([]);
  selected = signal<Service | null>(null);
  step = signal<1 | 2 | 3>(1);
  loading = false; error = ''; success = false;
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder, private api: ApiService,
    private apptSvc: AppointmentsService, private auth: AuthService, private router: Router,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({ serviceId: ['', Validators.required], date: ['', Validators.required], time: ['', Validators.required], notas: [''] });
    this.api.getServices().subscribe((res: any) => this.services.set(res.data ?? res));
  }

  selectService(s: Service) { this.form.patchValue({ serviceId: s.id, time: '' }); this.selected.set(s); this.slots.set([]); }

  onDateChange() {
    const date = this.form.get('date')?.value;
    if (!date || !this.selected()) return;
    this.form.patchValue({ time: '' });
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    this.apptSvc.getBusinessHours().subscribe((res: any) => {
      const hours = (res.data ?? res).find((h: any) => h.diaSemana === dayOfWeek && h.activo);
      if (!hours) { this.slots.set([]); return; }
      this.apptSvc.getAll().subscribe((apptRes: any) => {
        const occupied = (apptRes.data ?? apptRes).filter((a: any) => a.estado !== 'CANCELADA' && a.startDatetime.startsWith(date));
        const generated: TimeSlot[] = [];
        let cur = new Date(`${date}T${hours.startTime}`);
        const end = new Date(`${date}T${hours.endTime}`);
        const dur = this.selected()!.duracionMin;
        while (new Date(cur.getTime() + dur * 60000) <= end) {
          const timeStr = cur.toTimeString().slice(0, 5);
          const slotEnd = new Date(cur.getTime() + dur * 60000);
          const isOccupied = occupied.some((a: any) => cur < new Date(a.endDatetime) && slotEnd > new Date(a.startDatetime));
          const isPast = new Date(`${date}T${timeStr}`) < new Date();
          generated.push({ time: cur.toISOString(), label: timeStr, occupied: isOccupied || isPast });
          cur = new Date(cur.getTime() + hours.intervaloMin * 60000);
        }
        this.slots.set(generated);
      });
    });
  }

  selectSlot(slot: TimeSlot) { if (slot.occupied) return; this.form.patchValue({ time: slot.time }); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    const user = this.auth.currentUser();
    const { serviceId, time, notas } = this.form.value;
    this.apptSvc.create({ serviceId, startDatetime: time, notas, userId: user!.id, duracionMin: this.selected()!.duracionMin }).subscribe({
      next: () => { this.loading = false; this.success = true; setTimeout(() => this.router.navigate(['/appointments']), 2500); },
      error: (e) => { this.error = e.error?.message || 'Error al reservar'; this.loading = false; },
    });
  }

  goStep(n: 1 | 2 | 3) { this.step.set(n); }

  get selectedSlotLabel() { const t = this.form.get('time')?.value; return t ? new Date(t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''; }
  get selectedDateLabel() { const d = this.form.get('date')?.value; return d ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : ''; }
}
