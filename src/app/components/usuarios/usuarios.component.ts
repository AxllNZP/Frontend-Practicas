// src/app/components/usuarios/usuarios.component.ts - VERSIÓN ACTUALIZADA

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, UsuarioDto } from '../../services/usuario.service';
import { Subscription, interval } from 'rxjs';

// 🔥 IMPORTAR EL NUEVO COMPONENTE MODAL
import { ModalUsuarioComponent } from './modal-usuario/modal-usuario';

/**
 * 📖 COMPONENTE DE USUARIOS - VERSIÓN MEJORADA
 * 
 * CAMBIOS APLICADOS:
 * ✅ Se eliminó todo el código HTML del modal inline
 * ✅ Se agregó el componente ModalUsuarioComponent
 * ✅ La lógica de creación/edición está SEPARADA
 * ✅ Código mucho más limpio y mantenible
 * 
 * FLUJO DE TRABAJO:
 * 1. Usuario hace clic en "Nuevo Usuario" o "Editar"
 * 2. Se abre el modal (ModalUsuarioComponent)
 * 3. Usuario llena/modifica el formulario
 * 4. Modal emite evento con los datos
 * 5. Este componente recibe los datos y llama al servicio
 * 6. Backend procesa la petición
 * 7. Se cierra el modal y se recarga la tabla
 */
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ModalUsuarioComponent  // 🔥 AÑADIDO: Importar el modal
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {

  // ========================================
  // 📊 DATOS DE LA TABLA
  // ========================================
  usuarios: UsuarioDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;

  // ========================================
  // 🎬 CONTROL DEL MODAL
  // ========================================
  mostrarModal = false;
  modoEdicion = false;
  usuarioParaEditar?: UsuarioDto;  // 🔥 NUEVO: Usuario a editar

  // ========================================
  // ⏱️ POLLING
  // ========================================
  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  // ========================================
  // 🎬 LIFECYCLE HOOKS
  // ========================================
  
  ngOnInit(): void {
    console.log('=== USUARIOS COMPONENT INICIADO ===');
    this.cargarUsuarios();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // ========================================
  // 📥 CARGA DE DATOS
  // ========================================
  
  private cargarUsuarios(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: data => {
        this.usuarios = [...data];
        this.lastUpdated = new Date();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('✗ ERROR al cargar usuarios:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ========================================
  // ⏱️ POLLING
  // ========================================
  
  private startPolling(): void {
    this.stopPolling();
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      if (!this.cargando) {
        this.cargarUsuarios();
      }
    });
  }

  private stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = undefined;
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.stopPolling();
    } else {
      this.cargarUsuarios();
      this.startPolling();
    }
  };

  // ========================================
  // 🎬 CONTROL DEL MODAL
  // ========================================
  
  /**
   * 🔥 NUEVO: Abre el modal en modo CREACIÓN
   */
  abrirModalCrear(): void {
    console.log('➕ Abriendo modal para crear usuario');
    this.stopPolling();
    this.modoEdicion = false;
    this.usuarioParaEditar = undefined;
    this.mostrarModal = true;
  }

  /**
   * 🔥 NUEVO: Abre el modal en modo EDICIÓN
   */
  abrirModalEditar(usuario: UsuarioDto): void {
    console.log('✏️ Abriendo modal para editar usuario:', usuario.nombreUsuario);
    this.stopPolling();
    this.modoEdicion = true;
    this.usuarioParaEditar = { ...usuario };  // Clonar para evitar mutaciones
    this.mostrarModal = true;
  }

  /**
   * 🔥 NUEVO: Cierra el modal
   */
  onModalCerrar(): void {
    console.log('❌ Modal de usuario cerrado');
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.usuarioParaEditar = undefined;
    this.startPolling();
  }

  /**
   * 🔥 NUEVO: Guarda los datos recibidos del modal
   */
  onModalGuardar(datos: any): void {
    console.log('💾 Datos recibidos del modal:', datos);
    
    this.stopPolling();

    // Determinar si es creación o edición
    if (this.modoEdicion && datos.idUsuario) {
      // MODO EDICIÓN
      this.usuarioService.actualizar(datos.idUsuario, datos).subscribe({
        next: () => {
          alert(`✅ Usuario "${datos.nombreUsuario}" actualizado correctamente`);
          this.finalizarOperacion();
        },
        error: err => {
          console.error('❌ Error al actualizar usuario:', err);
          alert('❌ Error al actualizar usuario: ' + (err.message || 'Error desconocido'));
          this.startPolling();
        }
      });
    } else {
      // MODO CREACIÓN
      this.usuarioService.crear(datos).subscribe({
        next: () => {
          alert(`✅ Usuario "${datos.nombreUsuario}" creado correctamente`);
          this.finalizarOperacion();
        },
        error: err => {
          console.error('❌ Error al crear usuario:', err);
          alert('❌ Error al crear usuario: ' + (err.message || 'Error desconocido'));
          this.startPolling();
        }
      });
    }
  }

  /**
   * Finaliza la operación de guardar
   */
  private finalizarOperacion(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.usuarioParaEditar = undefined;
    this.cargarUsuarios();
    this.startPolling();
  }

  // ========================================
  // 🗑️ ELIMINAR USUARIO
  // ========================================
  
  confirmarEliminar(usuario: UsuarioDto): void {
    const ok = confirm(
      `¿Eliminar usuario?\n\n` +
      `Usuario: ${usuario.nombreUsuario}\n` +
      `Nombre: ${usuario.nombreCompleto}\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!ok) return;

    console.log('🗑️ Eliminando usuario:', usuario.idUsuario);

    this.usuarioService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        alert(`✅ Usuario "${usuario.nombreUsuario}" eliminado correctamente`);
        this.cargarUsuarios();
      },
      error: err => {
        console.error('❌ Error al eliminar usuario:', err);
        alert('❌ Error al eliminar usuario: ' + (err.message || 'Error desconocido'));
      }
    });
  }

  // ========================================
  // 🛠️ UTILIDADES
  // ========================================
  
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClass(estado: string): string {
    return estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
  }
}