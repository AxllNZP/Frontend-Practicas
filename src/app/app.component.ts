import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `<router-outlet *ngIf="!cargando"></router-outlet>`,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Sistema de Gestión';
  cargando = true;

  ngOnInit(): void {
    console.log('✅ AppComponent inicializado');
    
    // Simular carga
    setTimeout(() => {
      this.cargando = false;
      console.log('✅ Router-outlet activado');
    }, 100);
  }
}