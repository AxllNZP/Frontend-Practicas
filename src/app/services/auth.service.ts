// ===================================
// ARCHIVO CORREGIDO: auth.service.ts
// Ubicación: src/app/services/auth.service.ts
// ===================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest, Usuario, RolUsuario } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/auth';
  
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🔐 AuthService inicializado');
    const user = this.getUserFromToken();
    if (user) {
      console.log('✅ Usuario encontrado en token:', {
        nombreUsuario: user.nombreUsuario,
        rol: user.rol,
        email: user.email
      });
    } else {
      console.log('ℹ️ No hay usuario en token (primera vez o sesión expirada)');
    }
  }

  /**
   * ✅ CORRECCIÓN: Mejor manejo de errores en login
   */
  login(credentials: AuthRequest): Observable<AuthResponse> {
    console.log('🔑 Intentando login:', credentials.nombreUsuario);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Login exitoso, procesando token...');
          this.saveToken(response.token);
          
          const user = this.getUserFromToken();
          if (user) {
            console.log('👤 Usuario decodificado:', {
              nombreUsuario: user.nombreUsuario,
              rol: user.rol,
              nombreCompleto: user.nombreCompleto
            });
            this.currentUserSubject.next(user);
          } else {
            console.error('❌ Error: Token válido pero no se pudo extraer usuario');
          }
        }),
        catchError(error => {
          console.error('❌ Error en login:', {
            status: error.status,
            mensaje: error.error?.message || error.message
          });
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ CORRECCIÓN: Mejor manejo de errores en registro
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('📝 Registrando usuario:', {
      nombreUsuario: userData.nombreUsuario,
      rol: userData.rol
    });
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          console.log('✅ Registro exitoso');
          this.saveToken(response.token);
          
          const user = this.getUserFromToken();
          if (user) {
            this.currentUserSubject.next(user);
          }
        }),
        catchError(error => {
          console.error('❌ Error en registro:', {
            status: error.status,
            mensaje: error.error?.message || error.message
          });
          return throwError(() => error);
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
   * ✅ CORRECCIÓN: Validación robusta de roles al extraer del token
   */
  private getUserFromToken(): Usuario | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      console.log('🔍 JWT PAYLOAD DECODIFICADO:', {
        sub: payload.sub,
        rol: payload.rol,
        nombreCompleto: payload.nombreCompleto,
        email: payload.email,
        exp: new Date(payload.exp * 1000).toLocaleString()
      });
      
      // Extraer rol del token (puede venir como 'rol' o 'role')
      const rolDelToken = payload.rol || payload.role;
      
      if (!rolDelToken) {
        console.error('❌ ERROR CRÍTICO: No se encontró el campo "rol" en el token JWT');
        console.error('Payload completo:', payload);
        return null;
      }

      // Normalizar el rol a minúsculas
      const rolNormalizado = rolDelToken.toLowerCase();
      console.log('🎭 Rol extraído del token:', {
        original: rolDelToken,
        normalizado: rolNormalizado
      });

      // ✅ VALIDAR que el rol sea válido
      if (rolNormalizado !== 'admin' && rolNormalizado !== 'vendedor') {
        console.error('❌ ERROR: Rol inválido en token:', rolDelToken);
        console.error('Roles válidos: "admin", "vendedor"');
        return null;
      }

      const usuario: Usuario = {
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
   * ✅ CORRECCIÓN: Comparación de roles mejorada
   */
  hasRole(rol: RolUsuario): boolean {
    const user = this.getCurrentUser();
    
    if (!user || !user.rol) {
      console.log('🔍 hasRole: Usuario sin rol');
      return false;
    }
    
    // Comparación case-insensitive
    const hasRole = user.rol.toLowerCase() === rol.toLowerCase();
    
    console.log(`🔍 Verificando rol "${rol}":`, {
      usuarioActual: user.nombreUsuario,
      rolActual: user.rol,
      rolBuscado: rol,
      tieneRol: hasRole
    });
    
    return hasRole;
  }

  /**
   * Verifica si el usuario actual es ADMIN
   */
  isAdmin(): boolean {
    const result = this.hasRole(RolUsuario.ADMIN);
    console.log('👑 isAdmin():', result);
    return result;
  }

  /**
   * Verifica si el usuario actual es VENDEDOR
   */
  isVendedor(): boolean {
    const result = this.hasRole(RolUsuario.VENDEDOR);
    console.log('💼 isVendedor():', result);
    return result;
  }
}