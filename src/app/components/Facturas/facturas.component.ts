// src/app/components/facturas/facturas.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService, FacturaResponseDTO } from '../../services/factura.service';
import { ClienteService, ClienteDto } from '../../services/cliente.service';
import { Subscription, interval } from 'rxjs';
import { UsuarioService, UsuarioDto } from '../../services/usuario.service';
import { ProductoService, ProductoDto } from '../../services/producto.service';
import { MonedaService, MonedaDto } from '../../services/moneda.service';
import { AuthService } from '../../services/auth.service';
import { RolUsuario } from '../../models/auth.models';
import { ModalFacturasComponent } from './modal-facturas/modal-facturas';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalFacturasComponent],
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

  // 🔥 Bandera para controlar cuando están listos los datos
  datosEsencialesCargados = false;

  // Para el modal de crear
  mostrarModal = false;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private facturaService: FacturaService,
    private clienteService: ClienteService,
    private usuarioService: UsuarioService,
    private productoService: ProductoService,
    private monedaService: MonedaService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('=== FACTURAS COMPONENT INICIADO ===');
    this.cargarFacturas();
    this.cargarClientes();
    
    // 🔥 Verificar si es vendedor antes de cargar datos
    const currentUser = this.authService.getCurrentUser();
    const esVendedor = currentUser?.rol === RolUsuario.VENDEDOR;
    
    if (esVendedor) {
      console.log('👤 Usuario es VENDEDOR - Cargando solo productos');
      this.cargarDatosParaVendedor();
    } else {
      console.log('👑 Usuario es ADMIN - Cargando todos los datos');
      this.cargarDatosEsenciales();
    }
    
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // ==========================================
  // 🔥 CARGA DE DATOS PARA VENDEDORES
  // ==========================================
  private cargarDatosParaVendedor(): void {
    console.log('🔄 Cargando solo productos para vendedor...');
    
    // Solo cargar productos (los vendedores SÍ pueden ver productos)
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = data.filter(p => p.estado === 'activo' && p.stock > 0);
        console.log('✓ Productos cargados:', this.productos.length);
        
        // Marcar como cargado (usuarios y monedas se manejan en el modal)
        this.datosEsencialesCargados = true;
        console.log('✅ Datos para vendedor listos');
      },
      error: err => {
        console.error('❌ Error al cargar productos:', err);
        // Permitir continuar aunque falle
        this.datosEsencialesCargados = true;
      }
    });
  }

  // ==========================================
  // 🔥 CARGA DE DATOS PARA ADMINISTRADORES
  // ==========================================
  private cargarDatosEsenciales(): void {
    let cargados = 0;
    const totalNecesarios = 3; // usuarios, productos, monedas

    const verificarCarga = () => {
      cargados++;
      console.log(`📊 Progreso: ${cargados}/${totalNecesarios}`);
      
      if (cargados === totalNecesarios) {
        this.datosEsencialesCargados = true;
        console.log('✅ Todos los datos esenciales cargados');
        console.log(`   - Usuarios: ${this.usuarios.length}`);
        console.log(`   - Productos: ${this.productos.length}`);
        console.log(`   - Monedas: ${this.monedas.length}`);
      }
    };

    // Cargar usuarios
    this.usuarioService.listar().subscribe({
      next: data => {
        this.usuarios = data.filter(u => u.estado === 'activo');
        console.log('✓ Usuarios cargados:', this.usuarios.length);
        verificarCarga();
      },
      error: err => {
        console.error('❌ Error al cargar usuarios:', err);
        verificarCarga(); // Continuar aunque falle
      }
    });

    // Cargar productos
    this.productoService.listar().subscribe({
      next: data => {
        this.productos = data.filter(p => p.estado === 'activo' && p.stock > 0);
        console.log('✓ Productos cargados:', this.productos.length);
        verificarCarga();
      },
      error: err => {
        console.error('❌ Error al cargar productos:', err);
        verificarCarga();
      }
    });

    // Cargar monedas
    this.monedaService.listar().subscribe({
      next: data => {
        this.monedas = data;
        console.log('✓ Monedas cargadas:', this.monedas.length);
        verificarCarga();
      },
      error: err => {
        console.error('❌ Error al cargar monedas:', err);
        verificarCarga();
      }
    });
  }

  // ==========================================
  // CARGAR FACTURAS Y CLIENTES
  // ==========================================
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
        console.log('✓ Clientes cargados:', this.clientes.length);
      },
      error: err => console.error('❌ Error al cargar clientes:', err)
    });
  }

  // ==========================================
  // POLLING
  // ==========================================
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

  // ==========================================
  // 🔥 MODAL - CON VALIDACIÓN DE DATOS CARGADOS
  // ==========================================
  abrirModalCrear(): void {
    // Validar que los datos necesarios estén cargados
    if (!this.datosEsencialesCargados) {
      alert('⏳ Cargando datos necesarios, espere un momento...');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const esVendedor = currentUser?.rol === RolUsuario.VENDEDOR;

    // Para vendedores, validar al menos productos
    if (esVendedor && this.productos.length === 0) {
      alert('⚠️ No hay productos disponibles para crear facturas.');
      return;
    }

    // Para admins, validar todos los datos
    if (!esVendedor && (this.usuarios.length === 0 || this.monedas.length === 0)) {
      alert('⚠️ No se pudieron cargar los datos necesarios. Intente recargar la página.');
      return;
    }

    console.log('🚀 Abriendo modal con datos:', {
      rol: currentUser?.rol,
      usuarios: this.usuarios.length,
      productos: this.productos.length,
      monedas: this.monedas.length,
      clientes: this.clientes.length
    });

    this.stopPolling();
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.startPolling();
  }

  onFacturaCreada(): void {
    this.cargarFacturas();
  }

  // ==========================================
  // UTILIDADES
  // ==========================================
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