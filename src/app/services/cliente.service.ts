// src/app/services/cliente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) { }

  listar(): Observable<ClienteDto[]> {
    return this.http.get<ClienteDto[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/${id}`);
  }

  buscarPorDocumento(numeroDocumento: string): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/documento/${numeroDocumento}`);
  }

  buscarPorNombre(nombre: string): Observable<ClienteDto[]> {
    return this.http.get<ClienteDto[]>(`${this.apiUrl}/nombre/${nombre}`);
  }

  crear(cliente: Partial<ClienteDto>): Observable<ClienteDto> {
    return this.http.post<ClienteDto>(this.apiUrl, cliente);
  }

  actualizar(id: number, cliente: Partial<ClienteDto>): Observable<ClienteDto> {
    return this.http.put<ClienteDto>(`${this.apiUrl}/${id}`, cliente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}