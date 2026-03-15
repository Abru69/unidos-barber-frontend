import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, throwError, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'REPROGRAMADA';
export interface Appointment {
  id: string; userId: string; serviceId: string;
  startDatetime: string; endDatetime: string;
  estado: AppointmentStatus; notas?: string; createdAt: string;
  service?: { nombre: string; precio: number; duracionMin: number };
  user?: { nombre: string; email: string; telefono?: string };
}

const USE_MOCK = false;
let MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', userId: '2', serviceId: '1', startDatetime: new Date(Date.now() + 86400000).toISOString(), endDatetime: new Date(Date.now() + 86400000 + 1800000).toISOString(), estado: 'PENDIENTE', notas: 'Degradado bajo', createdAt: new Date().toISOString(), service: { nombre: 'Corte Clásico', precio: 150, duracionMin: 30 }, user: { nombre: 'Juan Cliente', email: 'cliente@test.com' } },
];
const MOCK_HOURS = [
  { diaSemana: 1, startTime: '09:00', endTime: '19:00', intervaloMin: 30, activo: true },
  { diaSemana: 2, startTime: '09:00', endTime: '19:00', intervaloMin: 30, activo: true },
  { diaSemana: 3, startTime: '09:00', endTime: '19:00', intervaloMin: 30, activo: true },
  { diaSemana: 4, startTime: '09:00', endTime: '19:00', intervaloMin: 30, activo: true },
  { diaSemana: 5, startTime: '09:00', endTime: '19:00', intervaloMin: 30, activo: true },
  { diaSemana: 6, startTime: '09:00', endTime: '17:00', intervaloMin: 30, activo: true },
];

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  getAll(userId?: string) {
    if (USE_MOCK) {
      const result = userId ? MOCK_APPOINTMENTS.filter(a => a.userId === userId) : MOCK_APPOINTMENTS;
      return of({ data: [...result] }).pipe(delay(400));
    }
    return this.http.get<{ data: Appointment[] }>(`${environment.apiUrl}/appointments`);
  }

  getBusinessHours() {
    if (USE_MOCK) return of({ data: MOCK_HOURS }).pipe(delay(200));
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/business/hours`);
  }

  create(payload: { serviceId: string; startDatetime: string; notas?: string; userId: string; duracionMin: number }) {
    if (USE_MOCK) {
      const start = new Date(payload.startDatetime);
      const end = new Date(start.getTime() + payload.duracionMin * 60000);
      const conflict = MOCK_APPOINTMENTS.find(a => {
        if (a.estado === 'CANCELADA') return false;
        return start < new Date(a.endDatetime) && end > new Date(a.startDatetime);
      });
      if (conflict) return throwError(() => ({ error: { message: 'El horario ya está ocupado' } })).pipe(delay(400));
      const newAppt: Appointment = { id: 'a' + Date.now(), userId: payload.userId, serviceId: payload.serviceId, startDatetime: start.toISOString(), endDatetime: end.toISOString(), estado: 'PENDIENTE', notas: payload.notas, createdAt: new Date().toISOString() };
      MOCK_APPOINTMENTS.push(newAppt);
      return of({ data: newAppt }).pipe(delay(600));
    }
    return this.http.post<{ data: Appointment }>(`${environment.apiUrl}/appointments`, {
      serviceId: payload.serviceId, startDatetime: payload.startDatetime, notas: payload.notas,
    });
  }

  updateStatus(id: string, estado: AppointmentStatus) {
    if (USE_MOCK) {
      const appt = MOCK_APPOINTMENTS.find(a => a.id === id);
      if (!appt) return throwError(() => ({ error: { message: 'Cita no encontrada' } }));
      appt.estado = estado;
      return of({ data: { ...appt } }).pipe(delay(400));
    }
    return this.http.put<{ data: Appointment }>(`${environment.apiUrl}/appointments/${id}`, { estado });
  }

  cancel(id: string) { return this.updateStatus(id, 'CANCELADA'); }
}
