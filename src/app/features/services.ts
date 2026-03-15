import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Service } from '../core/services/api.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services implements OnInit {
  services = signal<Service[]>([]);
  loading = true;
  icons: Record<string, string> = { 'Corte Clásico': '✂', 'Degradado': '⚡', 'Barba': '🪒', 'Corte + Barba': '👑' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getServices().subscribe((res: any) => {
      this.services.set((res.data ?? res).filter((s: Service) => s.activo));
      this.loading = false;
    });
  }

  getIcon(nombre: string) { return this.icons[nombre] ?? '✂'; }
}
