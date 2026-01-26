// src/app/services/archivo.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  // La URL de tu controlador en IntelliJ
  private apiUrl = 'http://localhost:8080/api/archivos';

  constructor(private http: HttpClient) { }

  subir(file: File): Observable<any> {
    const formData = new FormData();
    // "file" debe coincidir con @RequestParam("file") en tu Java
    formData.append('file', file); 
    return this.http.post(`${this.apiUrl}/subir`, formData);
  }
}