import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/dashboard/dashboard.module').then(m => m.DashboardPageModule)
          }
        ]
      },
      {
        path: 'transacoes',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/transacoes/transacoes.module').then(m => m.TransacoesPageModule)
          }
        ]
      },
      {
        path: 'sazonalidade',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/sazonalidade/sazonalidade.module').then(m => m.SazonalidadePageModule)
          }
        ]
      },
      {
        path: 'investimentos',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/investimentos/investimentos.module').then(m => m.InvestimentosPageModule)
          }
        ]
      },
      {
        path: 'perfil',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../pages/perfil/perfil.module').then(m => m.PerfilPageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
