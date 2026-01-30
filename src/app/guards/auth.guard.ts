import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.models';

/**
 * authGuard - Verifica si el usuario está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    console.log('✅ Usuario autenticado, acceso permitido a:', state.url);
    return true;
  }

  console.log('❌ Usuario no autenticado, redirigiendo a login desde:', state.url);
  localStorage.setItem('redirectUrl', state.url);
  
  return router.createUrlTree(['/login']);
};

/**
 * adminGuard - Verifica que el usuario sea ADMIN
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 Verificando acceso de admin a:', state.url);

  if (!authService.isAuthenticated()) {
    console.log('❌ No autenticado, redirigiendo a login');
    return router.createUrlTree(['/login']);
  }

  const user = authService.getCurrentUser();
  console.log('👤 Usuario actual:', user);
  console.log('🎭 Rol del usuario:', user?.rol);

  if (authService.isAdmin()) {
    console.log('✅ Usuario es ADMIN, acceso permitido');
    return true;
  }

  console.log('❌ Usuario NO es ADMIN (rol:', user?.rol, '), acceso denegado');
  alert('⛔ Acceso denegado. Solo los administradores pueden acceder a esta sección.');
  
  return router.createUrlTree(['/dashboard/facturas']);
};

/**
 * vendedorGuard - Verifica que el usuario sea VENDEDOR o ADMIN
 */
export const vendedorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const user = authService.getCurrentUser();
  
  if (user?.rol === RolUsuario.VENDEDOR || user?.rol === RolUsuario.ADMIN) {
    console.log('✅ Usuario autorizado (vendedor o admin)');
    return true;
  }

  console.log('❌ Usuario no autorizado');
  return router.createUrlTree(['/dashboard']);
};