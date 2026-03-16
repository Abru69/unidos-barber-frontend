import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <h2>Nueva Contraseña</h2>
      <div *ngIf="error" class="error-alert">{{ error }}</div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Nueva Contraseña (mínimo 6 caracteres)</label>
        <input type="password" formControlName="password">
        
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Guardando...' : 'Restablecer contraseña' }}
        </button>
      </form>
    </div>
  `
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  loading = false; 
  error = ''; 
  token = '';

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    // Extraemos el token de la URL, por ejemplo: misitio.com/auth/reset-password?token=12345
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.error = 'Enlace inválido o expirado. Por favor solicita uno nuevo.';
        this.form.disable();
      }
    });
  }

  get password() { return this.form.get('password')!; }

  submit() {
    if (this.form.invalid || !this.token) return;
    this.loading = true; this.error = '';
    
    this.auth.resetPassword(this.token, this.password.value).subscribe({
      next: () => {
        alert('Contraseña actualizada con éxito. Ya puedes iniciar sesión.');
        this.router.navigate(['/auth/login']);
      },
      error: (e) => { 
        this.error = e.error?.message || 'Error al restablecer la contraseña'; 
        this.loading = false; 
      },
    });
  }
}