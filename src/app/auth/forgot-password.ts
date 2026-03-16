import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <h2>Recuperar Contraseña</h2>
      <p>Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
      
      <div *ngIf="successMessage" class="success-alert">{{ successMessage }}</div>
      <div *ngIf="error" class="error-alert">{{ error }}</div>

      <form [formGroup]="form" (ngSubmit)="submit()" *ngIf="!successMessage">
        <label>Correo Electrónico</label>
        <input type="email" formControlName="email" placeholder="ejemplo@correo.com">
        
        <button type="submit" [disabled]="loading">
          {{ loading ? 'Enviando...' : 'Enviar enlace' }}
        </button>
      </form>
      
      <a routerLink="/auth/login">Volver al login</a>
    </div>
  ` // Nota: Puedes mover este HTML a un archivo forgot-password.html y darle estilos en un .scss si prefieres
})
export class ForgotPassword {
  form: FormGroup;
  loading = false; 
  error = ''; 
  successMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get email() { return this.form.get('email')!; }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = ''; this.successMessage = '';
    
    this.auth.forgotPassword(this.email.value).subscribe({
      next: () => {
        this.successMessage = 'Si el correo existe, hemos enviado un enlace de recuperación.';
        this.loading = false;
      },
      error: (e) => { 
        this.error = 'Ocurrió un error al procesar tu solicitud.'; 
        this.loading = false; 
      },
    });
  }
}