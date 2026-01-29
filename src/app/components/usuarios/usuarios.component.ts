import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, UsuarioDto } from '../../services/usuario.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {

  usuarios: UsuarioDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;

  mostrarModal = false;
  modoEdicion = false;
  usuarioSeleccionado: Partial<UsuarioDto> = {};

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

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

  // ===== MODAL =====

  abrirModalCrear(): void {
    this.stopPolling();
    this.modoEdicion = false;
    this.usuarioSeleccionado = {
      rol: 'vendedor',
      estado: 'activo'
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: UsuarioDto): void {
    this.stopPolling();
    this.modoEdicion = true;
    this.usuarioSeleccionado = { ...usuario };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.usuarioSeleccionado = {};
    this.startPolling();
  }

  guardarUsuario(): void {
    if (!this.validarUsuario()) {
      alert('Complete los campos obligatorios');
      return;
    }

    const payload = {
      nombreUsuario: this.usuarioSeleccionado.nombreUsuario,
      clave: this.usuarioSeleccionado.clave,
      nombreCompleto: this.usuarioSeleccionado.nombreCompleto,
      email: this.usuarioSeleccionado.email,
      rol: this.usuarioSeleccionado.rol,
      estado: this.usuarioSeleccionado.estado
    };

    this.stopPolling();

    if (this.modoEdicion && this.usuarioSeleccionado.idUsuario) {
      this.usuarioService.actualizar(this.usuarioSeleccionado.idUsuario, payload)
        .subscribe({
          next: () => {
            alert('Usuario actualizado correctamente');
            this.finalizarOperacion();
          },
          error: err => {
            console.error(err);
            alert('Error al actualizar usuario');
            this.startPolling();
          }
        });
    } else {
      this.usuarioService.crear(payload).subscribe({
        next: () => {
          alert('Usuario creado correctamente');
          this.finalizarOperacion();
        },
        error: err => {
          console.error(err);
          alert('Error al crear usuario');
          this.startPolling();
        }
      });
    }
  }

  private finalizarOperacion(): void {
    this.cerrarModal();
    this.cargarUsuarios();
    this.startPolling();
  }

  private validarUsuario(): boolean {
    return !!(
      this.usuarioSeleccionado.nombreUsuario &&
      this.usuarioSeleccionado.clave &&
      this.usuarioSeleccionado.nombreCompleto &&
      this.usuarioSeleccionado.rol
    );
  }

  confirmarEliminar(usuario: UsuarioDto): void {
    const ok = confirm(
      `¿Eliminar usuario?\n\n` +
      `Usuario: ${usuario.nombreUsuario}\n` +
      `Nombre: ${usuario.nombreCompleto}`
    );

    if (!ok) return;

    this.usuarioService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        alert(`Usuario eliminado correctamente`);
        this.cargarUsuarios();
      },
      error: err => {
        console.error(err);
        alert('Error al eliminar usuario');
      }
    });
  }

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