// src/app/components/modal-usuario/modal-usuario.component.ts

import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioDto, RolUsuario, EstadoGeneral } from '../../../services/usuario.service';

/**
 * 📖 COMPONENTE MODAL DE USUARIO
 * 
 * Este componente encapsula toda la lógica del formulario de usuarios
 * en un modal reutilizable e independiente.
 * 
 * CARACTERÍSTICAS:
 * - Puede ser usado para CREAR o EDITAR usuarios
 * - Validación de campos obligatorios
 * - Emite eventos al componente padre
 * - Limpia automáticamente el formulario
 * 
 * EJEMPLO DE USO:
 * <app-modal-usuario
 *   [isOpen]="mostrarModal"
 *   [modoEdicion]="false"
 *   (cerrar)="onModalCerrar()"
 *   (guardar)="onModalGuardar($event)">
 * </app-modal-usuario>
 */
@Component({
  selector: 'app-modal-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-usuario.html',
  styleUrls: ['./modal-usuario.css']
})
export class ModalUsuarioComponent implements OnInit {

  // ========================================
  // 📥 INPUTS: Datos que recibe del padre
  // ========================================
  
  /**
   * Controla si el modal está visible
   */
  @Input() isOpen: boolean = false;
  
  /**
   * Define si estamos CREANDO o EDITANDO
   * - false: Modo creación (formulario vacío)
   * - true: Modo edición (formulario pre-llenado)
   */
  @Input() modoEdicion: boolean = false;
  
  /**
   * Usuario a editar (solo cuando modoEdicion = true)
   * Si es undefined, el modal está en modo creación
   */
  @Input() usuarioEditar?: UsuarioDto;
  @Input() guardando = false;

  // ========================================
  // 📤 OUTPUTS: Eventos que emite al padre
  // ========================================
  
  /**
   * Se emite cuando el usuario cierra el modal
   * El padre debe manejar esto para ocultar el modal
   */
  @Output() cerrar = new EventEmitter<void>();
  
  /**
   * Se emite cuando el usuario guarda
   * Devuelve un objeto con todos los datos del formulario
   */
  @Output() guardar = new EventEmitter<{
    nombreUsuario: string;
    clave: string;
    nombreCompleto: string;
    email?: string;
    rol: RolUsuario;
    estado: EstadoGeneral;
    idUsuario?: number;  // Solo presente en modo edición
  }>();

  // ========================================
  // 🗂️ DATOS DEL FORMULARIO
  // ========================================
  
  nombreUsuario: string = '';
  clave: string = '';
  nombreCompleto: string = '';
  email: string = '';
  rol: RolUsuario = 'vendedor';
  estado: EstadoGeneral = 'activo';

  // ========================================
  // 🎬 LIFECYCLE HOOKS
  // ========================================
  
  ngOnInit(): void {
    console.log('✅ ModalUsuarioComponent inicializado');
    console.log('🔍 Modo edición:', this.modoEdicion);
    console.log('👤 Usuario a editar:', this.usuarioEditar);
    console.log('📂 isOpen:', this.isOpen);
  }

  /**
   * Angular llama a este método cada vez que cambian los @Input
   * Lo usamos para cargar los datos cuando estamos en modo edición
   */
  ngOnChanges(): void {
    if (this.isOpen && this.modoEdicion && this.usuarioEditar) {
      this.cargarDatosParaEditar();
    } else if (this.isOpen && !this.modoEdicion) {
      this.limpiarFormulario();
    }
  }

  // ========================================
  // 🔧 MÉTODOS PÚBLICOS
  // ========================================
  
  /**
   * Cierra el modal y limpia el formulario
   */
  cerrarModal(): void {
    console.log('❌ Cerrando modal de usuario');
    this.limpiarFormulario();
    this.cerrar.emit();
  }

  /**
   * Valida y emite los datos al componente padre
   */
  guardarUsuario(): void {
  console.log('💾 Intentando guardar usuario...');
  
  if (!this.validarUsuario()) {
    // ❌ QUITAR O COMENTAR ESTE ALERT - La validación se puede mejorar después
    // alert('⚠️ Por favor complete todos los campos obligatorios:\n\n' +
    //       '- Nombre de usuario\n' +
    //       '- Contraseña\n' +
    //       '- Nombre completo\n' +
    //       '- Rol');
    return;
  }

  // Preparar el payload
  const payload: any = {
    nombreUsuario: this.nombreUsuario.trim(),
    clave: this.clave,
    nombreCompleto: this.nombreCompleto.trim(),
    email: this.email.trim() || undefined,
    rol: this.rol,
    estado: this.estado
  };

  // Si estamos en modo edición, incluir el ID
  if (this.modoEdicion && this.usuarioEditar?.idUsuario) {
    payload.idUsuario = this.usuarioEditar.idUsuario;
  }

  console.log('✅ Datos válidos, emitiendo al padre:', payload);
  
  // Emitir los datos al padre
  this.guardar.emit(payload);
  
  // Limpiar el formulario
  this.limpiarFormulario();
}

  /**
   * Obtiene el título del modal según el modo
   */
  getTitulo(): string {
    return this.modoEdicion ? '✏️ Editar Usuario' : '➕ Nuevo Usuario';
  }

  /**
   * Obtiene el texto del botón guardar según el modo
   */
  getTextoBotonGuardar(): string {
    return this.modoEdicion ? 'Actualizar' : 'Guardar';
  }

  // ========================================
  // 🔒 MÉTODOS PRIVADOS
  // ========================================
  
  /**
   * Carga los datos del usuario en el formulario (modo edición)
   */
  private cargarDatosParaEditar(): void {
    if (!this.usuarioEditar) return;

    console.log('📝 Cargando datos para editar:', this.usuarioEditar);

    this.nombreUsuario = this.usuarioEditar.nombreUsuario || '';
    this.clave = this.usuarioEditar.clave || '';
    this.nombreCompleto = this.usuarioEditar.nombreCompleto || '';
    this.email = this.usuarioEditar.email || '';
    this.rol = this.usuarioEditar.rol || 'vendedor';
    this.estado = this.usuarioEditar.estado || 'activo';
  }

  /**
   * Valida que todos los campos obligatorios estén completos
   */
  private validarUsuario(): boolean {
    const esValido = !!(
      this.nombreUsuario.trim() &&
      this.clave &&
      this.nombreCompleto.trim() &&
      this.rol
    );

    if (!esValido) {
      console.error('❌ Validación fallida:', {
        nombreUsuario: this.nombreUsuario,
        clave: this.clave ? '***' : '',
        nombreCompleto: this.nombreCompleto,
        rol: this.rol
      });
    }

    return esValido;
  }

  /**
   * Limpia todos los campos del formulario
   */
  private limpiarFormulario(): void {
    console.log('🧹 Limpiando formulario de usuario');
    
    this.nombreUsuario = '';
    this.clave = '';
    this.nombreCompleto = '';
    this.email = '';
    this.rol = 'vendedor';
    this.estado = 'activo';
  }

  /**
   * Previene que el clic en el modal lo cierre
   * (Solo se cierra al hacer clic en el overlay o botón X)
   */
  onModalContentClick(event: Event): void {
    event.stopPropagation();
  }
}