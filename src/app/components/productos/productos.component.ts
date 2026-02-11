// src/app/components/productos/productos.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService, ProductoDto, EstadoGeneral } from '../../services/producto.service';
import { Subscription, interval } from 'rxjs';
import { ProductoModalComponent } from './modal-productos/modal-productos';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule,ProductoModalComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit, OnDestroy {

  productos: ProductoDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;

  mostrarModal = false;
  modoEdicion = false;
  productoSeleccionado: Partial<ProductoDto> = {};

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private cargarProductos(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = [...data];
        this.lastUpdated = new Date();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('ERROR productos', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      if (!this.cargando) this.cargarProductos();
    });
  }

  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }

  private handleVisibilityChange = () => {
    document.hidden ? this.stopPolling() : (this.cargarProductos(), this.startPolling());
  };

  abrirModalCrear(): void {
    this.stopPolling();
    this.modoEdicion = false;
    this.productoSeleccionado = {
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      estado: 'activo'
    };
    this.mostrarModal = true;
  }

  abrirModalEditar(p: ProductoDto): void {
    this.stopPolling();
    this.modoEdicion = true;
    this.productoSeleccionado = { ...p };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.productoSeleccionado = {};
    this.startPolling();
  }

  guardarProducto(producto: Partial<ProductoDto>): void {
    this.productoSeleccionado = { ...this.productoSeleccionado, ...producto };
    if (!this.productoSeleccionado.codigo || !this.productoSeleccionado.nombre) {
      alert('Código y nombre son obligatorios');
      return;
    }

    const payload = {
      codigo: this.productoSeleccionado.codigo,
      nombre: this.productoSeleccionado.nombre,
      descripcion: this.productoSeleccionado.descripcion,
      precio: this.productoSeleccionado.precio,
      stock: this.productoSeleccionado.stock,
      estado: this.productoSeleccionado.estado as EstadoGeneral
    };

    if (this.modoEdicion && this.productoSeleccionado.idProducto) {
      this.productoService.actualizar(this.productoSeleccionado.idProducto, payload)
        .subscribe(() => this.finalizarOperacion());
    } else {
      this.productoService.crear(payload)
        .subscribe(() => this.finalizarOperacion());
    }
  }

  private finalizarOperacion(): void {
    this.cerrarModal();
    this.cargarProductos();
  }

  confirmarEliminar(p: ProductoDto): void {
    if (!confirm(`¿Eliminar producto?\n\n${p.nombre} - S/ ${p.precio}`)) return;
    this.productoService.eliminar(p.idProducto).subscribe(() => this.cargarProductos());
  }

  getEstadoClass(e: EstadoGeneral): string {
    return e === 'activo' ? 'estado-activo' : 'estado-inactivo';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-agotado';
    if (stock < 10) return 'stock-bajo';
    return 'stock-normal';
  }

  formatearFecha(f: string): string {
    return new Date(f).toLocaleString('es-PE');
  }
}