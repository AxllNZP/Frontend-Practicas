// src/app/components/producto-modal/producto-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoDto, EstadoGeneral } from '../../../services/producto.service';

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-productos.html',
  styleUrls: ['./modal-productos.css'] // Mueve aquí los estilos del modal
})
export class ProductoModalComponent {
  @Input() mostrar = false;
  @Input() modoEdicion = false;
  @Input() producto: Partial<ProductoDto> = {};
  @Input() guardando = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<Partial<ProductoDto>>();

  onCerrar() {
    this.cerrar.emit();
  }

  onGuardar() {
    if (!this.producto.codigo || !this.producto.nombre) {
      alert('Código y nombre son obligatorios');
      return;
    }
    this.guardar.emit(this.producto);
  }
}