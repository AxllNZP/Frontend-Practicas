// src/app/app.ts
import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchivoService } from './services/archivo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { // 👈 CAMBIADO DE AppComponent A App
  title = 'Frontend de Archivos';
  archivoSeleccionado: File | null = null;

  constructor(private archivoService: ArchivoService) {}

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
    }
  }

  onUpload(): void {
    if (this.archivoSeleccionado) {
      this.archivoService.subir(this.archivoSeleccionado).subscribe({
        next: (res) => {
          alert('¡Archivo subido con éxito!');
        },
        error: (err) => {
          alert('Error al conectar con el servidor');
        }
      });
    }
  }
}