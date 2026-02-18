// src/app/components/modal-reporte-productos/modal-reporte-productos.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductoService, ProductoDto } from '../../../services/producto.service';

@Component({
  selector: 'app-modal-reporte-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-reporte-productos.component.html',
  styleUrls: ['./modal-reporte-productos.component.css']
})
export class ModalReporteProductosComponent implements OnInit {

  @Input() mostrar = false;
  @Output() cerrar = new EventEmitter<void>();

  productos: ProductoDto[] = [];
  resultados: any[] = [];

  productoSeleccionado: string = 'todos';
  fechaInicio?: string;
  fechaFin?: string;

  private readonly baseUrl = 'http://localhost:8080/api/reportes/productos';

  constructor(
    private productoService: ProductoService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.productoService.listar().subscribe(data => {
      this.productos = data;
    });
  }

  private construirFechas(): { inicio: string; fin: string } {
    return {
      inicio: `${this.fechaInicio}T00:00:00`,
      fin: `${this.fechaFin}T23:59:59`
    };
  }

  private construirUrl(endpoint: string = ''): string {

    const { inicio, fin } = this.construirFechas();

    let url = `${this.baseUrl}${endpoint}?fechaInicio=${inicio}&fechaFin=${fin}`;

    if (this.productoSeleccionado !== 'todos') {
      url += `&productoId=${this.productoSeleccionado}`;
    }

    return url;
  }

  buscar(): void {

    if (!this.fechaInicio || !this.fechaFin) return;

    const url = this.construirUrl();

    this.http.get<any[]>(url)
      .subscribe(data => {
        this.resultados = data;
      });
  }

  exportarPdf(): void {

  if (!this.fechaInicio || !this.fechaFin) return;

  const url = this.construirUrl('/pdf');

  this.http.get(url, { responseType: 'blob' })
    .subscribe(blob => {

      const file = new Blob([blob], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = 'reporte_productos.pdf';
      a.click();

      window.URL.revokeObjectURL(urlBlob);
    });
}
exportarExcel(): void {

  if (!this.fechaInicio || !this.fechaFin) return;

  const url = this.construirUrl('/excel');

  this.http.get(url, { responseType: 'blob' })
    .subscribe(blob => {

      const file = new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const urlBlob = window.URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = 'reporte_productos.xlsx';
      a.click();

      window.URL.revokeObjectURL(urlBlob);
    });
}

}
