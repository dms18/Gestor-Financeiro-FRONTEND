import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { CampoErroComponent } from './campo-erro/campo-erro.component';
import { ModalA11yDirective } from './modal-a11y.directive';
import { RotuloEnumPipe } from './rotulo-enum.pipe';
import { VersaoBadgeComponent } from './versao-badge/versao-badge.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [CampoErroComponent, ModalA11yDirective, RotuloEnumPipe, VersaoBadgeComponent],
  exports: [CampoErroComponent, ModalA11yDirective, RotuloEnumPipe, VersaoBadgeComponent],
})
export class SharedModule {}
