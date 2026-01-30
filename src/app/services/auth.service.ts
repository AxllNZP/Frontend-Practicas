// ===================================
// SERVICIO DE AUTENTICACIÓN - VERSIÓN CORREGIDA
// Ubicación: src/app/services/auth.service.ts
// ===================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
      console.log('✅ Usuario encontrado en token:', user);
      console.log('👤 Rol del usuario:', user.rol);
    }
  }

  login(credentials: AuthRequest): Observable<AuthResponse> {
    console.log('🔑 Intentando login:', credentials.nombreUsuario);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Login exitoso, token recibido');
          this.saveToken(response.token);
          
          const user = this.getUserFromToken();
          console.log('👤 Usuario decodificado:', user);
          console.log('🎭 Rol asignado:', user?.rol);
          
          this.currentUserSubject.next(user);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('📝 Registrando usuario:', userData.nombreUsuario);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          console.log('✅ Registro exitoso');
          this.saveToken(response.token);
          this.currentUserSubject.next(this.getUserFromToken());
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

  private getUserFromToken(): Usuario | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      console.log('🔍 JWT PAYLOAD COMPLETO:', payload);
      
      // 🔥 LEER EL ROL DEL TOKEN
      const rolDelToken = payload.rol || payload.role;
      
      if (!rolDelToken) {
        console.error('❌ ERROR: No se encontró el rol en el token');
        return null;
      }

      const usuario: Usuario = {
        nombreUsuario: payload.sub,
        nombreCompleto: payload.nombreCompleto || '',
        email: payload.email || '',
        rol: rolDelToken.toLowerCase() as RolUsuario
      };

      console.log('✅ Usuario extraído del token:', usuario);
      return usuario;

    } catch (error) {
      console.error('❌ Error decodificando token:', error);
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

  hasRole(rol: RolUsuario): boolean {
    const user = this.getCurrentUser();
    const hasRole = user?.rol === rol;
    
    console.log(`🔍 Verificando rol "${rol}":`, {
      usuarioActual: user?.nombreUsuario,
      rolActual: user?.rol,
      tieneRol: hasRole
    });
    
    return hasRole;
  }

  isAdmin(): boolean {
    return this.hasRole(RolUsuario.ADMIN);
  }
}