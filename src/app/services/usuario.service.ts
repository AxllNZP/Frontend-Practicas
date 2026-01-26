// src/app/services/usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  clave: string;
  nombreCompleto: string;
  email: string;
  rol: 'ADMIN' | 'USUARIO' | 'VENDEDOR';
  estado: 'ACTIVO' | 'INACTIVO';
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) { }

  listar(): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(`${this.apiUrl}/${id}`);
  }

  crear(usuario: Partial<UsuarioDto>): Observable<UsuarioDto> {
    return this.http.post<UsuarioDto>(this.apiUrl, usuario);
  }

  actualizar(id: number, usuario: Partial<UsuarioDto>): Observable<UsuarioDto> {
    return this.http.put<UsuarioDto>(`${this.apiUrl}/${id}`, usuario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarPorEstado(estado: string): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/estado/${estado}`);
  }

  buscarPorRol(rol: string): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(`${this.apiUrl}/rol/${rol}`);
  }

  buscarPorNombreUsuario(nombreUsuario: string): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(`${this.apiUrl}/username/${nombreUsuario}`);
  }
}