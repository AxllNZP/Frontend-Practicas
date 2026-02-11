import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService, ClienteDto } from '../../services/cliente.service';
import { Subscription, interval } from 'rxjs';

// 🔥 MODAL SEPARADO
import { ModalClienteComponent } from './modal-clientes/modal-clientes';

@Component({
  selector: 'app-clientes',                                                                                                                                                    
  standalone: true,
  imports: [CommonModule, ModalClienteComponent],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit, OnDestroy {

  clientes: ClienteDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;

  mostrarModal = false;
  modoEdicion = false;
  clienteParaEditar?: ClienteDto;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  // =========================
  // DATOS
  // =========================

  private cargarClientes(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.clienteService.listar().subscribe({
      next: data => {
        this.clientes = [...data];
        this.lastUpdated = new Date();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      if (!this.cargando) this.cargarClientes();
    });
  }

  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  private handleVisibility = () => {
    if (document.hidden) {
      this.stopPolling();
    } else {
      this.cargarClientes();
      this.startPolling();
    }
  };

  // =========================
  // MODAL
  // =========================

  abrirModalCrear(): void {
    this.stopPolling();
    this.modoEdicion = false;
    this.clienteParaEditar = {
      tipoDocumento: 'DNI',
      estado: 'activo'
    } as ClienteDto;
    this.mostrarModal = true;
  }

  abrirModalEditar(cliente: ClienteDto): void {
    this.stopPolling();
    this.modoEdicion = true;
    this.clienteParaEditar = { ...cliente };
    this.mostrarModal = true;
  }

  onModalCerrar(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.clienteParaEditar = undefined;
    this.startPolling();
  }

  onModalGuardar(payload: Partial<ClienteDto>): void {
    this.stopPolling();

    if (this.modoEdicion && this.clienteParaEditar?.idCliente) {
      this.clienteService.actualizar(this.clienteParaEditar.idCliente, payload)
        .subscribe({
          next: () => {
            alert('✅ Cliente actualizado');
            this.finalizar();
          },
          error: () => {
            alert('❌ Error al actualizar');
            this.startPolling();
          }
        });
    } else {
      this.clienteService.crear(payload).subscribe({
        next: () => {
          alert('✅ Cliente creado');
          this.finalizar();
        },
        error: () => {
          alert('❌ Error al crear');
          this.startPolling();
        }
      });
    }
  }

  private finalizar(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.clienteParaEditar = undefined;
    this.cargarClientes();
    this.startPolling();
  }

  confirmarEliminar(cliente: ClienteDto): void {
    if (!confirm(`¿Eliminar ${cliente.nombreRazonSocial}?`)) return;

    this.clienteService.eliminar(cliente.idCliente).subscribe(() => {
      alert('🗑️ Cliente eliminado');
      this.cargarClientes();
    });
  }

  // =========================
  // UTILIDADES
  // =========================

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE');
  }

  getEstadoClass(estado: string): string {
    return estado === 'activo' ? 'estado-activo' : 'estado-inactivo';
  }
}
