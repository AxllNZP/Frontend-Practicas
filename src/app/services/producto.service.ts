// ===================================
// ARCHIVO CORREGIDO: producto.service.ts
// Ubicación: src/app/services/producto.service.ts
// ===================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export type EstadoGeneral = 'activo' | 'inactivo';

export interface ProductoDto {
  idProducto: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  estado: EstadoGeneral;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = `${environment.apiUrl}/api/productos`;

  constructor(private http: HttpClient) {
    console.log('📦 ProductoService inicializado');
  }

  /**
   * ✅ CORRECCIÓN: Manejo de errores añadido
   */
  listar(): Observable<ProductoDto[]> {
    console.log('📦 ProductoService: Listando productos...');
    
    return this.http.get<ProductoDto[]>(this.apiUrl).pipe(
      tap(productos => console.log(`✅ ${productos.length} productos obtenidos`)),
      retry(2),
      catchError(this.handleError)
    );
  }

  crear(producto: Partial<ProductoDto>): Observable<ProductoDto> {
    console.log('📦 ProductoService: Creando producto...', producto.nombre);
    
    return this.http.post<ProductoDto>(this.apiUrl, producto).pipe(
      tap(nuevo => console.log(`✅ Producto creado: ID ${nuevo.idProducto}`)),
      catchError(this.handleError)
    );
  }

  actualizar(id: number, producto: Partial<ProductoDto>): Observable<ProductoDto> {
    console.log(`📦 ProductoService: Actualizando producto ${id}...`);
    
    return this.http.put<ProductoDto>(`${this.apiUrl}/${id}`, producto).pipe(
      tap(() => console.log(`✅ Producto ${id} actualizado`)),
      catchError(this.handleError)
    );
  }

  eliminar(id: number): Observable<void> {
    console.log(`📦 ProductoService: Eliminando producto ${id}...`);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log(`✅ Producto ${id} eliminado`)),
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
      console.error('❌ ProductoService - Error de red:', error.error.message);
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor';
          break;
        case 400:
          errorMessage = 'Datos del producto inválidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          break;
        case 403:
          errorMessage = 'Sin permisos para gestionar productos';
          break;
        case 404:
          errorMessage = 'Producto no encontrado';
          break;
        case 409:
          errorMessage = 'El código del producto ya existe';
          break;
        case 500:
          errorMessage = 'Error del servidor';
          break;
        default:
          errorMessage = `Error: ${error.status}`;
      }
      
      console.error('❌ ProductoService - Error HTTP:', {
        status: error.status,
        mensaje: error.error?.message || error.message
      });
    }

    return throwError(() => new Error(errorMessage));
  }
}