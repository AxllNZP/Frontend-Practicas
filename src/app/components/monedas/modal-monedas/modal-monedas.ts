import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonedaDto } from '../../../services/moneda.service';

@Component({
  selector: 'app-modal-moneda', // 🔥 ESTE ES EL SELECTOR REAL
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-monedas.html',
  styleUrls: ['./modal-monedas.css']
})
export class ModalMonedaComponent implements OnChanges {

  @Input() isOpen = false;
  @Input() modoEdicion = false;
  @Input() monedaEditar?: MonedaDto;
  @Input() guardando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<{
    idMoneda?: number;
    nombre: string;
    simbolo: string;
    codigo: string;
  }>();

  nombre = '';
  simbolo = '';
  codigo = '';

  ngOnChanges(): void {
    if (!this.isOpen) return;

    if (this.modoEdicion && this.monedaEditar) {
      this.nombre = this.monedaEditar.nombre;
      this.simbolo = this.monedaEditar.simbolo;
      this.codigo = this.monedaEditar.codigo;
    } else {
      this.limpiar();
    }
  }

  cerrarModal(): void {
    this.limpiar();
    this.cerrar.emit();
  }

  guardarMoneda(): void {
  if (!this.nombre.trim() || !this.simbolo.trim() || !this.codigo.trim()) {
    return;
  }

  const payload: any = {
    nombre: this.nombre.trim(),
    simbolo: this.simbolo.trim(),
    codigo: this.codigo.trim().toUpperCase()
  };

  if (this.modoEdicion && this.monedaEditar?.idMoneda) {
    payload.idMoneda = this.monedaEditar.idMoneda;
  }

  this.guardar.emit(payload);
  this.limpiar();
}

  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  getTitulo(): string {
    return this.modoEdicion ? '✏️ Editar Moneda' : '➕ Nueva Moneda';
  }

  private limpiar(): void {
    this.nombre = '';
    this.simbolo = '';
    this.codigo = '';
  }
}
