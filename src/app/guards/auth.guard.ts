// ===================================
// ARCHIVO CORREGIDO: auth.guard.ts
// Ubicación: src/app/guards/auth.guard.ts
// ===================================

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.models';

/**
 * authGuard - Verifica si el usuario está autenticado
 * 
 * ✅ CORRECCIONES APLICADAS:
 * - Mejor logging para debugging
 * - Manejo más robusto de redirecciones
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 authGuard: Verificando autenticación para:', state.url);

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    console.log('✅ authGuard: Usuario autenticado:', {
      usuario: user?.nombreUsuario,
      rol: user?.rol,
      destino: state.url
    });
    return true;
  }

  console.log('❌ authGuard: Usuario NO autenticado, redirigiendo a login');
  localStorage.setItem('redirectUrl', state.url);
  
  return router.createUrlTree(['/login']);
};

/**
 * adminGuard - Verifica que el usuario sea ADMIN
 * 
 * ✅ CORRECCIONES APLICADAS:
 * - Comparación de roles más robusta
 * - Mejor debugging con logs detallados
 * - Manejo de casos edge (rol en mayúsculas/minúsculas)
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('👑 adminGuard: Verificando acceso de admin a:', state.url);

  // 1. Verificar autenticación primero
  if (!authService.isAuthenticated()) {
    console.log('❌ adminGuard: No autenticado, redirigiendo a login');
    return router.createUrlTree(['/login']);
  }

  // 2. Obtener usuario actual
  const user = authService.getCurrentUser();
  console.log('👤 adminGuard: Usuario actual:', {
    nombreUsuario: user?.nombreUsuario,
    rol: user?.rol,
    rolTipo: typeof user?.rol,
    rolEsperado: RolUsuario.ADMIN
  });

  // 3. Verificar rol con comparación case-insensitive
  const esAdmin = user?.rol === RolUsuario.ADMIN || 
                  user?.rol?.toLowerCase() === 'admin';

  if (esAdmin) {
    console.log('✅ adminGuard: Usuario es ADMIN, acceso permitido');
    return true;
  }

  // 4. Acceso denegado
  console.log('❌ adminGuard: Usuario NO es ADMIN, acceso denegado', {
    rolActual: user?.rol,
    rolRequerido: RolUsuario.ADMIN
  });
  
  alert('⛔ Acceso denegado\n\nSolo los administradores pueden acceder a esta sección.');
  
  return router.createUrlTree(['/dashboard/facturas']);
};

/**
 * vendedorGuard - Verifica que el usuario sea VENDEDOR o ADMIN
 * 
 * ✅ CORRECCIONES APLICADAS:
 * - Comparación de roles mejorada
 * - Permite tanto vendedor como admin
 */
export const vendedorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('💼 vendedorGuard: Verificando acceso de vendedor a:', state.url);

  if (!authService.isAuthenticated()) {
    console.log('❌ vendedorGuard: No autenticado');
    return router.createUrlTree(['/login']);
  }

  const user = authService.getCurrentUser();
  const rolNormalizado = user?.rol?.toLowerCase();
  
  const esVendedorOAdmin = rolNormalizado === 'vendedor' || rolNormalizado === 'admin';

  if (esVendedorOAdmin) {
    console.log('✅ vendedorGuard: Usuario autorizado (vendedor o admin)');
    return true;
  }

  console.log('❌ vendedorGuard: Usuario no autorizado');
  return router.createUrlTree(['/dashboard']);
};