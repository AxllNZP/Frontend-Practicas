import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteDto } from '../../../services/cliente.service';

@Component({
  selector: 'app-modal-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-clientes.html',
  styleUrls: ['./modal-clientes.css']
})
export class ModalClienteComponent implements OnChanges {

  @Input() isOpen = false;
  @Input() modoEdicion = false;
  @Input() clienteEditar?: ClienteDto;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Partial<ClienteDto>>();

  cliente: Partial<ClienteDto> = {};

  ngOnChanges(): void {
    if (!this.isOpen) return;

    this.cliente = this.modoEdicion && this.clienteEditar
      ? { ...this.clienteEditar }
      : { tipoDocumento: 'DNI', estado: 'activo' };
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  guardarCliente(): void {
    if (!this.cliente.tipoDocumento ||
        !this.cliente.numeroDocumento ||
        !this.cliente.nombreRazonSocial) {
      alert('⚠️ Complete los campos obligatorios');
      return;
    }

    this.guardar.emit({
      tipoDocumento: this.cliente.tipoDocumento,
      numeroDocumento: this.cliente.numeroDocumento,
      nombreRazonSocial: this.cliente.nombreRazonSocial,
      direccion: this.cliente.direccion,
      telefono: this.cliente.telefono,
      email: this.cliente.email,
      estado: this.cliente.estado
    });
  }

  onContentClick(event: Event): void {
    event.stopPropagation();
  }

  getTitulo(): string {
    return this.modoEdicion ? '✏️ Editar Cliente' : '➕ Nuevo Cliente';
  }

  getMaxLength(): number {
  switch (this.cliente.tipoDocumento) {
    case 'DNI': return 8;
    case 'RUC': return 11;
    case 'CE': return 12;
    case 'PASAPORTE': return 12;
    default: return 20;
  }
}

esSoloNumeros(): boolean {
  return this.cliente.tipoDocumento === 'DNI' ||
         this.cliente.tipoDocumento === 'RUC';
}


onNumeroDocumentoInput(event: any) {
  let valor = event.target.value;

  // Si es DNI o RUC → solo números
  if (this.esSoloNumeros()) {
    valor = valor.replace(/[^0-9]/g, '');
  }

  // Limitar longitud
  const max = this.getMaxLength();
  if (valor.length > max) {
    valor = valor.substring(0, max);
  }

  this.cliente.numeroDocumento = valor;
}

}
