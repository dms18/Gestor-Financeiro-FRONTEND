import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';
import { SazonalidadePageRoutingModule } from './sazonalidade-routing.module';
import { SazonalidadePage } from './sazonalidade.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    SazonalidadePageRoutingModule
  ],
  declarations: [SazonalidadePage]
})
export class SazonalidadePageModule {}
