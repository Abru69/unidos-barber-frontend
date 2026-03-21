import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar';
import { Footer } from './shared/components/footer';
import { BottomNav } from './shared/components/bottom-nav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, BottomNav],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-bottom-nav />
    <app-footer />
  `,
  styles: [`
    .main-content {
      padding-top: 80px;
      min-height: calc(100vh - 80px);
    }
  `]
})
export class AppComponent {}
