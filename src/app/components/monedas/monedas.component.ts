import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { Subscription, interval, firstValueFrom } from 'rxjs'; // 👈 Agrega firstValueFrom
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent, FeedbackDialogData } from '../feedback-dialog/feedback-dialog.component';
import { ModalMonedaComponent } from './modal-monedas/modal-monedas';

@Component({
  selector: 'app-monedas',
  standalone: true,
  imports: [CommonModule, ModalMonedaComponent],
  templateUrl: './monedas.component.html',
  styleUrls: ['./monedas.component.css']
})
export class MonedasComponent implements OnInit, OnDestroy {

  monedas: MonedaDto[] = [];
  cargando = false;
  lastUpdated: Date | null = null;
  guardando = false;

  mostrarModal = false;
  modoEdicion = false;
  monedaParaEditar?: MonedaDto;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private monedaService: MonedaService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarMonedas();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  private cargarMonedas(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.monedaService.listar().subscribe({
      next: data => {
        this.monedas = [...data];
        this.lastUpdated = new Date();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error cargando monedas', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      if (!this.cargando) this.cargarMonedas();
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
      this.cargarMonedas();
      this.startPolling();
    }
  };

  // =========================
  // MODAL
  // =========================

  abrirCrear(): void {
    this.stopPolling();
    this.modoEdicion = false;
    this.monedaParaEditar = undefined;
    this.mostrarModal = true;
  }

  abrirEditar(moneda: MonedaDto): void {
    this.stopPolling();
    this.modoEdicion = true;
    this.monedaParaEditar = { ...moneda };
    this.mostrarModal = true;
  }

  onModalCerrar(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.monedaParaEditar = undefined;
    this.startPolling();
  }

  async onModalGuardar(payload: {
  idMoneda?: number;
  nombre: string;
  simbolo: string;
  codigo: string;
}): Promise<void> {
  
  if (this.guardando) return;

  this.guardando = true;
  this.cdr.detectChanges();

  try {
    if (this.modoEdicion && payload.idMoneda) {
      // EDICIÓN
      await firstValueFrom(
        this.monedaService.actualizar(payload.idMoneda, payload)
      );

      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Moneda Actualizada',
        mensaje: `La moneda "${payload.nombre}" (${payload.codigo}) se actualizó correctamente`
      });

    } else {
      // CREACIÓN
      await firstValueFrom(this.monedaService.crear(payload));

      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Moneda Creada',
        mensaje: `La moneda "${payload.nombre}" (${payload.codigo}) se creó exitosamente`
      });
    }

    this.finalizarOperacion();

  } catch (error) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Guardar',
      mensaje: 'Ocurrió un error al guardar la moneda. Por favor, intenta nuevamente.'
    });
  } finally {
    this.guardando = false;
    this.cdr.detectChanges();
  }
}

  private finalizarOperacion(): void {
  this.mostrarModal = false;
  this.modoEdicion = false;
  this.monedaParaEditar = undefined;
  this.cargarMonedas();
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

  async eliminar(moneda: MonedaDto): Promise<void> {
  const confirmado = await this.mostrarDialogo({
    tipo: 'confirm',
    titulo: '⚠️ Confirmar Eliminación',
    mensaje: `¿Estás seguro de eliminar la moneda?\n\n${moneda.nombre} (${moneda.codigo})\n\nEsta acción no se puede deshacer.`
  });

  if (!confirmado) return;

  try {
    await firstValueFrom(this.monedaService.eliminar(moneda.idMoneda));

    await this.mostrarDialogo({
      tipo: 'success',
      titulo: '🗑️ Moneda Eliminada',
      mensaje: `La moneda "${moneda.nombre}" fue eliminada correctamente`
    });

    this.cargarMonedas();

  } catch (error) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Eliminar',
      mensaje: 'No se pudo eliminar la moneda. Intenta nuevamente'
    });
  }
}


}
