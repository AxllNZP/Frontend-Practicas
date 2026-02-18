import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioReporteService, UsuarioReporteDto } from '../../../services/usuario-reporte.service';
import { UsuarioService, UsuarioDto } from '../../../services/usuario.service';


@Component({
  selector: 'app-reporte-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-usuarios.component.html',
  styleUrls: ['./reporte-usuarios.component.css']
})
export class ReporteUsuariosComponent implements OnInit {

  @Input() isOpen = false;
  @Output() cerrar = new EventEmitter<void>();

  usuarios: UsuarioDto[] = [];
  reporte: UsuarioReporteDto[] = [];

  usuarioSeleccionado?: UsuarioDto;
  fechaInicio?: string;
  fechaFin?: string;

  constructor(
    private usuarioService: UsuarioService,
    private reporteService: UsuarioReporteService
  ) {}

  ngOnInit(): void {
    this.usuarioService.listar().subscribe(data => {
      this.usuarios = data;
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  buscar(): void {
  if (!this.fechaInicio || !this.fechaFin) return;

  const inicio = this.fechaInicio + 'T00:00:00';
  const fin = this.fechaFin + 'T23:59:59';

  this.reporteService.obtenerReporte(
    this.usuarioSeleccionado?.idUsuario,
    inicio,
    fin
  ).subscribe(data => {
    this.reporte = data;
  });
}


 exportarPdf(): void {
  if (!this.fechaInicio || !this.fechaFin) return;

  const inicio = this.fechaInicio + 'T00:00:00';
  const fin = this.fechaFin + 'T23:59:59';

  this.reporteService.descargarPdf(
    this.usuarioSeleccionado?.idUsuario,
    inicio,
    fin
  ).subscribe(blob => this.descargar(blob, 'reporte_usuarios.pdf'));
}


  exportarExcel(): void {
  if (!this.fechaInicio || !this.fechaFin) return;

  const inicio = this.fechaInicio + 'T00:00:00';
  const fin = this.fechaFin + 'T23:59:59';

  this.reporteService.descargarExcel(
    this.usuarioSeleccionado?.idUsuario,
    inicio,
    fin
  ).subscribe(blob => this.descargar(blob, 'reporte_usuarios.xlsx'));
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
