import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./login.scss'], // 👈 Reutilizamos los estilos del login
  template: `
    <div class="auth-page">
      <div class="auth-page__deco" aria-hidden="true">
        <div class="deco-content">
          <span class="deco-icon">✂</span>
          <h2>Recupera tu <em>acceso</em></h2>
          <p>Te ayudaremos a volver para tu próximo corte.</p>
          <div class="deco-lines"><span></span><span></span><span></span></div>
        </div>
      </div>
      <div class="auth-page__form-wrap">
        <div class="auth-card">
          <div class="auth-card__header">
            <a routerLink="/" class="auth-card__logo">✂ Unidos <em>Barber</em></a>
            <h1>¿Olvidaste tu contraseña?</h1>
            <p>Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
          </div>

          <div *ngIf="successMessage" class="auth-card__error" style="background: rgba(76,175,125,0.1); border-color: rgba(76,175,125,0.3); color: var(--color-success);">
            ✓ {{ successMessage }}
          </div>
          <div *ngIf="error" class="auth-card__error">⚠ {{ error }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate *ngIf="!successMessage">
            <div class="form-field">
              <label for="email">Correo electrónico</label>
              <input id="email" type="email" formControlName="email" placeholder="tu@correo.com" />
              <span class="error-msg" *ngIf="email.touched && email.hasError('required')">El correo es obligatorio</span>
              <span class="error-msg" *ngIf="email.touched && email.hasError('email')">Ingresa un correo válido</span>
            </div>

            <button type="submit" class="btn btn--primary btn--full" [disabled]="loading">
              <span *ngIf="!loading">Enviar enlace</span>
              <span *ngIf="loading" class="spinner"></span>
            </button>
          </form>

          <p class="auth-card__footer">
            ¿Recordaste tu contraseña? <a routerLink="/auth/login">Volver a iniciar sesión</a>
          </p>
        </div>
      </div>
    </div>
  `
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
        this.successMessage = 'Si el correo existe, hemos enviado un enlace de recuperación. Revisa tu bandeja de entrada o la carpeta de spam.';
        this.loading = false;
      },
      error: (e) => { 
        this.error = 'Ocurrió un error al procesar tu solicitud.'; 
        this.loading = false; 
      },
    });
  }
}