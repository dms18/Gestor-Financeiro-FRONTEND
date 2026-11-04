import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';

import { EsqueciSenhaPageRoutingModule } from './esqueci-senha-routing.module';

import { EsqueciSenhaPage } from './esqueci-senha.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    EsqueciSenhaPageRoutingModule
  ],
  declarations: [EsqueciSenhaPage]
})
export class EsqueciSenhaPageModule { }
