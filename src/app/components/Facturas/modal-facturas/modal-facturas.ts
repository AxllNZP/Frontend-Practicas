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
  @Input() guardando = false;

  @Output() close = new EventEmitter<void>();
  @Output() facturaCreada = new EventEmitter<FacturaRequestDTO>();

  serie = 'F001';
  observaciones = '';
  idCliente = 0;
  idUsuario = 1;
  idMoneda = 1;

  detalles: DetalleFacturaDTO[] = [];
  pagos: PagoDTO[] = [];

  esVendedor: boolean = false;

  constructor(
    public authService: AuthService
  ) {}

  ngOnInit(): void {
  console.log('=== MODAL FACTURAS INICIADO ===');

  const currentUser = this.authService.getCurrentUser();
  console.log('🔑 Usuario actual:', currentUser);

  this.esVendedor = currentUser?.rol === 'vendedor';

  // ✅ Si es vendedor → autoasignar su usuario
  if (this.esVendedor && currentUser && currentUser.idUsuario) {
    this.idUsuario = currentUser.idUsuario;
    console.log('✅ Usuario vendedor asignado automáticamente:', this.idUsuario);
  }
  // ✅ Si NO es vendedor → seleccionar el primero por defecto
  else if (this.usuarios.length > 0) {
    this.idUsuario = this.usuarios[0].idUsuario;
  }

  // Moneda por defecto (para todos)
  if (this.monedas.length > 0) {
    this.idMoneda = this.monedas[0].idMoneda;
  }

  console.log('👥 Usuarios disponibles:', this.usuarios.length);
  console.log('💰 Monedas disponibles:', this.monedas.length);
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
    alert('⚠️ Complete los campos obligatorios:\n\n- Serie\n- Cliente\n- Al menos un producto con cantidad válida');
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

  // 🆕 Emitimos el payload al padre para que él maneje el guardado
  this.facturaCreada.emit(payload);
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

  if (this.usuarios.length > 0) {
    this.idUsuario = this.usuarios[0].idUsuario;
  }

  if (this.monedas.length > 0) {
    this.idMoneda = this.monedas[0].idMoneda;
  }

  this.detalles = [];
  this.pagos = [];
}




}