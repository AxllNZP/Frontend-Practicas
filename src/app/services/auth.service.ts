// ===================================
// SERVICIO DE AUTENTICACIÓN CORREGIDO
// Ubicación: src/app/services/auth.service.ts
// ===================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest, Usuario, RolUsuario } from '../models/auth.models';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private http = inject(HttpClient);
  
  private readonly API_URL = `${environment.apiUrl}/api/auth`;
  
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🔐 AuthService inicializado');
    console.log('📍 API URL:', this.API_URL);
    const user = this.getUserFromToken();
    if (user) {
      console.log('✅ Usuario encontrado en token:', {
        nombreUsuario: user.nombreUsuario,
        rol: user.rol,
        email: user.email
      });
    } else {
      console.log('ℹ️ No hay usuario en token');
    }
  }

  /**
   * ✅ LOGIN CORREGIDO
   */
  login(credentials: AuthRequest): Observable<AuthResponse> {
    console.log('🔑 Intentando login con:', credentials.nombreUsuario);
    console.log('📤 URL destino:', `${this.API_URL}/login`);
    console.log('📦 Payload:', JSON.stringify(credentials));
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Login exitoso, respuesta del backend:', response);
          
          if (!response.token) {
            console.error('❌ El backend no devolvió un token');
            throw new Error('No se recibió token del servidor');
          }
          
          this.saveToken(response.token);
          
          const user = this.getUserFromToken();
          if (user) {
            console.log('👤 Usuario decodificado del token:', {
              nombreUsuario: user.nombreUsuario,
              rol: user.rol,
              nombreCompleto: user.nombreCompleto,
              email: user.email
            });
            this.currentUserSubject.next(user);
          } else {
            console.error('❌ Error: Token válido pero no se pudo extraer usuario');
          }
        }),
        catchError(error => {
          console.error('❌ Error completo en login:', error);
          console.error('Status:', error.status);
          console.error('Status Text:', error.statusText);
          console.error('Error message:', error.error);
          console.error('URL intentada:', error.url);
          
          let errorMessage = 'Error desconocido al iniciar sesión';
          
          if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica:\n' +
                          '1. Que el backend esté corriendo en ${environment.apiUrl}\n' +
                          '2. Que CORS esté configurado correctamente\n' +
                          '3. Que no haya firewall bloqueando la conexión';
          } else if (error.status === 401) {
            errorMessage = 'Usuario o contraseña incorrectos';
          } else if (error.status === 404) {
            errorMessage = 'Endpoint no encontrado. Verifica la URL del backend';
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor';
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('📝 Registrando usuario:', {
      nombreUsuario: userData.nombreUsuario,
      rol: userData.rol,
      email: userData.email
    });
    console.log('📤 URL destino:', `SAPO`);
    console.log('📦 Payload completo:', JSON.stringify(userData));
    
    // ✅ VALIDACIÓN ANTES DE ENVIAR
    if (!userData.nombreUsuario || !userData.clave || !userData.nombreCompleto || !userData.rol) {
      console.error('❌ Datos incompletos:', userData);
      return throwError(() => new Error('Todos los campos son obligatorios'));
    }
    
    //https://backend-production-4f6d.up.railway.app/api/auth/register
    return this.http.post<AuthResponse>(`https://backend-production-4f6d.up.railway.app/api/auth/register`, userData)
      .pipe(
        tap(response => {
          console.log('✅ Registro exitoso, respuesta del backend:', response);
          
          if (!response.token) {
            console.error('❌ El backend no devolvió un token');
            throw new Error('No se recibió token del servidor');
          }
          
          this.saveToken(response.token);
          
          const user = this.getUserFromToken();
          if (user) {
            console.log('👤 Usuario registrado y decodificado:', user);
            this.currentUserSubject.next(user);
          }
        }),
        catchError(error => {
          console.error('❌ Error completo en registro:', error);
          console.error('Status:', error.status);
          console.error('Error message:', error.error);
          console.error('URL intentada:', error.url);
          
          let errorMessage = 'Error desconocido al registrar usuario';
          
          if (error.status === 0) {
            errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
          } else if (error.status === 409) {
            errorMessage = 'El nombre de usuario ya existe';
          } else if (error.status === 400) {
            errorMessage = 'Datos inválidos. Verifica todos los campos.';
          } else if (error.status === 404) {
            errorMessage = 'Endpoint no encontrado. Verifica la URL del backend';
          } else if (error.status === 500) {
            errorMessage = error.error?.message || 'Error interno del servidor';
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  logout(): void {
    console.log('👋 Cerrando sesión');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  private saveToken(token: string): void {
    localStorage.setItem('token', token);
    console.log('💾 Token guardado en localStorage');
    console.log('🔑 Token (primeros 50 caracteres):', token.substring(0, 50) + '...');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    const isExpired = this.isTokenExpired(token);
    if (isExpired) {
      console.log('⚠️ Token expirado, cerrando sesión automáticamente');
      this.logout();
      return false;
    }
    
    return true;
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * ✅ EXTRACCIÓN DE USUARIO DEL TOKEN MEJORADA
   */
  private getUserFromToken(): Usuario | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      console.log('🔍 JWT PAYLOAD DECODIFICADO:', payload);
      
      // El backend guarda el rol en minúsculas: "admin" o "vendedor"
      const rolDelToken = payload.rol || payload.role;
      
      if (!rolDelToken) {
        console.error('❌ ERROR: No se encontró el campo "rol" en el token JWT');
        console.error('Payload completo:', payload);
        return null;
      }

      // Normalizar el rol a minúsculas
      const rolNormalizado = rolDelToken.toLowerCase();
      console.log('🎭 Rol extraído del token:', {
        original: rolDelToken,
        normalizado: rolNormalizado
      });

      // Validar que el rol sea válido
      if (rolNormalizado !== 'admin' && rolNormalizado !== 'vendedor') {
        console.error('❌ ERROR: Rol inválido en token:', rolDelToken);
        return null;
      }

      const usuario: Usuario = {
        idUsuario: payload.idUsuario,
        nombreUsuario: payload.sub,
        nombreCompleto: payload.nombreCompleto || '',
        email: payload.email || '',
        rol: rolNormalizado as RolUsuario
      };

      console.log('✅ Usuario extraído correctamente del token:', usuario);
      return usuario;

    } catch (error) {
      console.error('❌ Error al decodificar token JWT:', error);
      return null;
    }
  }

  /**
   * Decodifica un token JWT
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      throw error;
    }
  }

  /**
   * Verifica si un token ha expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload.exp) {
        console.warn('⚠️ Token sin fecha de expiración');
        return true;
      }
      
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = expirationDate < now;
      
      if (isExpired) {
        console.log('⏰ Token expirado:', {
          expira: expirationDate.toLocaleString(),
          ahora: now.toLocaleString()
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('❌ Error al verificar expiración del token:', error);
      return true;
    }
  }

  /**
   * Comparación de roles mejorada
   */
  hasRole(rol: RolUsuario): boolean {
    const user = this.getCurrentUser();
    
    if (!user || !user.rol) {
      console.log('🔍 hasRole: Usuario sin rol');
      return false;
    }
    
    // Comparación case-insensitive
    const hasRole = user.rol.toLowerCase() === rol.toLowerCase();
    
    
    return hasRole;
  }

  isAdmin(): boolean {
    const result = this.hasRole(RolUsuario.ADMIN);
    console.log('👑 isAdmin():', result);
    return result;
  }

  isVendedor(): boolean {
    const result = this.hasRole(RolUsuario.VENDEDOR);
    console.log('💼 isVendedor():', result);
    return result;
  }
}