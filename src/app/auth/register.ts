import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const val = control.value || '';
  return /[A-Z]/.test(val) && /[0-9]/.test(val) && val.length >= 8 ? null : { weak: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  form: FormGroup;
  loading = false; error = ''; showPass = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre:   ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      telefono: [''],
      password: ['', [Validators.required, passwordStrength]],
    });
  }

  get nombre()   { return this.form.get('nombre')!; }
  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  get passStrength(): number {
    const val = this.password.value || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    const { nombre, email, password, telefono } = this.form.value;
    this.auth.register({ nombre, email, password, telefono: telefono || undefined }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => { this.error = e.error?.message || 'Error al registrarse'; this.loading = false; },
    });
  }
}
