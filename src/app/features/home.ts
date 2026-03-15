import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Service, GalleryImage } from '../core/services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  services  = signal<Service[]>([]);
  gallery   = signal<GalleryImage[]>([]);
  loadingSvc = true;
  loadingGal = true;

  stats = [
    { value: '5+', label: 'Años de experiencia' },
    { value: '2K+', label: 'Clientes satisfechos' },
    { value: '4', label: 'Servicios premium' },
    { value: '100%', label: 'Satisfacción garantizada' },
  ];

  icons: Record<string, string> = {
    'Corte Clásico': '✂', 'Degradado': '⚡', 'Barba': '🪒', 'Corte + Barba': '👑',
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getServices().subscribe((res: any) => {
      this.services.set(res.data ?? res);
      this.loadingSvc = false;
    });
    this.api.getGallery().subscribe((res: any) => {
      this.gallery.set(res.data ?? res);
      this.loadingGal = false;
    });
  }

  getIcon(nombre: string) { return this.icons[nombre] ?? '✂'; }
}
