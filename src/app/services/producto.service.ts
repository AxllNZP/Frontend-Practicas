import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


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

  private apiUrl = 'http://localhost:8080/api/productos';

  constructor(private http: HttpClient) {}

  listar(): Observable<ProductoDto[]> {
    return this.http.get<ProductoDto[]>(this.apiUrl);
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
}