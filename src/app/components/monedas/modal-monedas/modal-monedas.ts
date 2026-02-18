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
  selector: 'app-modal-moneda',
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

  // 📝 CAMPOS DEL FORMULARIO
  nombre = '';
  simbolo = '';
  codigo = '';

  // 🆕 AGREGAR: Variables para mostrar errores visuales
  mostrarErrores = false;

  // ====================================
  // 🔄 CICLO DE VIDA: ngOnChanges
  // ====================================
  // Se ejecuta cada vez que cambian los @Input()
  // Es PERFECTO para cargar datos cuando se abre el modal
  ngOnChanges(): void {
    // Si el modal no está abierto, no hagas nada
    if (!this.isOpen) {
      this.mostrarErrores = false; // 🆕 Resetear errores cuando se cierra
      return;
    }

    // Si estamos en modo edición Y hay una moneda para editar
    if (this.modoEdicion && this.monedaEditar) {
      // 📖 ENSEÑANZA: Cargamos los valores existentes
      this.nombre = this.monedaEditar.nombre;
      this.simbolo = this.monedaEditar.simbolo;
      this.codigo = this.monedaEditar.codigo;
    } else {
      // Si es creación, limpiamos todo
      this.limpiarFormulario();
    }
  }

  // ====================================
  // ❌ CERRAR MODAL
  // ====================================
  cerrarModal(): void {
    // 📖 ENSEÑANZA: Emitimos el evento de cierre
    // El padre decidirá qué hacer (cerrar, limpiar, reiniciar polling)
    this.cerrar.emit();
  }

  // ====================================
  // 💾 GUARDAR MONEDA - ¡CORREGIDO!
  // ====================================
  guardarMoneda(): void {
    // 🆕 VALIDACIÓN: Mostrar errores si los campos están vacíos
    if (!this.esFormularioValido()) {
      this.mostrarErrores = true; // Activar visualización de errores
      return;
    }

    // 📦 Preparar el payload (paquete de datos)
    const payload: any = {
      nombre: this.nombre.trim(),
      simbolo: this.simbolo.trim(),
      codigo: this.codigo.trim().toUpperCase()
    };

    // Si estamos editando, incluir el ID
    if (this.modoEdicion && this.monedaEditar?.idMoneda) {
      payload.idMoneda = this.monedaEditar.idMoneda;
    }

    // ✅ CORRECCIÓN CRÍTICA:
    // SOLO emitimos. NO limpiamos aquí.
    // El padre se encargará de cerrar el modal y limpiar
    this.guardar.emit(payload);

    // ❌ REMOVIDO: this.limpiar(); 
    // ⚠️ NUNCA limpiar aquí porque el padre aún no ha procesado los datos
  }

  // ====================================
  // 🆕 VALIDACIÓN DEL FORMULARIO
  // ====================================
  esFormularioValido(): boolean {
    return this.nombre.trim() !== '' && 
           this.simbolo.trim() !== '' && 
           this.codigo.trim() !== '';
  }

  // 🆕 Métodos helpers para validación individual
  get nombreInvalido(): boolean {
    return this.mostrarErrores && this.nombre.trim() === '';
  }

  get simboloInvalido(): boolean {
    return this.mostrarErrores && this.simbolo.trim() === '';
  }

  get codigoInvalido(): boolean {
    return this.mostrarErrores && this.codigo.trim() === '';
  }

  // ====================================
  // 🧹 LIMPIAR FORMULARIO
  // ====================================
  private limpiarFormulario(): void {
    this.nombre = '';
    this.simbolo = '';
    this.codigo = '';
    this.mostrarErrores = false; // 🆕 Resetear estado de errores
  }

  // ====================================
  // 📝 HELPERS
  // ====================================
  onContentClick(event: Event): void {
    // Prevenir que el click en el contenido cierre el modal
    event.stopPropagation();
  }

  getTitulo(): string {
    return this.modoEdicion ? '✏️ Editar Moneda' : '➕ Nueva Moneda';
  }
}