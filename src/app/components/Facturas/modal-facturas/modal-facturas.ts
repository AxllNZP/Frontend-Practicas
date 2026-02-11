// modal-facturas.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, FacturaRequestDTO, DetalleFacturaDTO, PagoDTO } from '../../../services/factura.service';
import { ClienteDto } from '../../../services/cliente.service';
import { UsuarioDto } from '../../../services/usuario.service';
import { ProductoDto } from '../../../services/producto.service';
import { MonedaDto } from '../../../services/moneda.service';
import { AuthService } from '../../../services/auth.service';
import { RolUsuario } from '../../../models/auth.models';

@Component({
  selector: 'app-modal-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-facturas.html',
  styleUrls: ['./modal-facturas.css']
})
export class ModalFacturasComponent implements OnInit {

  @Input() clientes: ClienteDto[] = [];
  @Input() usuarios: UsuarioDto[] = [];
  @Input() productos: ProductoDto[] = [];
  @Input() monedas: MonedaDto[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() facturaCreada = new EventEmitter<void>();

  serie = 'F001';
  observaciones = '';
  idCliente = 0;
  idUsuario = 1;
  idMoneda = 1;

  detalles: DetalleFacturaDTO[] = [];
  pagos: PagoDTO[] = [];

  // 🔥 NUEVAS PROPIEDADES para control de roles
  esVendedor = false;
  mostrarSelectUsuario = true;
  mostrarSelectMoneda = true;

  constructor(
    private facturaService: FacturaService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('=== MODAL FACTURAS INICIADO ===');
    
    const currentUser = this.authService.getCurrentUser();
    console.log('🔑 Usuario actual:', currentUser);

    // 🔥 DETECTAR ROL
    this.esVendedor = currentUser?.rol === RolUsuario.VENDEDOR;
    console.log('📋 Es vendedor:', this.esVendedor);

    if (this.esVendedor) {
      // ==========================================
      // 👤 LÓGICA PARA VENDEDORES
      // ==========================================
      console.log('👤 Configurando modal para VENDEDOR');

      // Auto-asignar su propio usuario
      this.idUsuario = currentUser!.idUsuario!;
      this.mostrarSelectUsuario = false;
      console.log('✓ Usuario auto-asignado:', this.idUsuario);

      // Moneda predeterminada: Soles Peruanos (asumiendo que idMoneda=1 es PEN)
      // Puedes ajustar esto según tu base de datos
      this.idMoneda = 1; // 1 = Soles, ajusta según tu BD
      this.mostrarSelectMoneda = false;
      console.log('✓ Moneda predeterminada (PEN):', this.idMoneda);

    } else {
      // ==========================================
      // 👑 LÓGICA PARA ADMINISTRADORES
      // ==========================================
      console.log('👑 Configurando modal para ADMINISTRADOR');
      console.log('👥 Usuarios disponibles:', this.usuarios.length);
      console.log('💰 Monedas disponibles:', this.monedas.length);

      // Mostrar selects normalmente
      this.mostrarSelectUsuario = true;
      this.mostrarSelectMoneda = true;

      // Auto-seleccionar la primera moneda si hay
      if (this.monedas.length > 0) {
        this.idMoneda = this.monedas[0].idMoneda;
        console.log('✓ Moneda auto-seleccionada:', this.idMoneda);
      }
    }

    console.log('📦 Productos disponibles:', this.productos.length);
    console.log('👤 Clientes disponibles:', this.clientes.length);
  }

  cerrar() {
    this.limpiarFormulario();
    this.close.emit();
  }

  agregarDetalle() {
    this.detalles.push({ idProducto: 0, cantidad: 1 });
  }

  eliminarDetalle(index: number) {
    this.detalles.splice(index, 1);
  }

  agregarPago() {
    this.pagos.push({
      monto: 0,
      numeroOperacion: '',
      idFormaPago: 1,
      idMoneda: this.idMoneda,
      idUsuario: this.idUsuario
    });
  }

  eliminarPago(index: number) {
    this.pagos.splice(index, 1);
  }

  guardarFactura() {
    if (!this.validar()) {
      alert('Complete los campos obligatorios');
      return;
    }

    // 🔥 Sincronizar pagos con la factura
    const pagosSincronizados = this.pagos.map(p => ({
      ...p,
      idMoneda: this.idMoneda,
      idUsuario: this.idUsuario
    }));

    const payload: FacturaRequestDTO = {
      serie: this.serie,
      observaciones: this.observaciones,
      idCliente: this.idCliente,
      idUsuario: this.idUsuario,
      idMoneda: this.idMoneda,
      detalles: this.detalles,
      pagos: pagosSincronizados
    };

    console.log("📤 PAYLOAD A ENVIAR:", JSON.stringify(payload, null, 2));

    this.facturaService.crear(payload).subscribe({
      next: () => {
        alert('✅ Factura creada correctamente');
        this.facturaCreada.emit();
        this.cerrar();
      },
      error: err => {
        console.error('========== ERROR COMPLETO ==========');
        console.error(err);
        console.error('========== BODY ERROR ==========');
        console.error(err.error);
        console.error('========== STATUS ==========');
        console.error(err.status);
        alert('❌ Error: ' + (err.error?.message || err.message));
      }
    });
  }

  private validar(): boolean {
    if (
      this.serie.trim() === '' ||
      this.idCliente <= 0 ||
      this.detalles.length === 0
    ) {
      return false;
    }

    if (!this.detalles.every(d => d.idProducto > 0 && d.cantidad > 0)) {
      return false;
    }

    if (this.pagos.some(p => p.monto < 0)) {
      return false;
    }

    return true;
  }

  private limpiarFormulario() {
    this.serie = 'F001';
    this.observaciones = '';
    this.idCliente = 0;
    
    // Restaurar valores por defecto según el rol
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.rol === RolUsuario.VENDEDOR) {
      this.idUsuario = currentUser.idUsuario!;
      this.idMoneda = 1;
    } else {
      this.idUsuario = 1;
      this.idMoneda = 1;
    }
    
    this.detalles = [];
    this.pagos = [];
  }
}