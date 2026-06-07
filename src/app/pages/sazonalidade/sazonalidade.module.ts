import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SazonalidadePageRoutingModule } from './sazonalidade-routing.module';
import { SazonalidadePage } from './sazonalidade.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SazonalidadePageRoutingModule
  ],
  declarations: [SazonalidadePage]
})
export class SazonalidadePageModule {}
