// ===================================
// INTERCEPTOR HTTP
// Ubicación: src/app/interceptors/auth.interceptor.ts
// ===================================

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * authInterceptor - Interceptor HTTP funcional
 * 
 * NOTA: En Angular standalone (15+) los interceptors son FUNCIONES, no clases
 * 
 * Este interceptor:
 * 1. Añade automáticamente el token JWT en el header Authorization
 * 2. Captura errores 401 (no autorizado) y redirige al login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Obtener el token
  const token = authService.getToken();
  
  // Verificar si es una petición de autenticación
  const isAuthEndpoint = req.url.includes('/api/auth/login') || 
                        req.url.includes('/api/auth/register');

  // Clonar y modificar la petición si hay token y no es endpoint de auth
  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Token añadido a la petición:', authReq.url);
  }

  // Manejar la petición y capturar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Error 401: Token inválido o expirado
      if (error.status === 401 && !isAuthEndpoint) {
        console.error('Token inválido o expirado. Redirigiendo a login...');
        authService.logout();
        router.navigate(['/login']);
      }

      // Error 403: Sin permisos
      if (error.status === 403) {
        console.error('Acceso denegado. No tienes permisos suficientes.');
      }

      return throwError(() => error);
    })
  );
};