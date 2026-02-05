import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalFacturas } from './modal-facturas';

describe('ModalFacturas', () => {
  let component: ModalFacturas;
  let fixture: ComponentFixture<ModalFacturas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalFacturas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalFacturas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
