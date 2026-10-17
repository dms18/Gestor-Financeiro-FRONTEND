import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../shared/shared.module';

import { CategoriasPage } from './categorias.page';

const routes: Routes = [{ path: '', component: CategoriasPage }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [CategoriasPage]
})
export class CategoriasPageModule { }
