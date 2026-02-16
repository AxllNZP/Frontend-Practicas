import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService, ClienteDto } from '../../services/cliente.service';
import { Subscription, interval, firstValueFrom } from 'rxjs'; // 👈 Agrega firstValueFrom
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent, FeedbackDialogData } from '../feedback-dialog/feedback-dialog.component';

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
  guardando = false;

  mostrarModal = false;
  modoEdicion = false;
  clienteParaEditar?: ClienteDto;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
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

  async onModalGuardar(payload: Partial<ClienteDto>): Promise<void> {
  if (this.guardando) return;

  this.guardando = true;
  this.cdr.detectChanges();

  try {
    if (this.modoEdicion && this.clienteParaEditar?.idCliente) {
      // EDICIÓN
      await firstValueFrom(
        this.clienteService.actualizar(this.clienteParaEditar.idCliente, payload)
      );

      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Cliente Actualizado',
        mensaje: `El cliente "${payload.nombreRazonSocial}" se actualizó correctamente`
      });
      this.cargarClientes();
      this.startPolling();

    } else {
      // CREACIÓN
      await firstValueFrom(this.clienteService.crear(payload));

      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Cliente Creado',
        mensaje: `El cliente "${payload.nombreRazonSocial}" se creó exitosamente`
      });
      this.cargarClientes();
      this.startPolling();

    }

    this.finalizar();

  } catch (error) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Guardar',
      mensaje: 'Ocurrió un error al guardar el cliente. Por favor, intenta nuevamente.'
    });
  } finally {
    this.guardando = false;
    this.cdr.detectChanges();
  }
}

  private finalizar(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.clienteParaEditar = undefined;
    this.cargarClientes();
    this.startPolling();
  }

  async confirmarEliminar(cliente: ClienteDto): Promise<void> {
  const confirmado = await this.mostrarDialogo({
    tipo: 'confirm',
    titulo: '⚠️ Confirmar Eliminación',
    mensaje: `¿Estás seguro de eliminar el cliente?\n\n${cliente.nombreRazonSocial}\n\nEsta acción no se puede deshacer.`
  });

  if (!confirmado) return;

  try {
    await firstValueFrom(this.clienteService.eliminar(cliente.idCliente));

    await this.mostrarDialogo({
      tipo: 'success',
      titulo: '🗑️ Cliente Eliminado',
      mensaje: `El cliente "${cliente.nombreRazonSocial}" fue eliminado correctamente`
      
    });

    this.cargarClientes();
    this.startPolling();

  } catch (error) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Eliminar',
      mensaje: 'No se pudo eliminar el cliente. Intenta nuevamente'
    });
    this.cargarClientes();
  }
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



  // =========================
// DIÁLOGOS
// =========================

private async mostrarDialogo(data: FeedbackDialogData): Promise<boolean> {
  const dialogRef = this.dialog.open(FeedbackDialogComponent, {
    width: '400px',
    disableClose: true,
    data: data
  });

  const resultado = await firstValueFrom(dialogRef.afterClosed());
  return resultado === true;
}

// =========================
// UTILIDADES
// =========================
}
