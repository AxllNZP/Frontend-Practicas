// ===================================
// CONFIGURACIÓN DE RUTAS
// Ubicación: src/app/app.routes.ts
// ===================================

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

import { ClientesComponent } from './components/clientes/clientes.component';
import { ProductosComponent } from './components/productos/productos.component';
import { FacturasComponent } from './components/Facturas/facturas.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { MonedasComponent } from './components/monedas/monedas.component';

export const routes: Routes = [

  // 🔓 LOGIN
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component')
        .then(m => m.LoginComponent)
  },

  // 🔓 REGISTER
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component')
        .then(m => m.RegisterComponent)
  },

  // 🔐 DASHBOARD (LAYOUT CON RUTAS HIJAS)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      // Redirigir a facturas cuando entren a /dashboard
      { 
        path: '', 
        redirectTo: 'facturas', 
        pathMatch: 'full' 
      },
      // Rutas hijas que se mostrarán dentro del dashboard
      { 
        path: 'facturas', 
        component: FacturasComponent 
      },
      { 
        path: 'clientes', 
        component: ClientesComponent 
      },
      { 
        path: 'productos', 
        component: ProductosComponent 
      },
      { 
        path: 'usuarios', 
        component: UsuariosComponent 
      },
      { 
        path: 'monedas', 
        component: MonedasComponent 
      }
    ]
  },

  // 🔁 REDIRECCIONES
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];

/**
 * CÓMO FUNCIONAN LAS RUTAS:
 * 
 * 1. / → Redirige a /login
 * 2. /login → Muestra LoginComponent
 * 3. /register → Muestra RegisterComponent
 * 4. /dashboard → Redirige a /dashboard/facturas
 * 5. /dashboard/facturas → Muestra DashboardComponent con FacturasComponent dentro
 * 6. /dashboard/clientes → Muestra DashboardComponent con ClientesComponent dentro
 * 7. etc...
 * 
 * El DashboardComponent actúa como LAYOUT y usa <router-outlet>
 * para mostrar los componentes hijos (facturas, clientes, etc.)
 */