// ===================================
// GUARD DE AUTENTICACIÓN
// Ubicación: src/app/guards/auth.guard.ts
// ===================================

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * authGuard - Guard funcional para proteger rutas
 * 
 * NOTA: En Angular standalone (14+) los guards son FUNCIONES, no clases
 * Este guard verifica si el usuario está autenticado antes de permitir acceso
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('✅ Usuario autenticado, acceso permitido a:', state.url);
    return true;
  }

  console.log('❌ Usuario no autenticado, redirigiendo a login desde:', state.url);
  
  // Guardar la URL a la que intentaba acceder
  localStorage.setItem('redirectUrl', state.url);
  
  // Redirigir al login
  return router.createUrlTree(['/login']);
};

/**
 * adminGuard - Guard funcional para rutas de administrador
 * 
 * Verifica que el usuario esté autenticado Y tenga rol de admin
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    console.log('❌ No autenticado, redirigiendo a login');
    return router.createUrlTree(['/login']);
  }

  if (authService.isAdmin()) {
    console.log('✅ Usuario es admin, acceso permitido');
    return true;
  }

  console.log('❌ Usuario no es admin, acceso denegado');
  return router.createUrlTree(['/dashboard']); // O una página de acceso denegado
};