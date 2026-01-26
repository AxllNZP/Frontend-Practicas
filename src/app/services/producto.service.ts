// src/app/services/producto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductoDto {
  idProducto: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient) { }

  listar(): Observable<ProductoDto[]> {
    return this.http.get<ProductoDto[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<ProductoDto> {
    return this.http.get<ProductoDto>(`${this.apiUrl}/${id}`);
  }

  crear(producto: Partial<ProductoDto>): Observable<ProductoDto> {
    return this.http.post<ProductoDto>(this.apiUrl, producto);
  }

  actualizar(id: number, producto: Partial<ProductoDto>): Observable<ProductoDto> {
    return this.http.put<ProductoDto>(`${this.apiUrl}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<ProductoDto> {
    return this.http.get<ProductoDto>(`${this.apiUrl}/nombre/${nombre}`);
  }

  buscarPorPrecioMenor(precio: number): Observable<ProductoDto[]> {
    return this.http.get<ProductoDto[]>(`${this.apiUrl}/precio-menor/${precio}`);
  }
}