// src/app/services/moneda.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  private apiUrl = 'http://localhost:8080/api/moneda';

  constructor(private http: HttpClient) {

    
  }

  listar(): Observable<MonedaDto[]> {
    return this.http.get<MonedaDto[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<MonedaDto> {
  return this.http.get<MonedaDto>(`${this.apiUrl}/id/${id}`);  // ← /id/
  }

  buscarPorCodigo(codigo: string): Observable<MonedaDto> {
  return this.http.get<MonedaDto>(`${this.apiUrl}/codigo/${codigo}`);  // ← /codigo/
  }

  crear(moneda: Partial<MonedaDto>): Observable<MonedaDto> {
    return this.http.post<MonedaDto>(this.apiUrl, moneda);
  }

  actualizar(id: number, moneda: Partial<MonedaDto>): Observable<MonedaDto> {
    return this.http.put<MonedaDto>(`${this.apiUrl}/${id}`, moneda);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}