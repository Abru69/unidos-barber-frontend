import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, GalleryImage } from '../core/services/api.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery implements OnInit {
  images = signal<GalleryImage[]>([]);
  loading = true;
  lightbox = signal<GalleryImage | null>(null);
  activeIdx = signal(0);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getGallery().subscribe((res: any) => {
      this.images.set(res.data ?? res);
      this.loading = false;
    });
  }

  openLightbox(img: GalleryImage, idx: number) {
    this.lightbox.set(img); this.activeIdx.set(idx);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() { this.lightbox.set(null); document.body.style.overflow = ''; }

  prev() {
    const i = (this.activeIdx() - 1 + this.images().length) % this.images().length;
    this.activeIdx.set(i); this.lightbox.set(this.images()[i]);
  }

  next() {
    const i = (this.activeIdx() + 1) % this.images().length;
    this.activeIdx.set(i); this.lightbox.set(this.images()[i]);
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'Escape') this.closeLightbox();
  }
}
