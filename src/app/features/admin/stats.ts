import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentsService, Appointment } from '../../core/services/appointments.service';
import { AbsPipe } from '../../core/pipes/abs.pipe';

interface ServiceStat { nombre: string; count: number; ingresos: number; pct: number; }
interface DayStat { label: string; count: number; ingresos: number; }

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, AbsPipe],
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats implements OnInit {
  all         = signal<Appointment[]>([]);
  loading     = true;
  activeTab   = signal<'mes' | 'semana' | 'total'>('mes');

  now         = new Date();
  thisMonth   = this.now.getMonth();
  thisYear    = this.now.getFullYear();
  lastMonth   = this.thisMonth === 0 ? 11 : this.thisMonth - 1;
  lastYear    = this.thisMonth === 0 ? this.thisYear - 1 : this.thisYear;

  filtered = computed(() => {
    const appts = this.all().filter(a => a.estado !== 'CANCELADA');
    const tab   = this.activeTab();
    if (tab === 'mes') return appts.filter(a => {
      const d = new Date(a.startDatetime);
      return d.getMonth() === this.thisMonth && d.getFullYear() === this.thisYear;
    });
    if (tab === 'semana') {
      const start = new Date(); start.setDate(this.now.getDate() - this.now.getDay() + 1); start.setHours(0,0,0,0);
      const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      return appts.filter(a => { const d = new Date(a.startDatetime); return d >= start && d <= end; });
    }
    return appts;
  });

  prevFiltered = computed(() => {
    return this.all().filter(a => a.estado !== 'CANCELADA').filter(a => {
      const d = new Date(a.startDatetime);
      return d.getMonth() === this.lastMonth && d.getFullYear() === this.lastYear;
    });
  });

  totalCitas        = computed(() => this.filtered().length);
  completadas       = computed(() => this.filtered().filter(a => a.estado === 'COMPLETADA').length);
  pendientes        = computed(() => this.filtered().filter(a => a.estado === 'PENDIENTE').length);
  confirmadas       = computed(() => this.filtered().filter(a => a.estado === 'CONFIRMADA').length);
  ingresos          = computed(() => this.filtered().filter(a => a.estado === 'COMPLETADA').reduce((s, a) => s + (a.service?.precio ?? 0), 0));
  prevIngresos      = computed(() => this.prevFiltered().filter(a => a.estado === 'COMPLETADA').reduce((s, a) => s + (a.service?.precio ?? 0), 0));
  prevCitas         = computed(() => this.prevFiltered().length);
  diffIngresos      = computed(() => { const p = this.prevIngresos(); return p === 0 ? null : Math.round(((this.ingresos() - p) / p) * 100); });
  diffCitas         = computed(() => { const p = this.prevCitas(); return p === 0 ? null : Math.round(((this.totalCitas() - p) / p) * 100); });
  tasaCompletadas   = computed(() => { const t = this.totalCitas(); return t === 0 ? 0 : Math.round((this.completadas() / t) * 100); });
  ticketPromedio    = computed(() => { const c = this.completadas(); return c === 0 ? 0 : Math.round(this.ingresos() / c); });

  serviceStats = computed<ServiceStat[]>(() => {
    const map = new Map<string, ServiceStat>();
    for (const a of this.filtered()) {
      const nombre = a.service?.nombre ?? 'Desconocido';
      const precio = a.service?.precio ?? 0;
      const prev   = map.get(nombre) ?? { nombre, count: 0, ingresos: 0, pct: 0 };
      map.set(nombre, { ...prev, count: prev.count + 1, ingresos: prev.ingresos + precio });
    }
    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    const max  = list[0]?.count ?? 1;
    return list.map(s => ({ ...s, pct: Math.round((s.count / max) * 100) }));
  });

  dayStats = computed<DayStat[]>(() => {
    const labels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const counts = new Array(7).fill(0);
    const ingrs  = new Array(7).fill(0);
    for (const a of this.filtered()) {
      const idx = (new Date(a.startDatetime).getDay() + 6) % 7;
      counts[idx]++;
      ingrs[idx] += a.service?.precio ?? 0;
    }
    return labels.map((label, i) => ({ label, count: counts[i], ingresos: ingrs[i] }));
  });

  maxDayCount = computed(() => Math.max(...this.dayStats().map(d => d.count), 1));

  clientStats = computed(() => {
    const appts     = this.filtered();
    const clientMap = new Map<string, number>();
    for (const a of this.all()) {
      const uid = a.userId ?? (a.user as any)?.id ?? '';
      if (uid) clientMap.set(uid, (clientMap.get(uid) ?? 0) + 1);
    }
    const ids = new Set(appts.map(a => a.userId ?? (a.user as any)?.id ?? ''));
    let nuevos = 0, recurrentes = 0;
    for (const id of ids) { if (clientMap.get(id) === 1) nuevos++; else recurrentes++; }
    const total = nuevos + recurrentes || 1;
    return { nuevos, recurrentes, pctNuevos: Math.round((nuevos / total) * 100), pctRec: Math.round((recurrentes / total) * 100) };
  });

  constructor(private apptSvc: AppointmentsService) {}

  ngOnInit() {
    this.apptSvc.getAll().subscribe((res: any) => { this.all.set(res.data ?? res); this.loading = false; });
  }

  setTab(tab: 'mes' | 'semana' | 'total') { this.activeTab.set(tab); }

  get periodLabel() { return ({ mes: 'este mes', semana: 'esta semana', total: 'histórico' } as any)[this.activeTab()]; }
  get prevMonthLabel() { return new Date(this.lastYear, this.lastMonth, 1).toLocaleDateString('es-MX', { month: 'long' }); }
}
