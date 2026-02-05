import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { Subscription, interval } from 'rxjs';

// 🔥 Modal separado
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

  mostrarModal = false;
  modoEdicion = false;
  monedaParaEditar?: MonedaDto;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private monedaService: MonedaService,
    private cdr: ChangeDetectorRef
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

  onModalGuardar(payload: {
    idMoneda?: number;
    nombre: string;
    simbolo: string;
    codigo: string;
  }): void {

    this.stopPolling();

    if (this.modoEdicion && payload.idMoneda) {
      this.monedaService.actualizar(payload.idMoneda, payload).subscribe({
        next: () => {
          alert('✅ Moneda actualizada');
          this.finalizarOperacion();
        },
        error: err => {
          alert('❌ Error al actualizar moneda');
          console.error(err);
          this.startPolling();
        }
      });
    } else {
      this.monedaService.crear(payload).subscribe({
        next: () => {
          alert('✅ Moneda creada');
          this.finalizarOperacion();
        },
        error: err => {
          alert('❌ Error al crear moneda');
          console.error(err);
          this.startPolling();
        }
      });
    }
  }

  private finalizarOperacion(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.monedaParaEditar = undefined;
    this.cargarMonedas();
    this.startPolling();
  }

  eliminar(moneda: MonedaDto): void {
    if (!confirm(`¿Eliminar ${moneda.nombre} (${moneda.codigo})?`)) return;

    this.monedaService.eliminar(moneda.idMoneda).subscribe({
      next: () => {
        alert('🗑️ Moneda eliminada');
        this.cargarMonedas();
      },
      error: err => {
        alert('❌ Error al eliminar');
        console.error(err);
      }
    });
  }
}
