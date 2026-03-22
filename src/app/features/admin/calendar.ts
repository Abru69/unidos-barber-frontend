import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment } from '../../core/services/appointments.service';

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isBlocked: boolean;
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
  businessHours   = signal<any[]>([]);
  loading         = true;
  currentDate     = signal(new Date());
  selectedWeek    = signal<string | null>(null);
  animating       = signal(false);

  calendarDays = computed<CalendarDay[]>(() => {
    const d     = this.currentDate();
    const year  = d.getFullYear();
    const month = d.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const today = new Date().toISOString().split('T')[0];

    // Padding inicio (lunes = 0)
    const startPad = (first.getDay() + 6) % 7;
    const days: CalendarDay[] = [];

    // Días del mes anterior
    for (let i = startPad - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(this.buildDay(date, today, false));
    }

    // Días del mes actual
    for (let i = 1; i <= last.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(this.buildDay(date, today, true));
    }

    // Padding final
    const endPad = 42 - days.length;
    for (let i = 1; i <= endPad; i++) {
      const date = new Date(year, month + 1, i);
      days.push(this.buildDay(date, today, false));
    }

    return days;
  });

  weeks = computed(() => {
    const days = this.calendarDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  selectedWeekDays = computed(() => {
    if (!this.selectedWeek()) return null;
    return this.weeks().find(w => this.weekKey(w) === this.selectedWeek()) ?? null;
  });

  monthLabel = computed(() => {
    return this.currentDate().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  });

  totalMonth = computed(() => {
    return this.calendarDays().filter(d => d.isCurrentMonth).reduce((s, d) => s + d.appointments.length, 0);
  });

  constructor(private apptSvc: AppointmentsService) {}

  ngOnInit() {
    this.apptSvc.getBusinessHours().subscribe((res: any) => {
      this.businessHours.set(res.data ?? res);
    });
    this.apptSvc.getAll().subscribe((res: any) => {
      this.allAppointments.set(res.data ?? res);
      this.loading = false;
    });
  }

  buildDay(date: Date, today: string, isCurrentMonth: boolean): CalendarDay {
    const dateStr   = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const bh        = this.businessHours().find((h: any) => h.diaSemana === dayOfWeek);
    const isBlocked = bh ? !bh.activo : true;

    return {
      date, dateStr, dayNum: date.getDate(),
      isToday: dateStr === today,
      isCurrentMonth,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isBlocked,
      appointments: this.allAppointments().filter(a =>
        new Date(a.startDatetime).toISOString().split('T')[0] === dateStr &&
        a.estado !== 'CANCELADA'
      ).sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()),
    };
  }

  weekKey(week: CalendarDay[]) { return week[0].dateStr; }

  selectWeek(week: CalendarDay[]) {
    const key = this.weekKey(week);
    if (this.selectedWeek() === key) {
      this.selectedWeek.set(null);
    } else {
      this.animating.set(true);
      this.selectedWeek.set(key);
      setTimeout(() => this.animating.set(false), 350);
    }
  }

  closeWeek() { this.selectedWeek.set(null); }

  prevMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
    this.selectedWeek.set(null);
  }

  nextMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
    this.selectedWeek.set(null);
  }

  goToday() {
    this.currentDate.set(new Date());
    this.selectedWeek.set(null);
  }

  formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  statusColor(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE:  '#c9a84c',
      CONFIRMADA: '#4caf7d',
      COMPLETADA: '#7a7670',
    };
    return map[estado] ?? '#c9a84c';
  }

  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }

  weekRangeLabel(week: CalendarDay[]) {
    const first = week[0].date;
    const last  = week[6].date;
    return `${first.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — ${last.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
  }

  weekApptCount(week: CalendarDay[]) {
    return week.reduce((s, d) => s + d.appointments.length, 0);
  }

  readonly weekDayLabels = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];
}
