import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

// Aplicar tema guardado antes de renderizar (evita flash)
const savedTheme = localStorage.getItem('unidos_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
