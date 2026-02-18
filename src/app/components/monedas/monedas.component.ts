import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { Subscription, interval, firstValueFrom } from 'rxjs';
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

  // ====================================
  // 🔄 CICLO DE VIDA
  // ====================================
  ngOnInit(): void {
    this.cargarMonedas();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  // ====================================
  // 📥 CARGAR MONEDAS
  // ====================================
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

  // ====================================
  // ⏱️ POLLING (Actualización automática)
  // ====================================
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

  // ====================================
  // 📝 ABRIR MODAL - CREAR
  // ====================================
  abrirCrear(): void {
    console.log('🟢 Abriendo modal para CREAR'); // 🆕 Debug
    this.stopPolling();
    this.modoEdicion = false;
    this.monedaParaEditar = undefined;
    this.mostrarModal = true;
    this.cdr.detectChanges(); // 🆕 Forzar detección de cambios
  }

  // ====================================
  // ✏️ ABRIR MODAL - EDITAR
  // ====================================
  abrirEditar(moneda: MonedaDto): void {
    console.log('🟡 Abriendo modal para EDITAR:', moneda); // 🆕 Debug
    this.stopPolling();
    this.modoEdicion = true;
    this.monedaParaEditar = { ...moneda }; // Copia del objeto
    this.mostrarModal = true;
    this.cdr.detectChanges(); // 🆕 Forzar detección de cambios
  }

  // ====================================
  // ❌ CERRAR MODAL
  // ====================================
  onModalCerrar(): void {
    console.log('🔴 Cerrando modal'); // 🆕 Debug
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.monedaParaEditar = undefined;
    this.startPolling();
    this.cdr.detectChanges();
  }

  // ====================================
  // 💾 GUARDAR MONEDA - ✅ CORREGIDO
  // ====================================
  async onModalGuardar(payload: {
    idMoneda?: number;
    nombre: string;
    simbolo: string;
    codigo: string;
  }): Promise<void> {
    
    console.log('💾 Guardando moneda:', payload); // 🆕 Debug
    
    // 📖 ENSEÑANZA: Prevenir múltiples clicks
    if (this.guardando) {
      console.log('⚠️ Ya hay una operación en curso');
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    try {
      if (this.modoEdicion && payload.idMoneda) {
        // ✏️ MODO EDICIÓN
        console.log('📝 Actualizando moneda ID:', payload.idMoneda);
        
        await firstValueFrom(
          this.monedaService.actualizar(payload.idMoneda, payload)
        );

        await this.mostrarDialogo({
          tipo: 'success',
          titulo: '✅ Moneda Actualizada',
          mensaje: `La moneda "${payload.nombre}" (${payload.codigo}) se actualizó correctamente`
        });

      } else {
        // ➕ MODO CREACIÓN
        console.log('➕ Creando nueva moneda');
        
        await firstValueFrom(this.monedaService.crear(payload));

        await this.mostrarDialogo({
          tipo: 'success',
          titulo: '✅ Moneda Creada',
          mensaje: `La moneda "${payload.nombre}" (${payload.codigo}) se creó exitosamente`
        });
      }

      // ✅ ÉXITO: Finalizar operación
      console.log('✅ Operación exitosa');
      this.finalizarOperacion();

    } catch (error) {
      // ❌ ERROR: Mostrar diálogo de error
      console.error('❌ Error al guardar:', error);
      
      await this.mostrarDialogo({
        tipo: 'error',
        titulo: '❌ Error al Guardar',
        mensaje: 'Ocurrió un error al guardar la moneda. Por favor, intenta nuevamente.'
      });
      
      // 🆕 NO cerrar el modal en caso de error
      // El usuario puede corregir e intentar de nuevo
      
    } finally {
      // Siempre resetear el estado de guardando
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  // ====================================
  // ✅ FINALIZAR OPERACIÓN
  // ====================================
  private finalizarOperacion(): void {
    console.log('🏁 Finalizando operación');
    
    // 📖 ENSEÑANZA: Este método se ejecuta solo si la operación fue exitosa
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.monedaParaEditar = undefined;
    
    // Recargar la lista
    this.cargarMonedas();
    
    // Reiniciar polling
    this.startPolling();
  }

  // ====================================
  // 💬 MOSTRAR DIÁLOGO DE FEEDBACK
  // ====================================
  private async mostrarDialogo(data: FeedbackDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '400px',
      disableClose: true,
      data: data
    });

    const resultado = await firstValueFrom(dialogRef.afterClosed());
    return resultado === true;
  }

  // ====================================
  // 🗑️ ELIMINAR MONEDA
  // ====================================
  async eliminar(moneda: MonedaDto): Promise<void> {
    console.log('🗑️ Intentando eliminar:', moneda);
    
    // 1️⃣ Confirmar con el usuario
    const confirmado = await this.mostrarDialogo({
      tipo: 'confirm',
      titulo: '⚠️ Confirmar Eliminación',
      mensaje: `¿Estás seguro de eliminar la moneda?\n\n${moneda.nombre} (${moneda.codigo})\n\nEsta acción no se puede deshacer.`
    });

    if (!confirmado) {
      console.log('❌ Eliminación cancelada');
      return;
    }

    try {
      // 2️⃣ Eliminar en el backend
      await firstValueFrom(this.monedaService.eliminar(moneda.idMoneda));

      // 3️⃣ Mostrar éxito
      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '🗑️ Moneda Eliminada',
        mensaje: `La moneda "${moneda.nombre}" fue eliminada correctamente`
      });

      // 4️⃣ Recargar lista
      this.cargarMonedas();

    } catch (error) {
      console.error('❌ Error al eliminar:', error);
      
      await this.mostrarDialogo({
        tipo: 'error',
        titulo: '❌ Error al Eliminar',
        mensaje: 'No se pudo eliminar la moneda. Intenta nuevamente'
      });
    }
  }
}
