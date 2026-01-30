// ===================================
// SERVICIO DE AUTENTICACIÓN
// Ubicación: src/app/services/auth.service.ts
// ===================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest, Usuario, RolUsuario } from '../models/auth.models';

/**
 * AuthService - Servicio centralizado para manejar autenticación
 * 
 * IMPORTANTE: Este servicio usa @Injectable({ providedIn: 'root' })
 * que lo hace disponible globalmente en toda la aplicación standalone
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // Inyección de dependencias moderna (Angular 14+)
  private http = inject(HttpClient);
  
  // URL base de tu backend - AJUSTA SEGÚN TU CONFIGURACIÓN
  private readonly API_URL = 'http://localhost:8080/api/auth';
  
  // BehaviorSubject para mantener el estado del usuario logueado
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromToken());
  
  // Observable público para que los componentes se suscriban
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('AuthService inicializado');
  }

  // ===================================
  // MÉTODOS PRINCIPALES DE AUTENTICACIÓN
  // ===================================

  /**
   * LOGIN - Autentica al usuario con el backend
   */
  login(credentials: AuthRequest): Observable<AuthResponse> {
    console.log('Intentando login con usuario:', credentials.nombreUsuario);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Login exitoso, guardando token');
          this.saveToken(response.token);
          this.currentUserSubject.next(this.getUserFromToken());
        })
      );
  }

  /**
   * REGISTER - Registra un nuevo usuario
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('Registrando nuevo usuario:', userData.nombreUsuario);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          console.log('Registro exitoso, guardando token');
          this.saveToken(response.token);
          this.currentUserSubject.next(this.getUserFromToken());
        })
      );
  }

  /**
   * LOGOUT - Cierra la sesión del usuario
   */
  logout(): void {
    console.log('Cerrando sesión');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  // ===================================
  // GESTIÓN DEL TOKEN JWT
  // ===================================

  private saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  // ===================================
  // DECODIFICACIÓN DEL TOKEN JWT
  // ===================================

  private getUserFromToken(): Usuario | null {
    const token = this.getToken();
    if (!token) return null;

    
    try {
      const payload = this.decodeToken(token);
      console.log('JWT PAYLOAD COMPLETO 👉', payload); // 👈 AÑADE ESTO
      
      const rolesEnPayload = payload.rol || payload.role || (payload.authorities && payload.authorities[0]);
      
      return {
        nombreUsuario: payload.sub,
        nombreCompleto: payload.nombreCompleto || '',
        email: payload.email || '',
        rol: rolesEnPayload ? rolesEnPayload.toLowerCase() : RolUsuario.VENDEDOR
      };
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

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
      console.error('Error al decodificar token:', error);
      throw error;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload.exp) return true;
      
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate < new Date();
    } catch (error) {
      return true;
    }
  }

  /**
   * Verifica si el usuario actual tiene un rol específico
   */
  hasRole(rol: RolUsuario): boolean {
    const user = this.getCurrentUser();
    return user?.rol === rol;
  }

  /**
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): boolean {
    return this.hasRole(RolUsuario.ADMIN);
  }
}