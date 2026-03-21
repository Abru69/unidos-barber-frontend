import { Component, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  scrolled  = signal(false);
  menuOpen  = signal(false);
  user      = computed(() => this.auth.currentUser());
  isAdmin   = computed(() => this.auth.isAdmin());
  isDark    = computed(() => this.theme.theme() === 'dark');

  constructor(public auth: AuthService, public theme: ThemeService) {}

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 40); }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu()  { this.menuOpen.set(false); }
  logout()     { this.auth.logout(); this.closeMenu(); }
}
