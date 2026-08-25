import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ContasPageRoutingModule } from './contas-routing.module';

import { ContasPage } from './contas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ContasPageRoutingModule
  ],
  declarations: [ContasPage]
})
export class ContasPageModule { }
