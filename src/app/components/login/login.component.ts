// ===================================
// COMPONENTE LOGIN (STANDALONE)
// Ubicación: src/app/components/login/login.component.ts
// ===================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * LoginComponent - Componente standalone para el formulario de login
 * 
 * IMPORTANTE: Los componentes standalone deben:
 * 1. Tener standalone: true
 * 2. Importar todos los módulos que usen (CommonModule, ReactiveFormsModule, etc.)
 * 3. No necesitan declararse en ningún módulo
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,           // Para *ngIf, *ngFor, pipes, etc.
    ReactiveFormsModule     // Para formularios reactivos
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si ya está logueado
    if (this.authService.isAuthenticated()) {
      console.log('Usuario ya autenticado, redirigiendo...');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      nombreUsuario: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      clave: ['', [
        Validators.required,
        Validators.minLength(4)
      ]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      console.log('Formulario inválido');
      return;
    }

    this.loading = true;

    const credentials = {
      nombreUsuario: this.f['nombreUsuario'].value,
      clave: this.f['clave'].value
    };

    console.log('Intentando login...', credentials.nombreUsuario);

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.loading = false;
        
        const redirectUrl = localStorage.getItem('redirectUrl') || '/dashboard';
        localStorage.removeItem('redirectUrl');
        
        this.router.navigate([redirectUrl]);
      },
      
      error: (error) => {
        console.error('Error en login:', error);
        this.loading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
        }
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}