// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ArchivosComponent } from './components/archivos/archivos.component';
import { ProductosComponent } from './components/productos/productos.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { ClientesComponent } from './components/clientes/clientes.component'; // ← NUEVO

export const routes: Routes = [
  { path: '', redirectTo: '/archivos', pathMatch: 'full' },
  { path: 'archivos', component: ArchivosComponent },
  { path: 'productos', component: ProductosComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'clientes', component: ClientesComponent }, // ← NUEVO
  { path: '**', redirectTo: '/archivos' }
];