// src/app/app.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchivoService, ArchivoDto } from './services/archivo.service';
import { finalize } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  archivoSeleccionado: File | null = null;
  archivos: ArchivoDto[] = [];
  uploading = false;
  lastUpdated: Date | null = null;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000;

  constructor(
    private archivoService: ArchivoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('=== NGONINIT EJECUTADO ===');
    this.cargarArchivos();
    this.startPolling();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private cargarArchivos(): void {
    console.log('=== INICIANDO CARGA DE ARCHIVOS ===');
    
    this.archivoService.listar().subscribe({
      next: data => {
        console.log('✓ DATA RECIBIDA:', data);
        console.log('✓ Cantidad de archivos:', data.length);
        this.archivos = [...data]; // Crear nueva referencia del array
        this.lastUpdated = new Date();
        this.cdr.detectChanges(); // FORZAR detección de cambios
        console.log('✓ Vista actualizada');
      },
      error: err => {
        console.error('✗ ERROR HTTP:', err);
        this.archivos = [];
        this.cdr.detectChanges();
      }
    });
  }

  /********** Polling automático **********/
  private startPolling(): void {
    this.pollingSub = interval(this.POLL_MS).subscribe(() => {
      this.cargarArchivos();
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
      this.cargarArchivos();
      this.startPolling();
    }
  }
  /******************************************/

  onFileSelected(event: any): void {
    const file = event.target.files?.[0] ?? null;
    if (file) this.archivoSeleccionado = file;
  }

  onUpload(): void {
    if (!this.archivoSeleccionado) return;
    this.uploading = true;

    this.archivoService.subir(this.archivoSeleccionado)
      .pipe(finalize(() => { 
        this.uploading = false; 
        this.archivoSeleccionado = null; 
      }))
      .subscribe({
        next: res => {
          alert('Archivo subido correctamente');
          this.cargarArchivos();
        },
        error: err => {
          console.error(err);
          alert('Error al subir archivo. Revisa el backend/CORS.');
        }
      });
  }

  download(a: ArchivoDto): void {
    this.archivoService.descargar(a.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = a.nombre ?? `archivo_${a.id}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
      error: err => {
        console.error(err);
        alert('Error al descargar');
      }
    });
  }

  confirmDelete(a: ArchivoDto): void {
    const ok = confirm(`¿Eliminar "${a.nombre}" (id=${a.id})?`);
    if (!ok) return;
    
    this.archivoService.eliminar(a.id).subscribe({
      next: () => {
        alert('Archivo eliminado');
        this.cargarArchivos();
      },
      error: err => {
        console.error(err);
        alert('Error al eliminar archivo');
      }
    });
  }
}