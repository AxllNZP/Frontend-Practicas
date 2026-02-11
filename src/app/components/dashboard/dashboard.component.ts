import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Usuario, RolUsuario } from '../../models/auth.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  currentUser: Usuario | null = null;
  private userSubscription?: Subscription;

  // 🔥 Exponer RolUsuario al template
  readonly RolUsuario = RolUsuario;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🏠 Dashboard inicializado');

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      console.log('👤 Usuario actual:', user);
      console.log('🎭 Rol actual:', user?.rol);
      console.log('👑 Es admin?:', this.isAdmin());
      console.log('💼 Es vendedor?:', this.isVendedor());
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

  isVendedor(): boolean {
    return this.authService.hasRole(RolUsuario.VENDEDOR);
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
    this.router.navigate(['/dashboard/profile']);


  }
}