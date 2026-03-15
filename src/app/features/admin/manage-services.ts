import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Service } from '../../core/services/api.service';

@Component({
  selector: 'app-manage-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './manage-services.html',
  styleUrl: './manage-services.scss',
})
export class ManageServices implements OnInit {
  services = signal<Service[]>([]);
  loading = true; saving = false; deleting: string | null = null;
  modalOpen = false; editingId: string | null = null;
  form!: FormGroup; formError = '';

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit() { this.initForm(); this.load(); }

  initForm(s?: Service) {
    this.form = this.fb.group({
      nombre:      [s?.nombre      ?? '', [Validators.required, Validators.minLength(2)]],
      descripcion: [s?.descripcion ?? ''],
      precio:      [s?.precio      ?? '', [Validators.required, Validators.min(1)]],
      duracionMin: [s?.duracionMin ?? 30, [Validators.required, Validators.min(5)]],
      activo:      [s?.activo      ?? true],
    });
  }

  load() {
    this.loading = true;
    this.api.getServices().subscribe((res: any) => { this.services.set(res.data ?? res); this.loading = false; });
  }

  openCreate() { this.editingId = null; this.formError = ''; this.initForm(); this.modalOpen = true; }
  openEdit(s: Service) { this.editingId = s.id; this.formError = ''; this.initForm(s); this.modalOpen = true; }
  closeModal() { this.modalOpen = false; this.editingId = null; this.formError = ''; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.formError = '';
    const val = this.form.value;
    if (this.editingId) {
      this.services.update(list => list.map(s => s.id === this.editingId ? { ...s, ...val } : s));
    } else {
      const newService: Service = { id: Date.now().toString(), ...val, precio: Number(val.precio), duracionMin: Number(val.duracionMin) };
      this.services.update(list => [newService, ...list]);
    }
    setTimeout(() => { this.saving = false; this.closeModal(); }, 500);
  }

  toggleActivo(s: Service) { this.services.update(list => list.map(item => item.id === s.id ? { ...item, activo: !item.activo } : item)); }

  delete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    this.deleting = id;
    setTimeout(() => { this.services.update(list => list.filter(s => s.id !== id)); this.deleting = null; }, 400);
  }

  get nombre()      { return this.form.get('nombre')!; }
  get precio()      { return this.form.get('precio')!; }
  get duracionMin() { return this.form.get('duracionMin')!; }
}
