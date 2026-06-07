import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransacoesPage } from './transacoes.page';

const routes: Routes = [
  {
    path: '',
    component: TransacoesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransacoesPageRoutingModule {}
