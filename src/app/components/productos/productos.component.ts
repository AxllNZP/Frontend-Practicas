// src/app/components/productos/productos.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService, ProductoDto, EstadoGeneral } from '../../services/producto.service';
import { Subscription, interval, firstValueFrom } from 'rxjs';
import { ProductoModalComponent } from './modal-productos/modal-productos';
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent, FeedbackDialogData } from '../feedback-dialog/feedback-dialog.component';
import { ModalReporteProductosComponent } from './modal-reporte-productos/modal-reporte-productos.component';
import { environment } from '../../environments/environment';



@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule,ProductoModalComponent,ModalReporteProductosComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit, OnDestroy {

  productos: ProductoDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;
  guardando = false;

  mostrarModal = false;
  modoEdicion = false;
  productoSeleccionado: Partial<ProductoDto> = {};
  mostrarModalReporte = false;


  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
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
        this.cdr.markForCheck();
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
    this.modoEdicion = true;
    this.productoSeleccionado = { ...p };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.productoSeleccionado = {};
    this.startPolling();
  }

  async guardarProducto(producto: Partial<ProductoDto>): Promise<void> {
  // Evitar múltiples guardados simultáneos
  if (this.guardando) return;
  
  this.productoSeleccionado = { ...this.productoSeleccionado, ...producto };
  
  // ❌ Validación con diálogo de error
  if (!this.productoSeleccionado.codigo || !this.productoSeleccionado.nombre) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Campos Incompletos',
      mensaje: 'El código y el nombre son obligatorios para continuar'
    });
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

  // 🔒 Activamos el estado de guardando
  this.guardando = true;
  this.cdr.detectChanges(); // 🆕 Forzamos la detección inmediata

  try {
    if (this.modoEdicion && this.productoSeleccionado.idProducto) {
      // EDICIÓN
      await firstValueFrom(
        this.productoService.actualizar(this.productoSeleccionado.idProducto, payload)
      );
      
      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Producto Actualizado',
        mensaje: `El producto "${payload.nombre}" se actualizó correctamente (refresque la lista para verlo)`
      });
      this.cargarProductos(); // Refrescamos la lista después de editar
      
    } else {
      // CREACIÓN
      await firstValueFrom(this.productoService.crear(payload));
      
      await this.mostrarDialogo({
        tipo: 'success',
        titulo: '✅ Producto Creado',
        mensaje: `El producto "${payload.nombre}" se creó exitosamente (refresque la lista para verlo)`
      });
      this.cargarProductos(); // Refrescamos la lista después de crear
    }
    
    this.finalizarOperacion();
    
  } catch (error) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Guardar',
      mensaje: 'Ocurrió un error al guardar el producto. Por favor, intenta nuevamente.'
    });
  } finally {
    // 🔓 Desactivamos el estado de guardando
    this.guardando = false;
    this.cdr.detectChanges(); // 🆕 Forzamos la detección de nuevo
  }
}

  private finalizarOperacion(): void {
    this.cerrarModal();
    this.cargarProductos();
  }


  private async mostrarDialogo(data: FeedbackDialogData): Promise<boolean> {
  const dialogRef = this.dialog.open(FeedbackDialogComponent, {
    width: '400px',
    disableClose: true,
    data: data
  });

  const resultado = await firstValueFrom(dialogRef.afterClosed());
  return resultado === true;
}

  async confirmarEliminar(p: ProductoDto): Promise<void> {
  const confirmado = await this.mostrarDialogo({
    tipo: 'confirm',
    titulo: '⚠️ Confirmar Eliminación',
    mensaje: `¿Estás seguro de eliminar el producto?\n\n${p.nombre} - S/ ${p.precio}\n\nEsta acción no se puede deshacer.`
  });

  if (!confirmado) return;

  try {
    await firstValueFrom(this.productoService.eliminar(p.idProducto));
    
    await this.mostrarDialogo({
      tipo: 'success',
      titulo: '🗑️ Producto Eliminado',
      mensaje: `El producto "${p.nombre}" fue eliminado correctamente`
    });
    
    this.cargarProductos();
  } catch (error) {
    await this.mostrarDialogo({
      tipo: 'error',
      titulo: '❌ Error al Eliminar',
      mensaje: 'No se pudo eliminar el producto. Intenta nuevamente'
    });
  }
}

  getEstadoClass(e: EstadoGeneral): string {
    return e === 'activo' ? 'estado-activo' : 'estado-inactivo';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-agotado';
    if (stock < 10) return 'stock-bajo';
    return 'stock-normal';
  }

  generarPdfReporte(data: {inicio: string, fin: string, idProducto?: string}) {

  let url = `${environment.apiUrl}/api/reportes/productos/pdf?fechaInicio=${data.inicio}&fechaFin=${data.fin}`;

  if (data.idProducto) {
    url += `&idProducto=${data.idProducto}`;
  }

  window.open(url, '_blank');
  this.cerrarModalReporte();
}

  generarExcelReporte(data: {inicio: string, fin: string, idProducto?: string}) {

  let url = `${environment.apiUrl}/api/reportes/productos/excel?fechaInicio=${data.inicio}&fechaFin=${data.fin}`;

  if (data.idProducto) {
    url += `&idProducto=${data.idProducto}`;
  }

  window.open(url, '_blank');
  this.cerrarModalReporte();
}



  formatearFecha(f: string): string {
    return new Date(f).toLocaleString('es-PE');
  }
  abrirModalReporte(): void {
  this.mostrarModalReporte = true;
}

cerrarModalReporte(): void {
  this.mostrarModalReporte = false;
}

}