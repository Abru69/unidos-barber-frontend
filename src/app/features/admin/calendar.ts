import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment } from '../../core/services/appointments.service';

interface CalendarDay {
  date: Date;
  label: string;
  dayNum: number;
  isToday: boolean;
  isWeekend: boolean;
  appointments: Appointment[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class Calendar implements OnInit {
  allAppointments = signal<Appointment[]>([]);
  loading = true;
  weekOffset = signal(0);

  days = computed<CalendarDay[]>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + this.weekOffset() * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      return {
        date,
        label: date.toLocaleDateString('es-MX', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: dateStr === todayStr,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        appointments: this.allAppointments().filter(a =>
          new Date(a.startDatetime).toISOString().split('T')[0] === dateStr &&
          a.estado !== 'CANCELADA'
        ).sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()),
      };
    });
  });

  weekLabel = computed(() => {
    const days = this.days();
    if (!days.length) return '';
    const first = days[0].date;
    const last  = days[6].date;
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${first.toLocaleDateString('es-MX', opts)} — ${last.toLocaleDateString('es-MX', { ...opts, year: 'numeric' })}`;
  });

  totalWeek = computed(() => this.days().reduce((s, d) => s + d.appointments.length, 0));

  constructor(private apptSvc: AppointmentsService) {}

  ngOnInit() {
    this.apptSvc.getAll().subscribe((res: any) => {
      this.allAppointments.set(res.data ?? res);
      this.loading = false;
    });
  }

  prevWeek() { this.weekOffset.update(v => v - 1); }
  nextWeek() { this.weekOffset.update(v => v + 1); }
  goToday()  { this.weekOffset.set(0); }

  formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }

  statusColor(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE:  '#c9a84c',
      CONFIRMADA: '#4caf7d',
      COMPLETADA: '#7a7670',
      CANCELADA:  '#e05555',
    };
    return map[estado] ?? '#c9a84c';
  }

  get monthYear() {
    const d = this.days()[3]?.date ?? new Date();
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }
}
