import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../core/services/auth.service';
import { AppointmentsService, Appointment } from '../core/services/appointments.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  user = signal<User | null>(null);
  appointments = signal<Appointment[]>([]);
  form!: FormGroup;
  saving = false; saved = false; loadingAppts = true;
  previewUrl = signal<string | null>(null);
  activeTab = signal<'perfil' | 'historial'>('perfil');
  selectedFile: File | null = null;

  constructor(
    public auth: AuthService,
    private apptSvc: AppointmentsService,
    private fb: FormBuilder,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const u = this.auth.currentUser();
    this.user.set(u);
    this.previewUrl.set(u?.fotoUrl ?? null);
    this.form = this.fb.group({
      nombre:   [u?.nombre   ?? '', [Validators.required, Validators.minLength(2)]],
      telefono: [u?.telefono ?? ''],
      email:    [{ value: u?.email ?? '', disabled: true }],
    });
    this.apptSvc.getAll(u?.id).subscribe((res: any) => {
      this.appointments.set((res.data ?? res).sort((a: Appointment, b: Appointment) =>
        new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()));
      this.loadingAppts = false;
    });
  }

  get nombre() { return this.form.get('nombre')!; }

  onPhotoChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no debe superar 5MB'); return; }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const updateData: any = {
      nombre:   this.form.get('nombre')!.value,
      telefono: this.form.get('telefono')!.value,
    };

    // Si hay foto nueva, incluirla como base64 (temporal hasta tener S3)
    if (this.previewUrl() && this.selectedFile) {
      updateData.fotoUrl = this.previewUrl();
    }

    this.http.put<{ data: User }>(`${environment.apiUrl}/users/me`, updateData).subscribe({
      next: (res) => {
        const updated = res.data;
        this.user.set(updated);
        localStorage.setItem('unidos_user', JSON.stringify(updated));
        this.auth.currentUser.set(updated);
        this.saving = false;
        this.saved = true;
        this.selectedFile = null;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => {
        // Fallback: guardar solo en local si falla el backend
        const updated: User = {
          ...this.user()!,
          nombre:   this.form.get('nombre')!.value,
          telefono: this.form.get('telefono')!.value,
          fotoUrl:  this.previewUrl() ?? this.user()?.fotoUrl,
        };
        this.user.set(updated);
        localStorage.setItem('unidos_user', JSON.stringify(updated));
        this.auth.currentUser.set(updated);
        this.saving = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
      }
    });
  }

  formatDate(iso: string) { return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  statusClass(estado: string) { return 'badge badge--' + estado.toLowerCase(); }
  get initials() { return (this.user()?.nombre ?? '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); }
  get totalGastado() { return this.appointments().filter(a => a.estado === 'COMPLETADA').reduce((s, a) => s + (a.service?.precio ?? 0), 0); }
  get apptStats() {
    const all = this.appointments();
    return {
      total: all.length,
      completadas: all.filter(a => a.estado === 'COMPLETADA').length,
      proxima: all.find(a => (a.estado === 'CONFIRMADA' || a.estado === 'PENDIENTE') && new Date(a.startDatetime) >= new Date())
    };
  }
}
