import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./login.scss'], // 👈 Reutilizamos los estilos del login
  template: `
    <div class="auth-page">
      <div class="auth-page__deco" aria-hidden="true">
        <div class="deco-content">
          <span class="deco-icon">✂</span>
          <h2>Un nuevo <em>comienzo</em></h2>
          <p>Elige una contraseña segura que puedas recordar.</p>
          <div class="deco-lines"><span></span><span></span><span></span></div>
        </div>
      </div>
      <div class="auth-page__form-wrap">
        <div class="auth-card">
          <div class="auth-card__header">
            <a routerLink="/" class="auth-card__logo">✂ Unidos <em>Barber</em></a>
            <h1>Nueva Contraseña</h1>
            <p *ngIf="token">Por favor, ingresa tu nueva contraseña a continuación.</p>
          </div>

          <div *ngIf="error" class="auth-card__error">⚠ {{ error }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate *ngIf="token">
            <div class="form-field">
              <label for="password">Nueva Contraseña (mínimo 6 caracteres)</label>
              <div class="input-wrap">
                <input id="password" [type]="showPass ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
                <button type="button" class="toggle-pass" (click)="showPass = !showPass">{{ showPass ? '🙈' : '👁' }}</button>
              </div>
              <span class="error-msg" *ngIf="password.touched && password.hasError('required')">La contraseña es obligatoria</span>
              <span class="error-msg" *ngIf="password.touched && password.hasError('minlength')">Debe tener al menos 6 caracteres</span>
            </div>

            <button type="submit" class="btn btn--primary btn--full" [disabled]="loading">
              <span *ngIf="!loading">Restablecer contraseña</span>
              <span *ngIf="loading" class="spinner"></span>
            </button>
          </form>

          <p class="auth-card__footer">
            <a routerLink="/auth/login">Volver al login</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  loading = false; 
  error = ''; 
  token = '';
  showPass = false;

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
    if (this.form.invalid || !this.token) { this.form.markAllAsTouched(); return; }
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