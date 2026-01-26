// src/app/services/archivo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ArchivoDto {
  id: number;
  nombre: string;
  tipo: string;
  tamanio: number;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private apiUrl = 'http://localhost:8080/api/archivos';

  constructor(private http: HttpClient) { }

  subir(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/subir`, formData);
  }

  listar(): Observable<ArchivoDto[]> {
    return this.http.get<ArchivoDto[]>(this.apiUrl);
  }

  descargar(id: number): Observable<Blob> {
    // El backend expone GET /{id} que devuelve bytes y tipo correcto.
    return this.http.get(`${this.apiUrl}/${id}`, { responseType: 'blob' });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}