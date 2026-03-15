import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, GalleryImage } from '../../core/services/api.service';

@Component({
  selector: 'app-manage-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './manage-gallery.html',
  styleUrl: './manage-gallery.scss',
})
export class ManageGallery implements OnInit {
  images = signal<GalleryImage[]>([]);
  loading = true; uploading = false; deleting: string | null = null;
  previewUrl = signal<string | null>(null);
  descripcion = ''; uploadError = ''; uploadOk = false;
  selectedFile: File | null = null;

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getGallery().subscribe({ next: (res: any) => { this.images.set(res.data ?? res); this.loading = false; }, error: () => { this.loading = false; } });
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.uploadError = 'La imagen no debe superar 5MB'; return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { this.uploadError = 'Solo se permiten JPG, PNG o WebP'; return; }
    this.uploadError = ''; this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading = true; this.uploadError = '';
    this.api.uploadGalleryImage(this.selectedFile, this.descripcion || 'Sin descripción').subscribe({
      next: () => { this.load(); this.previewUrl.set(null); this.descripcion = ''; this.selectedFile = null; this.uploading = false; this.uploadOk = true; setTimeout(() => this.uploadOk = false, 3000); },
      error: (e) => { this.uploadError = e.error?.message || 'Error al subir imagen'; this.uploading = false; }
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    this.deleting = id;
    this.api.deleteGalleryImage(id).subscribe({ next: () => { this.load(); this.deleting = null; }, error: () => { this.deleting = null; } });
  }

  clearPreview() { this.previewUrl.set(null); this.selectedFile = null; this.uploadError = ''; }
}
