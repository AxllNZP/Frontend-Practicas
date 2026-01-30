// ===================================
// COMPONENTE REGISTER (STANDALONE)
// Ubicación: src/app/components/register/register.component.ts
// ===================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RolUsuario } from '../../models/auth.models';

/**
 * RegisterComponent - Componente standalone para registro de usuarios
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  roles = [
    { value: RolUsuario.VENDEDOR, label: 'Vendedor' },
    { value: RolUsuario.ADMIN, label: 'Administrador' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.initForm();
  }

  private initForm(): void {
    this.registerForm = this.formBuilder.group({
      nombreUsuario: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      
      nombreCompleto: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      
      clave: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50)
      ]],
      
      confirmarClave: ['', [
        Validators.required
      ]],
      
      rol: [RolUsuario.VENDEDOR, [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(formGroup: FormGroup): any {
    const password = formGroup.get('clave')?.value;
    const confirmPassword = formGroup.get('confirmarClave')?.value;
    
    if (password !== confirmPassword) {
      formGroup.get('confirmarClave')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      console.log('Formulario inválido', this.registerForm.errors);
      return;
    }

    this.loading = true;

    const registerData = {
      nombreUsuario: this.f['nombreUsuario'].value,
      clave: this.f['clave'].value,
      nombreCompleto: this.f['nombreCompleto'].value,
      email: this.f['email'].value,
      rol: this.f['rol'].value
    };

    console.log('Registrando usuario:', registerData.nombreUsuario);

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.loading = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo...';
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      
      error: (error) => {
        console.error('Error en registro:', error);
        this.loading = false;
        
        if (error.status === 409) {
          this.errorMessage = 'El nombre de usuario ya existe';
        } else if (error.status === 400) {
          this.errorMessage = 'Datos inválidos. Verifica todos los campos.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor';
        } else {
          this.errorMessage = 'Error al registrar usuario. Intenta nuevamente.';
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}