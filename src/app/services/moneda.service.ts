// ===================================
// ARCHIVO CORREGIDO: moneda.service.ts
// Ubicación: src/app/services/moneda.service.ts
// ===================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../environments/environment.prod';
export interface MonedaDto {
  idMoneda: number;
  nombre: string;
  simbolo: string;
  codigo: string;
}

@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  private apiUrl = `${environment.apiUrl}/api/moneda`;

  constructor(private http: HttpClient) {
    console.log('💱 MonedaService inicializado');
  }

  /**
   * ✅ CORRECCIÓN: Manejo de errores añadido
   */
  listar(): Observable<MonedaDto[]> {
    console.log('💱 MonedaService: Listando monedas...');
    
    return this.http.get<MonedaDto[]>(this.apiUrl).pipe(
      tap(monedas => console.log(`✅ ${monedas.length} monedas obtenidas`)),
      retry(2),
      catchError(this.handleError)
    );
  }

  buscarPorId(id: number): Observable<MonedaDto> {
    console.log(`💱 MonedaService: Buscando moneda ${id}...`);
    
    return this.http.get<MonedaDto>(`${this.apiUrl}/id/${id}`).pipe(
      tap(moneda => console.log(`✅ Moneda encontrada:`, moneda.nombre)),
      catchError(this.handleError)
    );
  }

  buscarPorCodigo(codigo: string): Observable<MonedaDto> {
    console.log(`💱 MonedaService: Buscando moneda ${codigo}...`);
    
    return this.http.get<MonedaDto>(`${this.apiUrl}/codigo/${codigo}`).pipe(
      tap(moneda => console.log(`✅ Moneda encontrada:`, moneda.nombre)),
      catchError(this.handleError)
    );
  }

  crear(moneda: Partial<MonedaDto>): Observable<MonedaDto> {
    console.log('💱 MonedaService: Creando moneda...', moneda.nombre);
    
    return this.http.post<MonedaDto>(this.apiUrl, moneda).pipe(
      tap(nueva => console.log(`✅ Moneda creada: ${nueva.codigo}`)),
      catchError(this.handleError)
    );
  }

  actualizar(id: number, moneda: Partial<MonedaDto>): Observable<MonedaDto> {
    console.log(`💱 MonedaService: Actualizando moneda ${id}...`);
    
    return this.http.put<MonedaDto>(`${this.apiUrl}/${id}`, moneda).pipe(
      tap(() => console.log(`✅ Moneda ${id} actualizada`)),
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    console.log(`💱 MonedaService: Eliminando moneda ${id}...`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`✅ Moneda ${id} eliminada`)),
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
      console.error('❌ MonedaService - Error de red:', error.error.message);
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
        case 400:
          errorMessage = 'Datos de la moneda inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'Solo administradores pueden gestionar monedas';
          break;
        case 404:
          errorMessage = 'Moneda no encontrada';
          break;
        case 409:
          errorMessage = 'El código de moneda ya existe';
          break;
        case 500:
          errorMessage = 'Error del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
      
      console.error('❌ MonedaService - Error HTTP:', {
        status: error.status,
        mensaje: error.error?.message || error.message
      });
    }

    return throwError(() => new Error(errorMessage));
  }
}