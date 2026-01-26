// src/app/components/usuarios/usuarios.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService, UsuarioDto } from '../../services/usuario.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('=== USUARIOS COMPONENT INICIADO ===');
    console.log('API URL:', 'http://localhost:8080/api/usuarios');
    
    this.cargarUsuarios();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private cargarUsuarios(): void {
    console.log('=== CARGANDO USUARIOS ===');
    this.cargando = true;

    this.usuarioService.listar().subscribe({
      next: data => {
        console.log('✓ USUARIOS RECIBIDOS:', data);
        console.log('✓ Cantidad de usuarios:', data.length);
        
        // Crear nueva referencia del array
        this.usuarios = [...data];
        this.lastUpdated = new Date();
        this.cargando = false;
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('✓ Vista actualizada con', this.usuarios.length, 'usuarios');
      },
      error: err => {
        console.error('✗ ERROR AL CARGAR USUARIOS:', err);
        console.error('✗ Error status:', err.status);
        console.error('✗ Error message:', err.message);
        
        this.usuarios = [];
        this.cargando = false;
        this.cdr.detectChanges();
        
        if (this.lastUpdated === null) {
          alert(`Error al conectar con el servidor:\n${err.message}`);
        }
      }
    });
  }

  /********** Polling automático **********/
  private startPolling(): void {
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      console.log('⟳ Polling - recargando usuarios...');
      this.cargarUsuarios();
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
      console.log('⏸ Pestaña oculta - deteniendo polling');
      this.stopPolling();
    } else {
      console.log('▶ Pestaña visible - reiniciando polling');
      this.cargarUsuarios();
      this.startPolling();
    }
  }
  /******************************************/

  confirmarEliminar(usuario: UsuarioDto): void {
    const ok = confirm(
      `¿Eliminar usuario?\n\n` +
      `Usuario: ${usuario.nombreUsuario}\n` +
      `Nombre: ${usuario.nombreCompleto}\n` +
      `Email: ${usuario.email}`
    );
    
    if (!ok) return;

    console.log('Eliminando usuario:', usuario.nombreUsuario);

    this.usuarioService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        console.log('✓ Usuario eliminado exitosamente');
        alert(`Usuario "${usuario.nombreUsuario}" eliminado correctamente`);
        this.cargarUsuarios();
      },
      error: err => {
        console.error('✗ Error al eliminar usuario:', err);
        alert('Error al eliminar el usuario. Intenta nuevamente.');
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

  getRolClass(rol: string): string {
    const classes: { [key: string]: string } = {
      'ADMIN': 'rol-admin',
      'USUARIO': 'rol-usuario',
      'VENDEDOR': 'rol-vendedor'
    };
    return classes[rol] || 'rol-usuario';
  }

  getEstadoClass(estado: string): string {
    return estado === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo';
  }

  // Método para ocultar parte de la contraseña (seguridad)
  ocultarClave(clave: string): string {
    return '•'.repeat(clave.length);
  }
}