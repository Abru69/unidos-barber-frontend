import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment, AppointmentStatus } from '../../core/services/appointments.service';

@Component({
  selector: 'app-manage-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manage-appointments.html',
  styleUrl: './manage-appointments.scss',
})
export class ManageAppointments implements OnInit {
  all = signal<Appointment[]>([]);
  loading = true; updating: string | null = null;
  filterStatus = signal<AppointmentStatus | 'TODAS'>('TODAS');
  filterDate = signal(''); searchQuery = signal('');
  statuses: (AppointmentStatus | 'TODAS')[] = ['TODAS','PENDIENTE','CONFIRMADA','CANCELADA','COMPLETADA','REPROGRAMADA'];

  filtered = computed(() => {
    let list = this.all();
    if (this.filterStatus() !== 'TODAS') list = list.filter(a => a.estado === this.filterStatus());
    if (this.filterDate()) list = list.filter(a => a.startDatetime.startsWith(this.filterDate()));
    const q = this.searchQuery().toLowerCase();
    if (q) list = list.filter(a => a.user?.nombre?.toLowerCase().includes(q) || a.service?.nombre?.toLowerCase().includes(q));
    return list.sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime());
  });

  counts = computed(() => {
    const all = this.all();
    return { TODAS: all.length, PENDIENTE: all.filter(a => a.estado === 'PENDIENTE').length, CONFIRMADA: all.filter(a => a.estado === 'CONFIRMADA').length, CANCELADA: all.filter(a => a.estado === 'CANCELADA').length, COMPLETADA: all.filter(a => a.estado === 'COMPLETADA').length, REPROGRAMADA: all.filter(a => a.estado === 'REPROGRAMADA').length };
  });

  constructor(private apptSvc: AppointmentsService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.apptSvc.getAll().subscribe((res: any) => { this.all.set(res.data ?? res); this.loading = false; });
  }

  setStatus(s: AppointmentStatus | 'TODAS') { this.filterStatus.set(s); }
  setDate(e: Event) { this.filterDate.set((e.target as HTMLInputElement).value); }
  setSearch(e: Event) { this.searchQuery.set((e.target as HTMLInputElement).value); }
  clearFilters() { this.filterStatus.set('TODAS'); this.filterDate.set(''); this.searchQuery.set(''); }

  update(id: string, estado: AppointmentStatus) {
    this.updating = id;
    this.apptSvc.updateStatus(id, estado).subscribe(() => { this.updating = null; this.load(); });
  }

  formatDate(iso: string) { return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }

  availableTransitions(estado: AppointmentStatus): { label: string; value: AppointmentStatus }[] {
    const map: Record<AppointmentStatus, { label: string; value: AppointmentStatus }[]> = {
      PENDIENTE: [{ label: '✓ Confirmar', value: 'CONFIRMADA' }, { label: '✕ Cancelar', value: 'CANCELADA' }],
      CONFIRMADA: [{ label: '★ Completar', value: 'COMPLETADA' }, { label: '✕ Cancelar', value: 'CANCELADA' }],
      REPROGRAMADA: [{ label: '✓ Confirmar', value: 'CONFIRMADA' }, { label: '✕ Cancelar', value: 'CANCELADA' }],
      CANCELADA: [], COMPLETADA: [],
    };
    return map[estado] ?? [];
  }
}
