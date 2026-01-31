// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * ✅ BOOTSTRAP CORRECTO
 * Usa appConfig que ya tiene configurado:
 * - HttpClient con interceptor
 * - Router
 * - Zone change detection
 */
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));