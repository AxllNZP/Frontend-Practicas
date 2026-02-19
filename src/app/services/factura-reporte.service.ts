import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FacturaReporteDto {
  idFactura: number;
  fechaEmision: string;
  numeroFactura: string;
  total: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaReporteService {

  private apiUrl = '${environment.apiUrl}/api/facturas/cliente';

  constructor(private http: HttpClient) {}

  obtenerReporte(
    idCliente: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<FacturaReporteDto[]> {

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<FacturaReporteDto[]>(
      `${this.apiUrl}/${idCliente}/reporte`,
      { params }
    );
  }

  descargarPdf(
    idCliente: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<Blob> {

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get(
      `${this.apiUrl}/${idCliente}/reporte/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  descargarExcel(
    idCliente: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<Blob> {

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get(
      `${this.apiUrl}/${idCliente}/reporte/excel`,
      {
        params,
        responseType: 'blob'
      }
    );
  }
}
