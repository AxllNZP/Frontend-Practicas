// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.models';

/**
 * Guard para verificar roles específicos
 * Uso: canActivate: [roleGuard([RolUsuario.ADMIN])]
 */
export const roleGuard = (allowedRoles: RolUsuario[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      console.log('❌ No autenticado');
      return router.createUrlTree(['/login']);
    }

    const currentUser = authService.getCurrentUser();
    const userRole = currentUser?.rol;

    if (userRole && allowedRoles.map(r => r.toString()).includes(userRole.toString())) {
      console.log('✅ Rol permitido:', userRole);
      return true;
    }

    console.log('❌ Rol no permitido:', userRole, 'Roles requeridos:', allowedRoles);
    alert('No tienes permisos para acceder a esta sección');
    return router.createUrlTree(['/dashboard']);
  };
};