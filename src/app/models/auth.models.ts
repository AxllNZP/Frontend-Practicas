// ===================================
// MODELOS DE AUTENTICACIÓN
// Ubicación: src/app/models/auth.models.ts
// ===================================

/**
 * RolUsuario - Enum que define los roles disponibles
 * Debe coincidir con: com.example.PROYECTO_PRUEBA.model.RolUsuario
 */
export enum RolUsuario {
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
  CONTADOR = 'contador'
}

/**
 * AuthRequest - DTO para enviar credenciales de login
 * Coincide con: com.example.PROYECTO_PRUEBA.dto.AuthRequest
 */
export interface AuthRequest {
  nombreUsuario: string;  // username del usuario
  clave: string;           // password sin encriptar
}

/**
 * AuthResponse - DTO que recibe el token JWT del backend
 * Coincide con: com.example.PROYECTO_PRUEBA.dto.AuthResponse
 */
export interface AuthResponse {
  token: string;  // Token JWT generado por el backend
}

/**
 * RegisterRequest - DTO para registrar un nuevo usuario
 * Coincide con: com.example.PROYECTO_PRUEBA.dto.RegisterRequest
 */
export interface RegisterRequest {
  nombreUsuario: string;   // username único
  clave: string;            // password sin encriptar
  nombreCompleto: string;   // nombre completo del usuario
  email: string;            // email del usuario
  rol: RolUsuario;          // rol asignado (admin o vendedor)
}

/**
 * Usuario - Modelo completo del usuario (para uso interno del frontend)
 * Refleja: com.example.PROYECTO_PRUEBA.model.Usuario
 */
export interface Usuario {
  idUsuario?: number;
  nombreUsuario: string;
  nombreCompleto: string;
  email: string;
  rol: RolUsuario;
  fechaRegistro?: string;
}