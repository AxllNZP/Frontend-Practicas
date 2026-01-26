// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchivoService, ArchivoDto } from './services/archivo.service';
import { finalize } from 'rxjs/operators';
import { Subscription, interval, of } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class App implements OnInit, OnDestroy {
  archivoSeleccionado: File | null = null;
  archivos: any[] = [];
  uploading = false;
  lastUpdated: Date | null = null;

  private pollingSub?: Subscription;
  private readonly POLL_MS = 5000; // cada 5 segundos

  constructor(private archivoService: ArchivoService) {}

  ngOnInit(): void {
    this.startPolling();
    this.cargarLista();
    // manejar visibilidad de la pestaña para pausar/reanudar
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /********** Polling automático **********/
  private startPolling(): void {
    if (this.pollingSub && !this.pollingSub.closed) return; // ya corre
    this.pollingSub = interval(this.POLL_MS).pipe(
      startWith(0), // ejecuta inmediatamente al subscribirse
      switchMap(() =>
        this.archivoService.listar().pipe(
          catchError(err => {
            console.error('Error listando archivos (polling):', err);
            // no romper el stream; devolvemos lista vacía temporalmente
            return of<ArchivoDto[]>([]);
          })
        )
      )
    ).subscribe({
      next: data => {
        this.archivos = data;
        this.lastUpdated = new Date();
      },
      error: err => {
        // no debería llegar aquí porque catchError maneja errores internamente
        console.error('Error en polling:', err);
      }
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
      .pipe(finalize(() => { this.uploading = false; this.archivoSeleccionado = null; }))
      .subscribe({
        next: res => {
          alert('Archivo subido correctamente');
          // actualizar inmediatamente (además del polling)
          this.cargarLista();
        },
        error: err => {
          console.error(err);
          alert('Error al subir archivo. Revisa el backend/CORS.');
        }
      });
  }

  cargarLista(): void {
    // llamada manual (usa el service directamente)
    this.archivoService.listar().subscribe({
      next: (data) => {
        this.archivos = data;
        this.lastUpdated = new Date();
      },
      error: err => {
        console.error(err);
        alert('Error al obtener lista de archivos');
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
        // actualizar inmediatamente
        this.cargarLista();
      },
      error: err => {
        console.error(err);
        alert('Error al eliminar archivo');
      }
    });
  }
}