import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AppointmentsService, Appointment } from '../../core/services/appointments.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './appointment-detail.html',
  styleUrl: './appointment-detail.scss',
})
export class AppointmentDetail implements OnInit {
  appointment = signal<Appointment | null>(null);
  loading = true; cancelling = false; isAdmin = false;
  updating: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private apptSvc: AppointmentsService, private auth: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.auth.isAdmin();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/appointments']); return; }
    this.apptSvc.getAll().subscribe((res: any) => {
      const found = (res.data ?? res).find((a: Appointment) => a.id === id) ?? null;
      this.appointment.set(found);
      this.loading = false;
      if (!found) this.router.navigate(['/appointments']);
    });
  }

  cancel() {
    const a = this.appointment();
    if (!a || !confirm('¿Cancelar esta cita?')) return;
    this.cancelling = true;
    this.apptSvc.cancel(a.id).subscribe(() => {
      this.cancelling = false;
      this.apptSvc.getAll().subscribe((res: any) => {
        this.appointment.set((res.data ?? res).find((x: Appointment) => x.id === a.id) ?? null);
      });
    });
  }

  updateStatus(estado: any) {
    const a = this.appointment();
    if (!a) return;
    this.updating = estado;
    this.apptSvc.updateStatus(a.id, estado).subscribe(() => {
      this.updating = null;
      this.apptSvc.getAll().subscribe((res: any) => {
        this.appointment.set((res.data ?? res).find((x: Appointment) => x.id === a.id) ?? null);
      });
    });
  }

  formatDate(iso: string) { return new Date(iso).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }
  canCancel(a: Appointment) { return a.estado === 'PENDIENTE' || a.estado === 'CONFIRMADA'; }
}
