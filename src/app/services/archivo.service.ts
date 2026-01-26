// src/app/services/archivo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private apiUrl = 'http://localhost:8080/api/archivos';

  constructor(private http: HttpClient) { }

  // Usamos FormData para enviar el archivo al @RequestParam del Backend
  subir(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/subir`, formData);
  }// POST a http://localhost:8080/api/archivos/subir

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
    ResponseType: 'blob'
  }// GET a http://localhost:8080/api/archivos

  
}