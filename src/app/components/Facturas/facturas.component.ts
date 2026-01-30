// src/app/components/facturas/facturas.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, FacturaRequestDTO, FacturaResponseDTO, DetalleFacturaDTO, PagoDTO } from '../../services/factura.service';
import { ClienteService, ClienteDto } from '../../services/cliente.service';
import { Subscription, interval } from 'rxjs';
import { UsuarioService, UsuarioDto } from '../../services/usuario.service';
import { ProductoService, ProductoDto } from '../../services/producto.service';
import { MonedaService, MonedaDto } from '../../services/moneda.service';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css']
})
export class FacturasComponent implements OnInit, OnDestroy {
  facturas: FacturaResponseDTO[] = [];
  clientes: ClienteDto[] = [];
  lastUpdated: Date | null = null;
  cargando = false;
  usuarios: UsuarioDto[] = [];
  productos: ProductoDto[] = [];
  monedas: MonedaDto[] = [];

  // Para el modal de crear
  mostrarModal = false;
  
  // Datos de la factura
  serie: string = 'F001';
  observaciones: string = '';
  idCliente: number = 0;
  idUsuario: number = 1; // Usuario por defecto
  idMoneda: number = 1;
    // Moneda por defecto (PEN)

  // Listas dinámicas
  detalles: DetalleFacturaDTO[] = [];
  pagos: PagoDTO[] = [];

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private facturaService: FacturaService,
    private clienteService: ClienteService,
    private usuarioService: UsuarioService,
    private productoService: ProductoService,
    private monedaService: MonedaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('=== FACTURAS COMPONENT INICIADO ===');
    this.cargarFacturas();
    this.cargarClientes();
    this.cargarUsuarios();
    this.cargarProductos();
    this.cargarMonedas();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }


  private cargarMonedas(): void {
    this.monedaService.listar().subscribe({
      next: data => {
        this.monedas = data;
        console.log('✓ Monedas cargadas:', this.monedas);
        
        // Opcional: establecer la primera moneda como predeterminada si existe
        if (this.monedas.length > 0 && !this.idMoneda) {
          this.idMoneda = this.monedas[0].idMoneda;
        }
      },
      error: err => console.error('Error al cargar monedas:', err)
    });
  }

  private cargarProductos(): void {
  this.productoService.listar().subscribe({
    next: data => {
      this.productos = data.filter(
        p => p.estado === 'activo' && p.stock > 0
      );
    },
    error: err => console.error('Error al cargar productos', err)
  });
}

  private cargarUsuarios(): void {
  this.usuarioService.listar().subscribe({
    next: data => {
      this.usuarios = data.filter(u => u.estado === 'activo');
    },
    error: err => console.error('Error al cargar usuarios', err)
  });
}


  private cargarFacturas(): void {
    if (this.cargando) return;
    
    this.cargando = true;
    this.facturaService.listar().subscribe({
      next: data => {
        this.facturas = [...data];
        this.lastUpdated = new Date();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('✗ ERROR al cargar facturas:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: data => {
        this.clientes = data.filter(c => c.estado === 'activo');
      },
      error: err => console.error('Error al cargar clientes:', err)
    });
  }

  private startPolling(): void {
    this.stopPolling();
    console.log('--- Iniciando polling de facturas ---');
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      if (!this.cargando) {
        this.cargarFacturas();
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
      this.cargarFacturas();
      this.startPolling();
    }
  }

  // ===== MODAL =====
  abrirModalCrear(): void {
    this.stopPolling();
    this.limpiarFormulario();
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.limpiarFormulario();
    this.startPolling();
  }

  private limpiarFormulario(): void {
    this.serie = 'F001';
    this.observaciones = '';
    this.idCliente = 0;
    this.idUsuario = 1;
    this.idMoneda = 1;
    this.detalles = [];
    this.pagos = [];
  }

  // ===== DETALLES (PRODUCTOS) =====
  agregarDetalle(): void {
    this.detalles.push({
      idProducto: 0,
      cantidad: 1
    });
  }

  eliminarDetalle(index: number): void {
    this.detalles.splice(index, 1);
  }

  // ===== PAGOS =====
  agregarPago(): void {
    this.pagos.push({
      monto: 0,
      numeroOperacion: '',
      idFormaPago: 1,
      idMoneda: 1,
      idUsuario: 1
    });
  }

  eliminarPago(index: number): void {
    this.pagos.splice(index, 1);
  }

  // ===== GUARDAR FACTURA =====
  guardarFactura(): void {
    if (!this.validarFactura()) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const payload: FacturaRequestDTO = {
      serie: this.serie,
      observaciones: this.observaciones,
      idCliente: this.idCliente,
      idUsuario: this.idUsuario,
      idMoneda: this.idMoneda,
      detalles: this.detalles,
      pagos: this.pagos.length > 0 ? this.pagos : []
    };

    this.stopPolling();

    this.facturaService.crear(payload).subscribe({
      next: (response) => {
        alert(`✅ Factura ${response.serie}-${response.numero} creada correctamente\n\nTotal: ${response.simboloMoneda} ${response.total}`);
        this.cerrarModal();
        this.cargarFacturas();
        this.startPolling();
      },
      error: err => {
        console.error(err);
        alert('❌ Error al crear factura: ' + (err.error?.message || err.message));
        this.startPolling();
      }
    });
  }

  private validarFactura(): boolean {
    return !!(
      this.serie &&
      this.idCliente > 0 &&
      this.detalles.length > 0 &&
      this.detalles.every(d => d.idProducto > 0 && d.cantidad > 0)
    );
  }

  // ===== UTILIDADES =====
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSaldoClass(saldo: number): string {
    if (saldo === 0) return 'saldo-pagado';
    if (saldo > 0) return 'saldo-pendiente';
    return '';
  }
}