import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Service {
  id: string; nombre: string; descripcion: string;
  precio: number; duracionMin: number; activo: boolean;
}
export interface GalleryImage { id: string; url: string; descripcion: string; }

const USE_MOCK = false;
const MOCK_SERVICES: Service[] = [
  { id: '1', nombre: 'Corte Clásico',  descripcion: 'Corte tradicional con tijera y máquina',    precio: 150, duracionMin: 30, activo: true },
  { id: '2', nombre: 'Degradado',       descripcion: 'Fade profesional con degradado perfecto',    precio: 180, duracionMin: 45, activo: true },
  { id: '3', nombre: 'Barba',           descripcion: 'Perfilado y arreglo de barba completo',      precio: 120, duracionMin: 30, activo: true },
  { id: '4', nombre: 'Corte + Barba',  descripcion: 'Combo completo: corte y arreglo de barba',   precio: 250, duracionMin: 60, activo: true },
];
const MOCK_GALLERY: GalleryImage[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80', descripcion: 'Degradado clásico' },
  { id: '2', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80', descripcion: 'Corte moderno' },
  { id: '3', url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80', descripcion: 'Barba perfilada' },
  { id: '4', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80', descripcion: 'Estilo urbano' },
  { id: '5', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80', descripcion: 'Fade perfecto' },
  { id: '6', url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=600&q=80', descripcion: 'Look profesional' },
];

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}
  getServices() {
    if (USE_MOCK) return of({ data: MOCK_SERVICES }).pipe(delay(400));
    return this.http.get<{ data: Service[] }>(`${environment.apiUrl}/services`);
  }
  getGallery() {
    if (USE_MOCK) return of({ data: MOCK_GALLERY }).pipe(delay(400));
    return this.http.get<{ data: GalleryImage[] }>(`${environment.apiUrl}/gallery`);
  }
  uploadGalleryImage(file: File, descripcion: string) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('descripcion', descripcion);
    return this.http.post<{ data: GalleryImage }>(`${environment.apiUrl}/gallery`, formData);
  }
  deleteGalleryImage(id: string) { return this.http.delete(`${environment.apiUrl}/gallery/${id}`); }
  createService(data: Partial<Service>) { return this.http.post<{ data: Service }>(`${environment.apiUrl}/services`, data); }
  updateService(id: string, data: Partial<Service>) { return this.http.put<{ data: Service }>(`${environment.apiUrl}/services/${id}`, data); }
  deleteService(id: string) { return this.http.delete(`${environment.apiUrl}/services/${id}`); }
}
