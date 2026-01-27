// src/app/components/clientes/clientes.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService, ClienteDto } from '../../services/cliente.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit, OnDestroy {
  clientes: ClienteDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;
  
  // Para el modal de crear/editar
  mostrarModal = false;
  modoEdicion = false;
  clienteSeleccionado: Partial<ClienteDto> = {};

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('=== CLIENTES COMPONENT INICIADO ===');
    this.cargarClientes();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private cargarClientes(): void {
  if (this.cargando) return; // Evita peticiones duplicadas
  
  this.cargando = true;
  this.clienteService.listar().subscribe({
    next: data => {
      this.clientes = [...data];
      this.lastUpdated = new Date();
      this.cargando = false;
      this.cdr.detectChanges();
    },
    error: err => {
      console.error('✗ ERROR 500 DETECTADO:', err);
      this.cargando = false;
      // No vacíes la lista si ya tenías datos, así el usuario no ve la pantalla en blanco
      this.cdr.detectChanges();
    }
  });
}

  private startPolling(): void {
  // 1. Limpiamos cualquier intervalo previo SIEMPRE antes de iniciar uno nuevo
  this.stopPolling(); 

  console.log('--- Iniciando nuevo ciclo de polling ---');
  this.pollingSub = interval(this.POLL_MS).subscribe(() => {
    // Solo cargamos si no estamos ya cargando (evita solapamiento)
    if (!this.cargando) {
      this.cargarClientes();
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
      this.cargarClientes();
      this.startPolling();
    }
  }

  // Abrir modal para crear
  abrirModalCrear(): void {
    this.stopPolling();
    this.modoEdicion = false;
    this.clienteSeleccionado = {
      tipoDocumento: 'DNI',
      estado: "activo"
    };
    this.mostrarModal = true;
  }

  // Abrir modal para editar
  abrirModalEditar(cliente: ClienteDto): void {
    this.stopPolling();
    this.modoEdicion = true;
    this.clienteSeleccionado = { ...cliente };
    this.mostrarModal = true;
  }

  // Cerrar modal
  cerrarModal(): void {
  this.mostrarModal = false;
  this.clienteSeleccionado = {};
}
  // Guardar cliente (crear o actualizar)
  guardarCliente(): void {
  if (!this.validarCliente()) {
    alert('Por favor complete todos los campos obligatorios');
    return;
  }

  // DTO limpio (SOLO campos editables)
  const payload = {
    tipoDocumento: this.clienteSeleccionado.tipoDocumento,
    numeroDocumento: this.clienteSeleccionado.numeroDocumento,
    nombreRazonSocial: this.clienteSeleccionado.nombreRazonSocial,
    direccion: this.clienteSeleccionado.direccion,
    telefono: this.clienteSeleccionado.telefono,
    email: this.clienteSeleccionado.email,
    estado: this.clienteSeleccionado.estado
  };

  this.stopPolling(); // ⛔ DETENER POLLING

  if (this.modoEdicion && this.clienteSeleccionado.idCliente) {
    this.clienteService.actualizar(this.clienteSeleccionado.idCliente, payload)
      .subscribe({
        next: () => {
          alert('Cliente actualizado correctamente');
          this.finalizarOperacion();
        },
        error: err => {
          console.error(err);
          alert('Error al actualizar cliente');
          this.startPolling();
        }
      });
  } else {
    this.clienteService.crear(payload).subscribe({
      next: () => {
        alert('Cliente creado correctamente');
        this.finalizarOperacion();
      },
      error: err => {
        console.error(err);
        alert('Error al crear cliente');
        this.startPolling();
      }
    });
  }
}

private finalizarOperacion(): void {
  this.cerrarModal();
  this.cargarClientes();
  this.startPolling();
}

  // Validar datos del cliente
  private validarCliente(): boolean {
    return !!(
      this.clienteSeleccionado.tipoDocumento &&
      this.clienteSeleccionado.numeroDocumento &&
      this.clienteSeleccionado.nombreRazonSocial
    );
  }

  // Confirmar eliminación
  confirmarEliminar(cliente: ClienteDto): void {
    const ok = confirm(
      `¿Eliminar cliente?\n\n` +
      `Documento: ${cliente.numeroDocumento}\n` +
      `Nombre: ${cliente.nombreRazonSocial}`
    );
    
    if (!ok) return;

    this.clienteService.eliminar(cliente.idCliente).subscribe({
      next: () => {
        alert(`Cliente "${cliente.nombreRazonSocial}" eliminado correctamente`);
        this.cargarClientes();
      },
      error: err => {
        console.error(err);
        alert('Error al eliminar cliente');
      }
    });
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Clase CSS según estado
  getEstadoClass(estado: string): string {
  return estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
  }
}