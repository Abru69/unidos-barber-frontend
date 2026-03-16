import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home').then(m => m.Home) },
  { path: 'services', loadComponent: () => import('./features/services').then(m => m.Services) },
  { path: 'gallery', loadComponent: () => import('./features/gallery').then(m => m.Gallery) },
  { path: 'auth', children: [
    { path: 'login', loadComponent: () => import('./auth/login').then(m => m.Login) },
    { path: 'register', loadComponent: () => import('./auth/register').then(m => m.Register) },
    { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password').then(m => m.ForgotPassword) },
    { path: 'reset-password', loadComponent: () => import('./auth/reset-password').then(m => m.ResetPassword) },
  ]},
  { path: 'appointments', canActivate: [authGuard], children: [
    { path: '', loadComponent: () => import('./features/appointments/my-appointments').then(m => m.MyAppointments) },
    { path: 'book', loadComponent: () => import('./features/appointments/book-appointment').then(m => m.BookAppointment) },
    { path: ':id', loadComponent: () => import('./features/appointments/appointment-detail').then(m => m.AppointmentDetail) },
  ]},
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile').then(m => m.Profile) },
  { path: 'admin', canActivate: [authGuard, adminGuard], children: [
    { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard').then(m => m.Dashboard) },
    { path: 'appointments', loadComponent: () => import('./features/admin/manage-appointments').then(m => m.ManageAppointments) },
    { path: 'services', loadComponent: () => import('./features/admin/manage-services').then(m => m.ManageServices) },
    { path: 'gallery', loadComponent: () => import('./features/admin/manage-gallery').then(m => m.ManageGallery) },
    { path: 'hours', loadComponent: () => import('./features/admin/manage-hours').then(m => m.ManageHours) },
  ]},
  { path: '**', redirectTo: '' },
];
