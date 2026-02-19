// ===================================
// ARCHIVO CORREGIDO: cliente.service.ts
// Ubicación: src/app/services/cliente.service.ts
// ===================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../environments/environment.prod';

export interface ClienteDto {
  idCliente: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombreRazonSocial: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: 'activo' | 'inactivo';
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/api/clientes`;

  constructor(private http: HttpClient) {
    console.log('📋 ClienteService inicializado');
  }

  /**
   * ✅ CORRECCIÓN: Manejo de errores añadido con retry
   */
  listar(): Observable<ClienteDto[]> {
    console.log('📋 ClienteService: Listando clientes...');
    
    return this.http.get<ClienteDto[]>(this.apiUrl).pipe(
      tap(clientes => console.log(`✅ ${clientes.length} clientes obtenidos`)),
      retry(2), // Reintentar 2 veces en caso de error de red
      catchError(this.handleError)
    );
  }

  buscarPorId(id: number): Observable<ClienteDto> {
    console.log(`📋 ClienteService: Buscando cliente ${id}...`);
    
    return this.http.get<ClienteDto>(`${this.apiUrl}/${id}`).pipe(
      tap(cliente => console.log(`✅ Cliente encontrado:`, cliente.nombreRazonSocial)),
      catchError(this.handleError)
    );
  }

  buscarPorDocumento(numeroDocumento: string): Observable<ClienteDto> {
    console.log(`📋 ClienteService: Buscando por documento ${numeroDocumento}...`);
    
    return this.http.get<ClienteDto>(`${this.apiUrl}/documento/${numeroDocumento}`).pipe(
      tap(cliente => console.log(`✅ Cliente encontrado:`, cliente.nombreRazonSocial)),
      catchError(this.handleError)
    );
  }

  buscarPorNombre(nombre: string): Observable<ClienteDto[]> {
    console.log(`📋 ClienteService: Buscando por nombre "${nombre}"...`);
    
    return this.http.get<ClienteDto[]>(`${this.apiUrl}/nombre/${nombre}`).pipe(
      tap(clientes => console.log(`✅ ${clientes.length} clientes encontrados`)),
      catchError(this.handleError)
    );
  }

  crear(cliente: Partial<ClienteDto>): Observable<ClienteDto> {
    console.log('📋 ClienteService: Creando cliente...', cliente.nombreRazonSocial);
    
    return this.http.post<ClienteDto>(this.apiUrl, cliente).pipe(
      tap(nuevoCliente => console.log(`✅ Cliente creado: ID ${nuevoCliente.idCliente}`)),
      catchError(this.handleError)
    );
  }

  actualizar(id: number, cliente: Partial<ClienteDto>): Observable<ClienteDto> {
    console.log(`📋 ClienteService: Actualizando cliente ${id}...`);
    
    return this.http.put<ClienteDto>(`${this.apiUrl}/${id}`, cliente).pipe(
      tap(() => console.log(`✅ Cliente ${id} actualizado`)),
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    console.log(`📋 ClienteService: Eliminando cliente ${id}...`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`✅ Cliente ${id} eliminado`)),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NUEVO: Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de red: ${error.error.message}`;
      console.error('❌ ClienteService - Error de red:', error.error.message);
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = 'Datos inválidos enviados al servidor';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Cliente no encontrado';
          break;
        case 409:
          errorMessage = 'El cliente ya existe (documento duplicado)';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.statusText}`;
      }
      
      console.error('❌ ClienteService - Error HTTP:', {
        status: error.status,
        mensaje: error.error?.message || error.message,
        url: error.url
      });
    }

    return throwError(() => new Error(errorMessage));
  }
}