import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';
import { TransacoesPageRoutingModule } from './transacoes-routing.module';
import { TransacoesPage } from './transacoes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    TransacoesPageRoutingModule
  ],
  declarations: [TransacoesPage]
})
export class TransacoesPageModule {}
