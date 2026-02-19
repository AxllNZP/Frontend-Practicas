// ===================================
// ARCHIVO CORREGIDO: usuario.service.ts
// Ubicación: src/app/services/usuario.service.ts
// ===================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export type RolUsuario = 'admin' | 'vendedor' | 'contador';
export type EstadoGeneral = 'activo' | 'inactivo';

export interface UsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  clave: string;
  nombreCompleto: string;
  email?: string;
  rol: RolUsuario;
  estado: EstadoGeneral;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {
    console.log('👤 UsuarioService inicializado');
  }

  /**
   * ✅ CORRECCIÓN: Manejo de errores añadido
   */
  listar(): Observable<UsuarioDto[]> {
    console.log('👤 UsuarioService: Listando usuarios...');
    
    return this.http.get<UsuarioDto[]>(this.apiUrl).pipe(
      tap(usuarios => console.log(`✅ ${usuarios.length} usuarios obtenidos`)),
      retry(2),
      catchError(this.handleError)
    );
  }

  buscarPorId(id: number): Observable<UsuarioDto> {
    console.log(`👤 UsuarioService: Buscando usuario ${id}...`);
    
    return this.http.get<UsuarioDto>(`${this.apiUrl}/${id}`).pipe(
      tap(usuario => console.log(`✅ Usuario encontrado:`, usuario.nombreUsuario)),
      catchError(this.handleError)
    );
  }

  crear(usuario: Partial<UsuarioDto>): Observable<UsuarioDto> {
    console.log('👤 UsuarioService: Creando usuario...', usuario.nombreUsuario);
    
    return this.http.post<UsuarioDto>(this.apiUrl, usuario).pipe(
      tap(nuevo => console.log(`✅ Usuario creado: ID ${nuevo.idUsuario}`)),
      catchError(this.handleError)
    );
  }

  actualizar(id: number, usuario: Partial<UsuarioDto>): Observable<UsuarioDto> {
    console.log(`👤 UsuarioService: Actualizando usuario ${id}...`);
    
    return this.http.put<UsuarioDto>(`${this.apiUrl}/${id}`, usuario).pipe(
      tap(() => console.log(`✅ Usuario ${id} actualizado`)),
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    console.log(`👤 UsuarioService: Eliminando usuario ${id}...`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`✅ Usuario ${id} eliminado`)),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NUEVO: Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de red: ${error.error.message}`;
      console.error('❌ UsuarioService - Error de red:', error.error.message);
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
        case 400:
          errorMessage = 'Datos del usuario inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'Solo administradores pueden gestionar usuarios';
          break;
        case 404:
          errorMessage = 'Usuario no encontrado';
          break;
        case 409:
          errorMessage = 'El nombre de usuario ya existe';
          break;
        case 500:
          errorMessage = 'Error del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
      
      console.error('❌ UsuarioService - Error HTTP:', {
        status: error.status,
        mensaje: error.error?.message || error.message
      });
    }

    return throwError(() => new Error(errorMessage));
  }
}