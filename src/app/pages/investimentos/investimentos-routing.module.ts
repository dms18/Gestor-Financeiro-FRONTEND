import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvestimentosPage } from './investimentos.page';

const routes: Routes = [
  {
    path: '',
    component: InvestimentosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvestimentosPageRoutingModule {}
