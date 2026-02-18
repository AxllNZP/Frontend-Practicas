// src/app/services/usuario-reporte.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UsuarioReporteDto {
  idUsuario: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: string;
  estado: string;
  totalFacturas: number;
  totalSubtotal: number;
  totalIgv: number;
  totalVendido: number;
}

@Injectable({ providedIn: 'root' })
export class UsuarioReporteService {

  private baseUrl = 'http://localhost:8080/api/reportes/usuarios';

  constructor(private http: HttpClient) {}

  obtenerReporte(usuarioId: number | undefined, inicio: string, fin: string)
    : Observable<UsuarioReporteDto[]> {

    let params = new HttpParams()
      .set('fechaInicio', inicio)
      .set('fechaFin', fin);

    if (usuarioId) {
      params = params.set('usuarioId', usuarioId);
    }

    return this.http.get<UsuarioReporteDto[]>(this.baseUrl, { params });
  }

  descargarPdf(usuarioId: number | undefined, inicio: string, fin: string) {

    let params = new HttpParams()
      .set('fechaInicio', inicio)
      .set('fechaFin', fin);

    if (usuarioId) {
      params = params.set('usuarioId', usuarioId);
    }

    return this.http.get(`${this.baseUrl}/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  descargarExcel(usuarioId: number | undefined, inicio: string, fin: string) {

    let params = new HttpParams()
      .set('fechaInicio', inicio)
      .set('fechaFin', fin);

    if (usuarioId) {
      params = params.set('usuarioId', usuarioId);
    }

    return this.http.get(`${this.baseUrl}/excel`, {
      params,
      responseType: 'blob'
    });
  }
}
