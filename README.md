# 🧾 Programa Z — Sistema de Gestión de Facturación

Sistema web fullstack para la gestión integral de facturas, clientes, productos, usuarios y monedas. Desarrollado de forma independiente como proyecto personal, aplicando buenas prácticas de arquitectura y patrones modernos tanto en el frontend como en el backend.

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología | Versión |
|---|---|
| Angular | 21.1.1 |
| Angular Material | 21.1.4 |
| RxJS | 7.8.2 |
| TypeScript | 5.9.3 |
| Node.js | 22.14.0 |

### Backend

| Tecnología | Descripción |

| Spring Boot | API REST |
| Spring Security + JWT | Autenticación y autorización |
| PostgreSQL | Base de datos relacional |

---

## ✨ Funcionalidades

- **Autenticación JWT** con login y registro, decodificación manual del token en el cliente y expiración automática de sesión.
- **Autorización por roles**: las rutas y elementos visuales se controlan según el rol del usuario autenticado (`admin` / `vendedor`).
- **Gestión de Facturas**: creación con múltiples productos y pagos opcionales, cálculo automático de subtotal, IGV y saldo pendiente, y descarga individual en PDF y Excel.
- **Gestión de Clientes**: CRUD completo con validación de tipo de documento (DNI, RUC, CE, Pasaporte) y longitud dinámica de campos.
- **Gestión de Productos**: CRUD con control de stock, clasificación por estado y códigos de producto.
- **Gestión de Usuarios**: administración de accesos, roles y estados desde una interfaz dedicada.
- **Gestión de Monedas**: configuración de divisas con código ISO, nombre y símbolo.
- **Reportes exportables**: generación de reportes por cliente, usuario y producto en PDF y Excel con filtros por rango de fechas.
- **Actualización en tiempo real**: polling automático configurable por módulo, con pausa inteligente cuando la pestaña no está visible (`Page Visibility API`).

---

## 🏗️ Arquitectura y Decisiones Técnicas

### Componentes Standalone (Angular 21)

Todo el proyecto fue construido sin `NgModules`. Cada componente declara sus propias dependencias mediante el array `imports`, lo que resulta en bundles más pequeños y una estructura más clara y mantenible.

### Comunicación padre-hijo con @Input / @Output

Los modales están completamente desacoplados de sus componentes padres. El padre provee los datos mediante `@Input()` y el modal emite eventos mediante `@Output()` — nunca guarda ni llama al servicio directamente. Esto garantiza una única fuente de verdad y facilita la reutilización.

### Interceptor HTTP funcional

Se implementó un interceptor funcional (no basado en clase) que adjunta automáticamente el token JWT como header `Authorization` en todas las peticiones salientes, y maneja de forma centralizada los errores `401` y `403`.

### Guards funcionales

`authGuard` y `adminGuard` están implementados como funciones puras que utilizan `inject()`, siguiendo el estilo moderno de Angular y evitando la necesidad de clases `CanActivate`.

### Manejo asíncrono con firstValueFrom

Para operaciones de guardado y eliminación, se utiliza `firstValueFrom()` de RxJS en conjunto con `async/await`, permitiendo un flujo de control más legible con bloques `try/catch/finally` y sin anidamiento de callbacks.

### Polling con gestión del ciclo de vida

Cada componente de listado inicia un intervalo de actualización periódica al montarse y lo destruye correctamente en `ngOnDestroy`. Además, se suscribe al evento `visibilitychange` del documento para pausar el polling cuando el usuario cambia de pestaña y reanudarlo cuando regresa.

### Diálogos de feedback reutilizables

Se creó un componente `FeedbackDialogComponent` que centraliza todos los diálogos de éxito, error y confirmación de la aplicación, eliminando el uso de `alert()` y `confirm()` nativos del navegador.

### Detección de cambios controlada

En los componentes con operaciones asíncronas complejas se utilizan `cdr.detectChanges()` y `cdr.markForCheck()` de forma explícita para garantizar que la vista se actualice en el momento correcto, evitando estados visuales inconsistentes.

---

## 📁 Estructura del Proyecto (Frontend)

```

src/app/
├── components/
│   ├── dashboard/        # Layout principal con navbar y router-outlet
│   ├── login/            # Formulario reactivo con validaciones
│   ├── register/         # Registro con validador personalizado de contraseñas
│   ├── profile/          # Vista del usuario autenticado
│   ├── Facturas/         # Módulo de facturación + modal de creación
│   ├── clientes/         # CRUD de clientes + modal + reporte
│   ├── productos/        # CRUD de productos + modal + reporte
│   ├── usuarios/         # Gestión de usuarios + modal + reporte
│   ├── monedas/          # Gestión de divisas + modal
│   └── feedback-dialog/  # Diálogo reutilizable de feedback
├── guards/               # authGuard, adminGuard, vendedorGuard, roleGuard
├── interceptors/         # authInterceptor (JWT + manejo de errores)
├── models/               # Interfaces y enums de autenticación
└── services/             # Servicios HTTP para cada entidad
```

---

## 🔐 Sistema de Autenticación

El flujo de autenticación funciona de la siguiente manera:

1. El usuario envía sus credenciales al backend.
2. El backend devuelve un token JWT firmado.
3. El frontend decodifica manualmente el payload del token (sin librerías externas) para extraer `idUsuario`, `nombreCompleto`, `email` y `rol`.
4. El token se almacena en `localStorage` y se inyecta automáticamente en cada petición HTTP mediante el interceptor.
5. Antes de cada verificación de autenticación, se comprueba la fecha de expiración del token (`exp`). Si expiró, la sesión se cierra automáticamente.

---

## 🚀 Cómo ejecutar el proyecto

### Requisitos previos

- Node.js 22+
- Angular CLI 21+
- Java 17+ con Spring Boot configurado
- PostgreSQL corriendo localmente

### Frontend

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
ng serve

# La app estará disponible en http://localhost:4200
```

### Backend

El backend debe estar corriendo en `http://localhost:8080`. Configurar la conexión a PostgreSQL en el archivo `application.properties` del proyecto Spring Boot.

---

## 👤 Autor

**AxllNZP**  
Proyecto personal desarrollado íntegramente de forma independiente — diseño de arquitectura, implementación frontend, integración con API REST y manejo de autenticación incluidos.
