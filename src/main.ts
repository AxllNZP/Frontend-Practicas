// ===================================
// ARCHIVO CORREGIDO: main.ts
// Ubicación: src/main.ts
// ===================================

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * ✅ CORRECCIÓN APLICADA:
 * 
 * ANTES: bootstrapApplication(AppComponent, { providers: [...] })
 * AHORA: bootstrapApplication(AppComponent, appConfig)
 * 
 * IMPACTO:
 * - ✅ El interceptor authInterceptor ahora se registra correctamente
 * - ✅ Las peticiones HTTP incluyen el token JWT en el header Authorization
 * - ✅ El backend puede validar las peticiones autenticadas
 * 
 * NOTA: El archivo appConfig contiene:
 * - provideRouter(routes)
 * - provideHttpClient(withInterceptors([authInterceptor]))
 * - provideZoneChangeDetection({ eventCoalescing: true })
 */
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error('❌ Error al iniciar la aplicación:', err));