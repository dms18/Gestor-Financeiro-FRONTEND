import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';
import { InvestimentosPageRoutingModule } from './investimentos-routing.module';
import { InvestimentosPage } from './investimentos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    InvestimentosPageRoutingModule
  ],
  declarations: [InvestimentosPage]
})
export class InvestimentosPageModule {}
