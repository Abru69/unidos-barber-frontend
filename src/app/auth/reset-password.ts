import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './login.scss',
})
export class ResetPassword implements OnInit {
  form: FormGroup;
  loading = false; error = ''; token = ''; showPass = false; success = false;

  constructor(
    private fb: FormBuilder, private auth: AuthService,
    private router: Router, private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({ password: ['', [Validators.required, Validators.minLength(8)]] });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] ?? '';
      if (!this.token) this.error = 'Enlace inválido o expirado.';
    });
  }

  get password() { return this.form.get('password')!; }

  submit() {
    if (this.form.invalid || !this.token) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    this.auth.resetPassword(this.token, this.password.value).subscribe({
      next: () => { this.loading = false; this.success = true; setTimeout(() => this.router.navigate(['/auth/login']), 2500); },
      error: (e) => { this.error = e.error?.message || 'Token inválido o expirado'; this.loading = false; },
    });
  }
}
