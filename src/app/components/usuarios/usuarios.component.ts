// src/app/components/usuarios/usuarios.component.ts - VERSIÓN ACTUALIZADA

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, UsuarioDto } from '../../services/usuario.service';
import { Subscription, interval, firstValueFrom } from 'rxjs'; // 👈 Agrega firstValueFrom
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent, FeedbackDialogData } from '../feedback-dialog/feedback-dialog.component';
import { ModalUsuarioComponent } from './modal-usuario/modal-usuario';
import { ReporteUsuariosComponent } from './usuario-reporte/reporte-usuarios.component';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ModalUsuarioComponent,
    ReporteUsuariosComponent  
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
  guardando = false;

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
    private cdr: ChangeDetectorRef,
  private dialog: MatDialog
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
        this.cdr.markForCheck();
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
    this.modoEdicion = true;
    this.usuarioParaEditar = { ...usuario };
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
  async onModalGuardar(datos: any): Promise<void> {
  console.log('💾 Datos recibidos del modal:', datos);
  
  if (this.guardando) return;

  this.guardando = true;
  this.cdr.detectChanges();

  try {
    if (this.modoEdicion && datos.idUsuario) {
      // MODO EDICIÓN
      await firstValueFrom(
        this.usuarioService.actualizar(datos.idUsuario, datos)
      );

      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Usuario Actualizado',
        mensaje: `El usuario "${datos.nombreUsuario}" se actualizó correctamente`
      });

    } else {
      // MODO CREACIÓN
      await firstValueFrom(this.usuarioService.crear(datos));

      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Usuario Creado',
        mensaje: `El usuario "${datos.nombreUsuario}" se creó exitosamente`
      });
    }

    this.finalizarOperacion();

  } catch (error: any) {
    const mensajeError = error.error?.message || error.message || 'Error desconocido';
    
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Guardar',
      mensaje: `No se pudo guardar el usuario.\n\n${mensajeError}`
    });
  } finally {
    this.guardando = false;
    this.cdr.detectChanges();
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

// 🆕 AGREGAR ESTA FUNCIÓN COMPLETA:
private async mostrarDialogo(data: FeedbackDialogData): Promise<boolean> {
  const dialogRef = this.dialog.open(FeedbackDialogComponent, {
    width: '400px',
    disableClose: true,
    data: data
  });

  const resultado = await firstValueFrom(dialogRef.afterClosed());
  return resultado === true;
}

// ========================================
// 🗑️ ELIMINAR USUARIO

  // ========================================
  // 🗑️ ELIMINAR USUARIO
  // ========================================
  
  async confirmarEliminar(usuario: UsuarioDto): Promise<void> {
  const confirmado = await this.mostrarDialogo({
    tipo: 'confirm',
    titulo: '⚠️ Confirmar Eliminación',
    mensaje: `¿Estás seguro de eliminar el usuario?\n\nUsuario: ${usuario.nombreUsuario}\nNombre: ${usuario.nombreCompleto}\n\nEsta acción no se puede deshacer.`
  });

  if (!confirmado) return;

  console.log('🗑️ Eliminando usuario:', usuario.idUsuario);

  try {
    await firstValueFrom(this.usuarioService.eliminar(usuario.idUsuario));

    await this.mostrarDialogo({
      tipo: 'success',
      titulo: '🗑️ Usuario Eliminado',
      mensaje: `El usuario "${usuario.nombreUsuario}" fue eliminado correctamente`
    });

    this.cargarUsuarios();

  } catch (error: any) {
    const mensajeError = error.error?.message || error.message || 'Error desconocido';
    
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Eliminar',
      mensaje: `No se pudo eliminar el usuario.\n\n${mensajeError}`
    });
  }
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
  
mostrarReporte = false;

abrirReporte(): void {
  this.stopPolling();
  this.mostrarReporte = true;
}

cerrarReporte(): void {
  this.mostrarReporte = false;
  this.startPolling();
}


}