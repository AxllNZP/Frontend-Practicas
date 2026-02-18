import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

export interface FeedbackDialogData {
  tipo: 'success' | 'error' | 'confirm' | 'info';
  titulo: string;
  mensaje: string;
}

@Component({
  selector: 'app-feedback-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css']
})
export class FeedbackDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FeedbackDialogData,
    public dialogRef: MatDialogRef<FeedbackDialogComponent>
  ) {}

  cerrar(respuesta: boolean = false) {
    this.dialogRef.close(respuesta);
  }
}