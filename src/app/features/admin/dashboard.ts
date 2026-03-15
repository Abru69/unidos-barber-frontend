import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment } from '../../core/services/appointments.service';
import { ApiService, Service } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  appointments = signal<Appointment[]>([]);
  services = signal<Service[]>([]);
  loading = true;
  updating: string | null = null;

  stats = signal({ total: 0, pendientes: 0, confirmadas: 0, hoy: 0 });

  constructor(private apptSvc: AppointmentsService, private apiSvc: ApiService) {}

  ngOnInit() {
    this.load();
    this.apiSvc.getServices().subscribe((r: any) => this.services.set(r.data ?? r));
  }

  load() {
    this.loading = true;
    this.apptSvc.getAll().subscribe((res: any) => {
      const all: Appointment[] = res.data ?? res;
      const today = new Date().toISOString().split('T')[0];
      this.appointments.set(all);
      this.stats.set({ total: all.length, pendientes: all.filter(a => a.estado === 'PENDIENTE').length, confirmadas: all.filter(a => a.estado === 'CONFIRMADA').length, hoy: all.filter(a => a.startDatetime.startsWith(today)).length });
      this.loading = false;
    });
  }

  get pending() { return this.appointments().filter(a => a.estado === 'PENDIENTE').sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()); }
  get upcoming() { const now = new Date(); return this.appointments().filter(a => a.estado === 'CONFIRMADA' && new Date(a.startDatetime) >= now).sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()).slice(0, 5); }

  confirm(id: string) { this.updating = id; this.apptSvc.updateStatus(id, 'CONFIRMADA').subscribe(() => { this.updating = null; this.load(); }); }
  cancel(id: string) { this.updating = id; this.apptSvc.updateStatus(id, 'CANCELADA').subscribe(() => { this.updating = null; this.load(); }); }
  complete(id: string) { this.updating = id; this.apptSvc.updateStatus(id, 'COMPLETADA').subscribe(() => { this.updating = null; this.load(); }); }

  formatDate(iso: string) { return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }); }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }
}
