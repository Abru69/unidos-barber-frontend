import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { of, throwError, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string; nombre: string; email: string;
  telefono?: string; fotoUrl?: string; rol: 'CLIENTE' | 'BARBERO';
}

const USE_MOCK = false;
const MOCK_USERS: (User & { password: string })[] = [
  { id: '1', nombre: 'Admin Unidos', email: 'admin@unidos.com', password: 'Password123!', rol: 'BARBERO' },
  { id: '2', nombre: 'Juan Cliente', email: 'cliente@test.com', password: 'Password123!', rol: 'CLIENTE' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'unidos_token';
  private readonly USER_KEY  = 'unidos_user';
  currentUser = signal<User | null>(this.getStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { nombre: string; email: string; password: string; telefono?: string }) {
    if (USE_MOCK) {
      const exists = MOCK_USERS.find(u => u.email === data.email);
      if (exists) return throwError(() => ({ error: { message: 'El email ya está registrado' } }));
      const newUser: User = { id: Date.now().toString(), nombre: data.nombre, email: data.email, telefono: data.telefono, rol: 'CLIENTE' };
      MOCK_USERS.push({ ...newUser, password: data.password });
      const session = { user: newUser, token: 'mock-token-' + newUser.id };
      this.storeSession(session);
      return of({ data: session }).pipe(delay(600));
    }
    return this.http.post<{ data: { user: User; token: string } }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap(res => this.storeSession(res.data)));
  }

  login(email: string, password: string) {
    if (USE_MOCK) {
      const found = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (!found) return throwError(() => ({ error: { message: 'Credenciales inválidas' } })).pipe(delay(600));
      const { password: _, ...user } = found;
      const session = { user, token: 'mock-token-' + user.id };
      this.storeSession(session);
      return of({ data: session }).pipe(delay(600));
    }
    return this.http.post<{ data: { user: User; token: string } }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.storeSession(res.data)));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }
  isLoggedIn(): boolean { return !!this.getToken(); }
  isAdmin(): boolean { return this.currentUser()?.rol === 'BARBERO'; }

  private storeSession(session: { user: User; token: string }) {
    localStorage.setItem(this.TOKEN_KEY, session.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(session.user));
    this.currentUser.set(session.user);
  }
  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
