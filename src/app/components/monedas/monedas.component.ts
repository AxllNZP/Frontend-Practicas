import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-monedas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monedas.component.html',
  styleUrls: ['./monedas.component.css']
})
export class MonedasComponent implements OnInit, OnDestroy {

  monedas: MonedaDto[] = [];
  cargando = false;
  lastUpdated: Date | null = null;

  mostrarModal = false;
  modoEdicion = false;
  monedaSeleccionada: Partial<MonedaDto> = {};

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
      this.cdr.detectChanges(); // 🔥 ESTO ES LO QUE FALTABA
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
      if (!this.cargando) {
        this.cargarMonedas();
      }
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

  abrirCrear(): void {
    this.stopPolling();
    this.modoEdicion = false;
    this.monedaSeleccionada = {};
    this.mostrarModal = true;
  }

  abrirEditar(moneda: MonedaDto): void {
    this.stopPolling();
    this.modoEdicion = true;
    this.monedaSeleccionada = { ...moneda };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.monedaSeleccionada = {};
    this.startPolling();
  }

  guardar(): void {
    const m = this.monedaSeleccionada;
    if (!m.nombre || !m.codigo || !m.simbolo) {
      alert('Complete todos los campos');
      return;
    }

    if (this.modoEdicion && m.idMoneda) {
      this.monedaService.actualizar(m.idMoneda, m).subscribe(() => {
        alert('Moneda actualizada');
        this.finalizar();
      });
    } else {
      this.monedaService.crear(m).subscribe(() => {
        alert('Moneda creada');
        this.finalizar();
      });
    }
  }

  eliminar(moneda: MonedaDto): void {
    if (!confirm(`¿Eliminar ${moneda.nombre} (${moneda.codigo})?`)) return;

    this.monedaService.eliminar(moneda.idMoneda).subscribe(() => {
      alert('Moneda eliminada');
      this.cargarMonedas();
    });
  }

  private finalizar(): void {
    this.cerrarModal();
    this.cargarMonedas();
  }
}