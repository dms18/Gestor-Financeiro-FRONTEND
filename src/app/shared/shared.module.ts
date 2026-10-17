import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { CampoErroComponent } from './campo-erro/campo-erro.component';
import { ModalA11yDirective } from './modal-a11y.directive';
import { RotuloEnumPipe } from './rotulo-enum.pipe';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [CampoErroComponent, ModalA11yDirective, RotuloEnumPipe],
  exports: [CampoErroComponent, ModalA11yDirective, RotuloEnumPipe],
})
export class SharedModule {}
