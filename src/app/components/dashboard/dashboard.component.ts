// ===================================
// COMPONENTE DASHBOARD (STANDALONE)
// Ubicación: src/app/components/dashboard/dashboard.component.ts
// ===================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Usuario } from '../../models/auth.models';

/**
 * DashboardComponent - Componente principal protegido (LAYOUT)
 * 
 * Este componente actúa como layout principal y muestra
 * los componentes hijos a través del router-outlet
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,      // Para mostrar rutas hijas
    RouterLink,        // Para los enlaces de navegación
    RouterLinkActive   // Para marcar el enlace activo
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  currentUser: Usuario | null = null;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
    this.currentUser = user;

    console.log('Usuario actual:', user);
    console.log('Rol actual:', user?.rol);
    console.log('Es admin?:', this.isAdmin());
  });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  logout(): void {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getInitials(): string {
    if (!this.currentUser?.nombreCompleto) return '?';
    
    const names = this.currentUser.nombreCompleto.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.currentUser.nombreCompleto.substring(0, 2).toUpperCase();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}