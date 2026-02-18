import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, ClienteDto } from '../../../services/cliente.service';
import { FacturaReporteService, FacturaReporteDto } from '../../../services/factura-reporte.service';

@Component({
  selector: 'app-reporte-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-facturas.component.html',
  styleUrls: ['./reporte-facturas.component.css']
})
export class ReporteFacturasComponent implements OnInit {

  @Input() isOpen = false;
  @Output() cerrar = new EventEmitter<void>();

  clientes: ClienteDto[] = [];
  facturas: FacturaReporteDto[] = [];

  clienteSeleccionado?: ClienteDto;
  fechaInicio?: string;
  fechaFin?: string;

  constructor(
    private clienteService: ClienteService,
    private reporteService: FacturaReporteService
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe(data => {
      this.clientes = data;
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  buscar(): void {
    if (!this.clienteSeleccionado || !this.fechaInicio || !this.fechaFin) return;

    const inicio = new Date(this.fechaInicio).toISOString();
    const fin = new Date(this.fechaFin).toISOString();

    this.reporteService.obtenerReporte(
      this.clienteSeleccionado.idCliente,
      inicio,
      fin
    ).subscribe(data => this.facturas = data);
  }

  exportarPdf(): void {
    if (!this.clienteSeleccionado || !this.fechaInicio || !this.fechaFin) return;

    const inicio = new Date(this.fechaInicio).toISOString();
    const fin = new Date(this.fechaFin).toISOString();

    this.reporteService.descargarPdf(
      this.clienteSeleccionado.idCliente,
      inicio,
      fin
    ).subscribe(blob => this.descargar(blob, 'reporte.pdf'));
  }

  exportarExcel(): void {
    if (!this.clienteSeleccionado || !this.fechaInicio || !this.fechaFin) return;

    const inicio = new Date(this.fechaInicio).toISOString();
    const fin = new Date(this.fechaFin).toISOString();

    this.reporteService.descargarExcel(
      this.clienteSeleccionado.idCliente,
      inicio,
      fin
    ).subscribe(blob => this.descargar(blob, 'reporte.xlsx'));
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
