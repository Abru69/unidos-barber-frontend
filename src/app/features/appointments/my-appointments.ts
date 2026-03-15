import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment } from '../../core/services/appointments.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.scss',
})
export class MyAppointments implements OnInit {
  appointments = signal<Appointment[]>([]);
  loading = true;
  cancelling: string | null = null;

  constructor(private apptSvc: AppointmentsService, private auth: AuthService) {}

  ngOnInit() { this.load(); }

  load() {
    const user = this.auth.currentUser();
    this.apptSvc.getAll(user?.id).subscribe((res: any) => {
      this.appointments.set((res.data ?? res).sort((a: Appointment, b: Appointment) =>
        new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()));
      this.loading = false;
    });
  }

  cancel(id: string) {
    this.cancelling = id;
    this.apptSvc.cancel(id).subscribe(() => { this.cancelling = null; this.load(); });
  }

  formatDate(iso: string) { return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  canCancel(a: Appointment) { return a.estado === 'PENDIENTE' || a.estado === 'CONFIRMADA'; }
  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }
}
