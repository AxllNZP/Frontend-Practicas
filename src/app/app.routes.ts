import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

import { ClientesComponent } from './components/clientes/clientes.component';
import { ProductosComponent } from './components/productos/productos.component';
import { FacturasComponent } from './components/Facturas/facturas.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { MonedasComponent } from './components/monedas/monedas.component';
import { ProfileComponent } from './components/profile/profile.component';


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


      
      {
        path: 'profile',
        component: ProfileComponent
      },
      
      { 
        path: '', 
        redirectTo: 'facturas', 
        pathMatch: 'full' 
      },

      // ✅ FACTURAS: Todos los usuarios autenticados
      { 
        path: 'facturas', 
        component: FacturasComponent,
        canActivate: [authGuard]
      },

      // ✅ CLIENTES: Todos los usuarios autenticados
      { 
        path: 'clientes', 
        component: ClientesComponent,
        canActivate: [authGuard]
      },

      // ✅ PRODUCTOS: Todos los usuarios autenticados
      { 
        path: 'productos', 
        component: ProductosComponent,
        canActivate: [authGuard]
      },
      
      {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [authGuard]
      },

      {
        path: 'monedas',
        component: MonedasComponent,
        canActivate: [authGuard]
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