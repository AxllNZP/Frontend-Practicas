// ===================================
// CONFIGURACIÓN DE LA APLICACIÓN
// Ubicación: src/app/app.config.ts
// ===================================

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

/**
 * CONFIGURACIÓN PRINCIPAL DE LA APLICACIÓN STANDALONE
 * 
 * Este archivo reemplaza lo que antes era app.module.ts
 * Aquí configuramos todos los providers (servicios, interceptors, etc.)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Optimización de detección de cambios
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Configuración del router con las rutas
    provideRouter(routes),
    
    /**
     * CONFIGURACIÓN HTTP CLIENT CON INTERCEPTOR
     * 
     * provideHttpClient: Habilita HttpClient en toda la app
     * withInterceptors: Registra interceptors funcionales
     * 
     * El interceptor authInterceptor añadirá automáticamente
     * el token JWT a todas las peticiones HTTP
     */
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};

/**
 * NOTAS IMPORTANTES:
 * 
 * 1. Los servicios con @Injectable({ providedIn: 'root' })
 *    NO necesitan declararse aquí (ej: AuthService)
 * 
 * 2. Los guards funcionales tampoco necesitan declararse,
 *    solo se usan directamente en las rutas
 * 
 * 3. withInterceptors() acepta un array, puedes añadir más:
 *    withInterceptors([authInterceptor, loggingInterceptor])
 * 
 * 4. Este archivo se importa en main.ts al arrancar la app
 */