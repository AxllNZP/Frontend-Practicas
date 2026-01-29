// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ArchivosComponent } from './components/archivos/archivos.component';
import { ProductosComponent } from './components/productos/productos.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { FacturasComponent } from './components/Facturas/facturas.component';

export const routes: Routes = [
  { path: '', redirectTo: '/archivos', pathMatch: 'full' },
  { path: 'archivos', component: ArchivosComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'clientes', component: ClientesComponent },
  { path: 'facturas', component: FacturasComponent },
  { path: '**', redirectTo: '/archivos' }
];