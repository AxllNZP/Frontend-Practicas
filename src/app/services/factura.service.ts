// src/app/services/factura.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// ===== INTERFACES (coinciden con tu backend) =====

export interface DetalleFacturaDTO {
  idProducto: number;
  nombreProducto?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

export interface PagoDTO {
  idPago?: number;
  monto: number;
  fechaPago?: string;
  numeroOperacion?: string;
  idFormaPago: number;
  nombreFormaPago?: string;
  idMoneda: number;
  codigoMoneda?: string;
  idUsuario: number;
  nombreUsuario?: string;
}

export interface FacturaRequestDTO {
  serie: string;
  observaciones?: string;
  idCliente: number;
  idUsuario: number;
  idMoneda: number;
  detalles: DetalleFacturaDTO[];
  pagos?: PagoDTO[];
}

export interface FacturaResponseDTO {
  idFactura: number;
  serie: string;
  numero: string;
  fechaEmision: string;
  observaciones?: string;
  subtotal: number;
  igv: number;
  total: number;
  idCliente: number;
  nombreCliente: string;
  documentoCliente: string;
  idUsuario: number;
  nombreUsuario: string;
  idMoneda: number;
  codigoMoneda: string;
  simboloMoneda: string;
  detalles: DetalleFacturaDTO[];
  pagos: PagoDTO[];
  totalPagado: number;
  saldoPendiente: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = `${environment.apiUrl}/api/facturas`;

  constructor(private http: HttpClient) { }

  // Crear factura
  crear(factura: FacturaRequestDTO): Observable<FacturaResponseDTO> {
    return this.http.post<FacturaResponseDTO>(`${environment.apiUrl}/facturas`, factura);
  }

  // Listar todas las facturas
  listar(): Observable<FacturaResponseDTO[]> {
    return this.http.get<FacturaResponseDTO[]>(`${environment.apiUrl}/facturas`);
  }

  // Obtener una factura por ID
  obtenerPorId(id: number): Observable<FacturaResponseDTO> {
    return this.http.get<FacturaResponseDTO>(`${environment.apiUrl}/${id}`);
  }

  // Listar facturas por cliente
  listarPorCliente(idCliente: number): Observable<FacturaResponseDTO[]> {
    return this.http.get<FacturaResponseDTO[]>(`${environment.apiUrl}/cliente/${idCliente}`);
  }

  // Listar facturas por usuario
  listarPorUsuario(idUsuario: number): Observable<FacturaResponseDTO[]> {
    return this.http.get<FacturaResponseDTO[]>(`${environment.apiUrl}/usuario/${idUsuario}`);
  }
  
  descargarPdf(id: number) {
  return this.http.get(`${environment.apiUrl}/api/facturas/${id}/pdf`, {
    responseType: 'blob'
  });
}

descargarExcel(id: number) {
  return this.http.get(`${environment.apiUrl}/api/facturas/${id}/excel`, {
    responseType: 'blob'
  });
}

}